-- -----------------------------------------------------------------------
-- V3__add_workflow_definition_configuration_fields.sql
-- Add durable configuration persistence columns to workflow_definition
-- -----------------------------------------------------------------------

ALTER TABLE workflow_definition
    ADD COLUMN IF NOT EXISTS initiated_by_role_id UUID,
    ADD COLUMN IF NOT EXISTS initiated_by_role_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_scope VARCHAR(50) DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC(19, 4),
    ADD COLUMN IF NOT EXISTS is_approval_required BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS customer_acceptance BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS auto_create_order BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT;
