import apiClient from '../common/client';

/**
 * @fileoverview Stock Transfers API service — Inventory module.
 *
 * Pattern: Header-Detail Document CRUD with custom action endpoints.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockTransfersApi = {

  /**
   * List stock transfers (headers).
   * GET /api/inventory/stock-transfers
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)              params.append('filter.companyId', filter.companyId);
    if (filter?.transferNo)             params.append('filter.transferNo', filter.transferNo.trim());
    if (filter?.sourceWarehouseId)      params.append('filter.sourceWarehouseId', filter.sourceWarehouseId.trim());
    if (filter?.destinationWarehouseId) params.append('filter.destinationWarehouseId', filter.destinationWarehouseId.trim());
    if (filter?.status)                 params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/stock-transfers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single stock transfer (header + lines) by ID.
   * GET /api/inventory/stock-transfers/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-transfers/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new stock transfer document.
   * POST /api/inventory/stock-transfers
   */
  create: async (data) => {
    const fields = {
      transferNo: data.transferNo,
      transferDate: data.transferDate,
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      status: data.status,
      stockMovementId: data.stockMovementId,
      remarks: data.remarks,
      initiatedBy: data.initiatedBy,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      dispatchedAt: data.dispatchedAt,
      receivedAt: data.receivedAt,
      lines: data.lines || [],
    };
    const response = await apiClient.post('/api/inventory/stock-transfers', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing stock transfer document.
   * PUT /api/inventory/stock-transfers/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      transferNo: data.transferNo,
      transferDate: data.transferDate,
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      status: data.status,
      stockMovementId: data.stockMovementId,
      remarks: data.remarks,
      initiatedBy: data.initiatedBy,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      dispatchedAt: data.dispatchedAt,
      receivedAt: data.receivedAt,
      lines: data.lines || [],
    };
    const response = await apiClient.put(`/api/inventory/stock-transfers/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a stock transfer document (soft delete).
   * DELETE /api/inventory/stock-transfers/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/stock-transfers/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Reverse a stock transfer document.
   * POST /api/inventory/stock-transfers/{id}/reverse
   */
  reverse: async (id) => {
    const response = await apiClient.post(`/api/inventory/stock-transfers/${id}/reverse`);
    return response.data?.data || response.data;
  }
};
