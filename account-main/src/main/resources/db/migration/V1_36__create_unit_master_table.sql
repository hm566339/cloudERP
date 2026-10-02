CREATE TABLE IF NOT EXISTS unit_master (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20),
    allow_decimal BOOLEAN NOT NULL DEFAULT TRUE,
    decimal_places INT DEFAULT 2,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    created_by_username VARCHAR(100),
    updated_by_username VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_unit_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_unit_code ON unit_master(code);

-- Seed standard units
INSERT INTO unit_master (id, code, name, symbol, allow_decimal, decimal_places)
VALUES 
    (gen_random_uuid(), 'PIE0826001', 'Piece', 'PIECE', FALSE, 0),
    (gen_random_uuid(), 'PCS', 'Piece', 'PIECE', FALSE, 0),
    (gen_random_uuid(), 'PIECE', 'Piece', 'PIECE', FALSE, 0),
    (gen_random_uuid(), 'KG', 'Kilogram', 'KG', TRUE, 3),
    (gen_random_uuid(), 'KGS', 'Kilogram', 'KG', TRUE, 3),
    (gen_random_uuid(), 'GM', 'Gram', 'GM', TRUE, 2),
    (gen_random_uuid(), 'GMS', 'Gram', 'GM', TRUE, 2),
    (gen_random_uuid(), 'LTR', 'Liter', 'LITRE', TRUE, 2),
    (gen_random_uuid(), 'LITRE', 'Liter', 'LITRE', TRUE, 2),
    (gen_random_uuid(), 'MTR', 'Meter', 'METER', TRUE, 2),
    (gen_random_uuid(), 'METER', 'Meter', 'METER', TRUE, 2),
    (gen_random_uuid(), 'BOX', 'Box', 'BOX', FALSE, 0),
    (gen_random_uuid(), 'BAG', 'Bag', 'BAG', FALSE, 0),
    (gen_random_uuid(), 'SET', 'Set', 'SET', FALSE, 0),
    (gen_random_uuid(), 'DOZ', 'Dozen', 'DOZEN', FALSE, 0)
ON CONFLICT (code) DO NOTHING;
