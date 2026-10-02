-- V1_39: Add GRN verification, posting metadata, and rejection reason

ALTER TABLE goods_receipt
    ADD COLUMN IF NOT EXISTS verified_by UUID,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS posted_by UUID,
    ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

ALTER TABLE goods_receipt_item
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
