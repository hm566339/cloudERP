import { accountHttpClient } from '../common/client';

export const hsnSacMasterApi = {
  getHsnSacList: async (params) => {
    const response = await accountHttpClient.get('/api/account/hsn-sac', { params });
    return response.data;
  },

  getHsnSacById: async (hsnSacId) => {
    const response = await accountHttpClient.get(`/api/account/hsn-sac/${hsnSacId}`);
    return response.data;
  },

  createHsnSac: async (data) => {
    const response = await accountHttpClient.post('/api/account/hsn-sac', data);
    return response.data;
  },

  updateHsnSac: async ({ hsnSacId, data }) => {
    const response = await accountHttpClient.put(`/api/account/hsn-sac/${hsnSacId}`, data);
    return response.data;
  },

  deleteHsnSac: async (hsnSacId) => {
    const response = await accountHttpClient.delete(`/api/account/hsn-sac/${hsnSacId}`);
    return response.data;
  },

  getHsnReport: async (params) => {
    const response = await accountHttpClient.get('/api/account/hsn-sac/reports/hsn', { params });
    return response.data;
  },

  getSacReport: async (params) => {
    const response = await accountHttpClient.get('/api/account/hsn-sac/reports/sac', { params });
    return response.data;
  },

  getHsnSacByCode: async (code) => {
    const response = await accountHttpClient.get(`/api/account/hsn-sac/code/${code}`);
    return response.data;
  }
};
