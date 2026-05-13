package com.kaiyuewei.whisper;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;

class WhisperServiceTest {

    private WireMockServer wireMock;
    private WhisperService whisperService;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(options().dynamicPort());
        wireMock.start();
        whisperService = new WhisperService(
                WebClient.builder(),
                "test-token",
                wireMock.baseUrl() + "/models/openai/whisper-large-v3",
                3,
                Duration.ofMillis(10)
        );
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void transcribe_validResponse_returnsText() {
        wireMock.stubFor(post(urlEqualTo("/models/openai/whisper-large-v3"))
                .willReturn(okJson("{\"text\":\"hello world\"}")));

        String text = whisperService.transcribe(new byte[]{1, 2, 3});

        assertThat(text).isEqualTo("hello world");
        wireMock.verify(postRequestedFor(urlEqualTo("/models/openai/whisper-large-v3"))
                .withHeader("Authorization", equalTo("Bearer test-token")));
    }

    @Test
    void transcribe_503TwiceThen200_retriesAndSucceeds() {
        String url = "/models/openai/whisper-large-v3";
        wireMock.stubFor(post(urlEqualTo(url))
                .inScenario("retry")
                .whenScenarioStateIs(com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED)
                .willReturn(aResponse().withStatus(503))
                .willSetStateTo("attempt2"));
        wireMock.stubFor(post(urlEqualTo(url))
                .inScenario("retry")
                .whenScenarioStateIs("attempt2")
                .willReturn(aResponse().withStatus(503))
                .willSetStateTo("attempt3"));
        wireMock.stubFor(post(urlEqualTo(url))
                .inScenario("retry")
                .whenScenarioStateIs("attempt3")
                .willReturn(okJson("{\"text\":\"finally ready\"}")));

        String text = whisperService.transcribe(new byte[]{1});

        assertThat(text).isEqualTo("finally ready");
        wireMock.verify(3, postRequestedFor(urlEqualTo(url)));
    }

    @Test
    void transcribe_persistent503_failsAfterMaxAttempts() {
        wireMock.stubFor(post(urlEqualTo("/models/openai/whisper-large-v3"))
                .willReturn(aResponse().withStatus(503)));

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> whisperService.transcribe(new byte[]{1})
        ).isInstanceOf(RuntimeException.class);

        wireMock.verify(3, postRequestedFor(urlEqualTo("/models/openai/whisper-large-v3")));
    }
}
