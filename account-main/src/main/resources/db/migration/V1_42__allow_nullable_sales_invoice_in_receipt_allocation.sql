-- Allow receipt_allocation to point to a proforma_invoice without a sales_invoice
ALTER TABLE receipt_allocation ALTER COLUMN sales_invoice_id DROP NOT NULL;

-- Ensure proforma_invoice_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'receipt_allocation' AND column_name = 'proforma_invoice_id'
    ) THEN
        ALTER TABLE receipt_allocation ADD COLUMN proforma_invoice_id UUID NULL;
    END IF;
END $$;

-- Ensure foreign key constraint for proforma_invoice_id exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fkqp56lt88n5ewnru813mdmj3a3' OR constraint_name = 'fk_ra_pi'
    ) THEN
        ALTER TABLE receipt_allocation
            ADD CONSTRAINT fk_ra_pi
            FOREIGN KEY (proforma_invoice_id)
            REFERENCES proforma_invoice(id);
    END IF;
END $$;

-- Add check constraint ensuring at least one invoice reference is present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_receipt_allocation_target'
    ) THEN
        ALTER TABLE receipt_allocation
            ADD CONSTRAINT chk_receipt_allocation_target
            CHECK (sales_invoice_id IS NOT NULL OR proforma_invoice_id IS NOT NULL);
    END IF;
END $$;
