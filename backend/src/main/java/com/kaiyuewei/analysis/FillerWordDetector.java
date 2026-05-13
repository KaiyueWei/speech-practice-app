package com.kaiyuewei.analysis;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class FillerWordDetector {

    static final List<String> FILLERS = List.of("um", "uh", "like");

    private static final Map<String, Pattern> PATTERNS = buildPatterns();

    private static Map<String, Pattern> buildPatterns() {
        Map<String, Pattern> patterns = new LinkedHashMap<>();
        for (String filler : FILLERS) {
            patterns.put(filler, Pattern.compile("\\b" + Pattern.quote(filler) + "\\b",
                    Pattern.CASE_INSENSITIVE));
        }
        return patterns;
    }

    public Map<String, Integer> detect(String transcript) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        FILLERS.forEach(f -> counts.put(f, 0));
        if (transcript == null || transcript.isBlank()) {
            return counts;
        }
        for (Map.Entry<String, Pattern> entry : PATTERNS.entrySet()) {
            Matcher matcher = entry.getValue().matcher(transcript);
            int count = 0;
            while (matcher.find()) count++;
            counts.put(entry.getKey(), count);
        }
        return counts;
    }
}