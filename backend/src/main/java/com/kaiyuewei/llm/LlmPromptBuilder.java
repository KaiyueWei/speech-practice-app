package com.kaiyuewei.llm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.stream.Collectors;

@Component
public class LlmPromptBuilder {

    public static final String DEFAULT_TEMPLATE = """
            You are a public speaking coach. Analyze the following transcript and
            return ONLY a valid JSON object with this exact shape, no prose:
            {"scores": {"clarity": <0-100>, "structure": <0-100>, "delivery": <0-100>},
             "bullets": [{"type": "positive|warning|tip", "text": "..."}]}

            Existing analysis: {{scores}}

            Transcript:
            {{transcript}}
            """;

    private final String template;

    public LlmPromptBuilder(@Value("${llm.prompt.template:#{T(com.kaiyuewei.llm.LlmPromptBuilder).DEFAULT_TEMPLATE}}") String template) {
        this.template = template;
    }

    public String build(String transcript, Map<String, Integer> scores) {
        String scoreLine = scores.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining(", "));
        return template
                .replace("{{transcript}}", transcript)
                .replace("{{scores}}", scoreLine);
    }
}
