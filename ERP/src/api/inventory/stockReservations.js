import apiClient from '../common/client';

/**
 * @fileoverview Stock Reservations API service — Inventory module.
 *
 * Pattern: Standard CRUD with custom action endpoints.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockReservationsApi = {

  /**
   * List stock reservations.
   * GET /api/inventory/stock-reservations
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)     params.append('filter.companyId', filter.companyId);
    if (filter?.reservationNo) params.append('filter.reservationNo', filter.reservationNo.trim());
    if (filter?.productId)     params.append('filter.productId', filter.productId.trim());
    if (filter?.warehouseId)   params.append('filter.warehouseId', filter.warehouseId.trim());
    if (filter?.status)        params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/stock-reservations?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single stock reservation by ID.
   * GET /api/inventory/stock-reservations/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-reservations/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new stock reservation.
   * POST /api/inventory/stock-reservations
   */
  create: async (data) => {
    const fields = {
      reservationNo: data.reservationNo,
      productId: data.productId,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      batchId: data.batchId,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      referenceLineId: data.referenceLineId,
      reservedQuantity: data.reservedQuantity,
      releasedQuantity: data.releasedQuantity,
      status: data.status,
      expiresAt: data.expiresAt,
    };
    const response = await apiClient.post('/api/inventory/stock-reservations', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing stock reservation.
   * PUT /api/inventory/stock-reservations/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      reservationNo: data.reservationNo,
      productId: data.productId,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      batchId: data.batchId,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      referenceLineId: data.referenceLineId,
      reservedQuantity: data.reservedQuantity,
      releasedQuantity: data.releasedQuantity,
      status: data.status,
      expiresAt: data.expiresAt,
    };
    const response = await apiClient.put(`/api/inventory/stock-reservations/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a stock reservation (soft delete).
   * DELETE /api/inventory/stock-reservations/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/stock-reservations/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Release a stock reservation.
   * POST /api/inventory/stock-reservations/{id}/release
   */
  release: async (id) => {
    const response = await apiClient.post(`/api/inventory/stock-reservations/${id}/release`);
    return response.data?.data || response.data;
  },

  /**
   * Consume a stock reservation.
   * POST /api/inventory/stock-reservations/{id}/consume?quantity={qty}
   */
  consume: async ({ id, quantity }) => {
    const params = new URLSearchParams();
    if (quantity !== undefined && quantity !== null) {
      params.append('quantity', quantity);
    }
    const response = await apiClient.post(`/api/inventory/stock-reservations/${id}/consume?${params.toString()}`);
    return response.data?.data || response.data;
  }
};
