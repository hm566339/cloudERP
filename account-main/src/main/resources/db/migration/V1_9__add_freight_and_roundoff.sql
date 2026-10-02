-- Add freight_charges, total_before_round_off, and round_off to sales_invoice
ALTER TABLE sales_invoice 
ADD COLUMN freight_charges NUMERIC(19,4) DEFAULT 0.0000,
ADD COLUMN total_before_round_off NUMERIC(19,4) DEFAULT 0.0000,
ADD COLUMN round_off NUMERIC(19,4) DEFAULT 0.0000;

-- Update existing records in sales_invoice so they have proper values
UPDATE sales_invoice 
SET freight_charges = 0.0000,
    total_before_round_off = total_amount,
    round_off = 0.0000
WHERE freight_charges IS NULL;

-- Add freight_charges, total_before_round_off, and round_off to ap_invoice
ALTER TABLE ap_invoice 
ADD COLUMN freight_charges NUMERIC(19,4) DEFAULT 0.0000,
ADD COLUMN total_before_round_off NUMERIC(19,4) DEFAULT 0.0000,
ADD COLUMN round_off NUMERIC(19,4) DEFAULT 0.0000;

-- Update existing records in ap_invoice so they have proper values
UPDATE ap_invoice 
SET freight_charges = 0.0000,
    total_before_round_off = total_amount,
    round_off = 0.0000
WHERE freight_charges IS NULL;
