import apiClient from '../common/client';

const getData = (response) => response?.data?.data ?? response?.data ?? response;

export const workflowDefinitionsApi = {
  getList: async ({ companyId, documentType, moduleName } = {}) => {
    const params = {};
    if (companyId) params.companyId = companyId;
    const cleanDocType = (documentType || '').trim();
    if (cleanDocType && cleanDocType.toUpperCase() !== 'ALL') {
      params.documentType = cleanDocType;
    }
    const cleanModuleName = (moduleName || '').trim();
    if (cleanModuleName && cleanModuleName.toUpperCase() !== 'ALL') {
      params.moduleName = cleanModuleName;
    }
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

export const organizationWorkflowTemplatesApi = {
  getList: async (params = {}) => {
    const response = await apiClient.get('/api/v1/workflow/organization-templates', { params });
    const payload = getData(response);
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : []);
  },

  getDefault: async (params = {}) => {
    const response = await apiClient.get('/api/v1/workflow/organization-templates/default', { params });
    return getData(response);
  },

  getById: async (templateId, params = {}) => {
    const response = await apiClient.get(`/api/v1/workflow/organization-templates/${templateId}`, { params });
    return getData(response);
  },

  create: async (payload = {}) => {
    const requestBody = payload && typeof payload === 'object' && payload.data ? payload.data : payload;
    const response = await apiClient.post('/api/v1/workflow/organization-templates', { data: requestBody });
    return getData(response);
  },

  update: async (templateId, payload = {}) => {
    const requestBody = payload && typeof payload === 'object' && payload.data ? payload.data : payload;
    const response = await apiClient.put(`/api/v1/workflow/organization-templates/${templateId}`, { data: requestBody });
    return getData(response);
  },

  delete: async (templateId) => {
    const response = await apiClient.delete(`/api/v1/workflow/organization-templates/${templateId}`);
    return getData(response);
  },

  propagate: async (templateId, { forceUpdateCustomized = false } = {}) => {
    const response = await apiClient.post(
      `/api/v1/workflow/organization-templates/${templateId}/propagate?forceUpdateCustomized=${forceUpdateCustomized}`
    );
    return getData(response);
  },

  reconcile: async ({ forceUpdateCustomized = false, organizationId } = {}) => {
    const params = { forceUpdateCustomized };
    if (organizationId) params.organizationId = organizationId;
    const response = await apiClient.post('/api/sso/organization/workflows/reconcile', null, { params });
    return getData(response);
  },

  getLogs: async (templateId) => {
    const response = await apiClient.get(`/api/v1/workflow/organization-templates/${templateId}/logs`);
    const payload = getData(response);
    return Array.isArray(payload) ? payload : [];
  },
};

export default workflowDefinitionsApi;
