-- ============================================================================
-- Session & Refresh Token Record Foreign Key Hardening Migration
-- Project: Cloud ERP (hm566339/cloudERP)
-- Generated: 2026-10-06
--
-- PURPOSE:
-- Fix foreign key violation (fkiqef9ces3kb0fssekw7k0dm4x) during session deletion
-- and token cleanup:
-- "ERROR: update or delete on table session violates foreign key constraint
--  fkiqef9ces3kb0fssekw7k0dm4x on table refresh_token_record"
--
-- This migration updates the foreign key constraint on refresh_token_record(session_id)
-- to use ON DELETE CASCADE, aligning the PostgreSQL schema with the entity lifecycle
-- and backing up the child-first cleanup logic in TokenCleanupService.
--
-- IDEMPOTENCE:
-- This script can be run multiple times safely.
-- ============================================================================

-- ============================================================================
-- 1. Purge legacy orphaned records (if any exist)
--    Ensures re-adding the foreign key constraint cannot fail due to dirty data.
-- ============================================================================
DELETE FROM refresh_token_record
WHERE session_id IS NULL
   OR session_id NOT IN (SELECT id FROM session);

-- ============================================================================
-- 2. Drop existing foreign key constraint(s) on refresh_token_record(session_id)
-- ============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'refresh_token_record'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'session_id'
    ) LOOP
        EXECUTE 'ALTER TABLE refresh_token_record DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped existing FK constraint % on refresh_token_record(session_id)', r.constraint_name;
    END LOOP;
END $$;

-- Drop by explicit name if present (in case named schema difference)
ALTER TABLE refresh_token_record
    DROP CONSTRAINT IF EXISTS fkiqef9ces3kb0fssekw7k0dm4x;

-- ============================================================================
-- 3. Add foreign key constraint with ON DELETE CASCADE
-- ============================================================================
ALTER TABLE refresh_token_record
    ADD CONSTRAINT fkiqef9ces3kb0fssekw7k0dm4x
    FOREIGN KEY (session_id)
    REFERENCES session (id)
    ON DELETE CASCADE;

-- ============================================================================
-- 4. Ensure index on session_id exists for fast lookups & delete cascades
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_refresh_token_record_session_id
    ON refresh_token_record (session_id);

-- ============================================================================
-- 5. Verification check
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'refresh_token_record'
          AND rc.delete_rule = 'CASCADE'
    ) THEN
        RAISE NOTICE 'SUCCESS: Foreign key on refresh_token_record configured with ON DELETE CASCADE.';
    ELSE
        RAISE EXCEPTION 'FAILED: Foreign key on refresh_token_record is not configured with ON DELETE CASCADE.';
    END IF;
END $$;
