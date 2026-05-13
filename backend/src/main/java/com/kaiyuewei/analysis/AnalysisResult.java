package com.kaiyuewei.analysis;

import java.util.Map;

public record AnalysisResult(int wpm, Map<String, Integer> fillerWords, int paceScore) {}
