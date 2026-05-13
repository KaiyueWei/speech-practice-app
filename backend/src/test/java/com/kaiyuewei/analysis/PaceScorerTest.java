package com.kaiyuewei.analysis;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PaceScorerTest {

    private final PaceScorer scorer = new PaceScorer();

    @Test
    void score_tooFast_returnsBelow70() {
        assertThat(scorer.score(180)).isLessThan(70);
    }

    @Test
    void score_tooSlow_returnsBelow70() {
        assertThat(scorer.score(80)).isLessThan(70);
    }

    @ParameterizedTest
    @ValueSource(ints = {120, 130, 140, 150, 160})
    void score_goodPace_returnsAtLeast90(int wpm) {
        assertThat(scorer.score(wpm)).isGreaterThanOrEqualTo(90);
    }

    @Test
    void score_returnsValueBetween0And100() {
        for (int wpm = 0; wpm <= 300; wpm += 10) {
            int s = scorer.score(wpm);
            assertThat(s).as("wpm=%d", wpm).isBetween(0, 100);
        }
    }
}
