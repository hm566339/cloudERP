import apiClient from '../common/client';

const getData = (response) => response?.data?.data ?? response?.data ?? response;

export const workflowDefinitionsApi = {
  getList: async ({ companyId, documentType = 'GENERAL', moduleName } = {}) => {
    const params = { documentType };
    if (companyId) params.companyId = companyId;
    if (moduleName) params.moduleName = moduleName;
    const response = await apiClient.get('/api/v1/workflow/definitions', { params });
    const payload = getData(response);
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : (Array.isArray(payload?.data) ? payload.data : []));
  },

  getById: async (id, companyId) => {
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.get(`/api/v1/workflow/definitions/${id}`, { params });
    return getData(response);
  },

  create: async (payload = {}) => {
    const requestBody = payload && typeof payload === 'object' && payload.data ? payload.data : payload;
    const response = await apiClient.post('/api/v1/workflow/definitions', { data: requestBody });
    return getData(response);
  },

  activate: async (definitionId, companyId) => {
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.patch(`/api/v1/workflow/definitions/${definitionId}/activate`, null, { params });
    return getData(response);
  },

  deactivate: async (definitionId, companyId) => {
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.patch(`/api/v1/workflow/definitions/${definitionId}/deactivate`, null, { params });
    return getData(response);
  },

  delete: async (definitionId, companyId) => {
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.delete(`/api/v1/workflow/definitions/${definitionId}`, { params });
    return getData(response);
  },
};

export default workflowDefinitionsApi;
