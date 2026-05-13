package com.kaiyuewei.session;

import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.exception.ResourceNotFoundException;
import com.kaiyuewei.s3.PresignedUrlService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {

    static final String KAFKA_TOPIC = "session.recorded";
    private static final Duration UPLOAD_URL_EXPIRY = Duration.ofMinutes(15);

    private final SessionRepository sessionRepository;
    private final PresignedUrlService presignedUrlService;
    private final KafkaTemplate<String, SessionRecordedEvent> kafkaTemplate;

    public SessionService(SessionRepository sessionRepository,
                          PresignedUrlService presignedUrlService,
                          KafkaTemplate<String, SessionRecordedEvent> kafkaTemplate) {
        this.sessionRepository = sessionRepository;
        this.presignedUrlService = presignedUrlService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public SessionCreateResponse createSession(Customer customer) {
        String s3Key = "sessions/" + customer.getId() + "/" + UUID.randomUUID() + ".webm";
        Session session = new Session();
        session.setUser(customer);
        session.setStatus(SessionStatus.RECORDING);
        session.setAudioS3Key(s3Key);
        Session saved = sessionRepository.save(session);
        String uploadUrl = presignedUrlService.generatePutUrl(s3Key, UPLOAD_URL_EXPIRY);
        return new SessionCreateResponse(saved.getId(), uploadUrl);
    }

    @Transactional
    public void markRecorded(Long sessionId, Customer customer) {
        Session session = sessionRepository.findByIdAndUserId(sessionId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        if (session.getStatus() != SessionStatus.RECORDING) {
            throw new IllegalStateException(
                    "Session " + sessionId + " is not in RECORDING state (was "
                            + session.getStatus() + ")");
        }
        kafkaTemplate.send(KAFKA_TOPIC, String.valueOf(sessionId),
                new SessionRecordedEvent(sessionId, session.getAudioS3Key()));
    }

    @Transactional(readOnly = true)
    public Page<SessionSummaryDto> getUserSessions(Customer customer, Pageable pageable) {
        return sessionRepository.findByUserIdWithPrompt(customer.getId(), pageable)
                .map(s -> new SessionSummaryDto(
                        s.getId(),
                        s.getStatus(),
                        Optional.ofNullable(s.getPrompt()).map(p -> p.getText()).orElse(null),
                        s.getCreatedAt()
                ));
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getSessionDetail(Long sessionId, Customer customer) {
        Session session = sessionRepository.findWithDetail(sessionId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        Optional<Transcript> transcript = Optional.ofNullable(session.getTranscript());
        Optional<Feedback> feedback = Optional.ofNullable(session.getFeedback());
        return new SessionDetailDto(
                session.getId(),
                session.getStatus(),
                Optional.ofNullable(session.getPrompt()).map(p -> p.getText()).orElse(null),
                transcript.map(Transcript::getText).orElse(null),
                transcript.map(Transcript::getWpm).orElse(null),
                transcript.map(Transcript::getFillerWords).orElse(null),
                feedback.map(Feedback::getScores).orElse(null),
                feedback.map(Feedback::getBullets).orElse(null),
                session.getCreatedAt()
        );
    }
}
