import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';

import { 
  Download, Search, Filter, X, Eye, Monitor, 
  User, HardDrive, FileText, RotateCcw, SlidersHorizontal, ChevronUp, ChevronDown, RefreshCw 
} from 'lucide-react';
import SortableHeader from '../../../components/common/SortableHeader';
import Pagination from '../../../components/common/Pagination';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';

import { auditLogsApi } from '../../../api/account/auditLogs';
import { getModules } from '../../../api/sso/module';
import { formatDateTime } from '../../../utils/dateFormatter';
import { getSerialNumber } from '../../../utils/serialNumberHelper';

 // Reusing this for table structure
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomSelect from '../../../components/common/CustomSelect';
import ExportModal from '../../../components/common/ExportModal';

const getActionBadge = (action) => {
  const styles = {
    'CREATE': 'bg-emerald-50 text-emerald-700',
    'UPDATE': 'bg-blue-50 text-blue-700',
    'DELETE': 'bg-red-50 text-red-700',
    'RESTORE': 'bg-teal-50 text-teal-700',
    'APPROVE': 'bg-indigo-50 text-indigo-700',
    'POST': 'bg-purple-50 text-purple-700',
    'CANCEL': 'bg-orange-50 text-orange-700',
    'AUTO_APPROVED': 'bg-zinc-100 text-zinc-700',
  };
  const style = styles[action] || 'bg-zinc-100 text-zinc-700';
  return <span className={`px-2 py-0.5 inline-flex items-center text-[8.8px] font-bold uppercase tracking-wide rounded-full ${style}`}>{action}</span>;
};

// A simple syntax highlighted JSON viewer
const JsonViewer = ({ data }) => {
  if (!data) return <div className="text-zinc-400 italic">No data</div>;
  let parsed;
  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return <pre className="text-sm bg-zinc-50 p-4 rounded overflow-auto">{data}</pre>;
  }

  if (parsed && typeof parsed === 'object' && 'nodeType' in parsed && 'containerNode' in parsed) {
    return <div className="text-zinc-400 italic">Not visible</div>;
  }

  return (
    <pre className="text-sm bg-zinc-50 p-4 rounded overflow-auto border border-zinc-200 text-zinc-800">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
};

export default function AuditLogsPage({ moduleFilter } = {}) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { buildPath } = useRoutePath();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Available modules loaded from SSO Modules API
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState(null);

  const [filters, setFilters] = useState({
    moduleId: '',
    moduleName: moduleFilter || '',
    entityName: '',
    actionType: '',
    performedBy: '',
    fromDate: '',
    toDate: '',
    ipAddress: '',
  });

  const [query, setQuery] = useState({
    page: 0,
    size: 10,
    sortBy: 'performedAt',
    sortDir: 'desc'
  });

  // Fetch available modules from existing Modules API
  const loadModules = useCallback(async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const res = await getModules({ page: 0, pageSize: 1000 });
      const items = Array.isArray(res) ? res : res?.modules || res?.content || [];
      setModules(items);
    } catch (err) {
      console.error('Failed to load modules for audit logs:', err);
      setModulesError('Unable to load modules');
    } finally {
      setModulesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Sync moduleFilter prop with loaded modules if provided
  useEffect(() => {
    if (filters.moduleName && !filters.moduleId && modules.length > 0) {
      const matched = modules.find(m => 
        m.name?.toLowerCase() === filters.moduleName.toLowerCase() ||
        m.code?.toLowerCase() === filters.moduleName.toLowerCase()
      );
      if (matched) {
        setFilters(prev => ({ ...prev, moduleId: matched.id }));
      }
    }
  }, [modules, filters.moduleName, filters.moduleId]);

  // Build module select options with UUID as value and clean name as label
  const moduleOptions = useMemo(() => {
    if (!modules || modules.length === 0) {
      return [];
    }
    const opts = [{ value: '', label: 'All Modules' }];
    modules.forEach(m => {
      if (m && m.name) {
        opts.push({
          value: m.id,
          label: m.name,
          subLabel: m.code || undefined
        });
      }
    });
    return opts;
  }, [modules]);

  const fetchLogs = async (currentQuery = query, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      
      const res = await auditLogsApi.getAuditLogs({
        ...activeFilters,
        page: currentQuery.page,
        size: currentQuery.size,
        sortBy: currentQuery.sortBy,
        sortDir: currentQuery.sortDir
      });

      const responseData = res.data || res;

      if (responseData.success) {
        setData(responseData.data);
        setPagination(responseData.pagination);
      } else {
        setError(responseData.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(query, filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setQuery(prev => ({ ...prev, page: 0 })); // Reset page on filter change
  };

  const handleModuleChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFilters(prev => ({ ...prev, moduleId: '', moduleName: '' }));
    } else {
      const found = modules.find(m => m.id === selectedId || m.name === selectedId);
      setFilters(prev => ({
        ...prev,
        moduleId: selectedId,
        moduleName: found ? found.name : ''
      }));
    }
    setQuery(prev => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({
      moduleId: '',
      moduleName: '',
      entityName: '',
      actionType: '',
      performedBy: '',
      fromDate: '',
      toDate: '',
      ipAddress: '',
    });
    setQuery(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    setQuery(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (field) => {
    setQuery(prev => {
      const isAsc = prev.sortBy === field && prev.sortDir === 'asc';
      return { ...prev, sortBy: field, sortDir: isAsc ? 'desc' : 'asc', page: 0 };
    });
  };

  const openDrawer = (log) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedLog(null), 300); // Allow animation to complete
  };

  const columns = [
    { header: 'Module', id: 'moduleName', sortable: true },
    { header: 'Entity', id: 'entityName', sortable: true },
    { header: 'Action', accessor: row => getActionBadge(row.actionType), id: 'actionType', sortable: true },
    { header: 'Performed At', accessor: row => formatDateTime(row.performedAt), id: 'performedAt', sortable: true },
    { header: 'Performed By', accessor: row => row.performedByUsername || row.performedBy, id: 'performedBy', sortable: true },
    { header: 'IP Address', id: 'ipAddress' },
    { header: 'User Agent', id: 'userAgent', className: 'truncate max-w-xs', cellClassName: 'truncate max-w-xs text-xs text-zinc-500' }
  ];

  const activeAdvancedFilterCount = ['performedBy', 'ipAddress'].filter(k => filters[k] !== '' && filters[k] !== null && filters[k] !== undefined).length;

  // Style tokens matching Customer Management
  const label = 'mb-1 block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider';
  const fieldCls = `w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all`;
  const resetBtn = 'h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95';

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] dark:bg-[#0F1117]">
      {/* Page Header (same as Customer Management) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-card-dark border-b border-zinc-200 dark:border-border-dark">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-zinc-900" />
            Audit Logs
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Track user actions, data modifications, and system events.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 transition-all active:scale-95 shadow-2xs"
            title="Export CSV"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-zinc-200 dark:border-border-dark flex flex-col h-full overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); fetchLogs(query, filters); }}>
              {/* Row 1: Filters */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">

                  {/* Search Module */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Module</label>
                      {modulesError && (
                        <button
                          type="button"
                          onClick={loadModules}
                          className="text-[9px] text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                    <CustomSelect
                      name="moduleId"
                      value={filters.moduleId}
                      onChange={handleModuleChange}
                      options={moduleOptions}
                      placeholder={
                        modulesLoading
                          ? "Loading modules..."
                          : modulesError
                            ? "Unable to load modules"
                            : "Search module..."
                      }
                      emptyMessage={
                        modulesLoading
                          ? "Loading modules..."
                          : modulesError
                            ? "Unable to load modules"
                            : "No modules available"
                      }
                      searchable={true}
                      isLoading={modulesLoading}
                      disabled={modulesLoading}
                      emptyStateAction={
                        modulesError ? (
                          <button
                            type="button"
                            onClick={loadModules}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                          >
                            Retry loading modules
                          </button>
                        ) : null
                      }
                      buttonClassName={`${fieldCls} cursor-pointer`}
                    />
                  </div>

                  {/* Entity Name */}
                  <div>
                    <label className={label}>Entity</label>
                    <input
                      type="text"
                      name="entityName"
                      value={filters.entityName}
                      onChange={handleFilterChange}
                      placeholder="Entity Name"
                      className={fieldCls}
                    />
                  </div>

                  {/* Date From */}
                  <div>
                    <label className={label}>Date From</label>
                    <input
                      type="date"
                      name="fromDate"
                      value={filters.fromDate ? filters.fromDate.substring(0, 10) : ''}
                      onChange={(e) => handleFilterChange({ target: { name: 'fromDate', value: e.target.value ? e.target.value + "T00:00" : "" } })}
                      className={fieldCls}
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className={label}>Date To</label>
                    <input
                      type="date"
                      name="toDate"
                      value={filters.toDate ? filters.toDate.substring(0, 10) : ''}
                      onChange={(e) => handleFilterChange({ target: { name: 'toDate', value: e.target.value ? e.target.value + "T23:59" : "" } })}
                      className={fieldCls}
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className={label}>Action Type</label>
                    <CustomSelect
                      name="actionType"
                      value={filters.actionType}
                      onChange={handleFilterChange}
                      searchable={false}
                      buttonClassName={fieldCls + ' cursor-pointer'}
                    >
                      <option value="">All Actions</option>
                      <option value="CREATE">CREATE</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                      <option value="RESTORE">RESTORE</option>
                      <option value="APPROVE">APPROVE</option>
                      <option value="POST">POST</option>
                      <option value="CANCEL">CANCEL</option>
                    </CustomSelect>
                  </div>

                </div>

                {/* Filter Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={resetBtn}
                    title="Reset all filters"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${showAdvancedFilters || activeAdvancedFilterCount > 0
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                      : 'bg-white dark:bg-surface-dark border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-hover-dark/40'
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
                    onClick={() => fetchLogs(query, filters)}
                    className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95"
                    title="Refresh List"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </form>

            {/* Row 2: Collapsible Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter size={13} className="text-zinc-500" />
                      EXTENDED SEARCH & FILTER OPTIONS
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">User / Performed By</label>
                      <input
                        type="text"
                        name="performedBy"
                        value={filters.performedBy}
                        onChange={handleFilterChange}
                        placeholder="User ID..."
                        className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">IP Address</label>
                      <input
                        type="text"
                        name="ipAddress"
                        value={filters.ipAddress}
                        onChange={handleFilterChange}
                        placeholder="Search IP..."
                        className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  {columns.map(c => (
                     <SortableHeader key={c.id} label={c.header} field={c.id} sortBy={query.sortBy} sortOrder={query.sortDir} onSort={handleSort} className="p-4" />
                  ))}
                  <th className="p-4 text-right sticky right-0 bg-zinc-50 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading && data.length === 0 ? (
                  <TableRowSkeleton columns={columns.length + 2} rows={10} />
                ) : data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="p-4 text-center text-zinc-400 text-xs tabular-nums">
                        {getSerialNumber({ page: query.page, pageSize: query.size, rowIndex: index, pageBase: 0 })}
                      </td>
                      <td className="p-4 text-zinc-900 font-medium">{row.moduleName}</td>
                      <td className="p-4 text-zinc-500">{row.entityName}</td>
                      <td className="p-4">{getActionBadge(row.actionType)}</td>
                      <td className="p-4 text-zinc-500 font-mono text-xs">{formatDateTime(row.performedAt)}</td>
                      <td className="p-4 text-zinc-500">{row.performedByUsername || row.performedBy}</td>
                      <td className="p-4 text-zinc-500 font-mono text-xs">{row.ipAddress}</td>
                      <td className="p-4 text-zinc-500 text-xs truncate max-w-[120px]">{row.userAgent}</td>
                      <td className="p-4 text-right sticky right-0 bg-white dark:bg-card-dark shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDrawer(row)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center text-xs font-medium"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-zinc-300 mb-3" />
                        <p className="text-sm">No audit logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            current={query.page}
            total={pagination?.totalPages || 1}
            onPageChange={handlePageChange}
            totalElements={pagination?.totalElements || 0}
            pageSize={query.size}
            onPageSizeChange={(newSize) => setQuery(prev => ({ ...prev, size: newSize, page: 0 }))}
          />
        </div>
      </div>

      {/* Side Drawer */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-card-dark shadow-2xl border-l border-zinc-200 dark:border-border-dark transform transition-transform duration-300 ease-in-out z-50 border-l border-zinc-200 overflow-y-auto ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLog && (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-zinc-900">Audit Log Details</h2>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-600 focus:outline-none bg-white dark:bg-surface-dark rounded-full p-1 border border-zinc-200 dark:border-border-dark text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-6 flex-1">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Action</p>
                  <div className="mt-1">{getActionBadge(selectedLog.actionType)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Timestamp</p>
                  <p className="mt-1 text-sm text-zinc-900 font-medium">{formatDateTime(selectedLog.performedAt)}</p>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="flex items-start">
                    <HardDrive className="w-5 h-5 text-zinc-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Entity Details</p>
                      <p className="text-sm text-zinc-500">Module: <span className="text-zinc-900">{selectedLog.moduleName}</span></p>
                      <p className="text-sm text-zinc-500">Entity: <span className="text-zinc-900">{selectedLog.entityName}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-zinc-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Performed By</p>
                      <p className="text-sm text-zinc-500">{selectedLog.performedByUsername || selectedLog.performedBy}</p>
                      {selectedLog.performedByUsername && selectedLog.performedBy && (
                        <p className="text-xs text-zinc-400 mt-1 break-all">ID: {selectedLog.performedBy}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Monitor className="w-5 h-5 text-zinc-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">System Info</p>
                      <p className="text-sm text-zinc-500">IP: <span className="text-zinc-900">{selectedLog.ipAddress}</span></p>
                      <p className="text-sm text-zinc-500 mt-1 break-words">{selectedLog.userAgent}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedLog.oldValue && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">Old Value</h3>
                    <JsonViewer data={selectedLog.oldValue} />
                  </div>
                )}
                
                {selectedLog.newValue && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2 border-b border-zinc-200 pb-1">New Value</h3>
                    <JsonViewer data={selectedLog.newValue} />
                  </div>
                )}
              </div>
              
            </div>
          </div>
        )}
      </div>
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-zinc-500 bg-opacity-10 transition-opacity z-40" onClick={closeDrawer} />
      )}
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="audit-logs"
      />
    </div>
  );
}