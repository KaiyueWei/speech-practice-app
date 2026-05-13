package com.kaiyuewei.llm;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class FeedbackParser {

    private final ObjectMapper objectMapper;

    public FeedbackParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public FeedbackContent parse(String raw) {
        String json = extractJsonObject(raw);
        try {
            return objectMapper.readValue(json, FeedbackContent.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid LLM JSON: " + json, e);
        }
    }

    private String extractJsonObject(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("LLM response is null");
        }
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalArgumentException("No JSON object found in LLM response: " + raw);
        }
        return raw.substring(start, end + 1);
    }
}