import React from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import DateRangeFilter from './DateRangeFilter';
import CustomSelect from './CustomSelect';

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
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Filter size={18} className="text-indigo-500" />
            Advanced Filters
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
          {sidebarFilters.map(filter => (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">{filter.label}</label>
              
              {['text', 'number', 'date'].includes(filter.type) ? (
                <input
                  type={filter.type}
                  placeholder={`Any ${filter.label}...`}
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400"
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
                  buttonClassName="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                  dropdownClassName="bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 max-h-[200px] overflow-y-auto"
                />
              )}
            </div>
          ))}
          {sidebarFilters.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-10">
              No advanced filters available.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (onClearAll) onClearAll();
            }}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
