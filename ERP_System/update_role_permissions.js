const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'ERP', 'src', 'pages', 'settings', 'RolePermissionsSettings.jsx');

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add getAllPermissions import
content = content.replace(
  "import { getAllFeatures } from '../../api/sso/feature';",
  "import { getAllFeatures } from '../../api/sso/feature';\nimport { getAllPermissions } from '../../api/sso/permission';"
);

// 2. Add availablePermissions state
content = content.replace(
  "const [features, setFeatures] = useState([]);",
  "const [features, setFeatures] = useState([]);\n  const [availablePermissions, setAvailablePermissions] = useState([]);"
);

// 3. Update initial data load to fetch available permissions
content = content.replace(
  "const [rolesData, featuresData] = await Promise.all([\n          getRoles({ companyId, pageSize: 100 }),\n          getAllFeatures()\n        ]);",
  "const [rolesData, featuresData, permissionsData] = await Promise.all([\n          getRoles({ companyId, pageSize: 100 }),\n          getAllFeatures(),\n          getAllPermissions()\n        ]);"
);

content = content.replace(
  "setFeatures(featuresData || []);",
  "setFeatures(featuresData || []);\n        setAvailablePermissions(permissionsData || []);"
);

// 4. Update handleSave to send all available permissions and refresh on success
const handleSaveNew = `const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      const payload = availablePermissions.map(ap => ({
        featureCode: ap.featureCode,
        action: ap.action,
        enabled: hasPermission(ap.featureCode, ap.action)
      }));
      await syncRolePermissions(selectedRoleId, payload);
      
      const updatedPerms = await getRolePermissions(selectedRoleId);
      setRolePermissions(updatedPerms || []);
      
      dispatch(addAlert({ type: 'success', title: 'Success', message: 'Role permissions synchronized successfully.' }));
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to sync permissions.';
      dispatch(addAlert({ type: 'error', title: 'Error', message: msg }));
    } finally {
      setIsSaving(false);
    }
  };`;

content = content.replace(
  /const handleSave = async \(\) => \{[\s\S]*? setIsSaving\(false\);\n    \}\n  \};/,
  handleSaveNew
);

// 5. Update handleEnableAll to only enable available permissions
const handleEnableAllNew = `const handleEnableAll = () => {
    const allPerms = [];
    features.forEach(f => {
      ['READ', 'WRITE', 'DELETE'].forEach(action => {
        if (availablePermissions.some(p => p.featureCode === f.code && p.action === action && p.active !== false)) {
          allPerms.push({ featureCode: f.code, action, enabled: true });
        }
      });
    });
    setRolePermissions(allPerms);
  };`;

content = content.replace(
  /const handleEnableAll = \(\) => \{[\s\S]*?setRolePermissions\(allPerms\);\n  \};/,
  handleEnableAllNew
);

// 6. Update columns to use availablePermissions instead of supportedActions
const columnsNew = `...['READ', 'WRITE', 'DELETE'].map(action => ({
      id: action,
      label: action,
      sortable: false,
      align: 'center',
      render: (val, row) => {
        const isSupported = availablePermissions.some(ap => ap.featureCode === row.code && ap.action === action && ap.active !== false);
        return isSupported ? (
          <input
            type="checkbox"
            checked={hasPermission(row.code, action)}
            onChange={() => handleToggle(row.code, action)}
            className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
        ) : (
          <span className="text-zinc-300 text-xs">-</span>
        )
      }
    }))`;

content = content.replace(
  /\.\.\.\['READ', 'WRITE', 'DELETE'\]\.map\(action => \(\{[\s\S]*?\}\)\)/,
  columnsNew
);

// Also we need to add availablePermissions to dependencies of useMemo for columns
content = content.replace(
  "], [hasPermission, handleToggle]);",
  "], [hasPermission, handleToggle, availablePermissions]);"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated RolePermissionsSettings.jsx');
