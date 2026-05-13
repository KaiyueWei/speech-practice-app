package com.kaiyuewei.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TranscriptRepository extends JpaRepository<Transcript, Long> {

    Optional<Transcript> findBySessionId(Long sessionId);
}