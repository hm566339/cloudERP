import apiClient from '../common/client';

/**
 * @fileoverview Stock Adjustments API service — Inventory module.
 *
 * Pattern: Header-Detail transactional CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockAdjustmentsApi = {

  /**
   * List stock adjustments.
   * GET /api/inventory/stock-adjustments
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)    params.append('filter.companyId', filter.companyId);
    if (filter?.adjustmentNo) params.append('filter.adjustmentNo', filter.adjustmentNo.trim());
    if (filter?.warehouseId)  params.append('filter.warehouseId', filter.warehouseId);
    if (filter?.status)       params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/stock-adjustments?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single stock adjustment by ID (including lines).
   * GET /api/inventory/stock-adjustments/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-adjustments/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new stock adjustment.
   * POST /api/inventory/stock-adjustments
   */
  create: async (data) => {
    const fields = {
      adjustmentNo: data.adjustmentNo,
      adjustmentDate: data.adjustmentDate,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      reason: data.reason,
      remarks: data.remarks,
      status: data.status,
      stockMovementId: data.stockMovementId,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      lines: data.lines?.map(line => ({
        stockAdjustmentId: line.stockAdjustmentId,
        productId: line.productId,
        batchId: line.batchId,
        serialId: line.serialId,
        adjustmentType: line.adjustmentType,
        quantity: line.quantity,
        unitCost: line.unitCost,
        adjustmentValue: line.adjustmentValue
      })) || [],
    };
    const response = await apiClient.post('/api/inventory/stock-adjustments', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing stock adjustment.
   * PUT /api/inventory/stock-adjustments/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      adjustmentNo: data.adjustmentNo,
      adjustmentDate: data.adjustmentDate,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      reason: data.reason,
      remarks: data.remarks,
      status: data.status,
      stockMovementId: data.stockMovementId,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      lines: data.lines?.map(line => ({
        stockAdjustmentId: line.stockAdjustmentId,
        productId: line.productId,
        batchId: line.batchId,
        serialId: line.serialId,
        adjustmentType: line.adjustmentType,
        quantity: line.quantity,
        unitCost: line.unitCost,
        adjustmentValue: line.adjustmentValue
      })) || [],
    };
    const response = await apiClient.put(`/api/inventory/stock-adjustments/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a stock adjustment (soft delete).
   * DELETE /api/inventory/stock-adjustments/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/stock-adjustments/${id}`);
    return response.data?.data || response.data;
  }
};
