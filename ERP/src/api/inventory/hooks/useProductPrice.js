import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productPricesApi } from '../productPrices';

/**
 * @fileoverview Product Prices data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of product prices.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ productPrices, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductPriceList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productPricesApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const productPrices = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { productPrices, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product price by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ productPrice, isLoading, error, refetch }}
 */
export function useProductPriceDetail(id, options = {}) {
  const { data: productPrice, isLoading, error, refetch } = useApiQuery(
    productPricesApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { productPrice, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product price.
 */
export function useProductPriceCreate(options = {}) {
  return useApiMutation(productPricesApi.create, options);
}

/**
 * Update an existing product price.
 * Call with: mutateAsync([id, payload])
 */
export function useProductPriceUpdate(options = {}) {
  return useApiMutation(productPricesApi.update, options);
}

/**
 * Delete a product price (soft delete).
 */
export function useProductPriceDelete(options = {}) {
  return useApiMutation(productPricesApi.delete, options);
}
