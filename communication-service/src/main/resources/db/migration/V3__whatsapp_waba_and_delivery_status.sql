-- ==============================================================================
-- Flyway Migration: V3__whatsapp_waba_and_delivery_status.sql
-- Multi-tenant Meta WhatsApp Cloud API (WABA) Configuration & Delivery Tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS company_whatsapp_config (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    phone_number_id VARCHAR(100) NOT NULL,
    waba_id VARCHAR(100),
    access_token TEXT NOT NULL,
    webhook_verify_token VARCHAR(255),
    api_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_whatsapp_company UNIQUE (company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_whatsapp_company ON company_whatsapp_config(company_id);
CREATE INDEX IF NOT EXISTS idx_company_whatsapp_phone_id ON company_whatsapp_config(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_company_whatsapp_active ON company_whatsapp_config(is_active);

-- Index provider_message_id on notification_delivery for rapid webhook status lookups
CREATE INDEX IF NOT EXISTS idx_notif_deliv_prov_msg_id ON notification_delivery(provider_message_id)
    WHERE provider_message_id IS NOT NULL;
