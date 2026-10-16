import React from 'react';
import { Filter, X } from 'lucide-react';
import DateRangeFilter from './DateRangeFilter';
import CustomSelect from './CustomSelect';
import Button from './Button';

export default function FilterSidebar({ 
  isOpen, 
  onClose, 
  sidebarFilters, 
  onFilterChange, 
  onClearAll 
}) {
  return (
    <>
      {/* Filter Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-200 ease-out flex flex-col border-l border-zinc-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Filter size={16} className="text-zinc-600" />
            Advanced Filters
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
          {sidebarFilters.map(filter => (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">{filter.label}</label>
              
              {['text', 'number', 'date'].includes(filter.type) ? (
                <input
                  type={filter.type}
                  placeholder={`Any ${filter.label}...`}
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-400"
                />
              ) : filter.type === 'dateRange' ? (
                <DateRangeFilter
                  value={filter.value}
                  onChange={(v) => onFilterChange(filter.key, v)}
                  label={filter.label}
                />
              ) : (
                <CustomSelect 
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  options={!filter.hideAllOption ? [{value: '', label: 'All'}, ...(filter.options || [])] : (filter.options || [])}
                  placeholder="All"
                  searchable={filter.searchable ?? ((filter.options?.length || 0) > 10)}
                  buttonClassName="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all cursor-pointer"
                  dropdownClassName="bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 max-h-[200px] overflow-y-auto"
                />
              )}
            </div>
          ))}
          {sidebarFilters.length === 0 && (
            <div className="text-center text-zinc-400 text-xs mt-10">
              No advanced filters available.
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onClearAll) onClearAll();
            }}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
