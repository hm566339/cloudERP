-- V12: Multi-Company Multi-Role User Assignment Performance Indexes
-- Ensures fast lookup and composite integrity for user role assignments across companies

CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_role (user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_role (role_id);
CREATE INDEX IF NOT EXISTS idx_role_company_id ON role (company_id);
CREATE INDEX IF NOT EXISTS idx_member_company_access_member ON member_company_access (organization_member_id);
CREATE INDEX IF NOT EXISTS idx_member_company_access_company ON member_company_access (company_id);

