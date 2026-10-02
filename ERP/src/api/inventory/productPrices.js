import apiClient from '../common/client';

/**
 * @fileoverview Product Prices API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection and token management.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Supports standard Spring Boot query parameter binding.
 */

export const productPricesApi = {

  /**
   * List product prices.
   * GET /api/inventory/product-prices
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields - append direct and prefixed for robust Spring model binding
    if (filter?.companyId) {
      params.append('companyId', filter.companyId);
      params.append('filter.companyId', filter.companyId);
    }
    if (filter?.productId) {
      params.append('productId', filter.productId);
      params.append('filter.productId', filter.productId);
    }
    if (filter?.priceType) {
      params.append('priceType', filter.priceType);
      params.append('filter.priceType', filter.priceType);
    }
    if (filter?.status) {
      params.append('status', filter.status);
      params.append('filter.status', filter.status);
    }
    if (filter?.currencyCode) {
      params.append('currencyCode', filter.currencyCode);
      params.append('filter.currencyCode', filter.currencyCode);
    }
    if (filter?.searchKey) {
      params.append('searchKey', filter.searchKey.trim());
      params.append('filter.searchKey', filter.searchKey.trim());
    }
    if (filter?.minQuantity !== undefined && filter?.minQuantity !== null && filter?.minQuantity !== '') {
      params.append('minQuantity', filter.minQuantity);
      params.append('filter.minQuantity', filter.minQuantity);
    }
    if (filter?.effectiveFrom) {
      params.append('effectiveFrom', filter.effectiveFrom);
      params.append('filter.effectiveFrom', filter.effectiveFrom);
    }
    if (filter?.effectiveTo) {
      params.append('effectiveTo', filter.effectiveTo);
      params.append('filter.effectiveTo', filter.effectiveTo);
    }

    // Pageable fields
    if (pageable?.page !== undefined) {
      params.append('page', pageable.page);
      params.append('pageable.page', pageable.page);
    }
    if (pageable?.size !== undefined) {
      params.append('size', pageable.size);
      params.append('pageable.size', pageable.size);
    }
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => {
        params.append('sort', s);
        params.append('pageable.sort', s);
      });
    }

    const response = await apiClient.get(`/api/inventory/product-prices?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product price by ID.
   * GET /api/inventory/product-prices/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/product-prices/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product price.
   * POST /api/inventory/product-prices
   */
  create: async (data) => {
    const fields = {
      productId: data.productId,
      priceType: data.priceType,
      price: Number(data.price),
      currencyCode: (data.currencyCode || 'INR').trim().toUpperCase(),
      minQuantity: Number(data.minQuantity !== undefined && data.minQuantity !== '' ? data.minQuantity : 1),
      effectiveFrom: data.effectiveFrom
        ? (data.effectiveFrom.includes('T') ? data.effectiveFrom : `${data.effectiveFrom}T00:00:00`)
        : null,
      effectiveTo: data.effectiveTo
        ? (data.effectiveTo.includes('T') ? data.effectiveTo : `${data.effectiveTo}T23:59:59`)
        : null,
      status: data.status || 'ACTIVE',
    };
    const response = await apiClient.post('/api/inventory/product-prices', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product price.
   * PUT /api/inventory/product-prices/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      productId: data.productId,
      priceType: data.priceType,
      price: Number(data.price),
      currencyCode: (data.currencyCode || 'INR').trim().toUpperCase(),
      minQuantity: Number(data.minQuantity !== undefined && data.minQuantity !== '' ? data.minQuantity : 1),
      effectiveFrom: data.effectiveFrom
        ? (data.effectiveFrom.includes('T') ? data.effectiveFrom : `${data.effectiveFrom}T00:00:00`)
        : null,
      effectiveTo: data.effectiveTo
        ? (data.effectiveTo.includes('T') ? data.effectiveTo : `${data.effectiveTo}T23:59:59`)
        : null,
      status: data.status,
    };
    const response = await apiClient.put(`/api/inventory/product-prices/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product price.
   * DELETE /api/inventory/product-prices/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/product-prices/${id}`);
    return response.data?.data || response.data;
  }
};
