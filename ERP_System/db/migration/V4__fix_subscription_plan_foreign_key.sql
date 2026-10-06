-- ============================================================================
-- Migration: Fix Subscription Plan Foreign Key Target
-- Version: V4__fix_subscription_plan_foreign_key.sql
-- Project: Cloud ERP (hm566339/cloudERP)
--
-- ROOT CAUSE:
-- In phase-2 migration, table 'subscription' was created with:
--   plan_id uuid REFERENCES plan(id)
-- with constraint name 'fk8lkqdq029r91j37wwfkc4k5ci'.
-- Later, the application's persistent entity model evolved to 'SubscriptionPlan'
-- mapped to table 'subscription_plan'.
-- Because Hibernate ddl-auto:update does not drop or re-target foreign keys,
-- inserting a subscription with plan_id pointing to a persistent SubscriptionPlan
-- caused:
--   ERROR: insert or update on table "subscription" violates foreign key constraint
--   "fk8lkqdq029r91j37wwfkc4k5ci"
--   Detail: Key (plan_id)=(...) is not present in table "plan".
--
-- FIX:
-- 1. Sync any existing subscription_plan records into table 'plan' if 'plan' exists,
--    so legacy queries or references remain intact.
-- 2. Drop the legacy foreign key constraint pointing to table 'plan'.
-- 3. Add foreign key constraint on subscription(plan_id) referencing subscription_plan(id).
-- 4. Create index on subscription(plan_id) if not present.
-- ============================================================================

-- 1. Synchronize records into legacy 'plan' table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan') THEN
        INSERT INTO plan (id, code, name, trial_days, active, created_at, updated_at)
        SELECT id, code, name, duration_days, active, COALESCE(created_at, NOW()), COALESCE(updated_at, NOW())
        FROM subscription_plan
        ON CONFLICT (id) DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            trial_days = EXCLUDED.trial_days,
            active = EXCLUDED.active,
            updated_at = EXCLUDED.updated_at;
    END IF;
END $$;

-- 2. Drop old foreign key constraint(s) on subscription(plan_id)
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
        WHERE tc.table_name = 'subscription'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'plan_id'
    ) LOOP
        EXECUTE 'ALTER TABLE subscription DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped old FK constraint % on subscription(plan_id)', r.constraint_name;
    END LOOP;
END $$;

-- Drop by explicit Hibernate name if still present
ALTER TABLE subscription
    DROP CONSTRAINT IF EXISTS fk8lkqdq029r91j37wwfkc4k5ci;

-- 3. Re-create foreign key constraint pointing to subscription_plan(id)
ALTER TABLE subscription
    ADD CONSTRAINT fk8lkqdq029r91j37wwfkc4k5ci
    FOREIGN KEY (plan_id)
    REFERENCES subscription_plan(id);

-- 4. Ensure index on subscription(plan_id)
CREATE INDEX IF NOT EXISTS idx_subscription_plan_id
    ON subscription(plan_id);
