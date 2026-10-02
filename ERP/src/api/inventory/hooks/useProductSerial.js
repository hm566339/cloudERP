import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { productSerialsApi } from '../productSerials';

/**
 * @fileoverview Product Serials data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of product serials.
 *
 * @param {Object} filter   - Filter fields
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ productSerials, pagination, isLoading, isFetching, error, refetch }}
 */
export function useProductSerialList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    productSerialsApi.getList,
    params,
    options
  );

  // getList returns full response.data: { success, data[], pagination }
  const productSerials = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { productSerials, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product serial by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ productSerial, isLoading, error, refetch }}
 */
export function useProductSerialDetail(id, options = {}) {
  const { data: productSerial, isLoading, error, refetch } = useApiQuery(
    productSerialsApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { productSerial, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product serial.
 */
export function useProductSerialCreate(options = {}) {
  return useApiMutation(productSerialsApi.create, options);
}

/**
 * Update an existing product serial.
 * Call with: mutateAsync([id, payload])
 */
export function useProductSerialUpdate(options = {}) {
  return useApiMutation(productSerialsApi.update, options);
}

/**
 * Delete a product serial (soft delete).
 */
export function useProductSerialDelete(options = {}) {
  return useApiMutation(productSerialsApi.delete, options);
}
