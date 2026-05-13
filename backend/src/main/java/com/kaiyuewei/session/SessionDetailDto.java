package com.kaiyuewei.session;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record SessionDetailDto(
        Long id,
        SessionStatus status,
        String promptText,
        String transcriptText,
        Integer wpm,
        Map<String, Integer> fillerWords,
        Map<String, Integer> scores,
        List<FeedbackBullet> bullets,
        OffsetDateTime createdAt
) {}
