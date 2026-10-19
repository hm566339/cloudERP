CREATE TABLE IF NOT EXISTS manufacturing_operation_record (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    operation_type VARCHAR(60) NOT NULL,
    business_id UUID NOT NULL,
    line_id UUID,
    idempotency_key VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    inventory_reference_id UUID,
    request_payload TEXT,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_mfg_op_idempotency UNIQUE(company_id, operation_type, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_mfg_op_recon ON manufacturing_operation_record (company_id, status);
