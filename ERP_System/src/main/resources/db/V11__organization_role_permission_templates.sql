-- V11: Organization-Level Role Management and Permission Templates
-- Supports central role templates scoped to organization_id, applied to company-specific roles

-- 1. Organization Role Template Table
CREATE TABLE IF NOT EXISTS organization_role_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_org_role_template_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_org_role_template_org ON organization_role_template (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_role_template_status ON organization_role_template (organization_id, status);

-- 2. Organization Role Template Permissions Mapping
CREATE TABLE IF NOT EXISTS organization_role_template_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_template_id UUID NOT NULL REFERENCES organization_role_template(id) ON DELETE CASCADE,
    feature_permission_id UUID NOT NULL REFERENCES feature_permission(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_org_role_template_perm UNIQUE (role_template_id, feature_permission_id)
);

CREATE INDEX IF NOT EXISTS idx_org_template_perm_template ON organization_role_template_permission (role_template_id);
CREATE INDEX IF NOT EXISTS idx_org_template_perm_feature ON organization_role_template_permission (feature_permission_id);

-- 3. Link Company-Scoped Role to Organization Template
ALTER TABLE role ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES organization_role_template(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_role_template_id ON role (template_id);

