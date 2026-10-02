import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productCategoriesApi } from '../productCategories';

/**
 * @fileoverview Product Categories data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of product categories.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ productCategories, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductCategoryList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productCategoriesApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const productCategories = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { productCategories, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product category by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ productCategory, isLoading, error, refetch }}
 */
export function useProductCategoryDetail(id, options = {}) {
  const { data: productCategory, isLoading, error, refetch } = useApiQuery(
    productCategoriesApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { productCategory, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product category.
 */
export function useProductCategoryCreate(options = {}) {
  return useApiMutation(productCategoriesApi.create, options);
}

/**
 * Update an existing product category.
 * Call with: mutateAsync([id, payload])
 */
export function useProductCategoryUpdate(options = {}) {
  return useApiMutation(productCategoriesApi.update, options);
}

/**
 * Delete a product category (soft delete).
 */
export function useProductCategoryDelete(options = {}) {
  return useApiMutation(productCategoriesApi.delete, options);
}
