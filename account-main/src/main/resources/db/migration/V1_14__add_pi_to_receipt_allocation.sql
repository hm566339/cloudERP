-- Allow receipt_allocation to point to a proforma_invoice instead of a sales_invoice
ALTER TABLE receipt_allocation ALTER COLUMN sales_invoice_id DROP NOT NULL;

-- Add proforma_invoice reference
ALTER TABLE receipt_allocation ADD COLUMN proforma_invoice_id UUID NULL;

-- Add Foreign Key
ALTER TABLE receipt_allocation
    ADD CONSTRAINT fk_ra_pi
    FOREIGN KEY (proforma_invoice_id)
    REFERENCES proforma_invoice(id);
