import apiClient from '../../common/client';

export const balanceSheetApi = {
  getBalanceSheet: async (params) => {
    const response = await apiClient.get('/api/account/v1/reports/balance-sheet', { params });
    return response.data;
  },

  exportBalanceSheetPdf: async (params) => {
    const response = await apiClient.get('/api/account/reports/balance-sheet/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportBalanceSheetExcel: async (params) => {
    const response = await apiClient.get('/api/account/reports/balance-sheet/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
