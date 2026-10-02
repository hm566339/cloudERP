-- V1_45: Ensure source_so_item_id is nullable in delivery_challan_item
-- Required for direct Sales Invoice dispatch flow (without Sales Order)
ALTER TABLE delivery_challan_item ALTER COLUMN source_so_item_id DROP NOT NULL;
