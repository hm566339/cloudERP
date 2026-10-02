-- Add new Place of Supply and Delivery Address fields to Sales Invoice table
ALTER TABLE sales_invoice
    ADD COLUMN place_of_supply_state_id UUID,
    ADD COLUMN place_of_supply_state_code VARCHAR(10),
    ADD COLUMN delivery_address_id UUID,
    ADD COLUMN delivery_address_line1 VARCHAR(255),
    ADD COLUMN delivery_address_line2 VARCHAR(255),
    ADD COLUMN delivery_city VARCHAR(100),
    ADD COLUMN delivery_state VARCHAR(100),
    ADD COLUMN delivery_postal_code VARCHAR(20),
    ADD COLUMN delivery_country VARCHAR(100);

-- Note: We are keeping the old `place_of_supply` string column for now to avoid data loss,
-- but the backend entity is updated to ignore it/remove it. If we wanted to drop it safely:
-- ALTER TABLE sales_invoice DROP COLUMN place_of_supply;
