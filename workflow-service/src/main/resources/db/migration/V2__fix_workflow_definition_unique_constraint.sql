-- -----------------------------------------------------------------------
-- V2__fix_workflow_definition_unique_constraint.sql
-- Ensure unique constraint on workflow_definition ignores soft-deleted rows
-- -----------------------------------------------------------------------

ALTER TABLE workflow_definition DROP CONSTRAINT IF EXISTS uq_workflow_def_company_code_version;
DROP INDEX IF EXISTS uq_workflow_def_company_code_version;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_def_company_code_version
    ON workflow_definition (company_id, workflow_code, version)
    WHERE is_deleted = FALSE;
