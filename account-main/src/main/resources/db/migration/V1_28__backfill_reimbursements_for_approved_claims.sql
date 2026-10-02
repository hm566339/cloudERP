-- Backfill missing Reimbursement records for existing approved expense claims
INSERT INTO reimbursement (
    id,
    company_id,
    employee_id,
    expense_claim_id,
    reimbursement_no,
    reimbursement_date,
    reimbursement_amount,
    status,
    notes,
    is_deleted,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    c.company_id,
    c.employee_id,
    c.id,
    'RMB-' || TO_CHAR(COALESCE(c.claim_date, CURRENT_DATE), 'YYYY') || '-' || LPAD((1000 + ROW_NUMBER() OVER(ORDER BY c.created_at))::text, 4, '0'),
    COALESCE(c.claim_date, CURRENT_DATE),
    c.claim_amount,
    'SUBMITTED',
    'Auto-generated reimbursement for ' || c.claim_no,
    false,
    NOW(),
    NOW()
FROM expense_claim c
WHERE c.status IN ('FINANCE_APPROVED', 'PAID')
  AND (c.is_deleted IS NULL OR c.is_deleted = false)
  AND NOT EXISTS (
      SELECT 1 FROM reimbursement r 
      WHERE r.expense_claim_id = c.id 
        AND (r.is_deleted IS NULL OR r.is_deleted = false)
  );
