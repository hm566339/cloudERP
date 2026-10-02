ALTER TABLE manufacturing_outbox ADD COLUMN IF NOT EXISTS source_module VARCHAR(30);
ALTER TABLE manufacturing_outbox ADD COLUMN IF NOT EXISTS source_id UUID;

CREATE TABLE IF NOT EXISTS manufacturing_accounting_event (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    production_order_id UUID NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    source_module VARCHAR(30) NOT NULL,
    source_id UUID NOT NULL,
    reference_no VARCHAR(100),
    amount NUMERIC(19,4) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    idempotency_key VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL,
    journal_entry_id UUID,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_mfg_acct_source UNIQUE(company_id, source_module, source_id, event_type),
    CONSTRAINT uk_mfg_acct_idempotency UNIQUE(company_id, source_module, idempotency_key)
);
