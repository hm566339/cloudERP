-- ============================================================================
-- Razorpay One-Time Payment Orders Migration
-- Project: Cloud ERP (hm566339/cloudERP)
-- Generated: 2026-10-12
--
-- Adds razorpay_order_id column and indices to support one-time payment orders.
-- Safe, idempotent execution with IF NOT EXISTS checks.
-- ============================================================================

-- 1. Add razorpay_order_id to subscription table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='subscription' AND column_name='razorpay_order_id'
    ) THEN
        ALTER TABLE subscription ADD COLUMN razorpay_order_id VARCHAR(100);
    END IF;
END $$;

-- 2. Add index on subscription.razorpay_order_id
CREATE INDEX IF NOT EXISTS idx_subscription_razorpay_order_id
    ON subscription (razorpay_order_id);

-- 3. Ensure payment table has razorpay_order_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payment' AND column_name='razorpay_order_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN razorpay_order_id VARCHAR(100);
    END IF;
END $$;

-- 4. Add index on payment.razorpay_order_id
CREATE INDEX IF NOT EXISTS idx_payment_razorpay_order_id
    ON payment (razorpay_order_id);
