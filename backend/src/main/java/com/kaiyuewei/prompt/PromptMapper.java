package com.kaiyuewei.prompt;

import org.springframework.stereotype.Component;

@Component
public class PromptMapper {

    public PromptResponseDto toDto(Prompt prompt) {
        return new PromptResponseDto(
                prompt.getId(),
                prompt.getText(),
                prompt.getDifficulty(),
                prompt.getCategory(),
                prompt.getMode()
        );
    }
}