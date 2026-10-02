import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { warehousesApi } from '../warehouses';

/**
 * @fileoverview Warehouse data hooks — Inventory module.
 *
 * Pattern: mirrors CustomerManagement / VendorManagement usage of
 * useApiQuery + useApiMutation from src/hooks/useApi.js.
 *
 * These hooks are thin wrappers that pre-bind the warehousesApi functions
 * and extract the response envelope so page components get clean data.
 *
 * Envelope shape from backend:
 *   { success, message, data: Warehouse | Warehouse[], errors[], pagination, metadata }
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of warehouses.
 *
 * @param {Object} filter   - WarehouseFilter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean } — pass skip:true before companyId is ready
 * @returns {{ warehouses, pagination, isLoading, isFetching, error, refetch }}
 *
 * Usage (mirrors CustomerManagement.jsx lines 89-95):
 *   const { warehouses, pagination, isLoading, refetch } =
 *     useWarehouseList(queryFilters, { page, size: pageSize });
 */
export function useWarehouseList(filter = {}, pageable = {}, options = {}) {
  // useApiQuery spreads array params: await fn(...[filter, pageable])
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    warehousesApi.getList,
    params,
    options,
  );

  // getList returns full response.data: { success, data[], pagination }
  const warehouses = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { warehouses, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single warehouse by ID.
 *
 * @param {string} id        - Warehouse UUID
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ warehouse, isLoading, error, refetch }}
 *
 * Usage:
 *   const { warehouse, isLoading } = useWarehouseDetail(id);
 */
export function useWarehouseDetail(id, options = {}) {
  const { data, isLoading, error, refetch } = useApiQuery(
    warehousesApi.getById,
    id,
    { ...options, skip: options.skip || !id },
  );

  // getById returns response.data?.data (unwrapped Warehouse object)
  const warehouse = data?.data || data || null;

  return { warehouse, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create warehouse mutation.
 * Returns [createAsync, { isLoading, error }].
 *
 * Usage (matches CustomerManagement.jsx line 100):
 *   const [createWarehouse, { isLoading: isCreating }] = useWarehouseCreate();
 *   await createWarehouse({ warehouseName: '...', warehouseType: 'MAIN', ... });
 */
export function useWarehouseCreate() {
  return useApiMutation(warehousesApi.create);
}

/**
 * Update warehouse mutation.
 * Returns [updateAsync, { isLoading, error }].
 *
 * Usage:
 *   const [updateWarehouse] = useWarehouseUpdate();
 *   await updateWarehouse(id, { warehouseName: '...', ... });
 *
 * NOTE: useApiMutation passes params as-is. Since update takes (id, data),
 * call it as: updateAsync([id, updatedFields]) — useApiMutation spreads arrays.
 */
export function useWarehouseUpdate() {
  return useApiMutation(warehousesApi.update);
}

/**
 * Delete warehouse mutation.
 * Returns [deleteAsync, { isLoading, error }].
 *
 * Usage:
 *   const [deleteWarehouse] = useWarehouseDelete();
 *   await deleteWarehouse(warehouseId);
 */
export function useWarehouseDelete() {
  return useApiMutation(warehousesApi.delete);
}
