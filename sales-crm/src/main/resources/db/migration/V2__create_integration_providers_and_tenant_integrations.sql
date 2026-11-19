-- Flyway Migration: 2-Tier Multi-Tenant Integrations Schema

CREATE TABLE IF NOT EXISTS integration_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    auth_type VARCHAR(30) NOT NULL,
    global_config_json TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    integration_name VARCHAR(150) NOT NULL,
    credentials_json TEXT,
    routing_config_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'CONNECTED',
    webhook_slug VARCHAR(120) UNIQUE,
    last_synced_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_provider ON tenant_integrations (provider_code);

-- Seed global integration providers
INSERT INTO integration_providers (code, display_name, auth_type, global_config_json, is_enabled)
VALUES
    ('FACEBOOK', 'Meta / Facebook Lead Ads', 'OAUTH2',
     '{"clientId":"","clientSecret":"","apiBaseUrl":"https://graph.facebook.com/v19.0","redirectUri":"https://www.mark2.in/erp/sales-crm/integrations","defaultFieldMapping":{"full_name":"fullName","email":"email","phone_number":"phone","company_name":"companyName"}}',
     TRUE),
    ('INDIAMART', 'IndiaMART B2B Portal', 'API_KEY',
     '{"apiBaseUrl":"https://mapi.indiamart.com/wservce/enquiry/listing","defaultFieldMapping":{"SENDER_NAME":"fullName","SENDER_EMAIL":"email","SENDER_MOBILE":"phone","SENDER_COMPANY":"companyName","QUERY_MESSAGE":"inquiryNotes"}}',
     TRUE),
    ('TRADEINDIA', 'TradeIndia Marketplace', 'WEBHOOK',
     '{"apiBaseUrl":"https://www.tradeindia.com/utils/my_inquiry.html","defaultFieldMapping":{"sender_name":"fullName","sender_email":"email","sender_mobile":"phone","sender_co":"companyName","message":"inquiryNotes"}}',
     TRUE),
    ('CUSTOM_WEBHOOK', 'Custom Inbound Webhook', 'WEBHOOK',
     '{"defaultFieldMapping":{"name":"fullName","email":"email","phone":"phone","company":"companyName","notes":"inquiryNotes"}}',
     TRUE)
ON CONFLICT (code) DO NOTHING;
