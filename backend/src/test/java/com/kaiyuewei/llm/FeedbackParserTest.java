package com.kaiyuewei.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FeedbackParserTest {

    private final FeedbackParser parser = new FeedbackParser(new ObjectMapper());

    @Test
    void parse_pureJson_returnsFeedbackContent() {
        String json = "{\"scores\":{\"clarity\":85,\"structure\":80},"
                + "\"bullets\":[{\"type\":\"positive\",\"text\":\"strong opening\"}]}";

        FeedbackContent content = parser.parse(json);

        assertThat(content.scores()).containsEntry("clarity", 85).containsEntry("structure", 80);
        assertThat(content.bullets()).hasSize(1);
        assertThat(content.bullets().get(0).type()).isEqualTo("positive");
        assertThat(content.bullets().get(0).text()).isEqualTo("strong opening");
    }

    @Test
    void parse_jsonWithSurroundingProse_extractsAndParses() {
        String raw = "Sure! Here's your feedback:\n\n"
                + "{\"scores\":{\"clarity\":70},\"bullets\":[]}\n\n"
                + "Hope that helps!";

        FeedbackContent content = parser.parse(raw);

        assertThat(content.scores()).containsEntry("clarity", 70);
        assertThat(content.bullets()).isEmpty();
    }

    @Test
    void parse_jsonInsideCodeFence_extracts() {
        String raw = "```json\n{\"scores\":{\"clarity\":60},\"bullets\":[]}\n```";

        FeedbackContent content = parser.parse(raw);

        assertThat(content.scores()).containsEntry("clarity", 60);
    }

    @Test
    void parse_invalidJson_throws() {
        assertThatThrownBy(() -> parser.parse("not json at all"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
