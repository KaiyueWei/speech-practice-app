package com.kaiyuewei.s3;

import java.time.Duration;

public interface PresignedUrlService {
    String generatePutUrl(Long sessionId, String key, Duration expiry);
}
