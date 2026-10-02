import apiClient from '../common/client';

/**
 * @fileoverview Inventory Cost Layer API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const inventoryCostLayersApi = {

  /**
   * List inventory cost layers.
   * GET /api/inventory/inventory-cost-layers
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)            params.append('filter.companyId',            filter.companyId);
    if (filter?.productId)            params.append('filter.productId',            filter.productId);
    if (filter?.warehouseId)          params.append('filter.warehouseId',          filter.warehouseId);
    if (filter?.batchId)              params.append('filter.batchId',              filter.batchId);
    if (filter?.sourceMovementId)     params.append('filter.sourceMovementId',     filter.sourceMovementId);
    if (filter?.sourceMovementLineId) params.append('filter.sourceMovementLineId', filter.sourceMovementLineId);
    
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

    const response = await apiClient.get(`/api/inventory/inventory-cost-layers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single inventory cost layer by ID.
   * GET /api/inventory/inventory-cost-layers/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/inventory-cost-layers/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new inventory cost layer.
   * POST /api/inventory/inventory-cost-layers
   */
  create: async (data) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/inventory-cost-layers', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing inventory cost layer.
   * PUT /api/inventory/inventory-cost-layers/{id}
   */
  update: async ([id, data]) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/inventory-cost-layers/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an inventory cost layer (soft delete).
   * DELETE /api/inventory/inventory-cost-layers/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/inventory-cost-layers/${id}`);
    return response.data?.data || response.data;
  }
};
