import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useCreateSalesOrderFromProformaInvoiceMutation } from '../../../api/sales-crm';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

export default function SalesOrderFromPiModal({
  isOpen,
  onClose,
  companyId,
  proformaInvoice,
  onSuccess
}) {
  const dispatch = useAppDispatch();
  const [createSO, { isLoading }] = useCreateSalesOrderFromProformaInvoiceMutation();

  const [items, setItems] = useState([]);
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);



  useEffect(() => {
    if (isOpen && proformaInvoice) {
      if (proformaInvoice.items) {
        setItems(proformaInvoice.items.map(item => ({
          ...item,
          soQuantity: item.remainingQuantity || 0
        })));
      }
    }
  }, [isOpen, proformaInvoice]);

  const handleQuantityChange = (index, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], soQuantity: value };
      return newItems;
    });
  };

  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let cess = 0;

    items.forEach(item => {
      const qty = parseFloat(item.soQuantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discPct = parseFloat(item.discountPercent) || 0;

      const grossAmount = qty * price;
      const discAmt = (grossAmount * discPct) / 100;
      const taxable = grossAmount - discAmt;

      subtotal += grossAmount;
      discount += discAmt;

      const cgstAmt = (taxable * (parseFloat(item.cgstRate) || 0)) / 100;
      const sgstAmt = (taxable * (parseFloat(item.sgstRate) || 0)) / 100;
      const igstAmt = (taxable * (parseFloat(item.igstRate) || 0)) / 100;
      const cessAmt = (taxable * (parseFloat(item.cessRate) || 0)) / 100;

      cgst += cgstAmt;
      sgst += sgstAmt;
      igst += igstAmt;
      cess += cessAmt;
      tax += (cgstAmt + sgstAmt + igstAmt + cessAmt);
    });

    const freight = parseFloat(proformaInvoice?.freightCharges) || 0;
    const other = parseFloat(proformaInvoice?.otherCharges) || 0;

    const totalBeforeRoundOff = (subtotal - discount) + freight + other + tax;
    const grandTotal = Math.round(totalBeforeRoundOff);
    const roundOff = grandTotal - totalBeforeRoundOff;

    return {
      subtotal,
      discount,
      taxableAmount: subtotal - discount,
      cgst,
      sgst,
      igst,
      cess,
      tax,
      freight,
      other,
      roundOff,
      grandTotal
    };
  }, [items, proformaInvoice]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const payloadItems = items
        .filter(item => item.soQuantity > 0)
        .map(item => ({
          piItemId: item.id,
          quantity: item.soQuantity
        }));

      if (payloadItems.length === 0) {
        dispatch(addAlert({ type: 'warning', message: 'Please select at least one item to convert to Sales Order.' }));
        return;
      }

      const invalidItem = items.find(i => i.soQuantity > (i.remainingQuantity || 0));
      if (invalidItem) {
        dispatch(addAlert({ type: 'error', message: `Quantity for ${invalidItem.itemName} cannot exceed remaining quantity (${invalidItem.remainingQuantity}).` }));
        return;
      }

      const payload = {
        proformaInvoiceId: proformaInvoice.id,
        companyId,
        data: {
          soDate,
          items: payloadItems
        }
      };

      await createSO(payload).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Sales Order created successfully.' }));

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      dispatch(addAlert({ type: 'error', message: error?.data?.message || 'An error occurred while creating Sales Order.' }));
    }
  };

  if (!isOpen || !proformaInvoice) return null;

  const currency = proformaInvoice.piCurrency || proformaInvoice.currency || 'INR';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
        <div className="bg-white shadow-2xl w-full h-full flex flex-col overflow-hidden">

          <div className="flex flex-col flex-none">
            <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-800">Create Sales Order</h2>
              <div className="text-xs text-zinc-500 font-medium ml-4 truncate">Create a sales order from Proforma Invoice: {proformaInvoice.piNumber}</div>
              <button type="button" onClick={onClose} className="p-1.5 ml-auto text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <form id="so-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs min-h-0">
            {/* ── MAIN WORKSPACE: LEFT FORM (31%) | RIGHT ITEMS (69%) ── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-white">

              {/* ── LEFT COLUMN ── */}
              <div className="w-full lg:w-[31%] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
                {/* SOURCE DOCUMENT CARD */}
                <div className="flex-none border border-zinc-200 rounded-lg bg-white shadow-2xs overflow-hidden">
                  <div className="p-2.5 flex items-center justify-between border-b border-zinc-100">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Source PI</div>
                        <div className="font-mono text-xs font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                          <FileText size={12} className="text-zinc-400" />
                          {proformaInvoice.piNumber}
                        </div>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-zinc-200"></div>
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">PI Status</div>
                        <div className="mt-0.5">
                          <span className="px-2 py-0.5 text-[8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {proformaInvoice.status}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-zinc-200"></div>
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Quotation</div>
                        <div className="text-xs font-medium text-zinc-700 mt-0.5">
                          {proformaInvoice.quotation?.quotationNumber || proformaInvoice.sourceQuotationNumber || 'Direct PI'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-2 bg-amber-50/50 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-[8.8px] text-amber-800 font-medium leading-snug">Partial conversion supported. Only the remaining PI quantity can be converted to this Sales Order.</span>
                  </div>
                </div>

                {/* CUSTOMER DETAILS */}
                <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Customer Details</h3>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Customer *</label>
                      <input
                        type="text"
                        className="input-field w-full h-8 text-[8.8px] bg-zinc-50 border-transparent text-zinc-700 cursor-not-allowed font-medium"
                        value={proformaInvoice.customerName || ''}
                        readOnly
                      />
                    </div>
                    {proformaInvoice.billingAddressId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Billing Address</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from PI</div>
                      </div>
                    )}
                    {proformaInvoice.deliveryAddressId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Delivery Address</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from PI</div>
                      </div>
                    )}
                    {proformaInvoice.placeOfSupplyStateId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Place of Supply</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from PI</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SALES ORDER DETAILS */}
                <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Sales Order Details</h3>
                  </div>
                  <div className="space-y-2 pt-1">

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Sales Order Date *</label>
                        <input
                          type="date"
                          className="input-field w-full h-8 text-[8.8px]"
                          value={soDate}
                          onChange={(e) => setSoDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white">



                <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Items</h3>
                    <span className="text-[8.8px] font-medium text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-[36px] z-10 flex-none pr-1">
                  <div className="grid grid-cols-[18%_13%_8%_8%_8%_9%_7%_8%_7%_7%_7%] w-full min-w-0">
                    <div className="p-1.5 font-semibold truncate text-[8.8px]">Item</div>
                    <div className="p-1.5 font-semibold truncate text-[8.8px]">Description</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">PI Qty</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Converted</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Remaining</div>
                    <div className="p-1.5 font-bold text-right truncate text-[8.8px] text-primary">SO Qty</div>
                    <div className="p-1.5 font-semibold text-center truncate text-[8.8px]">Unit</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Rate</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Disc %</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Tax</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Line Total</div>
                  </div>
                </div>

                <div className="flex-none min-h-[112px]">
                  <div className="flex flex-col divide-y divide-zinc-100">
                    {items.map((item, index) => {
                      const isExceeding = item.soQuantity > (item.remainingQuantity || 0);
                      const qty = parseFloat(item.soQuantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      const discPct = parseFloat(item.discountPercent) || 0;
                      const grossAmount = qty * price;
                      const discAmt = (grossAmount * discPct) / 100;
                      const taxable = grossAmount - discAmt;
                      const totalTaxRate = (parseFloat(item.cgstRate) || 0) + (parseFloat(item.sgstRate) || 0) + (parseFloat(item.igstRate) || 0) + (parseFloat(item.cessRate) || 0);
                      const taxAmt = (taxable * totalTaxRate) / 100;
                      const lineTotal = taxable + taxAmt;

                      return (
                        <div key={item.id} className="grid grid-cols-[18%_13%_8%_8%_8%_9%_7%_8%_7%_7%_7%] w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border items-center py-1">
                          <div className="p-1.5 min-w-0 font-medium text-zinc-900 truncate text-[8.8px]" title={item.itemName}>{item.itemName}</div>
                          <div className="p-1.5 min-w-0 text-zinc-500 truncate text-[8.8px]" title={item.description}>{item.description || '—'}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-600 text-[8.8px]">{item.quantity}</div>
                          <div className="p-1.5 min-w-0 text-right text-emerald-600 font-medium text-[8.8px]">{item.convertedQuantity || 0}</div>
                          <div className="p-1.5 min-w-0 text-right font-bold text-zinc-800 text-[8.8px]">{item.remainingQuantity || 0}</div>
                          <div className="p-1 min-w-0 relative">
                            <input
                              type="number"
                              min="0"
                              max={item.remainingQuantity || 0}
                              step="0.01"
                              value={item.soQuantity}
                              onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                              className={`w-full h-7 px-1.5 text-[8.8px] text-right font-bold border rounded focus:outline-none focus:ring-1 focus:ring-primary ${isExceeding ? 'border-red-500 bg-red-50 text-red-700' : 'border-zinc-300 bg-white'}`}
                              disabled={(item.remainingQuantity || 0) <= 0}
                            />
                          </div>
                          <div className="p-1.5 min-w-0 text-center text-zinc-600 text-[8.8px] uppercase">{item.unit || 'PCS'}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-700 text-[8.8px]">{item.unitPrice}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-600 text-[8.8px]">{item.discountPercent || 0}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-700 text-[8.8px]">{taxAmt.toFixed(2)}</div>
                          <div className="p-1.5 min-w-0 text-right font-semibold text-zinc-900 text-[8.8px]">{lineTotal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SALES ORDER SUMMARY */}
                <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
                  <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col justify-between shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Sales Order Summary</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Sub Total</span>
                        <span className="font-semibold text-zinc-800">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.subtotal)}
                        </span>
                      </div>

                      {calculatedTotals.discount > 0 && (
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-emerald-600 font-medium">Discount</span>
                          <span className="font-semibold text-emerald-600">
                            -{new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Taxable Amount</span>
                        <span className="font-semibold text-zinc-800">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.taxableAmount)}
                        </span>
                      </div>

                      {calculatedTotals.cgst > 0 && (
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-500 font-medium ml-4">CGST</span>
                          <span className="font-semibold text-zinc-600">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.cgst)}
                          </span>
                        </div>
                      )}

                      {calculatedTotals.sgst > 0 && (
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-500 font-medium ml-4">SGST</span>
                          <span className="font-semibold text-zinc-600">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.sgst)}
                          </span>
                        </div>
                      )}

                      {calculatedTotals.igst > 0 && (
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-500 font-medium ml-4">IGST</span>
                          <span className="font-semibold text-zinc-600">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.igst)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Freight Charges</span>
                        <span className="font-semibold text-zinc-800">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.freight)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Other Charges</span>
                        <span className="font-semibold text-zinc-800">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.other)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Round Off</span>
                        <span className="text-zinc-700 font-medium">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.roundOff)}
                        </span>
                      </div>

                      <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-900">Grand Total</span>
                        <span className="text-base font-black text-primary">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.grandTotal)}
                        </span>
                      </div>




                    </div>
                  </div>
                </div>

              </div>

            </div>
          </form>

          {/* ── BOTTOM FIXED FOOTER ── */}
          <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                form="so-form"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Create Sales Order</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>, document.body
  );
}
