import React, { useState, useMemo } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, SlidersHorizontal, ChevronDown, ChevronUp, Filter, 
  X, RefreshCw, Scale, Search, CheckCircle, AlertCircle, RotateCcw
} from 'lucide-react';
import { useUnitOfMeasureList, useUnitOfMeasureDelete, useUnitOfMeasureCreate, useUnitOfMeasureUpdate } from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import CustomSelect from '../../../components/common/CustomSelect';
import TableRowActions from '../../../components/common/TableRowActions';
import ProductUomForm from '../components/ProductUomForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { getSerialNumber } from '../../../utils/serialNumberHelper';

export default function ProductUomManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'name', defaultSortOrder: 'asc' });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: 'name,asc' // Can make dynamic later
  }), [page, apiParams.size]);

  const { unitOfMeasures, pagination: pageInfo, isLoading, isFetching, refetch } = useUnitOfMeasureList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useUnitOfMeasureCreate();
  const updateMutation = useUnitOfMeasureUpdate();
  const deleteMutation = useUnitOfMeasureDelete();

  const handleOpenFormModal = (initialData = null) => {
    // Prevent synthetic events from being passed as initialData
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
        dispatch(addAlert({ type: 'success', message: 'Unit of Measure updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Unit of Measure created successfully' }));
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
      title: 'Delete Unit of Measure',
      message: 'Are you sure you want to delete this Unit of Measure? This action cannot be undone.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Unit of Measure deleted successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete UoM' }));
      }
    }
  };

  // Active Advanced Filter Count
  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['code', 'name', 'isActive'];
    return keys.filter(k => filters[k] !== undefined && filters[k] !== null && String(filters[k]).trim() !== '').length;
  }, [filters]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    refetch();
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
          <Scale size={24} className="text-zinc-400" />
          Units of Measure
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage units of measure used across your inventory and products.</p>
      </div>

      <div className="card overflow-hidden">
        {/* Filter Bar Section */}
        <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                {/* Quick Search */}
                <div className="flex-1">
                  <ActionableSearchInput
                    value={filters.searchKey || ''}
                    onChange={(val) => { setFilter('searchKey', val); setPage(0); }}
                    placeholder="Search units..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Status
                  </label>
                  <CustomSelect
                    value={filters.isActive !== undefined ? String(filters.isActive) : ''}
                    onChange={(e) => { setFilter('isActive', e.target.value); setPage(0); }}
                    className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
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
                    <Plus size={16} /> Create UOM
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
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Code</label>
                    <input type="text"
                      value={filters.code || ''}
                      onChange={(e) => { setFilter('code', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Code..."
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Name</label>
                    <input type="text"
                      value={filters.name || ''}
                      onChange={(e) => { setFilter('name', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search Name..."
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
            <TableSkeleton columns={4} />
          ) : unitOfMeasures?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <Scale size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Units of Measure found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">Create your first unit of measure to start using inventory measurements.</p>
              <RequirePermission module="INVENTORY" action="CREATE">
                <button onClick={handleOpenFormModal} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Create UOM
                </button>
              </RequirePermission>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-16">S.No.</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Decimal Places</th>
                    <th className="text-center">Status</th>
                    <th>Created At</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {unitOfMeasures.map((uom, index) => [
                    <tr key={uom.id} onClick={() => setExpandedRowId(expandedRowId === uom.id ? null : uom.id)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="text-zinc-500 font-medium tabular-nums">
                        {getSerialNumber({ page, pageSize: apiParams.size || pageSize || 10, rowIndex: index, pageBase: 0 })}
                      </td>
                      <td className="font-mono text-zinc-600">{uom.code || '-'}</td>
                      <td className="font-medium text-zinc-900">{uom.name}</td>
                      <td className="text-zinc-600">{uom.decimalPlaces}</td>
                      <td className="text-center">
                        {uom.isActive ? (
                          <span className="badge badge-success inline-flex items-center gap-1"><CheckCircle size={12} /> Active</span>
                        ) : (
                          <span className="badge badge-error inline-flex items-center gap-1"><AlertCircle size={12} /> Inactive</span>
                        )}
                      </td>
                      <td className="text-zinc-600 text-xs">
                        {uom.createdAt ? new Date(uom.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/10 transition-colors">
                        <TableRowActions
                          onView={() => navigate(`${window.location.pathname.replace(/\/$/, '')}/${uom?.id}`)}
                          onEdit={() => handleOpenFormModal(uom)}
                          onDelete={(e) => handleDelete(uom.id, e)}
                        />
                      </td>
                    </tr>,
                    expandedRowId === uom.id && <ExpandedRowDetails key={`exp-${uom.id}`} data={uom} colSpan={100} />
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && unitOfMeasures?.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              totalElements={pageInfo.totalElements || unitOfMeasures.length}
              pageSize={apiParams.size || 10}
            />
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
                  <Scale size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {initialFormData ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
                </h2>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <ProductUomForm
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
