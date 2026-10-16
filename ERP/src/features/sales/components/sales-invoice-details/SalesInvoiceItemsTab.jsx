import React from 'react';
import { ShoppingCart, ChevronDown, ChevronRight, Package } from 'lucide-react';

export default function SalesInvoiceItemsTab({
  lineItems = [],
  expandedRows = {},
  toggleRow,
  fmt,
  isEmpty,
  EmptyState
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in">
      {isEmpty(lineItems) ? (
        <EmptyState icon={<ShoppingCart size={48} />} title="No Line Items" desc="There are no line items recorded for this invoice." />
      ) : (
        <div className="w-full overflow-x-auto min-w-0 custom-scrollbar rounded-lg border border-zinc-200">
          <table className="w-full min-w-[640px] sm:min-w-full text-left text-sm" aria-label="Invoice Line Items">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10">
              <tr>
                <th scope="col" className="p-4 w-10 text-center"></th>
                <th scope="col" className="p-4 w-1/3">Item Name</th>
                <th scope="col" className="p-4 hidden sm:table-cell">Item Code</th>
                <th scope="col" className="p-4 hidden lg:table-cell">SKU</th>
                <th scope="col" className="p-4 hidden lg:table-cell">HSN/SAC</th>
                <th scope="col" className="p-4 hidden lg:table-cell">GST</th>
                <th scope="col" className="p-4 text-right">Qty</th>
                <th scope="col" className="p-4 hidden sm:table-cell">Unit</th>
                <th scope="col" className="p-4 text-right">Price</th>
                <th scope="col" className="p-4 text-right hidden sm:table-cell">Disc %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {lineItems.map((item, idx) => {
                const isExpanded = !!expandedRows[idx];
                const invData = item.inventory;

                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => toggleRow(idx)}
                      className={`hover:bg-zinc-50/80 cursor-pointer transition-colors group ${isExpanded ? 'bg-zinc-50' : ''}`}
                    >
                      <td className="p-4 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-zinc-900 truncate max-w-[120px] sm:max-w-[200px]" title={item.itemName || item.name}>
                          {item.itemName || item.name || '-'}
                        </p>
                      </td>
                      <td className="p-4 hidden sm:table-cell font-mono text-xs font-semibold text-zinc-700">
                        {item.itemCode || item.code || '-'}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">{item.sku || '-'}</td>
                      <td className="p-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">{item.hsnCode || item.hsnSac || '-'}</td>
                      <td className="p-4 hidden lg:table-cell text-zinc-600">{item.gstSlab || `${item.gstRate || 0}%`}</td>
                      <td className="p-4 text-right font-bold text-zinc-900">{item.quantity}</td>
                      <td className="p-4 hidden sm:table-cell text-zinc-500">{item.unit || 'PCS'}</td>
                      <td className="p-4 text-right font-mono">₹{fmt(item.unitPrice || item.price)}</td>
                      <td className="p-4 text-right hidden sm:table-cell text-zinc-500">
                        {item.discountPercentage || item.discount || 0}%
                      </td>
                    </tr>

                    {/* Expanded Inline Details */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={10} className="p-0 border-t border-zinc-100">
                          <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                {/* Item Details */}
                                <div className="space-y-3">
                                  <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Item Details</h4>
                                  <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
                                    <div className="col-span-2">
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Name</dt>
                                      <dd className="text-sm font-medium text-zinc-900">{item.itemName || item.name || '-'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item ID</dt>
                                      <dd className="text-xs font-mono text-zinc-700">{item.itemId || 'N/A'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Code</dt>
                                      <dd className="text-sm font-mono font-medium text-zinc-900">{item.itemCode || item.code || 'N/A'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">SKU</dt>
                                      <dd className="text-sm font-mono text-zinc-700">{item.sku || 'N/A'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">HSN/SAC</dt>
                                      <dd className="text-sm font-mono text-zinc-700">{item.hsnCode || item.hsnSac || 'N/A'}</dd>
                                    </div>
                                    <div className="col-span-2">
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</dt>
                                      <dd className="text-sm text-zinc-700">{item.description || 'N/A'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GST Slab</dt>
                                      <dd className="text-sm font-medium text-zinc-900">{item.gstSlab || `${item.gstRate || 0}%`}</dd>
                                    </div>
                                  </dl>
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-3">
                                  <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Additional Information</h4>
                                  <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Expiry Date</dt>
                                      <dd className="text-sm text-zinc-700">{item.expiryDate || 'N/A'}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cost Center</dt>
                                      <dd className="text-sm text-zinc-700">{item.costCenter || 'N/A'}</dd>
                                    </div>
                                    <div className="col-span-2">
                                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Line Remarks</dt>
                                      <dd className="text-sm text-zinc-700">{item.lineRemarks || item.remarks || 'N/A'}</dd>
                                    </div>
                                  </dl>
                                </div>
                              </div>

                              <div className="space-y-6">
                                {/* Pricing & Tax */}
                                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                  <div className="grid grid-cols-2 divide-x divide-zinc-100">
                                    {/* Pricing */}
                                    <div className="p-5 space-y-4">
                                      <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Pricing</h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">Quantity</dt>
                                          <dd className="text-xs font-bold text-zinc-900">{item.quantity} {item.unit || 'PCS'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">Unit Price</dt>
                                          <dd className="text-xs font-mono font-medium text-zinc-900">₹{fmt(item.unitPrice || item.price)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">Discount</dt>
                                          <dd className="text-xs font-medium text-zinc-700">{item.discountPercentage || item.discount || 0}% (₹{fmt(item.discountAmount)})</dd>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-zinc-100">
                                          <dt className="text-xs font-bold text-zinc-700">Taxable Amt</dt>
                                          <dd className="text-sm font-mono font-bold text-zinc-900">₹{fmt(item.taxableAmount)}</dd>
                                        </div>
                                      </dl>
                                    </div>

                                    {/* Tax */}
                                    <div className="p-5 space-y-4 bg-zinc-50/50">
                                      <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Tax Details</h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">CGST</dt>
                                          <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.cgst ?? item.cgstAmount ?? 0)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">SGST</dt>
                                          <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.sgst ?? item.sgstAmount ?? 0)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">IGST</dt>
                                          <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.igst ?? item.igstAmount ?? 0)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                          <dt className="text-xs font-medium text-zinc-500">CESS</dt>
                                          <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.cess ?? item.cessAmount ?? 0)}</dd>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-zinc-200 border-dashed">
                                          <dt className="text-xs font-bold text-zinc-700">Tax Amount</dt>
                                          <dd className="text-sm font-mono font-bold text-zinc-900">₹{fmt(item.taxAmount ?? 0)}</dd>
                                        </div>
                                      </dl>
                                    </div>
                                  </div>
                                  <div className="bg-zinc-900 p-4 flex justify-between items-center text-white">
                                    <span className="text-xs font-bold uppercase tracking-widest">Total Amount</span>
                                    <span className="text-lg font-mono font-black text-emerald-400">₹{fmt(item.totalAmount)}</span>
                                  </div>
                                </div>

                                {/* Inventory Card */}
                                <div className="bg-amber-50/30 rounded-xl border border-amber-200 shadow-sm overflow-hidden relative">
                                  <div className="absolute top-0 right-0 p-3">
                                    <div className={`px-2 py-1 text-[7.2px] font-black uppercase tracking-widest rounded shadow-sm border ${!invData ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
                                        invData.inventoryFetchStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                          invData.inventoryFetchStatus === 'FAILED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                            'bg-zinc-100 text-zinc-600 border-zinc-200'
                                      }`}>
                                      {!invData ? 'N/A' : (invData.inventoryFetchStatus || 'UNKNOWN')}
                                    </div>
                                  </div>
                                  <div className="px-5 py-4 border-b border-amber-200/50 bg-amber-50/50">
                                    <h4 className="text-[8.8px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                                      <Package size={14} className="text-amber-600" /> Inventory Information
                                    </h4>
                                  </div>
                                  <div className="p-5">
                                    {!invData ? (
                                      <p className="text-sm font-medium text-amber-700/70 text-center py-2">No inventory information available for this item.</p>
                                    ) : (
                                      <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        <div className="col-span-2">
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Warehouse</dt>
                                          <dd className="text-sm font-semibold text-amber-950">{invData.warehouseName || 'N/A'}</dd>
                                          {invData.warehouseId && <p className="text-[8px] font-mono text-amber-700/50 mt-0.5">{invData.warehouseId}</p>}
                                        </div>
                                        <div className="col-span-2">
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Location</dt>
                                          <dd className="text-sm font-semibold text-amber-950">{invData.locationName || 'N/A'}</dd>
                                          {invData.locationId && <p className="text-[8px] font-mono text-amber-700/50 mt-0.5">{invData.locationId}</p>}
                                        </div>
                                        <div>
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Batch</dt>
                                          <dd className="text-sm font-mono text-amber-900">{invData.batchCode || 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Stock Qty</dt>
                                          <dd className="text-sm font-bold text-amber-950">{invData.stockQuantity ?? 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Reserved Qty</dt>
                                          <dd className="text-sm font-bold text-rose-700">{invData.reservedQuantity ?? 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Available Qty</dt>
                                          <dd className="text-sm font-bold text-emerald-700">{invData.availableQuantity ?? 'N/A'}</dd>
                                        </div>
                                      </dl>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
