-- V7__add_hsn_sac_and_report_export_permissions.sql
-- Idempotent migration to register HSN_SAC and REPORTS:EXPORT permissions,
-- and grant them to OWNER roles for companies having the ACCOUNT module active.

-- 1. Ensure HSN_SAC feature exists
INSERT INTO feature (id, code, name, module_name, description, active, created_at, updated_at)
VALUES (gen_random_uuid(), 'HSN_SAC', 'HSN/SAC Master', 'ACCOUNT', 'Access to manage HSN and SAC tax codes', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET active = true, updated_at = NOW();

-- 2. Ensure REPORTS feature has active = true
INSERT INTO feature (id, code, name, module_name, description, active, created_at, updated_at)
VALUES (gen_random_uuid(), 'REPORTS', 'System Reports', 'ACCOUNT', 'Access to financial, operational, and inventory reports', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET active = true, updated_at = NOW();

-- 3. Register HSN_SAC permissions (READ, CREATE, WRITE, UPDATE, DELETE, EXPORT)
INSERT INTO feature_permission (id, feature_id, action, permission_code, description, active, created_at, updated_at)
SELECT gen_random_uuid(), f.id, a.action, 'HSN_SAC:' || a.action, 'Permission to ' || a.action || ' HSN/SAC Master', true, NOW(), NOW()
FROM feature f
CROSS JOIN (
    VALUES ('READ'), ('CREATE'), ('WRITE'), ('UPDATE'), ('DELETE'), ('EXPORT')
) AS a(action)
WHERE f.code = 'HSN_SAC'
ON CONFLICT (permission_code) DO UPDATE SET active = true, updated_at = NOW();

-- 4. Register REPORTS:EXPORT permission
INSERT INTO feature_permission (id, feature_id, action, permission_code, description, active, created_at, updated_at)
SELECT gen_random_uuid(), f.id, 'EXPORT', 'REPORTS:EXPORT', 'Permission to EXPORT System Reports', true, NOW(), NOW()
FROM feature f
WHERE f.code = 'REPORTS'
ON CONFLICT (permission_code) DO UPDATE SET active = true, updated_at = NOW();

-- 5. Assign HSN_SAC and REPORTS export permissions to all OWNER roles whose companies have the ACCOUNT module
INSERT INTO role_permission (role_id, feature_permission_id, created_at, updated_at)
SELECT r.id, fp.id, NOW(), NOW()
FROM role r
JOIN company c ON r.company_id = c.id
CROSS JOIN feature_permission fp
JOIN feature f ON fp.feature_id = f.id
WHERE UPPER(r.name) = 'OWNER'
  AND fp.active = true
  AND f.active = true
  AND f.module_name = 'ACCOUNT'
  AND EXISTS (
    SELECT 1 FROM company_module cm 
    JOIN module m ON cm.module_id = m.id 
    WHERE cm.company_id = r.company_id 
      AND cm.active = true 
      AND m.module_status = true 
      AND UPPER(m.name) LIKE 'ACCOUNT%'
  )
ON CONFLICT (feature_permission_id, role_id) DO NOTHING;

