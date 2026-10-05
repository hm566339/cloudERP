-- ============================================================================
-- Razorpay Production Hardening Migration
-- Project: Cloud ERP (hm566339/cloudERP)
-- Generated: 2026-10-06
--
-- NOTE: This project uses Hibernate ddl-auto:update (no Flyway/Liquibase).
-- This file is provided as a REFERENCE and for manual execution on production.
-- Apply ONCE to a production database that already has the base tables.
-- All statements are guarded with IF NOT EXISTS / column existence checks.
-- ============================================================================

-- ============================================================================
-- 1. subscription table — Razorpay + price immutability columns
-- ============================================================================

-- Razorpay subscription ID (used for webhook lookup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_subscription_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_subscription_id VARCHAR(100);
    END IF;
END $$;

-- Razorpay plan ID (stored on subscription for reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_plan_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_plan_id VARCHAR(100);
    END IF;
END $$;

-- Razorpay customer ID
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_customer_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_customer_id VARCHAR(100);
    END IF;
END $$;

-- Next billing date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='next_billing_date'
    ) THEN
        ALTER TABLE subscription ADD COLUMN next_billing_date TIMESTAMP;
    END IF;
END $$;

-- IMMUTABLE price snapshot at time of subscription checkout
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='price_at_subscription'
    ) THEN
        ALTER TABLE subscription ADD COLUMN price_at_subscription NUMERIC(19, 4);
    END IF;
END $$;

-- Plan version code at time of subscription checkout (e.g. "v1", "v2")
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='plan_version_code'
    ) THEN
        ALTER TABLE subscription ADD COLUMN plan_version_code VARCHAR(120);
    END IF;
END $$;

-- Performance indexes on subscription
CREATE INDEX IF NOT EXISTS idx_subscription_org_status
    ON subscription (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_subscription_razorpay_sub_id
    ON subscription (razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_razorpay_plan_id
    ON subscription (razorpay_plan_id);

-- ============================================================================
-- 2. subscription_plan table — Razorpay plan ID + version
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription_plan' AND column_name='razorpay_plan_id'
    ) THEN
        ALTER TABLE subscription_plan ADD COLUMN razorpay_plan_id VARCHAR(100);
    END IF;
END $$;

-- Plan version label (e.g. "v1", "v2") — incremented when price changes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription_plan' AND column_name='plan_version'
    ) THEN
        ALTER TABLE subscription_plan ADD COLUMN plan_version VARCHAR(50) DEFAULT 'v1';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_plan_razorpay
    ON subscription_plan (razorpay_plan_id);

-- ============================================================================
-- 3. payment table — Razorpay fields + organization FK
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='organization_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN organization_id UUID REFERENCES organization(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='razorpay_payment_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN razorpay_payment_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='razorpay_order_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN razorpay_order_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='razorpay_subscription_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN razorpay_subscription_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='razorpay_signature'
    ) THEN
        ALTER TABLE payment ADD COLUMN razorpay_signature VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='paid_at'
    ) THEN
        ALTER TABLE payment ADD COLUMN paid_at TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='updated_at'
    ) THEN
        ALTER TABLE payment ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;

-- Unique constraint prevents duplicate Payment records for same Razorpay payment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='payment' AND constraint_name='uk_payment_provider_id'
    ) THEN
        ALTER TABLE payment ADD CONSTRAINT uk_payment_provider_id UNIQUE (provider, provider_payment_id);
    END IF;
END $$;

-- Performance indexes on payment
CREATE INDEX IF NOT EXISTS idx_payment_razorpay_payment_id
    ON payment (razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_razorpay_sub_id
    ON payment (razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_subscription_id
    ON payment (subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_organization_id
    ON payment (organization_id);

-- ============================================================================
-- 4. payment_event table — idempotency store for webhooks
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='provider'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN provider VARCHAR(80) NOT NULL DEFAULT 'razorpay';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='provider_event_id'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN provider_event_id VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='event_type'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN event_type VARCHAR(120) NOT NULL DEFAULT '';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='signature_verified'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN signature_verified BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='payload'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN payload TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='processing_status'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN processing_status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='processed_at'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN processed_at TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment_event' AND column_name='error_message'
    ) THEN
        ALTER TABLE payment_event ADD COLUMN error_message VARCHAR(1000);
    END IF;
END $$;

-- Unique constraint for webhook idempotency (critical — prevents duplicate processing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='payment_event' AND constraint_name='uk_payment_event_provider_id'
    ) THEN
        ALTER TABLE payment_event ADD CONSTRAINT uk_payment_event_provider_id UNIQUE (provider, provider_event_id);
    END IF;
END $$;

-- Performance indexes on payment_event
CREATE INDEX IF NOT EXISTS idx_payment_event_provider_event
    ON payment_event (provider, provider_event_id);

CREATE INDEX IF NOT EXISTS idx_payment_event_status
    ON payment_event (processing_status);

CREATE INDEX IF NOT EXISTS idx_payment_event_created_at
    ON payment_event (created_at);

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm)
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscription' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payment' ORDER BY column_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payment_event' ORDER BY column_name;
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('subscription', 'payment', 'payment_event', 'subscription_plan');
-- SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type='UNIQUE';
