import React from 'react';
import DataTableActionMenu from './DataTableActionMenu';

/**
 * Individual row component for DataTable with custom cell rendering,
 * sticky actions, and expandable row content.
 */
function DataTableRow({
  row,
  index,
  columns = [],
  rowActions = [],
  permissionFeature,
  showIndex = true,
  rowIndex,
  selectable = false,
  isSelected = false,
  onSelectRow,
  isExpanded = false,
  onToggleExpand,
  renderExpandedRow,
  onRowClick,
  rowClassName
}) {
  const handleRowClick = (e) => {
    if (onRowClick) {
      onRowClick(row, index, e);
    }
    if (renderExpandedRow && onToggleExpand) {
      onToggleExpand(row, index);
    }
  };

  const resolvedActions = typeof rowActions === 'function' ? rowActions(row, index) : (Array.isArray(rowActions) ? rowActions : []);
  const hasRowActions = Boolean(resolvedActions && resolvedActions.length > 0);

  const hasClickAction = Boolean(onRowClick || renderExpandedRow);
  const totalColSpan = columns.length + (showIndex ? 1 : 0) + (hasRowActions ? 1 : 0) + (selectable ? 1 : 0);

  const customClass = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || '';

  return (
    <>
      <tr
        onClick={hasClickAction ? handleRowClick : undefined}
        className={`border-b border-zinc-100 dark:border-[#2A2F3D]/60 transition-colors duration-micro ease-enter ${
          hasClickAction ? 'cursor-pointer' : ''
        } ${isSelected ? 'bg-zinc-50/90 dark:bg-[#222736]' : isExpanded ? 'bg-zinc-50/80 dark:bg-[#1D212C]' : 'hover:bg-zinc-50/70 dark:hover:bg-[#222736]/70'} ${customClass}`}
      >
        {/* Selection Checkbox */}
        {selectable && (
          <td
            className="p-4 text-center w-10 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                onChange={(e) => onSelectRow && onSelectRow(e)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#4C8DFF] accent-zinc-900 dark:accent-[#4C8DFF] focus:ring-zinc-900/20 dark:focus:ring-[#4C8DFF]/20 focus:ring-offset-0 transition-colors cursor-pointer"
                aria-label={`Select row ${rowIndex !== undefined ? rowIndex : index + 1}`}
              />
            </div>
          </td>
        )}

        {/* Row Index (#) */}
        {showIndex && (
          <td className="p-4 text-center text-zinc-400 dark:text-[#6B7184] text-xs w-12 select-none tabular-nums">
            {rowIndex !== undefined && rowIndex !== '' && rowIndex !== null ? rowIndex : index + 1}
          </td>
        )}

        {/* Dynamic Columns */}
        {columns.map((col) => {
          const colKey = col.key || col.id;
          const rawValue = row[colKey];

          const alignClass =
            col.align === 'right' || col.isNumeric
              ? 'text-right tabular-nums'
              : col.align === 'center'
              ? 'text-center'
              : 'text-left';

          const renderedContent = col.render
            ? col.render(rawValue, row, index)
            : typeof col.cell === 'function'
            ? col.cell(row, rawValue, index)
            : rawValue !== undefined && rawValue !== null && rawValue !== ''
            ? String(rawValue)
            : '-';

          return (
            <td
              key={colKey}
              className={`p-4 text-zinc-800 dark:text-[#E6E8EE] text-sm ${alignClass} ${col.className || ''}`}
              style={col.width ? { width: col.width, minWidth: col.width } : undefined}
            >
              {renderedContent}
            </td>
          );
        })}

        {/* Actions Column (Sticky Right) */}
        {hasRowActions && (
          <td
            className={`p-4 text-right sticky right-0 z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] transition-colors ${
              isSelected
                ? 'bg-zinc-100 dark:bg-[#222736]'
                : isExpanded
                ? 'bg-zinc-50 dark:bg-[#1D212C]'
                : 'bg-white dark:bg-[#161922] group-hover:bg-zinc-50/70 dark:group-hover:bg-[#222736]/70'
            }`}
          >
            <DataTableActionMenu actions={resolvedActions} row={row} index={index} permissionFeature={permissionFeature} />
          </td>
        )}
      </tr>

      {/* Optional Expanded Row Drawer */}
      {isExpanded && renderExpandedRow && (
        <tr>
          <td colSpan={totalColSpan} className="p-0 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <div className="bg-zinc-50/50 dark:bg-[#1D212C] p-6 shadow-inner border-y border-zinc-100 dark:border-[#2A2F3D] animate-slide-down whitespace-normal">
              {renderExpandedRow(row, index)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default React.memo(DataTableRow);
