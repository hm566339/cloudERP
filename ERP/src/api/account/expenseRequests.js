import apiClient from '../common/client';

/**
 * API service for Expense Requests & Advance Requests.
 * Backend Base URL: /api/account/v1/expense-requests
 *
 * Adheres to ERP response wrappers:
 * {
 *   success: true,
 *   message: '...',
 *   data: [...],
 *   pagination: { page, size, totalElements, totalPages, ... }
 * }
 */
export const expenseRequestsApi = {
  /**
   * Get paginated expense requests with optional filters
   * GET /api/account/v1/expense-requests
   *
   * @param {Object} filters - e.g. { search, status, requestType, roleType, categoryId, dateFrom, dateTo }
   * @param {Object} pageable - e.g. { page: 0, size: 10, sort: 'createdAt,desc' }
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

    const response = await apiClient.get('/api/account/v1/expense-requests', { params });
    return response.data;
  },

  /**
   * Get single expense request details by ID
   * GET /api/account/v1/expense-requests/{id}
   */
  getById: async (id) => {
    if (!id) throw new Error('Expense request ID is required');
    const response = await apiClient.get(`/api/account/v1/expense-requests/${id}`);
    return response.data;
  },

  /**
   * Create a new expense or advance request in DRAFT status
   * POST /api/account/v1/expense-requests
   *
   * Backend expects: { data: { ... } } or flat payload parsed via parsePayload
   */
  create: async (payload) => {
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post('/api/account/v1/expense-requests', requestData);
    return response.data;
  },

  /**
   * Update an existing DRAFT expense request
   * PUT /api/account/v1/expense-requests/{id}
   */
  update: async (id, payload) => {
    if (!id) throw new Error('Expense request ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.put(`/api/account/v1/expense-requests/${id}`, requestData);
    return response.data;
  },

  /**
   * Submit a DRAFT expense request for approval
   * POST /api/account/v1/expense-requests/{id}/submit
   * Transitions: DRAFT -> PENDING_APPROVAL (or APPROVED if CEO/Owner)
   */
  submit: async (id) => {
    if (!id) throw new Error('Expense request ID is required');
    const response = await apiClient.post(`/api/account/v1/expense-requests/${id}/submit`);
    return response.data;
  },

  /**
   * Approve a PENDING_APPROVAL expense request
   * POST /api/account/v1/expense-requests/{id}/approve
   * Payload: { data: { approvedAmount: number, remarks: string } }
   */
  approve: async (id, payload = {}) => {
    if (!id) throw new Error('Expense request ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/expense-requests/${id}/approve`, requestData);
    return response.data;
  },

  /**
   * Reject a PENDING_APPROVAL expense request
   * POST /api/account/v1/expense-requests/{id}/reject
   * Payload: { data: { reason: string } }
   */
  reject: async (id, payload = {}) => {
    if (!id) throw new Error('Expense request ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/expense-requests/${id}/reject`, requestData);
    return response.data;
  },

  /**
   * Cancel an expense request (DRAFT or PENDING_APPROVAL)
   * POST /api/account/v1/expense-requests/{id}/cancel
   */
  cancel: async (id) => {
    if (!id) throw new Error('Expense request ID is required');
    const response = await apiClient.post(`/api/account/v1/expense-requests/${id}/cancel`);
    return response.data;
  },

  /**
   * Get consolidated employee expense balances
   * GET /api/account/v1/expense-requests/employee-balances
   */
  getEmployeeBalances: async (filters = {}) => {
    const params = { ...filters };
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });
    const response = await apiClient.get('/api/account/v1/expense-requests/employee-balances', { params });
    return response.data;
  },
};

/**
 * Dedicated service alias conforming to expenseRequestService method naming convention
 */
export const expenseRequestService = {
  getExpenseRequests: (filters, pageable) => expenseRequestsApi.getList(filters, pageable),
  getEmployeeBalances: (filters) => expenseRequestsApi.getEmployeeBalances(filters),
  getExpenseRequestById: (id) => expenseRequestsApi.getById(id),
  createExpenseRequest: (payload) => expenseRequestsApi.create(payload),
  updateExpenseRequest: (id, payload) => expenseRequestsApi.update(id, payload),
  submitExpenseRequest: (id) => expenseRequestsApi.submit(id),
  approveExpenseRequest: (id, payload) => expenseRequestsApi.approve(id, payload),
  rejectExpenseRequest: (id, payload) => expenseRequestsApi.reject(id, payload),
  cancelExpenseRequest: (id) => expenseRequestsApi.cancel(id),
};

export default expenseRequestsApi;
