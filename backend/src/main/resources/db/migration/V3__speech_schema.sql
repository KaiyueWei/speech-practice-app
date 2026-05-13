CREATE TABLE prompts (
    id         BIGSERIAL PRIMARY KEY,
    text       TEXT NOT NULL,
    mode       TEXT NOT NULL CHECK (mode IN ('IMPROMPTU', 'PREPARED', 'INTERVIEW', 'DEBATE')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    category   TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    prompt_id        BIGINT REFERENCES prompts(id),
    status           TEXT NOT NULL CHECK (status
                                              IN ('PENDING', 'RECORDING', 'TRANSCRIBED', 'SCORED', 'FAILED')),
    audio_s3_key     TEXT,
    duration_seconds INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transcripts (
    id           BIGSERIAL PRIMARY KEY,
    session_id   BIGINT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    wpm          INT,
    filler_words JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    scores     JSONB NOT NULL DEFAULT '{}',
    bullets    JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);