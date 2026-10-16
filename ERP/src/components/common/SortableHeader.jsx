import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export default function SortableHeader({ 
  label, 
  children, 
  field, 
  sortBy, 
  currentSortBy, 
  sortOrder, 
  currentSortOrder, 
  onSort, 
  className = "", 
  width,
  align,
  as: Component = "th" 
}) {
  const activeSortBy = sortBy !== undefined ? sortBy : currentSortBy;
  const activeSortOrder = sortOrder !== undefined ? sortOrder : currentSortOrder;
  const isSorted = activeSortBy === field && activeSortOrder;
  const displayText = children || label;

  const isRightAligned = className?.includes('text-right') || align === 'right';
  const isCenterAligned = className?.includes('text-center') || align === 'center';

  const justifyClass = isRightAligned 
    ? 'justify-end' 
    : isCenterAligned 
    ? 'justify-center' 
    : 'justify-start';

  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';

  return (
    <Component 
      scope={Component === "th" ? "col" : undefined}
      aria-sort={isSorted ? (activeSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={width ? { width, minWidth: width } : undefined}
      className={`px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider cursor-pointer hover:text-zinc-900 transition-colors group select-none whitespace-nowrap ${className} ${alignClass}`}
      onClick={() => onSort && onSort(field)}
    >
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        <span>{displayText}</span>
        {isSorted ? (
          activeSortOrder === 'asc' ? <ArrowUp size={13} className="text-zinc-900 shrink-0" /> : <ArrowDown size={13} className="text-zinc-900 shrink-0" />
        ) : (
          <ArrowUpDown size={13} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
        )}
      </div>
    </Component>
  );
}
