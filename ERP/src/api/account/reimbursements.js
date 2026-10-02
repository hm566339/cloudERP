import apiClient from '../common/client';

/**
 * API service for Reimbursements.
 * Backend Base URL: /api/account/v1/reimbursements
 *
 * Adheres to ERP response wrappers:
 * {
 *   success: true,
 *   message: '...',
 *   data: [...],
 *   pagination: { page, size, totalElements, totalPages, ... }
 * }
 */
export const reimbursementsApi = {
  /**
   * Get paginated reimbursements with optional filters
   * GET /api/account/v1/reimbursements
   *
   * @param {Object} filters - e.g. { search, status, employeeId, expenseClaimId }
   * @param {Object} pageable - e.g. { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' }
   */
  getList: async (filters = {}, pageable = {}) => {
    const params = {
      ...filters,
      ...pageable,
    };
    // Remove undefined or null keys
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    const response = await apiClient.get('/api/account/v1/reimbursements', { params });
    return response.data;
  },

  /**
   * Get single reimbursement details by ID
   * GET /api/account/v1/reimbursements/{id}
   */
  getById: async (id) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const response = await apiClient.get(`/api/account/v1/reimbursements/${id}`);
    return response.data;
  },

  /**
   * Create a new reimbursement
   * POST /api/account/v1/reimbursements
   */
  create: async (payload) => {
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post('/api/account/v1/reimbursements', requestData);
    return response.data;
  },

  /**
   * Update an existing DRAFT reimbursement
   * PUT /api/account/v1/reimbursements/{id}
   */
  update: async (id, payload) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.put(`/api/account/v1/reimbursements/${id}`, requestData);
    return response.data;
  },

  /**
   * Submit a DRAFT reimbursement for approval
   * POST /api/account/v1/reimbursements/{id}/submit
   */
  submit: async (id) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const response = await apiClient.post(`/api/account/v1/reimbursements/${id}/submit`);
    return response.data;
  },

  /**
   * Approve a PENDING reimbursement
   * POST /api/account/v1/reimbursements/{id}/approve
   * Payload: { data: { notes: string } }
   */
  approve: async (id, payload = {}) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/reimbursements/${id}/approve`, requestData);
    return response.data;
  },

  /**
   * Reject a PENDING reimbursement
   * POST /api/account/v1/reimbursements/{id}/reject
   * Payload: { data: { rejectionReason: string } }
   */
  reject: async (id, payload = {}) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/reimbursements/${id}/reject`, requestData);
    return response.data;
  },

  /**
   * Pay a reimbursement
   * POST /api/account/v1/reimbursements/{id}/pay
   * Payload: { data: { paymentMethod, paymentDate, paymentReference, amount } }
   */
  pay: async (id, payload = {}) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/reimbursements/${id}/pay`, requestData);
    return response.data;
  },

  /**
   * Cancel a reimbursement
   * POST /api/account/v1/reimbursements/{id}/cancel
   */
  cancel: async (id) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const response = await apiClient.post(`/api/account/v1/reimbursements/${id}/cancel`);
    return response.data;
  },

  /**
   * Delete a DRAFT or REJECTED reimbursement
   * DELETE /api/account/v1/reimbursements/{id}
   */
  delete: async (id) => {
    if (!id) throw new Error('Reimbursement ID is required');
    const response = await apiClient.delete(`/api/account/v1/reimbursements/${id}`);
    return response.data;
  }
};
