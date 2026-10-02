import React from 'react';
import { Filter, X } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

/**
 * Collapsible Advanced Filters panel supporting grouped filter fields.
 */
export default function DataTableAdvancedFilters({
  isOpen,
  onClose,
  groups = [],
  filterValues = {},
  onFilterChange
}) {
  if (!isOpen || !Array.isArray(groups) || groups.length === 0) return null;

  return (
    <div className="pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={13} className="text-zinc-500" />
            Extended Search & Filter Options
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
          >
            <X size={14} />
            Close
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
          {groups.map((group, gIdx) => {
            const isFullWidth = group.fullWidth || group.colSpan === 'full' || group.colSpan === 2 || (group.fields && group.fields.length > 4);
            const title = group.group || group.groupTitle || group.title;

            return (
              <div
                key={title || gIdx}
                className={`space-y-3 bg-white p-3.5 rounded-lg border border-zinc-200/60 shadow-2xs ${
                  isFullWidth ? 'md:col-span-2' : ''
                }`}
              >
                {title && (
                  <h4 className="text-[9.6px] font-bold text-zinc-800 border-b border-zinc-100 pb-1.5">
                    {title}
                  </h4>
                )}

                <div
                  className={`grid gap-3 ${
                    group.gridCols
                      ? group.gridCols
                      : isFullWidth
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {(group.fields || []).map((field) => {
                    const fieldKey = field.key || field.id;
                    const value = filterValues[fieldKey] !== undefined ? filterValues[fieldKey] : '';

                    const handleFieldChange = (e) => {
                      const val = e.target.value;
                      if (onFilterChange) {
                        onFilterChange(fieldKey, val);
                      }
                    };

                    if (field.type === 'select') {
                      return (
                        <div key={fieldKey}>
                          <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">
                            {field.label}
                          </label>
                          <CustomSelect
                            value={value !== null && value !== undefined ? String(value) : ''}
                            onChange={handleFieldChange}
                            searchable={field.searchable || false}
                            buttonClassName="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                          >
                            <option value="">{field.placeholder || 'Select...'}</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </CustomSelect>
                        </div>
                      );
                    }

                    return (
                      <div key={fieldKey}>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">
                          {field.label}
                        </label>
                        <input
                          type={field.type || 'text'}
                          placeholder={field.placeholder || field.label}
                          value={value}
                          onChange={handleFieldChange}
                          className={`w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none ${
                            field.uppercase ? 'uppercase' : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
