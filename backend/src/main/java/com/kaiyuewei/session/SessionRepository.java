package com.kaiyuewei.session;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByIdAndUserId(Long id, Integer userId);

    @Query(
        value = "SELECT s FROM Session s LEFT JOIN FETCH s.prompt WHERE s.user.id = :userId",
        countQuery = "SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId"
    )
    Page<Session> findByUserIdWithPrompt(@Param("userId") Integer userId, Pageable pageable);

    @Query("""
        SELECT s FROM Session s
        LEFT JOIN FETCH s.transcript
        LEFT JOIN FETCH s.feedback
        LEFT JOIN FETCH s.prompt
        WHERE s.id = :id AND s.user.id = :userId
        """)
    Optional<Session> findWithDetail(@Param("id") Long id, @Param("userId") Integer userId);
}
