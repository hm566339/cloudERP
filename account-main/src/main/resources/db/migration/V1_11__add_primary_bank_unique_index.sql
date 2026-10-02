-- Add a partial unique index to enforce a single active primary bank account per company
CREATE UNIQUE INDEX idx_bank_account_company_primary_active 
ON bank_account (company_id) 
WHERE is_primary = true AND is_active = true AND is_deleted = false;
