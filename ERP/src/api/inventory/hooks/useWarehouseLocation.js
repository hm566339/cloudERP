import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { warehouseLocationsApi } from '../warehouseLocations';

/**
 * @fileoverview Warehouse Location data hooks — Inventory module.
 *
 * Pattern: mirrors useWarehouse.js usage of
 * useApiQuery + useApiMutation from src/hooks/useApi.js.
 *
 * These hooks are thin wrappers that pre-bind the warehouseLocationsApi functions
 * and extract the response envelope so page components get clean data.
 *
 * Envelope shape from backend:
 *   { success, message, data: WarehouseLocation | WarehouseLocation[], errors[], pagination, metadata }
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of warehouse locations.
 *
 * @param {Object} filter   - WarehouseLocationFilter fields (including warehouseId)
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean } — pass skip:true if warehouseId is missing
 * @returns {{ locations, pagination, isLoading, isFetching, error, refetch }}
 */
export function useWarehouseLocationList(filter = {}, pageable = {}, options = {}) {
  // useApiQuery spreads array params: await fn(...[filter, pageable])
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    warehouseLocationsApi.getList,
    params,
    options,
  );

  // getList returns full response.data: { success, data[], pagination } or { success, data: { data[], pagination } }
  const rawLocations = responseData?.data?.data || responseData?.data?.content || responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const locations = Array.isArray(rawLocations) ? rawLocations : [];
  const pagination = responseData?.pagination || responseData?.data?.pagination || null;

  return { locations, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single warehouse location by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ location, isLoading, error, refetch }}
 */
export function useWarehouseLocationDetail(id, options = {}) {
  const { data: location, isLoading, error, refetch } = useApiQuery(
    warehouseLocationsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { location, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new warehouse location.
 */
export function useWarehouseLocationCreate(options = {}) {
  return useApiMutation(warehouseLocationsApi.create, options);
}

/**
 * Update an existing warehouse location.
 * Call with: mutateAsync([id, payload])
 */
export function useWarehouseLocationUpdate(options = {}) {
  return useApiMutation(warehouseLocationsApi.update, options);
}

/**
 * Delete a warehouse location (soft delete).
 */
export function useWarehouseLocationDelete(options = {}) {
  return useApiMutation(warehouseLocationsApi.delete, options);
}
