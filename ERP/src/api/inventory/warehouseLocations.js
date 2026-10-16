import apiClient from '../common/client';

/**
 * @fileoverview Warehouse Location API service — Inventory module.
 *
 * Pattern: matches warehouses.js exactly.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix (Spring @ModelAttribute).
 *   - Pageable fields serialised with pageable. prefix.
 */

export const warehouseLocationsApi = {

  /**
   * List warehouse locations.
   * GET /api/inventory/warehouse-locations
   * @param {Object} filter   - See WarehouseLocationFilter typedef
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields (binds both flat and filter. prefixed)
    if (filter?.companyId)        { params.append('companyId', filter.companyId); params.append('filter.companyId', filter.companyId); }
    if (filter?.searchKey)        { params.append('searchKey', filter.searchKey.trim()); params.append('filter.searchKey', filter.searchKey.trim()); }
    if (filter?.warehouseId)      { params.append('warehouseId', filter.warehouseId); params.append('filter.warehouseId', filter.warehouseId); }
    if (filter?.parentLocationId) { params.append('parentLocationId', filter.parentLocationId); params.append('filter.parentLocationId', filter.parentLocationId); }
    if (filter?.locationCode)     { params.append('locationCode', filter.locationCode.trim()); params.append('filter.locationCode', filter.locationCode.trim()); }
    if (filter?.locationName)     { params.append('locationName', filter.locationName.trim()); params.append('filter.locationName', filter.locationName.trim()); }
    
    if (filter?.isActive !== undefined && filter?.isActive !== '') {
      params.append('isActive', filter.isActive);
      params.append('filter.isActive', filter.isActive);
    }

    if (filter?.createdFrom)   params.append('createdFrom',   filter.createdFrom);
    if (filter?.createdTo)     params.append('createdTo',     filter.createdTo);
    if (filter?.updatedFrom)   params.append('updatedFrom',   filter.updatedFrom);
    if (filter?.updatedTo)     params.append('updatedTo',     filter.updatedTo);
    
    if (Array.isArray(filter?.ids) && filter.ids.length > 0) {
      filter.ids.forEach(id => {
        params.append('ids', id);
        params.append('filter.ids', id);
      });
    }

    // Pageable fields
    if (pageable?.page !== undefined) { params.append('page', pageable.page); params.append('pageable.page', pageable.page); }
    if (pageable?.size !== undefined) { params.append('size', pageable.size); params.append('pageable.size', pageable.size); }
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => {
        params.append('sort', s);
        params.append('pageable.sort', s);
      });
    }

    const response = await apiClient.get(`/api/inventory/warehouse-locations?${params.toString()}`);
    // Return full response.data so caller can access both .data[] and .pagination
    return response.data;
  },

  /**
   * Get single warehouse location by ID.
   * GET /api/inventory/warehouse-locations/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/warehouse-locations/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new warehouse location.
   * POST /api/inventory/warehouse-locations
   * Body: { data: { warehouseId, parentLocationId, locationName, isActive } }
   * locationCode is system-generated — must NOT be sent.
   */
  create: async (data) => {
    // Strip read-only / system fields before sending
    const {
      companyId: _c, id: _id, locationCode: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/warehouse-locations', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing warehouse location.
   * PUT /api/inventory/warehouse-locations/{id}
   * Body: { data: { warehouseId, parentLocationId, locationName, isActive } }
   * locationCode is system-generated — excluded from payload.
   */
  update: async ([id, data]) => {
    const {
      companyId: _c, id: _id, locationCode: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/warehouse-locations/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a warehouse location (soft delete).
   * DELETE /api/inventory/warehouse-locations/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/warehouse-locations/${id}`);
    return response.data?.data || response.data;
  }
};
