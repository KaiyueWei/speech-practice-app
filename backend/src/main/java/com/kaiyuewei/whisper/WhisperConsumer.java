package com.kaiyuewei.whisper;

import com.kaiyuewei.session.SessionRecordedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class WhisperConsumer {

    private static final Logger log = LoggerFactory.getLogger(WhisperConsumer.class);

    private final TranscriptionPipeline pipeline;

    public WhisperConsumer(TranscriptionPipeline pipeline) {
        this.pipeline = pipeline;
    }

    @KafkaListener(topics = "session.recorded", groupId = "${spring.kafka.consumer.group-id:speech-app}")
    public void onSessionRecorded(SessionRecordedEvent event) {
        log.info("Received session.recorded for sessionId={}", event.sessionId());
        pipeline.process(event);
    }
}