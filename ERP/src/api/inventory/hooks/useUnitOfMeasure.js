import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { unitOfMeasuresApi } from '../unitOfMeasures';

/**
 * @fileoverview Unit of Measure data hooks — Inventory module.
 *
 * Pattern: mirrors useWarehouse.js usage of
 * useApiQuery + useApiMutation from src/hooks/useApi.js.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of unit of measures.
 *
 * @param {Object} filter   - UnitOfMeasureFilter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ unitOfMeasures, pagination, isLoading, isFetching, error, refetch }}
 */
export function useUnitOfMeasureList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    unitOfMeasuresApi.getList,
    params,
    options,
  );

  // getList returns full response.data: { success, data[], pagination }
  const unitOfMeasures = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { unitOfMeasures, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single unit of measure by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ unitOfMeasure, isLoading, error, refetch }}
 */
export function useUnitOfMeasureDetail(id, options = {}) {
  const { data: unitOfMeasure, isLoading, error, refetch } = useApiQuery(
    unitOfMeasuresApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { unitOfMeasure, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new unit of measure.
 */
export function useUnitOfMeasureCreate(options = {}) {
  return useApiMutation(unitOfMeasuresApi.create, options);
}

/**
 * Update an existing unit of measure.
 * Call with: mutateAsync([id, payload])
 */
export function useUnitOfMeasureUpdate(options = {}) {
  return useApiMutation(unitOfMeasuresApi.update, options);
}

/**
 * Delete a unit of measure (soft delete).
 */
export function useUnitOfMeasureDelete(options = {}) {
  return useApiMutation(unitOfMeasuresApi.delete, options);
}
