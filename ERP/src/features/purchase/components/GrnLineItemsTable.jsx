import React from 'react';
import { Package, Info, Loader2 } from 'lucide-react';
import CustomDatePicker from '../../../components/common/CustomDatePicker';
import CustomLocationCellSelect from './CustomLocationCellSelect';

export default function GrnLineItemsTable({
  isLoadingPo = false,
  itemReceipts = [],
  formErrors = {},
  locations = [],
  loadingLocations = false,
  onItemChange,
}) {
  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]/80 p-4 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-zinc-400" />
          <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
            Receipt Items
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Info size={13} className="text-zinc-400" />
          <span>Quantities: Accepted + Rejected must not exceed Received.</span>
        </div>
      </div>

      {isLoadingPo ? (
        <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
          <p className="text-xs">Loading Purchase Order item details...</p>
        </div>
      ) : itemReceipts.length === 0 ? (
        <div className="py-8 text-center text-zinc-400 text-xs italic">
          No items found for this Purchase Order.
        </div>
      ) : (
        <div className="w-full max-w-full overflow-hidden border border-zinc-200/80 rounded-xl shadow-2xs">
          <table className="table-fixed w-full text-left border-collapse">
            <colgroup>
              <col className="w-[30px]" />
              <col className="min-w-[140px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[62px]" />
              <col className="w-[78px]" />
              <col className="w-[78px]" />
              <col className="w-[78px]" />
              <col className="w-[45px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[98px]" />
              <col className="w-[105px]" />
              <col className="w-[130px]" />
            </colgroup>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                <th className="py-2.5 px-1.5 text-center">#</th>
                <th className="py-2.5 px-2">Item</th>
                <th className="py-2.5 px-1 text-right">Ordered</th>
                <th className="py-2.5 px-1 text-right">Prev Rcvd</th>
                <th className="py-2.5 px-1 text-right">Pending</th>
                <th className="py-2.5 px-1 text-right text-zinc-900">Rcvd Qty *</th>
                <th className="py-2.5 px-1 text-right text-emerald-700">Accepted *</th>
                <th className="py-2.5 px-1 text-right text-rose-700">Rejected</th>
                <th className="py-2.5 px-1 text-center">Unit</th>
                <th className="py-2.5 px-1">Batch</th>
                <th className="py-2.5 px-1">Serial</th>
                <th className="py-2.5 px-1">Expiry</th>
                <th className="py-2.5 px-1">Location</th>
                <th className="py-2.5 px-1.5">Notes / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {itemReceipts.map((row, idx) => {
                const rcvdErr = formErrors[`${idx}_receivedQuantity`];
                const acceptedErr = formErrors[`${idx}_acceptedQuantity`];
                const rejectedErr = formErrors[`${idx}_rejectedQuantity`];
                const reasonErr = formErrors[`${idx}_rejectionReason`];
                const isRejected = (Number(row.rejectedQuantity) || 0) > 0;

                return (
                  <tr key={row.key} className="hover:bg-zinc-50/50 transition-colors">
                    {/* # */}
                    <td className="py-2 px-1 text-center text-[11px] font-mono text-zinc-400">
                      {idx + 1}
                    </td>

                    {/* Item */}
                    <td className="py-2 px-2">
                      <p className="font-semibold text-zinc-800 text-[11.5px] leading-tight line-clamp-2" title={row.itemName}>
                        {row.itemName}
                      </p>
                      {row.itemCode && (
                        <span className="font-mono text-[9px] text-zinc-400">
                          {row.itemCode}
                        </span>
                      )}
                    </td>

                    {/* Ordered */}
                    <td className="py-2 px-1 text-right font-mono text-[11px] text-zinc-600">
                      {row.orderedQuantity.toLocaleString()}
                    </td>

                    {/* Prev Rcvd */}
                    <td className="py-2 px-1 text-right font-mono text-[11px] text-zinc-400">
                      {row.previouslyReceivedQuantity.toLocaleString()}
                    </td>

                    {/* Pending */}
                    <td className="py-2 px-1 text-right font-mono text-[11px] font-bold text-amber-700">
                      {row.pendingQuantity.toLocaleString()}
                    </td>

                    {/* Received Qty */}
                    <td className="py-1 px-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={row.pendingQuantity}
                        className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 border dark:border-border-dark rounded-md outline-none focus:ring-1 focus:ring-zinc-900/10 ${
                          rcvdErr ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-zinc-300 focus:border-zinc-500 text-zinc-900'
                        }`}
                        value={row.receivedQuantity}
                        onChange={(e) => onItemChange(idx, 'receivedQuantity', e.target.value)}
                        title={rcvdErr}
                      />
                      {rcvdErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{rcvdErr}</p>}
                    </td>

                    {/* Accepted Qty */}
                    <td className="py-1 px-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={row.receivedQuantity}
                        className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 border dark:border-border-dark rounded-md outline-none focus:ring-1 focus:ring-emerald-500/20 ${
                          acceptedErr ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-emerald-300 text-emerald-700 focus:border-emerald-500'
                        }`}
                        value={row.acceptedQuantity}
                        onChange={(e) => onItemChange(idx, 'acceptedQuantity', e.target.value)}
                        title={acceptedErr}
                      />
                      {acceptedErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{acceptedErr}</p>}
                    </td>

                    {/* Rejected Qty */}
                    <td className="py-1 px-1">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={row.receivedQuantity}
                        className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 border dark:border-border-dark rounded-md outline-none focus:ring-1 focus:ring-rose-500/20 ${
                          rejectedErr || (isRejected && reasonErr) ? 'border-rose-400 bg-rose-50/30 text-rose-700' : isRejected ? 'border-rose-300 text-rose-700' : 'border-zinc-300 text-zinc-600 focus:border-zinc-500'
                        }`}
                        value={row.rejectedQuantity}
                        onChange={(e) => onItemChange(idx, 'rejectedQuantity', e.target.value)}
                        title={rejectedErr}
                      />
                      {rejectedErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{rejectedErr}</p>}
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-1 text-center font-mono text-[10.5px] text-zinc-500">
                      <span className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200/60">
                        {row.unit || 'PCS'}
                      </span>
                    </td>

                    {/* Batch Number */}
                    <td className="py-1 px-1">
                      <input
                        type="text"
                        placeholder="Batch"
                        className="w-full h-8 px-1.5 text-[11px] font-mono bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                        value={row.batchNumber}
                        onChange={(e) => onItemChange(idx, 'batchNumber', e.target.value)}
                      />
                    </td>

                    {/* Serial Number */}
                    <td className="py-1 px-1">
                      <input
                        type="text"
                        placeholder="Serial"
                        className="w-full h-8 px-1.5 text-[11px] font-mono bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                        value={row.serialNumber}
                        onChange={(e) => onItemChange(idx, 'serialNumber', e.target.value)}
                      />
                    </td>

                    {/* Custom Expiry DatePicker */}
                    <td className="py-1 px-1">
                      <CustomDatePicker
                        value={row.expiryDate}
                        onChange={(val) => onItemChange(idx, 'expiryDate', val)}
                        placeholder="Expiry"
                        required={false}
                        compact={true}
                      />
                    </td>

                    {/* Custom Location Dropdown */}
                    <td className="py-1 px-1">
                      <CustomLocationCellSelect
                        value={row.locationId}
                        fallbackName={row.locationName}
                        onChange={(val, locObj) => {
                          onItemChange(idx, 'locationId', val);
                          if (locObj) {
                            onItemChange(idx, 'locationName', locObj.locationName || locObj.locationCode || locObj.name || '');
                          }
                        }}
                        locations={locations}
                        disabled={loadingLocations && !row.locationId && locations.length === 0}
                      />
                    </td>

                    {/* Notes / Rejection Reason */}
                    <td className="py-1 px-1.5">
                      {isRejected ? (
                        <div>
                          <input
                            type="text"
                            placeholder="Rejection reason *"
                            className={`w-full h-8 px-1.5 text-[11px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 border dark:border-border-dark rounded-md outline-none focus:ring-1 ${
                              reasonErr ? 'border-rose-400 bg-rose-50/20 text-rose-700 placeholder-rose-400' : 'border-rose-300 text-rose-700 focus:border-rose-500'
                            }`}
                            value={row.rejectionReason}
                            onChange={(e) => onItemChange(idx, 'rejectionReason', e.target.value)}
                            title={reasonErr}
                          />
                          {reasonErr && <p className="text-[8px] text-rose-500 leading-none mt-0.5 truncate">{reasonErr}</p>}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Notes..."
                          className="w-full h-8 px-1.5 text-[11px] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                          value={row.notes}
                          onChange={(e) => onItemChange(idx, 'notes', e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
