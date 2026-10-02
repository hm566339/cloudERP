CREATE TABLE IF NOT EXISTS workflow_definition (
    id uuid PRIMARY KEY,
    company_id uuid NOT NULL,
    workflow_code varchar(100) NOT NULL,
    workflow_name varchar(255) NOT NULL,
    module_name varchar(100),
    document_type varchar(100) NOT NULL,
    description text,
    version integer NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    is_default boolean NOT NULL DEFAULT false,
    effective_from timestamp,
    effective_to timestamp,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    created_by_username varchar(255),
    updated_by uuid,
    updated_by_username varchar(255),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid,
    deleted_by_username varchar(255),
    deleted_at timestamp,
    CONSTRAINT uk_wf_def_code_version UNIQUE (company_id, workflow_code, version)
);

CREATE TABLE IF NOT EXISTS workflow_stage (
    id uuid PRIMARY KEY,
    workflow_definition_id uuid NOT NULL REFERENCES workflow_definition(id),
    stage_code varchar(100) NOT NULL,
    stage_name varchar(255) NOT NULL,
    stage_order integer,
    sequence_no integer NOT NULL,
    execution_type varchar(50) NOT NULL DEFAULT 'SEQUENTIAL',
    minimum_approvals_required integer NOT NULL DEFAULT 1,
    rejection_action varchar(50) NOT NULL DEFAULT 'REJECT_DOCUMENT',
    is_mandatory boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    created_by_username varchar(255),
    updated_by uuid,
    updated_by_username varchar(255),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid,
    deleted_by_username varchar(255),
    deleted_at timestamp,
    CONSTRAINT uk_wf_stage_def_code UNIQUE (workflow_definition_id, stage_code)
);

CREATE TABLE IF NOT EXISTS workflow_transaction (
    id uuid PRIMARY KEY,
    company_id uuid NOT NULL,
    workflow_definition_id uuid NOT NULL REFERENCES workflow_definition(id),
    entity_name varchar(100),
    entity_id uuid,
    document_type varchar(100) NOT NULL,
    document_id uuid NOT NULL,
    document_number varchar(100),
    current_stage_id uuid REFERENCES workflow_stage(id),
    status varchar(50) NOT NULL DEFAULT 'PENDING',
    initiated_by uuid NOT NULL,
    initiated_by_name varchar(255),
    initiated_at timestamp,
    submitted_at timestamp NOT NULL,
    completed_at timestamp,
    cancelled_at timestamp,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    created_by_username varchar(255),
    updated_by uuid,
    updated_by_username varchar(255),
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid,
    deleted_by_username varchar(255),
    deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_transition (
    id uuid PRIMARY KEY,
    workflow_definition_id uuid NOT NULL REFERENCES workflow_definition(id),
    action_type varchar(50) NOT NULL,
    source_stage_id uuid REFERENCES workflow_stage(id),
    target_stage_id uuid REFERENCES workflow_stage(id),
    transition_condition text,
    allowed_roles varchar(255),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_approver (
    id uuid PRIMARY KEY,
    workflow_stage_id uuid NOT NULL REFERENCES workflow_stage(id),
    approver_type varchar(50) NOT NULL,
    user_id uuid,
    user_name varchar(255),
    role_id uuid,
    role_name varchar(100),
    department_id uuid,
    department_name varchar(100),
    rule_expression text,
    approval_order integer NOT NULL DEFAULT 1,
    is_required boolean NOT NULL DEFAULT true,
    can_delegate boolean NOT NULL DEFAULT true,
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_task (
    id uuid PRIMARY KEY,
    workflow_transaction_id uuid NOT NULL REFERENCES workflow_transaction(id),
    workflow_stage_id uuid NOT NULL REFERENCES workflow_stage(id),
    assigned_user_id uuid,
    assigned_role_name varchar(100),
    delegated_from_user_id uuid,
    task_status varchar(50) NOT NULL DEFAULT 'PENDING',
    action_taken varchar(50),
    assigned_at timestamp NOT NULL,
    due_at timestamp,
    completed_at timestamp,
    completed_by uuid,
    completed_by_name varchar(255),
    comments text,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_action (
    id uuid PRIMARY KEY,
    workflow_transaction_id uuid NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id uuid REFERENCES workflow_task(id),
    action_type varchar(50) NOT NULL,
    performed_by uuid NOT NULL,
    performed_by_name varchar(255),
    previous_status varchar(50),
    new_status varchar(50),
    comments text,
    metadata jsonb,
    ip_address varchar(100),
    created_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_comment (
    id uuid PRIMARY KEY,
    workflow_transaction_id uuid NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id uuid REFERENCES workflow_task(id),
    user_id uuid NOT NULL,
    user_name varchar(255),
    comment_text text NOT NULL,
    is_internal boolean NOT NULL DEFAULT false,
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_attachment (
    id uuid PRIMARY KEY,
    workflow_transaction_id uuid NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id uuid REFERENCES workflow_task(id),
    file_name varchar(255) NOT NULL,
    stored_file_name varchar(255) NOT NULL,
    file_url varchar(500) NOT NULL,
    content_type varchar(100) NOT NULL,
    file_size bigint NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_by_name varchar(255),
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_sla (
    id uuid PRIMARY KEY,
    workflow_stage_id uuid NOT NULL REFERENCES workflow_stage(id),
    duration_hours integer NOT NULL,
    reminder_hours integer,
    escalation_action varchar(50) NOT NULL DEFAULT 'NOTIFY_MANAGER',
    escalate_to_user_id uuid,
    escalate_to_role_name varchar(100),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp, updated_at timestamp, created_by uuid, created_by_username varchar(255),
    updated_by uuid, updated_by_username varchar(255), is_deleted boolean NOT NULL DEFAULT false,
    deleted_by uuid, deleted_by_username varchar(255), deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS workflow_notification (
    id uuid PRIMARY KEY,
    company_id uuid NOT NULL,
    workflow_transaction_id uuid NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id uuid REFERENCES workflow_task(id),
    recipient_user_id uuid NOT NULL,
    notification_type varchar(50) NOT NULL,
    title varchar(255) NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamp,
    channel varchar(50) NOT NULL DEFAULT 'IN_APP',
    delivery_status varchar(50) NOT NULL DEFAULT 'SENT',
    created_at timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wf_def_company_doc ON workflow_definition(company_id, document_type, is_active);
CREATE INDEX IF NOT EXISTS idx_wf_stage_def_seq ON workflow_stage(workflow_definition_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_wf_tx_company_doc ON workflow_transaction(company_id, document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_wf_tx_company_status ON workflow_transaction(company_id, status);
CREATE INDEX IF NOT EXISTS idx_wf_task_user_status ON workflow_task(assigned_user_id, task_status);
CREATE INDEX IF NOT EXISTS idx_wf_task_tx_stage ON workflow_task(workflow_transaction_id, workflow_stage_id);
CREATE INDEX IF NOT EXISTS idx_wf_act_tx_created ON workflow_action(workflow_transaction_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wf_comment_tx ON workflow_comment(workflow_transaction_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wf_attach_tx ON workflow_attachment(workflow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_wf_sla_stage ON workflow_sla(workflow_stage_id);
CREATE INDEX IF NOT EXISTS idx_wf_notif_recipient_read ON workflow_notification(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_wf_notif_company_tx ON workflow_notification(company_id, workflow_transaction_id);
