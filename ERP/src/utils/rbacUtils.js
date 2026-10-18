import {
  canViewModule as checkCanViewModule,
  hasPermission as checkHasPermission,
  canRead as checkCanRead,
  canCreate as checkCanCreate,
  canUpdate as checkCanUpdate,
  canDelete as checkCanDelete,
  canApprove as checkCanApprove,
} from './moduleNormalization.js';

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
export const hasPermission = (state, moduleNameOrPermission, action, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  if (!action && typeof moduleNameOrPermission === 'string' && !moduleNameOrPermission.includes(':')) {
    return checkCanViewModule(authContext, moduleNameOrPermission);
  }
  return checkHasPermission(authContext, moduleNameOrPermission, action, moduleName);
};

export const canRead = (state, featureName, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanRead(authContext, featureName, moduleName);
};

export const canCreate = (state, featureName, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanCreate(authContext, featureName, moduleName);
};

export const canUpdate = (state, featureName, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanUpdate(authContext, featureName, moduleName);
};

export const canDelete = (state, featureName, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanDelete(authContext, featureName, moduleName);
};

export const canApprove = (state, featureName, moduleName) => {
  if (!state) return false;
  const authContext = state.auth || state;
  return checkCanApprove(authContext, featureName, moduleName);
};

