import apiClient from '../common/client';

/**
 * Create Purchase Requisition request payload.
 * `requesterName` must NEVER be sent from the frontend — the backend resolves it via SSO.
 *
 * @typedef {Object} CreatePurchaseRequisitionRequest
 * @property {string} requesterId - authenticated/current user id
 * @property {string} requisitionName - requisition display name
 * @property {string|null} [departmentId]
 * @property {string|null} [costCenterId]
 * @property {string} requiredDate - YYYY-MM-DD
 * @property {string} priority - LOW | MEDIUM | HIGH | URGENT
 * @property {string} [purpose]
 * @property {string} [remarks]
 * @property {Object[]} items
 */

/**
 * Purchase Requisition response shape returned by the backend.
 *
 * @typedef {Object} PurchaseRequisition
 * @property {string} id
 * @property {string} companyId
 * @property {string} requisitionNumber
 * @property {string} requesterId
 * @property {string|null} requesterName
 * @property {string} requisitionName
 * @property {string|null} departmentId
 * @property {string|null} costCenterId
 * @property {string} requiredDate
 * @property {string} priority
 * @property {string} purpose
 * @property {string|null} remarks
 * @property {string} status
 * @property {string|null} submittedBy
 * @property {string|null} submittedAt
 * @property {string|null} approvedBy
 * @property {string|null} approvedAt
 * @property {string|null} rejectedBy
 * @property {string|null} rejectedAt
 * @property {string|null} rejectionReason
 * @property {string|null} cancelledBy
 * @property {string|null} cancelledAt
 * @property {Object[]} items
 */

export const purchaseRequisitionsApi = {
  getList: async (filters = {}, pageable = {}) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    if (filters?.requiredDateFrom) params.append('requiredDateFrom', filters.requiredDateFrom);
    if (filters?.requiredDateTo) params.append('requiredDateTo', filters.requiredDateTo);
    if (filters?.createdDateFrom) params.append('createdDateFrom', filters.createdDateFrom);
    if (filters?.createdDateTo) params.append('createdDateTo', filters.createdDateTo);

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

    const response = await apiClient.get(`/api/account/purchase-requisitions?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/account/purchase-requisitions/${id}`);
    return response.data?.data || response.data;
  },

  create: async (payload, companyId) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const params = companyId ? { companyId } : {};
    console.log('CREATE API REQUEST', { companyId, payload: p });
    const response = await apiClient.post('/api/account/purchase-requisitions', p, { params });
    return response.data?.data || response.data;
  },

  update: async (id, payload, companyId) => {
    const p = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const params = companyId ? { companyId } : {};
    const response = await apiClient.put(`/api/account/purchase-requisitions/${id}`, p, { params });
    return response.data?.data || response.data;
  },

  submit: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/purchase-requisitions/${id}/submit`, null, { params });
    return response.data?.data || response.data;
  },

  approve: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/purchase-requisitions/${id}/approve`, null, { params });
    return response.data?.data || response.data;
  },

  reject: async (id, reason, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/purchase-requisitions/${id}/reject`, reason || {}, { params });
    return response.data?.data || response.data;
  },

  cancel: async (id, companyId) => {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.post(`/api/account/purchase-requisitions/${id}/cancel`, null, { params });
    return response.data?.data || response.data;
  }
};
