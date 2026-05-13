package com.kaiyuewei.session;

import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.CustomerUserDetailsService;
import com.kaiyuewei.customer.Gender;
import com.kaiyuewei.exception.DelegatedAuthEntryPoint;
import com.kaiyuewei.jwt.JWTUtil;
import com.kaiyuewei.security.SecurityConfig;
import com.kaiyuewei.security.SecurityFilterChainConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@ActiveProfiles("test")
@Import({SecurityConfig.class, SecurityFilterChainConfig.class, DelegatedAuthEntryPoint.class})
class
SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SessionService sessionService;

    @MockitoBean
    private JWTUtil jwtUtil;

    @MockitoBean
    private CustomerUserDetailsService customerUserDetailsService;

    private static final String URL = "/api/v1/sessions";

    private static Customer mockCustomer() {
        return new Customer(1, "Test User", "test@test.com", "password", 25, Gender.MALE);
    }

    private static UsernamePasswordAuthenticationToken authFor(Customer customer) {
        return new UsernamePasswordAuthenticationToken(customer, null, customer.getAuthorities());
    }

    @Test
    void createSession_authenticated_returns201WithSessionIdAndUploadUrl() throws Exception {
        Customer customer = mockCustomer();
        when(sessionService.createSession(customer))
                .thenReturn(new SessionCreateResponse(42L, "http://localhost:9000/bucket/key?mock=presigned"));

        mockMvc.perform(post(URL)
                        .with(authentication(authFor(customer)))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId").value(42))
                .andExpect(jsonPath("$.uploadUrl").exists());
    }

    @Test
    void createSession_unauthenticated_returns403() throws Exception {
        mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void markRecorded_authenticated_returns204() throws Exception {
        Customer customer = mockCustomer();

        mockMvc.perform(patch(URL + "/42/recorded")
                        .with(authentication(authFor(customer))))
                .andExpect(status().isNoContent());
    }

    @Test
    void getSessions_authenticated_returnsPaginatedList() throws Exception {
        Customer customer = mockCustomer();
        var page = new PageImpl<>(List.of(
                new SessionSummaryDto(1L, SessionStatus.RECORDING, "Tell me about yourself", OffsetDateTime.now())
        ));
        when(sessionService.getUserSessions(eq(customer), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get(URL).with(authentication(authFor(customer))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].status").value("RECORDING"));
    }

    @Test
    void getSessionById_scoredSession_returnsTranscriptAndFeedback() throws Exception {
        Customer customer = mockCustomer();
        var detail = new SessionDetailDto(
                1L, SessionStatus.SCORED, "Tell me about yourself",
                "I am a software engineer", 120, "{}", "{}", "[]",
                OffsetDateTime.now()
        );
        when(sessionService.getSessionDetail(1L, customer)).thenReturn(detail);

        mockMvc.perform(get(URL + "/1").with(authentication(authFor(customer))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transcriptText").value("I am a software engineer"))
                .andExpect(jsonPath("$.scores").exists())
                .andExpect(jsonPath("$.status").value("SCORED"));
    }

    @Test
    void getSessionById_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get(URL + "/1"))
                .andExpect(status().isForbidden());
    }
}