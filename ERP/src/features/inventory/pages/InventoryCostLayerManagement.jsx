import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { 
  Plus, Edit2, Trash2, SlidersHorizontal, ChevronDown, ChevronUp, Filter, 
  X, RefreshCw, Layers, Search, Package, MapPin, RotateCcw
} from 'lucide-react';
import { 
  useInventoryCostLayerList, 
  useInventoryCostLayerDelete, 
  useInventoryCostLayerCreate, 
  useInventoryCostLayerUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import TableRowActions from '../../../components/common/TableRowActions';
import InventoryCostLayerForm from '../components/InventoryCostLayerForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { getSerialNumber } from '../../../utils/serialNumberHelper';

export default function InventoryCostLayerManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.batchId && filters.batchId.trim()) q.batchId = filters.batchId.trim();
    if (filters.sourceMovementId && filters.sourceMovementId.trim()) q.sourceMovementId = filters.sourceMovementId.trim();
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: 'createdAt,desc'
  }), [page, apiParams.size]);

  const { inventoryCostLayers, pagination: pageInfo, isLoading, isFetching, refetch } = useInventoryCostLayerList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useInventoryCostLayerCreate();
  const updateMutation = useInventoryCostLayerUpdate();
  const deleteMutation = useInventoryCostLayerDelete();

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Cost layer updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Cost layer created successfully' }));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Operation failed' }));
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete Cost Layer',
      message: 'Are you sure you want to delete this cost layer? This may affect inventory valuation.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Cost layer deleted successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete cost layer' }));
      }
    }
  };

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['productId', 'warehouseId', 'batchId', 'sourceMovementId'];
    return keys.filter(k => filters[k] !== undefined && filters[k] !== null && String(filters[k]).trim() !== '').length;
  }, [filters]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
          <Layers size={24} className="text-zinc-400" />
          Inventory Cost Layers
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage valuation buckets, batches, and FIFO/LIFO tracking layers.</p>
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
                    value={filters.productId || ''}
                    onChange={(val) => { setFilter('productId', val); setPage(0); }}
                    placeholder="Search Product ID..."
                  />
                </div>

                <div className="flex-1">
                  <ActionableSearchInput
                    value={filters.batchId || ''}
                    onChange={(val) => { setFilter('batchId', val); setPage(0); }}
                    placeholder="Search Batch ID..."
                  />
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
                    onClick={handleOpenFormModal} 
                    className="btn-primary flex items-center gap-2 ml-2"
                  >
                    <Plus size={16} /> New Layer
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
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Warehouse ID</label>
                    <input type="text"
                      value={filters.warehouseId || ''}
                      onChange={(e) => { setFilter('warehouseId', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Warehouse ID..."
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Movement ID</label>
                    <input type="text"
                      value={filters.sourceMovementId || ''}
                      onChange={(e) => { setFilter('sourceMovementId', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Movement ID..."
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
            <TableSkeleton columns={7} />
          ) : inventoryCostLayers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <Layers size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Cost Layers found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">There are no cost layers matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-16">S.No.</th>
                    <th>Product & Warehouse</th>
                    <th>Batch</th>
                    <th className="text-right">Rcvd Qty</th>
                    <th className="text-right">Rem Qty</th>
                    <th className="text-right">Unit Cost</th>
                    <th className="text-right">Total Cost</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {inventoryCostLayers.map((layer, index) => [
                    <tr key={layer.id} onClick={() => setExpandedRowId(expandedRowId === layer.id ? null : layer.id)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="text-zinc-500 font-medium tabular-nums">{getSerialNumber({ page, pageSize: apiParams.size || pageSize || 10, rowIndex: index, pageBase: 0 })}</td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-zinc-800 flex items-center gap-1.5"><Package size={12}/>{layer.productId || '-'}</span>
                          <span className="text-zinc-500 flex items-center gap-1.5"><MapPin size={12}/>{layer.warehouseId || '-'}</span>
                        </div>
                      </td>
                      <td className="font-mono text-zinc-600 text-xs">{layer.batchId || '-'}</td>
                      <td className="text-right text-zinc-700">{layer.receivedQuantity}</td>
                      <td className="text-right font-medium text-zinc-900">{layer.remainingQuantity}</td>
                      <td className="text-right text-zinc-600">{layer.unitCost ? Number(layer.unitCost).toFixed(2) : '0.00'}</td>
                      <td className="text-right font-semibold text-zinc-900">{layer.totalCost ? Number(layer.totalCost).toFixed(2) : '0.00'}</td>
                      <td className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/10 transition-colors">
                        <TableRowActions
                          onView={() => navigate(`${window.location.pathname.replace(/\/$/, '')}/${layer?.id}`)}
                          onEdit={() => handleOpenFormModal(layer)}
                          onDelete={(e) => handleDelete(layer.id, e)}
                        />
                      </td>
                    </tr>,
                    expandedRowId === layer.id && <ExpandedRowDetails key={`exp-${layer.id}`} data={layer} colSpan={100} />
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && inventoryCostLayers?.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              totalElements={pageInfo.totalElements || inventoryCostLayers.length}
              pageSize={apiParams.size || 10}
            />
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
                  <Layers size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {initialFormData ? 'Edit Cost Layer' : 'Create Cost Layer'}
                </h2>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <InventoryCostLayerForm
                initialData={initialFormData}
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsFormModalOpen(false)}
                isLoading={createMutation.isLoading || updateMutation.isLoading}
              />
            </div>
          </div>
        </div>
      )}
    
      
    </div>
  );
}