import React, { useMemo } from 'react';
import { RefreshCw, LayoutList, Package, Box } from 'lucide-react';
import { useStockTransferLineList } from '../../../api/inventory';
import Pagination from '../../../components/common/Pagination';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';

export default function StockTransferLinesManagement({ stockTransferId }) {
  const {
    page, setPage, setPageSize, apiParams,
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const finalParams = useMemo(() => ({
    stockTransferId
  }), [stockTransferId]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: 'createdAt,desc'
  }), [page, apiParams.size]);

  const { stockTransferLines, pagination: pageInfo, isLoading, isFetching, refetch } = useStockTransferLineList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
          <LayoutList size={16} className="text-zinc-500" />
          Transfer Lines
        </h3>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-8 px-3 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95 gap-1.5"
          disabled={isFetching}
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="w-full bg-white relative min-h-[160px]">
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : stockTransferLines?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-t border-zinc-100">
              <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3 border border-zinc-100">
                <Box size={20} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Lines Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm">There are no stock transfer lines associated with this transfer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-zinc-100">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Batch ID</th>
                    <th>UoM ID</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {stockTransferLines.map((line) => (
                    <tr key={line.id}>
                      <td className="font-medium text-zinc-900 flex items-center gap-2">
                        <Package size={14} className="text-zinc-400" />
                        {line.productId || '-'}
                      </td>
                      <td className="font-mono text-xs text-zinc-600">{line.batchId || '-'}</td>
                      <td className="text-zinc-600">{line.uomId || '-'}</td>
                      <td className="text-right font-semibold text-zinc-900">{line.quantity}</td>
                      <td className="text-right font-mono text-zinc-600">
                        {line.unitCost ? Number(line.unitCost).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && stockTransferLines?.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={pageInfo.totalPages || 1}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            totalElements={pageInfo.totalElements || stockTransferLines.length}
            pageSize={apiParams.size || 10}
          />
        )}
      </div>
    </div>
  );
}
