import { accountHttpClient } from '../common/client';

export const budgetHeadersApi = {
  getBudgetHeaders: (params) => {
    return accountHttpClient.get('/api/account/budget-headers', { params });
  },

  getBudgetHeaderById: (id) => {
    return accountHttpClient.get(`/api/account/budget-headers/${id}`);
  },

  createBudgetHeader: (payload) => {
    const { data } = payload;
    return accountHttpClient.post('/api/account/budget-headers', { data });
  },

  updateBudgetHeader: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/budget-headers/${id}`, { data });
  },

  deleteBudgetHeader: (id) => {
    return accountHttpClient.delete(`/api/account/budget-headers/${id}`);
  },

  getBudgetHeaderLines: (budgetHeaderId) => {
    return accountHttpClient.get(`/api/account/budget-headers/${budgetHeaderId}/lines`);
  },

  createBudgetHeaderLine: ({ budgetHeaderId, data }) => {
    return accountHttpClient.post(`/api/account/budget-headers/${budgetHeaderId}/lines`, { data });
  },

  updateBudgetHeaderLine: ({ lineId, data }) => {
    return accountHttpClient.put(`/api/account/budget-headers/lines/${lineId}`, { data });
  },

  deleteBudgetHeaderLine: (lineId) => {
    return accountHttpClient.delete(`/api/account/budget-headers/lines/${lineId}`);
  }
};
