import apiClient from '../common/client';

export const vendorsApi = {
  getVendors: async (filters, pageable) => {
    const params = new URLSearchParams();

    // Filters
    if (filters?.searchKey) params.append('searchKey', filters.searchKey);
    if (filters?.vendorCode) params.append('vendorCode', filters.vendorCode);
    if (filters?.vendorName) params.append('vendorName', filters.vendorName);
    if (filters?.email) params.append('email', filters.email);
    if (filters?.phone) params.append('phone', filters.phone);
    if (filters?.gstin) params.append('gstin', filters.gstin);
    if (filters?.pan) params.append('pan', filters.pan);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.pinCode) params.append('pinCode', filters.pinCode);
    if (filters?.minCreditLimit !== undefined) params.append('minCreditLimit', filters.minCreditLimit);
    if (filters?.maxCreditLimit !== undefined) params.append('maxCreditLimit', filters.maxCreditLimit);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters?.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters?.createdTo) params.append('createdTo', filters.createdTo);
    if (filters?.updatedFrom) params.append('updatedFrom', filters.updatedFrom);
    if (filters?.updatedTo) params.append('updatedTo', filters.updatedTo);
    if (filters?.ids && filters.ids.length > 0) {
      filters.ids.forEach(id => params.append('ids', id));
    }

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

    const response = await apiClient.get(`/api/account/v1/vendors?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getVendorById: async (id) => {
    const response = await apiClient.get(`/api/account/v1/vendors/${id}`);
    return response.data?.data || response.data;
  },

  createVendor: async (payload) => {
    const response = await apiClient.post(`/api/account/v1/vendors`, { data: payload });
    return response.data?.data || response.data;
  },

  updateVendor: async (data) => {
    const { id, ...payloadWithoutId } = data;
    const response = await apiClient.put(`/api/account/v1/vendors/${id}`, { data: payloadWithoutId });
    return response.data?.data || response.data;
  },

  deleteVendor: async (id) => {
    const response = await apiClient.delete(`/api/account/v1/vendors/${id}`);
    return response.data?.data || response.data;
  },

  activateVendor: async (id) => {
    const response = await apiClient.put(`/api/account/v1/vendors/${id}/activate`);
    return response.data?.data || response.data;
  },

  deactivateVendor: async (id) => {
    const response = await apiClient.put(`/api/account/v1/vendors/${id}/deactivate`);
    return response.data?.data || response.data;
  },

  getVendorTransactions: async (id, filters) => {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    const response = await apiClient.get(`/api/account/v1/vendors/${id}/transactions?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getVendorLedger: async (id, filters) => {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    const response = await apiClient.get(`/api/account/v1/vendors/${id}/ledger?${params.toString()}`);
    return response.data?.data || response.data;
  },

  searchVendors: async (query, pageable) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }
    const response = await apiClient.get(`/api/account/v1/vendors/search?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getActiveVendors: async () => {
    const response = await apiClient.get(`/api/account/v1/vendors/active`);
    return response.data?.data || response.data;
  },

  getVendorByCode: async (vendorCode) => {
    const response = await apiClient.get(`/api/account/v1/vendors/code/${vendorCode}`);
    return response.data?.data || response.data;
  },

  getVendorByGSTIN: async (gstin) => {
    const response = await apiClient.get(`/api/account/v1/vendors/gstin/${gstin}`);
    return response.data?.data || response.data;
  },

  getVendorByPAN: async (pan) => {
    const response = await apiClient.get(`/api/account/v1/vendors/pan/${pan}`);
    return response.data?.data || response.data;
  },

  getVendorsByCity: async (city, pageable) => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }
    const response = await apiClient.get(`/api/account/v1/vendors/city/${city}?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getVendorsByState: async (state, pageable) => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }
    const response = await apiClient.get(`/api/account/v1/vendors/state/${state}?${params.toString()}`);
    return response.data?.data || response.data;
  },

  getVendorsByCountry: async (country, pageable) => {
    const params = new URLSearchParams();
    if (pageable?.page !== undefined) params.append('page', pageable.page);
    if (pageable?.size !== undefined) params.append('size', pageable.size);
    if (pageable?.sort) {
      if (Array.isArray(pageable.sort)) {
        pageable.sort.forEach(s => params.append('sort', s));
      } else {
        params.append('sort', pageable.sort);
      }
    }
    const response = await apiClient.get(`/api/account/v1/vendors/country/${country}?${params.toString()}`);
    return response.data?.data || response.data;
  }
};
