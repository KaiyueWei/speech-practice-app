package com.kaiyuewei.analysis;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnalysisServiceTest {

    private final AnalysisService service = new AnalysisService(
            new FillerWordDetector(), new WpmCalculator(), new PaceScorer());

    @Test
    void analyze_normalSpeech_returnsAllMetrics() {
        String transcript = "Hello um I am a software engineer like working on a project";
        int durationSec = 6;

        AnalysisResult result = service.analyze(transcript, durationSec);

        assertThat(result.wpm()).isEqualTo(120);
        assertThat(result.fillerWords()).containsEntry("um", 1).containsEntry("like", 1);
        assertThat(result.paceScore()).isGreaterThanOrEqualTo(90);
    }

    @Test
    void analyze_emptyTranscript_returnsZeroWpmAndAllFillersZero() {
        AnalysisResult result = service.analyze("", 30);

        assertThat(result.wpm()).isZero();
        assertThat(result.fillerWords()).containsValues(0, 0, 0);
    }

    @Test
    void analyze_nullTranscript_throws() {
        assertThatThrownBy(() -> service.analyze(null, 60))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
