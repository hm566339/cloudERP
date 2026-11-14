-- =============================================================================
-- V7__create_platform_workflow_template_schema.sql
-- Three-Level Centralized Default Workflow Architecture:
-- Level 1: Platform-Level Workflow Templates (SystemAdmin)
-- Level 2: Organization-Level Workflow Templates (Parent linkage & customization tracking)
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. platform_workflow_template
-- Global workflow templates managed by SystemAdmin at the platform level.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_template (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code           VARCHAR(100)    NOT NULL,
    template_name           VARCHAR(255)    NOT NULL,
    module_name             VARCHAR(100),
    document_type           VARCHAR(100)    NOT NULL,
    description             TEXT,
    version                 INT             NOT NULL DEFAULT 1,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    is_default              BOOLEAN         NOT NULL DEFAULT TRUE,
    effective_from          TIMESTAMP,
    effective_to            TIMESTAMP,
    initiated_by_role_name  VARCHAR(100),
    customer_scope          VARCHAR(50)     DEFAULT 'all',
    approval_threshold      NUMERIC(19,4),
    is_approval_required    BOOLEAN         DEFAULT TRUE,
    customer_acceptance     BOOLEAN         DEFAULT FALSE,
    auto_create_order       BOOLEAN         DEFAULT FALSE,
    email_notifications     BOOLEAN         DEFAULT TRUE,
    internal_notes          TEXT,
    -- Soft-delete & Audit (BaseEntity)
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255),
    deleted_by              UUID,
    deleted_by_username     VARCHAR(255),
    deleted_at              TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_wf_template_code_ver
    ON platform_workflow_template (template_code, version)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_platform_wf_template_doc_type
    ON platform_workflow_template (document_type, is_active, is_default)
    WHERE is_deleted = false;

-- -----------------------------------------------------------------------
-- 2. platform_workflow_template_stage
-- Stages within a platform workflow template.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_template_stage (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id                 UUID            NOT NULL REFERENCES platform_workflow_template(id) ON DELETE CASCADE,
    stage_code                  VARCHAR(100)    NOT NULL,
    stage_name                  VARCHAR(255)    NOT NULL,
    stage_order                 INT,
    sequence_no                 INT             NOT NULL,
    execution_type              VARCHAR(50)     NOT NULL DEFAULT 'SEQUENTIAL',
    minimum_approvals_required  INT             NOT NULL DEFAULT 1,
    rejection_action            VARCHAR(50)     NOT NULL DEFAULT 'REJECT_DOCUMENT',
    is_mandatory                BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Soft-delete & Audit (BaseEntity)
    is_deleted                  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255),
    deleted_by              UUID,
    deleted_by_username     VARCHAR(255),
    deleted_at              TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_template_stage_template_id
    ON platform_workflow_template_stage (template_id);

-- -----------------------------------------------------------------------
-- 3. platform_workflow_template_approver
-- Approvers for a platform template stage.
-- Roles are specified by role_name/code (e.g., "MANAGER", "ACCOUNTANT", "FINANCE_ADMIN").
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_template_approver (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id            UUID            NOT NULL REFERENCES platform_workflow_template_stage(id) ON DELETE CASCADE,
    approver_type       VARCHAR(50)     NOT NULL, -- USER, ROLE, DEPARTMENT, RULE, DOCUMENT_OWNER
    role_name           VARCHAR(100),
    department_name     VARCHAR(100),
    rule_expression     TEXT,
    approval_order      INT             NOT NULL DEFAULT 1,
    is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
    can_delegate        BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Soft-delete & Audit (BaseEntity)
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_template_approver_stage_id
    ON platform_workflow_template_approver (stage_id);

-- -----------------------------------------------------------------------
-- 4. platform_workflow_template_transition
-- State machine transitions for a platform workflow template.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_template_transition (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id             UUID            NOT NULL REFERENCES platform_workflow_template(id) ON DELETE CASCADE,
    action_type             VARCHAR(50)     NOT NULL, -- SUBMIT, APPROVE, REJECT, RETURN, CANCEL
    source_stage_code       VARCHAR(100),
    target_stage_code       VARCHAR(100),
    transition_condition    TEXT,
    allowed_roles           VARCHAR(500),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Soft-delete & Audit (BaseEntity)
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255),
    deleted_by              UUID,
    deleted_by_username     VARCHAR(255),
    deleted_at              TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_template_transition_template_id
    ON platform_workflow_template_transition (template_id);

-- -----------------------------------------------------------------------
-- 5. platform_workflow_template_sla
-- SLA definitions for a platform template stage.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_template_sla (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id                UUID            NOT NULL REFERENCES platform_workflow_template_stage(id) ON DELETE CASCADE,
    duration_hours          INT             NOT NULL,
    reminder_hours          INT,
    escalation_action       VARCHAR(100)    DEFAULT 'NOTIFY_MANAGER',
    escalate_to_role_name   VARCHAR(100),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Soft-delete & Audit (BaseEntity)
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255),
    deleted_by              UUID,
    deleted_by_username     VARCHAR(255),
    deleted_at              TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_template_sla_stage_id
    ON platform_workflow_template_sla (stage_id);

-- -----------------------------------------------------------------------
-- 6. Link Organization Template to parent Platform Template
-- -----------------------------------------------------------------------
ALTER TABLE organization_workflow_template 
    ADD COLUMN IF NOT EXISTS platform_template_id UUID REFERENCES platform_workflow_template(id);

ALTER TABLE organization_workflow_template 
    ADD COLUMN IF NOT EXISTS platform_template_version INT;

ALTER TABLE organization_workflow_template 
    ADD COLUMN IF NOT EXISTS is_customized BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_org_wf_template_platform
    ON organization_workflow_template (platform_template_id);

CREATE INDEX IF NOT EXISTS idx_org_wf_template_customized
    ON organization_workflow_template (organization_id, is_customized);

-- -----------------------------------------------------------------------
-- 7. platform_workflow_rollout_log
-- Audit log of platform template rollouts to organizations and companies.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_workflow_rollout_log (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_template_id        UUID            NOT NULL,
    platform_template_version   INT             NOT NULL,
    rollout_mode                VARCHAR(50)     NOT NULL, -- NEW_ORGS_ONLY, NON_CUSTOMIZED, FORCE_ALL
    target_organization_id      UUID,
    target_company_id           UUID,
    status                      VARCHAR(50)     NOT NULL, -- SUCCESS, SKIPPED_CUSTOMIZED, FAILED, RETRY_SUCCESS
    message                     TEXT,
    executed_by                 UUID,
    executed_by_username        VARCHAR(255),
    created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_rollout_log_template
    ON platform_workflow_rollout_log (platform_template_id, platform_template_version);

CREATE INDEX IF NOT EXISTS idx_platform_rollout_log_org
    ON platform_workflow_rollout_log (target_organization_id);

