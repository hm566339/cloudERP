import apiClient from '../common/client';

/**
 * @fileoverview Unit of Measure API service — Inventory module.
 *
 * Pattern: matches warehouses.js exactly.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix (Spring @ModelAttribute).
 *   - Pageable fields serialised with pageable. prefix.
 */

export const unitOfMeasuresApi = {

  /**
   * List unit of measures.
   * GET /api/inventory/unit-of-measures
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields (Spring binds as filter.xxx via @ModelAttribute)
    if (filter?.companyId)     params.append('filter.companyId',     filter.companyId);
    if (filter?.searchKey)     params.append('filter.searchKey',     filter.searchKey.trim());
    if (filter?.code)          params.append('filter.code',          filter.code.trim());
    if (filter?.name)          params.append('filter.name',          filter.name.trim());
    
    if (filter?.isActive !== undefined && filter?.isActive !== '') {
      params.append('filter.isActive', filter.isActive);
    }

    if (filter?.createdFrom)   params.append('filter.createdFrom',   filter.createdFrom);
    if (filter?.createdTo)     params.append('filter.createdTo',     filter.createdTo);
    if (filter?.updatedFrom)   params.append('filter.updatedFrom',   filter.updatedFrom);
    if (filter?.updatedTo)     params.append('filter.updatedTo',     filter.updatedTo);
    
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

    const response = await apiClient.get(`/api/inventory/unit-of-measures?${params.toString()}`);
    // Return full response.data so caller can access both .data[] and .pagination
    return response.data;
  },

  /**
   * Get single unit of measure by ID.
   * GET /api/inventory/unit-of-measures/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/unit-of-measures/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new unit of measure.
   * POST /api/inventory/unit-of-measures
   * Body: { data: { name, decimalPlaces, isActive } }
   * code is system-generated — must NOT be sent.
   */
  create: async (data) => {
    // Strip read-only / system fields before sending
    const {
      companyId: _c, id: _id, code: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/unit-of-measures', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing unit of measure.
   * PUT /api/inventory/unit-of-measures/{id}
   * Body: { data: { name, decimalPlaces, isActive } }
   */
  update: async ([id, data]) => {
    const {
      companyId: _c, id: _id, code: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/unit-of-measures/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a unit of measure (soft delete).
   * DELETE /api/inventory/unit-of-measures/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/unit-of-measures/${id}`);
    return response.data?.data || response.data;
  }
};
