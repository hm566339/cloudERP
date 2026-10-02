import apiClient from '../common/client';

/**
 * @fileoverview Stock Transfer Line API service — Inventory module.
 *
 * Pattern: Read-Only Data Grid.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const stockTransferLinesApi = {

  /**
   * List stock transfer lines.
   * GET /api/inventory/stock-transfer-lines
   * @param {Object} filter   - Filter fields (e.g. stockTransferId)
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)             params.append('filter.companyId',             filter.companyId);
    if (filter?.stockTransferId)       params.append('filter.stockTransferId',       filter.stockTransferId);
    if (filter?.productId)             params.append('filter.productId',             filter.productId);
    if (filter?.batchId)               params.append('filter.batchId',               filter.batchId);
    if (filter?.sourceLocationId)      params.append('filter.sourceLocationId',      filter.sourceLocationId);
    if (filter?.destinationLocationId) params.append('filter.destinationLocationId', filter.destinationLocationId);
    
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

    const response = await apiClient.get(`/api/inventory/stock-transfer-lines?${params.toString()}`);
    // Return full response.data so caller can access both .data[] and .pagination
    return response.data;
  },

  /**
   * Get single stock transfer line by ID.
   * GET /api/inventory/stock-transfer-lines/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/stock-transfer-lines/${id}`);
    return response.data?.data || response.data;
  }
};
