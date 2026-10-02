CREATE TABLE vendor_address (
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    address_type VARCHAR(50) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    gst_state_id UUID,
    country VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by UUID,
    CONSTRAINT fk_vendor_address_vendor FOREIGN KEY (vendor_id) REFERENCES vendor(id),
    CONSTRAINT fk_vendor_address_gst_state FOREIGN KEY (gst_state_id) REFERENCES gst_state_code(id)
);

ALTER TABLE ap_invoice
ADD COLUMN place_of_supply_state_id UUID,
ADD COLUMN place_of_supply_state_code VARCHAR(10),
ADD COLUMN vendor_address_id UUID,
ADD COLUMN purchase_address_line1 VARCHAR(255),
ADD COLUMN purchase_address_line2 VARCHAR(255),
ADD COLUMN purchase_city VARCHAR(100),
ADD COLUMN purchase_state VARCHAR(100),
ADD COLUMN purchase_country VARCHAR(100),
ADD COLUMN purchase_postal_code VARCHAR(20);

ALTER TABLE ap_invoice_item
ADD COLUMN hsn_sac_id UUID;
