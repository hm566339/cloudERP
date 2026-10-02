import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { stockMovementLinesApi } from '../stockMovementLines';

/**
 * @fileoverview Stock Movement Lines data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock movement lines.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockMovementLines, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockMovementLineList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockMovementLinesApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockMovementLines = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockMovementLines, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock movement line by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockMovementLine, isLoading, error, refetch }}
 */
export function useStockMovementLineDetail(id, options = {}) {
  const { data: stockMovementLine, isLoading, error, refetch } = useApiQuery(
    stockMovementLinesApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockMovementLine, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new stock movement line.
 */
export function useStockMovementLineCreate(options = {}) {
  return useApiMutation(stockMovementLinesApi.create, options);
}

/**
 * Update an existing stock movement line.
 * Call with: mutateAsync([id, payload])
 */
export function useStockMovementLineUpdate(options = {}) {
  return useApiMutation(stockMovementLinesApi.update, options);
}

/**
 * Delete a stock movement line (soft delete).
 */
export function useStockMovementLineDelete(options = {}) {
  return useApiMutation(stockMovementLinesApi.delete, options);
}
