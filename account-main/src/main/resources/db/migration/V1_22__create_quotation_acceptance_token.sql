CREATE TABLE quotation_acceptance_token (
    id UUID PRIMARY KEY,
    quotation_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_quotation_acceptance_token_quotation FOREIGN KEY (quotation_id) REFERENCES quotation(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotation_acceptance_token_quotation_id ON quotation_acceptance_token(quotation_id);
CREATE INDEX idx_quotation_acceptance_token_expires_at ON quotation_acceptance_token(expires_at);
