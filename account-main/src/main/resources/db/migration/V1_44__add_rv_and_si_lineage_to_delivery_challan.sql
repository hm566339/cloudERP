-- Migration V1_44: Add Receipt Voucher and Sales Invoice lineage to delivery_challan and delivery_challan_item

-- 1. Allow delivery_challan_item to have nullable source_so_item_id
ALTER TABLE delivery_challan_item ALTER COLUMN source_so_item_id DROP NOT NULL;

-- 2. Add source_si_item_id to delivery_challan_item
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_challan_item' AND column_name = 'source_si_item_id'
    ) THEN
        ALTER TABLE delivery_challan_item ADD COLUMN source_si_item_id UUID NULL;
    END IF;
END $$;

-- 3. Add FK constraint and index for source_si_item_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dc_item_si_item'
    ) THEN
        ALTER TABLE delivery_challan_item
            ADD CONSTRAINT fk_dc_item_si_item
            FOREIGN KEY (source_si_item_id)
            REFERENCES sales_invoice_item(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dc_item_source_si_item ON delivery_challan_item(source_si_item_id);

-- 4. Add lineage columns to delivery_challan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_challan' AND column_name = 'source_si_id'
    ) THEN
        ALTER TABLE delivery_challan ADD COLUMN source_si_id UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_challan' AND column_name = 'source_si_number'
    ) THEN
        ALTER TABLE delivery_challan ADD COLUMN source_si_number VARCHAR(50) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_challan' AND column_name = 'source_rv_id'
    ) THEN
        ALTER TABLE delivery_challan ADD COLUMN source_rv_id UUID NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_challan' AND column_name = 'source_rv_number'
    ) THEN
        ALTER TABLE delivery_challan ADD COLUMN source_rv_number VARCHAR(50) NULL;
    END IF;
END $$;

-- 5. Add FK constraints and indexes on delivery_challan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dc_source_si'
    ) THEN
        ALTER TABLE delivery_challan
            ADD CONSTRAINT fk_dc_source_si
            FOREIGN KEY (source_si_id)
            REFERENCES sales_invoice(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dc_source_rv'
    ) THEN
        ALTER TABLE delivery_challan
            ADD CONSTRAINT fk_dc_source_rv
            FOREIGN KEY (source_rv_id)
            REFERENCES receipt_voucher(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dc_si ON delivery_challan(source_si_id);
CREATE INDEX IF NOT EXISTS idx_dc_rv ON delivery_challan(source_rv_id);
