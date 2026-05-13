package com.kaiyuewei.prompt;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PromptService {

    private final PromptRepository promptRepository;
    private final PromptMapper promptMapper;

    public PromptService(PromptRepository promptRepository, PromptMapper promptMapper) {
        this.promptRepository = promptRepository;
        this.promptMapper = promptMapper;
    }

    @Transactional(readOnly = true)
    public List<PromptResponseDto> getPromptsByMode(PromptMode mode) {
        return promptRepository.findByMode(mode).stream()
                .map(promptMapper::toDto)
                .toList();
    }
}