import apiClient from '../common/client';

export const getModuleRoutes = async (params = {}) => {
  const page = params?.page ?? 0;
  const pageSize = params?.pageSize ?? 200;
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);
  if (params?.moduleId) query.append('moduleId', params.moduleId);
  if (params?.active !== undefined && params.active !== '' && params.active !== 'ALL') {
    const isBool = typeof params.active === 'boolean' ? params.active : (params.active === 'true' || params.active === true);
    query.append('active', isBool);
  }

  const response = await apiClient.get(`/api/sso/module-routes?${query.toString()}`);
  return response.data?.data || response.data;
};

export const getModuleRouteById = async (id) => {
  const response = await apiClient.get(`/api/sso/module-routes/${id}`);
  return response.data?.data || response.data;
};

export const getInternalRoutes = async () => {
  const response = await apiClient.get('/api/sso/module-routes/internal/routes');
  return response.data?.data || response.data;
};

export const createModuleRoute = async (routeData) => {
  const response = await apiClient.post('/api/sso/module-routes', { data: routeData });
  return response.data?.data || response.data;
};

export const updateModuleRoute = async (id, routeData) => {
  const response = await apiClient.put(`/api/sso/module-routes/${id}`, { data: routeData });
  return response.data?.data || response.data;
};

export const updateModuleRouteStatus = async (id, active) => {
  const response = await apiClient.patch(`/api/sso/module-routes/${id}/status`, { data: { active } });
  return response.data?.data || response.data;
};

export const deleteModuleRoute = async (id) => {
  const response = await apiClient.delete(`/api/sso/module-routes/${id}`);
  return response.data?.data || response.data;
};
