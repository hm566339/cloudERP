-- =============================================================================
-- Migration: Drop Legacy Workflow Tables from Account DB
-- WARNING: Run ONLY after Workflow Service is running and data is verified (Step 10)
-- =============================================================================

DROP TABLE IF EXISTS workflow_notification CASCADE;
DROP TABLE IF EXISTS workflow_sla CASCADE;
DROP TABLE IF EXISTS workflow_attachment CASCADE;
DROP TABLE IF EXISTS workflow_comment CASCADE;
DROP TABLE IF EXISTS workflow_action CASCADE;
DROP TABLE IF EXISTS workflow_task CASCADE;
DROP TABLE IF EXISTS workflow_transaction CASCADE;
DROP TABLE IF EXISTS workflow_transition CASCADE;
DROP TABLE IF EXISTS workflow_approver CASCADE;
DROP TABLE IF EXISTS workflow_stage CASCADE;
DROP TABLE IF EXISTS workflow_definition CASCADE;

-- Clean up any workflow indexes if not dropped with CASCADE
DROP INDEX IF EXISTS idx_wf_def_company_doc;
DROP INDEX IF EXISTS idx_wf_stage_def_seq;
DROP INDEX IF EXISTS idx_wf_tx_company_doc;
DROP INDEX IF EXISTS idx_wf_tx_company_status;
DROP INDEX IF EXISTS idx_wf_task_user_status;
DROP INDEX IF EXISTS idx_wf_task_tx_stage;
DROP INDEX IF EXISTS idx_wf_act_tx_created;
DROP INDEX IF EXISTS idx_wf_comment_tx;
DROP INDEX IF EXISTS idx_wf_attach_tx;
DROP INDEX IF EXISTS idx_wf_sla_stage;
DROP INDEX IF EXISTS idx_wf_notif_recipient_read;
DROP INDEX IF EXISTS idx_wf_notif_company_tx;
