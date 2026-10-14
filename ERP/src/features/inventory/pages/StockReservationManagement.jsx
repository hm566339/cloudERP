import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { 
  Plus, Edit2, Trash2, Lock, Unlock, Play, Package, MapPin,
  RefreshCw, SlidersHorizontal, ChevronDown, ChevronUp, Filter, X, RotateCcw
} from 'lucide-react';
import { 
  useStockReservationList, 
  useStockReservationDelete, 
  useStockReservationCreate, 
  useStockReservationUpdate,
  useStockReservationRelease,
  useStockReservationConsume
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import CustomSelect from '../../../components/common/CustomSelect';
import TableRowActions from '../../../components/common/TableRowActions';
import StockReservationForm from '../components/StockReservationForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { getSerialNumber } from '../../../utils/serialNumberHelper';

export default function StockReservationManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // State for Consume Modal
  const [consumeModal, setConsumeModal] = useState({ open: false, id: null, qty: 1 });

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.reservationNo && filters.reservationNo.trim()) q.reservationNo = filters.reservationNo.trim();
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: apiParams.sort || 'createdAt,desc'
  }), [page, apiParams.size, apiParams.sort]);

  const { stockReservations, pagination: pageInfo, isLoading, isFetching, refetch } = useStockReservationList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useStockReservationCreate();
  const updateMutation = useStockReservationUpdate();
  const deleteMutation = useStockReservationDelete();
  const releaseMutation = useStockReservationRelease();
  const consumeMutation = useStockReservationConsume();

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
        dispatch(addAlert({ type: 'success', message: 'Reservation updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Reservation created successfully' }));
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
      title: 'Delete Reservation',
      message: 'Are you sure you want to delete this reservation? The reserved stock will not be automatically released.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Reservation deleted' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete' }));
      }
    }
  };

  const handleRelease = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Release Reservation',
      message: 'Are you sure you want to release the reserved stock back into available inventory?',
    });
    if (confirmed) {
      try {
        await releaseMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Stock released successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to release stock' }));
      }
    }
  };

  const openConsumeModal = (id) => {
    setConsumeModal({ open: true, id, qty: 1 });
  };

  const handleConsumeSubmit = async () => {
    if (consumeModal.qty <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Quantity must be positive' }));
      return;
    }
    try {
      await consumeMutation.mutateAsync({ id: consumeModal.id, quantity: consumeModal.qty });
      dispatch(addAlert({ type: 'success', message: 'Stock consumed successfully' }));
      setConsumeModal({ open: false, id: null, qty: 1 });
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to consume stock' }));
    }
  };

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['reservationNo', 'productId', 'warehouseId', 'status'];
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
          <Lock size={24} className="text-zinc-400" />
          Stock Reservations
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage hard allocations of stock for specific orders or processes.</p>
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
                    value={filters.reservationNo || ''}
                    onChange={(val) => { setFilter('reservationNo', val); setPage(0); }}
                    placeholder="Search Reservation No..."
                  />
                </div>

                <div className="flex-1">
                  <ActionableSearchInput
                    value={filters.productId || ''}
                    onChange={(val) => { setFilter('productId', val); setPage(0); }}
                    placeholder="Search Product ID..."
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
                    <option value="ACTIVE">Active</option>
                    <option value="CONSUMED">Consumed</option>
                    <option value="RELEASED">Released</option>
                    <option value="EXPIRED">Expired</option>
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
                    onClick={handleOpenFormModal} 
                    className="btn-primary flex items-center gap-2 ml-2"
                  >
                    <Plus size={16} /> New Reservation
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data View */}
        <div className="w-full bg-white relative min-h-[160px]">
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : stockReservations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <Lock size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Reservations</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">There are no stock reservations matching your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-16">S.No.</th>
                    <th>Reservation No</th>
                    <th>Product & Location</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="text-right">Qty (Res/Rel)</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {stockReservations.map((res, index) => [
                    <tr key={res.id} onClick={() => setExpandedRowId(expandedRowId === res.id ? null : res.id)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="text-zinc-500 font-medium tabular-nums">
                        {getSerialNumber({ page, pageSize: apiParams.size || pageSize || 10, rowIndex: index, pageBase: 0 })}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-900 text-sm">{res.reservationNo}</span>
                          {res.expiresAt && (
                            <span className="text-[8px] text-rose-500 font-medium tracking-wide">
                              Exp: {new Date(res.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-800 text-[10.4px] flex items-center gap-1.5">
                            <Package size={14} className="text-zinc-400"/> {res.productId ? res.productId.substring(0,8) + '...' : '-'}
                          </span>
                          <span className="text-zinc-500 text-[8.8px] font-mono flex items-center gap-1">
                            <MapPin size={10}/> WH: {res.warehouseId ? res.warehouseId.substring(0,8) : '-'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9.6px] font-bold text-zinc-700">
                            {res.referenceType}
                          </span>
                          <span className="text-[8.8px] text-zinc-500 font-mono">
                            {res.referenceId ? res.referenceId.substring(0,8) + '...' : '-'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {res.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-blue-100 text-blue-800">
                            ACTIVE
                          </span>
                        ) : res.status === 'CONSUMED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-emerald-100 text-emerald-800">
                            CONSUMED
                          </span>
                        ) : res.status === 'RELEASED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-zinc-100 text-zinc-600">
                            RELEASED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.8px] font-bold bg-rose-100 text-rose-800">
                            {res.status}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-zinc-900 text-[10.4px]">{res.reservedQuantity}</span>
                          <span className="text-[8px] text-zinc-400 font-mono">
                            Rel/Con: {res.releasedQuantity}
                          </span>
                        </div>
                      </td>
                      <td className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/10 transition-colors">
                        <div className="flex items-center justify-end gap-1">
                          {res.status === 'ACTIVE' && (
                            <RequirePermission module="INVENTORY" action="EDIT">
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRelease(res.id); }}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Release Reservation"
                                >
                                  <Unlock size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openConsumeModal(res.id); }}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Consume Stock"
                                >
                                  <Play size={16} />
                                </button>
                              </div>
                            </RequirePermission>
                          )}
                          <TableRowActions
                            onView={() => navigate(`${window.location.pathname.replace(/\/$/, '')}/${res?.id}`)}
                          onEdit={() => handleOpenFormModal(res)}
                            onDelete={(e) => handleDelete(res.id, e)}
                          />
                        </div>
                      </td>
                    </tr>,
                    expandedRowId === res.id && <ExpandedRowDetails key={`exp-${res.id}`} data={res} colSpan={100} />
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && stockReservations?.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              totalElements={pageInfo.totalElements || stockReservations.length}
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
                  <Lock size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {initialFormData ? 'Edit Reservation' : 'New Reservation'}
                </h2>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <StockReservationForm
                initialData={initialFormData}
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsFormModalOpen(false)}
                isLoading={createMutation.isLoading || updateMutation.isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Consume Modal */}
      {consumeModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900">Consume Reservation</h3>
              <button onClick={() => setConsumeModal({ open: false, id: null, qty: 1 })} className="text-zinc-400 hover:text-zinc-700"><X size={16}/></button>
            </div>
            <div className="p-5">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Quantity to Consume</label>
              <input 
                type="number" 
                value={consumeModal.qty}
                onChange={(e) => setConsumeModal(prev => ({ ...prev, qty: Number(e.target.value) }))}
                className="w-full h-10 px-3 rounded-md border border-zinc-300 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2">
               <button onClick={() => setConsumeModal({ open: false, id: null, qty: 1 })} className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-200 hover:bg-zinc-100">Cancel</button>
               <button onClick={handleConsumeSubmit} disabled={consumeMutation.isLoading} className="px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2">
                 {consumeMutation.isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14}/>} Consume
               </button>
            </div>
          </div>
        </div>
      )}

    
      
    </div>
  );
}