import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { inventoryStocksApi } from '../inventoryStocks';

/**
 * @fileoverview Inventory Stock data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of inventory stocks.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ inventoryStocks, pagination, isLoading, isFetching, error, refetch }}
 */
export function useInventoryStockList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    inventoryStocksApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const inventoryStocks = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { inventoryStocks, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single inventory stock by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ inventoryStock, isLoading, error, refetch }}
 */
export function useInventoryStockDetail(id, options = {}) {
  const { data: inventoryStock, isLoading, error, refetch } = useApiQuery(
    inventoryStocksApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { inventoryStock, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new inventory stock.
 */
export function useInventoryStockCreate(options = {}) {
  return useApiMutation(inventoryStocksApi.create, options);
}

/**
 * Update an existing inventory stock.
 * Call with: mutateAsync([id, payload])
 */
export function useInventoryStockUpdate(options = {}) {
  return useApiMutation(inventoryStocksApi.update, options);
}

/**
 * Delete an inventory stock (soft delete).
 */
export function useInventoryStockDelete(options = {}) {
  return useApiMutation(inventoryStocksApi.delete, options);
}
