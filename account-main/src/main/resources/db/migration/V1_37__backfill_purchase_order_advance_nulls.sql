-- Backfill NULL values for advance_paid_amount and advance_amount in purchase_order
UPDATE purchase_order 
SET advance_paid_amount = 0 
WHERE advance_paid_amount IS NULL;

UPDATE purchase_order 
SET advance_amount = 0 
WHERE advance_amount IS NULL;
