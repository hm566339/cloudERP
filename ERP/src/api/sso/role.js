import apiClient from '../common/client.js';
import { useState, useEffect } from 'react';

export const getRoles = async (params = {}, config = {}) => {
  const { companyId, search, status } = params;
  if (!companyId) throw new Error('Company ID is required to fetch roles');
  
  const page = params?.page ?? 0;
  const pageSize = params?.pageSize ?? 200;

  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);
  query.append('companyId', companyId);
  if (search) query.append('search', search);
  if (status !== undefined && status !== '') query.append('status', status);

  const response = await apiClient.get(`/api/sso/role?${query.toString()}`, config);
  return response.data?.data || response.data;
};

export const getRoleById = async (id) => {
  const response = await apiClient.get(`/api/sso/role/${id}`);
  return response.data?.data || response.data;
};

export const createRole = async (companyId, data) => {
  if (!companyId) throw new Error('Company ID is required to create a role');
  const response = await apiClient.post(`/api/sso/role`, { data }, { params: { companyId } });
  return response.data?.data || response.data;
};

export const updateRole = async (id, data) => {
  const response = await apiClient.put(`/api/sso/role/${id}`, { data });
  return response.data?.data || response.data;
};

export const updateRoleStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/api/sso/role/${id}/status`, { status }, {
      params: { status }
    });
    return response.data?.data || response.data;
  } catch (error) {
    if (error?.response?.status === 403 || error?.response?.status === 404 || error?.response?.status === 405) {
      try {
        const response = await apiClient.patch(`/api/sso/role/${id}/status?status=${status}`, {});
        return response.data?.data || response.data;
      } catch (err2) {
        try {
          const response = await apiClient.put(`/api/sso/role/${id}`, { data: { status } });
          return response.data?.data || response.data;
        } catch (err3) {
          throw error;
        }
      }
    }
    throw error;
  }
};

export const deleteRole = async (id) => {
  const response = await apiClient.delete(`/api/sso/role/${id}`);
  return response.data?.data || response.data;
};

/**
 * Fetch all action-level permissions currently assigned to a role
 * Endpoint: GET /api/sso/role/{roleId}/permissions
 * @param {string} roleId
 * @returns {Promise<Array<{ id: string, featureCode: string, featureName: string, action: string, permissionCode: string, description: string, active: boolean }>>}
 */
export const getRolePermissions = async (roleId) => {
  if (!roleId) throw new Error('Role ID is required to fetch role permissions');
  const response = await apiClient.get(`/api/sso/role/${roleId}/permissions`);
  return response.data?.data || response.data || [];
};

/**
 * Synchronize action-level permissions for a role
 * Endpoint: PUT /api/sso/role/{roleId}/permissions/sync
 * @param {string} roleId
 * @param {Array<{ featureCode: string, action: string, enabled: boolean }>} permissions
 */
export const syncRolePermissions = async (roleId, permissions = []) => {
  if (!roleId) throw new Error('Role ID is required to sync role permissions');
  const response = await apiClient.put(`/api/sso/role/${roleId}/permissions/sync`, {
    data: { permissions },
  });
  return response.data?.data || response.data;
};

// Fallback hook for legacy components
export const useGetRolesQuery = (params = {}, options = {}) => {
  const [data, setData] = useState({ roles: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (options.skip || !params.companyId) return;
    setIsLoading(true);
    getRoles(params)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [JSON.stringify(params), options.skip]);

  return { data, isLoading };
};
