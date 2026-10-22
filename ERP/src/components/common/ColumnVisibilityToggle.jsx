import React, { useState, useRef, useEffect } from 'react';
import { Columns, Check } from 'lucide-react';

export default function ColumnVisibilityToggle({ columns = [], allColumns = [], visibleColumns, setVisibleColumns, onChange, onToggle, buttonClassName, className = "" }) {
  const actualColumns = (columns && columns.length > 0) ? columns : (allColumns || []);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const safeVisibleColumns = Array.isArray(visibleColumns) ? visibleColumns : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (colId) => {
    // If a custom onToggle handler is passed (that isn't a direct setVisibleColumns state setter)
    if (onToggle && onToggle !== setVisibleColumns && onToggle !== onChange) {
      onToggle(colId);
    } else {
      const updateFn = onChange || setVisibleColumns || onToggle;
      if (typeof updateFn === 'function') {
        updateFn(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.includes(colId) 
            ? safePrev.filter(id => id !== colId) 
            : [...safePrev, colId];
        });
      }
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || "btn-secondary flex items-center gap-2"}
        title="Toggle Columns"
      >
        <Columns size={15} /> Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl dark:shadow-2xl bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1 max-h-96 overflow-y-auto custom-scrollbar" role="menu" aria-orientation="vertical">
            {actualColumns.map((col, index) => {
              const colKey = col?.id || col?.accessorKey || (typeof col?.header === 'string' ? col.header : '') || String(index);
              const label = col?.label || (typeof col?.header === 'string' ? col.header : 'Column ' + index);
              const isVisible = safeVisibleColumns.includes(colKey);
              return (
                <button
                  key={colKey}
                  type="button"
                  onClick={() => toggleColumn(colKey)}
                  className="w-full text-left px-3 py-2 text-[10.4px] font-medium text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100/80 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-[#E6E8EE] rounded-md transition-colors flex items-center gap-2.5 cursor-pointer"
                  role="menuitem"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isVisible ? 'bg-zinc-900 dark:bg-[#4C8DFF] border-zinc-900 dark:border-[#4C8DFF]' : 'border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#161922]'}`}>
                    {isVisible && <Check size={12} className="text-white stroke-[3]" />}
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
