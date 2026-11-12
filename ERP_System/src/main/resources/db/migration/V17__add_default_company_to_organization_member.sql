-- =========================================================================
-- Add owner-controlled default_company_id to organization_member
-- Scoped per organization membership (user may belong to multiple orgs).
-- =========================================================================
ALTER TABLE organization_member
    ADD COLUMN IF NOT EXISTS default_company_id UUID REFERENCES company(id);

CREATE INDEX IF NOT EXISTS idx_organization_member_default_company
    ON organization_member (default_company_id);

