import apiClient from '../common/client';

export const expenseCategoriesApi = {
  /**
   * Get expense categories with optional filters and pagination
   * GET /api/account/expense-categories
   */
  getList: async (filters = {}, pageable = {}) => {
    const params = {
      ...filters,
      ...pageable
    };
    const response = await apiClient.get('/api/account/expense-categories', { params });
    return response.data;
  },

  /**
   * Get expense category by ID
   * GET /api/account/expense-categories/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/account/expense-categories/${id}`);
    return response.data;
  },

  /**
   * Create a new expense category
   * POST /api/account/expense-categories
   */
  create: async (data) => {
    const { companyId, ...fields } = data;
    const response = await apiClient.post('/api/account/expense-categories', { data: fields });
    return response.data;
  },

  /**
   * Update an existing expense category
   * PUT /api/account/expense-categories/{id}
   */
  update: async (data) => {
    const { id, companyId, ...payloadWithoutId } = data;
    const response = await apiClient.put(`/api/account/expense-categories/${id}`, { data: payloadWithoutId });
    return response.data;
  },

  /**
   * Delete an expense category
   * DELETE /api/account/expense-categories/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/account/expense-categories/${id}`);
    return response.data;
  },

  /**
   * Activate an expense category
   * PATCH /api/account/expense-categories/{id}/activate
   */
  activate: async (id) => {
    const response = await apiClient.patch(`/api/account/expense-categories/${id}/activate`);
    return response.data;
  },

  /**
   * Deactivate an expense category
   * PATCH /api/account/expense-categories/{id}/deactivate
   */
  deactivate: async (id) => {
    const response = await apiClient.patch(`/api/account/expense-categories/${id}/deactivate`);
    return response.data;
  }
};
