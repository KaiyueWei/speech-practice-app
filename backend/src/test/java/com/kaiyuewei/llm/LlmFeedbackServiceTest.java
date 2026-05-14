package com.kaiyuewei.llm;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LlmFeedbackServiceTest {

    private static final String GROQ_PATH = "/openai/v1/chat/completions";
    private static final String HF_PATH = "/models/mistralai/Mistral-7B-Instruct-v0.2";

    private WireMockServer wireMock;
    private LlmFeedbackService service;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(options().dynamicPort());
        wireMock.start();
        service = new LlmFeedbackService(
                WebClient.builder(),
                wireMock.baseUrl() + GROQ_PATH, "groq-token", "test-groq-model",
                wireMock.baseUrl() + HF_PATH, "test-hf-model", "hf-token",
                Duration.ofMillis(200));
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void generate_groqSucceeds_returnsGroqText() {
        wireMock.stubFor(post(urlEqualTo(GROQ_PATH))
                .willReturn(okJson("{\"choices\":[{\"message\":{\"content\":\"GROQ RESULT\"}}]}")));

        String result = service.generate("any prompt");

        assertThat(result).isEqualTo("GROQ RESULT");
        wireMock.verify(1, postRequestedFor(urlEqualTo(GROQ_PATH)));
        wireMock.verify(0, postRequestedFor(urlEqualTo(HF_PATH)));
    }

    @Test
    void generate_groqTimesOut_fallsBackToHf() {
        wireMock.stubFor(post(urlEqualTo(GROQ_PATH))
                .willReturn(aResponse().withFixedDelay(2000).withStatus(200)));
        wireMock.stubFor(post(urlEqualTo(HF_PATH))
                .willReturn(okJson("{\"choices\":[{\"message\":{\"content\":\"HF RESULT\"}}]}")));

        String result = service.generate("any prompt");

        assertThat(result).isEqualTo("HF RESULT");
        wireMock.verify(1, postRequestedFor(urlEqualTo(HF_PATH)));
    }

    @Test
    void generate_groq5xx_fallsBackToHf() {
        wireMock.stubFor(post(urlEqualTo(GROQ_PATH))
                .willReturn(aResponse().withStatus(500)));
        wireMock.stubFor(post(urlEqualTo(HF_PATH))
                .willReturn(okJson("{\"choices\":[{\"message\":{\"content\":\"HF SECOND\"}}]}")));

        String result = service.generate("any prompt");

        assertThat(result).isEqualTo("HF SECOND");
    }

    @Test
    void generate_bothFail_throws() {
        wireMock.stubFor(post(urlEqualTo(GROQ_PATH))
                .willReturn(aResponse().withStatus(500)));
        wireMock.stubFor(post(urlEqualTo(HF_PATH))
                .willReturn(aResponse().withStatus(500)));

        assertThatThrownBy(() -> service.generate("any prompt"))
                .isInstanceOf(RuntimeException.class);
    }
}
