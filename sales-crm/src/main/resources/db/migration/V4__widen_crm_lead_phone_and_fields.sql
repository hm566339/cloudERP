-- Widen phone, alternate_phone, normalized_phone, and postal_code in crm_lead to accommodate international formats and test data
ALTER TABLE crm_lead ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE crm_lead ALTER COLUMN alternate_phone TYPE VARCHAR(50);
ALTER TABLE crm_lead ALTER COLUMN normalized_phone TYPE VARCHAR(30);
ALTER TABLE crm_lead ALTER COLUMN postal_code TYPE VARCHAR(50);

-- Also widen crm_contact and crm_account phone columns
ALTER TABLE crm_contact ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE crm_contact ALTER COLUMN mobile TYPE VARCHAR(50);
ALTER TABLE crm_contact ALTER COLUMN normalized_phone TYPE VARCHAR(30);
ALTER TABLE crm_account ALTER COLUMN phone TYPE VARCHAR(50);
