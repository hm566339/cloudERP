-- Drop the old constraint which only allowed: SELF_PAID, COMPANY_PAID, ADVANCE
ALTER TABLE expense_claim_item DROP CONSTRAINT IF EXISTS expense_claim_item_payment_type_check;

-- First, map any existing old values to new ones to ensure the new constraint can be applied.
-- Assuming SELF_PAID -> CASH, COMPANY_PAID -> BANK, ADVANCE -> OTHER
-- This ensures we preserve valid existing data while migrating them to the new application enum.
UPDATE expense_claim_item SET payment_type = 'CASH' WHERE payment_type = 'SELF_PAID';
UPDATE expense_claim_item SET payment_type = 'BANK' WHERE payment_type = 'COMPANY_PAID';
UPDATE expense_claim_item SET payment_type = 'OTHER' WHERE payment_type = 'ADVANCE';

-- Add the new constraint reflecting the Java PaymentType enum: CASH, BANK, CARD, UPI, OTHER
ALTER TABLE expense_claim_item ADD CONSTRAINT expense_claim_item_payment_type_check 
CHECK (payment_type IN ('CASH', 'BANK', 'CARD', 'UPI', 'OTHER'));
