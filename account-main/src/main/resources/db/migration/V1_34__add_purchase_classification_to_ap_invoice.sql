-- First-class purchase classification for AP invoices.
-- Columns remain nullable so legacy rows are not retroactively misclassified.
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(40);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS document_type VARCHAR(40);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS purchase_nature VARCHAR(20);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS gst_treatment VARCHAR(30);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS itc_eligibility VARCHAR(30);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS itc_reason VARCHAR(500);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS supplier_invoice_number VARCHAR(100);
ALTER TABLE ap_invoice ADD COLUMN IF NOT EXISTS supplier_invoice_date DATE;

CREATE INDEX IF NOT EXISTS idx_ap_invoice_purchase_source ON ap_invoice(purchase_source);
CREATE INDEX IF NOT EXISTS idx_ap_invoice_document_type ON ap_invoice(document_type);
CREATE INDEX IF NOT EXISTS idx_ap_invoice_purchase_nature ON ap_invoice(purchase_nature);
