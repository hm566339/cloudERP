-- =============================================================================
-- V4__create_document_flow_configuration.sql
-- Company-specific Document Flow Configuration across all ERP modules
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_flow_config (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID            NOT NULL,
    module_name         VARCHAR(100)    NOT NULL,
    flow_name           VARCHAR(150)    NOT NULL,
    description         TEXT,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_default          BOOLEAN         NOT NULL DEFAULT FALSE,
    flow_data           TEXT            NOT NULL,
    created_at          TIMESTAMP       WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    created_by_username VARCHAR(255),
    updated_by          UUID,
    updated_by_username VARCHAR(255),
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_by          UUID,
    deleted_by_username VARCHAR(255),
    deleted_at          TIMESTAMP       WITHOUT TIME ZONE,
    CONSTRAINT uq_doc_flow_company_module_name UNIQUE (company_id, module_name, flow_name)
);

CREATE INDEX IF NOT EXISTS idx_doc_flow_company_module
    ON document_flow_config (company_id, module_name, is_active)
    WHERE is_deleted = FALSE;
