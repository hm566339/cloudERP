import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { inventoryValuationsApi } from '../inventoryValuations';

/**
 * @fileoverview Inventory Valuation data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of inventory valuations.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ inventoryValuations, pagination, isLoading, isFetching, error, refetch }}
 */
export function useInventoryValuationList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    inventoryValuationsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const inventoryValuations = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { inventoryValuations, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single inventory valuation by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ inventoryValuation, isLoading, error, refetch }}
 */
export function useInventoryValuationDetail(id, options = {}) {
  const { data: inventoryValuation, isLoading, error, refetch } = useApiQuery(
    inventoryValuationsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { inventoryValuation, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new inventory valuation.
 */
export function useInventoryValuationCreate(options = {}) {
  return useApiMutation(inventoryValuationsApi.create, options);
}

/**
 * Update an existing inventory valuation.
 * Call with: mutateAsync([id, payload])
 */
export function useInventoryValuationUpdate(options = {}) {
  return useApiMutation(inventoryValuationsApi.update, options);
}

/**
 * Delete an inventory valuation (soft delete).
 */
export function useInventoryValuationDelete(options = {}) {
  return useApiMutation(inventoryValuationsApi.delete, options);
}
