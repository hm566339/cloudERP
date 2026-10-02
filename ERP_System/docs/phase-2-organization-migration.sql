-- Phase 2 production migration (PostgreSQL).
-- Run after taking a backup. Keep hibernate.ddl-auto=validate in production.
-- This script is additive and does not merge users or delete legacy columns.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE company ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE authorization_code ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE session ADD COLUMN IF NOT EXISTS organization_id uuid;

CREATE TABLE IF NOT EXISTS organization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_code varchar(120) NOT NULL,
    legal_name varchar(255) NOT NULL,
    display_name varchar(255) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    access_mode varchar(30) NOT NULL DEFAULT 'FULL',
    timezone varchar(80),
    currency varchar(3),
    deleted_at timestamp,
    created_at timestamp,
    updated_at timestamp,
    CONSTRAINT uk_organization_code UNIQUE (organization_code)
);

CREATE TABLE IF NOT EXISTS organization_member (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organization(id),
    user_id uuid NOT NULL REFERENCES "user"(id),
    membership_status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    member_type varchar(30) NOT NULL DEFAULT 'MEMBER',
    joined_at timestamp NOT NULL DEFAULT now(),
    invited_by uuid REFERENCES "user"(id),
    deleted_at timestamp,
    created_at timestamp,
    updated_at timestamp,
    CONSTRAINT uk_organization_member_user UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS member_company_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_member_id uuid NOT NULL REFERENCES organization_member(id),
    organization_id uuid NOT NULL REFERENCES organization(id),
    company_id uuid NOT NULL REFERENCES company(id),
    active boolean NOT NULL DEFAULT true,
    created_at timestamp,
    updated_at timestamp,
    CONSTRAINT uk_member_company_access UNIQUE (organization_member_id, company_id)
);

CREATE TABLE IF NOT EXISTS subscription (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organization(id),
    plan_code varchar(80) NOT NULL DEFAULT 'TRIAL',
    price numeric(19,4),
    currency varchar(3) DEFAULT 'INR',
    status varchar(30) NOT NULL DEFAULT 'TRIALING',
    access_mode varchar(30) NOT NULL DEFAULT 'FULL',
    trial_started_at timestamp NOT NULL,
    trial_ends_at timestamp NOT NULL,
    current_period_start timestamp,
    current_period_end timestamp,
    cancelled_at timestamp,
    created_at timestamp,
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(80) NOT NULL UNIQUE,
    name varchar(160) NOT NULL,
    trial_days integer NOT NULL DEFAULT 30,
    max_users integer,
    max_companies integer,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp,
    updated_at timestamp
);
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plan(id);

CREATE TABLE IF NOT EXISTS plan_module (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES plan(id),
    module_id uuid NOT NULL REFERENCES module(id),
    enabled boolean NOT NULL DEFAULT true,
    CONSTRAINT uk_plan_module UNIQUE(plan_id, module_id)
);
CREATE TABLE IF NOT EXISTS organization_module (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organization(id),
    module_id uuid NOT NULL REFERENCES module(id),
    enabled boolean NOT NULL DEFAULT true,
    CONSTRAINT uk_organization_module UNIQUE(organization_id, module_id)
);

ALTER TABLE company ADD CONSTRAINT fk_company_organization
    FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE authorization_code ADD CONSTRAINT fk_authorization_code_organization
    FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE session ADD CONSTRAINT fk_session_organization
    FOREIGN KEY (organization_id) REFERENCES organization(id);

-- Existing data migration is intentionally explicit and reviewable.
-- Create one organization per existing company, then map existing users:
-- INSERT INTO organization (...)
-- SELECT gen_random_uuid(), lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g')), ... FROM company;
-- UPDATE company c SET organization_id = o.id FROM organization o WHERE ...;
-- INSERT INTO organization_member (...) SELECT ..., u.id ... FROM "user" u JOIN company c ON c.id=u.company_id;
-- INSERT INTO member_company_access (...) SELECT ..., om.id, c.organization_id, c.id ...;
-- Resolve slug/email conflicts manually; do not silently merge accounts.

CREATE TABLE IF NOT EXISTS refresh_token_record (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES session(id),
    token_hash varchar(64) NOT NULL UNIQUE,
    family_id uuid NOT NULL,
    issued_at timestamp NOT NULL,
    expires_at timestamp NOT NULL,
    used_at timestamp,
    revoked_at timestamp
);
CREATE INDEX IF NOT EXISTS idx_refresh_token_family ON refresh_token_record(family_id);

CREATE TABLE IF NOT EXISTS payment_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(80) NOT NULL,
    provider_event_id varchar(255) NOT NULL,
    event_type varchar(120) NOT NULL,
    signature_verified boolean NOT NULL,
    payload text NOT NULL,
    processing_status varchar(30) NOT NULL,
    processed_at timestamp,
    error_message varchar(1000),
    created_at timestamp,
    CONSTRAINT uk_payment_event_provider_id UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES subscription(id),
    provider varchar(80) NOT NULL,
    provider_payment_id varchar(255) NOT NULL,
    amount numeric(19,4) NOT NULL,
    currency varchar(3) NOT NULL,
    status varchar(30) NOT NULL,
    created_at timestamp,
    CONSTRAINT uk_payment_provider_id UNIQUE(provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS invoice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES subscription(id),
    period_start timestamp NOT NULL,
    period_end timestamp NOT NULL,
    amount numeric(19,4) NOT NULL,
    currency varchar(3) NOT NULL,
    status varchar(30) NOT NULL,
    created_at timestamp,
    updated_at timestamp,
    CONSTRAINT uk_invoice_subscription_period UNIQUE(subscription_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_organization_member_user_org ON organization_member(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_member_company_access_member_company ON member_company_access(organization_member_id, company_id);
CREATE INDEX IF NOT EXISTS idx_company_organization_id ON company(organization_id, id);
CREATE INDEX IF NOT EXISTS idx_subscription_organization_id ON subscription(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_user_organization ON session(user_id, organization_id);

-- Verification report. Resolve every non-zero mismatch before deprecating user.company_id.
SELECT 'total_users' AS metric, count(*)::bigint AS value FROM "user"
UNION ALL SELECT 'users_with_company', count(*) FROM "user" WHERE company_id IS NOT NULL
UNION ALL SELECT 'users_without_company', count(*) FROM "user" WHERE company_id IS NULL
UNION ALL SELECT 'users_with_membership', count(DISTINCT user_id) FROM organization_member
UNION ALL SELECT 'users_without_membership', count(*) FROM "user" u WHERE NOT EXISTS (SELECT 1 FROM organization_member m WHERE m.user_id = u.id)
UNION ALL SELECT 'legacy_relationships_without_access', count(*) FROM "user" u JOIN company c ON c.id = u.company_id
 WHERE NOT EXISTS (SELECT 1 FROM organization_member m JOIN member_company_access a ON a.organization_member_id=m.id AND a.company_id=c.id WHERE m.user_id=u.id AND a.active)
UNION ALL SELECT 'orphan_access_records', count(*) FROM member_company_access a LEFT JOIN organization_member m ON m.id=a.organization_member_id LEFT JOIN company c ON c.id=a.company_id WHERE m.id IS NULL OR c.id IS NULL;