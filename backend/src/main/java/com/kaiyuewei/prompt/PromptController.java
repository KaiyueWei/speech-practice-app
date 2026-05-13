package com.kaiyuewei.prompt;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("api/v1/prompts")
public class PromptController {

    private final PromptService promptService;

    public PromptController(PromptService promptService) {
        this.promptService = promptService;
    }

    @GetMapping
    public List<PromptResponseDto> getPrompts(@RequestParam PromptMode mode) {
        return promptService.getPromptsByMode(mode);
    }
}