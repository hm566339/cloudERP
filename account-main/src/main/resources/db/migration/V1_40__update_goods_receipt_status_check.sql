-- =============================================================================
-- Migration: V1_40__update_goods_receipt_status_check.sql
-- Description: Update goods_receipt_status_check constraint to allow VERIFIED
--              and POSTED statuses while preserving DRAFT, CONFIRMED, CANCELLED,
--              and REVERSED.
-- =============================================================================

-- 1. Safely drop the existing constraint that only allowed DRAFT, CONFIRMED, CANCELLED, REVERSED
ALTER TABLE goods_receipt
    DROP CONSTRAINT IF EXISTS goods_receipt_status_check;

-- 2. Re-create the constraint allowing all valid statuses from GoodsReceiptStatus enum
ALTER TABLE goods_receipt
    ADD CONSTRAINT goods_receipt_status_check
    CHECK (status IN ('DRAFT', 'VERIFIED', 'POSTED', 'CONFIRMED', 'CANCELLED', 'REVERSED'));
