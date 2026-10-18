import { useAppSelector } from '../app/hooks';
import { hasModuleAccess, hasPermission } from '../utils/rbacUtils';

/**
 * Hook to check if the current user has a specific permission for a module/feature.
 * Supports:
 *   - usePermission('CUSTOMERS', 'READ')
 *   - usePermission('CUSTOMERS:READ')
 *   - usePermission('CUSTOMERS') // Checks module access
 *
 * @param {string} moduleNameOrPermission - Module/Feature name (e.g. 'CUSTOMERS') or combined permission ('CUSTOMERS:READ')
 * @param {string} [action] - Action ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', etc.)
 * @param {string} [moduleName] - Optional parent module if distinct from feature
 * @returns {boolean} True if permitted
 */
export function usePermission(moduleNameOrPermission, action, moduleName) {
  return useAppSelector((state) => {
    if (!action && typeof moduleNameOrPermission === 'string' && !moduleNameOrPermission.includes(':')) {
      return hasModuleAccess(state, moduleNameOrPermission);
    }
    return hasPermission(state, moduleNameOrPermission, action, moduleName);
  });
}

export default usePermission;

/**
 * Hook to check all core CRUD permissions for a given feature/module.
 * 
 * Usage:
 *   const { canCreate, canRead, canUpdate, canDelete, canApprove } = useCrudPermissions('CUSTOMERS');
 *
 * @param {string} feature - Feature or module name (e.g. 'CUSTOMERS')
 * @param {string} [module] - Optional canonical module name
 * @returns {{ canCreate: boolean, canRead: boolean, canView: boolean, canUpdate: boolean, canEdit: boolean, canDelete: boolean, canApprove: boolean }}
 */
export function useCrudPermissions(feature, module) {
  const canRead = usePermission(feature, 'READ', module);
  const canCreate = usePermission(feature, 'CREATE', module);
  const canUpdate = usePermission(feature, 'UPDATE', module);
  const canDelete = usePermission(feature, 'DELETE', module);
  const canApprove = usePermission(feature, 'APPROVE', module);

  return {
    canRead,
    canView: canRead,
    canCreate,
    canUpdate,
    canEdit: canUpdate,
    canDelete,
    canApprove,
  };
}

