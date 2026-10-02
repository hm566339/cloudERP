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
      className={`px-4 py-3 text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-800 transition-colors group select-none ${width ? `w-[${width}]` : ''} ${className} ${alignClass}`}
      onClick={() => onSort && onSort(field)}
    >
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        <span>{displayText}</span>
        {isSorted ? (
          activeSortOrder === 'asc' ? <ArrowUp size={12} className="text-zinc-900 shrink-0" /> : <ArrowDown size={12} className="text-zinc-900 shrink-0" />
        ) : (
          <ArrowUpDown size={12} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
        )}
      </div>
    </Component>
  );
}
