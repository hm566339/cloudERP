-- V9: General Settings Schema (Organization Information & Localization Settings)
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_org_settings_organization ON organization_settings (organization_id);

CREATE TABLE IF NOT EXISTS localization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    timezone VARCHAR(80) NOT NULL DEFAULT 'IST',
    date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(20) NOT NULL DEFAULT '12h',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_localization_settings_organization ON localization_settings (organization_id);

