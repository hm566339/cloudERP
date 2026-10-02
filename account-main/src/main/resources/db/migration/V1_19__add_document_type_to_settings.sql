-- 1. Add document_type to payment_term and terms_condition
ALTER TABLE payment_term ADD COLUMN document_type VARCHAR(50);
ALTER TABLE terms_condition ADD COLUMN document_type VARCHAR(50);

-- Migrate existing records to QUOTATION
UPDATE payment_term SET document_type = 'QUOTATION' WHERE document_type IS NULL;
UPDATE terms_condition SET document_type = 'QUOTATION' WHERE document_type IS NULL;

-- Make it NOT NULL
ALTER TABLE payment_term ALTER COLUMN document_type SET NOT NULL;
ALTER TABLE terms_condition ALTER COLUMN document_type SET NOT NULL;

-- 2. Drop old default unique indexes
DROP INDEX IF EXISTS uk_payment_term_company_default;
DROP INDEX IF EXISTS uk_terms_condition_company_default;

-- Create new default unique indexes including document_type
CREATE UNIQUE INDEX uk_payment_term_company_default 
ON payment_term (company_id, document_type) 
WHERE is_default = TRUE AND is_deleted = FALSE;

CREATE UNIQUE INDEX uk_terms_condition_company_default 
ON terms_condition (company_id, document_type) 
WHERE is_default = TRUE AND is_deleted = FALSE;

-- 3. Add T&C fields to sales_order
ALTER TABLE sales_order ADD COLUMN payment_term_id UUID;
ALTER TABLE sales_order ADD COLUMN terms_condition_id UUID;
ALTER TABLE sales_order ADD COLUMN terms_and_conditions TEXT;

-- 4. Add T&C fields to proforma_invoice
ALTER TABLE proforma_invoice ADD COLUMN payment_term_id UUID;
ALTER TABLE proforma_invoice ADD COLUMN terms_condition_id UUID;
ALTER TABLE proforma_invoice ADD COLUMN terms_and_conditions TEXT;

-- 5. Add T&C fields to sales_invoice 
ALTER TABLE sales_invoice ADD COLUMN payment_term_id UUID;
ALTER TABLE sales_invoice ADD COLUMN terms_condition_id UUID;
ALTER TABLE sales_invoice ADD COLUMN payment_terms TEXT;
ALTER TABLE sales_invoice ADD COLUMN terms_and_conditions TEXT;
ALTER TABLE sales_invoice ADD COLUMN delivery_terms TEXT;
