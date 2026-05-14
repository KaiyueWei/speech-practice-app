package com.kaiyuewei.session;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "transcripts")
public class Transcript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private Session session;

    @Column(nullable = false)
    private String text;

    private Integer wpm;

    @Column(name = "filler_words", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String fillerWords;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public Transcript() {}

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Integer getWpm() { return wpm; }
    public void setWpm(Integer wpm) { this.wpm = wpm; }

    public String getFillerWords() { return fillerWords; }
    public void setFillerWords(String fillerWords) { this.fillerWords = fillerWords; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}