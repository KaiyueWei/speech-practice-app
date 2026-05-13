package com.kaiyuewei.session;

public record SessionRecordedEvent(Long sessionId, String audioS3Key) {}