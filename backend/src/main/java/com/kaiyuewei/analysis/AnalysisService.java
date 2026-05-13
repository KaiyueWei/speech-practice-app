package com.kaiyuewei.analysis;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AnalysisService {

    private final FillerWordDetector fillerWordDetector;
    private final WpmCalculator wpmCalculator;
    private final PaceScorer paceScorer;

    public AnalysisService(FillerWordDetector fillerWordDetector,
                           WpmCalculator wpmCalculator,
                           PaceScorer paceScorer) {
        this.fillerWordDetector = fillerWordDetector;
        this.wpmCalculator = wpmCalculator;
        this.paceScorer = paceScorer;
    }

    public AnalysisResult analyze(String transcript, int durationSec) {
        if (transcript == null) {
            throw new IllegalArgumentException("transcript must not be null");
        }
        Map<String, Integer> fillers = fillerWordDetector.detect(transcript);
        int wordCount = transcript.isBlank() ? 0 : transcript.trim().split("\\s+").length;
        int wpm = wordCount == 0 ? 0 : wpmCalculator.calculate(wordCount, durationSec);
        int paceScore = paceScorer.score(wpm);
        return new AnalysisResult(wpm, fillers, paceScore);
    }
}
