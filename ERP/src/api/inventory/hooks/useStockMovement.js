import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { stockMovementsApi } from '../stockMovements';

/**
 * @fileoverview Stock Movements data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock movements (headers).
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockMovements, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockMovementList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockMovementsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockMovements = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockMovements, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock movement by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockMovement, isLoading, error, refetch }}
 */
export function useStockMovementDetail(id, options = {}) {
  const { data: stockMovement, isLoading, error, refetch } = useApiQuery(
    stockMovementsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockMovement, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new stock movement.
 */
export function useStockMovementCreate(options = {}) {
  return useApiMutation(stockMovementsApi.create, options);
}

/**
 * Update an existing stock movement.
 * Call with: mutateAsync([id, payload])
 */
export function useStockMovementUpdate(options = {}) {
  return useApiMutation(stockMovementsApi.update, options);
}

/**
 * Delete a stock movement (soft delete).
 */
export function useStockMovementDelete(options = {}) {
  return useApiMutation(stockMovementsApi.delete, options);
}
