import apiClient from '../common/client';

export const rfqsApi = {
  getList: async (filters = {}, pageable = {}) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.issueDateFrom) params.append('issueDateFrom', filters.issueDateFrom);
    if (filters?.issueDateTo) params.append('issueDateTo', filters.issueDateTo);
    if (filters?.quotationDeadlineFrom) params.append('quotationDeadlineFrom', filters.quotationDeadlineFrom);
    if (filters?.quotationDeadlineTo) params.append('quotationDeadlineTo', filters.quotationDeadlineTo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.purchaseRequisitionId) params.append('purchaseRequisitionId', filters.purchaseRequisitionId);

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

    const response = await apiClient.get(`/api/account/rfqs?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/account/rfqs/${id}`);
    return response.data?.data || response.data;
  },

  create: async (payload, companyId) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post('/api/account/rfqs', p, { params });
    return response.data?.data || response.data;
  },

  update: async (id, payload, companyId) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const params = companyId ? { companyId } : {};
    const response = await apiClient.put(`/api/account/rfqs/${id}`, p, { params });
    return response.data?.data || response.data;
  },

  send: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/rfqs/${id}/send`, null, { params });
    return response.data?.data || response.data;
  },

  sendEmail: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/rfqs/${id}/send-email`, null, { params });
    return response.data || response;
  },

  close: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/rfqs/${id}/close`, null, { params });
    return response.data?.data || response.data;
  },

  cancel: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/rfqs/${id}/cancel`, null, { params });
    return response.data?.data || response.data;
  }
};
