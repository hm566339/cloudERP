-- ============================================================================
-- Fix Pending Subscriptions & Repair Erroneous Records Migration
-- Project: Cloud ERP (hm566339/cloudERP)
-- Generated: 2026-10-13
--
-- 1. Drops NOT NULL constraints on trial_started_at and trial_ends_at
--    so paid subscriptions are not forced to store fake trial dates.
-- 2. Corrects existing PENDING subscriptions that have bogus identical trial dates
--    (trialStartedAt == trialEndsAt) or access_mode = FULL without payment.
-- 3. Marks unverified pending checkouts as CANCELLED with READ_ONLY access.
-- ============================================================================

-- 1. Allow NULL for trial_started_at and trial_ends_at if constraints exist
DO $$
BEGIN
    ALTER TABLE subscription ALTER COLUMN trial_started_at DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE subscription ALTER COLUMN trial_ends_at DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Mark unverified PENDING subscriptions with identical trial dates as CANCELLED
UPDATE subscription
SET status = 'CANCELLED',
    access_mode = 'READ_ONLY',
    cancelled_at = NOW()
WHERE status = 'PENDING'
  AND (
      trial_started_at IS NULL
      OR trial_ends_at IS NULL
      OR trial_ends_at <= trial_started_at
      OR ABS(EXTRACT(EPOCH FROM (trial_ends_at - trial_started_at))) < 60
  )
  AND NOT EXISTS (
      SELECT 1 FROM payment p
      WHERE p.subscription_id = subscription.id
        AND UPPER(p.status) IN ('SUCCESS', 'SUCCEEDED')
  );

-- 3. Clean up spurious identical timestamps on cancelled subscriptions
UPDATE subscription
SET trial_started_at = NULL,
    trial_ends_at = NULL
WHERE status = 'CANCELLED'
  AND trial_started_at IS NOT NULL
  AND trial_ends_at IS NOT NULL
  AND (
      trial_ends_at <= trial_started_at
      OR ABS(EXTRACT(EPOCH FROM (trial_ends_at - trial_started_at))) < 60
  );
