-- ==============================================================================
-- V16: Forward-only update for user_token token_type CHECK constraint
-- Resolves production constraint error:
--   SQLState: 23514
--   ERROR: new row for relation "user_token" violates check constraint "user_token_token_type_check"
--   Failing value: USER_INVITATION
--
-- Supported Token Types:
--   - EMAIL_VERIFICATION
--   - PASSWORD_RESET
--   - PASSWORD_SETUP
--   - USER_INVITATION
--
-- Idempotent, safe for live production database with zero downtime or data loss.
-- Dynamically resolves schema and removes any conflicting check constraints.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    target_schema TEXT;
BEGIN
    -- Locate the schema where user_token resides (independent of search_path)
    SELECT nsp.nspname INTO target_schema
    FROM pg_class rel
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'user_token'
    LIMIT 1;

    IF target_schema IS NOT NULL THEN
        -- 1. Dynamically drop all check constraints on user_token referencing token_type
        FOR r IN (
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = 'user_token'
              AND nsp.nspname = target_schema
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) ILIKE '%token_type%'
        ) LOOP
            EXECUTE format('ALTER TABLE %I.user_token DROP CONSTRAINT IF EXISTS %I', target_schema, r.conname);
        END LOOP;

        -- Explicit drop in case constraint exists with default name
        EXECUTE format('ALTER TABLE %I.user_token DROP CONSTRAINT IF EXISTS user_token_token_type_check', target_schema);

        -- 2. Add updated CHECK constraint supporting all four TokenType values
        EXECUTE format(
            'ALTER TABLE %I.user_token ADD CONSTRAINT user_token_token_type_check CHECK (token_type IN (%L, %L, %L, %L))',
            target_schema,
            'EMAIL_VERIFICATION',
            'PASSWORD_RESET',
            'PASSWORD_SETUP',
            'USER_INVITATION'
        );

        -- 3. Ensure module_id is nullable for organization-level invitation tokens
        EXECUTE format('ALTER TABLE %I.user_token ALTER COLUMN module_id DROP NOT NULL', target_schema);
    END IF;
END $$;

-- 4. Create performance index if not exists
CREATE INDEX IF NOT EXISTS idx_user_token_user_type_used 
    ON user_token (user_id, token_type, used, expires_at);
