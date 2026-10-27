-- Flyway migration V1_49: Ensure organization_id column exists on company table and repair mapping
ALTER TABLE company ADD COLUMN IF NOT EXISTS organization_id UUID;
CREATE INDEX IF NOT EXISTS idx_company_organization_id ON company (organization_id);

-- Authorized data correction: map target company to its verified organization
UPDATE company
SET organization_id = '5529d8af-d97a-42e9-b2c4-41b3a294ec87'::uuid
WHERE id = 'ea811382-0afc-4908-a209-9bedcc63c445'::uuid
  AND (organization_id IS NULL OR organization_id != '5529d8af-d97a-42e9-b2c4-41b3a294ec87'::uuid);
