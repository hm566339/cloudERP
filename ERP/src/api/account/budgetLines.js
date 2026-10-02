import { accountHttpClient } from '../common/client';

export const budgetLinesApi = {
  getBudgetLines: (params) => {
    return accountHttpClient.get('/api/account/budget-lines', { params });
  },

  getBudgetLineById: (id) => {
    return accountHttpClient.get(`/api/account/budget-lines/${id}`);
  },

  createBudgetLine: (payload) => {
    const { data } = payload;
    return accountHttpClient.post('/api/account/budget-lines', { data });
  },

  updateBudgetLine: ({ id, data }) => {
    return accountHttpClient.put(`/api/account/budget-lines/${id}`, { data });
  },

  deleteBudgetLine: (id) => {
    return accountHttpClient.delete(`/api/account/budget-lines/${id}`);
  },

  updateBudgetUtilization: (id) => {
    return accountHttpClient.put(`/api/account/budget-lines/${id}/utilization`);
  },

  getBudgetLinesByHeader: (budgetHeaderId, params) => {
    return accountHttpClient.get(`/api/account/budget-lines/header/${budgetHeaderId}`, { params });
  },

  getBudgetLinesByAccount: (accountId, params) => {
    return accountHttpClient.get(`/api/account/budget-lines/account/${accountId}`, { params });
  },

  getBudgetSummary: () => {
    return accountHttpClient.get('/api/account/budget-lines/summary');
  },

  getBudgetVarianceReport: (params) => {
    return accountHttpClient.get('/api/account/budget-lines/variance-report', { params });
  }
};
