import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { stockTransfersApi } from '../stockTransfers';

/**
 * @fileoverview Stock Transfers data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock transfers (headers).
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockTransfers, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockTransferList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockTransfersApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockTransfers = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockTransfers, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock transfer by ID (includes lines).
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockTransfer, isLoading, error, refetch }}
 */
export function useStockTransferDetail(id, options = {}) {
  const { data: stockTransfer, isLoading, error, refetch } = useApiQuery(
    stockTransfersApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockTransfer, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new stock transfer document.
 */
export function useStockTransferCreate(options = {}) {
  return useApiMutation(stockTransfersApi.create, options);
}

/**
 * Update an existing stock transfer document.
 * Call with: mutateAsync([id, payload])
 */
export function useStockTransferUpdate(options = {}) {
  return useApiMutation(stockTransfersApi.update, options);
}

/**
 * Delete a stock transfer document (soft delete).
 */
export function useStockTransferDelete(options = {}) {
  return useApiMutation(stockTransfersApi.delete, options);
}

/**
 * Reverse a stock transfer document.
 */
export function useStockTransferReverse(options = {}) {
  return useApiMutation(stockTransfersApi.reverse, options);
}
