-- Flyway Migration V1_30: Create Purchase Order, Goods Receipt, and Purchase Return tables with production constraints
-- Includes safe cleanup of orphaned references prior to creating foreign keys.

-- 1. PURCHASE ORDER
CREATE TABLE IF NOT EXISTS purchase_order (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    po_number VARCHAR(50) NOT NULL,
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    currency VARCHAR(10) DEFAULT 'INR',
    exchange_rate NUMERIC(15, 6) DEFAULT 1.0,
    place_of_supply_state_id UUID,
    place_of_supply_state_code VARCHAR(10),
    vendor_address_id UUID,
    purchase_address_line1 VARCHAR(255),
    purchase_address_line2 VARCHAR(255),
    purchase_city VARCHAR(100),
    purchase_state VARCHAR(100),
    purchase_country VARCHAR(100),
    purchase_postal_code VARCHAR(20),
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    terms_and_conditions TEXT,
    notes TEXT,
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) DEFAULT 0.00,
    cess_amount NUMERIC(15, 2) DEFAULT 0.00,
    freight_charges NUMERIC(15, 2) DEFAULT 0.00,
    other_charges NUMERIC(15, 2) DEFAULT 0.00,
    total_before_round_off NUMERIC(15, 2) DEFAULT 0.00,
    round_off NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    cancellation_reason VARCHAR(500),
    cancelled_by UUID,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_po_number_company UNIQUE (po_number, company_id)
);

CREATE INDEX IF NOT EXISTS idx_po_company ON purchase_order(company_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor ON purchase_order(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_order(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_order(po_date);
CREATE INDEX IF NOT EXISTS idx_po_deleted ON purchase_order(is_deleted);

-- 2. PURCHASE ORDER ITEM
CREATE TABLE IF NOT EXISTS purchase_order_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_sac_id UUID,
    unit VARCHAR(30),
    item_type VARCHAR(30) DEFAULT 'PRODUCT',
    ordered_quantity NUMERIC(15, 4) NOT NULL,
    received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    pending_quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(15, 2) DEFAULT 0.00,
    cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) DEFAULT 0.00,
    cess_rate NUMERIC(5, 2) DEFAULT 0.00,
    cess_amount NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    warehouse_id UUID,
    location_id UUID,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_item(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_item ON purchase_order_item(item_id);
CREATE INDEX IF NOT EXISTS idx_poi_company ON purchase_order_item(company_id);

-- 3. GOODS RECEIPT
CREATE TABLE IF NOT EXISTS goods_receipt (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_order(id),
    grn_number VARCHAR(50) NOT NULL,
    grn_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    warehouse_id UUID,
    delivery_note_number VARCHAR(100),
    delivery_note_date DATE,
    vehicle_number VARCHAR(50),
    transporter_name VARCHAR(100),
    notes TEXT,
    confirmed_by UUID,
    confirmed_at TIMESTAMP,
    cancellation_reason VARCHAR(500),
    cancelled_by UUID,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_grn_number_company UNIQUE (grn_number, company_id)
);

CREATE INDEX IF NOT EXISTS idx_grn_company ON goods_receipt(company_id);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_vendor ON goods_receipt(vendor_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipt(status);
CREATE INDEX IF NOT EXISTS idx_grn_date ON goods_receipt(grn_date);

-- 4. GOODS RECEIPT ITEM
CREATE TABLE IF NOT EXISTS goods_receipt_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipt(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_item(id),
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(30),
    item_type VARCHAR(30) DEFAULT 'PRODUCT',
    ordered_quantity NUMERIC(15, 4) NOT NULL,
    previously_received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    received_quantity NUMERIC(15, 4) NOT NULL,
    accepted_quantity NUMERIC(15, 4) NOT NULL,
    rejected_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    pending_quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 4) DEFAULT 0.0000,
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiry_date DATE,
    warehouse_id UUID,
    location_id UUID,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_gri_grn ON goods_receipt_item(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_gri_poi ON goods_receipt_item(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_gri_item ON goods_receipt_item(item_id);

-- 5. PURCHASE RETURN
CREATE TABLE IF NOT EXISTS purchase_return (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    return_number VARCHAR(50) NOT NULL,
    return_date DATE NOT NULL,
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipt(id),
    purchase_order_id UUID REFERENCES purchase_order(id),
    vendor_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reason VARCHAR(500),
    notes VARCHAR(1000),
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_pr_number_company UNIQUE (return_number, company_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_company ON purchase_return(company_id);
CREATE INDEX IF NOT EXISTS idx_pr_grn ON purchase_return(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_pr_po ON purchase_return(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_pr_vendor ON purchase_return(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_return(status);

-- 6. PURCHASE RETURN ITEM
CREATE TABLE IF NOT EXISTS purchase_return_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    purchase_return_id UUID NOT NULL REFERENCES purchase_return(id) ON DELETE CASCADE,
    goods_receipt_item_id UUID REFERENCES goods_receipt_item(id),
    purchase_order_item_id UUID REFERENCES purchase_order_item(id),
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(30),
    returned_quantity NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 4) DEFAULT 0.0000,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pri_return ON purchase_return_item(purchase_return_id);
CREATE INDEX IF NOT EXISTS idx_pri_grn_item ON purchase_return_item(goods_receipt_item_id);

-- 7. SAFE CLEANUP OF ORPHANED UUIDS ON AP_INVOICE BEFORE CREATING FOREIGN KEYS
UPDATE ap_invoice
SET purchase_order_id = NULL
WHERE purchase_order_id IS NOT NULL
  AND purchase_order_id NOT IN (SELECT id FROM purchase_order);

UPDATE ap_invoice
SET goods_receipt_id = NULL
WHERE goods_receipt_id IS NOT NULL
  AND goods_receipt_id NOT IN (SELECT id FROM goods_receipt);

-- 8. ADD FOREIGN KEYS ON AP_INVOICE SAFELY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_ap_invoice_purchase_order'
    ) THEN
        ALTER TABLE ap_invoice
        ADD CONSTRAINT fk_ap_invoice_purchase_order
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_ap_invoice_goods_receipt'
    ) THEN
        ALTER TABLE ap_invoice
        ADD CONSTRAINT fk_ap_invoice_goods_receipt
        FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipt(id) ON DELETE SET NULL;
    END IF;
END $$;
