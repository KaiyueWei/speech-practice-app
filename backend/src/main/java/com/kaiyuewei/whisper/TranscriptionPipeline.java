package com.kaiyuewei.whisper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaiyuewei.analysis.AnalysisResult;
import com.kaiyuewei.analysis.AnalysisService;
import com.kaiyuewei.s3.S3Buckets;
import com.kaiyuewei.s3.S3Service;
import com.kaiyuewei.session.Session;
import com.kaiyuewei.session.SessionRecordedEvent;
import com.kaiyuewei.session.SessionRepository;
import com.kaiyuewei.session.SessionStatus;
import com.kaiyuewei.session.Transcript;
import com.kaiyuewei.session.TranscriptRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TranscriptionPipeline {

    public static final String TRANSCRIPT_READY_TOPIC = "transcript.ready";

    private final SessionRepository sessionRepository;
    private final TranscriptRepository transcriptRepository;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;
    private final WhisperService whisperService;
    private final AnalysisService analysisService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public TranscriptionPipeline(SessionRepository sessionRepository,
                                 TranscriptRepository transcriptRepository,
                                 S3Service s3Service,
                                 S3Buckets s3Buckets,
                                 WhisperService whisperService,
                                 AnalysisService analysisService,
                                 KafkaTemplate<String, Object> kafkaTemplate,
                                 ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.transcriptRepository = transcriptRepository;
        this.s3Service = s3Service;
        this.s3Buckets = s3Buckets;
        this.whisperService = whisperService;
        this.analysisService = analysisService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void process(SessionRecordedEvent event) {
        Session session = sessionRepository.findById(event.sessionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Session not found: " + event.sessionId()));

        byte[] audio = s3Service.getObject(s3Buckets.getSessions(), event.audioS3Key());
        String text = whisperService.transcribe(audio);
        int durationSec = session.getDurationSeconds() != null
                ? session.getDurationSeconds() : 1;
        AnalysisResult analysis = analysisService.analyze(text, durationSec);

        Transcript transcript = new Transcript();
        transcript.setSession(session);
        transcript.setText(text);
        transcript.setWpm(analysis.wpm());
        transcript.setFillerWords(toJson(analysis.fillerWords()));
        transcriptRepository.save(transcript);

        session.setStatus(SessionStatus.TRANSCRIBED);
        sessionRepository.save(session);

        kafkaTemplate.send(TRANSCRIPT_READY_TOPIC, String.valueOf(session.getId()),
                new TranscriptReadyEvent(session.getId(), text, analysis.wpm()));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize analysis payload", e);
        }
    }
}