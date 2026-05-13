package com.kaiyuewei.llm;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class LlmFeedbackService {

    private static final Logger log = LoggerFactory.getLogger(LlmFeedbackService.class);

    private final WebClient webClient;
    private final String groqUrl;
    private final String groqToken;
    private final String groqModel;
    private final String hfUrl;
    private final String hfToken;
    private final Duration timeout;

    public LlmFeedbackService(
            WebClient.Builder builder,
            @Value("${llm.groq.url:https://api.groq.com/openai/v1/chat/completions}") String groqUrl,
            @Value("${llm.groq.token:placeholder}") String groqToken,
            @Value("${llm.groq.model:mixtral-8x7b-32768}") String groqModel,
            @Value("${llm.hf.url:https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2}") String hfUrl,
            @Value("${huggingface.token:placeholder}") String hfToken,
            @Value("${llm.timeout:PT15S}") Duration timeout) {
        this.webClient = builder.build();
        this.groqUrl = groqUrl;
        this.groqToken = groqToken;
        this.groqModel = groqModel;
        this.hfUrl = hfUrl;
        this.hfToken = hfToken;
        this.timeout = timeout;
    }

    public String generate(String prompt) {
        try {
            return callGroq(prompt);
        } catch (RuntimeException ex) {
            log.warn("Groq call failed ({}); falling back to HF Mistral", ex.toString());
            return callHf(prompt);
        }
    }

    private String callGroq(String prompt) {
        Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", List.of(Map.of("role", "user", "content", prompt)));
        JsonNode root = webClient.post()
                .uri(groqUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(timeout);
        JsonNode content = root == null ? null
                : root.path("choices").path(0).path("message").path("content");
        if (content == null || content.isMissingNode() || content.isNull()) {
            throw new IllegalStateException("Missing content in Groq response");
        }
        return content.asText();
    }

    private String callHf(String prompt) {
        JsonNode root = webClient.post()
                .uri(hfUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + hfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("inputs", prompt))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(timeout);
        JsonNode text = root == null ? null : root.path(0).path("generated_text");
        if (text == null || text.isMissingNode() || text.isNull()) {
            throw new IllegalStateException("Missing generated_text in HF response");
        }
        return text.asText();
    }
}