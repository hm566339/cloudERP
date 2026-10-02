import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { inventorySnapshotsApi } from '../inventorySnapshots';

/**
 * @fileoverview Inventory Snapshot data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of inventory snapshots.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ inventorySnapshots, pagination, isLoading, isFetching, error, refetch }}
 */
export function useInventorySnapshotList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    inventorySnapshotsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const inventorySnapshots = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { inventorySnapshots, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single inventory snapshot by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ inventorySnapshot, isLoading, error, refetch }}
 */
export function useInventorySnapshotDetail(id, options = {}) {
  const { data: inventorySnapshot, isLoading, error, refetch } = useApiQuery(
    inventorySnapshotsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { inventorySnapshot, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new inventory snapshot.
 */
export function useInventorySnapshotCreate(options = {}) {
  return useApiMutation(inventorySnapshotsApi.create, options);
}

/**
 * Update an existing inventory snapshot.
 * Call with: mutateAsync([id, payload])
 */
export function useInventorySnapshotUpdate(options = {}) {
  return useApiMutation(inventorySnapshotsApi.update, options);
}

/**
 * Delete an inventory snapshot (soft delete).
 */
export function useInventorySnapshotDelete(options = {}) {
  return useApiMutation(inventorySnapshotsApi.delete, options);
}
