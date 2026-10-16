import React from 'react';
import SortableHeader from '../common/SortableHeader';
import DataTableRow from './DataTableRow';
import DataTableLoading from './DataTableLoading';
import DataTableEmptyState from './DataTableEmptyState';
import { getSerialNumber } from '../../utils/serialNumberHelper';

/**
 * Core table body component: renders table, thead with sortable headers,
 * and tbody with skeleton loading, empty state, or DataTableRow list.
 */
export default function DataTableBody({
  columns = [],
  data = [],
  loading = false,
  skeletonRows = 8,
  emptyMessage = 'No records found',
  emptyDescription,
  onReset,
  sort,
  onSortChange,
  showIndex = true,
  pageIndexOffset = 0,
  rowActions = [],
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  expandedRowId,
  onToggleExpand,
  renderExpandedRow,
  rowKey = 'id',
  onRowClick,
  rowClassName,
  tableClassName = ''
}) {
  const selectAllRef = React.useRef(null);

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (rowKey && row[rowKey] !== undefined) return row[rowKey];
    if (row.id !== undefined) return row.id;
    if (row._id !== undefined) return row._id;
    return index;
  };

  const currentPageKeys = React.useMemo(() => {
    return (data || []).map((row, idx) => getRowKey(row, idx));
  }, [data, rowKey]);

  const allSelected = React.useMemo(() => {
    if (!currentPageKeys.length) return false;
    return currentPageKeys.every((k) => selectedRows.includes(k));
  }, [currentPageKeys, selectedRows]);

  const someSelected = React.useMemo(() => {
    if (allSelected || !currentPageKeys.length) return false;
    return currentPageKeys.some((k) => selectedRows.includes(k));
  }, [allSelected, currentPageKeys, selectedRows]);

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleToggleSelectAll = (e) => {
    e.stopPropagation();
    if (onSelectAll) {
      onSelectAll(!allSelected && !someSelected, currentPageKeys);
    }
  };

  const hasRowActions = Boolean(
    typeof rowActions === 'function' ||
    (Array.isArray(rowActions) && rowActions.length > 0)
  );

  const totalColSpan = columns.length + (showIndex ? 1 : 0) + (hasRowActions ? 1 : 0) + (selectable ? 1 : 0);

  const handleSort = (field) => {
    if (!onSortChange) return;

    let nextDirection = 'asc';
    if (sort && sort.key === field) {
      if (sort.direction === 'asc') {
        nextDirection = 'desc';
      } else if (sort.direction === 'desc') {
        nextDirection = null; // reset to none
      }
    }

    onSortChange({
      key: nextDirection ? field : null,
      direction: nextDirection
    });
  };

  return (
    <div className={`flex-1 overflow-auto min-h-0 min-w-0 custom-scrollbar ${tableClassName}`}>
      <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Data table">
        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-medium sticky top-0 z-20">
          <tr>
            {/* Selection Checkbox Header */}
            {selectable && (
              <th scope="col" className="px-4 py-3 w-10 text-center select-none">
                <div className="flex items-center justify-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-zinc-900/20 focus:ring-offset-0 transition-colors cursor-pointer"
                    aria-label="Select all visible rows"
                  />
                </div>
              </th>
            )}

            {/* Index Header */}
            {showIndex && (
              <th scope="col" className="px-4 py-3 w-12 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider select-none">
                #
              </th>
            )}

            {/* Dynamic Column Headers */}
            {columns.map((col) => {
              const colKey = col.key || col.id;
              const sortKey = col.sortKey || colKey;
              const isSortable = Boolean(col.sortable && onSortChange);

              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              if (isSortable) {
                return (
                  <SortableHeader
                    key={colKey}
                    field={sortKey}
                    sortBy={sort?.key}
                    sortOrder={sort?.direction}
                    onSort={handleSort}
                    align={col.align}
                    width={col.width}
                    className={`p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 ${col.headerClassName || ''}`}
                    label={col.label || col.header || colKey}
                  />
                );
              }

              return (
                <th
                  scope="col"
                  key={colKey}
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  className={`p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 select-none ${alignClass} ${col.headerClassName || ''}`}
                >
                  {col.label || col.header || colKey}
                </th>
              );
            })}

            {/* Actions Header */}
            {hasRowActions && (
              <th scope="col" className="p-4 text-right sticky right-0 bg-zinc-50 z-30 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] text-xs font-semibold uppercase tracking-wider text-zinc-600 select-none">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100">
          {loading ? (
            <DataTableLoading columnCount={totalColSpan} rowCount={skeletonRows} />
          ) : !data || data.length === 0 ? (
            <DataTableEmptyState
              colSpan={totalColSpan}
              message={emptyMessage}
              description={emptyDescription}
              onReset={onReset}
            />
          ) : (
            data.map((row, index) => {
              const key = typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] || index;
              const isExpanded = expandedRowId !== undefined && expandedRowId !== null
                ? expandedRowId === key || expandedRowId === row.id
                : false;

              return (
                <DataTableRow
                  key={key}
                  row={row}
                  index={index}
                  rowIndex={getSerialNumber({ offset: pageIndexOffset, rowIndex: index })}
                  columns={columns}
                  rowActions={rowActions}
                  showIndex={showIndex}
                  selectable={selectable}
                  isSelected={selectedRows.includes(key)}
                  onSelectRow={(e) => onSelectRow && onSelectRow(key, row, e)}
                  isExpanded={isExpanded}
                  onToggleExpand={() => onToggleExpand && onToggleExpand(key, row)}
                  renderExpandedRow={renderExpandedRow}
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
