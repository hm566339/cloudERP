import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, SlidersHorizontal, ChevronDown, ChevronUp, Filter, 
  X, RefreshCw, FolderTree, List, Search, MapPin, Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import { useWarehouseLocationList, useWarehouseLocationDelete, useWarehouseLocationCreate, useWarehouseLocationUpdate } from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import WarehouseLocationForm from './WarehouseLocationForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';

export default function WarehouseLocationManagement({ warehouseId }) {
  const dispatch = useAppDispatch();
  
  const [viewMode, setViewMode] = useState('TREE'); // 'TABLE' | 'TREE'
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (locations) {
      const allIds = locations.map(l => l.id);
      setExpandedNodes(new Set(allIds));
    }
  };

  const collapseAll = () => setExpandedNodes(new Set());

  const {
    page, setPage, setPageSize, apiParams,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'locationName', defaultSortOrder: 'asc' });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = { warehouseId }; // always lock to current warehouse
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.locationCode && filters.locationCode.trim()) q.locationCode = filters.locationCode.trim();
    if (filters.locationName && filters.locationName.trim()) q.locationName = filters.locationName.trim();
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    return q;
  }, [filters, warehouseId]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  // When in TREE mode, we load all. When in TABLE mode, we use pagination.
  const pageable = useMemo(() => ({
    page: viewMode === 'TREE' ? 0 : page,
    size: viewMode === 'TREE' ? 1000 : (apiParams.size || 10),
    sort: 'locationName,asc'
  }), [viewMode, page, apiParams.size]);

  const { locations, pagination: pageInfo, isLoading, isFetching, refetch } = useWarehouseLocationList(
    finalParams,
    pageable,
    { skip: !warehouseId, keepPreviousData: true }
  );

  const createMutation = useWarehouseLocationCreate();
  const updateMutation = useWarehouseLocationUpdate();
  const deleteMutation = useWarehouseLocationDelete();

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
        dispatch(addAlert({ type: 'success', message: 'Location updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Location created successfully' }));
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
      title: 'Delete Location',
      message: 'Are you sure you want to delete this location? This action cannot be undone.',
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Location deleted successfully' }));
        refetch();
      } catch (error) {
        dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete location' }));
      }
    }
  };

  // Active Advanced Filter Count
  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['locationCode', 'locationName'];
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

  // Tree View Logic
  const treeData = useMemo(() => {
    if (!locations || locations.length === 0) return [];
    
    // Determine the root nodes. A node is a root if its parentLocationId is null/empty,
    // OR if its parentLocationId points to a node that isn't in the current dataset 
    // (which happens during filtering).
    const map = new Map(locations.map(loc => [loc.id, { ...loc, children: [] }]));
    const roots = [];

    map.forEach(node => {
      if (node.parentLocationId && map.has(node.parentLocationId)) {
        map.get(node.parentLocationId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [locations]);

  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="animate-in fade-in slide-in-from-top-1">
        <div 
          className="flex items-center justify-between py-2.5 px-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors group relative"
          style={{ paddingLeft: `${(depth * 28) + 16}px` }}
        >
          {depth > 0 && (
            <div 
              className="absolute border-l-2 border-b-2 border-zinc-200 rounded-bl-lg"
              style={{
                left: `${((depth - 1) * 28) + 26}px`,
                top: '-12px',
                width: '16px',
                height: '32px'
              }}
            />
          )}

          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              className={`w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0 transition-colors ${
                hasChildren 
                  ? 'bg-zinc-100 hover:bg-zinc-200 cursor-pointer text-zinc-600' 
                  : 'bg-transparent text-transparent'
              }`}
              onClick={(e) => {
                if (hasChildren) {
                  e.stopPropagation();
                  toggleNode(node.id);
                }
              }}
            >
              {hasChildren && (
                <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
              )}
            </div>
            
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <MapPin size={16} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 text-sm truncate">{node.locationName}</span>
                {!node.isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                    INACTIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[8px]">{node.locationCode || 'Draft'}</span>
                {hasChildren && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                    <span>{node.children.length} sub-locations</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <RequirePermission module="INVENTORY" action="EDIT">
              <button
                onClick={() => handleOpenFormModal(node)}
                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit Location"
              >
                <Edit2 size={16} />
              </button>
            </RequirePermission>
            <RequirePermission module="INVENTORY" action="DELETE">
              <button
                onClick={(e) => handleDelete(node.id, e)}
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete Location"
              >
                <Trash2 size={16} />
              </button>
            </RequirePermission>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="relative">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 relative min-h-[320px]">
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-white">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={filters.searchKey || ''}
                  onChange={(e) => setFilter('searchKey', e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>

              <div className="hidden sm:flex items-center bg-zinc-100 rounded-lg p-1 border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'TABLE' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <List size={14} /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('TREE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'TREE' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <FolderTree size={14} /> Tree
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                <span>Filters</span>
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
                className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95"
                title="Refresh List"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
              
              <RequirePermission module="INVENTORY" action="CREATE">
                <button 
                  type="button"
                  onClick={handleOpenFormModal} 
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} /> New Location
                </button>
              </RequirePermission>
            </div>
          </form>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter size={13} className="text-zinc-500" /> Search Fields
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleReset} className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold">Clear</button>
                    <button type="button" onClick={() => setShowAdvancedFilters(false)} className="text-xs text-zinc-400 hover:text-zinc-600"><X size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Location Code</label>
                    <input
                      type="text"
                      value={filters.locationCode || ''}
                      onChange={(e) => setFilter('locationCode', e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Location Name</label>
                    <input
                      type="text"
                      value={filters.locationName || ''}
                      onChange={(e) => setFilter('locationName', e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Status</label>
                    <select
                      value={filters.isActive !== undefined ? String(filters.isActive) : ''}
                      onChange={(e) => setFilter('isActive', e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] outline-none focus:border-zinc-400"
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
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
          ) : locations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                <MapPin size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">No locations found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">There are no locations in this warehouse matching your criteria.</p>
              <RequirePermission module="INVENTORY" action="CREATE">
                <button onClick={handleOpenFormModal} className="btn-primary">
                  <Plus size={16} /> Add First Location
                </button>
              </RequirePermission>
            </div>
          ) : viewMode === 'TABLE' ? (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Parent Location</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {locations.map((loc) => {
                    const parent = locations.find(l => l.id === loc.parentLocationId);
                    return (
                      <tr key={loc.id}>
                        <td className="font-mono text-zinc-600">{loc.locationCode || '-'}</td>
                        <td className="font-medium text-zinc-900">{loc.locationName}</td>
                        <td className="text-zinc-600">
                          {parent ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={12} className="text-zinc-400" />
                              {parent.locationName}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Root Location</span>
                          )}
                        </td>
                        <td className="text-center">
                          {loc.isActive ? (
                            <span className="badge badge-success inline-flex items-center gap-1"><CheckCircle size={12} /> Active</span>
                          ) : (
                            <span className="badge badge-error inline-flex items-center gap-1"><AlertCircle size={12} /> Inactive</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <RequirePermission module="INVENTORY" action="EDIT">
                              <button
                                onClick={() => handleOpenFormModal(loc)}
                                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                            </RequirePermission>
                            <RequirePermission module="INVENTORY" action="DELETE">
                              <button
                                onClick={() => handleDelete(loc.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </RequirePermission>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                <button onClick={expandAll} className="text-xs font-semibold text-zinc-700 hover:text-zinc-900">Expand All</button>
                <span className="text-zinc-300">|</span>
                <button onClick={collapseAll} className="text-xs font-semibold text-zinc-700 hover:text-zinc-900">Collapse All</button>
              </div>
              <div className="py-2 overflow-x-auto min-w-[480px]">
                {treeData.map(node => renderTreeNode(node, 0))}
              </div>
            </div>
          )}
        </div>

        {viewMode === 'TABLE' && pageInfo && locations.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={pageInfo.totalPages || 1}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            totalElements={pageInfo.totalElements || locations.length}
            pageSize={apiParams.size || 10}
          />
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
                  <MapPin size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {initialFormData ? 'Edit Location' : 'Create Location'}
                </h2>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <WarehouseLocationForm
                initialData={initialFormData}
                warehouseId={warehouseId}
                parentLocations={locations}
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
