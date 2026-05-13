package com.kaiyuewei.session;

import java.time.OffsetDateTime;

public record SessionSummaryDto(Long id, SessionStatus status, String promptText, OffsetDateTime createdAt) {}