import apiClient from '../common/client';

/**
 * @fileoverview Product Serials API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const productSerialsApi = {

  /**
   * List product serials.
   * GET /api/inventory/product-serials
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)    params.append('filter.companyId', filter.companyId);
    if (filter?.productId)    params.append('filter.productId', filter.productId);
    if (filter?.batchId)      params.append('filter.batchId', filter.batchId);
    if (filter?.serialNumber) params.append('filter.serialNumber', filter.serialNumber.trim());
    if (filter?.status)       params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/product-serials?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product serial by ID.
   * GET /api/inventory/product-serials/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/product-serials/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product serial.
   * POST /api/inventory/product-serials
   */
  create: async (data) => {
    const fields = {
      productId: data.productId,
      batchId: data.batchId,
      serialNumber: data.serialNumber,
      status: data.status,
      purchaseDate: data.purchaseDate,
      warrantyStartDate: data.warrantyStartDate,
      warrantyEndDate: data.warrantyEndDate,
    };
    const response = await apiClient.post('/api/inventory/product-serials', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product serial.
   * PUT /api/inventory/product-serials/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      productId: data.productId,
      batchId: data.batchId,
      serialNumber: data.serialNumber,
      status: data.status,
      purchaseDate: data.purchaseDate,
      warrantyStartDate: data.warrantyStartDate,
      warrantyEndDate: data.warrantyEndDate,
    };
    const response = await apiClient.put(`/api/inventory/product-serials/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product serial (soft delete).
   * DELETE /api/inventory/product-serials/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/product-serials/${id}`);
    return response.data?.data || response.data;
  }
};
