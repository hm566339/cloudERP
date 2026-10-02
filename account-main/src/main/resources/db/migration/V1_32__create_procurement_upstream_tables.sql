-- Phase 3 upstream procurement documents. Existing data is preserved.
CREATE TABLE IF NOT EXISTS purchase_requisition (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    requisition_number VARCHAR(50) NOT NULL,
    requester_id UUID,
    department_id UUID,
    cost_center_id UUID,
    required_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    purpose TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    submitted_by UUID,
    submitted_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_prq_number_company UNIQUE (requisition_number, company_id)
);
CREATE INDEX IF NOT EXISTS idx_prq_company ON purchase_requisition(company_id);
CREATE INDEX IF NOT EXISTS idx_prq_status ON purchase_requisition(status);

CREATE TABLE IF NOT EXISTS purchase_requisition_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    purchase_requisition_id UUID NOT NULL REFERENCES purchase_requisition(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(20),
    requested_quantity NUMERIC(19,4) NOT NULL,
    unit VARCHAR(50),
    estimated_unit_price NUMERIC(19,4),
    estimated_amount NUMERIC(19,4),
    required_date DATE,
    warehouse_id UUID,
    location_id UUID,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_prqi_company ON purchase_requisition_item(company_id);
CREATE INDEX IF NOT EXISTS idx_prqi_requisition ON purchase_requisition_item(purchase_requisition_id);

CREATE TABLE IF NOT EXISTS rfq (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    rfq_number VARCHAR(50) NOT NULL,
    purchase_requisition_id UUID NOT NULL REFERENCES purchase_requisition(id),
    issue_date DATE NOT NULL,
    quotation_deadline DATE,
    expected_delivery_date DATE,
    terms TEXT,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rfq_number_company UNIQUE (rfq_number, company_id)
);
CREATE INDEX IF NOT EXISTS idx_rfq_company ON rfq(company_id);
CREATE INDEX IF NOT EXISTS idx_rfq_status ON rfq(status);
CREATE INDEX IF NOT EXISTS idx_rfq_pr ON rfq(purchase_requisition_id);

CREATE TABLE IF NOT EXISTS rfq_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    rfq_id UUID NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(20),
    quantity NUMERIC(19,4) NOT NULL,
    unit VARCHAR(50),
    required_date DATE,
    specifications TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_rfqi_rfq ON rfq_item(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfqi_company ON rfq_item(company_id);

CREATE TABLE IF NOT EXISTS rfq_vendor (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    rfq_id UUID NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    response_date TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_rfq_vendor UNIQUE (rfq_id, vendor_id)
);
CREATE INDEX IF NOT EXISTS idx_rfqv_company ON rfq_vendor(company_id);
CREATE INDEX IF NOT EXISTS idx_rfqv_vendor ON rfq_vendor(vendor_id);

CREATE TABLE IF NOT EXISTS supplier_quotation (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    company_id UUID NOT NULL,
    quotation_number VARCHAR(50) NOT NULL,
    rfq_id UUID NOT NULL REFERENCES rfq(id),
    vendor_id UUID NOT NULL,
    quotation_date DATE NOT NULL,
    valid_until DATE,
    delivery_terms TEXT,
    payment_terms TEXT,
    freight NUMERIC(19,4) DEFAULT 0,
    discount NUMERIC(19,4) DEFAULT 0,
    taxable_amount NUMERIC(19,4) DEFAULT 0,
    cgst_amount NUMERIC(19,4) DEFAULT 0,
    sgst_amount NUMERIC(19,4) DEFAULT 0,
    igst_amount NUMERIC(19,4) DEFAULT 0,
    cess_amount NUMERIC(19,4) DEFAULT 0,
    tax_amount NUMERIC(19,4) DEFAULT 0,
    grand_total NUMERIC(19,4) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT,
    awarded_by UUID,
    awarded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_sq_number_company UNIQUE (quotation_number, company_id),
    CONSTRAINT uk_sq_rfq_vendor UNIQUE (rfq_id, vendor_id)
);
CREATE INDEX IF NOT EXISTS idx_sq_company ON supplier_quotation(company_id);
CREATE INDEX IF NOT EXISTS idx_sq_rfq ON supplier_quotation(rfq_id);
CREATE INDEX IF NOT EXISTS idx_sq_vendor ON supplier_quotation(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sq_status ON supplier_quotation(status);

CREATE TABLE IF NOT EXISTS supplier_quotation_item (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    quotation_id UUID NOT NULL REFERENCES supplier_quotation(id) ON DELETE CASCADE,
    item_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(20),
    quantity NUMERIC(19,4) NOT NULL,
    unit VARCHAR(50),
    unit_price NUMERIC(19,4) NOT NULL,
    discount NUMERIC(19,4) DEFAULT 0,
    taxable_amount NUMERIC(19,4) DEFAULT 0,
    cgst_rate NUMERIC(5,2) DEFAULT 0,
    cgst_amount NUMERIC(19,4) DEFAULT 0,
    sgst_rate NUMERIC(5,2) DEFAULT 0,
    sgst_amount NUMERIC(19,4) DEFAULT 0,
    igst_rate NUMERIC(5,2) DEFAULT 0,
    igst_amount NUMERIC(19,4) DEFAULT 0,
    cess_rate NUMERIC(5,2) DEFAULT 0,
    cess_amount NUMERIC(19,4) DEFAULT 0,
    tax_amount NUMERIC(19,4) DEFAULT 0,
    total NUMERIC(19,4) DEFAULT 0,
    delivery_date DATE,
    hsn_sac_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_sqi_quotation ON supplier_quotation_item(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sqi_company ON supplier_quotation_item(company_id);

ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS supplier_quotation_id UUID;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS rfq_id UUID;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS purchase_requisition_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uk_po_supplier_quotation ON purchase_order(supplier_quotation_id) WHERE supplier_quotation_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_po_rfq ON purchase_order(rfq_id);
CREATE INDEX IF NOT EXISTS idx_po_prq ON purchase_order(purchase_requisition_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_rfq_vendor_vendor') THEN
        ALTER TABLE rfq_vendor ADD CONSTRAINT fk_rfq_vendor_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_supplier_quotation_vendor') THEN
        ALTER TABLE supplier_quotation ADD CONSTRAINT fk_supplier_quotation_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_po_supplier_quotation') THEN
        ALTER TABLE purchase_order ADD CONSTRAINT fk_po_supplier_quotation FOREIGN KEY (supplier_quotation_id) REFERENCES supplier_quotation(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_po_rfq') THEN
        ALTER TABLE purchase_order ADD CONSTRAINT fk_po_rfq FOREIGN KEY (rfq_id) REFERENCES rfq(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_po_purchase_requisition') THEN
        ALTER TABLE purchase_order ADD CONSTRAINT fk_po_purchase_requisition FOREIGN KEY (purchase_requisition_id) REFERENCES purchase_requisition(id);
    END IF;
END $$;
