import apiClient from '../common/client';

/**
 * @fileoverview Stock Movements API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockMovementsApi = {

  /**
   * List stock movements (headers).
   * GET /api/inventory/stock-movements
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)    params.append('filter.companyId', filter.companyId);
    if (filter?.movementNo)   params.append('filter.movementNo', filter.movementNo.trim());
    if (filter?.movementType) params.append('filter.movementType', filter.movementType);
    if (filter?.status)       params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/stock-movements?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single stock movement by ID.
   * GET /api/inventory/stock-movements/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-movements/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new stock movement header.
   * POST /api/inventory/stock-movements
   */
  create: async (data) => {
    const fields = {
      movementNo: data.movementNo,
      movementDate: data.movementDate,
      movementType: data.movementType,
      status: data.status,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks,
      totalQuantity: data.totalQuantity,
      totalValue: data.totalValue,
      postedAt: data.postedAt,
      postedBy: data.postedBy,
      reversedMovementId: data.reversedMovementId,
    };
    const response = await apiClient.post('/api/inventory/stock-movements', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing stock movement header.
   * PUT /api/inventory/stock-movements/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      movementNo: data.movementNo,
      movementDate: data.movementDate,
      movementType: data.movementType,
      status: data.status,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks,
      totalQuantity: data.totalQuantity,
      totalValue: data.totalValue,
      postedAt: data.postedAt,
      postedBy: data.postedBy,
      reversedMovementId: data.reversedMovementId,
    };
    const response = await apiClient.put(`/api/inventory/stock-movements/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a stock movement (soft delete).
   * DELETE /api/inventory/stock-movements/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/stock-movements/${id}`);
    return response.data?.data || response.data;
  }
};
