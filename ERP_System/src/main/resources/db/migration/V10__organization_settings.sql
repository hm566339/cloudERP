-- V10: Organization Settings Schema (Profile, Regional & Security Settings)
ALTER TABLE organization ADD COLUMN IF NOT EXISTS primary_email VARCHAR(255);

CREATE TABLE IF NOT EXISTS organization_regional_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata (IST)',
    fiscal_year_start_month VARCHAR(30) NOT NULL DEFAULT 'April',
    date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(20) NOT NULL DEFAULT '12h',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_org_regional_settings_org ON organization_regional_settings (organization_id);

CREATE TABLE IF NOT EXISTS organization_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    enforce_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_org_security_settings_org ON organization_security_settings (organization_id);

