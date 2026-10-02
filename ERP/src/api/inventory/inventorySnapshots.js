import apiClient from '../common/client';

/**
 * @fileoverview Inventory Snapshot API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const inventorySnapshotsApi = {

  /**
   * List inventory snapshots.
   * GET /api/inventory/inventory-snapshots
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)     params.append('filter.companyId',     filter.companyId);
    if (filter?.snapshotScope) params.append('filter.snapshotScope', filter.snapshotScope.trim());
    if (filter?.productId)     params.append('filter.productId',     filter.productId.trim());
    if (filter?.warehouseId)   params.append('filter.warehouseId',   filter.warehouseId.trim());
    if (filter?.locationId)    params.append('filter.locationId',    filter.locationId.trim());
    if (filter?.batchId)       params.append('filter.batchId',       filter.batchId.trim());
    
    // Date Filters
    if (filter?.snapshotDateFrom) params.append('filter.snapshotDateFrom', filter.snapshotDateFrom);
    if (filter?.snapshotDateTo)   params.append('filter.snapshotDateTo',   filter.snapshotDateTo);

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

    const response = await apiClient.get(`/api/inventory/inventory-snapshots?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single inventory snapshot by ID.
   * GET /api/inventory/inventory-snapshots/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/inventory-snapshots/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new inventory snapshot.
   * POST /api/inventory/inventory-snapshots
   */
  create: async (data) => {
    // We only send snapshotScope and snapshotDate based on swagger spec.
    const fields = {
      snapshotScope: data.snapshotScope,
      snapshotDate: data.snapshotDate,
    };
    const response = await apiClient.post('/api/inventory/inventory-snapshots', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing inventory snapshot.
   * PUT /api/inventory/inventory-snapshots/{id}
   */
  update: async ([id, data]) => {
    // We only send snapshotScope and snapshotDate based on swagger spec.
    const fields = {
      snapshotScope: data.snapshotScope,
      snapshotDate: data.snapshotDate,
    };
    const response = await apiClient.put(`/api/inventory/inventory-snapshots/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an inventory snapshot (soft delete).
   * DELETE /api/inventory/inventory-snapshots/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/inventory-snapshots/${id}`);
    return response.data?.data || response.data;
  }
};
