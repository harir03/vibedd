-- =============================================================================
-- TATVA — Audit Log Append-Only Trigger
-- Blocks UPDATE and DELETE on audit_log table (government-grade immutability)
-- =============================================================================

-- Trigger function: reject any UPDATE or DELETE on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only. % operations are not permitted.',
        TG_OP
        USING HINT = 'Audit log entries cannot be modified or deleted for compliance.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Block UPDATE
DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Block DELETE
DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON audit_log;
CREATE TRIGGER trg_audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- Verify
DO $$
BEGIN
    RAISE NOTICE 'TATVA audit_log: append-only triggers installed!';
END $$;
