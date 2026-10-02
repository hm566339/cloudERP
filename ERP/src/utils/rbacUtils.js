import { rolePermissions, normalizeRole } from './rbac';
import {
  canViewModule as checkCanViewModule,
  hasPermission as checkHasPermission,
} from './moduleNormalization';

/**
 * Checks if user has access to a module/feature based on Redux state
 */
export const hasModuleAccess = (state, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanViewModule(authContext, moduleName);
};

/**
 * Checks if user has permission on module/feature and action based on Redux state
 */
export const hasPermission = (state, moduleName, action) => {
  if (!state) return false;
  const authContext = state.auth || state;
  if (!action) {
    return checkCanViewModule(authContext, moduleName);
  }
  return checkHasPermission(authContext, moduleName, action);
};
