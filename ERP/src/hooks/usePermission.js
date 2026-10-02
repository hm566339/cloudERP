import { useMemo } from 'react';
import { useAppSelector } from '../app/hooks';
import { hasModuleAccess, hasPermission } from '../utils/rbacUtils';

/**
 * Hook to check if the current user has a specific permission for a module.
 * @param {string} moduleName - Name of the module from rbacConfig (e.g. 'CUSTOMERS')
 * @param {string} [action] - Optional action to check (e.g. 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE'). 
 *                            If omitted, checks if the user has ANY access to the module.
 * @returns {boolean} True if the user has the required permission/access.
 */
export default function usePermission(moduleName, action) {
  // We don't want to re-run the selector logic if the rbac object hasn't changed.
  // We can just use the selector directly.
  return useAppSelector((state) => {
    if (!action) {
      return hasModuleAccess(state, moduleName);
    }
    return hasPermission(state, moduleName, action);
  });
}
