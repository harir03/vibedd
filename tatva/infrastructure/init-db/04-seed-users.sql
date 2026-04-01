-- =============================================================================
-- TATVA — Seed Users
-- Default admin + demo analyst accounts for development
-- =============================================================================
-- NOTE: Passwords are bcrypt hashed. DO NOT use these in production.
-- Default passwords:
--   admin    → admin123
--   analyst  → analyst123
--   viewer   → viewer123
-- =============================================================================

-- Admin user (clearance 5, full access)
INSERT INTO users (username, email, password_hash, role, clearance_level, is_active, mfa_enabled)
VALUES (
    'admin',
    'admin@tatva.gov.in',
    crypt('admin123', gen_salt('bf', 12)),
    'ADMIN',
    5,
    TRUE,
    FALSE
) ON CONFLICT (username) DO NOTHING;

-- Demo analyst (clearance 3)
INSERT INTO users (username, email, password_hash, role, clearance_level, is_active, mfa_enabled)
VALUES (
    'analyst',
    'analyst@tatva.gov.in',
    crypt('analyst123', gen_salt('bf', 12)),
    'ANALYST',
    3,
    TRUE,
    FALSE
) ON CONFLICT (username) DO NOTHING;

-- Demo viewer (clearance 1)
INSERT INTO users (username, email, password_hash, role, clearance_level, is_active, mfa_enabled)
VALUES (
    'viewer',
    'viewer@tatva.gov.in',
    crypt('viewer123', gen_salt('bf', 12)),
    'VIEWER',
    1,
    TRUE,
    FALSE
) ON CONFLICT (username) DO NOTHING;

-- Seed initial ingestion sources (top-tier news agencies)
INSERT INTO ingestion_sources (name, source_type, url, source_tier, rate_limit_rpm, is_active)
VALUES
    ('Reuters World News',      'RSS', 'https://www.reutersagency.com/feed/',             1, 30, TRUE),
    ('PTI National',            'RSS', 'https://www.ptinews.com/feed/',                   1, 30, TRUE),
    ('The Hindu International', 'RSS', 'https://www.thehindu.com/news/international/?service=rss', 2, 20, TRUE),
    ('NDTV World',              'RSS', 'https://feeds.feedburner.com/ndtvnews-world-news', 2, 20, TRUE),
    ('Al Jazeera',              'RSS', 'https://www.aljazeera.com/xml/rss/all.xml',       2, 20, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Log the seeding
INSERT INTO audit_log (action, resource_type, details)
VALUES (
    'SYSTEM_SEED',
    'system',
    '{"description": "Initial seed data loaded: 3 users, 5 ingestion sources"}'::JSONB
);

-- Verify
DO $$
DECLARE
    user_count INT;
    source_count INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO source_count FROM ingestion_sources;
    RAISE NOTICE 'TATVA seed data: % users, % ingestion sources loaded!', user_count, source_count;
END $$;
