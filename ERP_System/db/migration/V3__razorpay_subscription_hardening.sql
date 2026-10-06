-- ============================================================================
-- Razorpay Production Hardening Migration
-- Version: V3__razorpay_subscription_hardening.sql
-- Project: Cloud ERP (hm566339/cloudERP)
--
-- Adds Razorpay recurring subscription fields, price immutability,
-- payment tracking, webhook event idempotency table, and indexes.
-- All statements are safe and idempotent (IF NOT EXISTS checks).
-- ============================================================================

-- ============================================================================
-- 1. subscription table — Razorpay + price immutability columns
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_subscription_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_subscription_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_plan_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_plan_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_customer_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_customer_id VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='next_billing_date'
    ) THEN
        ALTER TABLE subscription ADD COLUMN next_billing_date TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='price_at_subscription'
    ) THEN
        ALTER TABLE subscription ADD COLUMN price_at_subscription NUMERIC(19, 4);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='plan_version_code'
    ) THEN
        ALTER TABLE subscription ADD COLUMN plan_version_code VARCHAR(120);
    END IF;
END $$;

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='payment' AND constraint_name='uk_payment_provider_id'
    ) THEN
        ALTER TABLE payment ADD CONSTRAINT uk_payment_provider_id UNIQUE (provider, provider_payment_id);
    END IF;
END $$;

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='payment_event' AND constraint_name='uk_payment_event_provider_id'
    ) THEN
        ALTER TABLE payment_event ADD CONSTRAINT uk_payment_event_provider_id UNIQUE (provider, provider_event_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_event_provider_event
    ON payment_event (provider, provider_event_id);

CREATE INDEX IF NOT EXISTS idx_payment_event_status
    ON payment_event (processing_status);

CREATE INDEX IF NOT EXISTS idx_payment_event_created_at
    ON payment_event (created_at);
