import React from 'react';
import { FileX, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Standard Enterprise semantic Table primitives.
 * Follows ERP design tokens: zinc palette, sticky header, hover rows, contained responsive scroll.
 */

export function TableContainer({ children, className = '', scrollHint = false, ...props }) {
  return (
    <div
      className={`w-full max-w-full min-w-0 overflow-x-auto custom-scrollbar bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs relative ${
        scrollHint ? 'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-6 after:bg-gradient-to-l after:from-black/5 after:to-transparent sm:after:hidden' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ children, className = '', ariaLabel = 'Data table', ...props }) {
  return (
    <table
      aria-label={ariaLabel}
      className={`w-full text-left border-collapse text-xs md:text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '', sticky = true, ...props }) {
  return (
    <thead
      className={`bg-zinc-50 dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] ${
        sticky ? 'sticky top-0 z-20' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922] ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({ children, className = '', ...props }) {
  return (
    <tfoot
      className={`border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/70 dark:bg-[#161922] font-medium ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  );
}

export function TableRow({
  children,
  className = '',
  isClickable = false,
  isSelected = false,
  isZebra = false,
  ...props
}) {
  return (
    <tr
      className={`transition-colors duration-150 ${
        isSelected
          ? 'bg-zinc-100/90 dark:bg-[#222736] font-medium'
          : isClickable
          ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#222736]'
          : isZebra
          ? 'odd:bg-white odd:dark:bg-[#161922] even:bg-zinc-50/40 even:dark:bg-[#1D212C] hover:bg-zinc-50/80 dark:hover:bg-[#222736]'
          : 'hover:bg-zinc-50/70 dark:hover:bg-[#222736]'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
  align = 'left',
  width,
  sortable = false,
  ...props
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      scope="col"
      style={width ? { width, minWidth: width } : undefined}
      className={`px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider whitespace-nowrap align-middle select-none ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
  align = 'left',
  isNumeric = false,
  width,
  ...props
}) {
  const alignClass =
    align === 'right' || isNumeric
      ? 'text-right tabular-nums'
      : align === 'center'
      ? 'text-center'
      : 'text-left';

  return (
    <td
      style={width ? { width, minWidth: width } : undefined}
      className={`px-4 py-3 text-zinc-700 dark:text-[#E6E8EE] whitespace-nowrap align-middle font-medium text-[13px] md:text-sm ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableToolbar({ children, className = '', ...props }) {
  return (
    <div
      className={`p-4 border-b border-zinc-200/80 dark:border-[#2A2F3D] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161922] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TableEmpty({
  colSpan = 1,
  icon: Icon = FileX,
  title = 'No records found',
  description = 'Try adjusting your search or filters to find what you are looking for.',
  action,
  className = ''
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-12 text-center ${className}`}>
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-zinc-500 dark:text-[#A0A6B5]">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#1D212C] flex items-center justify-center mb-3 text-zinc-400 dark:text-[#6B7184]">
            <Icon size={24} />
          </div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] mb-1">{title}</p>
          {description && <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mb-4">{description}</p>}
          {action && <div className="mt-1">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  hasActions = false
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-zinc-100 dark:border-[#2A2F3D]">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3.5">
              <div
                className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded"
                style={{
                  width: cIdx === 0 ? '40%' : cIdx === columns - 1 && hasActions ? '24px' : '75%'
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemName = 'records',
  className = ''
}) {
  const from = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const to = Math.min(currentPage * pageSize, totalItems);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  if (totalItems === 0) return null;

  return (
    <div
      className={`px-4 py-3 sm:px-6 border-t border-zinc-200/80 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] whitespace-nowrap">
        Showing <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{from}–{to}</span> of{' '}
        <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{totalItems.toLocaleString()}</span> {itemName}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] sm:hidden">
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => canPrev && onPageChange && onPageChange(currentPage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            <ChevronLeft size={14} className="mr-1" /> Prev
          </button>
          <button
            type="button"
            onClick={() => canNext && onPageChange && onPageChange(currentPage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            Next <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-first Card view for small datasets or 5 or fewer columns on mobile
 */
export function TableCardView({
  data = [],
  titleKey,
  subtitleKey,
  statusKey,
  fields = [],
  actions,
  onRowClick,
  className = ''
}) {
  if (!data || data.length === 0) return null;

  return (
    <div className={`space-y-3 sm:hidden ${className}`}>
      {data.map((item, idx) => {
        const title = typeof titleKey === 'function' ? titleKey(item) : item[titleKey];
        const subtitle = typeof subtitleKey === 'function' ? subtitleKey(item) : item[subtitleKey];
        const status = typeof statusKey === 'function' ? statusKey(item) : item[statusKey];

        return (
          <div
            key={item.id || idx}
            onClick={() => onRowClick && onRowClick(item)}
            className={`bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-4 shadow-2xs space-y-3 ${
              onRowClick ? 'cursor-pointer active:bg-zinc-50 dark:active:bg-[#222736]' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">
              <div>
                <p className="font-semibold text-sm text-zinc-900 dark:text-[#E6E8EE]">{title || `#${idx + 1}`}</p>
                {subtitle && <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">{subtitle}</p>}
              </div>
              {status && <div className="shrink-0">{status}</div>}
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              {fields.map((f, fIdx) => {
                const label = f.label || f.header || f.key;
                const val = f.render ? f.render(item[f.key], item, idx) : item[f.key];
                return (
                  <div key={fIdx} className={f.colSpan === 2 ? 'col-span-2' : ''}>
                    <dt className="text-[11px] font-semibold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">{label}</dt>
                    <dd className={`font-medium text-zinc-800 dark:text-[#E6E8EE] mt-0.5 ${f.isNumeric ? 'tabular-nums' : ''}`}>{val ?? '—'}</dd>
                  </div>
                );
              })}
            </dl>

            {actions && (
              <div className="pt-2 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-end gap-2">
                {typeof actions === 'function' ? actions(item, idx) : actions}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Table;
