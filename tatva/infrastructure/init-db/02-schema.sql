-- =============================================================================
-- TATVA — PostgreSQL Schema
-- Operational metadata, audit trail, user accounts, alert management
-- =============================================================================
-- Tables: users, audit_log, ingestion_sources, ingestion_runs,
--         alert_rules, alert_events, entity_watchlist, report_history, api_keys
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Users — RBAC roles + clearance levels (0–5)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'VIEWER'
                    CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER', 'API_CONSUMER')),
    clearance_level SMALLINT     NOT NULL DEFAULT 0
                    CHECK (clearance_level BETWEEN 0 AND 5),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    mfa_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
    mfa_secret      TEXT,
    max_sessions    SMALLINT     NOT NULL DEFAULT 3,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- 2. Audit Log — IMMUTABLE (append-only, trigger blocks UPDATE/DELETE)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    timestamp       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_id         UUID,
    action          VARCHAR(50)  NOT NULL,
    resource_type   VARCHAR(50)  NOT NULL,
    resource_id     VARCHAR(255),
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    session_id      UUID,
    justification   TEXT,
    details         JSONB
);

CREATE INDEX idx_audit_log_timestamp ON audit_log (timestamp DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log (user_id);
CREATE INDEX idx_audit_log_action ON audit_log (action);
CREATE INDEX idx_audit_log_resource ON audit_log (resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- 3. Ingestion Sources — RSS feeds, APIs, scrapers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    source_type     VARCHAR(30)  NOT NULL DEFAULT 'RSS'
                    CHECK (source_type IN ('RSS', 'API', 'SCRAPER', 'FILE_UPLOAD', 'WEBHOOK')),
    url             TEXT,
    source_tier     SMALLINT     NOT NULL DEFAULT 3
                    CHECK (source_tier BETWEEN 1 AND 5),
    rate_limit_rpm  INT          NOT NULL DEFAULT 60,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    config          JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingestion_sources_type ON ingestion_sources (source_type);
CREATE INDEX idx_ingestion_sources_active ON ingestion_sources (is_active);

-- ---------------------------------------------------------------------------
-- 4. Ingestion Runs — Per-source history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id              BIGSERIAL PRIMARY KEY,
    source_id       UUID         NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'RUNNING'
                    CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    articles_found  INT          NOT NULL DEFAULT 0,
    articles_new    INT          NOT NULL DEFAULT 0,
    entities_found  INT          NOT NULL DEFAULT 0,
    errors          INT          NOT NULL DEFAULT 0,
    error_details   JSONB
);

CREATE INDEX idx_ingestion_runs_source ON ingestion_runs (source_id);
CREATE INDEX idx_ingestion_runs_status ON ingestion_runs (status);
CREATE INDEX idx_ingestion_runs_started ON ingestion_runs (started_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Alert Rules — User-defined alert configurations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    alert_type      VARCHAR(30)  NOT NULL
                    CHECK (alert_type IN (
                        'ENTITY_ALERT', 'RELATIONSHIP_ALERT', 'ANOMALY_ALERT',
                        'CONTRADICTION_ALERT', 'THRESHOLD_ALERT', 'TREND_ALERT'
                    )),
    conditions      JSONB        NOT NULL DEFAULT '{}',
    channels        JSONB        NOT NULL DEFAULT '["DASHBOARD"]',
    priority        VARCHAR(10)  NOT NULL DEFAULT 'INFO'
                    CHECK (priority IN ('INFO', 'WARNING', 'CRITICAL', 'FLASH')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_user ON alert_rules (user_id);
CREATE INDEX idx_alert_rules_type ON alert_rules (alert_type);
CREATE INDEX idx_alert_rules_active ON alert_rules (is_active);

-- ---------------------------------------------------------------------------
-- 6. Alert Events — Fired alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_events (
    id              BIGSERIAL PRIMARY KEY,
    rule_id         UUID         REFERENCES alert_rules(id) ON DELETE SET NULL,
    alert_type      VARCHAR(30)  NOT NULL,
    priority        VARCHAR(10)  NOT NULL DEFAULT 'INFO',
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    entity_ids      JSONB        NOT NULL DEFAULT '[]',
    status          VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                    CHECK (status IN ('NEW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
    acknowledged_by UUID         REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    fired_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    metadata        JSONB        NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_alert_events_status ON alert_events (status);
CREATE INDEX idx_alert_events_priority ON alert_events (priority);
CREATE INDEX idx_alert_events_fired ON alert_events (fired_at DESC);

-- ---------------------------------------------------------------------------
-- 7. Entity Watchlist — User → entity tracking for daily digest
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_watchlist (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_graph_id VARCHAR(255) NOT NULL,
    entity_name     VARCHAR(500) NOT NULL,
    entity_type     VARCHAR(50),
    notify_channels JSONB        NOT NULL DEFAULT '["DASHBOARD", "EMAIL"]',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, entity_graph_id)
);

CREATE INDEX idx_watchlist_user ON entity_watchlist (user_id);
CREATE INDEX idx_watchlist_entity ON entity_watchlist (entity_graph_id);

-- ---------------------------------------------------------------------------
-- 8. Report History — Generated reports with classification + download log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type         VARCHAR(30)  NOT NULL
                        CHECK (report_type IN (
                            'INTELLIGENCE_BRIEF', 'SITREP', 'THREAT_ASSESSMENT',
                            'ECONOMIC_IMPACT', 'FLASH_REPORT', 'DAILY_SUMMARY',
                            'CUSTOM'
                        )),
    title               VARCHAR(500) NOT NULL,
    classification      VARCHAR(20)  NOT NULL DEFAULT 'INTERNAL'
                        CHECK (classification IN (
                            'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'
                        )),
    entity_ids          JSONB        NOT NULL DEFAULT '[]',
    parameters          JSONB        NOT NULL DEFAULT '{}',
    storage_path        TEXT,
    format              VARCHAR(10)  NOT NULL DEFAULT 'PDF'
                        CHECK (format IN ('PDF', 'DOCX', 'MARKDOWN', 'JSON')),
    watermark_user_id   UUID         REFERENCES users(id),
    generated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    download_count      INT          NOT NULL DEFAULT 0,
    last_downloaded_at  TIMESTAMPTZ
);

CREATE INDEX idx_report_user ON report_history (user_id);
CREATE INDEX idx_report_type ON report_history (report_type);
CREATE INDEX idx_report_classification ON report_history (classification);
CREATE INDEX idx_report_generated ON report_history (generated_at DESC);

-- ---------------------------------------------------------------------------
-- 9. API Keys — Management with 90-day rotation enforcement
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash        TEXT         NOT NULL UNIQUE,
    key_prefix      VARCHAR(10)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    rate_limit_rpm  INT          NOT NULL DEFAULT 1000,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    last_used_at    TIMESTAMPTZ,
    rotated_from    UUID         REFERENCES api_keys(id)
);

CREATE INDEX idx_api_keys_user ON api_keys (user_id);
CREATE INDEX idx_api_keys_active ON api_keys (is_active);
CREATE INDEX idx_api_keys_expires ON api_keys (expires_at);

-- =============================================================================
-- Schema created successfully
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'TATVA schema: 9 tables created successfully!';
END $$;
