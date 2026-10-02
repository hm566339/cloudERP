ALTER TABLE sales_invoice_item
ADD COLUMN warehouse_id UUID,
ADD COLUMN location_id UUID;
