-- =============================================================================
-- V5__organization_workflow_template.sql
-- Organization-Level Default Workflow Templates and Automatic Provisioning
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. organization_workflow_template
-- Central default workflow template defined at the organization level.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_workflow_template (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID            NOT NULL,
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
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Audit
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_workflow_template_code_version
    ON organization_workflow_template (organization_id, template_code, version)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_org_workflow_template_org_doc
    ON organization_workflow_template (organization_id, document_type)
    WHERE is_deleted = false;

-- -----------------------------------------------------------------------
-- 2. org_workflow_template_stage
-- Stages within an organization workflow template.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_workflow_template_stage (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id                 UUID            NOT NULL REFERENCES organization_workflow_template(id) ON DELETE CASCADE,
    stage_code                  VARCHAR(100)    NOT NULL,
    stage_name                  VARCHAR(255)    NOT NULL,
    stage_order                 INT,
    sequence_no                 INT             NOT NULL,
    execution_type              VARCHAR(50)     NOT NULL DEFAULT 'SEQUENTIAL',
    minimum_approvals_required  INT             NOT NULL DEFAULT 1,
    rejection_action            VARCHAR(50)     NOT NULL DEFAULT 'REJECT_DOCUMENT',
    is_mandatory                BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted                  BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Audit
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  UUID,
    created_by_username         VARCHAR(255),
    updated_by                  UUID,
    updated_by_username         VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_org_template_stage_template_id
    ON org_workflow_template_stage (template_id);

-- -----------------------------------------------------------------------
-- 3. org_workflow_template_approver
-- Approvers for a template stage.
-- Roles are specified by role_name/code (never company-specific UUIDs).
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_workflow_template_approver (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id            UUID            NOT NULL REFERENCES org_workflow_template_stage(id) ON DELETE CASCADE,
    approver_type       VARCHAR(50)     NOT NULL, -- USER, ROLE, DEPARTMENT, RULE, DOCUMENT_OWNER
    role_name           VARCHAR(100),             -- e.g. "Accountant", "Finance Manager"
    department_name     VARCHAR(100),
    rule_expression     TEXT,
    approval_order      INT             NOT NULL DEFAULT 1,
    is_required         BOOLEAN         NOT NULL DEFAULT TRUE,
    can_delegate        BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Audit
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_org_template_approver_stage_id
    ON org_workflow_template_approver (stage_id);

-- -----------------------------------------------------------------------
-- 4. org_workflow_template_transition
-- State machine transitions for an organization workflow template.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_workflow_template_transition (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id             UUID            NOT NULL REFERENCES organization_workflow_template(id) ON DELETE CASCADE,
    action_type             VARCHAR(50)     NOT NULL, -- SUBMIT, APPROVE, REJECT, RETURN, CANCEL
    source_stage_code       VARCHAR(100),
    target_stage_code       VARCHAR(100),
    transition_condition    TEXT,
    allowed_roles           VARCHAR(500),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Audit
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_org_template_transition_template_id
    ON org_workflow_template_transition (template_id);

-- -----------------------------------------------------------------------
-- 5. org_workflow_template_sla
-- SLA definitions for an organization template stage.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_workflow_template_sla (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id                UUID            NOT NULL REFERENCES org_workflow_template_stage(id) ON DELETE CASCADE,
    duration_hours          INT             NOT NULL,
    reminder_hours          INT,
    escalation_action       VARCHAR(100)    DEFAULT 'NOTIFY_MANAGER',
    escalate_to_role_name   VARCHAR(100),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted              BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Audit
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,
    created_by_username     VARCHAR(255),
    updated_by              UUID,
    updated_by_username     VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_org_template_sla_stage_id
    ON org_workflow_template_sla (stage_id);

-- -----------------------------------------------------------------------
-- 6. Track Organization Template origin on concrete company workflow_definition
-- -----------------------------------------------------------------------
ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES organization_workflow_template(id);
ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS template_version INT;
ALTER TABLE workflow_definition ADD COLUMN IF NOT EXISTS is_customized BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_workflow_def_org_template
    ON workflow_definition (organization_id, template_id);

CREATE INDEX IF NOT EXISTS idx_workflow_def_company_template
    ON workflow_definition (company_id, template_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_def_company_template_ver
    ON workflow_definition (company_id, template_id, template_version)
    WHERE is_deleted = false AND template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_def_company_customized
    ON workflow_definition (company_id, is_customized);

-- -----------------------------------------------------------------------
-- 7. org_workflow_provision_log
-- Audit log of template provisioning and propagation across companies.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_workflow_provision_log (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID            NOT NULL,
    template_id             UUID            NOT NULL,
    template_version        INT             NOT NULL,
    company_id              UUID            NOT NULL,
    workflow_definition_id  UUID,
    status                  VARCHAR(50)     NOT NULL, -- SUCCESS, SKIPPED_CUSTOMIZED, FAILED, RETRY_SUCCESS
    message                 TEXT,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_wf_provision_log_org
    ON org_workflow_provision_log (organization_id, template_id);

CREATE INDEX IF NOT EXISTS idx_org_wf_provision_log_company
    ON org_workflow_provision_log (company_id);

