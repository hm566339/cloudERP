import React, { useState, useMemo } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, ArrowLeftRight, RefreshCw, SlidersHorizontal, ChevronDown, ChevronUp, Filter, X, RotateCcw
} from 'lucide-react';
import { 
  useStockTransferList, 
  useStockTransferDelete,
  useStockTransferReverse
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import CustomSelect from '../../../components/common/CustomSelect';
import TableRowActions from '../../../components/common/TableRowActions';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';

export default function StockTransferManagement() {
  const navigate = useNavigate();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const dispatch = useAppDispatch();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    page, setPage, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.transferNo && filters.transferNo.trim()) q.transferNo = filters.transferNo.trim();
    if (filters.sourceWarehouseId && filters.sourceWarehouseId.trim()) q.sourceWarehouseId = filters.sourceWarehouseId.trim();
    if (filters.destinationWarehouseId && filters.destinationWarehouseId.trim()) q.destinationWarehouseId = filters.destinationWarehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: `${apiParams.sort},${apiParams.direction}`
  }), [page, apiParams.size, apiParams.sort, apiParams.direction]);

  const { stockTransfers, pagination: pageInfo, isLoading, isFetching, refetch } = useStockTransferList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const deleteMutation = useStockTransferDelete();
  const reverseMutation = useStockTransferReverse();

  const handleCreateNew = () => {
    navigate('new');
  };

  const handleEdit = (id) => {
    navigate(id);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete Stock Transfer',
      message: 'Are you sure you want to delete this stock transfer? This action cannot be undone.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Transfer deleted successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete' }));
      }
    }
  };

  const handleReverse = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Reverse Stock Transfer',
      message: 'Are you sure you want to reverse this stock transfer? This will generate reversing stock movements.',
    });
    if (confirmed) {
      try {
        await reverseMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Transfer reversed successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to reverse transfer' }));
      }
    }
  };

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['transferNo', 'sourceWarehouseId', 'destinationWarehouseId', 'status'];
    return keys.filter(k => filters[k] && String(filters[k]).trim() !== '').length;
  }, [filters]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
          <ArrowLeftRight size={24} className="text-zinc-400" />
          Stock Transfers
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage stock transfers between different warehouses and locations.</p>
      </div>

      <div className="card overflow-hidden">
        {/* Filter Bar Section */}
        <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); refetch(); }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                {/* Quick Search */}
                <div className="flex-1">
                  <ActionableSearchInput
                    value={filters.transferNo || ''}
                    onChange={(val) => { setFilter('transferNo', val); setPage(0); }}
                    placeholder="Search Transfer No..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Status
                  </label>
                  <CustomSelect
                    value={filters.status || ''}
                    onChange={(e) => { setFilter('status', e.target.value); setPage(0); }}
                    className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="RECEIVED">Received</option>
                    <option value="REVERSED">Reversed</option>
                  </CustomSelect>
                </div>
              </div>

              {/* Filter Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95"
                  title="Reset All Filters"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                    showAdvancedFilters || activeAdvancedFilterCount > 0
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  <span>Advanced Filters</span>
                  {activeAdvancedFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                      {activeAdvancedFilterCount}
                    </span>
                  )}
                  {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                  title="Refresh List"
                >
                  <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                </button>
                
                <RequirePermission module="INVENTORY" action="CREATE">
                  <button 
                    type="button"
                    onClick={handleCreateNew} 
                    className="btn-primary flex items-center gap-2 ml-2"
                  >
                    <Plus size={16} /> New Transfer
                  </button>
                </RequirePermission>
              </div>
            </div>
          </form>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter size={13} className="text-zinc-500" />
                    Advanced Filters
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                  >
                    <X size={14} />
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Source WH (ID)</label>
                    <input type="text"
                      value={filters.sourceWarehouseId || ''}
                      onChange={(e) => { setFilter('sourceWarehouseId', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Source WH..."
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Destination WH (ID)</label>
                    <input type="text"
                      value={filters.destinationWarehouseId || ''}
                      onChange={(e) => { setFilter('destinationWarehouseId', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Destination WH..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        <div className="w-full bg-white relative min-h-[160px]">
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : stockTransfers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <ArrowLeftRight size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Stock Transfers</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">There are no transfer records matching your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-16">S.No.</th>
                    <th>Transfer No & Date</th>
                    <th>Source WH</th>
                    <th>Destination WH</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {stockTransfers.map((doc, index) => [
                    <tr key={doc.id} onClick={() => setExpandedRowId(expandedRowId === doc.id ? null : doc.id)} className="cursor-pointer hover:bg-blue-50/30 group transition-colors">
                      <td className="text-zinc-500 font-medium">{typeof page !== 'undefined' && typeof size !== 'undefined' ? (page * size) + index + 1 : index + 1}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-900 text-sm">{doc.transferNo}</span>
                          <span className="text-[8.8px] text-zinc-500">
                            {new Date(doc.transferDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-[9.6px] font-mono text-zinc-600">
                          {doc.sourceWarehouseId ? doc.sourceWarehouseId.substring(0,8) + '...' : '-'}
                        </div>
                      </td>
                      <td>
                        <div className="text-[9.6px] font-mono text-zinc-600">
                          {doc.destinationWarehouseId ? doc.destinationWarehouseId.substring(0,8) + '...' : '-'}
                        </div>
                      </td>
                      <td>
                        {doc.status === 'RECEIVED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-emerald-100 text-emerald-800">
                            RECEIVED
                          </span>
                        ) : doc.status === 'REVERSED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-rose-100 text-rose-800">
                            REVERSED
                          </span>
                        ) : doc.status === 'DISPATCHED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-blue-100 text-blue-800">
                            DISPATCHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-zinc-100 text-zinc-600">
                            {doc.status}
                          </span>
                        )}
                      </td>
                      <td className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/10 transition-colors">
                        <TableRowActions
                          onView={() => navigate(`${window.location.pathname.replace(/\/$/, '')}/${doc?.id}`)}
                          onEdit={(e) => { e.stopPropagation(); handleEdit(doc.id); }}
                          onDelete={(e) => handleDelete(doc.id, e)}
                          additionalActions={
                            doc.status !== 'REVERSED' ? [
                              {
                                label: 'Reverse',
                                onClick: (e) => handleReverse(doc.id, e),
                                icon: <RotateCcw size={14} />,
                                className: 'text-amber-600 hover:bg-amber-50'
                              }
                            ] : []
                          }
                        />
                      </td>
                    </tr>,
                    expandedRowId === doc.id && <ExpandedRowDetails key={`exp-${doc.id}`} data={doc} colSpan={100} />
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && stockTransfers?.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              totalElements={pageInfo.totalElements || stockTransfers.length}
              pageSize={apiParams.size || 10}
            />
          </div>
        )}
      </div>

    
      
    </div>
  );
}