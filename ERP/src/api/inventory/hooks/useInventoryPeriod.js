import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { inventoryPeriodsApi } from '../inventoryPeriods';

/**
 * @fileoverview Inventory Period data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of inventory periods.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ inventoryPeriods, pagination, isLoading, isFetching, error, refetch }}
 */
export function useInventoryPeriodList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    inventoryPeriodsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const inventoryPeriods = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { inventoryPeriods, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single inventory period by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ inventoryPeriod, isLoading, error, refetch }}
 */
export function useInventoryPeriodDetail(id, options = {}) {
  const { data: inventoryPeriod, isLoading, error, refetch } = useApiQuery(
    inventoryPeriodsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { inventoryPeriod, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new inventory period.
 */
export function useInventoryPeriodCreate(options = {}) {
  return useApiMutation(inventoryPeriodsApi.create, options);
}

/**
 * Update an existing inventory period.
 * Call with: mutateAsync([id, payload])
 */
export function useInventoryPeriodUpdate(options = {}) {
  return useApiMutation(inventoryPeriodsApi.update, options);
}

/**
 * Delete an inventory period (soft delete).
 */
export function useInventoryPeriodDelete(options = {}) {
  return useApiMutation(inventoryPeriodsApi.delete, options);
}
