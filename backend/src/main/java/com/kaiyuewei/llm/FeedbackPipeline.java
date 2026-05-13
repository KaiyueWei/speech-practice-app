package com.kaiyuewei.llm;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaiyuewei.session.Feedback;
import com.kaiyuewei.session.FeedbackRepository;
import com.kaiyuewei.session.Session;
import com.kaiyuewei.session.SessionRepository;
import com.kaiyuewei.session.SessionStatus;
import com.kaiyuewei.session.Transcript;
import com.kaiyuewei.session.TranscriptRepository;
import com.kaiyuewei.whisper.TranscriptReadyEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class FeedbackPipeline {

    public static final String FEEDBACK_READY_TOPIC = "feedback.ready";

    private final SessionRepository sessionRepository;
    private final TranscriptRepository transcriptRepository;
    private final FeedbackRepository feedbackRepository;
    private final LlmPromptBuilder promptBuilder;
    private final LlmFeedbackService llmService;
    private final FeedbackParser parser;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public FeedbackPipeline(SessionRepository sessionRepository,
                            TranscriptRepository transcriptRepository,
                            FeedbackRepository feedbackRepository,
                            LlmPromptBuilder promptBuilder,
                            LlmFeedbackService llmService,
                            FeedbackParser parser,
                            KafkaTemplate<String, Object> kafkaTemplate,
                            ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.transcriptRepository = transcriptRepository;
        this.feedbackRepository = feedbackRepository;
        this.promptBuilder = promptBuilder;
        this.llmService = llmService;
        this.parser = parser;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void process(TranscriptReadyEvent event) {
        Session session = sessionRepository.findById(event.sessionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Session not found: " + event.sessionId()));
        Transcript transcript = transcriptRepository.findBySessionId(event.sessionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Transcript not found for session: " + event.sessionId()));

        String prompt = promptBuilder.build(transcript.getText(),
                Map.of("wpm", transcript.getWpm() == null ? 0 : transcript.getWpm()));
        String raw = llmService.generate(prompt);
        FeedbackContent content = parser.parse(raw);

        Feedback feedback = new Feedback();
        feedback.setSession(session);
        feedback.setScores(toJson(content.scores()));
        feedback.setBullets(toJson(content.bullets()));
        feedbackRepository.save(feedback);

        session.setStatus(SessionStatus.SCORED);
        sessionRepository.save(session);

        kafkaTemplate.send(FEEDBACK_READY_TOPIC, String.valueOf(session.getId()),
                new FeedbackReadyEvent(session.getId()));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize feedback payload", e);
        }
    }
}
