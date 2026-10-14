-- Migration: Add soft delete support to subscription_plan
ALTER TABLE subscription_plan ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_subscription_plan_deleted ON subscription_plan(deleted);
