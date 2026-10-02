-- =============================================================================
-- Migration Script: Copy existing workflow data from account database to workflow_db
-- Target: PostgreSQL workflow_db
-- Pre-requisites: Both account and workflow_db databases exist on PostgreSQL
-- =============================================================================

-- Ensure postgres dblink extension exists (optional for cross-db query)
CREATE EXTENSION IF NOT EXISTS dblink;

DO $$
BEGIN
    RAISE NOTICE 'Starting workflow data migration from account DB to workflow_db...';
END $$;

-- -----------------------------------------------------------------------------
-- Step 1: Connect to source database 'account' and migrate workflow_definition
-- -----------------------------------------------------------------------------
INSERT INTO workflow_definition (
    id, company_id, workflow_code, workflow_name, module_name, document_type,
    description, version, is_active, is_default, effective_from, effective_to,
    created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
    is_deleted, deleted_by, deleted_by_username, deleted_at
)
SELECT 
    id, company_id, COALESCE(workflow_code, document_type || '_DEFAULT'), workflow_name,
    'ACCOUNT' AS module_name, document_type, description, COALESCE(version, 1),
    COALESCE(is_active, true), COALESCE(is_default, false), effective_from, effective_to,
    created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
    COALESCE(is_deleted, false), deleted_by, deleted_by_username, deleted_at
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, company_id, workflow_code, workflow_name, document_type, description, version,
            is_active, is_default, effective_from, effective_to, created_at, updated_at,
            created_by, created_by_username, updated_by, updated_by_username, is_deleted,
            deleted_by, deleted_by_username, deleted_at FROM workflow_definition')
    AS t(
        id UUID, company_id UUID, workflow_code VARCHAR, workflow_name VARCHAR, document_type VARCHAR,
        description TEXT, version INT, is_active BOOLEAN, is_default BOOLEAN, effective_from TIMESTAMP,
        effective_to TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP, created_by UUID,
        created_by_username VARCHAR, updated_by UUID, updated_by_username VARCHAR, is_deleted BOOLEAN,
        deleted_by UUID, deleted_by_username VARCHAR, deleted_at TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 2: Migrate workflow_stage
-- -----------------------------------------------------------------------------
INSERT INTO workflow_stage (
    id, workflow_definition_id, stage_code, stage_name, stage_order, sequence_no,
    execution_type, minimum_approvals_required, rejection_action, is_mandatory, is_active,
    created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
    is_deleted, deleted_by, deleted_by_username, deleted_at
)
SELECT 
    id, workflow_definition_id, stage_code, stage_name, COALESCE(stage_order, sequence_no),
    sequence_no, COALESCE(execution_type, 'SEQUENTIAL'), COALESCE(minimum_approvals_required, 1),
    COALESCE(rejection_action, 'REJECT_DOCUMENT'), COALESCE(is_mandatory, true), COALESCE(is_active, true),
    created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
    COALESCE(is_deleted, false), deleted_by, deleted_by_username, deleted_at
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_definition_id, stage_code, stage_name, stage_order, sequence_no,
            execution_type, minimum_approvals_required, rejection_action, is_mandatory, is_active,
            created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
            is_deleted, deleted_by, deleted_by_username, deleted_at FROM workflow_stage')
    AS t(
        id UUID, workflow_definition_id UUID, stage_code VARCHAR, stage_name VARCHAR, stage_order INT,
        sequence_no INT, execution_type VARCHAR, minimum_approvals_required INT, rejection_action VARCHAR,
        is_mandatory BOOLEAN, is_active BOOLEAN, created_at TIMESTAMP, updated_at TIMESTAMP, created_by UUID,
        created_by_username VARCHAR, updated_by UUID, updated_by_username VARCHAR, is_deleted BOOLEAN,
        deleted_by UUID, deleted_by_username VARCHAR, deleted_at TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 3: Migrate workflow_approver
-- -----------------------------------------------------------------------------
INSERT INTO workflow_approver (
    id, workflow_stage_id, approver_type, user_id, user_name, role_id, role_name,
    department_id, department_name, rule_expression, approval_order, is_required, can_delegate,
    created_at, updated_at, is_deleted
)
SELECT 
    id, workflow_stage_id, approver_type, user_id, user_name, role_id, role_name,
    department_id, department_name, rule_expression, COALESCE(approval_order, 1),
    COALESCE(is_required, true), COALESCE(can_delegate, true), created_at, updated_at,
    COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_stage_id, approver_type, user_id, user_name, role_id, role_name,
            department_id, department_name, rule_expression, approval_order, is_required, can_delegate,
            created_at, updated_at, is_deleted FROM workflow_approver')
    AS t(
        id UUID, workflow_stage_id UUID, approver_type VARCHAR, user_id UUID, user_name VARCHAR,
        role_id UUID, role_name VARCHAR, department_id UUID, department_name VARCHAR,
        rule_expression TEXT, approval_order INT, is_required BOOLEAN, can_delegate BOOLEAN,
        created_at TIMESTAMP, updated_at TIMESTAMP, is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 4: Migrate workflow_transition
-- -----------------------------------------------------------------------------
INSERT INTO workflow_transition (
    id, workflow_definition_id, action_type, source_stage_id, target_stage_id,
    transition_condition, allowed_roles, is_active, created_at, updated_at, is_deleted
)
SELECT 
    id, workflow_definition_id, action_type, source_stage_id, target_stage_id,
    transition_condition, allowed_roles, COALESCE(is_active, true), created_at, updated_at,
    COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_definition_id, action_type, source_stage_id, target_stage_id,
            transition_condition, allowed_roles, is_active, created_at, updated_at,
            is_deleted FROM workflow_transition')
    AS t(
        id UUID, workflow_definition_id UUID, action_type VARCHAR, source_stage_id UUID,
        target_stage_id UUID, transition_condition TEXT, allowed_roles VARCHAR, is_active BOOLEAN,
        created_at TIMESTAMP, updated_at TIMESTAMP, is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 5: Migrate workflow_transaction
-- -----------------------------------------------------------------------------
INSERT INTO workflow_transaction (
    id, company_id, workflow_definition_id, module_name, entity_type, entity_id,
    document_type, document_id, document_number, callback_url, current_stage_id, status,
    initiated_by, initiated_by_name, initiated_at, submitted_at, completed_at, cancelled_at,
    version, created_at, updated_at, created_by, created_by_username, updated_by,
    updated_by_username, is_deleted, deleted_by, deleted_by_username, deleted_at
)
SELECT 
    id, company_id, workflow_definition_id, 'ACCOUNT' AS module_name, document_type AS entity_type,
    document_id AS entity_id, document_type, document_id, document_number,
    'http://account-service:8081/api/v1/account/workflow/callback' AS callback_url,
    current_stage_id, status, initiated_by, initiated_by_name, initiated_at,
    COALESCE(submitted_at, created_at, NOW()), completed_at, cancelled_at, COALESCE(version, 0),
    created_at, updated_at, created_by, created_by_username, updated_by, updated_by_username,
    COALESCE(is_deleted, false), deleted_by, deleted_by_username, deleted_at
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, company_id, workflow_definition_id, document_type, document_id, document_number,
            current_stage_id, status, initiated_by, initiated_by_name, initiated_at, submitted_at,
            completed_at, cancelled_at, version, created_at, updated_at, created_by,
            created_by_username, updated_by, updated_by_username, is_deleted, deleted_by,
            deleted_by_username, deleted_at FROM workflow_transaction')
    AS t(
        id UUID, company_id UUID, workflow_definition_id UUID, document_type VARCHAR, document_id UUID,
        document_number VARCHAR, current_stage_id UUID, status VARCHAR, initiated_by UUID,
        initiated_by_name VARCHAR, initiated_at TIMESTAMP, submitted_at TIMESTAMP, completed_at TIMESTAMP,
        cancelled_at TIMESTAMP, version BIGINT, created_at TIMESTAMP, updated_at TIMESTAMP, created_by UUID,
        created_by_username VARCHAR, updated_by UUID, updated_by_username VARCHAR, is_deleted BOOLEAN,
        deleted_by UUID, deleted_by_username VARCHAR, deleted_at TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 6: Migrate workflow_task
-- -----------------------------------------------------------------------------
INSERT INTO workflow_task (
    id, workflow_transaction_id, workflow_stage_id, assigned_user_id, assigned_role_name,
    delegated_from_user_id, task_status, action_taken, assigned_at, due_at, completed_at,
    completed_by, completed_by_name, comments, version, created_at, updated_at, is_deleted
)
SELECT 
    id, workflow_transaction_id, workflow_stage_id, assigned_user_id, assigned_role_name,
    delegated_from_user_id, task_status, action_taken, assigned_at, due_at, completed_at,
    completed_by, completed_by_name, comments, COALESCE(version, 0), created_at, updated_at,
    COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_transaction_id, workflow_stage_id, assigned_user_id, assigned_role_name,
            delegated_from_user_id, task_status, action_taken, assigned_at, due_at, completed_at,
            completed_by, completed_by_name, comments, version, created_at, updated_at,
            is_deleted FROM workflow_task')
    AS t(
        id UUID, workflow_transaction_id UUID, workflow_stage_id UUID, assigned_user_id UUID,
        assigned_role_name VARCHAR, delegated_from_user_id UUID, task_status VARCHAR,
        action_taken VARCHAR, assigned_at TIMESTAMP, due_at TIMESTAMP, completed_at TIMESTAMP,
        completed_by UUID, completed_by_name VARCHAR, comments TEXT, version BIGINT,
        created_at TIMESTAMP, updated_at TIMESTAMP, is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 7: Migrate workflow_action
-- -----------------------------------------------------------------------------
INSERT INTO workflow_action (
    id, workflow_transaction_id, workflow_task_id, action_type, performed_by,
    performed_by_name, previous_status, new_status, comments, metadata, ip_address, created_at
)
SELECT 
    id, workflow_transaction_id, workflow_task_id, action_type, performed_by,
    performed_by_name, previous_status, new_status, comments, metadata::jsonb, ip_address, created_at
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_transaction_id, workflow_task_id, action_type, performed_by,
            performed_by_name, previous_status, new_status, comments, metadata::text,
            ip_address, created_at FROM workflow_action')
    AS t(
        id UUID, workflow_transaction_id UUID, workflow_task_id UUID, action_type VARCHAR,
        performed_by UUID, performed_by_name VARCHAR, previous_status VARCHAR, new_status VARCHAR,
        comments TEXT, metadata TEXT, ip_address VARCHAR, created_at TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 8: Migrate workflow_comment
-- -----------------------------------------------------------------------------
INSERT INTO workflow_comment (
    id, workflow_transaction_id, workflow_task_id, user_id, user_name, comment_text,
    is_internal, created_at, updated_at, is_deleted
)
SELECT 
    id, workflow_transaction_id, workflow_task_id, user_id, user_name, comment_text,
    COALESCE(is_internal, false), created_at, updated_at, COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_transaction_id, workflow_task_id, user_id, user_name, comment_text,
            is_internal, created_at, updated_at, is_deleted FROM workflow_comment')
    AS t(
        id UUID, workflow_transaction_id UUID, workflow_task_id UUID, user_id UUID,
        user_name VARCHAR, comment_text TEXT, is_internal BOOLEAN, created_at TIMESTAMP,
        updated_at TIMESTAMP, is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 9: Migrate workflow_attachment
-- -----------------------------------------------------------------------------
INSERT INTO workflow_attachment (
    id, workflow_transaction_id, workflow_task_id, file_name, stored_file_name,
    file_url, content_type, file_size, uploaded_by, uploaded_by_name, created_at,
    updated_at, is_deleted
)
SELECT 
    id, workflow_transaction_id, workflow_task_id, file_name, stored_file_name,
    file_url, content_type, file_size, uploaded_by, uploaded_by_name, created_at,
    updated_at, COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_transaction_id, workflow_task_id, file_name, stored_file_name,
            file_url, content_type, file_size, uploaded_by, uploaded_by_name, created_at,
            updated_at, is_deleted FROM workflow_attachment')
    AS t(
        id UUID, workflow_transaction_id UUID, workflow_task_id UUID, file_name VARCHAR,
        stored_file_name VARCHAR, file_url VARCHAR, content_type VARCHAR, file_size BIGINT,
        uploaded_by UUID, uploaded_by_name VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP,
        is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 10: Migrate workflow_sla
-- -----------------------------------------------------------------------------
INSERT INTO workflow_sla (
    id, workflow_stage_id, duration_hours, reminder_hours, escalation_action,
    escalate_to_user_id, escalate_to_role_name, is_active, created_at, updated_at, is_deleted
)
SELECT 
    id, workflow_stage_id, duration_hours, reminder_hours, COALESCE(escalation_action, 'NOTIFY_MANAGER'),
    escalate_to_user_id, escalate_to_role_name, COALESCE(is_active, true), created_at, updated_at,
    COALESCE(is_deleted, false)
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, workflow_stage_id, duration_hours, reminder_hours, escalation_action,
            escalate_to_user_id, escalate_to_role_name, is_active, created_at, updated_at,
            is_deleted FROM workflow_sla')
    AS t(
        id UUID, workflow_stage_id UUID, duration_hours INT, reminder_hours INT, escalation_action VARCHAR,
        escalate_to_user_id UUID, escalate_to_role_name VARCHAR, is_active BOOLEAN,
        created_at TIMESTAMP, updated_at TIMESTAMP, is_deleted BOOLEAN
    )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Step 11: Migrate workflow_notification
-- -----------------------------------------------------------------------------
INSERT INTO workflow_notification (
    id, company_id, workflow_transaction_id, workflow_task_id, recipient_user_id,
    notification_type, title, message, is_read, read_at, channel, delivery_status, created_at
)
SELECT 
    id, company_id, workflow_transaction_id, workflow_task_id, recipient_user_id,
    notification_type, title, message, COALESCE(is_read, false), read_at,
    COALESCE(channel, 'IN_APP'), COALESCE(delivery_status, 'SENT'), created_at
FROM dblink('dbname=account host=localhost port=5432 user=postgres password=postgres',
    'SELECT id, company_id, workflow_transaction_id, workflow_task_id, recipient_user_id,
            notification_type, title, message, is_read, read_at, channel, delivery_status,
            created_at FROM workflow_notification')
    AS t(
        id UUID, company_id UUID, workflow_transaction_id UUID, workflow_task_id UUID,
        recipient_user_id UUID, notification_type VARCHAR, title VARCHAR, message TEXT,
        is_read BOOLEAN, read_at TIMESTAMP, channel VARCHAR, delivery_status VARCHAR,
        created_at TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Workflow data migration successfully completed!';
END $$;
