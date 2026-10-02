import apiClient from '../common/client';

/**
 * @fileoverview Opening Stock API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const openingStocksApi = {

  /**
   * List opening stock headers.
   * GET /api/inventory/opening-stocks
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)      params.append('filter.companyId',      filter.companyId);
    if (filter?.openingStockNo) params.append('filter.openingStockNo', filter.openingStockNo.trim());
    if (filter?.warehouseId)    params.append('filter.warehouseId',    filter.warehouseId.trim());
    if (filter?.status)         params.append('filter.status',         filter.status.trim());
    
    if (filter?.openingDateFrom) params.append('filter.openingDateFrom', filter.openingDateFrom);
    if (filter?.openingDateTo)   params.append('filter.openingDateTo',   filter.openingDateTo);
    
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

    const response = await apiClient.get(`/api/inventory/opening-stocks?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single opening stock document by ID.
   * GET /api/inventory/opening-stocks/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/opening-stocks/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new opening stock document.
   * POST /api/inventory/opening-stocks
   */
  create: async (data) => {
    // We send header + lines
    const fields = {
      openingStockNo: data.openingStockNo,
      openingDate: data.openingDate,
      warehouseId: data.warehouseId,
      status: data.status,
      remarks: data.remarks,
      lines: data.lines || []
    };
    const response = await apiClient.post('/api/inventory/opening-stocks', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing opening stock document.
   * PUT /api/inventory/opening-stocks/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      openingStockNo: data.openingStockNo,
      openingDate: data.openingDate,
      warehouseId: data.warehouseId,
      status: data.status,
      remarks: data.remarks,
      lines: data.lines || []
    };
    const response = await apiClient.put(`/api/inventory/opening-stocks/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an opening stock document (soft delete).
   * DELETE /api/inventory/opening-stocks/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/opening-stocks/${id}`);
    return response.data?.data || response.data;
  }
};
