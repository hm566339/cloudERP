-- =============================================================================
-- V1__create_workflow_schema.sql
-- Generic Workflow Service — Initial Database Schema
-- Extracted from Account Service and made generic for all ERP modules.
-- No foreign keys to any business service database (account_db, inventory_db, etc.)
-- =============================================================================

-- -----------------------------------------------------------------------
-- workflow_definition
-- Defines a workflow type (e.g., STOCK_ADJUSTMENT_APPROVAL, FISCAL_YEAR_APPROVAL)
-- Scoped to company. module_name identifies which ERP module owns it.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_definition (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID        NOT NULL,
    workflow_code       VARCHAR(100) NOT NULL,
    workflow_name       VARCHAR(255) NOT NULL,
    module_name         VARCHAR(100),           -- e.g. ACCOUNT, INVENTORY, CRM
    document_type       VARCHAR(100) NOT NULL,  -- e.g. FISCAL_YEAR, STOCK_ADJUSTMENT
    description         TEXT,
    version             INT         NOT NULL DEFAULT 1,
    is_active           BOOLEAN     NOT NULL DEFAULT FALSE,
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,
    effective_from      TIMESTAMP,
    effective_to        TIMESTAMP,
    -- Audit
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP,
    CONSTRAINT uq_workflow_def_company_code_version
        UNIQUE (company_id, workflow_code, version)
);

CREATE INDEX IF NOT EXISTS idx_wf_def_company_doctype
    ON workflow_definition (company_id, document_type)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_wf_def_module
    ON workflow_definition (module_name)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_stage
-- Configuration-driven stages inside a workflow definition.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_stage (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_definition_id      UUID        NOT NULL REFERENCES workflow_definition(id),
    stage_code                  VARCHAR(100) NOT NULL,
    stage_name                  VARCHAR(255) NOT NULL,
    stage_order                 INT,
    sequence_no                 INT         NOT NULL,
    execution_type              VARCHAR(50) NOT NULL DEFAULT 'SEQUENTIAL', -- SEQUENTIAL, PARALLEL
    minimum_approvals_required  INT         NOT NULL DEFAULT 1,
    rejection_action            VARCHAR(50) NOT NULL DEFAULT 'REJECT_DOCUMENT', -- REJECT_DOCUMENT, RETURN_TO_INITIATOR
    is_mandatory                BOOLEAN     NOT NULL DEFAULT TRUE,
    is_active                   BOOLEAN     NOT NULL DEFAULT TRUE,
    -- Audit
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_stage_definition
    ON workflow_stage (workflow_definition_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_approver
-- Who can approve at each stage. Supports USER, ROLE, DEPARTMENT, RULE types.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_approver (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_stage_id   UUID        NOT NULL REFERENCES workflow_stage(id),
    approver_type       VARCHAR(50) NOT NULL, -- USER, ROLE, DEPARTMENT, RULE, DOCUMENT_OWNER
    user_id             UUID,
    user_name           VARCHAR(255),
    role_id             UUID,
    role_name           VARCHAR(100),
    department_id       UUID,
    department_name     VARCHAR(100),
    rule_expression     TEXT,
    approval_order      INT         NOT NULL DEFAULT 1,
    is_required         BOOLEAN     NOT NULL DEFAULT TRUE,
    can_delegate        BOOLEAN     NOT NULL DEFAULT TRUE,
    -- Audit
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_approver_stage
    ON workflow_approver (workflow_stage_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_transition
-- Valid state machine transitions between stages.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_transition (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_definition_id  UUID        NOT NULL REFERENCES workflow_definition(id),
    action_type             VARCHAR(50) NOT NULL, -- APPROVE, REJECT, RETURN, CANCEL, DELEGATE, ESCALATE
    source_stage_id         UUID        REFERENCES workflow_stage(id),
    target_stage_id         UUID        REFERENCES workflow_stage(id),
    transition_condition    TEXT,
    allowed_roles           VARCHAR(500),
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    -- Audit
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_transition_definition
    ON workflow_transition (workflow_definition_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_transaction
-- A running instance of a workflow for a specific business entity.
-- Uses generic identifiers (module, entity_type, entity_id, document_type, document_id).
-- NO foreign keys to any business-service database!
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_transaction (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id              UUID        NOT NULL,
    workflow_definition_id  UUID        NOT NULL REFERENCES workflow_definition(id),
    -- Generic business entity identification (no FK to business DBs!)
    module_name             VARCHAR(100),          -- e.g. ACCOUNT, INVENTORY, CRM
    entity_type             VARCHAR(100),          -- e.g. FISCAL_YEAR, STOCK_ADJUSTMENT
    entity_id               UUID,                  -- ID of the business entity (in business DB)
    document_type           VARCHAR(100) NOT NULL, -- e.g. FISCAL_YEAR, STOCK_ADJUSTMENT
    document_id             UUID         NOT NULL, -- document primary key (in business DB)
    document_number         VARCHAR(100),          -- human-readable reference number
    -- Callback URL for notifying originating service on completion/rejection
    callback_url            VARCHAR(500),
    -- Workflow state
    current_stage_id        UUID        REFERENCES workflow_stage(id),
    status                  VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- Initiator info (denormalized — no FK to user table)
    initiated_by            UUID        NOT NULL,
    initiated_by_name       VARCHAR(255),
    initiated_at            TIMESTAMP,
    submitted_at            TIMESTAMP   NOT NULL,
    completed_at            TIMESTAMP,
    cancelled_at            TIMESTAMP,
    -- Optimistic locking
    version                 BIGINT      NOT NULL DEFAULT 0,
    -- Audit
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP,
    CONSTRAINT uq_wf_transaction_doc
        UNIQUE (company_id, document_type, document_id)
);

CREATE INDEX IF NOT EXISTS idx_wf_txn_company_status
    ON workflow_transaction (company_id, status)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_wf_txn_entity
    ON workflow_transaction (company_id, module_name, entity_type, entity_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_wf_txn_document
    ON workflow_transaction (company_id, document_type, document_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_task
-- An actionable task assigned to a user/role for a specific stage.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_task (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    workflow_stage_id       UUID        NOT NULL REFERENCES workflow_stage(id),
    assigned_user_id        UUID,
    assigned_role_name      VARCHAR(100),
    delegated_from_user_id  UUID,
    task_status             VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    action_taken            VARCHAR(50),
    assigned_at             TIMESTAMP   NOT NULL,
    due_at                  TIMESTAMP,
    completed_at            TIMESTAMP,
    completed_by            UUID,
    completed_by_name       VARCHAR(255),
    comments                TEXT,
    -- Optimistic locking
    version                 BIGINT      NOT NULL DEFAULT 0,
    -- Audit
    created_at              TIMESTAMP,
    updated_at              TIMESTAMP,
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wf_task_transaction
    ON workflow_task (workflow_transaction_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_wf_task_user_status
    ON workflow_task (assigned_user_id, task_status)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_wf_task_due
    ON workflow_task (task_status, due_at)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_action
-- Immutable audit log of every workflow action taken.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_action (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id        UUID        REFERENCES workflow_task(id),
    action_type             VARCHAR(50) NOT NULL, -- SUBMIT, APPROVE, REJECT, CANCEL, DELEGATE, RETURN, ESCALATE, COMPLETE
    performed_by            UUID        NOT NULL,
    performed_by_name       VARCHAR(255),
    previous_status         VARCHAR(50),
    new_status              VARCHAR(50),
    comments                TEXT,
    metadata                JSONB,
    ip_address              VARCHAR(100),
    created_at              TIMESTAMP   NOT NULL
    -- NOTE: workflow_action is append-only — no soft delete, no update
);

CREATE INDEX IF NOT EXISTS idx_wf_action_transaction
    ON workflow_action (workflow_transaction_id);

CREATE INDEX IF NOT EXISTS idx_wf_action_type
    ON workflow_action (action_type, created_at);

-- -----------------------------------------------------------------------
-- workflow_comment
-- User comments on transactions/tasks.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_comment (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id        UUID        REFERENCES workflow_task(id),
    user_id                 UUID        NOT NULL,
    user_name               VARCHAR(255),
    comment_text            TEXT        NOT NULL,
    is_internal             BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP,
    updated_at              TIMESTAMP,
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wf_comment_transaction
    ON workflow_comment (workflow_transaction_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_attachment
-- File attachments on workflow transactions/tasks.
-- File content stored externally; only metadata kept here.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_attachment (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id        UUID        REFERENCES workflow_task(id),
    file_name               VARCHAR(255) NOT NULL,
    stored_file_name        VARCHAR(255) NOT NULL,
    file_url                VARCHAR(500) NOT NULL,
    content_type            VARCHAR(100) NOT NULL,
    file_size               BIGINT      NOT NULL,
    uploaded_by             UUID        NOT NULL,
    uploaded_by_name        VARCHAR(255),
    created_at              TIMESTAMP,
    updated_at              TIMESTAMP,
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wf_attach_transaction
    ON workflow_attachment (workflow_transaction_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_sla
-- SLA configuration per stage.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_sla (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_stage_id       UUID        NOT NULL REFERENCES workflow_stage(id),
    duration_hours          INT         NOT NULL,
    reminder_hours          INT,
    escalation_action       VARCHAR(50) NOT NULL DEFAULT 'NOTIFY_MANAGER',
    escalate_to_user_id     UUID,
    escalate_to_role_name   VARCHAR(100),
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP,
    updated_at              TIMESTAMP,
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wf_sla_stage
    ON workflow_sla (workflow_stage_id)
    WHERE is_deleted = FALSE;

-- -----------------------------------------------------------------------
-- workflow_notification
-- In-app and other channel notifications for workflow events.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_notification (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id              UUID        NOT NULL,
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    workflow_task_id        UUID        REFERENCES workflow_task(id),
    recipient_user_id       UUID        NOT NULL,
    notification_type       VARCHAR(50) NOT NULL, -- TASK_ASSIGNED, APPROVED, REJECTED, ESCALATED, SLA_REMINDER, COMPLETED, CANCELLED
    title                   VARCHAR(255) NOT NULL,
    message                 TEXT        NOT NULL,
    is_read                 BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at                 TIMESTAMP,
    channel                 VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
    delivery_status         VARCHAR(50) NOT NULL DEFAULT 'SENT',
    created_at              TIMESTAMP   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wf_notif_recipient
    ON workflow_notification (company_id, recipient_user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_wf_notif_transaction
    ON workflow_notification (workflow_transaction_id);

-- -----------------------------------------------------------------------
-- workflow_callback_log
-- Tracks outbound callbacks/webhooks to business services.
-- Helps with retry and audit.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_callback_log (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_transaction_id UUID        NOT NULL REFERENCES workflow_transaction(id),
    event_type              VARCHAR(50) NOT NULL, -- WORKFLOW_APPROVED, WORKFLOW_REJECTED, WORKFLOW_CANCELLED, WORKFLOW_COMPLETED
    callback_url            VARCHAR(500) NOT NULL,
    request_payload         JSONB,
    response_status         INT,
    response_body           TEXT,
    attempt_count           INT         NOT NULL DEFAULT 1,
    last_attempted_at       TIMESTAMP   NOT NULL,
    succeeded               BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wf_callback_transaction
    ON workflow_callback_log (workflow_transaction_id);

CREATE INDEX IF NOT EXISTS idx_wf_callback_pending
    ON workflow_callback_log (succeeded, last_attempted_at)
    WHERE succeeded = FALSE;
