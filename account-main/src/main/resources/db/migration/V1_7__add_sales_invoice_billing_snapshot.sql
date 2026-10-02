-- V1_7__add_sales_invoice_billing_snapshot.sql
-- Add billing address snapshot fields to sales_invoice

ALTER TABLE sales_invoice 
ADD COLUMN IF NOT EXISTS billing_address_id UUID,
ADD COLUMN IF NOT EXISTS billing_address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_state_code VARCHAR(10);
