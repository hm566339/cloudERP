ALTER TABLE proforma_invoice ALTER COLUMN source_quotation_id DROP NOT NULL;
ALTER TABLE proforma_invoice_item ALTER COLUMN source_quotation_item_id DROP NOT NULL;
