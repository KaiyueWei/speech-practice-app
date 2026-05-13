package com.kaiyuewei.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Optional<Feedback> findBySessionId(Long sessionId);
}
