import apiClient from '../common/client';

export const salesInvoiceTaxesApi = {
  getList: async (invoiceId, filters, pageable) => {
    const params = new URLSearchParams();
    
    // Filters
    if (filters?.gstSlabId) params.append('gstSlabId', filters.gstSlabId);
    if (filters?.gstSlabName) params.append('gstSlabName', filters.gstSlabName);
    if (filters?.isDeleted !== undefined) params.append('isDeleted', filters.isDeleted);
    if (filters?.minTaxableAmount !== undefined) params.append('minTaxableAmount', filters.minTaxableAmount);
    if (filters?.maxTaxableAmount !== undefined) params.append('maxTaxableAmount', filters.maxTaxableAmount);
    if (filters?.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters?.createdTo) params.append('createdTo', filters.createdTo);

    // Pageable
    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }

    const response = await apiClient.get(`/api/account/sales/invoices/${invoiceId}/taxes?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getById: async (invoiceId, taxId) => {
    const response = await apiClient.get(`/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`);
    return response.data?.data || response.data;
  },

  create: async (invoiceId, payload) => {
    const response = await apiClient.post(`/api/account/sales/invoices/${invoiceId}/taxes`, { data: payload });
    return response.data?.data || response.data;
  },

  update: async (invoiceId, taxId, payload) => {
    const { id: _, ...payloadWithoutId } = payload;
    const response = await apiClient.put(`/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`, { data: payloadWithoutId });
    return response.data?.data || response.data;
  },

  delete: async (invoiceId, taxId) => {
    const response = await apiClient.delete(`/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`);
    return response.data?.data || response.data;
  }
};
