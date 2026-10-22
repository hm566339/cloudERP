import React from 'react';
import { Warehouse, RefreshCw, MapPin } from 'lucide-react';

export default function DeliveryChallanWarehouseSelect({
  selectedWarehouseId,
  onWarehouseChange,
  isSubmittingInProgress,
  isStatusConfirmed,
  validationErrors = [],
  availableWarehouses = [],
  stockWarehouses = [],
  isLoadingStock,
  isLoadingWarehouses,
  isStockError,
  stockQueryError,
  refetchStock,
  selectedWhObj,
  locations = [],
}) {
  return (
    <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label htmlFor="dc-warehouse-select" className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse size={15} className="text-indigo-600 dark:text-[#4C8DFF]" />
            Dispatch Warehouse <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-zinc-500 dark:text-[#6B7184] mt-0.5">
            {stockWarehouses.length > 0 
              ? 'Warehouses matched from stock inventory for this order.'
              : 'Select the source warehouse for dispatching items.'}
          </p>
        </div>

        <div className="w-full sm:w-80">
          {isLoadingStock || isLoadingWarehouses ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 dark:text-[#6B7184] bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
              <div className="w-3.5 h-3.5 border-2 border-zinc-900 dark:border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading stock warehouses...</span>
            </div>
          ) : isStockError && availableWarehouses.length === 0 ? (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-400">
              <span className="truncate">{stockQueryError?.data?.message || 'Failed to load stock'}</span>
              <button
                type="button"
                onClick={() => refetchStock && refetchStock()}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded text-red-700 dark:text-red-400 transition-colors shrink-0"
                title="Retry"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          ) : availableWarehouses.length === 0 ? (
            <div className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg font-medium">
              No warehouses found. Please create a warehouse in Inventory.
            </div>
          ) : (
            <select
              id="dc-warehouse-select"
              value={selectedWarehouseId}
              onChange={onWarehouseChange}
              disabled={isSubmittingInProgress || !isStatusConfirmed}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] font-medium transition-all outline-none ${
                !selectedWarehouseId && validationErrors.length > 0
                  ? 'border-red-400 dark:border-red-500 bg-red-50/30 dark:bg-red-950/30 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-zinc-300 dark:border-[#2A2F3D] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
              }`}
            >
              <option value="">Select Warehouse *</option>
              {availableWarehouses.map(w => {
                const whId = w.warehouseId || w.id;
                const whName = w.warehouseName || w.name || 'Warehouse';
                const stockLabel = w.totalStock !== undefined ? ` — Available Stock: ${w.totalStock}` : '';
                return (
                  <option key={whId} value={whId}>
                    {whName} {w.warehouseCode ? `(${w.warehouseCode})` : ''}{stockLabel}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>

      {selectedWarehouseId && (
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between text-xs text-zinc-500 dark:text-[#6B7184]">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-zinc-400 dark:text-[#6B7184]" />
            {isLoadingStock ? (
              'Loading warehouse locations from stock...'
            ) : selectedWhObj?.locations?.length > 0 ? (
              `${selectedWhObj.locations.length} location${selectedWhObj.locations.length > 1 ? 's' : ''} available in ${selectedWhObj.warehouseName || selectedWhObj.name}`
            ) : locations.length > 0 ? (
              `${locations.length} warehouse location${locations.length > 1 ? 's' : ''} available`
            ) : (
              'Default warehouse storage'
            )}
          </span>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-[#6B7184]">
            ID: {selectedWarehouseId.slice(0, 8)}...
          </span>
        </div>
      )}
    </div>
  );
}
