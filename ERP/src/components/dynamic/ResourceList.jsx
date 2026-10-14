import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { useResourceList } from '../../hooks/useResourceList';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../common/StatusBadge';
import Can from '../common/Can';
import RelationSelect from './RelationSelect';
import { useEnumOptions } from '../../hooks/useEnumOptions';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Filter Input Subcomponent
function DynamicFilterInput({ filter, value, onChange }) {
  const options = useEnumOptions(filter.enumKey);

  if (filter.type === 'relation') {
    return (
      <div className="w-48">
        <RelationSelect
          resource={filter.relationResource}
          value={value}
          onChange={(val) => onChange(val)}
          placeholder={`All ${filter.label}...`}
        />
      </div>
    );
  }

  if (filter.type === 'select' || filter.enumKey) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All {filter.label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (filter.type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
    );
  }

  return (
    <input
      type="text"
      placeholder={`Filter by ${filter.label}...`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    />
  );
}

/**
 * Enterprise Dynamic Resource List Engine
 * Driven completely by backend metadata registry and permissions.
 */
export default function ResourceList({
  resource,
  title,
  subtitle,
  columns: customColumns,
  actions: customActions,
  headerActions,
  onRowClick,
  onCreateClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  extraFilters = {},
  className = '',
}) {
  const { organization, isReadOnly } = useAuth();
  const orgCurrency = organization?.currency || 'INR';

  const listHook = useResourceList(resource, {
    extraParams: extraFilters,
  });

  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    sortField,
    sortDir,
    setSort,
    setPage,
    setPageSize,
    loading,
    error,
    refetch,
    config,
  } = listHook;

  // Resolve columns: custom overrides take precedence; otherwise registry
  const effectiveColumns = useMemo(() => {
    if (customColumns && customColumns.length > 0) {
      return customColumns;
    }
    const regFields = config?.fields || [];
    return regFields
      .filter((f) => f.inTable !== false)
      .map((f) => ({
        id: f.name,
        header: f.label || f.name,
        accessorKey: f.name,
        sortable: f.sortable ?? true,
        type: f.format || f.type || 'text',
        enumKey: f.enumKey,
        render: null,
      }));
  }, [customColumns, config]);

  // Cell renderer dispatcher
  const renderCell = (col, row) => {
    if (col.render) {
      return col.render(row[col.accessorKey || col.id], row);
    }

    const val = row[col.accessorKey || col.id];
    if (val === null || val === undefined || val === '') {
      return <span className="text-zinc-400 dark:text-zinc-500">-</span>;
    }

    switch (col.type) {
      case 'currency':
        return <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatCurrency(val, orgCurrency)}</span>;

      case 'date':
        return <span className="text-zinc-600 dark:text-zinc-400">{formatDate(val)}</span>;

      case 'statusBadge':
        return (
          <StatusBadge
            enum={col.enumKey}
            value={typeof val === 'boolean' ? (val ? 'ACTIVE' : 'INACTIVE') : val}
          />
        );

      case 'boolean':
        return (
          <span
            className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
              val ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {val ? 'Yes' : 'No'}
          </span>
        );

      default:
        return <span className="text-zinc-800 dark:text-zinc-200">{String(val)}</span>;
    }
  };

  const resourceTitle = title || config?.pluralName || config?.name || resource;
  const filterList = config?.listCapabilities?.filters || [];
  const hasActiveFilters = Object.keys(filters).length > 0 || Boolean(searchTerm);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{resourceTitle}</h1>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {headerActions}

          <Can permission={config?.permissions?.create}>
            {onCreateClick && (
              <button
                type="button"
                onClick={onCreateClick}
                disabled={isReadOnly}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New {config?.name || 'Item'}</span>
              </button>
            )}
          </Can>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${resourceTitle.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 pl-8 pr-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Dynamic Filters */}
          {filterList.map((f) => (
            <DynamicFilterInput
              key={f.name}
              filter={f}
              value={filters[f.name]}
              onChange={(val) => setFilter(f.name, val)}
            />
          ))}

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Reload button */}
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
          title="Reload records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Failed to load data</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {error.message || 'An error occurred while fetching records.'}
            </p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 dark:border-indigo-800 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  {effectiveColumns.map((col) => {
                    const isSorted = sortField === (col.accessorKey || col.id);
                    return (
                      <th
                        key={col.id}
                        scope="col"
                        onClick={() => col.sortable && setSort(col.accessorKey || col.id)}
                        className={`px-4 py-3 select-none ${col.sortable ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-zinc-400">
                              {isSorted ? (
                                sortDir === 'asc' ? (
                                  <ArrowUp className="w-3 h-3 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {(onViewClick || onEditClick || onDeleteClick || customActions) && (
                    <th scope="col" className="px-4 py-3 text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={`skel-${rIdx}`} className="animate-pulse">
                      {effectiveColumns.map((_, cIdx) => (
                        <td key={`skel-c-${cIdx}`} className="px-4 py-3">
                          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-24" />
                        </td>
                      ))}
                      {(onViewClick || onEditClick || onDeleteClick || customActions) && (
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-12 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={effectiveColumns.length + 1}
                      className="px-4 py-12 text-center text-zinc-400"
                    >
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No records found</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs font-semibold underline"
                        >
                          Clear active filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((row, rowIdx) => {
                    const rowId = row[config?.idField || 'id'] || rowIdx;
                    return (
                      <tr
                        key={String(rowId)}
                        onClick={() => onRowClick && onRowClick(row)}
                        className={`transition-colors ${
                          onRowClick ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                        }`}
                      >
                        {effectiveColumns.map((col) => (
                          <td key={col.id} className="px-4 py-3 whitespace-nowrap">
                            {renderCell(col, row)}
                          </td>
                        ))}

                        {/* Row Actions */}
                        {(onViewClick || onEditClick || onDeleteClick || customActions) && (
                          <td
                            className="px-4 py-3 whitespace-nowrap text-right text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {customActions && customActions(row)}

                              {onViewClick && (
                                <button
                                  type="button"
                                  onClick={() => onViewClick(row)}
                                  className="p-1 text-zinc-400 hover:text-indigo-600 rounded transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              <Can permission={config?.permissions?.update}>
                                {onEditClick && !isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => onEditClick(row)}
                                    className="p-1 text-zinc-400 hover:text-amber-600 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </Can>

                              <Can permission={config?.permissions?.delete}>
                                {onDeleteClick && !isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteClick(row)}
                                    className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </Can>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!error && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-zinc-900 dark:text-zinc-100">{page * pageSize + 1}</strong> to{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{Math.min((page + 1) * pageSize, total)}</strong> of{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{total}</strong> records
              </span>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100"
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 0 || loading}
                className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-medium">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>

              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

