-- Idempotent migration to assign active feature permissions to OWNER roles
-- based on company module entitlement and core/sso features.

INSERT INTO role_permission (role_id, feature_permission_id, created_at, updated_at)
SELECT r.id, fp.id, NOW(), NOW()
FROM role r
JOIN company c ON r.company_id = c.id
CROSS JOIN feature_permission fp
JOIN feature f ON fp.feature_id = f.id
WHERE UPPER(r.name) = 'OWNER'
  AND fp.active = true
  AND f.active = true
  AND (
    f.module_name IN ('CORE', 'SSO')
    OR (f.module_name = 'ACCOUNT' AND EXISTS (
      SELECT 1 FROM company_module cm JOIN module m ON cm.module_id = m.id 
      WHERE cm.company_id = r.company_id AND cm.active = true AND m.module_status = true AND UPPER(m.name) LIKE 'ACCOUNT%'
    ))
    OR (f.module_name = 'INVENTORY' AND EXISTS (
      SELECT 1 FROM company_module cm JOIN module m ON cm.module_id = m.id 
      WHERE cm.company_id = r.company_id AND cm.active = true AND m.module_status = true AND UPPER(m.name) LIKE 'INVENTORY%'
    ))
    OR (f.module_name = 'CRM' AND EXISTS (
      SELECT 1 FROM company_module cm JOIN module m ON cm.module_id = m.id 
      WHERE cm.company_id = r.company_id AND cm.active = true AND m.module_status = true AND UPPER(m.name) LIKE 'CRM%'
    ))
  )
ON CONFLICT (feature_permission_id, role_id) DO NOTHING;
