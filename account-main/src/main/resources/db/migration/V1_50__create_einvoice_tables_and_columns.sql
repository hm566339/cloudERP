-- Flyway Migration V1_50: Add GST e-Invoice Schema, Multi-GSTIN mapping, Job Queue, Outbox, and Audit Logs
-- DO NOT EXECUTE MANUALLY - Managed by Flyway in appropriate deployment pipelines

-- 1. Alter sales_invoice to link to specific GST registration and track e-Invoice state
ALTER TABLE sales_invoice 
    ADD COLUMN IF NOT EXISTS gst_registration_id UUID REFERENCES gst_registration(id),
    ADD COLUMN IF NOT EXISTS irn VARCHAR(64),
    ADD COLUMN IF NOT EXISTS ack_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ack_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS signed_invoice TEXT,
    ADD COLUMN IF NOT EXISTS signed_qr_code TEXT,
    ADD COLUMN IF NOT EXISTS einvoice_status VARCHAR(30) DEFAULT 'NOT_REQUESTED' NOT NULL,
    ADD COLUMN IF NOT EXISTS einvoice_failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS is_mock_einvoice BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sales_invoice_gst_reg ON sales_invoice(gst_registration_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_irn ON sales_invoice(irn) WHERE irn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_invoice_einvoice_status ON sales_invoice(company_id, einvoice_status);

-- 2. Company / Branch e-Invoice Provider Configuration (Tenant & GSTIN isolated)
CREATE TABLE IF NOT EXISTS company_einvoice_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company(id),
    gst_registration_id UUID NOT NULL REFERENCES gst_registration(id),
    provider_name VARCHAR(50) NOT NULL DEFAULT 'MOCK', -- 'MOCK', 'NIC_DIRECT', 'CLEARTAX', 'MASTERS_INDIA'
    environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX', -- 'SANDBOX', 'PRODUCTION'
    client_id VARCHAR(255),
    encrypted_client_secret TEXT,
    portal_username VARCHAR(100),
    encrypted_portal_password TEXT,
    encrypted_auth_token TEXT,
    encrypted_sek TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    auto_generate_on_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uq_company_einvoice_gstin UNIQUE (company_id, gst_registration_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_einv_cfg_tenant ON company_einvoice_config(company_id);

-- 3. Asynchronous e-Invoice Jobs (For RabbitMQ processing, idempotency, and retries)
CREATE TABLE IF NOT EXISTS einvoice_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company(id),
    invoice_id UUID NOT NULL REFERENCES sales_invoice(id),
    gst_registration_id UUID NOT NULL REFERENCES gst_registration(id),
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'GENERATED', 'FAILED', 'RECONCILIATION_REQUIRED', 'CANCELLED'
    idempotency_key VARCHAR(100) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    failure_reason TEXT,
    irn VARCHAR(64),
    ack_number VARCHAR(50),
    ack_date TIMESTAMP WITH TIME ZONE,
    signed_invoice TEXT,
    signed_qr_code TEXT,
    is_mock BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    CONSTRAINT uq_einvoice_job_idempotency UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_einvoice_job_invoice ON einvoice_job(invoice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_einvoice_job_status ON einvoice_job(company_id, status);

-- CRITICAL CONCURRENCY HARDENING:
-- Partial unique index ensures at the database level that only ONE active ('QUEUED' or 'PROCESSING')
-- job can exist per sales invoice at any given time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_einvoice_active_job 
    ON einvoice_job(company_id, invoice_id) 
    WHERE status IN ('QUEUED', 'PROCESSING');


-- 4. Transactional Outbox (Guarantees atomic DB commit and message dispatch to RabbitMQ)
CREATE TABLE IF NOT EXISTS einvoice_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES einvoice_job(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company(id),
    invoice_id UUID NOT NULL REFERENCES sales_invoice(id),
    payload TEXT NOT NULL,
    exchange VARCHAR(100) NOT NULL,
    routing_key VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_einvoice_outbox_pending ON einvoice_outbox(status, created_at ASC);

-- 5. Comprehensive Audit Log (Compliance, provider trace, timing)
CREATE TABLE IF NOT EXISTS einvoice_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES einvoice_job(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES company(id),
    invoice_id UUID NOT NULL REFERENCES sales_invoice(id),
    action VARCHAR(50) NOT NULL, -- 'QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'RECONCILIATION_REQUIRED', 'CANCELLED'
    provider VARCHAR(50) NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    error_code VARCHAR(50),
    error_message TEXT,
    execution_duration_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_einvoice_audit_inv ON einvoice_audit_log(company_id, invoice_id, created_at DESC);
