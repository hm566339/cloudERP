import apiClient from '../common/client';

const unwrapApiData = (response) => response?.data?.data ?? response?.data ?? response;

export const workflowTasksApi = {
  getPending: async ({ companyId, page = 0, size = 20, sort = 'assignedAt,desc' } = {}) => {
    const params = {};
    if (companyId) params.companyId = companyId;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    if (sort) params.sort = sort;

    const response = await apiClient.get('/api/account/workflow/tasks/pending', { params });
    const payload = unwrapApiData(response);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

    return {
      items,
      pagination: payload?.pagination || null,
      raw: payload,
    };
  },

  approve: async (taskId, comment = 'Approved') => {
    const response = await apiClient.post(`/api/account/workflow/tasks/${taskId}/approve`, { comment });
    return unwrapApiData(response);
  },

  reject: async (taskId, comment = 'Rejected') => {
    const response = await apiClient.post(`/api/account/workflow/tasks/${taskId}/reject`, { comment });
    return unwrapApiData(response);
  },

  delegate: async (taskId, { userId, comment = 'Delegated' } = {}) => {
    const response = await apiClient.post(`/api/account/workflow/tasks/${taskId}/delegate`, { userId, comment });
    return unwrapApiData(response);
  },
};

export default workflowTasksApi;