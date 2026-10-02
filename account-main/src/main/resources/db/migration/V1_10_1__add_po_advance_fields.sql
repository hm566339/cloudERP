-- Add advance tracking fields to purchase_order table
ALTER TABLE purchase_order
    ADD COLUMN advance_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN advance_amount DECIMAL(19, 4) DEFAULT 0.0000,
    ADD COLUMN advance_paid_amount DECIMAL(19, 4) DEFAULT 0.0000;

-- Allow payment vouchers to be linked directly to a purchase order for advances
ALTER TABLE payment_voucher
    ADD COLUMN purchase_order_id UUID;

ALTER TABLE payment_voucher
    ADD CONSTRAINT fk_payment_voucher_po
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_order (id);

CREATE INDEX idx_payment_voucher_po ON payment_voucher(purchase_order_id);
