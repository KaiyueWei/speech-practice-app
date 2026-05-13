package com.kaiyuewei.llm;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LlmPromptBuilderTest {

    private final LlmPromptBuilder builder = new LlmPromptBuilder(LlmPromptBuilder.DEFAULT_TEMPLATE);

    @Test
    void build_includesTranscriptVerbatim() {
        String prompt = builder.build("I am a software engineer", Map.of("paceScore", 90));
        assertThat(prompt).contains("I am a software engineer");
    }

    @Test
    void build_includesScoreValues() {
        String prompt = builder.build("hi", Map.of("paceScore", 85, "wpm", 130));
        assertThat(prompt).contains("paceScore=85");
        assertThat(prompt).contains("wpm=130");
    }

    @Test
    void build_requestsJsonResponseShape() {
        String prompt = builder.build("hi", Map.of());
        assertThat(prompt).containsIgnoringCase("JSON");
        assertThat(prompt).contains("scores");
        assertThat(prompt).contains("bullets");
    }

    @Test
    void build_customTemplate_substitutesPlaceholders() {
        LlmPromptBuilder custom = new LlmPromptBuilder("T={{transcript}} S={{scores}}");
        String prompt = custom.build("hello", Map.of("pace", 80));
        assertThat(prompt).startsWith("T=hello");
        assertThat(prompt).contains("S=pace=80");
    }
}
