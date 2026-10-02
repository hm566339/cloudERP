-- Normalize existing NULL values to false
UPDATE proforma_invoice SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE proforma_invoice_item SET is_deleted = false WHERE is_deleted IS NULL;

-- Set default to false for future inserts (PostgreSQL syntax assumed, fallback standard)
ALTER TABLE proforma_invoice ALTER COLUMN is_deleted SET DEFAULT false;
ALTER TABLE proforma_invoice_item ALTER COLUMN is_deleted SET DEFAULT false;
