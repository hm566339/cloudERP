import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productUomsApi } from '../productUoms';

/**
 * @fileoverview Product UOMs data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of product UOMs.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ productUoms, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductUomList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productUomsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const productUoms = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { productUoms, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product UOM mapping by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ productUom, isLoading, error, refetch }}
 */
export function useProductUomDetail(id, options = {}) {
  const { data: productUom, isLoading, error, refetch } = useApiQuery(
    productUomsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { productUom, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product UOM mapping.
 */
export function useProductUomCreate(options = {}) {
  return useApiMutation(productUomsApi.create, options);
}

/**
 * Update an existing product UOM mapping.
 * Call with: mutateAsync([id, payload])
 */
export function useProductUomUpdate(options = {}) {
  return useApiMutation(productUomsApi.update, options);
}

/**
 * Delete a product UOM mapping (soft delete).
 */
export function useProductUomDelete(options = {}) {
  return useApiMutation(productUomsApi.delete, options);
}
