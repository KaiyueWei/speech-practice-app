package com.kaiyuewei.prompt;

import com.kaiyuewei.customer.CustomerUserDetailsService;
import com.kaiyuewei.exception.DelegatedAuthEntryPoint;
import com.kaiyuewei.jwt.JWTUtil;
import com.kaiyuewei.security.SecurityConfig;
import com.kaiyuewei.security.SecurityFilterChainConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PromptController.class)
@ActiveProfiles("test")
@Import({SecurityConfig.class, SecurityFilterChainConfig.class, DelegatedAuthEntryPoint.class})
class PromptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PromptService promptService;

    @MockitoBean
    private JWTUtil jwtUtil;

    @MockitoBean
    private CustomerUserDetailsService customerUserDetailsService;

    private static final String URL = "/api/v1/prompts";

    @Test
    @WithMockUser
    void getPrompts_validMode_returns200WithTextDifficultyCategory() throws Exception {
        var dto = new PromptResponseDto(1L, "Tell me about yourself", "EASY", "Personal", PromptMode.IMPROMPTU);
        when(promptService.getPromptsByMode(PromptMode.IMPROMPTU)).thenReturn(List.of(dto));

        mockMvc.perform(get(URL).param("mode", "IMPROMPTU"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Tell me about yourself"))
                .andExpect(jsonPath("$[0].difficulty").value("EASY"))
                .andExpect(jsonPath("$[0].category").value("Personal"));
    }

    @Test
    @WithMockUser
    void getPrompts_unknownMode_returns400() throws Exception {
        mockMvc.perform(get(URL).param("mode", "UNKNOWN_MODE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void getPrompts_missingMode_returns400() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPrompts_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get(URL).param("mode", "IMPROMPTU"))
                .andExpect(status().isForbidden());
    }
}