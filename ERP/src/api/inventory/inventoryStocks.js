import apiClient from '../common/client';

/**
 * @fileoverview Inventory Stock API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const inventoryStocksApi = {

  /**
   * List inventory stocks.
   * GET /api/inventory/inventory-stocks
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)     params.append('filter.companyId',     filter.companyId);
    if (filter?.productId)     params.append('filter.productId',     filter.productId.trim());
    if (filter?.warehouseId)   params.append('filter.warehouseId',   filter.warehouseId.trim());
    if (filter?.locationId)    params.append('filter.locationId',    filter.locationId.trim());
    if (filter?.batchId)       params.append('filter.batchId',       filter.batchId.trim());
    
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

    const response = await apiClient.get(`/api/inventory/inventory-stocks?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single inventory stock by ID.
   * GET /api/inventory/inventory-stocks/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/inventory-stocks/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new inventory stock.
   * POST /api/inventory/inventory-stocks
   */
  create: async (data) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/inventory-stocks', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing inventory stock.
   * PUT /api/inventory/inventory-stocks/{id}
   */
  update: async ([id, data]) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/inventory-stocks/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an inventory stock (soft delete).
   * DELETE /api/inventory/inventory-stocks/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/inventory-stocks/${id}`);
    return response.data?.data || response.data;
  }
};
