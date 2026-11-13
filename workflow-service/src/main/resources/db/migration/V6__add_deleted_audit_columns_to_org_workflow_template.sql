-- =============================================================================
-- V6__add_deleted_audit_columns_to_org_workflow_template.sql
-- Add missing BaseEntity soft-delete and audit columns to organization workflow template tables
-- =============================================================================

-- 1. organization_workflow_template
ALTER TABLE organization_workflow_template ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE organization_workflow_template ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255);
ALTER TABLE organization_workflow_template ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 2. org_workflow_template_stage
ALTER TABLE org_workflow_template_stage ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE org_workflow_template_stage ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255);
ALTER TABLE org_workflow_template_stage ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 3. org_workflow_template_approver
ALTER TABLE org_workflow_template_approver ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE org_workflow_template_approver ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255);
ALTER TABLE org_workflow_template_approver ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 4. org_workflow_template_transition
ALTER TABLE org_workflow_template_transition ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE org_workflow_template_transition ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255);
ALTER TABLE org_workflow_template_transition ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 5. org_workflow_template_sla
ALTER TABLE org_workflow_template_sla ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE org_workflow_template_sla ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255);
ALTER TABLE org_workflow_template_sla ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

