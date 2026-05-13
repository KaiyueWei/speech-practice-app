package com.kaiyuewei.llm;

import com.kaiyuewei.session.FeedbackBullet;

import java.util.List;
import java.util.Map;

public record FeedbackContent(Map<String, Integer> scores, List<FeedbackBullet> bullets) {}