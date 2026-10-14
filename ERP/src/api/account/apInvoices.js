import apiClient from '../common/client';

export const apInvoicesApi = {
  getList: async (filters, pageable) => {
    const params = new URLSearchParams();
    
    // Filters
    if (filters?.keyword || filters?.searchKey) params.append('searchKey', filters.keyword || filters.searchKey);
    if (filters?.vendorId) params.append('vendorId', filters.vendorId);
    if (filters?.invoiceNo) params.append('invoiceNo', filters.invoiceNo);
    const statuses = filters?.statuses || filters?.['filter.statuses'] || filters?.status;
    if (statuses) params.append('statuses', statuses);
    const hasBal = filters?.hasOutstandingBalance ?? filters?.['filter.hasOutstandingBalance'];
    if (hasBal !== undefined) params.append('hasOutstandingBalance', hasBal);
    if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    if (filters?.glPostingStatus) params.append('glPostingStatus', filters.glPostingStatus);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.isOverdue !== undefined) params.append('isOverdue', filters.isOverdue);
    if (filters?.fromDate || filters?.invoiceDateFrom) params.append('invoiceDateFrom', filters.fromDate || filters.invoiceDateFrom);
    if (filters?.toDate || filters?.invoiceDateTo) params.append('invoiceDateTo', filters.toDate || filters.invoiceDateTo);
    if (filters?.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters?.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    if (filters?.minAmount || filters?.minTotalAmount) params.append('minTotalAmount', filters.minAmount || filters.minTotalAmount);
    if (filters?.maxAmount || filters?.maxTotalAmount) params.append('maxTotalAmount', filters.maxAmount || filters.maxTotalAmount);
    if (filters?.minOutstanding || filters?.minOutstandingAmount) params.append('minOutstandingAmount', filters.minOutstanding || filters.minOutstandingAmount);
    if (filters?.maxOutstanding || filters?.maxOutstandingAmount) params.append('maxOutstandingAmount', filters.maxOutstanding || filters.maxOutstandingAmount);
    let isSystemAdmin = false;
    try {
      const authUser = JSON.parse(localStorage.getItem('auth_user'));
      const roles = authUser?.roles || authUser?.role || [];
      isSystemAdmin = authUser?.loginType === 'ADMIN' || roles.includes('SYSTEM_ADMIN') || roles.includes('ROLE_SYSTEM_ADMIN');
    } catch (e) {}

    if (isSystemAdmin && filters?.companyId) {
      params.append('companyId', filters.companyId);
    }

    // Pageable
    const pageVal = pageable?.page !== undefined ? pageable.page : filters?.page;
    if (pageVal !== undefined) params.append('page', pageVal);
    const sizeVal = pageable?.size !== undefined ? pageable.size : filters?.size;
    if (sizeVal !== undefined) params.append('size', Math.min(sizeVal, 200));
    const sortVal = pageable?.sort || filters?.sort;
    if (sortVal) {
      if (Array.isArray(sortVal)) {
        sortVal.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', sortVal);
      }
    }

    const response = await apiClient.get(`/api/account/invoices?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/account/invoices/${id}`);
    return response.data?.data || response.data;
  },

  create: async (payload) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.post('/api/account/invoices', p);
    return response.data?.data || response.data;
  },

  update: async (id, payload) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
    const { id: _, ...payloadWithoutId } = p;
    const reqPayload = { data: payloadWithoutId };
    const response = await apiClient.put(`/api/account/invoices/${id}`, reqPayload);
    return response.data?.data || response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/api/account/invoices/${id}`);
    return response.data?.data || response.data;
  },

  submitForApproval: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/submit-for-approval`);
    return response.data?.data || response.data;
  },

  approve: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/approve`);
    return response.data?.data || response.data;
  },

  reject: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/reject`);
    return response.data?.data || response.data;
  },

  cancel: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/cancel`);
    return response.data?.data || response.data;
  },

  postToGL: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/post`);
    return response.data?.data || response.data;
  },

  reverse: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/reverse`);
    return response.data?.data || response.data;
  },

  writeOff: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/write-off`);
    return response.data?.data || response.data;
  },

  voidInvoice: async (id) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/void`);
    return response.data?.data || response.data;
  },

  partialPayment: async (id, amount) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/partial-payment?paidAmount=${amount}`);
    return response.data?.data || response.data;
  },

  getByVendor: async (vendorId, filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get(`/api/account/invoices/vendor/${vendorId}`, { params });
    return response.data?.data || response.data;
  },

  getVendorOutstanding: async (vendorId) => {
    const response = await apiClient.get(`/api/account/invoices/vendor/${vendorId}/outstanding`);
    return response.data?.data || response.data;
  },

  getSummary: async () => {
    const response = await apiClient.get('/api/account/invoices/summary');
    return response.data?.data || response.data;
  },

  search: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/invoices/search', { params });
    return response.data?.data || response.data;
  },

  getPartiallyPaid: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/invoices/partially-paid', { params });
    return response.data?.data || response.data;
  },

  getPaid: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/invoices/paid', { params });
    return response.data?.data || response.data;
  },

  getOverdue: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/invoices/overdue', { params });
    return response.data?.data || response.data;
  },

  getOutstanding: async (filters = {}, pageable = {}) => {
    const params = { ...filters, ...pageable };
    const response = await apiClient.get('/api/account/invoices/outstanding', { params });
    return response.data?.data || response.data;
  },

  getByNumber: async (invoiceNo) => {
    const response = await apiClient.get(`/api/account/invoices/number/${invoiceNo}`);
    return response.data?.data || response.data;
  },

  getAging: async () => {
    const response = await apiClient.get('/api/account/invoices/aging');
    return response.data?.data || response.data;
  },

  /**
   * Download purchase invoice PDF
   * GET /api/account/invoices/{id}/pdf
   */
  downloadPdf: async (id, companyId) => {
    const response = await apiClient.get(`/api/account/invoices/${id}/pdf`, {
      params: { companyId },
      responseType: 'blob'
    });
    return response;
  },

  /**
   * Send purchase invoice PDF via email
   * POST /api/account/invoices/{id}/send-email
   */
  sendEmail: async (id, companyId) => {
    const response = await apiClient.post(`/api/account/invoices/${id}/send-email`, null, {
      params: { companyId }
    });
    return response.data;
  }
};
