import { accountHttpClient } from '../common/client';

export const gstSlabsApi = {
  getGstSlabs: async (params) => {
    const response = await accountHttpClient.get('/api/account/gst-slabs', { params });
    return response.data;
  },

  getGstSlabById: async (gstSlabId) => {
    const response = await accountHttpClient.get(`/api/account/gst-slabs/${gstSlabId}`);
    return response.data;
  },

  createGstSlab: async (data) => {
    const response = await accountHttpClient.post('/api/account/gst-slabs', data);
    return response.data;
  },

  updateGstSlab: async ({ gstSlabId, data }) => {
    const response = await accountHttpClient.put(`/api/account/gst-slabs/${gstSlabId}`, data);
    return response.data;
  },

  deleteGstSlab: async (gstSlabId) => {
    const response = await accountHttpClient.delete(`/api/account/gst-slabs/${gstSlabId}`);
    return response.data;
  }
};
