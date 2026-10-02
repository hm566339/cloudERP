import apiClient from '../common/client';

/**
 * @fileoverview Inventory Period API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const inventoryPeriodsApi = {

  /**
   * List inventory periods.
   * GET /api/inventory/inventory-periods
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId)     params.append('filter.companyId',     filter.companyId);
    if (filter?.periodName)    params.append('filter.periodName',    filter.periodName.trim());
    if (filter?.status)        params.append('filter.status',        filter.status.trim());
    
    if (filter?.startDateFrom) params.append('filter.startDateFrom', filter.startDateFrom);
    if (filter?.startDateTo)   params.append('filter.startDateTo',   filter.startDateTo);
    if (filter?.endDateFrom)   params.append('filter.endDateFrom',   filter.endDateFrom);
    if (filter?.endDateTo)     params.append('filter.endDateTo',     filter.endDateTo);

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

    const response = await apiClient.get(`/api/inventory/inventory-periods?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single inventory period by ID.
   * GET /api/inventory/inventory-periods/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/inventory-periods/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new inventory period.
   * POST /api/inventory/inventory-periods
   */
  create: async (data) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      closedAt: _cla, closedBy: _clb, // System populated on close
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/inventory-periods', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing inventory period.
   * PUT /api/inventory/inventory-periods/{id}
   */
  update: async ([id, data]) => {
    const {
      companyId: _c, id: _id,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      closedAt: _cla, closedBy: _clb,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/inventory-periods/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete an inventory period (soft delete).
   * DELETE /api/inventory/inventory-periods/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/inventory-periods/${id}`);
    return response.data?.data || response.data;
  }
};
