import { accountHttpClient } from '../common/client';

export const apPaymentsApi = {
  /**
   * Get paginated AP Payments with filters
   * GET /api/account/ap-payments
   */
  getList: async ({ params }) => {
    return accountHttpClient.get('/api/account/ap-payments', { params });
  },

  /**
   * Get AP Payment by ID
   * GET /api/account/ap-payments/{id}
   */
  getById: async (id) => {
    return accountHttpClient.get(`/api/account/ap-payments/${id}`);
  },

  /**
   * Create a new AP Payment
   * POST /api/account/ap-payments
   */
  create: async ({ data }) => {
    return accountHttpClient.post('/api/account/ap-payments', { data });
  },

  /**
   * Update an existing AP Payment
   * PUT /api/account/ap-payments/{id}
   */
  update: async ({ id, data }) => {
    return accountHttpClient.put(`/api/account/ap-payments/${id}`, { data });
  },

  /**
   * Delete an AP Payment
   * DELETE /api/account/ap-payments/{id}
   */
  delete: async (id) => {
    return accountHttpClient.delete(`/api/account/ap-payments/${id}`);
  },

  /**
   * Post AP Payment to GL
   * PUT /api/account/ap-payments/{id}/post
   */
  postToGL: async (id) => {
    return accountHttpClient.put(`/api/account/ap-payments/${id}/post`);
  },

  /**
   * Reverse AP Payment GL Posting
   * PUT /api/account/ap-payments/{id}/reverse
   */
  reverse: async (id) => {
    return accountHttpClient.put(`/api/account/ap-payments/${id}/reverse`);
  },

  /**
   * Get Vendor AP Payment Ledger
   * GET /api/account/ap-payments/ledger/{vendorId}
   */
  getLedger: async ({ vendorId, params }) => {
    return accountHttpClient.get(`/api/account/ap-payments/ledger/${vendorId}`, { params });
  }
};
