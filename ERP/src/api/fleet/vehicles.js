import apiClient from '../common/client';

export const vehiclesApi = {
  getList: (params) => apiClient.get('/api/fleet/v1/vehicles', { params })
};
