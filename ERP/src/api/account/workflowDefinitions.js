import apiClient from '../common/client';

const getData = (response) => response?.data?.data ?? response?.data ?? response;

export const workflowDefinitionsApi = {
  getList: async ({ companyId, documentType = 'GENERAL' } = {}) => {
    const params = { documentType };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/account/workflow/definitions', { params });
    const payload = getData(response);
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
  },

  create: async (payload = {}) => {
    const requestBody = payload && typeof payload === 'object' && payload.data ? payload.data : payload;
    const response = await apiClient.post('/api/account/workflow/definitions', requestBody);
    return getData(response);
  },

  addStage: async (definitionId, payload = {}) => {
    const requestBody = payload && typeof payload === 'object' && payload.data ? payload.data : payload;
    const response = await apiClient.post(`/api/account/workflow/definitions/${definitionId}/stages`, requestBody);
    return getData(response);
  },

  activate: async (definitionId) => {
    const response = await apiClient.post(`/api/account/workflow/definitions/${definitionId}/activate`);
    return getData(response);
  },
};

export default workflowDefinitionsApi;
