import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { inventoryCostLayersApi } from '../inventoryCostLayers';

/**
 * @fileoverview Inventory Cost Layer data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of inventory cost layers.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ inventoryCostLayers, pagination, isLoading, isFetching, error, refetch }}
 */
export function useInventoryCostLayerList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    inventoryCostLayersApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const inventoryCostLayers = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { inventoryCostLayers, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single inventory cost layer by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ inventoryCostLayer, isLoading, error, refetch }}
 */
export function useInventoryCostLayerDetail(id, options = {}) {
  const { data: inventoryCostLayer, isLoading, error, refetch } = useApiQuery(
    inventoryCostLayersApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { inventoryCostLayer, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new inventory cost layer.
 */
export function useInventoryCostLayerCreate(options = {}) {
  return useApiMutation(inventoryCostLayersApi.create, options);
}

/**
 * Update an existing inventory cost layer.
 * Call with: mutateAsync([id, payload])
 */
export function useInventoryCostLayerUpdate(options = {}) {
  return useApiMutation(inventoryCostLayersApi.update, options);
}

/**
 * Delete an inventory cost layer (soft delete).
 */
export function useInventoryCostLayerDelete(options = {}) {
  return useApiMutation(inventoryCostLayersApi.delete, options);
}
