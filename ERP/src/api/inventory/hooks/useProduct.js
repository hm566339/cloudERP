import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productsApi } from '../products';

/**
 * @fileoverview Products data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of products.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ products, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const products = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { products, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ product, isLoading, error, refetch }}
 */
export function useProductDetail(id, options = {}) {
  const { data: product, isLoading, error, refetch } = useApiQuery(
    productsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { product, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product.
 */
export function useProductCreate(options = {}) {
  return useApiMutation(productsApi.create, options);
}

/**
 * Update an existing product.
 * Call with: mutateAsync([id, payload])
 */
export function useProductUpdate(options = {}) {
  return useApiMutation(productsApi.update, options);
}

/**
 * Delete a product (soft delete).
 */
export function useProductDelete(options = {}) {
  return useApiMutation(productsApi.delete, options);
}
