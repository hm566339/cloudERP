-- Add unique constraint to prevent duplicate idempotency keys for the same company
ALTER TABLE stock_movement ADD CONSTRAINT uk_stock_movement_idempotency UNIQUE (company_id, idempotency_key);
