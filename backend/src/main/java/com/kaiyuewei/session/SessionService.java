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
import java.time.OffsetDateTime;
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
        OffsetDateTime now = OffsetDateTime.now();
        session.setCreatedAt(now);
        session.setUpdatedAt(now);
        Session saved = sessionRepository.save(session);
        String uploadUrl = presignedUrlService.generatePutUrl(s3Key, UPLOAD_URL_EXPIRY);
        return new SessionCreateResponse(saved.getId(), uploadUrl);
    }

    public void markRecorded(Long sessionId, Customer customer) {
        Session session = sessionRepository.findByIdAndUserId(sessionId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        kafkaTemplate.send(KAFKA_TOPIC, String.valueOf(sessionId),
                new SessionRecordedEvent(sessionId, session.getAudioS3Key()));
    }

    @Transactional(readOnly = true)
    public Page<SessionSummaryDto> getUserSessions(Customer customer, Pageable pageable) {
        return sessionRepository.findByUserIdWithPrompt(customer.getId(), pageable)
                .map(s -> new SessionSummaryDto(
                        s.getId(),
                        s.getStatus(),
                        s.getPrompt() != null ? s.getPrompt().getText() : null,
                        s.getCreatedAt()
                ));
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getSessionDetail(Long sessionId, Customer customer) {
        Session session = sessionRepository.findWithDetail(sessionId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        Transcript t = session.getTranscript();
        Feedback f = session.getFeedback();
        return new SessionDetailDto(
                session.getId(),
                session.getStatus(),
                session.getPrompt() != null ? session.getPrompt().getText() : null,
                t != null ? t.getText() : null,
                t != null ? t.getWpm() : null,
                t != null ? t.getFillerWords() : null,
                f != null ? f.getScores() : null,
                f != null ? f.getBullets() : null,
                session.getCreatedAt()
        );
    }
}
