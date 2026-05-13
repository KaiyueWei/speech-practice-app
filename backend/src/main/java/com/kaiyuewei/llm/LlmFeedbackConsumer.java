package com.kaiyuewei.llm;

import com.kaiyuewei.whisper.TranscriptReadyEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class LlmFeedbackConsumer {

    private static final Logger log = LoggerFactory.getLogger(LlmFeedbackConsumer.class);

    private final FeedbackPipeline pipeline;

    public LlmFeedbackConsumer(FeedbackPipeline pipeline) {
        this.pipeline = pipeline;
    }

    @KafkaListener(topics = "transcript.ready", groupId = "${spring.kafka.consumer.group-id:speech-app}")
    public void onTranscriptReady(TranscriptReadyEvent event) {
        log.info("Received transcript.ready for sessionId={}", event.sessionId());
        pipeline.process(event);
    }
}