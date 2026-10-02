import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productBatchesApi } from '../productBatches';

/**
 * @fileoverview Product Batches data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of product batches.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ productBatches, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductBatchList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productBatchesApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const productBatches = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { productBatches, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product batch by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ productBatch, isLoading, error, refetch }}
 */
export function useProductBatchDetail(id, options = {}) {
  const { data: productBatch, isLoading, error, refetch } = useApiQuery(
    productBatchesApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { productBatch, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product batch.
 */
export function useProductBatchCreate(options = {}) {
  return useApiMutation(productBatchesApi.create, options);
}

/**
 * Update an existing product batch.
 * Call with: mutateAsync([id, payload])
 */
export function useProductBatchUpdate(options = {}) {
  return useApiMutation(productBatchesApi.update, options);
}

/**
 * Delete a product batch (soft delete).
 */
export function useProductBatchDelete(options = {}) {
  return useApiMutation(productBatchesApi.delete, options);
}
