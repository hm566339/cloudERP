-- ==============================================================================
-- Migration: Phase 6 Platform Admin, Roles, Support Access & Platform Audit
-- Target Database: PostgreSQL
-- Type: Additive, Production-Safe, Idempotent
-- ==============================================================================

-- 1. Platform Permissions Table
CREATE TABLE IF NOT EXISTS platform_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_permission_code ON platform_permission(code);

-- 2. Platform Roles Table
CREATE TABLE IF NOT EXISTS platform_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_platform_role_code ON platform_role(code);

-- 3. Platform Role Permissions Join Table
CREATE TABLE IF NOT EXISTS platform_role_permission (
    role_id UUID NOT NULL REFERENCES platform_role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES platform_permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_role_perm_role ON platform_role_permission(role_id);
CREATE INDEX IF NOT EXISTS idx_platform_role_perm_perm ON platform_role_permission(permission_id);

-- 4. Platform Admin Identity Table
CREATE TABLE IF NOT EXISTS platform_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITHOUT TIME ZONE,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_platform_admin_email ON platform_admin(email);
CREATE INDEX IF NOT EXISTS idx_platform_admin_status ON platform_admin(status);

-- 5. Platform Admin Roles Join Table
CREATE TABLE IF NOT EXISTS platform_admin_role (
    admin_id UUID NOT NULL REFERENCES platform_admin(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform_role(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_admin_role_admin ON platform_admin_role(admin_id);
CREATE INDEX IF NOT EXISTS idx_platform_admin_role_role ON platform_admin_role(role_id);

-- 6. Support Access Sessions Table
CREATE TABLE IF NOT EXISTS support_access_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_admin_id UUID NOT NULL REFERENCES platform_admin(id),
    organization_id UUID NOT NULL REFERENCES organization(id),
    company_id UUID NOT NULL REFERENCES company(id),
    module_id UUID NOT NULL REFERENCES module(id),
    module_code VARCHAR(100),
    reason VARCHAR(1000) NOT NULL,
    duration_minutes INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP WITHOUT TIME ZONE,
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITHOUT TIME ZONE,
    revoked_reason VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_session_admin ON support_access_session(platform_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_session_org ON support_access_session(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_session_comp ON support_access_session(company_id);
CREATE INDEX IF NOT EXISTS idx_support_session_status ON support_access_session(status);
CREATE INDEX IF NOT EXISTS idx_support_session_expires ON support_access_session(expires_at);

-- 7. Platform Audit Log Table (Append-Only)
CREATE TABLE IF NOT EXISTS platform_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_admin_id UUID REFERENCES platform_admin(id),
    admin_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    organization_id UUID,
    company_id UUID,
    module_id UUID,
    support_session_id UUID,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    reason VARCHAR(1000),
    ip_address VARCHAR(100),
    user_agent VARCHAR(500),
    result VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_admin ON platform_audit_log(platform_admin_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_org ON platform_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON platform_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_log(created_at DESC);

-- ==============================================================================
-- Seeds: Seed default permissions and roles
-- ==============================================================================

INSERT INTO platform_permission (code, description) VALUES
    ('PLATFORM_DASHBOARD_READ', 'View platform overview and metrics'),
    ('PLATFORM_ORGANIZATION_READ', 'View customer organizations'),
    ('PLATFORM_ORGANIZATION_WRITE', 'Modify customer organizations'),
    ('PLATFORM_USER_READ', 'View organization members and users'),
    ('PLATFORM_USER_WRITE', 'Modify customer users'),
    ('PLATFORM_COMPANY_READ', 'View organization companies'),
    ('PLATFORM_COMPANY_WRITE', 'Modify organization companies'),
    ('PLATFORM_SUBSCRIPTION_READ', 'View subscriptions and plans'),
    ('PLATFORM_SUBSCRIPTION_WRITE', 'Modify subscriptions and plans'),
    ('PLATFORM_PAYMENT_READ', 'View payments and invoices'),
    ('PLATFORM_PAYMENT_WRITE', 'Perform billing and payment operations'),
    ('PLATFORM_SUPPORT_ACCESS', 'Create and execute scoped customer support sessions'),
    ('PLATFORM_AUDIT_READ', 'View platform audit and security logs'),
    ('PLATFORM_ADMIN_MANAGE', 'Manage platform admin users and roles')
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_role (code, name, description) VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Full access to all platform functions'),
    ('SUPPORT_ADMIN', 'Support Administrator', 'Support access and customer troubleshooting'),
    ('BILLING_ADMIN', 'Billing Administrator', 'Manages plans, subscriptions and payments'),
    ('READ_ONLY_SUPPORT', 'Read-Only Support', 'Inspect customer data with read-only support access')
ON CONFLICT (code) DO NOTHING;

-- Map SUPER_ADMIN permissions (All)
INSERT INTO platform_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM platform_role r, platform_permission p
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Map SUPPORT_ADMIN permissions
INSERT INTO platform_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM platform_role r, platform_permission p
WHERE r.code = 'SUPPORT_ADMIN' AND p.code IN (
    'PLATFORM_DASHBOARD_READ',
    'PLATFORM_ORGANIZATION_READ',
    'PLATFORM_USER_READ',
    'PLATFORM_COMPANY_READ',
    'PLATFORM_SUPPORT_ACCESS',
    'PLATFORM_AUDIT_READ'
)
ON CONFLICT DO NOTHING;

-- Map BILLING_ADMIN permissions
INSERT INTO platform_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM platform_role r, platform_permission p
WHERE r.code = 'BILLING_ADMIN' AND p.code IN (
    'PLATFORM_DASHBOARD_READ',
    'PLATFORM_ORGANIZATION_READ',
    'PLATFORM_SUBSCRIPTION_READ',
    'PLATFORM_SUBSCRIPTION_WRITE',
    'PLATFORM_PAYMENT_READ',
    'PLATFORM_PAYMENT_WRITE'
)
ON CONFLICT DO NOTHING;

-- Map READ_ONLY_SUPPORT permissions
INSERT INTO platform_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM platform_role r, platform_permission p
WHERE r.code = 'READ_ONLY_SUPPORT' AND p.code IN (
    'PLATFORM_DASHBOARD_READ',
    'PLATFORM_ORGANIZATION_READ',
    'PLATFORM_USER_READ',
    'PLATFORM_COMPANY_READ',
    'PLATFORM_SUPPORT_ACCESS',
    'PLATFORM_AUDIT_READ'
)
ON CONFLICT DO NOTHING;
