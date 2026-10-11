-- ==============================================================================
-- Cloud ERP - Authentication & Foreign Key Hardening Migration & Diagnostics
-- Target Service: ERP_System (erp-auth-service)
-- Database: PostgreSQL (sso / erp_auth)
-- ==============================================================================
-- This script contains:
-- Part 1: Safe, Read-Only Diagnostic Queries
-- Part 2: Production Schema Hardening Migration DDL
-- Part 3: Post-Migration Verification Queries
-- ==============================================================================

-- ==============================================================================
-- PART 1: READ-ONLY DIAGNOSTIC QUERIES
-- Run these queries first to understand the exact state of your database.
-- ==============================================================================

-- Diagnostic 1: Check existing foreign key constraint on refresh_token_record(session_id)
-- Shows constraint name, referenced table, and delete_rule (RESTRICT vs CASCADE)
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'refresh_token_record' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'session_id';

-- Diagnostic 2: Count orphaned refresh_token_record rows pointing to non-existent sessions
SELECT COUNT(*) AS orphaned_refresh_token_count
FROM refresh_token_record r
LEFT JOIN session s ON r.session_id = s.id
WHERE s.id IS NULL;

-- Diagnostic 3: Find expired sessions that still have refresh_token_record rows
SELECT s.id AS session_id, s.refresh_token_valid_till, COUNT(r.id) AS active_token_records
FROM session s
JOIN refresh_token_record r ON r.session_id = s.id
WHERE s.refresh_token_valid_till <= CURRENT_TIMESTAMP
GROUP BY s.id, s.refresh_token_valid_till;

-- Diagnostic 4: Find case-insensitive duplicate usernames within the same company
SELECT 
    company_id, 
    LOWER(username) AS normalized_username, 
    COUNT(*) AS user_count, 
    ARRAY_AGG(id) AS user_ids, 
    ARRAY_AGG(username) AS raw_usernames
FROM "user"
GROUP BY company_id, LOWER(username)
HAVING COUNT(*) > 1;

-- Diagnostic 5: Find case-insensitive duplicate emails within the same company
SELECT 
    company_id, 
    LOWER(email) AS normalized_email, 
    COUNT(*) AS user_count, 
    ARRAY_AGG(id) AS user_ids, 
    ARRAY_AGG(email) AS raw_emails
FROM "user"
GROUP BY company_id, LOWER(email)
HAVING COUNT(*) > 1;

-- Diagnostic 6: Find cross-company email conflicts (e.g., admin email used across multiple companies)
SELECT 
    LOWER(u.email) AS email, 
    COUNT(DISTINCT u.company_id) AS company_count, 
    ARRAY_AGG(c.company_code) AS company_codes, 
    ARRAY_AGG(u.id) AS user_ids
FROM "user" u
JOIN company c ON u.company_id = c.id
GROUP BY LOWER(u.email)
HAVING COUNT(DISTINCT u.company_id) > 1;

-- Diagnostic 7: Find username vs email collisions (where User A username matches User B email)
SELECT 
    u1.id AS user1_id, u1.username AS user1_username, c1.company_code AS user1_company,
    u2.id AS user2_id, u2.email AS user2_email, c2.company_code AS user2_company
FROM "user" u1
JOIN company c1 ON u1.company_id = c1.id
JOIN "user" u2 ON LOWER(u1.username) = LOWER(u2.email) AND u1.id != u2.id
JOIN company c2 ON u2.company_id = c2.id;


-- ==============================================================================
-- PART 2: IDEMPOTENT PRODUCTION SCHEMA HARDENING MIGRATION DDL
-- This DDL is safe to run manually via psql OR will run automatically on startup
-- via DatabaseSchemaBootstrap.java.
-- ==============================================================================

-- 1. Safely purge invalid orphaned child records so FK modification cannot fail
DELETE FROM refresh_token_record
WHERE session_id IS NULL
   OR session_id NOT IN (SELECT id FROM session);

-- 2. Drop existing foreign key constraint(s) on refresh_token_record(session_id)
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

-- 3. Add hardened foreign key constraint with ON DELETE CASCADE
ALTER TABLE refresh_token_record
    ADD CONSTRAINT fkiqef9ces3kb0fssekw7k0dm4x
    FOREIGN KEY (session_id)
    REFERENCES session (id)
    ON DELETE CASCADE;

-- 4. Create index on session_id for query speed and fast cascaded deletions
CREATE INDEX IF NOT EXISTS idx_refresh_token_record_session_id
    ON refresh_token_record (session_id);

-- 5. Create case-insensitive unique indexes on "user" table (if no dirty duplicates exist)
DO $$
BEGIN
    -- Only create index if no case-insensitive duplicate usernames exist
    IF NOT EXISTS (
        SELECT 1 FROM (
            SELECT company_id, LOWER(username)
            FROM "user"
            GROUP BY company_id, LOWER(username)
            HAVING COUNT(*) > 1
        ) d1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_user_company_lower_username
            ON "user" (company_id, LOWER(username));
        RAISE NOTICE 'Created unique index uq_user_company_lower_username';
    ELSE
        RAISE WARNING 'Skipping uq_user_company_lower_username because duplicate usernames exist. Review Diagnostic 4.';
    END IF;

    -- Only create index if no case-insensitive duplicate emails exist
    IF NOT EXISTS (
        SELECT 1 FROM (
            SELECT company_id, LOWER(email)
            FROM "user"
            GROUP BY company_id, LOWER(email)
            HAVING COUNT(*) > 1
        ) d2
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS uq_user_company_lower_email
            ON "user" (company_id, LOWER(email));
        RAISE NOTICE 'Created unique index uq_user_company_lower_email';
    ELSE
        RAISE WARNING 'Skipping uq_user_company_lower_email because duplicate emails exist. Review Diagnostic 5.';
    END IF;
END $$;


-- ==============================================================================
-- PART 3: POST-MIGRATION VERIFICATION
-- ==============================================================================

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
        RAISE NOTICE 'VERIFICATION SUCCESS: Foreign key on refresh_token_record is configured with ON DELETE CASCADE.';
    ELSE
        RAISE EXCEPTION 'VERIFICATION FAILED: Foreign key on refresh_token_record is not CASCADE.';
    END IF;
END $$;
