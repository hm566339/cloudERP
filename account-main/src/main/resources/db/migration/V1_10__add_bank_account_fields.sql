ALTER TABLE bank_account 
ADD COLUMN account_holder_name VARCHAR(255),
ADD COLUMN swift_code VARCHAR(20),
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

-- Index for quick primary account lookups
CREATE INDEX idx_bank_account_company_primary ON bank_account(company_id, is_primary);
