import apiClient from '../common/client';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FEATURE_API');

/**
 * Verified SSO Feature Management APIs
 * Integrates with Backend FeatureController
 */

/**
 * Fetch all system feature definitions
 * Endpoint: GET /api/sso/features
 * @returns {Promise<Array<{ id: string|number, code: string, name: string, description: string, moduleName: string, active: boolean }>>}
 */
export const getAllFeatures = async () => {
  const response = await apiClient.get('/api/sso/features');
  return response.data?.data || response.data || [];
};

/**
 * Get feature definition by ID
 * Endpoint: GET /api/sso/features/{id}
 * @param {string|number} id
 */
export const getFeatureById = async (id) => {
  if (!id) throw new Error('Feature ID is required');
  const response = await apiClient.get(`/api/sso/features/${id}`);
  return response.data?.data || response.data;
};

/**
 * Create a new system feature definition
 * Endpoint: POST /api/sso/features
 * @param {{ code: string, name: string, description?: string, moduleName?: string, active?: boolean }} payload
 */
export const createFeature = async (payload) => {
  const cleanData = {
    code: payload.code?.trim(),
    name: payload.name?.trim(),
    description: payload.description?.trim() || '',
    moduleName: payload.moduleName?.trim() || '',
    active: payload.active !== false
  };
  const response = await apiClient.post('/api/sso/features', { data: cleanData });
  return response.data?.data || response.data;
};

/**
 * Update an existing system feature definition
 * Endpoint: PUT /api/sso/features/{id}
 * @param {string|number|object} idOrPayload
 * @param {object} [payload]
 */
export const updateFeature = async (idOrPayload, payload) => {
  let id;
  let data;

  if (payload !== undefined) {
    id = idOrPayload;
    data = payload;
  } else if (typeof idOrPayload === 'object' && idOrPayload !== null) {
    id = idOrPayload.id || idOrPayload.featureId;
    data = idOrPayload;
  } else {
    id = idOrPayload;
    data = {};
  }

  if (!id) throw new Error('Feature ID is required to update feature');

  const cleanData = {};
  if (data.code !== undefined && data.code !== null && String(data.code).trim()) {
    cleanData.code = String(data.code).trim().toUpperCase();
  }
  if (data.name !== undefined && data.name !== null) {
    cleanData.name = String(data.name).trim();
  }
  if (data.description !== undefined && data.description !== null) {
    cleanData.description = String(data.description).trim();
  }
  if (data.moduleName !== undefined && data.moduleName !== null) {
    cleanData.moduleName = String(data.moduleName).trim();
  }
  if (data.active !== undefined && data.active !== null) {
    cleanData.active = Boolean(data.active);
  }

  const response = await apiClient.put(`/api/sso/features/${id}`, { data: cleanData });
  return response.data?.data || response.data;
};

/**
 * Delete a system feature definition
 * Endpoint: DELETE /api/sso/features/{id}
 * @param {string|number|object} idOrFeature
 */
export const deleteFeature = async (idOrFeature) => {
  const id = (typeof idOrFeature === 'object' && idOrFeature !== null)
    ? (idOrFeature.id || idOrFeature.featureId || idOrFeature.code)
    : idOrFeature;
  if (!id) throw new Error('Feature ID is required to delete feature');
  const response = await apiClient.delete(`/api/sso/features/${id}`);
  return response.data?.data || response.data;
};

/**
 * Standard API service object for features compatible with useApiQuery and useApiMutation
 */
export const featuresApi = {
  getAll: getAllFeatures,
  getList: getAllFeatures,
  getById: getFeatureById,
  create: createFeature,
  update: updateFeature,
  delete: deleteFeature
};

/**
 * Fetch all feature grants and revocations for a specific user
 * Endpoint: GET /api/sso/features/user/{userId}
 * Requires: SYSTEM_ADMIN
 * @param {string|number} userId
 * @returns {Promise<Array<{ id: number, featureId: number, featureCode: string, featureName: string, moduleName: string, grantedAt: string, grantedBy: string, revoked: boolean, revokedAt: string|null, revokedBy: string|null, revokeReason: string|null, active: boolean }>>}
 */
export const getUserFeatures = async (userId) => {
  if (!userId) throw new Error('User ID is required to fetch user features');
  const response = await apiClient.get(`/api/sso/features/user/${userId}`);
  return response.data?.data || response.data || [];
};

/**
 * Fetch only active feature codes for a user
 * Endpoint: GET /api/sso/features/user/{userId}/active
 * @param {string|number} userId
 * @returns {Promise<{ userId: string|number, activeFeatures: string[] }>}
 */
export const getUserActiveFeatures = async (userId) => {
  if (!userId) throw new Error('User ID is required to fetch active features');
  const response = await apiClient.get(`/api/sso/features/user/${userId}/active`);
  return response.data?.data || response.data || { userId, activeFeatures: [] };
};

/**
 * Grant a feature to a specific user
 * Endpoint: POST /api/sso/features/user/{userId}/grant
 * Requires: SYSTEM_ADMIN
 * Payload: { data: { featureCode?: string, featureId?: number } }
 * @param {string|number} userId
 * @param {{ featureCode?: string, featureId?: number }} payload
 */
export const grantUserFeature = async (userId, payload) => {
  if (!userId) throw new Error('User ID is required to grant a feature');
  if (!payload?.featureCode && !payload?.featureId) {
    throw new Error('Either featureCode or featureId is required to grant a feature');
  }
  const response = await apiClient.post(`/api/sso/features/user/${userId}/grant`, {
    data: {
      featureCode: payload.featureCode,
      featureId: payload.featureId
    }
  });
  return response.data?.data || response.data;
};

/**
 * Revoke a feature from a specific user with a reason
 * Endpoint: POST /api/sso/features/user/{userId}/revoke
 * Requires: SYSTEM_ADMIN
 * Payload: { data: { featureCode?: string, featureId?: number, reason?: string } }
 * @param {string|number} userId
 * @param {{ featureCode?: string, featureId?: number, reason?: string }} payload
 */
export const revokeUserFeature = async (userId, payload) => {
  if (!userId) throw new Error('User ID is required to revoke a feature');
  if (!payload?.featureCode && !payload?.featureId) {
    throw new Error('Either featureCode or featureId is required to revoke a feature');
  }
  const response = await apiClient.post(`/api/sso/features/user/${userId}/revoke`, {
    data: {
      featureCode: payload.featureCode,
      featureId: payload.featureId,
      reason: payload.reason || 'Revoked by administrator'
    }
  });
  return response.data?.data || response.data;
};

/**
 * Synchronize full list of feature codes for a user
 * Endpoint: PUT /api/sso/features/user/{userId}/sync
 * Requires: SYSTEM_ADMIN
 * Payload: { data: { featureCodes: string[] } }
 * @param {string|number} userId
 * @param {string[]} featureCodes
 */
export const syncUserFeatures = async (userId, featureCodes = []) => {
  if (!userId) throw new Error('User ID is required to sync features');
  const response = await apiClient.put(`/api/sso/features/user/${userId}/sync`, {
    data: {
      featureCodes
    }
  });
  return response.data?.data || response.data;
};

/* ==============================================================================
 * Pending Backend API Typed Service Interfaces
 * ==============================================================================
 * NOTE: The backend currently does not have a `role_features` join table or endpoints.
 * When implemented on the backend:
 * Required DB Table: `role_features` (id, role_id, feature_id, granted_at, created_by)
 * Required Endpoints:
 * - GET /api/sso/role/{roleId}/features
 * - PUT /api/sso/role/{roleId}/features
 * ==============================================================================
 */

/**
 * Get features assigned to a role (Graceful mock/fallback until backend endpoint is available)
 * @param {string|number} roleId
 * @returns {Promise<string[]>} List of feature codes
 */
export const getRoleFeatures = async (roleId) => {
  try {
    const response = await apiClient.get(`/api/sso/role/${roleId}/features`);
    return response.data?.data || response.data || [];
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      logger.info(`[RoleFeatures] GET /api/sso/role/${roleId}/features not implemented on backend yet. Using local state.`);
      return [];
    }
    throw err;
  }
};

/**
 * Update features assigned to a role
 * @param {string|number} roleId
 * @param {string[]} featureCodes
 */
export const updateRoleFeatures = async (roleId, featureCodes) => {
  try {
    const response = await apiClient.put(`/api/sso/role/${roleId}/features`, {
      data: { featureCodes }
    });
    return response.data?.data || response.data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      console.warn(`[RoleFeatures] PUT /api/sso/role/${roleId}/features not implemented on backend yet.`);
      return { success: true, pendingBackend: true, featureCodes };
    }
    throw err;
  }
};
