package com.kaiyuewei.session;

import java.time.OffsetDateTime;

public record SessionDetailDto(
        Long id,
        SessionStatus status,
        String promptText,
        String transcriptText,
        Integer wpm,
        String fillerWords,
        String scores,
        String bullets,
        OffsetDateTime createdAt
) {}