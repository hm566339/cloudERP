import apiClient from '../common/client';

/**
 * @fileoverview Warehouse API service — Inventory module.
 *
 * Pattern: matches customers.js / vendors.js exactly.
 *   - Uses shared apiClient (Axios) with interceptors.
 *   - companyId injection handled automatically by the request interceptor:
 *       Regular users  → interceptor strips companyId (backend reads from JWT/session)
 *       Super admin    → interceptor injects companyId from localStorage.selected_company
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix (Spring @ModelAttribute).
 *   - Pageable fields serialised with pageable. prefix.
 */

// ─── warehouseType enum values ───────────────────────────────────────────────
// Confirmed from Swagger: "MAIN". Update this list when backend confirms full enum.
export const WAREHOUSE_TYPES = [
  { value: 'MAIN', label: 'Main Warehouse' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'STORE', label: 'Store' },
  { value: 'TRANSIT', label: 'Transit' },
  { value: 'VIRTUAL', label: 'Virtual' }
];

export const warehousesApi = {

  /**
   * List warehouses.
   * GET /api/inventory/warehouses
   * @param {Object} filter   - See WarehouseFilter typedef
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields (Spring binds as filter.xxx via @ModelAttribute)
    if (filter?.companyId)     params.append('filter.companyId',     filter.companyId);
    if (filter?.searchKey)     params.append('filter.searchKey',     filter.searchKey.trim());
    if (filter?.warehouseCode) params.append('filter.warehouseCode', filter.warehouseCode.trim());
    if (filter?.warehouseName) params.append('filter.warehouseName', filter.warehouseName.trim());
    if (filter?.warehouseType) params.append('filter.warehouseType', filter.warehouseType);
    if (filter?.addressLine1)  params.append('filter.addressLine1',  filter.addressLine1.trim());
    if (filter?.addressLine2)  params.append('filter.addressLine2',  filter.addressLine2.trim());
    if (filter?.city)          params.append('filter.city',          filter.city.trim());
    if (filter?.state)         params.append('filter.state',         filter.state.trim());
    if (filter?.country)       params.append('filter.country',       filter.country.trim());
    if (filter?.pinCode)       params.append('filter.pinCode',       filter.pinCode.trim());
    if (filter?.status)        params.append('filter.status',        filter.status);
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

    const response = await apiClient.get(`/api/inventory/warehouses?${params.toString()}`);
    // Return full response.data so caller can access both .data[] and .pagination
    return response.data;
  },

  /**
   * Get single warehouse by ID.
   * GET /api/inventory/warehouses/{id}
   * companyId injected automatically by interceptor.
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/warehouses/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new warehouse.
   * POST /api/inventory/warehouses
   * Body: { data: { warehouseName, warehouseType, addressLine1, ... } }
   * warehouseCode is system-generated — must NOT be sent.
   */
  create: async (data) => {
    // Strip read-only / system fields before sending
    const {
      companyId: _c, id: _id, warehouseCode: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.post('/api/inventory/warehouses', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing warehouse.
   * PUT /api/inventory/warehouses/{id}
   * Body: { data: { warehouseName, warehouseType, ... } }
   * warehouseCode is system-generated — excluded from payload.
   */
  update: async (id, data) => {
    const {
      companyId: _c, id: _id, warehouseCode: _code,
      createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub,
      isDeleted: _del, version: _ver,
      ...fields
    } = data;
    const response = await apiClient.put(`/api/inventory/warehouses/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Soft-delete a warehouse.
   * DELETE /api/inventory/warehouses/{id}
   * companyId injected automatically by interceptor.
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/warehouses/${id}`);
    return response.data?.data || response.data;
  },
};
