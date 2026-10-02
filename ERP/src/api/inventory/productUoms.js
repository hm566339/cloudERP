import apiClient from '../common/client';

/**
 * @fileoverview Product UOMs API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const productUomsApi = {

  /**
   * List product UOM mappings.
   * GET /api/inventory/product-uoms
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId) params.append('filter.companyId', filter.companyId);
    if (filter?.productId) params.append('filter.productId', filter.productId);
    if (filter?.uomId)     params.append('filter.uomId',     filter.uomId);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/product-uoms?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product UOM mapping by ID.
   * GET /api/inventory/product-uoms/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/product-uoms/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product UOM mapping.
   * POST /api/inventory/product-uoms
   */
  create: async (data) => {
    const fields = {
      productId: data.productId,
      uomId: data.uomId,
      conversionFactor: data.conversionFactor,
      isPurchaseUom: data.isPurchaseUom ?? false,
      isSalesUom: data.isSalesUom ?? false,
      isStockUom: data.isStockUom ?? false,
    };
    const response = await apiClient.post('/api/inventory/product-uoms', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product UOM mapping.
   * PUT /api/inventory/product-uoms/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      productId: data.productId,
      uomId: data.uomId,
      conversionFactor: data.conversionFactor,
      isPurchaseUom: data.isPurchaseUom ?? false,
      isSalesUom: data.isSalesUom ?? false,
      isStockUom: data.isStockUom ?? false,
    };
    const response = await apiClient.put(`/api/inventory/product-uoms/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product UOM mapping (soft delete).
   * DELETE /api/inventory/product-uoms/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/product-uoms/${id}`);
    return response.data?.data || response.data;
  }
};
