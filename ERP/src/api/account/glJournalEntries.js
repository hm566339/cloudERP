import apiClient from '../common/client';

export const glJournalEntriesApi = {
  getJournalEntries: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals', { params });
    return response.data;
  },

  getJournalEntryById: async (id) => {
    const response = await apiClient.get(`/api/account/gl/journals/${id}`);
    return response.data;
  },

  createJournalEntry: async (payload) => {
    const response = await apiClient.post('/api/account/gl/journals', payload);
    return response.data;
  },

  updateJournalEntry: async ({ id, ...payload }) => {
    const response = await apiClient.put(`/api/account/gl/journals/${id}`, payload);
    return response.data;
  },

  deleteJournalEntry: async (id) => {
    const response = await apiClient.delete(`/api/account/gl/journals/${id}`);
    return response.data;
  },

  postJournalEntry: async (id) => {
    const response = await apiClient.post(`/api/account/gl/journals/${id}/post`);
    return response.data;
  },

  reverseJournalEntry: async (id) => {
    const response = await apiClient.post(`/api/account/gl/journals/${id}/reverse`);
    return response.data;
  },

  cancelJournalEntry: async (id) => {
    const response = await apiClient.post(`/api/account/gl/journals/${id}/cancel`);
    return response.data;
  },

  downloadJournalPDF: async (id) => {
    const response = await apiClient.get(`/api/account/gl/journals/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getTrialBalance: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/trial-balance', { params });
    return response.data;
  },

  downloadTrialBalancePDF: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/trial-balance/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  getGeneralLedger: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/general-ledger', { params });
    return response.data;
  },

  downloadGeneralLedgerPDF: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/general-ledger/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  getProfitLoss: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/profit-loss', { params });
    return response.data;
  },

  downloadProfitLossPDF: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/profit-loss/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  getBalanceSheet: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/balance-sheet', { params });
    return response.data;
  },

  downloadBalanceSheetPDF: async (params) => {
    const response = await apiClient.get('/api/account/gl/journals/balance-sheet/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
