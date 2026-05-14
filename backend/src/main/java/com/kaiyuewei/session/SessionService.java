package com.kaiyuewei.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.exception.ResourceNotFoundException;
import com.kaiyuewei.s3.PresignedUrlService;
import com.kaiyuewei.s3.S3Buckets;
import com.kaiyuewei.s3.S3Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {

    static final String KAFKA_TOPIC = "session.recorded";
    private static final Duration UPLOAD_URL_EXPIRY = Duration.ofMinutes(15);
    private static final TypeReference<Map<String, Integer>> STRING_INT_MAP =
            new TypeReference<>() {};
    private static final TypeReference<List<FeedbackBullet>> BULLET_LIST =
            new TypeReference<>() {};

    private final SessionRepository sessionRepository;
    private final PresignedUrlService presignedUrlService;
    private final KafkaTemplate<String, SessionRecordedEvent> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    public SessionService(SessionRepository sessionRepository,
                          PresignedUrlService presignedUrlService,
                          KafkaTemplate<String, SessionRecordedEvent> kafkaTemplate,
                          ObjectMapper objectMapper,
                          S3Service s3Service,
                          S3Buckets s3Buckets) {
        this.sessionRepository = sessionRepository;
        this.presignedUrlService = presignedUrlService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.s3Service = s3Service;
        this.s3Buckets = s3Buckets;
    }

    @Transactional
    public SessionCreateResponse createSession(Customer customer) {
        String s3Key = "sessions/" + customer.getId() + "/" + UUID.randomUUID() + ".webm";
        Session session = new Session();
        session.setUser(customer);
        session.setStatus(SessionStatus.RECORDING);
        session.setAudioS3Key(s3Key);
        Session saved = sessionRepository.save(session);
        String uploadUrl = presignedUrlService.generatePutUrl(saved.getId(), s3Key, UPLOAD_URL_EXPIRY);
        return new SessionCreateResponse(saved.getId(), uploadUrl);
    }

    @Transactional(readOnly = true)
    public void uploadAudio(Long sessionId, byte[] audio, Customer customer) {
        Session session = sessionRepository.findByIdAndUserId(sessionId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        s3Service.putObject(s3Buckets.getSessions(), session.getAudioS3Key(), audio);
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
        return toDetailDto(session);
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getSessionDetailById(Long sessionId) {
        Session session = sessionRepository.findWithDetailById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + sessionId));
        return toDetailDto(session);
    }

    private SessionDetailDto toDetailDto(Session session) {
        Optional<Transcript> transcript = Optional.ofNullable(session.getTranscript());
        Optional<Feedback> feedback = Optional.ofNullable(session.getFeedback());
        return new SessionDetailDto(
                session.getId(),
                session.getStatus(),
                Optional.ofNullable(session.getPrompt()).map(p -> p.getText()).orElse(null),
                transcript.map(Transcript::getText).orElse(null),
                transcript.map(Transcript::getWpm).orElse(null),
                transcript.map(Transcript::getFillerWords).map(this::parseStringIntMap).orElse(null),
                feedback.map(Feedback::getScores).map(this::parseStringIntMap).orElse(null),
                feedback.map(Feedback::getBullets).map(this::parseBullets).orElse(null),
                session.getCreatedAt()
        );
    }

    private Map<String, Integer> parseStringIntMap(String json) {
        try {
            return objectMapper.readValue(json, STRING_INT_MAP);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON in session payload: " + json, e);
        }
    }

    private List<FeedbackBullet> parseBullets(String json) {
        try {
            return objectMapper.readValue(json, BULLET_LIST);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON in session payload: " + json, e);
        }
    }
}