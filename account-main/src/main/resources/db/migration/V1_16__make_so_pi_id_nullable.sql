ALTER TABLE sales_order ALTER COLUMN source_pi_id DROP NOT NULL;

ALTER TABLE sales_order ADD CONSTRAINT chk_so_source CHECK (source_pi_id IS NOT NULL OR source_quotation_id IS NOT NULL);
