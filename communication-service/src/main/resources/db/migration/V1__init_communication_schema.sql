-- ==============================================================================
-- Schema Initialization for Communication Service (Mark2 ERP)
-- Flyway Migration: V1__init_communication_schema.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notification_request (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    event_code VARCHAR(100) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    recipient_masked VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    idempotency_key VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP,
    error_summary TEXT,
    payload_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_req_company_id ON notification_request(company_id);
CREATE INDEX IF NOT EXISTS idx_notif_req_status_retry ON notification_request(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notif_req_company_created ON notification_request(company_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_company_idempotency ON notification_request(company_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_delivery (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notification_request(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    attempt_number INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms BIGINT,
    error_details TEXT
);

CREATE INDEX IF NOT EXISTS idx_notif_deliv_notif_id ON notification_delivery(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_deliv_status ON notification_delivery(status);
