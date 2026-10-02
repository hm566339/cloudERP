-- Direct fix for delivery_challan_item source_so_item_id nullable constraint
-- Run this in your PostgreSQL client (pgAdmin/DBeaver)
BEGIN;

-- 1. Check current state
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'delivery_challan_item' 
  AND column_name IN ('source_so_item_id', 'source_si_item_id');

-- 2. Drop the NOT NULL constraint if it exists  
ALTER TABLE delivery_challan_item ALTER COLUMN source_so_item_id DROP NOT NULL;

-- 3. Verify fix
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'delivery_challan_item' 
  AND column_name IN ('source_so_item_id', 'source_si_item_id');

-- 4. Check Flyway history
SELECT version, description, success 
FROM flyway_schema_history 
WHERE version IN ('1.44', '1.45')
ORDER BY installed_rank;

COMMIT;
