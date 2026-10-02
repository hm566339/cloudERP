import apiClient from '../common/client';

export const chartOfAccountsApi = {
  /**
   * Get all chart of accounts with pagination and filtering
   * GET /api/account/chart-of-accounts
   */
  getList: async (filters = {}, pageable = {}) => {
    const params = {
      ...filters,
      ...pageable
    };
    const response = await apiClient.get('/api/account/chart-of-accounts', { params });
    return response.data;
  },

  /**
   * Get chart of account by ID
   * GET /api/account/chart-of-accounts/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/account/chart-of-accounts/${id}`);
    return response.data;
  },

  /**
   * Create new chart of account
   * POST /api/account/chart-of-accounts
   */
  create: async (payload) => {
    const response = await apiClient.post('/api/account/chart-of-accounts', { data: payload });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing chart of account
   * PUT /api/account/chart-of-accounts/{id}
   */
  update: async (id, payload) => {
    const { id: _, ...payloadWithoutId } = payload;
    const response = await apiClient.put(`/api/account/chart-of-accounts/${id}`, { data: payloadWithoutId });
    return response.data?.data || response.data;
  },

  /**
   * Soft delete a chart of account
   * DELETE /api/account/chart-of-accounts/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/account/chart-of-accounts/${id}`);
    return response.data;
  }
};
