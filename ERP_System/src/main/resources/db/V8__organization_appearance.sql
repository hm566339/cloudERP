-- V8: Organization Appearance Settings (Multi-Tenant Theme Isolation)
CREATE TABLE IF NOT EXISTS organization_appearance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    active_theme VARCHAR(50) NOT NULL DEFAULT 'sage',
    appearance_mode VARCHAR(20) NOT NULL DEFAULT 'system',
    layout_density VARCHAR(20) NOT NULL DEFAULT 'comfortable',
    font_family VARCHAR(50) NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_org_appearance_organization ON organization_appearance (organization_id);

