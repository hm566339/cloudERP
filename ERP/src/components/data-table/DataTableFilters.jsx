import React from 'react';
import CustomSelect from '../common/CustomSelect';

/**
 * Renders quick basic filter inputs in the DataTable toolbar.
 */
export default function DataTableFilters({
  filters = [],
  filterValues = {},
  onFilterChange
}) {
  if (!Array.isArray(filters) || filters.length === 0) return null;

  return (
    <>
      {filters.map((filter) => {
        const filterKey = filter.key || filter.id;
        const value = filterValues[filterKey] !== undefined ? filterValues[filterKey] : '';

        const handleChange = (e) => {
          const val = e.target.value;
          if (onFilterChange) {
            onFilterChange(filterKey, val);
          }
        };

        if (filter.type === 'select') {
          return (
            <div key={filterKey} className={filter.className || ''}>
              {filter.label && (
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  {filter.label}
                </label>
              )}
              <CustomSelect
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={handleChange}
                searchable={filter.searchable || false}
                buttonClassName="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all cursor-pointer"
              >
                {!filter.hideAllOption && (
                  <option value="">{filter.placeholder || `All ${filter.label || 'Options'}`}</option>
                )}
                {(filter.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </CustomSelect>
            </div>
          );
        }

        return (
          <div key={filterKey} className={filter.className || ''}>
            {filter.label && (
              <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                {filter.label}
              </label>
            )}
            <input
              type={filter.type || 'text'}
              placeholder={filter.placeholder || filter.label}
              value={value}
              onChange={handleChange}
              min={filter.min}
              max={filter.max}
              step={filter.step}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-[#4C8DFF]/20 outline-none transition-all"
            />
          </div>
        );
      })}
    </>
  );
}
