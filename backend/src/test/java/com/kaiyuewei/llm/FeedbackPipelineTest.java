package com.kaiyuewei.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaiyuewei.session.Feedback;
import com.kaiyuewei.session.FeedbackBullet;
import com.kaiyuewei.session.FeedbackRepository;
import com.kaiyuewei.session.Session;
import com.kaiyuewei.session.SessionRepository;
import com.kaiyuewei.session.SessionStatus;
import com.kaiyuewei.session.Transcript;
import com.kaiyuewei.session.TranscriptRepository;
import com.kaiyuewei.whisper.TranscriptReadyEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
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
class FeedbackPipelineTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private TranscriptRepository transcriptRepository;
    @Mock private FeedbackRepository feedbackRepository;
    @Mock private LlmPromptBuilder promptBuilder;
    @Mock private LlmFeedbackService llmService;
    @Mock private FeedbackParser parser;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;

    private FeedbackPipeline pipeline;

    @BeforeEach
    void setUp() {
        pipeline = new FeedbackPipeline(
                sessionRepository, transcriptRepository, feedbackRepository,
                promptBuilder, llmService, parser, kafkaTemplate, new ObjectMapper());
    }

    @Test
    void process_validTranscript_persistsFeedbackAndPublishesEvent() {
        Session session = new Session();
        session.setId(7L);
        session.setStatus(SessionStatus.TRANSCRIBED);
        Transcript transcript = new Transcript();
        transcript.setText("hello world");
        transcript.setWpm(140);
        when(sessionRepository.findById(7L)).thenReturn(Optional.of(session));
        when(transcriptRepository.findBySessionId(7L)).thenReturn(Optional.of(transcript));
        when(promptBuilder.build(eq("hello world"), any())).thenReturn("PROMPT");
        when(llmService.generate("PROMPT")).thenReturn("RAW_LLM_OUTPUT");
        when(parser.parse("RAW_LLM_OUTPUT")).thenReturn(new FeedbackContent(
                Map.of("clarity", 85),
                List.of(new FeedbackBullet("positive", "Strong opening"))));

        pipeline.process(new TranscriptReadyEvent(7L, "hello world", 140));

        ArgumentCaptor<Feedback> captor = ArgumentCaptor.forClass(Feedback.class);
        verify(feedbackRepository).save(captor.capture());
        Feedback saved = captor.getValue();
        assertThat(saved.getScores()).contains("\"clarity\":85");
        assertThat(saved.getBullets()).contains("Strong opening");
        assertThat(session.getStatus()).isEqualTo(SessionStatus.SCORED);
        verify(kafkaTemplate).send(eq(FeedbackPipeline.FEEDBACK_READY_TOPIC),
                eq("7"), any(FeedbackReadyEvent.class));
    }

    @Test
    void process_missingTranscript_throwsAndDoesNotPersist() {
        Session session = new Session();
        session.setId(9L);
        when(sessionRepository.findById(9L)).thenReturn(Optional.of(session));
        when(transcriptRepository.findBySessionId(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                pipeline.process(new TranscriptReadyEvent(9L, "t", 100)))
                .isInstanceOf(IllegalStateException.class);

        verify(feedbackRepository, never()).save(any());
    }

    @Test
    void process_missingSession_throws() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                pipeline.process(new TranscriptReadyEvent(99L, "t", 100)))
                .isInstanceOf(IllegalStateException.class);
    }
}
