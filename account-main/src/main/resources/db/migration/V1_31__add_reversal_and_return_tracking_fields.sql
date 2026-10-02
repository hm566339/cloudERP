-- =============================================================================
-- Migration: V1_31__add_reversal_and_return_tracking_fields.sql
-- Description: Add audit and tracking fields for GRN reversal, Purchase Return,
--              and Inventory Outbox payload contract.
-- =============================================================================

-- 1. Add reversal audit fields to goods_receipt
ALTER TABLE goods_receipt
    ADD COLUMN IF NOT EXISTS reversed_by UUID,
    ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS reversal_reason VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_grn_reversed_at ON goods_receipt(reversed_at);

-- 2. Add returned_quantity tracking to goods_receipt_item
ALTER TABLE goods_receipt_item
    ADD COLUMN IF NOT EXISTS returned_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000;

-- 3. Add lifecycle, audit, and debit note references to purchase_return
ALTER TABLE purchase_return
    ADD COLUMN IF NOT EXISTS confirmed_by UUID,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancelled_by UUID,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS debit_note_id UUID REFERENCES debit_note(id);

CREATE INDEX IF NOT EXISTS idx_pr_debit_note ON purchase_return(debit_note_id);

-- 4. Add payload contract column to inventory_sync_task
ALTER TABLE inventory_sync_task
    ADD COLUMN IF NOT EXISTS payload TEXT;
