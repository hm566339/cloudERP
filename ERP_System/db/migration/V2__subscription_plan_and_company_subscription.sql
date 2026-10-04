-- ==============================================================
-- Migration: Subscription Plan, Plan Module & Company Subscription
-- ==============================================================

-- 1. Subscription Plan Table
CREATE TABLE IF NOT EXISTS subscription_plan (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    duration_days INT NOT NULL DEFAULT 30,
    price NUMERIC(19, 4) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_subscription_plan_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plan_active ON subscription_plan(active);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_is_trial ON subscription_plan(is_trial);

-- 2. Subscription Plan Module Mapping Table
CREATE TABLE IF NOT EXISTS subscription_plan_module (
    id UUID PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES subscription_plan(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES module(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_subscription_plan_module UNIQUE (plan_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_spm_plan ON subscription_plan_module(plan_id);
CREATE INDEX IF NOT EXISTS idx_spm_module ON subscription_plan_module(module_id);

-- 3. Company Subscription Table
CREATE TABLE IF NOT EXISTS company_subscription (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plan(id),
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'TRIALING',
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_sub_company ON company_subscription(company_id);
CREATE INDEX IF NOT EXISTS idx_company_sub_status ON company_subscription(status);
CREATE INDEX IF NOT EXISTS idx_company_sub_end_at ON company_subscription(end_at);
