import apiClient from '../common/client';

/**
 * @fileoverview Product Categories API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const productCategoriesApi = {

  /**
   * List product categories.
   * GET /api/inventory/product-categories
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId) params.append('filter.companyId', filter.companyId);
    if (filter?.name)      params.append('filter.name',      filter.name.trim());
    if (filter?.code)      params.append('filter.code',      filter.code.trim());
    
    // Convert boolean to string for boolean fields
    if (filter?.isActive !== undefined && filter?.isActive !== '') {
      params.append('filter.isActive', filter.isActive);
    }
    
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

    const response = await apiClient.get(`/api/inventory/product-categories?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product category by ID.
   * GET /api/inventory/product-categories/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/product-categories/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product category.
   * POST /api/inventory/product-categories
   */
  create: async (data) => {
    const fields = {
      parentCategoryId: data.parentCategoryId || null,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    };
    const response = await apiClient.post('/api/inventory/product-categories', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product category.
   * PUT /api/inventory/product-categories/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      parentCategoryId: data.parentCategoryId || null,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    };
    const response = await apiClient.put(`/api/inventory/product-categories/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product category (soft delete).
   * DELETE /api/inventory/product-categories/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/product-categories/${id}`);
    return response.data?.data || response.data;
  }
};
