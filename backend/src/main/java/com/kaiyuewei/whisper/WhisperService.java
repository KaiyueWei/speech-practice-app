package com.kaiyuewei.whisper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class WhisperService {

    private final WebClient webClient;
    private final String url;
    private final String token;
    private final int maxAttempts;
    private final Duration retryDelay;

    public WhisperService(
            WebClient.Builder builder,
            @Value("${huggingface.token}") String token,
            @Value("${huggingface.whisper.url:https://api-inference.huggingface.co/models/openai/whisper-large-v3}") String url,
            @Value("${huggingface.whisper.max-attempts:3}") int maxAttempts,
            @Value("${huggingface.whisper.retry-delay:PT5S}") Duration retryDelay) {
        this.webClient = builder.build();
        this.url = url;
        this.token = token;
        this.maxAttempts = maxAttempts;
        this.retryDelay = retryDelay;
    }

    public String transcribe(byte[] audio) {
        return webClient.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .bodyValue(audio)
                .retrieve()
                .bodyToMono(WhisperResponse.class)
                .retryWhen(Retry.fixedDelay(maxAttempts - 1L, retryDelay)
                        .filter(this::isServiceUnavailable))
                .map(WhisperResponse::text)
                .block();
    }

    private boolean isServiceUnavailable(Throwable t) {
        return t instanceof WebClientResponseException wcre
                && wcre.getStatusCode().equals(HttpStatusCode.valueOf(503));
    }

    record WhisperResponse(String text) {}
}