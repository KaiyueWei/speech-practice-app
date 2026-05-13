package com.kaiyuewei.s3;

import java.time.Duration;

public interface PresignedUrlService {
    String generatePutUrl(String key, Duration expiry);
}