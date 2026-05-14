package com.kaiyuewei.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.kaiyuewei.AbstractTestcontainers;
import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.CustomerRepository;
import com.kaiyuewei.customer.Gender;
import com.kaiyuewei.llm.FeedbackPipeline;
import com.kaiyuewei.s3.S3Service;
import com.kaiyuewei.session.Feedback;
import com.kaiyuewei.session.FeedbackRepository;
import com.kaiyuewei.session.Session;
import com.kaiyuewei.session.SessionRecordedEvent;
import com.kaiyuewei.session.SessionRepository;
import com.kaiyuewei.session.SessionStatus;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Duration;
import java.util.Optional;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {

                "aws.region=eu-west-1",
                "aws.s3.mock=true",
                "aws.s3.buckets.customer=test-customer-bucket",
                "aws.s3.buckets.sessions=test-sessions-bucket",
                "huggingface.token=test-hf-token",
                "huggingface.whisper.max-attempts=1",
                "huggingface.whisper.retry-delay=PT0.01S",
                "llm.groq.token=test-groq-token",
                "llm.groq.model=test-model",
                "llm.timeout=PT2S",
                "spring.kafka.consumer.auto-offset-reset=earliest"
        }
)
@EmbeddedKafka(partitions = 1, topics = {"session.recorded", "transcript.ready", "feedback.ready"})
class PipelineIntegrationIT extends AbstractTestcontainers {

    private static final WireMockServer WIREMOCK = new WireMockServer(options().dynamicPort());

    @Autowired private CustomerRepository customerRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private FeedbackRepository feedbackRepository;
    @Autowired private S3Service s3Service;
    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;
    @Value("${aws.s3.buckets.sessions}") private String sessionsBucket;

    @BeforeAll
    static void startWireMock() {
        WIREMOCK.start();

        WIREMOCK.stubFor(post(urlPathEqualTo("/whisper"))
                .willReturn(okJson("{\"text\":\"hello um my name is alice like working on speech\"}")));

        WIREMOCK.stubFor(post(urlPathEqualTo("/groq"))
                .willReturn(okJson("""
                        {
                          "choices": [{
                            "message": {
                              "content": "{\\"scores\\":{\\"clarity\\":85,\\"structure\\":80},\\"bullets\\":[{\\"type\\":\\"positive\\",\\"text\\":\\"Strong opening\\"}]}"
                            }
                          }]
                        }
                        """)));

        WIREMOCK.stubFor(post(urlPathEqualTo("/hf"))
                .willReturn(aResponse().withStatus(503)));
    }

    @AfterAll
    static void stopWireMock() {
        WIREMOCK.stop();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("huggingface.whisper.url", () -> WIREMOCK.baseUrl() + "/whisper");
        registry.add("llm.groq.url", () -> WIREMOCK.baseUrl() + "/groq");
        registry.add("llm.hf.url", () -> WIREMOCK.baseUrl() + "/hf");
    }

    @Test
    void fullPipeline_publishSessionRecorded_persistsFeedbackAndUpdatesStatus() {
        Customer customer = customerRepository.save(new Customer(
                "Pipeline Tester", "pipeline-" + System.nanoTime() + "@test.com",
                "hashed", 30, Gender.FEMALE));

        Session session = new Session();
        session.setUser(customer);
        session.setStatus(SessionStatus.RECORDING);
        String audioKey = "sessions/" + customer.getId() + "/audio-" + System.nanoTime() + ".webm";
        session.setAudioS3Key(audioKey);
        session.setDurationSeconds(8);
        Session saved = sessionRepository.save(session);

        s3Service.putObject(sessionsBucket, audioKey, new byte[]{1, 2, 3, 4, 5});

        kafkaTemplate.send("session.recorded",
                String.valueOf(saved.getId()),
                new SessionRecordedEvent(saved.getId(), audioKey));

        await().atMost(Duration.ofSeconds(30))
                .pollInterval(Duration.ofMillis(250))
                .untilAsserted(() -> {
                    Optional<Feedback> feedback = feedbackRepository.findBySessionId(saved.getId());
                    assertThat(feedback).isPresent();
                    assertThat(feedback.get().getScores()).contains("clarity", "85");
                    assertThat(feedback.get().getBullets()).contains("Strong opening");

                    Session reloaded = sessionRepository.findById(saved.getId()).orElseThrow();
                    assertThat(reloaded.getStatus()).isEqualTo(SessionStatus.SCORED);
                });
    }
}