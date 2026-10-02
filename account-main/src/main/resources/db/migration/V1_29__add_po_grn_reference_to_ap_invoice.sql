ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS purchase_order_id UUID;
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS goods_receipt_id UUID;

CREATE INDEX IF NOT EXISTS idx_ap_invoice_po ON ap_invoice(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoice_grn ON ap_invoice(goods_receipt_id);
