package com.kaiyuewei.websocket;

import com.kaiyuewei.llm.FeedbackReadyEvent;
import com.kaiyuewei.session.SessionDetailDto;
import com.kaiyuewei.session.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class FeedbackWebSocketConsumer {

    private static final Logger log = LoggerFactory.getLogger(FeedbackWebSocketConsumer.class);
    private static final String DESTINATION_PREFIX = "/topic/feedback/";

    private final SessionService sessionService;
    private final SimpMessagingTemplate messagingTemplate;

    public FeedbackWebSocketConsumer(SessionService sessionService,
                                     SimpMessagingTemplate messagingTemplate) {
        this.sessionService = sessionService;
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = "feedback.ready", groupId = "${spring.kafka.consumer.group-id:speech-app}-ws")
    public void onFeedbackReady(FeedbackReadyEvent event) {
        log.info("Pushing feedback to WS for sessionId={}", event.sessionId());
        SessionDetailDto detail = sessionService.getSessionDetailById(event.sessionId());
        messagingTemplate.convertAndSend(DESTINATION_PREFIX + event.sessionId(), detail);
    }
}
