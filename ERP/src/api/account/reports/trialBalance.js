import apiClient from '../../common/client';

export const trialBalanceApi = {
  getTrialBalance: async (params) => {
    // The prompt mentions GET /api/account/v1/reports/trial-balance and GET /api/account/reports/trial-balance.
    // It's likely v1 is the updated one. Let's use v1 as the primary one for data.
    const response = await apiClient.get('/api/account/v1/reports/trial-balance', { params });
    return response.data;
  },

  exportTrialBalancePdf: async (params) => {
    const response = await apiClient.get('/api/account/reports/trial-balance/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportTrialBalanceExcel: async (params) => {
    const response = await apiClient.get('/api/account/reports/trial-balance/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
