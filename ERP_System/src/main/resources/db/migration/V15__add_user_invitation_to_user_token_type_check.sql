-- ==============================================================================
-- V15: Add USER_INVITATION to user_token token_type check constraint
-- Resolves production issue:
--   SQLState: 23514
--   ERROR: new row for relation "user_token" violates check constraint "user_token_token_type_check"
--   Failing row contains: token_type = USER_INVITATION
--
-- Supported Token Types:
--   - EMAIL_VERIFICATION
--   - PASSWORD_RESET
--   - PASSWORD_SETUP
--   - USER_INVITATION
--
-- Idempotent, safe for live production database with zero data loss.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Only execute if the user_token table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = CURRENT_SCHEMA() 
          AND table_name = 'user_token'
    ) THEN
        -- 1. Drop existing user_token_token_type_check if present
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_token_token_type_check'
        ) THEN
            ALTER TABLE user_token DROP CONSTRAINT user_token_token_type_check;
        END IF;

        -- 2. Also dynamically remove any other check constraint referencing token_type
        FOR r IN (
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = 'user_token'
              AND nsp.nspname = CURRENT_SCHEMA()
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) ILIKE '%token_type%'
        ) LOOP
            EXECUTE 'ALTER TABLE user_token DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END LOOP;

        -- 3. Add updated constraint supporting all current TokenType values
        ALTER TABLE user_token ADD CONSTRAINT user_token_token_type_check
            CHECK (token_type IN (
                'EMAIL_VERIFICATION',
                'PASSWORD_RESET',
                'PASSWORD_SETUP',
                'USER_INVITATION'
            ));

        -- 4. Ensure module_id is nullable for organization-level invitation tokens
        ALTER TABLE user_token ALTER COLUMN module_id DROP NOT NULL;
    END IF;
END $$;

-- 5. Add index on lookup criteria for fast invitation token queries
CREATE INDEX IF NOT EXISTS idx_user_token_user_type_used 
    ON user_token (user_id, token_type, used, expires_at);

