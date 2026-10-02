CREATE TABLE payment_term (
    id UUID PRIMARY KEY,
    version BIGINT,
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    created_by_username VARCHAR(255),
    updated_by UUID,
    updated_by_username VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID,
    deleted_by_username VARCHAR(255),
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX uk_payment_term_company_default
ON payment_term(company_id)
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE INDEX idx_payment_term_company_active
ON payment_term(company_id, is_active, is_deleted);

CREATE TABLE terms_condition (
    id UUID PRIMARY KEY,
    version BIGINT,
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    created_by_username VARCHAR(255),
    updated_by UUID,
    updated_by_username VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID,
    deleted_by_username VARCHAR(255),
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX uk_terms_condition_company_default
ON terms_condition(company_id)
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE INDEX idx_terms_condition_company_active
ON terms_condition(company_id, is_active, is_deleted);

ALTER TABLE quotation 
ADD COLUMN payment_term_id UUID,
ADD COLUMN terms_condition_id UUID;
