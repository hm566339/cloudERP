import apiClient from '../common/client';

export const supplierQuotationsApi = {
  getList: async (filters = {}, pageable = {}) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.quotationDateFrom) params.append('quotationDateFrom', filters.quotationDateFrom);
    if (filters?.quotationDateTo) params.append('quotationDateTo', filters.quotationDateTo);
    if (filters?.vendorId) params.append('vendorId', filters.vendorId);
    if (filters?.rfqId) params.append('rfqId', filters.rfqId);
    if (filters?.status) params.append('status', filters.status);

    let isSystemAdmin = false;
    try {
      const authUser = JSON.parse(localStorage.getItem('auth_user'));
      const roles = authUser?.roles || authUser?.role || [];
      isSystemAdmin = authUser?.loginType === 'ADMIN' || roles.includes('SYSTEM_ADMIN') || roles.includes('ROLE_SYSTEM_ADMIN');
    } catch (e) {}

    if (isSystemAdmin && filters?.companyId) {
      params.append('companyId', filters.companyId);
    }

    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }

    const response = await apiClient.get(`/api/account/supplier-quotations?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/account/supplier-quotations/${id}`);
    return response.data?.data || response.data;
  },

  getByRfq: async (rfqId) => {
    const response = await apiClient.get(`/api/account/supplier-quotations/by-rfq/${rfqId}`);
    return response.data?.data || response.data;
  },

  create: async (payload, companyId) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post('/api/account/supplier-quotations', p, { params });
    return response.data?.data || response.data;
  },

  update: async (id, payload) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await apiClient.put(`/api/account/supplier-quotations/${id}`, p);
    return response.data?.data || response.data;
  },

  award: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/supplier-quotations/${id}/award`, null, { params });
    return response.data?.data || response.data;
  },

  convertToPurchaseOrder: async (quotationId, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/purchase-orders/from-supplier-quotation/${quotationId}`, null, { params });
    return response.data?.data || response.data;
  }
};