import { useMemo } from 'react';
import { useApiQuery } from '../../../hooks/useApi';
import { stockTransferLinesApi } from '../stockTransferLines';

/**
 * @fileoverview Stock Transfer Line data hooks — Inventory module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// List Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of stock transfer lines.
 *
 * @param {Object} filter   - Filter fields (requires stockTransferId)
 * @param {Object} pageable - { page (0-indexed), size, sort[] }
 * @param {Object} [options] - { skip: boolean }
 * @returns {{ stockTransferLines, pagination, isLoading, isFetching, error, refetch }}
 */
export function useStockTransferLineList(filter = {}, pageable = {}, options = {}) {
  const params = useMemo(() => [filter, pageable], [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filter),
    JSON.stringify(pageable),
  ]);

  const { data: responseData, isLoading, error, refetch, isFetching } = useApiQuery(
    stockTransferLinesApi.getList,
    params,
    {
      ...options,
      enabled: !!filter.stockTransferId && (options.enabled !== false),
    }
  );

  // getList returns full response.data: { success, data[], pagination }
  const stockTransferLines = responseData?.data || (Array.isArray(responseData) ? responseData : []);
  const pagination = responseData?.pagination || null;

  return { stockTransferLines, pagination, isLoading, isFetching, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single stock transfer line by ID.
 *
 * @param {string} id
 * @param {Object} [options]
 * @returns {{ stockTransferLine, isLoading, error, refetch }}
 */
export function useStockTransferLineDetail(id, options = {}) {
  const { data: stockTransferLine, isLoading, error, refetch } = useApiQuery(
    stockTransferLinesApi.getById,
    id,
    {
      ...options,
      enabled: !!id && (options.enabled !== false),
    }
  );

  return { stockTransferLine, isLoading, error, refetch };
}
