package com.kaiyuewei.session;

import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.Gender;
import com.kaiyuewei.exception.ResourceNotFoundException;
import com.kaiyuewei.s3.PresignedUrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private PresignedUrlService presignedUrlService;

    @Mock
    private KafkaTemplate<String, SessionRecordedEvent> kafkaTemplate;

    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionService = new SessionService(sessionRepository, presignedUrlService, kafkaTemplate);
    }

    // --- createSession ---

    @Test
    void createSession_savesSessionAndReturnsPresignedUrl() {
        Customer customer = new Customer(1, "Test", "test@test.com", "pass", 25, Gender.MALE);
        Session savedSession = new Session();
        savedSession.setId(99L);
        when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);
        when(presignedUrlService.generatePutUrl(anyString(), any(Duration.class)))
                .thenReturn("http://localhost:9000/bucket/key?mock=presigned");

        SessionCreateResponse result = sessionService.createSession(customer);

        assertThat(result.sessionId()).isEqualTo(99L);
        assertThat(result.uploadUrl()).isNotBlank();

        ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(customer);
        assertThat(captor.getValue().getStatus()).isEqualTo(SessionStatus.RECORDING);
        assertThat(captor.getValue().getAudioS3Key()).isNotBlank();
    }

    // --- markRecorded ---

    @Test
    void markRecorded_existingSessionOwnedByUser_publishesKafkaEvent() {
        Customer customer = new Customer(1, "Test", "test@test.com", "pass", 25, Gender.MALE);
        Session session = new Session();
        session.setId(42L);
        session.setUser(customer);
        session.setStatus(SessionStatus.RECORDING);
        session.setAudioS3Key("sessions/1/abc.webm");
        when(sessionRepository.findByIdAndUserId(42L, 1)).thenReturn(Optional.of(session));

        sessionService.markRecorded(42L, customer);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<SessionRecordedEvent> captor = ArgumentCaptor.forClass(SessionRecordedEvent.class);
        verify(kafkaTemplate).send(eq("session.recorded"), eq("42"), captor.capture());
        assertThat(captor.getValue().sessionId()).isEqualTo(42L);
        assertThat(captor.getValue().audioS3Key()).isEqualTo("sessions/1/abc.webm");
    }

    @Test
    void markRecorded_sessionNotFound_throwsResourceNotFoundException() {
        Customer customer = new Customer(1, "Test", "test@test.com", "pass", 25, Gender.MALE);
        when(sessionRepository.findByIdAndUserId(99L, 1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.markRecorded(99L, customer))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
