package com.kaiyuewei.analysis;

import org.springframework.stereotype.Component;

@Component
public class PaceScorer {

    static final int LOWER_BAND = 120;
    static final int UPPER_BAND = 160;
    private static final int PENALTY_PER_WPM = 2;

    public int score(int wpm) {
        int distance;
        if (wpm < LOWER_BAND) {
            distance = LOWER_BAND - wpm;
        } else if (wpm > UPPER_BAND) {
            distance = wpm - UPPER_BAND;
        } else {
            distance = 0;
        }
        int raw = 100 - distance * PENALTY_PER_WPM;
        return Math.max(0, Math.min(100, raw));
    }
}
