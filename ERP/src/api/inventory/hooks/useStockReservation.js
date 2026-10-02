import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { stockReservationsApi } from '../stockReservations';

/**
 * @fileoverview Stock Reservations data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock reservations.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockReservations, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockReservationList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockReservationsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockReservations = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockReservations, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock reservation by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockReservation, isLoading, error, refetch }}
 */
export function useStockReservationDetail(id, options = {}) {
  const { data: stockReservation, isLoading, error, refetch } = useApiQuery(
    stockReservationsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockReservation, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new stock reservation.
 */
export function useStockReservationCreate(options = {}) {
  return useApiMutation(stockReservationsApi.create, options);
}

/**
 * Update an existing stock reservation.
 * Call with: mutateAsync([id, payload])
 */
export function useStockReservationUpdate(options = {}) {
  return useApiMutation(stockReservationsApi.update, options);
}

/**
 * Delete a stock reservation (soft delete).
 */
export function useStockReservationDelete(options = {}) {
  return useApiMutation(stockReservationsApi.delete, options);
}

/**
 * Release a stock reservation.
 */
export function useStockReservationRelease(options = {}) {
  return useApiMutation(stockReservationsApi.release, options);
}

/**
 * Consume a stock reservation.
 * Call with: mutateAsync({ id, quantity })
 */
export function useStockReservationConsume(options = {}) {
  return useApiMutation(stockReservationsApi.consume, options);
}
