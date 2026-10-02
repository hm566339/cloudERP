import { accountHttpClient } from '../common/client';

export const accountCategoriesApi = {
  /**
   * Get all Account Categories (paginated with filters)
   * GET /api/account/account-categories
   */
  getList: async (args) => {
    const params = args?.params || (args && !args.params ? args : undefined);
    const response = await accountHttpClient.get('/api/account/account-categories', { params });
    return response.data;
  },
  /**
   * Get Account Category by ID
   * GET /api/account/account-categories/{accountCategoryId}
   */
  getById: async (accountCategoryId) => {
    const response = await accountHttpClient.get(`/api/account/account-categories/${accountCategoryId}`);
    return response.data;
  },
  /**
   * Create a new Account Category
   * POST /api/account/account-categories
   * @param {Object} payload - { companyId, data: { name, code } }
   */
  create: async (payload) => {
    const companyId = payload?.companyId;
    const rawData = payload?.data || payload;

    // Ensure payload is correctly wrapped in { data: { ... } } format for backend RequestWrapper
    const requestBody = rawData?.data ? rawData : { data: rawData };
    const params = companyId ? { companyId } : {};

    const response = await accountHttpClient.post('/api/account/account-categories', requestBody, { params });
    return response.data;
  },

  /**
   * Update an existing Account Category
   * PUT /api/account/account-categories/{accountCategoryId}
   */
  update: async (payload) => {
    const id = payload?.id || payload?.accountCategoryId;
    const rawData = payload?.data || payload;

    // Ensure payload is correctly wrapped in { data: { ... } } format for backend RequestWrapper
    const requestBody = rawData?.data ? rawData : { data: rawData };

    const response = await accountHttpClient.put(`/api/account/account-categories/${id}`, requestBody);
    return response.data;
  },

  /**
   * Delete an Account Category
   * DELETE /api/account/account-categories/{accountCategoryId}
   */
  delete: async (accountCategoryId) => {
    const response = await accountHttpClient.delete(`/api/account/account-categories/${accountCategoryId}`);
    return response.data;
  },

  /**
   * Restore a deleted Account Category
   * PATCH /api/account/account-categories/{accountCategoryId}
   */
  restore: async (accountCategoryId) => {
    const response = await accountHttpClient.patch(`/api/account/account-categories/${accountCategoryId}`);
    return response.data;
  }
};
