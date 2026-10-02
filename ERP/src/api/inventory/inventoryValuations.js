import apiClient from '../common/client';

/**
 * @fileoverview Inventory Valuation API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const inventoryValuationsApi = {

  /**
   * List inventory valuations.
   * GET /api/inventory/inventory-valuations
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)       params.append('filter.companyId',       filter.companyId);
    if (filter?.productId)       params.append('filter.productId',       filter.productId.trim());
    if (filter?.warehouseId)     params.append('filter.warehouseId',     filter.warehouseId.trim());
    if (filter?.locationId)      params.append('filter.locationId',      filter.locationId.trim());
    if (filter?.batchId)         params.append('filter.batchId',         filter.batchId.trim());
    if (filter?.stockMovementId) params.append('filter.stockMovementId', filter.stockMovementId.trim());
    if (filter?.glJournalEntryId) params.append('filter.glJournalEntryId', filter.glJournalEntryId.trim());
    if (filter?.valuationDateFrom) params.append('filter.valuationDateFrom', filter.valuationDateFrom);
    if (filter?.valuationDateTo)   params.append('filter.valuationDateTo',   filter.valuationDateTo);
    
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

    const response = await apiClient.get(`/api/inventory/inventory-valuations?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single inventory valuation by ID.
   * GET /api/inventory/inventory-valuations/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/inventory-valuations/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new inventory valuation.
   * POST /api/inventory/inventory-valuations
   */
  create: async (data) => {
    // Only send the fields defined in the swagger spec for Create/Update payload
    const fields = {
      stockMovementId: data.stockMovementId,
      stockMovementLineId: data.stockMovementLineId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      batchId: data.batchId,
      valuationDate: data.valuationDate,
    };
    const response = await apiClient.post('/api/inventory/inventory-valuations', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing inventory valuation.
   * PUT /api/inventory/inventory-valuations/{id}
   */
  update: async ([id, data]) => {
    // Only send the fields defined in the swagger spec for Create/Update payload
    const fields = {
      stockMovementId: data.stockMovementId,
      stockMovementLineId: data.stockMovementLineId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      batchId: data.batchId,
      valuationDate: data.valuationDate,
    };
    const response = await apiClient.put(`/api/inventory/inventory-valuations/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an inventory valuation (soft delete).
   * DELETE /api/inventory/inventory-valuations/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/inventory-valuations/${id}`);
    return response.data?.data || response.data;
  }
};
