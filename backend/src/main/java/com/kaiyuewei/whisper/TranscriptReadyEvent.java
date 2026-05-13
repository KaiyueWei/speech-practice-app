package com.kaiyuewei.whisper;

public record TranscriptReadyEvent(Long sessionId, String transcriptText, int wpm) {}