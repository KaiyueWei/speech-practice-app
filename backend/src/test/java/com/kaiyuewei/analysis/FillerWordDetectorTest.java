package com.kaiyuewei.analysis;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FillerWordDetectorTest {

    private final FillerWordDetector detector = new FillerWordDetector();

    @Test
    void detect_singleOccurrenceOfEachFiller_returnsCountOfOne() {
        Map<String, Integer> counts = detector.detect("um like uh");

        assertThat(counts).containsEntry("um", 1)
                .containsEntry("like", 1)
                .containsEntry("uh", 1);
    }

    @Test
    void detect_multipleOccurrences_returnsCorrectCounts() {
        Map<String, Integer> counts = detector.detect("um um like um uh uh");

        assertThat(counts).containsEntry("um", 3)
                .containsEntry("like", 1)
                .containsEntry("uh", 2);
    }

    @Test
    void detect_caseInsensitive_normalizesToLowercase() {
        Map<String, Integer> counts = detector.detect("Um UH Like");

        assertThat(counts).containsEntry("um", 1)
                .containsEntry("uh", 1)
                .containsEntry("like", 1);
    }

    @Test
    void detect_fillerAsSubstringOfRealWord_doesNotMatch() {
        Map<String, Integer> counts = detector.detect("alike numbers");

        assertThat(counts).containsEntry("like", 0)
                .containsEntry("um", 0);
    }

    @Test
    void detect_noFillers_returnsZeroCountsForKnownFillers() {
        Map<String, Integer> counts = detector.detect("Hello world.");

        assertThat(counts).containsEntry("um", 0)
                .containsEntry("uh", 0)
                .containsEntry("like", 0);
    }

    @Test
    void detect_nullOrBlank_returnsZeroForAllFillers() {
        assertThat(detector.detect(null)).containsValues(0, 0, 0);
        assertThat(detector.detect("")).containsValues(0, 0, 0);
        assertThat(detector.detect("   ")).containsValues(0, 0, 0);
    }
}