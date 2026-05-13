package com.kaiyuewei.schema;

import com.kaiyuewei.AbstractTestcontainers;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Pure JDBC schema tests — no Spring context needed, no context-caching conflicts.
class SchemaTest extends AbstractTestcontainers {

    private static JdbcTemplate jdbc;

    @BeforeAll
    static void setUpJdbc() {
        jdbc = getJdbcTemplate();
    }

    @Test
    void sessionsTableExists() {
        assertTableExists("sessions");
    }

    @Test
    void promptsTableExists() {
        assertTableExists("prompts");
    }

    @Test
    void transcriptsTableExists() {
        assertTableExists("transcripts");
    }

    @Test
    void feedbackTableExists() {
        assertTableExists("feedback");
    }

    @Test
    void sessionRejectsInvalidUserId() {
        assertThatThrownBy(() ->
                jdbc.update(
                        "INSERT INTO sessions (user_id, status) VALUES (?, ?)",
                        999_999L, "PENDING"
                )
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void transcriptRejectsInvalidSessionId() {
        assertThatThrownBy(() ->
                jdbc.update(
                        "INSERT INTO transcripts (session_id, text) VALUES (?, ?)",
                        999_999L, "test transcript"
                )
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void feedbackRejectsInvalidSessionId() {
        assertThatThrownBy(() ->
                jdbc.update(
                        "INSERT INTO feedback (session_id) VALUES (?)",
                        999_999L
                )
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingUserCascadesToSessions() {
        Long userId = jdbc.queryForObject(
                "INSERT INTO customer (name, email, password, gender, age) VALUES (?,?,?,?,?) RETURNING id",
                Long.class,
                "Test User", "cascade_test@example.com", "hashed", "MALE", 30
        );

        jdbc.update("INSERT INTO sessions (user_id, status) VALUES (?, ?)", userId, "PENDING");
        assertThat(countSessions(userId)).isEqualTo(1);

        jdbc.update("DELETE FROM customer WHERE id = ?", userId);
        assertThat(countSessions(userId)).isEqualTo(0);
    }

    // --- helpers ---

    private static void assertTableExists(String tableName) {
        String found = jdbc.queryForObject(
                "SELECT table_name FROM information_schema.tables " +
                "WHERE table_schema = 'public' AND table_name = ?",
                String.class,
                tableName
        );
        assertThat(found).isEqualTo(tableName);
    }

    private static int countSessions(Long userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sessions WHERE user_id = ?",
                Integer.class,
                userId
        );
        return count != null ? count : 0;
    }
}
