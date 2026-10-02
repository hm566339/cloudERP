import apiClient from '../common/client';

export const customersApi = {
  /**
   * Get customers with optional filters and pagination
   * GET /api/account/customers
   */
  getList: async (filters = {}, pageable = {}) => {
    const params = {
      ...filters,
      ...pageable
    };
    const response = await apiClient.get('/api/account/customers', { params });
    return response.data;
  },

  /**
   * Get customer by ID
   * GET /api/account/customers/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/account/customers/${id}`);
    return response.data;
  },

  /**
   * Create a new customer
   * POST /api/account/customers
   */
  create: async (payload) => {
    const { companyId, includeCompanyId, data } = payload || {};
    const response = await apiClient.post(
      '/api/account/customers',
      { data: data || {} },
      includeCompanyId && companyId ? { params: { companyId } } : undefined
    );
    const result = response.data;

    if (result && Object.prototype.hasOwnProperty.call(result, 'success') && result.success !== true) {
      const message = result.message || result.errors?.join(', ') || 'Customer creation failed.';
      const error = new Error(message);
      error.data = result;
      throw error;
    }

    return result;
  },

  /**
   * Update an existing customer
   * PUT /api/account/customers/{id}
   */
  update: async (data) => {
    const { id, companyId, ...payloadWithoutId } = data;
    const response = await apiClient.put(`/api/account/customers/${id}`, { data: payloadWithoutId });
    return response.data;
  },

  /**
   * Delete a customer (soft delete)
   * DELETE /api/account/customers/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/account/customers/${id}`);
    return response.data;
  },

  /**
   * Activate a customer
   * PATCH /api/account/customers/{id}/activate
   */
  activate: async (id) => {
    const response = await apiClient.patch(`/api/account/customers/${id}/activate`);
    return response.data;
  },

  /**
   * Deactivate a customer
   * PATCH /api/account/customers/{id}/deactivate
   */
  deactivate: async (id) => {
    const response = await apiClient.patch(`/api/account/customers/${id}/deactivate`);
    return response.data;
  },

  /**
   * Get customer transactions for a date range
   * GET /api/account/customers/{id}/transactions
   */
  transactions: async (id, fromDate, toDate) => {
    const response = await apiClient.get(`/api/account/customers/${id}/transactions`, {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  /**
   * Get customer ledger for a date range
   * GET /api/account/customers/{id}/ledger
   */
  ledger: async (id, fromDate, toDate) => {
    const response = await apiClient.get(`/api/account/customers/${id}/ledger`, {
      params: { fromDate, toDate }
    });
    return response.data;
  }
};

