-- Align crm_contact decision_maker_role column to VARCHAR(50)
-- Allows all standard and MEDDIC decision roles (DECISION_MAKER, ECONOMIC_BUYER, CHAMPION, TECHNICAL_EVALUATOR, etc.)
ALTER TABLE crm_contact ALTER COLUMN decision_maker_role TYPE VARCHAR(50) USING decision_maker_role::VARCHAR(50);
