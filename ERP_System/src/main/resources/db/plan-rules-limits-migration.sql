-- Phase 1: Subscription Plan Rules & Limits Migration
-- Adds max_users_per_company column to subscription_plan if not present.
-- max_companies already exists in the table. NULL represents unlimited.

ALTER TABLE subscription_plan
ADD COLUMN IF NOT EXISTS max_users_per_company INTEGER;

COMMENT ON COLUMN subscription_plan.max_companies IS 'Maximum number of active companies allowed for this plan. NULL represents unlimited.';
COMMENT ON COLUMN subscription_plan.max_users_per_company IS 'Maximum number of active users per company allowed for this plan. NULL represents unlimited.';
