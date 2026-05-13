package com.kaiyuewei.session;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private Session session;

    @Column(columnDefinition = "jsonb")
    private String scores;

    @Column(columnDefinition = "jsonb")
    private String bullets;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public Feedback() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }

    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }

    public String getBullets() { return bullets; }
    public void setBullets(String bullets) { this.bullets = bullets; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}