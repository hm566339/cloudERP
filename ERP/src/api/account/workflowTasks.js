import apiClient from '../common/client.js';

const unwrapApiData = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (payload.data !== undefined) return payload.data;
    if (payload.success !== undefined && payload.message !== undefined) return payload;
  }
  return payload;
};

export const workflowTasksApi = {
  getPending: async ({ companyId, page = 0, size = 20, sort = 'assignedAt,desc' } = {}) => {
    const params = { status: 'PENDING' };
    if (companyId) params.companyId = companyId;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    if (sort) params.sort = sort;

    const response = await apiClient.get('/api/v1/workflow/tasks/my-tasks', { params });
    const payload = unwrapApiData(response);
    const items = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.content)
        ? payload.content
        : (Array.isArray(payload?.data) ? payload.data : []));

    return {
      items,
      pagination: payload?.totalPages !== undefined ? {
        total: payload.totalElements ?? items.length,
        pages: payload.totalPages,
        page: payload.number ?? page,
        size: payload.size ?? size,
      } : (payload?.pagination || null),
      raw: payload,
    };
  },

  approve: async (taskId, comment = 'Approved') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/approve`, {
      data: { taskId, comments: comment }
    });
    return unwrapApiData(response);
  },

  reject: async (taskId, comment = 'Rejected') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/reject`, {
      data: { taskId, reason: comment }
    });
    return unwrapApiData(response);
  },

  returnToInitiator: async (taskId, comment = 'Returned for revision') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/return`, {
      data: { taskId, reason: comment }
    });
    return unwrapApiData(response);
  },

  delegate: async (taskId, { userId, comment = 'Delegated' } = {}) => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/delegate`, {
      data: { taskId, delegatedTo: userId, reason: comment }
    });
    return unwrapApiData(response);
  },
};

export default workflowTasksApi;