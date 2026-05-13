package com.kaiyuewei.schema;

import com.kaiyuewei.AbstractTestcontainers;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

// Pure JDBC seed tests — no Spring context needed, no context-caching conflicts.
class PromptSeedTest extends AbstractTestcontainers {

    private static JdbcTemplate jdbc;

    @BeforeAll
    static void setUpJdbc() {
        jdbc = getJdbcTemplate();
    }

    @ParameterizedTest(name = "mode={0} has at least 5 prompts")
    @ValueSource(strings = {"IMPROMPTU", "PREPARED", "INTERVIEW", "DEBATE"})
    void eachModeHasAtLeastFivePrompts(String mode) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM prompts WHERE mode = ?",
                Integer.class,
                mode
        );
        assertThat(count).isGreaterThanOrEqualTo(5);
    }

    @ParameterizedTest(name = "mode={0} covers all difficulties")
    @ValueSource(strings = {"IMPROMPTU", "PREPARED", "INTERVIEW", "DEBATE"})
    void eachModeCoversAllDifficulties(String mode) {
        for (String difficulty : new String[]{"EASY", "MEDIUM", "HARD"}) {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM prompts WHERE mode = ? AND difficulty = ?",
                    Integer.class,
                    mode, difficulty
            );
            assertThat(count)
                    .as("mode=%s difficulty=%s", mode, difficulty)
                    .isGreaterThanOrEqualTo(1);
        }
    }
}