import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { stockAdjustmentsApi } from '../stockAdjustments';

/**
 * @fileoverview Stock Adjustments data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock adjustments.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockAdjustments, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockAdjustmentList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockAdjustmentsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockAdjustments = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockAdjustments, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock adjustment by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockAdjustment, isLoading, error, refetch }}
 */
export function useStockAdjustmentDetail(id, options = {}) {
  const { data: stockAdjustment, isLoading, error, refetch } = useApiQuery(
    stockAdjustmentsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockAdjustment, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new stock adjustment.
 */
export function useStockAdjustmentCreate(options = {}) {
  return useApiMutation(stockAdjustmentsApi.create, options);
}

/**
 * Update an existing stock adjustment.
 * Call with: mutateAsync([id, payload])
 */
export function useStockAdjustmentUpdate(options = {}) {
  return useApiMutation(stockAdjustmentsApi.update, options);
}

/**
 * Delete a stock adjustment (soft delete).
 */
export function useStockAdjustmentDelete(options = {}) {
  return useApiMutation(stockAdjustmentsApi.delete, options);
}
