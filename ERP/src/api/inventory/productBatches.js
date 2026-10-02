import apiClient from '../common/client';

/**
 * @fileoverview Product Batches API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const productBatchesApi = {

  /**
   * List product batches.
   * GET /api/inventory/product-batches
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)   params.append('filter.companyId',   filter.companyId);
    if (filter?.productId)   params.append('filter.productId',   filter.productId.trim());
    if (filter?.batchNumber) params.append('filter.batchNumber', filter.batchNumber.trim());
    if (filter?.supplierId)  params.append('filter.supplierId',  filter.supplierId.trim());
    if (filter?.status)      params.append('filter.status',      filter.status.trim());
    
    if (Array.isArray(filter?.ids) && filter.ids.length > 0) {
      filter.ids.forEach(id => params.append('filter.ids', id));
    }

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/product-batches?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product batch by ID.
   * GET /api/inventory/product-batches/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/product-batches/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product batch.
   * POST /api/inventory/product-batches
   */
  create: async (data) => {
    const fields = {
      productId: data.productId,
      batchNumber: data.batchNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
      supplierId: data.supplierId,
      status: data.status,
    };
    const response = await apiClient.post('/api/inventory/product-batches', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product batch.
   * PUT /api/inventory/product-batches/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      productId: data.productId,
      batchNumber: data.batchNumber,
      manufacturingDate: data.manufacturingDate,
      expiryDate: data.expiryDate,
      supplierId: data.supplierId,
      status: data.status,
    };
    const response = await apiClient.put(`/api/inventory/product-batches/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product batch (soft delete).
   * DELETE /api/inventory/product-batches/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/product-batches/${id}`);
    return response.data?.data || response.data;
  }
};
