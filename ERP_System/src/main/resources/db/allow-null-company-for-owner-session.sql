-- ============================================================================
-- Organization Owner Support: Allow NULL company_id in authorization_code & session
-- Project: Cloud ERP (hm566339/cloudERP)
--
-- PURPOSE:
-- Organization owner sessions and OAuth flows operate at the organization level
-- without requiring or forcing a specific company selection.
-- This migration drops NOT NULL constraints on company_id for:
--   1. authorization_code(company_id)
--   2. session(company_id)
-- ============================================================================

ALTER TABLE authorization_code ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE session ALTER COLUMN company_id DROP NOT NULL;
