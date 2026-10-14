import React from 'react';
import { Layers } from 'lucide-react';
import { formatModuleName } from './planUiUtils';

export default function ModuleSelector({
  availableModules = [],
  selectedModuleIds = [],
  onToggleModule,
  onSelectAll,
  onClearAll,
  error,
}) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-zinc-700" />
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Included Modules ({selectedModuleIds.length} selected)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-zinc-800 hover:text-zinc-950 font-bold hover:underline"
          >
            Select All
          </button>
          <span className="text-zinc-300">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-zinc-500 hover:text-zinc-700 hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
        {availableModules.length > 0 ? (
          availableModules.map((mod) => {
            const isChecked = selectedModuleIds.includes(mod.id);
            return (
              <label
                key={mod.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-bold shadow-2xs'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleModule(mod.id)}
                  className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 accent-zinc-900"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs block truncate">{formatModuleName(mod.name)}</span>
                  <span className="font-mono text-[10px] text-zinc-400 block uppercase">{mod.name}</span>
                </div>
              </label>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-4 text-xs text-zinc-400">
            Loading active modules from server...
          </div>
        )}
      </div>
    </div>
  );
}
