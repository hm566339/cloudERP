import React from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { formatModuleName } from './planUiUtils';

export default function ModuleSelector({
  availableModules = [],
  selectedModuleIds = [],
  onToggleModule,
  onSelectAll,
  onClearAll,
  error,
  isLoading = false,
}) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-zinc-700 dark:text-[#A0A6B5]" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">
            Included Modules ({selectedModuleIds.length} selected)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-zinc-800 dark:text-[#4C8DFF] hover:text-zinc-950 dark:hover:underline font-bold hover:underline"
          >
            Select All
          </button>
          <span className="text-zinc-300 dark:text-[#2A2F3D]">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
        {availableModules.length > 0 ? (
          availableModules.map((mod) => {
            const modId = mod.id || mod.moduleId;
            const isChecked = selectedModuleIds.includes(modId);
            const modName = mod.name || mod.moduleName || mod.code || 'Module';
            return (
              <label
                key={modId}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-zinc-100 dark:bg-[#1D212C] border-zinc-300 dark:border-[#4C8DFF]/40 text-zinc-900 dark:text-[#E6E8EE] font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#161922] border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C]/40 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleModule(modId)}
                  className="w-4 h-4 text-zinc-900 rounded border-zinc-300 dark:border-[#2A2F3D] focus:ring-zinc-900 dark:focus:ring-[#4C8DFF] accent-zinc-900 dark:accent-[#4C8DFF]"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs block truncate">{formatModuleName(modName)}</span>
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-[#6B7184] block uppercase">{modName}</span>
                </div>
              </label>
            );
          })
        ) : isLoading ? (
          <div className="col-span-2 text-center py-4 text-xs text-zinc-400 dark:text-[#6B7184] flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-primary" />
            <span>Loading active modules from server...</span>
          </div>
        ) : (
          <div className="col-span-2 text-center py-4 text-xs text-zinc-400 dark:text-[#6B7184]">
            No modules available to select.
          </div>
        )}
      </div>
    </div>
  );
}
