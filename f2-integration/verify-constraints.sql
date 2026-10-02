-- Run against accounting_test and manufacturing_test after each service has
-- started with Hibernate schema creation/update enabled.

-- Account database: execute in accounting_test.
SELECT tc.constraint_name,
       tc.table_name,
       string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
 AND kcu.constraint_schema = tc.constraint_schema
 AND kcu.table_name = tc.table_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = 'gl_journal_entry'
  AND tc.constraint_name IN ('uk_gl_manufacturing_source', 'uk_gl_manufacturing_idempotency')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.constraint_name;

-- Manufacturing database: execute in manufacturing_test.
SELECT tc.constraint_name,
       tc.table_name,
       string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
 AND kcu.constraint_schema = tc.constraint_schema
 AND kcu.table_name = tc.table_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = 'manufacturing_accounting_event'
  AND tc.constraint_name IN ('uk_mfg_acct_source', 'uk_mfg_acct_idempotency')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.constraint_name;
