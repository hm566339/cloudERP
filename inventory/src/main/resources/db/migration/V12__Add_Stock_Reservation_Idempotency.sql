-- Add idempotency_key column and unique constraint to stock_reservation table
ALTER TABLE stock_reservation ADD COLUMN IF NOT EXISTS idempotency_key UUID;
ALTER TABLE stock_reservation ADD CONSTRAINT uk_stock_reservation_idempotency UNIQUE (company_id, idempotency_key);
