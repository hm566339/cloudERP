import React, { useState } from 'react';
import { Download, Trash2, Search, X, RotateCcw, ScrollText } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import SortableHeader from '../../../components/common/SortableHeader';
import CustomSelect from '../../../components/common/CustomSelect';
import useApiFilters from '../../../hooks/useApiFilters';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import { createLogger } from '../../../utils/logger';
import { getSerialNumber } from '../../../utils/serialNumberHelper';

const logger = createLogger('SYSTEM_LOGS_PAGE');

/**
 * System Logs Page
 * Displays application logs from console and API interactions
 * Allows filtering, export, and log management
 */
export default function SystemLogsPage() {
  const { 
    filterBarProps, 
    paginationProps, 
    sortBy, 
    sortOrder, 
    filters, 
    page, 
    pageSize, 
    handleColumnSort 
  } = useApiFilters(FILTER_CONFIGS.systemLogs, { defaultPageSize: 10, defaultSortBy: 'timestamp-desc' });

  const searchQuery = filterBarProps.searchTerm || '';
  const filterLevel = filters.level || 'all';

  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'info',
      context: 'APP',
      message: 'Application initialized successfully',
      data: null,
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'debug',
      context: 'API_CLIENT',
      message: 'Token refresh completed',
      data: null,
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'warn',
      context: 'PROTECTED_ROUTE',
      message: 'Company mismatch detected',
      data: { urlCompanyId: '123', selectedCompanyId: '456' },
    },
  ]);

  const getLevelBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'debug':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-blue-50 text-blue-700 border border-blue-200/70 inline-block uppercase">
            DEBUG
          </span>
        );
      case 'warn':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-amber-50 text-amber-700 border border-amber-200/70 inline-block uppercase">
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-rose-50 text-rose-700 border border-rose-200/70 inline-block uppercase">
            ERROR
          </span>
        );
      case 'fatal':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-rose-100 text-rose-900 border border-rose-300 inline-block uppercase">
            FATAL
          </span>
        );
      case 'info':
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-emerald-50 text-emerald-700 border border-emerald-200/70 inline-block uppercase">
            INFO
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.context.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (sortBy === 'timestamp') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const setPage = paginationProps.onPageChange;
  const displayedLogs = sortedLogs.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Context', 'Message', 'Data'],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.level,
        log.context,
        log.message,
        JSON.stringify(log.data || ''),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    logger.info('Logs exported', { count: filteredLogs.length });
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
      logger.info('Logs cleared by user');
    }
  };

  return (
    <div 
      className="w-full max-w-none px-6 sm:px-8 py-6 space-y-5 animate-fade-in pb-12"
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] sm:text-[24px] font-bold text-zinc-900 tracking-tight">System Logs</h1>
          <p className="text-[13px] text-zinc-500">
            View and manage application logs
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95"
            title="Export logs as CSV"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95"
            title="Clear all logs"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* ── Filter / Search Bar (RFQ / Enterprise Style) ── */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px_auto] gap-2.5 items-end">
          {/* Search Input */}
          <div className="min-w-0">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Search Logs
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => filterBarProps.onSearchChange(e.target.value)}
                placeholder="Search logs by message or context..."
                className="w-full h-10 pl-9 pr-8 bg-zinc-50/50 hover:bg-white focus:bg-white border border-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => filterBarProps.onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-md"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Level Select */}
          <div className="w-full md:w-[320px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Level
            </label>
            <CustomSelect
              value={filterLevel}
              onChange={(e) => filterBarProps.onFilterChange('level', e.target.value)}
              className="w-full h-10 px-3 bg-zinc-50/50 hover:bg-white focus:bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </CustomSelect>
          </div>

          {/* Reset Button */}
          <div>
            <button
              type="button"
              onClick={filterBarProps.onClearAll}
              className="h-10 px-4 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium transition-all shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Reset filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Logs Table Card ── */}
      <div className="w-full min-w-0">
        {filteredLogs.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-xl bg-white py-14 flex flex-col items-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <ScrollText size={22} className="stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-zinc-900">No system logs found</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">No log entries match your current search query or filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed divide-y divide-zinc-200 text-left border-collapse" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">
                    <th className="w-[5%] min-w-[48px] px-3 py-3 text-center">S.No.</th>
                    <SortableHeader field="timestamp" label="TIMESTAMP" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="w-[15%] min-w-[140px] px-4 py-3" />
                    <SortableHeader field="level" label="LEVEL" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="w-[8%] min-w-[75px] px-3 py-3 text-center" />
                    <SortableHeader field="context" label="CONTEXT" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="w-[14%] min-w-[110px] px-4 py-3" />
                    <th className="w-[32%] min-w-[200px] px-4 py-3 text-left">Message</th>
                    <th className="w-[26%] min-w-[160px] px-4 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayedLogs.map((log, index) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-zinc-50/80 transition-colors"
                      style={{ minHeight: '54px' }}
                    >
                      <td className="px-3 py-3 text-center font-mono text-xs text-zinc-500 tabular-nums">
                        {getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-600 truncate" title={new Date(log.timestamp).toLocaleString()}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-zinc-800 truncate" title={log.context}>
                        {log.context}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-800 font-medium truncate" title={log.message}>
                        <span className="truncate block max-w-full">
                          {log.message}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {log.data ? (
                          <span 
                            className="text-[11px] text-zinc-500 truncate block max-w-full bg-zinc-50 border border-zinc-100 px-2 py-1 rounded select-all" 
                            title={JSON.stringify(log.data)}
                          >
                            {JSON.stringify(log.data)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredLogs.length > 0 && (
              <div className="p-4 border-t border-zinc-100 bg-white">
                <Pagination
                  {...paginationProps}
                  page={page}
                  onPageChange={setPage}
                  totalPages={totalPages}
                  totalElements={filteredLogs.length}
                  itemName="logs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
