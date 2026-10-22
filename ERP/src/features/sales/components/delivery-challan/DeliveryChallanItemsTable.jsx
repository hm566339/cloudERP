import React from 'react';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function DeliveryChallanItemsTable({
  items = [],
  isSourceLoading,
  isReceiptMode,
  selectedWarehouseId,
  locations = [],
  isLoadingStock,
  isLoadingLocations,
  isStatusConfirmed,
  isSubmittingInProgress,
  onLocationChange,
  onQtyChange,
}) {
  return (
    <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
          <Package size={14} className="text-zinc-400 dark:text-[#6B7184]" />
          Dispatch Items
        </h3>
        <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] font-medium">
          Dispatch quantity cannot exceed available stock
        </span>
      </div>

      <div className="w-full overflow-x-auto min-w-0 custom-scrollbar">
        <table className="w-full min-w-[700px] text-left text-xs table-fixed border-collapse" aria-label="Dispatch Items Table">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[9%]" />
            <col className="w-[13%]" />
            <col className="w-[19%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left">Product</th>
              <th scope="col" className="px-2 py-2.5 text-right">Ordered</th>
              <th scope="col" className="px-2 py-2.5 text-right">Delivered</th>
              <th scope="col" className="px-2 py-2.5 text-right">Pending</th>
              <th scope="col" className="px-2 py-2.5 text-right">Avail. Stock</th>
              <th scope="col" className="px-2.5 py-2.5 text-left">Warehouse Location</th>
              <th scope="col" className="px-3 py-2.5 text-right">Dispatch Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
            {isSourceLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-[#6B7184]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-zinc-900 dark:border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">
                      Loading items from {isReceiptMode ? 'linked Sales Invoice' : 'Sales Order'}...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!isSourceLoading && items.length > 0 && items.map((it, idx) => {
              const qtyVal = Number(it.quantityToDispatch) || 0;
              const isExcessOrder = qtyVal > it.available;
              const isExcessStock = it.availableStock !== undefined && it.availableStock !== null && qtyVal > it.availableStock;
              const isNegative = qtyVal < 0;
              const isQtyError = isExcessOrder || isExcessStock || isNegative;
              const isItemDispatched = qtyVal > 0;

              // Locations for this specific product in the selected warehouse
              const itemWh = it.matchedProduct?.warehouses?.find(w => (w.warehouseId || w.id) === selectedWarehouseId);
              const itemLocations = itemWh?.locations || locations;
              const isMissingLocation = isItemDispatched && itemLocations.length > 0 && !it.warehouseLocationId;
              const isDisabled = it.available === 0 || !isStatusConfirmed || (selectedWarehouseId && it.availableStock === 0);

              return (
                <tr 
                  key={it.sourceSalesOrderItemId || idx} 
                  className={isQtyError || isMissingLocation ? 'bg-red-50/40 dark:bg-red-950/20' : 'hover:bg-zinc-50/60 dark:hover:bg-[#222736] transition-colors'}
                >
                  {/* Product info */}
                  <td className="px-3 py-2.5 align-top">
                    <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE] text-xs break-words leading-snug">
                      {it.itemName}
                    </div>
                    {it.description && (
                      <div className="text-[11px] text-zinc-500 dark:text-[#6B7184] mt-0.5 line-clamp-1 break-words" title={it.description}>
                        {it.description}
                      </div>
                    )}

                    {/* Match status & dispatch availability badge */}
                    {it.available === 0 ? (
                      <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-800/40 inline-flex items-center gap-1.5 mt-1.5">
                        <AlertCircle size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>This item has already been fully dispatched or reserved.</span>
                      </div>
                    ) : isLoadingStock ? (
                      <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] animate-pulse mt-1">Checking stock...</div>
                    ) : it.isMatched ? (
                      <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCircle size={11} className="shrink-0" />
                        <span>Stock matched</span>
                      </div>
                    ) : (
                      <div 
                        className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40 inline-flex items-center gap-1 mt-1 max-w-full" 
                        title={it.itemProductId || 'No ID'}
                      >
                        <AlertCircle size={10} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">Product ID not in stock</span>
                      </div>
                    )}
                  </td>

                  {/* Quantities */}
                  <td className="px-2 py-2.5 text-right font-medium text-zinc-700 dark:text-[#A0A6B5] text-xs align-middle">{fmt(it.ordered)}</td>
                  <td className="px-2 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs align-middle">{fmt(it.delivered)}</td>
                  <td className="px-2 py-2.5 text-right font-bold text-zinc-900 dark:text-[#E6E8EE] text-xs align-middle">{fmt(it.available)}</td>

                  {/* Available Stock */}
                  <td className="px-2 py-2.5 text-right text-xs align-middle">
                    {!selectedWarehouseId ? (
                      <span className="text-zinc-400 dark:text-[#6B7184] text-[11px] italic">Select Wh</span>
                    ) : it.availableStock === 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 leading-tight">
                        0 (Out)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {fmt(it.availableStock)}
                      </span>
                    )}
                  </td>

                  {/* Warehouse Location Dropdown */}
                  <td className="px-2.5 py-2.5 align-middle">
                    {!selectedWarehouseId ? (
                      <span className="text-xs text-zinc-400 dark:text-[#6B7184] italic">Select warehouse</span>
                    ) : isLoadingStock || isLoadingLocations ? (
                      <span className="text-xs text-zinc-400 dark:text-[#6B7184] flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px]">Loading...</span>
                      </span>
                    ) : itemLocations.length === 0 ? (
                      <span className="text-xs text-zinc-400 dark:text-[#6B7184] italic">Default</span>
                    ) : (
                      <select
                        value={it.warehouseLocationId || ''}
                        onChange={(e) => onLocationChange(idx, e.target.value)}
                        disabled={isDisabled || isSubmittingInProgress}
                        className={`w-full px-2 py-1 text-xs rounded-md border outline-none transition-all truncate ${
                          isDisabled
                            ? 'bg-zinc-100 dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-400 dark:text-[#6B7184] cursor-not-allowed'
                            : isMissingLocation
                              ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                              : 'bg-white dark:bg-[#1D212C] border-zinc-300 dark:border-[#2A2F3D] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 text-zinc-800 dark:text-[#E6E8EE]'
                        }`}
                      >
                        <option value="">Select Location *</option>
                        {itemLocations.map(loc => (
                          <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>
                            {loc.locationName || loc.name || loc.locationCode || 'Location'} {loc.availableQuantity !== undefined ? `(Stock: ${loc.availableQuantity})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Dispatch Qty Input */}
                  <td className="px-3 py-2.5 text-right align-middle">
                    <div className="flex flex-col items-end">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(it.available, it.availableStock !== undefined ? it.availableStock : it.available)}
                        step="any"
                        disabled={isDisabled || isSubmittingInProgress || it.available === 0}
                        value={it.available === 0 ? 0 : (it.quantityToDispatch === 0 && it.quantityToDispatch.toString() !== "0" ? '' : it.quantityToDispatch)}
                        onChange={(e) => onQtyChange(idx, e.target.value)}
                        className={`w-full max-w-[85px] px-2 py-1 text-right text-xs font-semibold rounded-md border ${
                          (isDisabled || it.available === 0)
                            ? 'bg-zinc-100 dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-400 dark:text-[#6B7184] cursor-not-allowed'
                            : isQtyError 
                              ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' 
                              : 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] border-zinc-300 dark:border-[#2A2F3D] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
                        } outline-none transition-all`}
                      />
                      {it.available === 0 ? (
                        <div className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5 leading-tight text-right break-words max-w-[85px]">
                          Fully dispatched
                        </div>
                      ) : isExcessStock ? (
                        <div className="text-[9px] text-red-600 dark:text-red-400 font-semibold mt-0.5 leading-tight text-right break-words max-w-[85px]">
                          &gt; Stock ({it.availableStock})
                        </div>
                      ) : isExcessOrder ? (
                        <div className="text-[9px] text-red-600 dark:text-red-400 font-semibold mt-0.5 leading-tight text-right break-words max-w-[85px]">
                          &gt; Open ({it.available})
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isSourceLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 dark:text-[#6B7184] text-xs">
                  {isReceiptMode ? 'No items found in linked Sales Invoice.' : 'No items found in this Sales Order.'}
                </td>
              </tr>
            )}

            {!isSourceLoading && items.length > 0 && items.every(it => it.available === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-zinc-500 dark:text-[#A0A6B5] font-medium bg-zinc-50/50 dark:bg-[#1D212C] text-xs">
                  All items have already been completely delivered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
