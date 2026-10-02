-- V1_2__add_inventory_fields_to_ap_invoice_item.sql
ALTER TABLE ap_invoice_item 
ADD COLUMN item_type VARCHAR(50),
ADD COLUMN warehouse_id UUID,
ADD COLUMN location_id UUID;
