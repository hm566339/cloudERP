CREATE TABLE customer_address (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
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
    CONSTRAINT fk_customer_address_customer FOREIGN KEY (customer_id) REFERENCES customer(id),
    CONSTRAINT fk_customer_address_gst_state FOREIGN KEY (gst_state_id) REFERENCES gst_state_code(id)
);

ALTER TABLE ar_invoice
ADD COLUMN delivery_address_id UUID,
ADD COLUMN place_of_supply_state_id UUID,
ADD COLUMN place_of_supply_state_code VARCHAR(2),
ADD COLUMN delivery_address_line1 VARCHAR(255),
ADD COLUMN delivery_address_line2 VARCHAR(255),
ADD COLUMN delivery_city VARCHAR(255),
ADD COLUMN delivery_state VARCHAR(255),
ADD COLUMN delivery_postal_code VARCHAR(20),
ADD COLUMN delivery_country VARCHAR(255);

ALTER TABLE ar_invoice
DROP COLUMN IF EXISTS place_of_supply;
