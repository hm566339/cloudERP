import apiClient from '../common/client';

/**
 * @fileoverview Products API service — Inventory module.
 *
 * Pattern: Standard CRUD.
 *   - Uses shared apiClient (Axios) with interceptors for companyId injection.
 *   - Response envelope { success, data, errors, pagination } unwrapped inline.
 *   - Filter fields serialised as flat URLSearchParams with filter. prefix.
 *   - Pageable fields serialised with pageable. prefix.
 */

export const productsApi = {

  /**
   * List products.
   * GET /api/inventory/products
   * @param {Object} filter   - Filter fields
   * @param {Object} pageable - { page (0-indexed), size, sort[] }
   */
  getList: async (filter = {}, pageable = {}) => {
    const params = new URLSearchParams();

    // Filter fields
    if (filter?.companyId) params.append('filter.companyId', filter.companyId);
    if (filter?.searchKey) params.append('filter.searchKey', filter.searchKey.trim());
    if (filter?.sku) params.append('filter.sku', filter.sku.trim());
    if (filter?.productName) params.append('filter.productName', filter.productName.trim());
    if (filter?.productType) params.append('filter.productType', filter.productType);
    if (filter?.categoryId) params.append('filter.categoryId', filter.categoryId);
    if (filter?.status) params.append('filter.status', filter.status);

    // Pageable fields
    if (pageable?.page !== undefined) params.append('pageable.page', pageable.page);
    if (pageable?.size !== undefined) params.append('pageable.size', pageable.size);
    if (pageable?.sort) {
      const sorts = Array.isArray(pageable.sort) ? pageable.sort : [pageable.sort];
      sorts.forEach(s => params.append('pageable.sort', s));
    }

    const response = await apiClient.get(`/api/inventory/products?${params.toString()}`);
    return response.data;
  },

  /**
   * Get stock products for integration.
   * GET /api/inventory/integration/stock/products
   */
  getIntegrationStockProducts: async (paramsObj = {}) => {
    const params = new URLSearchParams();
    if (paramsObj.companyId) params.append('companyId', paramsObj.companyId);
    if (paramsObj.search) params.append('search', paramsObj.search);
    if (paramsObj.productId) params.append('productId', paramsObj.productId);
    if (paramsObj.page !== undefined && paramsObj.page !== null) params.append('page', paramsObj.page);
    if (paramsObj.size !== undefined && paramsObj.size !== null) params.append('size', paramsObj.size);
    const response = await apiClient.get(`/api/inventory/integration/stock/products?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single product by ID.
   * GET /api/inventory/products/{id}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/api/inventory/products/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Create a new product.
   * POST /api/inventory/products
   */
  create: async (data) => {
    const fields = {
      sku: data.sku,
      productName: data.productName,
      productType: data.productType,
      categoryId: data.categoryId,
      baseUomId: data.baseUomId,
      hsnSacId: data.hsnSacId,
      hsnSacCode: data.hsnSacCode,
      hsnSacName: data.hsnSacName,
      barcode: data.barcode,
      alternateBarcode: data.alternateBarcode,
      description: data.description,
      trackingType: data.trackingType,
      valuationMethod: data.valuationMethod,
      standardCost: data.standardCost,
      sellingPrice: data.sellingPrice,
      inventoryAccountId: data.inventoryAccountId,
      cogsAccountId: data.cogsAccountId,
      salesAccountId: data.salesAccountId,
      purchaseAccountId: data.purchaseAccountId,
      status: data.status,
    };
    const response = await apiClient.post('/api/inventory/products', { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Update an existing product.
   * PUT /api/inventory/products/{id}
   */
  update: async ([id, data]) => {
    const fields = {
      sku: data.sku,
      productName: data.productName,
      productType: data.productType,
      categoryId: data.categoryId,
      baseUomId: data.baseUomId,
      hsnSacId: data.hsnSacId,
      hsnSacCode: data.hsnSacCode,
      hsnSacName: data.hsnSacName,
      barcode: data.barcode,
      alternateBarcode: data.alternateBarcode,
      description: data.description,
      trackingType: data.trackingType,
      valuationMethod: data.valuationMethod,
      standardCost: data.standardCost,
      sellingPrice: data.sellingPrice,
      inventoryAccountId: data.inventoryAccountId,
      cogsAccountId: data.cogsAccountId,
      salesAccountId: data.salesAccountId,
      purchaseAccountId: data.purchaseAccountId,
      status: data.status,
    };
    const response = await apiClient.put(`/api/inventory/products/${id}`, { data: fields });
    return response.data?.data || response.data;
  },

  /**
   * Delete a product (soft delete).
   * DELETE /api/inventory/products/{id}
   */
  delete: async (id) => {
    const response = await apiClient.delete(`/api/inventory/products/${id}`);
    return response.data?.data || response.data;
  }
};
