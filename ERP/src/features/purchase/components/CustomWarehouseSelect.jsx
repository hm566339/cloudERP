import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Building2, ChevronDown, Search, Check } from 'lucide-react';

export default function CustomWarehouseSelect({
  value,
  onChange,
  warehouses = [],
  loading = false,
  hasError = false,
  fallbackName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const availableWarehouses = useMemo(() => {
    if (value && fallbackName && !warehouses.some((w) => w.id === value)) {
      return [{ id: value, warehouseName: fallbackName }, ...warehouses];
    }
    return warehouses;
  }, [warehouses, value, fallbackName]);

  const selectedWarehouse = useMemo(() => {
    return availableWarehouses.find((w) => w.id === value);
  }, [availableWarehouses, value]);

  const filteredWarehouses = useMemo(() => {
    if (!search.trim()) return availableWarehouses;
    const term = search.toLowerCase();
    return availableWarehouses.filter(
      (w) =>
        (w.warehouseName || '').toLowerCase().includes(term) ||
        (w.warehouseCode || '').toLowerCase().includes(term)
    );
  }, [availableWarehouses, search]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
        disabled={loading}
        className={`w-full h-8 px-2.5 bg-white dark:bg-[#1D212C] border rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
          hasError
            ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20'
            : isOpen
            ? 'border-zinc-900 dark:border-[#4C8DFF] ring-2 ring-zinc-900/10 dark:ring-[#4C8DFF]/20'
            : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-zinc-600'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          <Building2 size={13} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
          {selectedWarehouse ? (
            <span className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">
              {selectedWarehouse.warehouseName}
              {selectedWarehouse.warehouseCode && (
                <span className="ml-1.5 font-mono text-[10px] text-zinc-400 dark:text-[#6B7184] font-normal">
                  ({selectedWarehouse.warehouseCode})
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-zinc-400 dark:text-[#6B7184]">
              {loading ? 'Loading warehouses...' : '-- Select Destination Warehouse --'}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 dark:text-[#6B7184] shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180 text-zinc-700 dark:text-[#E6E8EE]' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-[#2A2F3D] flex flex-col">
          {warehouses.length > 3 && (
            <div className="p-2 bg-zinc-50/80 dark:bg-[#161922] border-b border-zinc-100 dark:border-[#2A2F3D]">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter warehouses..."
                  className="w-full h-7 pl-8 pr-2.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] outline-none focus:border-zinc-900 dark:focus:border-[#4C8DFF]"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1 divide-y divide-zinc-50 dark:divide-[#2A2F3D]/50">
            {filteredWarehouses.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-400 dark:text-[#6B7184] text-center italic">
                No matching warehouses
              </div>
            ) : (
              filteredWarehouses.map((wh) => {
                const isSelected = wh.id === value;
                return (
                  <div
                    key={wh.id}
                    onClick={() => {
                      onChange(wh.id);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-zinc-50/90 dark:bg-[#222736] font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{wh.warehouseName}</span>
                        {wh.warehouseCode && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                            {wh.warehouseCode}
                          </span>
                        )}
                      </div>
                      {wh.city && (
                        <p className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5 truncate">{wh.city}</p>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-zinc-900 dark:text-[#4C8DFF] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
