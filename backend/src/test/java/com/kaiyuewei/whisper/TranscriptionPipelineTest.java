package com.kaiyuewei.whisper;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TranscriptionPipelineTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private TranscriptRepository transcriptRepository;
    @Mock private S3Service s3Service;
    @Mock private WhisperService whisperService;
    @Mock private AnalysisService analysisService;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;

    private TranscriptionPipeline pipeline;

    @BeforeEach
    void setUp() {
        S3Buckets buckets = new S3Buckets();
        buckets.setSessions("test-bucket");
        pipeline = new TranscriptionPipeline(
                sessionRepository, transcriptRepository,
                s3Service, buckets,
                whisperService, analysisService,
                kafkaTemplate, new ObjectMapper());
    }

    @Test
    void process_validEvent_persistsTranscriptAndPublishesReadyEvent() {
        Session session = new Session();
        session.setId(42L);
        session.setStatus(SessionStatus.RECORDING);
        session.setAudioS3Key("sessions/1/audio.webm");
        session.setDurationSeconds(60);
        when(sessionRepository.findById(42L)).thenReturn(Optional.of(session));
        when(s3Service.getObject("test-bucket", "sessions/1/audio.webm"))
                .thenReturn(new byte[]{1, 2, 3});
        when(whisperService.transcribe(any())).thenReturn("hello um world");
        when(analysisService.analyze("hello um world", 60))
                .thenReturn(new AnalysisResult(120, Map.of("um", 1, "uh", 0, "like", 0), 95));

        pipeline.process(new SessionRecordedEvent(42L, "sessions/1/audio.webm"));

        ArgumentCaptor<Transcript> captor = ArgumentCaptor.forClass(Transcript.class);
        verify(transcriptRepository).save(captor.capture());
        Transcript saved = captor.getValue();
        assertThat(saved.getText()).isEqualTo("hello um world");
        assertThat(saved.getWpm()).isEqualTo(120);
        assertThat(saved.getFillerWords()).contains("\"um\":1");
        assertThat(saved.getSession()).isEqualTo(session);
        assertThat(session.getStatus()).isEqualTo(SessionStatus.TRANSCRIBED);
        verify(kafkaTemplate).send(eq(TranscriptionPipeline.TRANSCRIPT_READY_TOPIC),
                eq("42"), any());
    }

    @Test
    void process_missingSession_throwsAndDoesNotPersist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pipeline.process(new SessionRecordedEvent(99L, "k")))
                .isInstanceOf(IllegalStateException.class);

        verify(transcriptRepository, never()).save(any());
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void process_nullDuration_defaultsToOne() {
        Session session = new Session();
        session.setId(1L);
        session.setStatus(SessionStatus.RECORDING);
        session.setAudioS3Key("k");
        session.setDurationSeconds(null);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(s3Service.getObject(any(), any())).thenReturn(new byte[]{1});
        when(whisperService.transcribe(any())).thenReturn("hi");
        when(analysisService.analyze(eq("hi"), eq(1)))
                .thenReturn(new AnalysisResult(60, Map.of("um", 0, "uh", 0, "like", 0), 0));

        pipeline.process(new SessionRecordedEvent(1L, "k"));

        verify(analysisService).analyze("hi", 1);
    }
}
