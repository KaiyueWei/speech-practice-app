package com.kaiyuewei.analysis;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WpmCalculatorTest {

    private final WpmCalculator calculator = new WpmCalculator();

    @ParameterizedTest
    @CsvSource({
            "150, 60, 150",
            "60, 60, 60",
            "300, 60, 300",
            "150, 30, 300",
            "100, 120, 50"
    })
    void calculate_validInputs_returnsWordsPerMinute(int wordCount, int durationSec, int expected) {
        assertThat(calculator.calculate(wordCount, durationSec)).isEqualTo(expected);
    }

    @Test
    void calculate_zeroDuration_throws() {
        assertThatThrownBy(() -> calculator.calculate(100, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void calculate_negativeDuration_throws() {
        assertThatThrownBy(() -> calculator.calculate(100, -5))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void calculate_negativeWordCount_throws() {
        assertThatThrownBy(() -> calculator.calculate(-1, 60))
                .isInstanceOf(IllegalArgumentException.class);
    }
}