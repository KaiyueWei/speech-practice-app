package com.kaiyuewei.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaiyuewei.AbstractTestcontainers;
import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.CustomerRepository;
import com.kaiyuewei.customer.Gender;
import com.kaiyuewei.jwt.JWTUtil;
import com.kaiyuewei.llm.FeedbackReadyEvent;
import com.kaiyuewei.session.Feedback;
import com.kaiyuewei.websocket.FeedbackWebSocketConsumer;
import com.kaiyuewei.session.FeedbackRepository;
import com.kaiyuewei.session.Session;
import com.kaiyuewei.session.SessionDetailDto;
import com.kaiyuewei.session.SessionRepository;
import com.kaiyuewei.session.SessionStatus;
import com.kaiyuewei.session.Transcript;
import com.kaiyuewei.session.TranscriptRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "huggingface.whisper.max-attempts=1",
                "huggingface.whisper.retry-delay=PT0.01S",
                "llm.timeout=PT2S",
                "spring.kafka.consumer.auto-offset-reset=earliest"
        }
)
@EmbeddedKafka(partitions = 1, topics = {"feedback.ready"})
class FeedbackWebSocketIT extends AbstractTestcontainers {

    @LocalServerPort private int port;

    @Autowired private CustomerRepository customerRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private TranscriptRepository transcriptRepository;
    @Autowired private FeedbackRepository feedbackRepository;
    @Autowired private FeedbackWebSocketConsumer feedbackWebSocketConsumer;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JWTUtil jwtUtil;

    @Test
    void stompClient_receivesSessionDetailDto_afterFeedbackReadyEvent() throws Exception {
        Customer customer = customerRepository.save(new Customer(
                "WS Tester", "ws-" + System.nanoTime() + "@test.com",
                "hashed", 30, Gender.MALE));

        Session session = new Session();
        session.setUser(customer);
        session.setStatus(SessionStatus.SCORED);
        session.setAudioS3Key("k");
        Session savedSession = sessionRepository.save(session);

        Transcript transcript = new Transcript();
        transcript.setSession(savedSession);
        transcript.setText("hello world");
        transcript.setWpm(140);
        transcript.setFillerWords("{\"um\":1,\"uh\":0,\"like\":0}");
        transcriptRepository.save(transcript);

        Feedback feedback = new Feedback();
        feedback.setSession(savedSession);
        feedback.setScores("{\"clarity\":85}");
        feedback.setBullets("[{\"type\":\"positive\",\"text\":\"Strong\"}]");
        feedbackRepository.save(feedback);

        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);

        LinkedBlockingDeque<SessionDetailDto> received = new LinkedBlockingDeque<>();

        String jwt = jwtUtil.issueToken(customer.getUsername(), "ROLE_USER");
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + jwt);

        StompSession stompSession = stompClient
                .connectAsync("ws://localhost:" + port + "/ws/websocket",
                        new WebSocketHttpHeaders(), connectHeaders,
                        new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

        stompSession.subscribe("/topic/feedback/" + savedSession.getId(),
                new StompFrameHandler() {
                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return SessionDetailDto.class;
                    }
                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) {
                        received.add((SessionDetailDto) payload);
                    }
                });

        // Let server register the subscription before publishing
        Thread.sleep(500);
        feedbackWebSocketConsumer.onFeedbackReady(new FeedbackReadyEvent(savedSession.getId()));

        SessionDetailDto dto = received.poll(5, TimeUnit.SECONDS);

        assertThat(dto).as("STOMP message did not arrive within 5s").isNotNull();
        assertThat(dto.id()).isEqualTo(savedSession.getId());
        assertThat(dto.status()).isEqualTo(SessionStatus.SCORED);
        assertThat(dto.transcriptText()).isEqualTo("hello world");
        assertThat(dto.scores()).containsEntry("clarity", 85);
        assertThat(dto.bullets()).hasSize(1);
        assertThat(dto.bullets().get(0).type()).isEqualTo("positive");

        stompSession.disconnect();
        stompClient.stop();
    }

    @Test
    void stompClient_connectWithoutAuthHeader_isRejected() {
        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);

        assertThatThrownBy(() -> stompClient
                .connectAsync("ws://localhost:" + port + "/ws/websocket",
                        new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS))
                .hasMessageContaining("ConnectionLostException")
                .as("unauthenticated CONNECT should be rejected by the interceptor");

        stompClient.stop();
    }
}