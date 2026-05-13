package com.kaiyuewei.analysis;

import org.springframework.stereotype.Component;

@Component
public class WpmCalculator {

    public int calculate(int wordCount, int durationSec) {
        if (durationSec <= 0) {
            throw new IllegalArgumentException("durationSec must be positive: " + durationSec);
        }
        if (wordCount < 0) {
            throw new IllegalArgumentException("wordCount must be non-negative: " + wordCount);
        }
        return Math.round((float) wordCount * 60 / durationSec);
    }
}