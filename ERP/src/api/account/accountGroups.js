import { accountHttpClient } from '../common/client';

export const accountGroupsApi = {
  /**
   * Get paginated Account Groups with filters
   * GET /api/account/account-groups
   */
  getList: async (args) => {
    const params = args?.params || (args && !args.params ? args : undefined);
    const response = await accountHttpClient.get('/api/account/account-groups', { params });
    return response.data;
  },

  /**
   * Get Account Group by ID
   * GET /api/account/account-groups/{accountGroupId}
   */
  getById: async (accountGroupId) => {
    const response = await accountHttpClient.get(`/api/account/account-groups/${accountGroupId}`);
    return response.data;
  },

  /**
   * Create a new Account Group
   * POST /api/account/account-groups
   */
  create: async (payload) => {
    const rawData = payload?.data || payload;
    const requestBody = rawData?.data ? rawData : { data: rawData };
    const response = await accountHttpClient.post('/api/account/account-groups', requestBody);
    return response.data;
  },

  /**
   * Update an existing Account Group
   * PUT /api/account/account-groups/{accountGroupId}
   */
  update: async (payload) => {
    const id = payload?.id || payload?.accountGroupId;
    const rawData = payload?.data?.data ? payload.data : (payload?.data ? payload.data : payload);
    const requestBody = rawData?.data ? rawData : { data: rawData };
    const response = await accountHttpClient.put(`/api/account/account-groups/${id}`, requestBody);
    return response.data;
  },

  /**
   * Delete an Account Group
   * DELETE /api/account/account-groups/{accountGroupId}
   */
  delete: async (accountGroupId) => {
    const response = await accountHttpClient.delete(`/api/account/account-groups/${accountGroupId}`);
    return response.data;
  },

  /**
   * Restore a deleted Account Group
   * PATCH /api/account/account-groups/{accountGroupId}/restore
   */
  restore: async (accountGroupId) => {
    const response = await accountHttpClient.patch(`/api/account/account-groups/${accountGroupId}/restore`);
    return response.data;
  }
};
