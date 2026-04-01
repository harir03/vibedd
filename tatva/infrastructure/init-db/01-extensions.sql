-- =============================================================================
-- TATVA — PostgreSQL Initialization Script
-- Enables required extensions on first container start
-- =============================================================================

-- Enable cryptographic functions (password hashing, encryption)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable UUID generation (primary keys, API keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
DO $$
BEGIN
    RAISE NOTICE 'pgcrypto installed: true';
    RAISE NOTICE 'uuid-ossp installed: true';
    RAISE NOTICE 'TATVA database initialized successfully!';
END $$;

