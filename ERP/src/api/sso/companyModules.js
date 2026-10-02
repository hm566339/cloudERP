import apiClient from '../common/client';

export const getCompanyModules = async (params = {}) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 200;
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);
  if (params?.active !== undefined && params.active !== null) query.append('active', params.active);

  const response = await apiClient.get(`/api/sso/company-modules?${query.toString()}`);
  return response.data;
};

export const getCompanyModuleById = async (id) => {
  const response = await apiClient.get(`/api/sso/company-modules/${id}`);
  return response.data;
};

export const getCompanyModulesByCompany = async (companyId, params = {}) => {
  const { active } = params;
  const query = new URLSearchParams();
  if (active !== undefined && active !== null) query.append('active', active);
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient.get(`/api/sso/company-modules/company/${companyId}${queryString}`);
  return response.data;
};

export const createCompanyModule = async (data) => {
  const response = await apiClient.post('/api/sso/company-modules', { data });
  return response.data;
};

export const updateCompanyModule = async (id, data) => {
  const response = await apiClient.put(`/api/sso/company-modules/${id}`, { data });
  return response.data;
};

export const updateCompanyModuleStatus = async (id, active) => {
  const response = await apiClient.patch(`/api/sso/company-modules/${id}/status?active=${active}`);
  return response.data;
};

export const deleteCompanyModule = async (id) => {
  const response = await apiClient.delete(`/api/sso/company-modules/${id}`);
  return response.data;
};
