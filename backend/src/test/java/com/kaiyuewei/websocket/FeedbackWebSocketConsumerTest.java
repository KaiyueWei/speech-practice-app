package com.kaiyuewei.websocket;

import com.kaiyuewei.llm.FeedbackReadyEvent;
import com.kaiyuewei.session.SessionDetailDto;
import com.kaiyuewei.session.SessionService;
import com.kaiyuewei.session.SessionStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedbackWebSocketConsumerTest {

    @Mock private SessionService sessionService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @InjectMocks private FeedbackWebSocketConsumer consumer;

    @Test
    void onFeedbackReady_pushesDetailDtoToSessionTopic() {
        SessionDetailDto dto = new SessionDetailDto(
                42L, SessionStatus.SCORED, "prompt",
                "transcript", 140,
                Map.of("um", 1), Map.of("clarity", 85), List.of(),
                OffsetDateTime.now());
        when(sessionService.getSessionDetailById(42L)).thenReturn(dto);

        consumer.onFeedbackReady(new FeedbackReadyEvent(42L));

        verify(messagingTemplate).convertAndSend(eq("/topic/feedback/42"), eq(dto));
    }
}