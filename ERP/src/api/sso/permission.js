import apiClient from '../common/client';

/**
 * Verified SSO Permission Management APIs
 * Integrates with Backend PermissionController
 * Base: /api/sso/permissions
 */

/**
 * Fetch all system permission definitions
 * Endpoint: GET /api/sso/permissions
 * @returns {Promise<Array<{ id: string, featureCode: string, featureName: string, action: string, permissionCode: string, description: string, active: boolean }>>}
 */
export const getAllPermissions = async () => {
  const response = await apiClient.get('/api/sso/permissions');
  return response.data?.data || response.data || [];
};

/**
 * Create a new system permission definition
 * Endpoint: POST /api/sso/permissions
 * @param {{ featureCode: string, action: string, description?: string, active?: boolean }} payload
 */
export const createPermission = async (payload) => {
  const response = await apiClient.post('/api/sso/permissions', { data: payload });
  return response.data?.data || response.data;
};

/**
 * Fetch all direct permission grants/overrides for a specific user
 * Endpoint: GET /api/sso/permissions/user/{userId}
 * @param {string} userId
 * @returns {Promise<Array<{ featureCode: string, action: string, permissionCode: string, source: string, active: boolean, allowed: boolean }>>}
 */
export const getUserPermissions = async (userId) => {
  if (!userId) throw new Error('User ID is required to fetch user permissions');
  const response = await apiClient.get(`/api/sso/permissions/user/${userId}`);
  return response.data?.data || response.data || [];
};

/**
 * Fetch the effective (resolved) permissions for a user, including role-inherited and direct overrides
 * Endpoint: GET /api/sso/permissions/user/{userId}/effective
 * @param {string} userId
 * @returns {Promise<{ userId: string, roles: any[], features: any[], permissions: Array<{ featureCode: string, action: string, permissionCode: string, source: string, active: boolean, allowed: boolean }> }>}
 */
export const getUserEffectivePermissions = async (userId) => {
  if (!userId) throw new Error('User ID is required to fetch effective permissions');
  const response = await apiClient.get(`/api/sso/permissions/user/${userId}/effective`);
  return response.data?.data || response.data || {};
};

/**
 * Grant an action-level permission directly to a user
 * Endpoint: POST /api/sso/permissions/user/{userId}/grant
 * @param {string} userId
 * @param {{ featureCode: string, action: string }} payload
 */
export const grantUserPermission = async (userId, payload) => {
  if (!userId) throw new Error('User ID is required to grant a permission');
  if (!payload?.featureCode || !payload?.action) {
    throw new Error('featureCode and action are required to grant a permission');
  }
  const response = await apiClient.post(`/api/sso/permissions/user/${userId}/grant`, {
    data: {
      featureCode: payload.featureCode,
      action: payload.action,
    },
  });
  return response.data?.data || response.data;
};

/**
 * Revoke an action-level permission from a user with a mandatory reason
 * Endpoint: POST /api/sso/permissions/user/{userId}/revoke
 * @param {string} userId
 * @param {{ featureCode: string, action: string, reason: string }} payload
 */
export const revokeUserPermission = async (userId, payload) => {
  if (!userId) throw new Error('User ID is required to revoke a permission');
  if (!payload?.featureCode || !payload?.action) {
    throw new Error('featureCode and action are required to revoke a permission');
  }
  if (!payload?.reason?.trim()) {
    throw new Error('A reason is required to revoke a permission');
  }
  const response = await apiClient.post(`/api/sso/permissions/user/${userId}/revoke`, {
    data: {
      featureCode: payload.featureCode,
      action: payload.action,
      reason: payload.reason.trim(),
    },
  });
  return response.data?.data || response.data;
};

/**
 * Synchronize the full set of action-level permissions for a user
 * Endpoint: PUT /api/sso/permissions/user/{userId}/sync
 * @param {string} userId
 * @param {Array<{ featureCode: string, action: string, enabled: boolean }>} permissions
 */
export const syncUserPermissions = async (userId, permissions = []) => {
  if (!userId) throw new Error('User ID is required to sync permissions');
  const response = await apiClient.put(`/api/sso/permissions/user/${userId}/sync`, {
    data: { permissions },
  });
  return response.data?.data || response.data;
};

/**
 * Check if a user has access to a specific feature+action (internal authorization check)
 * Endpoint: POST /internal/authorization/check
 * NOTE: This is a utility helper — backend remains the authoritative security layer.
 * @param {{ userId: string, featureCode: string, action: string, serviceName?: string }} payload
 * @returns {Promise<{ allowed: boolean, permissionCode: string, reason: string }>}
 */
export const checkPermission = async (payload) => {
  const response = await apiClient.post('/internal/authorization/check', {
    data: {
      userId: payload.userId,
      featureCode: payload.featureCode,
      action: payload.action,
      serviceName: payload.serviceName || '',
    },
  });
  return response.data?.data || response.data || { allowed: false };
};
