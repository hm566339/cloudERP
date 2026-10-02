import apiClient from '../common/client';

export const receiptVouchersApi = {
  getReceipts: async (filters, pageable) => {
    const params = new URLSearchParams();
    const filterValues = {};

    if (filters?.searchKey) filterValues.searchKey = filters.searchKey;
    if (filters?.receiptNo) filterValues.receiptNo = filters.receiptNo;
    if (filters?.referenceNo) filterValues.referenceNo = filters.referenceNo;
    if (filters?.customerId) filterValues.customerId = filters.customerId;
    if (filters?.salesInvoiceId || filters?.arInvoiceId) filterValues.salesInvoiceId = filters.salesInvoiceId || filters.arInvoiceId;
    if (filters?.paymentMode) filterValues.paymentMode = filters.paymentMode;
    
    if (filters?.receiptStatuses?.length) {
      filterValues.receiptStatuses = filters.receiptStatuses;
    }
    if (filters?.postingStatuses?.length) {
      filterValues.postingStatuses = filters.postingStatuses;
    }

    if (filters?.minAmount !== undefined && filters.minAmount !== '') filterValues.minAmount = filters.minAmount;
    if (filters?.maxAmount !== undefined && filters.maxAmount !== '') filterValues.maxAmount = filters.maxAmount;
    if (filters?.receiptDateFrom) filterValues.receiptDateFrom = filters.receiptDateFrom;
    if (filters?.receiptDateTo) filterValues.receiptDateTo = filters.receiptDateTo;

    Object.entries(filterValues).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(`filter.${key}`, item));
      } else {
        params.append(`filter.${key}`, value);
      }
    });

    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }

    const response = await apiClient.get(`/api/account/receipts?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getReceiptById: async (id) => {
    const response = await apiClient.get(`/api/account/receipts/${id}`);
    return response.data?.data || response.data;
  },

  createReceipt: async (payload) => {
    const response = await apiClient.post(`/api/account/receipts`, payload);
    return response.data?.data || response.data;
  },

  updateReceipt: async (id, payload) => {
    const response = await apiClient.put(`/api/account/receipts/${id}`, payload);
    return response.data?.data || response.data;
  },

  deleteReceipt: async (id) => {
    const response = await apiClient.delete(`/api/account/receipts/${id}`);
    return response.data?.data || response.data;
  },

  submitReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/submit`);
    return response.data?.data || response.data;
  },

  approveReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/approve`);
    return response.data?.data || response.data;
  },

  rejectReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/reject`);
    return response.data?.data || response.data;
  },

  postReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/post`);
    return response.data?.data || response.data;
  },

  reverseReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/reverse`);
    return response.data?.data || response.data;
  },

  cancelReceipt: async (id) => {
    const response = await apiClient.post(`/api/account/receipts/${id}/cancel`);
    return response.data?.data || response.data;
  },

  createDeliveryChallan: async (receiptId, payload, companyId) => {
    const params = companyId ? { companyId } : {};
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : payload;
    const response = await apiClient.post(
      `/api/account/v1/delivery-challans/from-receipt/${receiptId}`,
      requestData,
      { params }
    );
    return response.data?.data || response.data;
  }
};
