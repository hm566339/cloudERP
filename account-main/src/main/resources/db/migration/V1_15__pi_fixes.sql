-- 1. Prevent concurrent duplicate PI creation for the same quotation
CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_source_quotation 
ON proforma_invoice (source_quotation_id, company_id) 
WHERE is_deleted = false AND source_quotation_id IS NOT NULL;
