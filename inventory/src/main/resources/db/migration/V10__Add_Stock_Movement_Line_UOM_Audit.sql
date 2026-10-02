ALTER TABLE stock_movement_line
    ADD COLUMN IF NOT EXISTS transaction_uom_id UUID,
    ADD COLUMN IF NOT EXISTS transaction_quantity NUMERIC(19, 6),
    ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(19, 12),
    ADD COLUMN IF NOT EXISTS transaction_unit_cost NUMERIC(19, 6);