import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { openingStocksApi } from '../openingStocks';

/**
 * @fileoverview Opening Stock data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of opening stocks.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ openingStocks, pagination, isLoading, isFetching, error, refetch }}
 */
export function useOpeningStockList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    openingStocksApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const openingStocks = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { openingStocks, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single opening stock by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ openingStock, isLoading, error, refetch }}
 */
export function useOpeningStockDetail(id, options = {}) {
  const { data: openingStock, isLoading, error, refetch } = useApiQuery(
    openingStocksApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { openingStock, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new opening stock.
 */
export function useOpeningStockCreate(options = {}) {
  return useApiMutation(openingStocksApi.create, options);
}

/**
 * Update an existing opening stock.
 * Call with: mutateAsync([id, payload])
 */
export function useOpeningStockUpdate(options = {}) {
  return useApiMutation(openingStocksApi.update, options);
}

/**
 * Delete an opening stock (soft delete).
 */
export function useOpeningStockDelete(options = {}) {
  return useApiMutation(openingStocksApi.delete, options);
}
