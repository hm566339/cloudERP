-- Make ap_invoice_id nullable to support advance payment allocations (no AP Invoice)
-- Normal invoice payments will continue to have ap_invoice_id set (validated in application code)
-- Advance payments will have purchase_order_id set instead

ALTER TABLE payment_voucher_allocation ALTER COLUMN ap_invoice_id DROP NOT NULL;

-- Add purchase_order_id column if not exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_voucher_allocation'
        AND column_name = 'purchase_order_id'
    ) THEN
        ALTER TABLE payment_voucher_allocation ADD COLUMN purchase_order_id UUID;
    END IF;
END $$;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_payment_voucher_allocation_po
    ON payment_voucher_allocation (purchase_order_id);
