import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { 
  Plus, Edit2, Trash2, FolderTree, Tag, Check, X as XIcon,
  RefreshCw, SlidersHorizontal, ChevronDown, ChevronUp, Filter, RotateCcw
} from 'lucide-react';
import { 
  useProductCategoryList, 
  useProductCategoryDelete, 
  useProductCategoryCreate, 
  useProductCategoryUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import CustomSelect from '../../../components/common/CustomSelect';
import TableRowActions from '../../../components/common/TableRowActions';
import ProductCategoryForm from '../components/ProductCategoryForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';

export default function ProductCategoryManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    page, setPage, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'name', defaultSortOrder: 'asc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.isActive !== undefined && filters.isActive !== '') q.isActive = filters.isActive;
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: apiParams.sort || 'name,asc'
  }), [page, apiParams.size, apiParams.sort]);

  const { productCategories, pagination: pageInfo, isLoading, isFetching, refetch } = useProductCategoryList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useProductCategoryCreate();
  const updateMutation = useProductCategoryUpdate();
  const deleteMutation = useProductCategoryDelete();

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const authUser = JSON.parse(localStorage.getItem('auth_user')) || {};
  const isSystemAdmin = authUser?.roles?.includes('ROLE_SYSTEM_ADMIN') || authUser?.roles?.includes('ROLE_SUPER_ADMIN') || authUser?.role === 'SYSTEM_ADMIN';
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || authUser?.companyCode;

  const handleCreateSubmit = async (payload) => {
    try {
      if (isSystemAdmin) {
        payload.companyId = companyId;
      }
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Category updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Category created successfully' }));
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
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Ensure no products are currently assigned to it.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Category deleted' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete category' }));
      }
    }
  };

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['name', 'code', 'isActive'];
    return keys.filter(k => filters[k] !== undefined && filters[k] !== '').length;
  }, [filters]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
          <FolderTree size={24} className="text-zinc-400" />
          Product Categories
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Organize products into hierarchical groups.</p>
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
                    value={filters.name || ''}
                    onChange={(val) => { setFilter('name', val); setPage(0); }}
                    placeholder="Search Categories..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Status
                  </label>
                  <CustomSelect
                    value={filters.isActive !== undefined ? filters.isActive : ''}
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
                    <Plus size={16} /> New Category
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
                    <XIcon size={14} />
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-500 mb-1 block">Category Code</label>
                    <input type="text"
                      value={filters.code || ''}
                      onChange={(e) => { setFilter('code', e.target.value); setPage(0); }}
                      className="input-field w-full text-xs"
                      placeholder="Search code..."
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
            <TableSkeleton columns={5} />
          ) : productCategories?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <FolderTree size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No Categories found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">There are no product categories matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-16">S.No.</th>
                    <th>Category Name</th>
                    <th>Code</th>
                    <th>Parent ID</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {productCategories.map((category, index) => [
                    <tr key={category.id} onClick={() => setExpandedRowId(expandedRowId === category.id ? null : category.id)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="text-zinc-500 font-medium">{typeof page !== 'undefined' && typeof size !== 'undefined' ? (page * size) + index + 1 : index + 1}</td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-900 flex items-center gap-1.5 text-[10.4px]">
                            {category.name}
                          </span>
                          {category.description && (
                            <span className="text-zinc-500 text-xs truncate max-w-xs">{category.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-zinc-700 text-xs bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200 flex items-center gap-1 w-max">
                          <Tag size={10} className="text-zinc-400" /> {category.code || '-'}
                        </span>
                      </td>
                      <td>
                        {category.parentCategoryId ? (
                           <span className="text-blue-600 text-[8.8px] font-semibold">{category.parentCategoryId.substring(0, 8)}...</span>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Top Level</span>
                        )}
                      </td>
                      <td>
                        {category.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.8px] font-bold bg-emerald-100 text-emerald-800">
                            <Check size={10} /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.8px] font-bold bg-zinc-100 text-zinc-600">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/10 transition-colors">
                        <TableRowActions
                          onView={() => navigate(`${window.location.pathname.replace(/\/$/, '')}/${category?.id}`)}
                          onEdit={() => handleOpenFormModal(category)}
                          onDelete={(e) => handleDelete(category.id, e)}
                        />
                      </td>
                    </tr>,
                    expandedRowId === category.id && <ExpandedRowDetails key={`exp-${category.id}`} data={category} colSpan={100} />
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageInfo && productCategories?.length > 0 && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              totalElements={pageInfo.totalElements || productCategories.length}
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
                  <FolderTree size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {initialFormData ? 'Edit Category' : 'New Category'}
                </h2>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <XIcon size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <ProductCategoryForm
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