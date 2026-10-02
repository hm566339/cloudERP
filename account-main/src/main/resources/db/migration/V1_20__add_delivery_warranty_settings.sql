CREATE TABLE delivery_term (
    id UUID PRIMARY KEY,
    version BIGINT,
    company_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
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

CREATE UNIQUE INDEX uk_delivery_term_company_default
ON delivery_term(company_id, document_type)
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE INDEX idx_delivery_term_company_active
ON delivery_term(company_id, is_active, is_deleted);


CREATE TABLE warranty_term (
    id UUID PRIMARY KEY,
    version BIGINT,
    company_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
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

CREATE UNIQUE INDEX uk_warranty_term_company_default
ON warranty_term(company_id, document_type)
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE INDEX idx_warranty_term_company_active
ON warranty_term(company_id, is_active, is_deleted);


ALTER TABLE quotation 
ADD COLUMN delivery_term_id UUID,
ADD COLUMN warranty_term_id UUID;
