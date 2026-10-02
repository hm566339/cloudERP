import apiClient from '../common/client';

export const salesInvoicesApi = {
  /**
   * Get all invoices with pagination and advanced filtering
   * GET /api/account/sales/invoices
   */
  getList: async (filters = {}, pageable = {}) => {
    const { page = 0, size = 20, sort = 'invoiceDate,desc', ...filterValues } = {
      ...filters,
      ...pageable
    };
    const params = { page, size, sort };

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[`filter.${key}`] = key === 'statuses' || key === 'postingStatuses'
          ? [value]
          : value;
      }
    });

    const response = await apiClient.get('/api/account/sales/invoices', { params });
    return response.data;
  },

  /**
   * Get invoice by ID
   * GET /api/account/sales/invoices/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/account/sales/invoices/${id}`);
    return response.data;
  },

  /**
   * Create new sales invoice
   * POST /api/account/sales/invoices
   */
  create: async (payload) => {
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post('/api/account/sales/invoices', requestData);
    return response.data;
  },

  /**
   * Update an existing DRAFT sales invoice
   * PUT /api/account/sales/invoices/{id}
   */
  update: async (id, payload) => {
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.put(`/api/account/sales/invoices/${id}`, requestData);
    return response.data;
  },

  /**
   * Delete a DRAFT sales invoice
   * DELETE /api/account/sales/invoices/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/account/sales/invoices/${id}`);
    return response.data;
  },

  /**
   * Approve a DRAFT invoice
   * POST /api/account/sales/invoices/{id}/approve
   */
  approve: async (id) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/approve`);
    return response.data;
  },

  /**
   * Reject a DRAFT or PENDING_APPROVAL invoice
   * POST /api/account/sales/invoices/{id}/reject
   */
  reject: async (id) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/reject`);
    return response.data;
  },

  /**
   * Post an APPROVED invoice to General Ledger
   * POST /api/account/sales/invoices/{id}/post
   */
  postToGL: async (id) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/post`);
    return response.data;
  },

  /**
   * Cancel an invoice
   * POST /api/account/sales/invoices/{id}/cancel
   */
  cancel: async (id) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/cancel`);
    return response.data;
  },

  /**
   * Record partial payment
   * POST /api/account/sales/invoices/{id}/partial-payment?paymentAmount=X
   */
  partialPayment: async (id, paymentAmount) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/partial-payment`, null, {
      params: { paymentAmount }
    });
    return response.data;
  },

  /**
   * Mark invoice as paid
   * POST /api/account/sales/invoices/{id}/mark-paid?paymentAmount=X
   */
  markPaid: async (id, paymentAmount) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/mark-paid`, null, {
      params: { paymentAmount }
    });
    return response.data;
  },

  /**
   * Get invoices by status
   * GET /api/account/sales/invoices/status/{status}
   */
  getByStatus: async (status, filters = {}, pageable = {}) => {
    const params = {
      ...filters,
      ...pageable
    };
    const response = await apiClient.get(`/api/account/sales/invoices/status/${status}`, { params });
    return response.data;
  },

  /**
   * Get invoice summary report
   * GET /api/account/sales/invoices/reports/summary
   */
  getSummaryReport: async (filters = {}) => {
    const response = await apiClient.get('/api/account/sales/invoices/reports/summary', { params: filters });
    return response.data;
  },

  /**
   * Get customer specific invoice summary
   * GET /api/account/sales/invoices/reports/customer/{customerId}/summary
   */
  getCustomerSummary: async (customerId, filters = {}) => {
    const response = await apiClient.get(`/api/account/sales/invoices/reports/customer/${customerId}/summary`, { params: filters });
    return response.data;
  },

  /**
   * Get overdue invoices
   * GET /api/account/sales/invoices/overdue
   */
  getOverdue: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/sales/invoices/overdue', { params });
    return response.data;
  },

  /**
   * Get outstanding invoices
   * GET /api/account/sales/invoices/outstanding
   */
  getOutstanding: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/sales/invoices/outstanding', { params });
    return response.data;
  },

  /**
   * Get invoice by invoice number
   * GET /api/account/sales/invoices/number/{invoiceNumber}
   */
  getByNumber: async (invoiceNumber) => {
    const response = await apiClient.get(`/api/account/sales/invoices/number/${invoiceNumber}`);
    return response.data;
  },

  /**
   * Get invoices by customer ID
   * GET /api/account/sales/invoices/customer/{customerId}
   */
  getByCustomer: async (customerId, filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get(`/api/account/sales/invoices/customer/${customerId}`, { params });
    return response.data;
  },

  /**
   * Get outstanding balance by customer
   * GET /api/account/sales/invoices/customer/{customerId}/outstanding-balance
   */
  getCustomerOutstandingBalance: async (customerId) => {
    const response = await apiClient.get(`/api/account/sales/invoices/customer/${customerId}/outstanding-balance`);
    return response.data;
  },

  /**
   * Get aging report
   * GET /api/account/sales/invoices/aging
   */
  getAgingReport: async (filters = {}) => {
    const response = await apiClient.get('/api/account/sales/invoices/aging', { params: filters });
    return response.data;
  },

  /**
   * Download invoice PDF
   * GET /api/account/sales/invoices/{id}/pdf
   */
  downloadPdf: async (id, companyId) => {
    const response = await apiClient.get(`/api/account/sales/invoices/${id}/pdf`, {
      params: { companyId },
      responseType: 'blob'
    });
    return response; // Return response so we can get headers or just data
  },

  /**
   * Send invoice PDF via email
   * POST /api/account/sales/invoices/{id}/send-email
   */
  sendEmail: async (id, companyId) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${id}/send-email`, null, {
      params: { companyId }
    });
    return response.data;
  }
};
