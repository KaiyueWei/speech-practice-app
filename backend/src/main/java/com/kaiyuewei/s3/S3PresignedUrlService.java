package com.kaiyuewei.s3;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Service
public class S3PresignedUrlService implements PresignedUrlService {

    private final boolean mock;
    private final String awsRegion;
    private final String sessionsBucket;

    public S3PresignedUrlService(
            @Value("${aws.s3.mock}") boolean mock,
            @Value("${aws.region}") String awsRegion,
            @Value("${aws.s3.buckets.sessions}") String sessionsBucket) {
        this.mock = mock;
        this.awsRegion = awsRegion;
        this.sessionsBucket = sessionsBucket;
    }

    public String generatePutUrl(String key, Duration expiry) {
        if (mock) {
            return "http://localhost:9000/" + sessionsBucket + "/" + key + "?mock=presigned";
        }
        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(awsRegion))
                .build()) {
            return presigner.presignPutObject(
                    PutObjectPresignRequest.builder()
                            .signatureDuration(expiry)
                            .putObjectRequest(PutObjectRequest.builder()
                                    .bucket(sessionsBucket)
                                    .key(key)
                                    .build())
                            .build()
            ).url().toString();
        }
    }
}