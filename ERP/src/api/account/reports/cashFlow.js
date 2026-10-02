import apiClient from '../../common/client';

export const cashFlowApi = {
  getCashFlow: async (params) => {
    const response = await apiClient.get('/api/account/reports/cash-flow', { params });
    return response.data;
  },

  exportCashFlowPdf: async (params) => {
    const response = await apiClient.get('/api/account/reports/cash-flow/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportCashFlowExcel: async (params) => {
    const response = await apiClient.get('/api/account/reports/cash-flow/excel', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
