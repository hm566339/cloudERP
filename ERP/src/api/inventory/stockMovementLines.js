import apiClient from '../common/client';

/**
 * @fileoverview Stock Movement Lines API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockMovementLinesApi = {

  /**
   * List stock movement lines.
   * GET /api/inventory/stock-movement-lines
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)       params.append('filter.companyId', filter.companyId);
    if (filter?.stockMovementId) params.append('filter.stockMovementId', filter.stockMovementId.trim());
    if (filter?.productId)       params.append('filter.productId', filter.productId.trim());
    if (filter?.sourceWarehouseId) params.append('filter.sourceWarehouseId', filter.sourceWarehouseId.trim());

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/stock-movement-lines?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single stock movement line by ID.
   * GET /api/inventory/stock-movement-lines/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-movement-lines/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new stock movement line.
   * POST /api/inventory/stock-movement-lines
   */
  create: async (data) => {
    const fields = {
      stockMovementId: data.stockMovementId,
      productId: data.productId,
      sourceWarehouseId: data.sourceWarehouseId,
      sourceLocationId: data.sourceLocationId,
      destinationWarehouseId: data.destinationWarehouseId,
      destinationLocationId: data.destinationLocationId,
      batchId: data.batchId,
      serialId: data.serialId,
      uomId: data.uomId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalCost: data.totalCost,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      referenceLineId: data.referenceLineId,
    };
    const response = await apiClient.post('/api/inventory/stock-movement-lines', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing stock movement line.
   * PUT /api/inventory/stock-movement-lines/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      stockMovementId: data.stockMovementId,
      productId: data.productId,
      sourceWarehouseId: data.sourceWarehouseId,
      sourceLocationId: data.sourceLocationId,
      destinationWarehouseId: data.destinationWarehouseId,
      destinationLocationId: data.destinationLocationId,
      batchId: data.batchId,
      serialId: data.serialId,
      uomId: data.uomId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalCost: data.totalCost,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      referenceLineId: data.referenceLineId,
    };
    const response = await apiClient.put(`/api/inventory/stock-movement-lines/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a stock movement line (soft delete).
   * DELETE /api/inventory/stock-movement-lines/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/stock-movement-lines/${id}`);
    return response.data?.data || response.data;
  }
};
