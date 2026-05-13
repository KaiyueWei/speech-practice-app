package com.kaiyuewei.prompt;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "prompts")
public class Prompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromptMode mode;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private String category;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public Prompt() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public PromptMode getMode() { return mode; }
    public void setMode(PromptMode mode) { this.mode = mode; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}