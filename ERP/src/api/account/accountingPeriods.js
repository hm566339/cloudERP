import { accountHttpClient } from '../common/client';

export const accountingPeriodsApi = {
  /**
   * Get paginated Accounting Periods with filters
   * GET /api/account/accounting-periods
   */
  getList: async ({ params }) => {
    return accountHttpClient.get('/api/account/accounting-periods', { params });
  },

  /**
   * Get Accounting Period by ID
   * GET /api/account/accounting-periods/{accountingPeriodId}
   */
  getById: async (accountingPeriodId) => {
    return accountHttpClient.get(`/api/account/accounting-periods/${accountingPeriodId}`);
  },

  /**
   * Create a new Accounting Period
   * POST /api/account/accounting-periods/{fiscalYearId}
   */
  create: async ({ fiscalYearId, data }) => {
    return accountHttpClient.post(`/api/account/accounting-periods/${fiscalYearId}`, { data });
  },

  /**
   * Create Preset Accounting Periods
   * POST /api/account/accounting-periods/preset
   */
  createPreset: async ({ data }) => {
    return accountHttpClient.post('/api/account/accounting-periods/preset', { data });
  },

  /**
   * Update an existing Accounting Period
   * PUT /api/account/accounting-periods/{accountingPeriodId}
   */
  update: async ({ id, data }) => {
    return accountHttpClient.put(`/api/account/accounting-periods/${id}`, { data });
  },

  /**
   * Delete an Accounting Period
   * DELETE /api/account/accounting-periods/{accountingPeriodId}
   */
  delete: async (accountingPeriodId) => {
    return accountHttpClient.delete(`/api/account/accounting-periods/${accountingPeriodId}`);
  },

  /**
   * Toggle Accounting Period Status
   * PATCH /api/account/accounting-periods/{accountingPeriodId}/toggle-status
   */
  toggleStatus: async (accountingPeriodId) => {
    return accountHttpClient.patch(`/api/account/accounting-periods/${accountingPeriodId}/toggle-status`);
  }
};
