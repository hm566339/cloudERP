import apiClient from '../../common/client';

export const profitLossApi = {
  getProfitLoss: async (params) => {
    const response = await apiClient.get('/api/account/v1/reports/profit-loss', { params });
    return response.data;
  },

  exportProfitLossPdf: async (params) => {
    const response = await apiClient.get('/api/account/reports/profit-loss/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportProfitLossExcel: async (params) => {
    const response = await apiClient.get('/api/account/reports/profit-loss/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
