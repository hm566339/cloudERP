import apiClient from '../common/client';

/**
 * API service for Expenses (Actual Expense Claims).
 * Backend Base URL: /api/account/v1/expenses
 *
 * Adheres to ERP response wrappers:
 * {
 *   success: true,
 *   message: '...',
 *   data: [...],
 *   pagination: { page, size, totalElements, totalPages, ... }
 * }
 */
export const expensesApi = {
  /**
   * Get paginated expenses with optional filters
   * GET /api/account/v1/expenses
   *
   * @param {Object} filters - e.g. { search, status, categoryId, dateFrom, dateTo }
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

    const response = await apiClient.get('/api/account/v1/expenses', { params });
    return response.data;
  },

  /**
   * Get single expense details by ID
   * GET /api/account/v1/expenses/{id}
   */
  getById: async (id) => {
    if (!id) throw new Error('Expense ID is required');
    const response = await apiClient.get(`/api/account/v1/expenses/${id}`);
    return response.data;
  },

  /**
   * Reusable helper to fetch current authenticated user from GET /api/account/auth/me
   * Returns current user object { id, fullName, role, ... }
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/api/account/auth/me');
    return response?.data?.data || response?.data;
  },

  /**
   * Create a new expense claim
   * POST /api/account/v1/expenses?companyId={companyId}
   */
  create: async (payload, companyId) => {
    const resolvedCompanyId = companyId || payload?.companyId || payload?.data?.companyId;
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const query = resolvedCompanyId ? `?companyId=${encodeURIComponent(resolvedCompanyId)}` : '';
    const response = await apiClient.post(`/api/account/v1/expenses${query}`, requestData);
    return response.data;
  },

  /**
   * Update an existing DRAFT expense claim
   * PUT /api/account/v1/expenses/{id}?companyId={companyId}
   */
  update: async (id, payload, companyId) => {
    if (!id) throw new Error('Expense ID is required');
    const resolvedCompanyId = companyId || payload?.companyId || payload?.data?.companyId;
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const query = resolvedCompanyId ? `?companyId=${encodeURIComponent(resolvedCompanyId)}` : '';
    const response = await apiClient.put(`/api/account/v1/expenses/${id}${query}`, requestData);
    return response.data;
  },

  /**
   * Submit a DRAFT expense claim for approval
   * POST /api/account/v1/expenses/{id}/submit
   */
  submit: async (id) => {
    if (!id) throw new Error('Expense ID is required');
    const response = await apiClient.post(`/api/account/v1/expenses/${id}/submit`);
    return response.data;
  },

  /**
   * Approve a PENDING expense claim
   * POST /api/account/v1/expenses/{id}/approve
   * Payload: { data: { notes: string } }
   */
  approve: async (id, payload = {}) => {
    if (!id) throw new Error('Expense ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/expenses/${id}/approve`, requestData);
    return response.data;
  },

  /**
   * Reject a PENDING expense claim
   * POST /api/account/v1/expenses/{id}/reject
   * Payload: { data: { rejectionReason: string } }
   */
  reject: async (id, payload = {}) => {
    if (!id) throw new Error('Expense ID is required');
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post(`/api/account/v1/expenses/${id}/reject`, requestData);
    return response.data;
  },

  /**
   * Cancel an expense claim
   * POST /api/account/v1/expenses/{id}/cancel
   */
  cancel: async (id) => {
    if (!id) throw new Error('Expense ID is required');
    const response = await apiClient.post(`/api/account/v1/expenses/${id}/cancel`);
    return response.data;
  },

  /**
   * Soft delete an expense claim
   * DELETE /api/account/v1/expenses/{id}
   */
  delete: async (id) => {
    if (!id) throw new Error('Expense ID is required');
    const response = await apiClient.delete(`/api/account/v1/expenses/${id}`);
    return response.data;
  },

  /**
   * Upload expense bill attachment (JPG, JPEG, PNG, PDF)
   * POST /api/account/v1/expenses/attachments
   */
  uploadAttachment: async (file, companyId) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post('/api/account/v1/expenses/attachments', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const expenseService = {
  getExpenses: (filters, pageable) => expensesApi.getList(filters, pageable),
  getExpenseById: (id) => expensesApi.getById(id),
  createExpense: (payload) => expensesApi.create(payload),
  updateExpense: (id, payload) => expensesApi.update(id, payload),
  submitExpense: (id) => expensesApi.submit(id),
  approveExpense: (id, payload) => expensesApi.approve(id, payload),
  rejectExpense: (id, payload) => expensesApi.reject(id, payload),
  cancelExpense: (id) => expensesApi.cancel(id),
  deleteExpense: (id) => expensesApi.delete(id),
  uploadAttachment: (file, companyId) => expensesApi.uploadAttachment(file, companyId),
};

export const getCurrentUser = expensesApi.getCurrentUser;

export default expensesApi;
