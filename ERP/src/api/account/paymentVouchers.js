import apiClient from '../common/client';

export const paymentVouchersApi = {
  getPaymentVouchers: async (filters, pageable) => {
    const params = new URLSearchParams();

    if (filters?.searchKey) params.append('searchKey', filters.searchKey);
    if (filters?.voucherNo) params.append('voucherNo', filters.voucherNo);
    if (filters?.referenceNo) params.append('referenceNo', filters.referenceNo);
    if (filters?.vendorId) params.append('vendorId', filters.vendorId);
    if (filters?.bankAccountId) params.append('bankAccountId', filters.bankAccountId);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.updatedBy) params.append('updatedBy', filters.updatedBy);
    if (filters?.approvedBy) params.append('approvedBy', filters.approvedBy);
    if (filters?.deleted !== undefined) params.append('deleted', filters.deleted);
    if (filters?.paymentMode) params.append('paymentMode', filters.paymentMode);
    if (filters?.voucherStatus) params.append('voucherStatus', filters.voucherStatus);
    if (filters?.postingStatus) params.append('postingStatus', filters.postingStatus);
    
    if (filters?.paymentModes?.length) {
      filters.paymentModes.forEach(s => params.append('paymentModes', s));
    }
    if (filters?.paymentStatuses?.length) {
      filters.paymentStatuses.forEach(s => params.append('paymentStatuses', s));
    }
    if (filters?.glPostingStatuses?.length) {
      filters.glPostingStatuses.forEach(s => params.append('glPostingStatuses', s));
    }

    if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount);
    if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount);
    if (filters?.voucherDateFrom) params.append('voucherDateFrom', filters.voucherDateFrom);
    if (filters?.voucherDateTo) params.append('voucherDateTo', filters.voucherDateTo);

    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }

    const response = await apiClient.get(`/api/account/payment-vouchers?${params.toString()}`);
    return response.data;
  },

  getPaymentVoucherById: async (id) => {
    const response = await apiClient.get(`/api/account/payment-vouchers/${id}`);
    return response.data?.data || response.data;
  },

  createPaymentVoucher: async (payload) => {
    const response = await apiClient.post(`/api/account/payment-vouchers`, payload);
    return response.data?.data || response.data;
  },

  updatePaymentVoucher: async (id, payload) => {
    const response = await apiClient.put(`/api/account/payment-vouchers/${id}`, payload);
    return response.data?.data || response.data;
  },

  deletePaymentVoucher: async (id) => {
    const response = await apiClient.delete(`/api/account/payment-vouchers/${id}`);
    return response.data?.data || response.data;
  },

  submitPaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/submit`);
    return response.data?.data || response.data;
  },

  approvePaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/approve`);
    return response.data?.data || response.data;
  },

  rejectPaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/reject`);
    return response.data?.data || response.data;
  },

  postPaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/post`);
    return response.data?.data || response.data;
  },

  reversePaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/reverse`);
    return response.data?.data || response.data;
  },

  cancelPaymentVoucher: async (id) => {
    const response = await apiClient.post(`/api/account/payment-vouchers/${id}/cancel`);
    return response.data?.data || response.data;
  }
};
