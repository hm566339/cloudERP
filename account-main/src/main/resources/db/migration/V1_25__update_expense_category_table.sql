-- Migration V1_25: Update expense_category table with new fields

ALTER TABLE expense_category
ADD COLUMN IF NOT EXISTS category_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS description VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Populate category_code for existing records using a substring of the UUID if null
UPDATE expense_category 
SET category_code = 'CAT-' || substring(id::varchar from 1 for 6) 
WHERE category_code IS NULL;

-- Now enforce NOT NULL constraint
ALTER TABLE expense_category ALTER COLUMN category_code SET NOT NULL;

-- Add unique constraints
ALTER TABLE expense_category ADD CONSTRAINT uk_expense_category_code UNIQUE (company_id, category_code);
ALTER TABLE expense_category ADD CONSTRAINT uk_expense_category_name UNIQUE (company_id, category_name);

-- Index for querying active categories
CREATE INDEX IF NOT EXISTS idx_expense_category_is_active ON expense_category(is_active);
