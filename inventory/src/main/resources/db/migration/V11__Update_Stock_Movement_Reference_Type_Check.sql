-- Migration: Update stock_movement and stock_reservation check constraints to allow DELIVERY_CHALLAN reference type
ALTER TABLE stock_movement 
    DROP CONSTRAINT IF EXISTS stock_movement_reference_type_check;

ALTER TABLE stock_movement 
    ADD CONSTRAINT stock_movement_reference_type_check 
    CHECK (reference_type IN (
        'MANUAL',
        'PURCHASE_RECEIPT',
        'PURCHASE_RETURN',
        'SALES_INVOICE',
        'SALES_RETURN',
        'DELIVERY',
        'DELIVERY_CHALLAN',
        'STOCK_TRANSFER',
        'STOCK_ADJUSTMENT',
        'OPENING_STOCK',
        'PRODUCTION',
        'STOCK_RESERVATION'
    ));

ALTER TABLE stock_reservation 
    DROP CONSTRAINT IF EXISTS stock_reservation_reference_type_check;

ALTER TABLE stock_reservation 
    ADD CONSTRAINT stock_reservation_reference_type_check 
    CHECK (reference_type IN (
        'MANUAL',
        'PURCHASE_RECEIPT',
        'PURCHASE_RETURN',
        'SALES_INVOICE',
        'SALES_RETURN',
        'DELIVERY',
        'DELIVERY_CHALLAN',
        'STOCK_TRANSFER',
        'STOCK_ADJUSTMENT',
        'OPENING_STOCK',
        'PRODUCTION',
        'STOCK_RESERVATION'
    ));
