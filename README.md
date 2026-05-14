# Speech Practice App

A full-stack speech-coaching app. Users record themselves answering a prompt; an async pipeline transcribes the audio (Whisper), scores it (filler-word density + WPM + pace), and produces structured coaching feedback (LLM), pushed back to the browser live over WebSocket.

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          Browser (React + Vite)                   │
│  PracticeScreen → useMediaRecorder → useWebSocket (STOMP + JWT)   │
└─────┬────────────────────────────────────────────────────▲────────┘
      │ REST /api/v1/* (JWT)                               │ STOMP /ws
      │ PUT /api/v1/sessions/{id}/audio                    │ /topic/feedback/{id}
      ▼                                                    │
┌───────────────────────────────────────────────────────────────────┐
│                  Spring Boot 3 (port 8080)                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  REST Layer                                                │   │
│  │   AuthenticationController     /api/v1/auth                │   │
│  │   CustomerController           /api/v1/customers           │   │
│  │   PromptController             /api/v1/prompts             │   │
│  │   SessionController            /api/v1/sessions            │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  STOMP Broker (/ws + /topic/**)                            │   │
│  │   StompAuthChannelInterceptor — JWT on CONNECT             │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Async pipeline (Spring Kafka)                             │   │
│  │   session.recorded → WhisperConsumer                       │   │
│  │     ├─ HF Whisper (audio→text)                             │   │
│  │     ├─ AnalysisService (fillers, WPM, pace)                │   │
│  │     └─ writes Transcript + transcript.ready                │   │
│  │   transcript.ready → LlmFeedbackConsumer                   │   │
│  │     ├─ Groq Llama 3.3 (primary)                            │   │
│  │     ├─ HF Mistral chat completions (fallback)              │   │
│  │     ├─ FeedbackParser (extracts JSON from prose)           │   │
│  │     └─ writes Feedback + feedback.ready                    │   │
│  │   feedback.ready → FeedbackWebSocketConsumer               │   │
│  │     └─ pushes SessionDetailDto to /topic/feedback/{id}     │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────┬─────────────┬──────────────┬─────────────────────────────────┘
      │ JPA         │ FakeS3 /     │ HTTP (WebClient)
      │             │ S3 SDK       │
      ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────────┐
│ PostgreSQL   │ │ AWS S3       │ │ External APIs                    │
│ sessions     │ │ audio        │ │ HuggingFace Inference Providers  │
│ transcripts  │ │ uploads      │ │   Whisper-large-v3               │
│ feedback     │ │              │ │   Mistral-7B-Instruct (fallback) │
│ prompts      │ │ Local dev:   │ │ Groq                             │
│ customer     │ │ ~/.kaiyuewei │ │   llama-3.3-70b-versatile        │
│ Flyway       │ │   /s3/...    │ │                                  │
└──────────────┘ └──────────────┘ └──────────────────────────────────┘
                                          ▲
                                          │ Kafka topics
                                          ▼
                                  ┌──────────────────┐
                                  │  Apache Kafka    │
                                  │  session.recorded│
                                  │  transcript.ready│
                                  │  feedback.ready  │
                                  └──────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.4, Spring Security 6, Spring Data JPA, Spring Kafka, Spring WebFlux (WebClient), Spring Messaging (STOMP) |
| Auth | JWT (jjwt 0.11.5), BCrypt, custom STOMP channel interceptor |
| Database | PostgreSQL 14, Flyway migrations, JSONB columns for feedback payloads |
| Messaging | Apache Kafka (3 topics: `session.recorded`, `transcript.ready`, `feedback.ready`) |
| Storage | AWS S3 (real) / FakeS3 (local) — backed by `aws.s3.mock` flag |
| AI/ML | HuggingFace Inference Providers (Whisper, Mistral), Groq (Llama 3.3) |
| Frontend | React 18, Vite, @stomp/stompjs + SockJS, Chakra UI |
| Tests | JUnit 5, AssertJ, Mockito, WireMock, Testcontainers, `@EmbeddedKafka`; Vitest + React Testing Library |
| Containerization | Docker, Docker Compose (Postgres, Kafka, Zookeeper, Redis, LocalStack) |
| Cloud | AWS Elastic Beanstalk (eu-west-1) |
| Build | Maven, Google Jib (Docker image push), GitHub Actions |

## Pipeline Sequence

```
User hits Stop                                      User sees feedback
      │                                                     ▲
      ▼                                                     │
POST  /api/v1/sessions                       /topic/feedback/{id}
PUT   /api/v1/sessions/{id}/audio                           │
PATCH /api/v1/sessions/{id}/recorded { durationSeconds }    │
      │                                                     │
      ▼                                                     │
Kafka: session.recorded                                     │
      │                                                     │
      ▼                                                     │
WhisperConsumer → HF Whisper → Transcript saved             │
      │                                                     │
      ▼                                                     │
Kafka: transcript.ready                                     │
      │                                                     │
      ▼                                                     │
LlmFeedbackConsumer → Groq (or HF fallback) → Feedback saved│
      │                                                     │
      ▼                                                     │
Kafka: feedback.ready ────► FeedbackWebSocketConsumer ──────┘
```

## Local Development

### Prerequisites

- **Java 17**
- **Docker Desktop** running
- **Node.js 20+**
- **HuggingFace token** (free) — required for Whisper transcription
- **Groq API key** (free) — optional but recommended; falls back to HF Mistral if absent

### Setup

1. Copy and fill in secrets:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```bash
   export JWT_SECRET="any-32-plus-char-string-for-local"
   export HF_TOKEN="hf_…"                # huggingface.co/settings/tokens (Read scope)
   export GROQ_API_KEY="gsk_…"           # console.groq.com/keys (optional)
   ```
   `.env` is gitignored.

2. Start infrastructure (Postgres, Kafka, Zookeeper):
   ```bash
   docker-compose up -d
   ```

3. Run the backend:
   ```bash
   source .env
   cd backend && mvn spring-boot:run
   ```
   API at `http://localhost:8080`. Kafka consumer groups bind on startup.

4. Run the frontend:
   ```bash
   cd frontend/react && npm install && npm run dev
   ```
   App at `http://localhost:5173`. Vite proxies `/api` and `/ws` to the backend.

5. In the browser: sign up → log in → click **Start recording** → speak → **Stop**. Feedback should appear within ~10–30s (HF Whisper has a cold-start latency).

### Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `JWT_SECRET` | ✅ | – | HMAC-SHA256 signing key, ≥32 chars |
| `HF_TOKEN` | ✅ for transcription | `placeholder` | HuggingFace token |
| `WHISPER_URL` | – | `https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3` | Override if HF migrates again |
| `GROQ_API_KEY` | – | `placeholder` | Primary LLM. HF Mistral runs if absent. |
| `GROQ_MODEL` | – | `llama-3.3-70b-versatile` | |
| `HF_MISTRAL_URL` | – | `https://router.huggingface.co/v1/chat/completions` | |
| `S3_BUCKET` | – | `speech-practice-app` | |
| `MSK_BOOTSTRAP` | – | `localhost:9092` | Kafka bootstrap servers |

### S3 in local dev

`aws.s3.mock: true` (the default) wires a filesystem-backed `FakeS3` that writes audio uploads to `~/.kaiyuewei/s3/<bucket>/<key>`. The frontend uploads via `PUT /api/v1/sessions/{id}/audio` instead of a real S3 presigned URL. Set `aws.s3.mock: false` to use real AWS S3 (requires credentials).

## API Reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | – | Returns JWT in `Authorization` header |
| `POST` | `/api/v1/customers` | – | Register |
| `GET` | `/api/v1/prompts?mode={IMPROMPTU\|PREPARED\|INTERVIEW\|DEBATE}` | JWT | List prompts |
| `POST` | `/api/v1/sessions` | JWT | Create session → `{sessionId, uploadUrl}` |
| `PUT` | `/api/v1/sessions/{id}/audio` | JWT | Upload audio bytes (local-mode endpoint) |
| `PATCH` | `/api/v1/sessions/{id}/recorded` | JWT | Body `{durationSeconds}`; triggers Kafka pipeline |
| `GET` | `/api/v1/sessions` | JWT | Paginated list, scoped to user |
| `GET` | `/api/v1/sessions/{id}` | JWT | Full detail (transcript + feedback) |
| `WS` | `/ws` (STOMP) | JWT in CONNECT frame | Subscribe `/topic/feedback/{sessionId}` for live results |

## Testing

```bash
# Backend unit tests
cd backend && mvn test

# Backend integration tests (requires Docker for Testcontainers)
mvn verify

# Frontend
cd frontend/react && npm test -- --run
```

Coverage:

| Suite | Count |
|---|---|
| Backend unit | ~99 tests |
| Backend integration (`@EmbeddedKafka` + Testcontainers + WireMock) | 2 ITs |
| Frontend (Vitest + RTL) | 56 tests |

External APIs (HuggingFace, Groq) are stubbed via WireMock in tests — no real API calls.

## Project Layout

```
.
├── backend/                    # Spring Boot service
│   └── src/main/java/com/kaiyuewei/
│       ├── auth/               # Login + JWT issuance
│       ├── customer/           # User CRUD
│       ├── prompt/             # Topic catalog
│       ├── session/            # Session lifecycle + DTOs
│       ├── s3/                 # S3Service, FakeS3
│       ├── analysis/           # FillerWordDetector, WpmCalculator, PaceScorer
│       ├── whisper/            # WhisperService + Kafka consumer
│       ├── llm/                # LlmFeedbackService (Groq + HF fallback), parser, consumer
│       ├── websocket/          # WebSocketConfig, STOMP auth, feedback push
│       ├── jwt/                # JWTUtil, JWTAuthenticationFilter
│       └── security/           # SecurityFilterChainConfig, CorsConfig
├── frontend/react/             # React + Vite
│   └── src/
│       ├── components/         # PracticeScreen, TopicCard, FeedbackPanel, etc.
│       ├── hooks/              # useMediaRecorder, useWebSocket, useSessionFlow, useTimer
│       └── services/           # client.js (axios)
├── docker-compose.yml          # Postgres + Kafka + Zookeeper + Redis + LocalStack
└── doc/                        # Implementation plan (HTML)
```

## CI/CD

| Workflow | Trigger | Action |
|---|---|---|
| `backend-ci.yml` | Push to `backend/**` | Build, test, verify |
| `backend-cd.yml` | Push to `main` (`backend/**`) | Build → push Docker image → deploy to Elastic Beanstalk |
| `frontend-react-cd.yml` | Push to `main` (`frontend/react/**`) | Build → push Docker image → deploy |

## Roadmap

- **Phase 5 — Async pipeline** ✅ Analysis service, Whisper worker, LLM worker, end-to-end IT
- **Phase 6 — Live feedback** ✅ STOMP push, JWT on handshake, WS 60s timeout + retry
- **Phase 7 — Production hardening** ⬜ Playwright E2E, Redis session-status cache, mobile responsive, AWS ECS deploy (RDS + MSK + ElastiCache)

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend fails at startup: `Could not resolve placeholder 'JWT_SECRET'` | Forgot to `source .env` before `mvn spring-boot:run` |
| `POST /api/v1/sessions` returns 403 | Stale JWT in `localStorage`. Run `localStorage.clear()` in the browser console and log in again. |
| Status stuck on "Transcribing…" forever | HF Whisper cold start (~10–30s on first call) or `HF_TOKEN` invalid. Check backend log for `WebClientResponseException`. |
| Kafka consumer retry loop on `session.recorded@0` | Poisoned message from a previous run. Reset: `docker-compose down kafka zookeeper && docker-compose up -d kafka zookeeper` |
| Stale `RECORDING` sessions in DB | Run `DELETE FROM sessions WHERE status='RECORDING' AND id NOT IN (SELECT session_id FROM transcripts);` |
