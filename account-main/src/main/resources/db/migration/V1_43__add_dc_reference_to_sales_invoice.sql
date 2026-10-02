-- Add source Delivery Challan lineage columns to sales_invoice
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_invoice' AND column_name = 'source_delivery_challan_id'
    ) THEN
        ALTER TABLE sales_invoice ADD COLUMN source_delivery_challan_id UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_invoice' AND column_name = 'source_delivery_challan_number'
    ) THEN
        ALTER TABLE sales_invoice ADD COLUMN source_delivery_challan_number VARCHAR(50) NULL;
    END IF;
END $$;

-- Add index on source_delivery_challan_id
CREATE INDEX IF NOT EXISTS idx_sales_invoice_dc ON sales_invoice(source_delivery_challan_id);
