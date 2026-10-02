import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetSalesOrderV2ByIdQuery, useGenerateInvoiceFromSalesOrderMutation } from '../../../api/sales-crm';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  ArrowLeft, FileText, CheckCircle, Mail, Download, Printer, Loader2, X
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getFormattedAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state || addr.stateCode,
    addr.postalCode,
    addr.country
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function InvoicePreviewPage() {
  const { salesOrderId } = useParams();
  const id = salesOrderId;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const companyId =
    (() => { try { return JSON.parse(localStorage.getItem('selected_company'))?.id; } catch { return null; } })() ||
    (() => { try { return JSON.parse(localStorage.getItem('auth_user'))?.companyCode; } catch { return null; } })();

  const getInvoiceUrl = (invId) => {
    if (location.pathname.includes('/accounts/')) {
      return invId ? `/accounts/sales/invoices/${invId}` : `/accounts/sales/invoices`;
    }
    return invId ? `/company/${companyId}/sales-crm/invoices/${invId}` : `/company/${companyId}/sales-crm/invoices`;
  };

  const getSalesOrdersUrl = () => {
    if (location.pathname.includes('/accounts/')) {
      return `/accounts/transactions/sales-orders`;
    }
    return `/company/${companyId}/sales-crm/sales-orders`;
  };

  const handleClose = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(getSalesOrdersUrl());
    }
  };

  const { data: apiResponse, isLoading, isError, error, refetch } = useGetSalesOrderV2ByIdQuery(
    { id, companyId },
    { skip: !id }
  );
  
  const [generateInvoice, { isLoading: isGenerating }] = useGenerateInvoiceFromSalesOrderMutation();

  const handleConfirmInvoice = async () => {
    try {
      const res = await generateInvoice({ salesOrderId: id, companyId }).unwrap();
      const invoiceId = res?.data?.id || res?.id;
      if (invoiceId) {
        dispatch(addAlert({ type: 'success', message: 'Invoice generated successfully!' }));
        navigate(getInvoiceUrl(invoiceId));
      }
    } catch (err) {
      if (err?.status === 409) {
        dispatch(addAlert({ type: 'info', message: 'Invoice already exists for this Sales Order.' }));
        if (err?.data?.data?.id) {
          navigate(getInvoiceUrl(err.data.data.id));
        } else {
          dispatch(addAlert({ type: 'info', message: 'Cannot find existing Invoice ID.' }));
        }
      } else {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to generate invoice.' }));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-50 min-h-screen">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <h2 className="text-lg font-semibold text-zinc-700">Loading Order Details...</h2>
      </div>
    );
  }

  const order = apiResponse?.data?.id ? apiResponse.data : (apiResponse?.id ? apiResponse : null);

  if (isError || !order) {
    const msg = error?.data?.message || 'Failed to fetch Sales Order data.';
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-50 min-h-screen">
        <h2 className="text-lg font-bold text-red-600 mb-2">{msg}</h2>
        <button
          onClick={() => navigate(getSalesOrdersUrl())}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Sales Orders
        </button>
      </div>
    );
  }

  const currency = order.currency || 'INR';
  const fmtCurr = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(val || 0);

  return (
    <div className="h-full w-full flex-1 flex flex-col overflow-hidden text-xs bg-white animate-slide-up relative text-zinc-800 min-h-0">
      <div className="flex flex-col flex-none">
        <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 p-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex flex-col flex-none min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-zinc-800 truncate">Create Invoice</h2>
            </div>
            <div className="text-[8px] text-zinc-500 font-medium truncate ml-6">Create a sales invoice from Sales Order: <span className="font-semibold text-zinc-700">{order.soNumber || order.id}</span></div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
            <div className="flex items-center gap-1.5">
              <label className="text-[8px] font-semibold text-zinc-700 whitespace-nowrap">Invoice No.</label>
              <div className="input-field w-24 h-7 text-[8.8px] text-zinc-400 bg-zinc-50 flex items-center cursor-not-allowed border border-zinc-200 rounded px-2 select-none">
                Auto-generated
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[8px] font-semibold text-zinc-700 whitespace-nowrap">Date *</label>
              <div className="input-field w-28 h-7 text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                {fmtDate(new Date())}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[8px] font-semibold text-zinc-700 whitespace-nowrap">Due Date *</label>
              <div className="input-field w-28 h-7 text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                {fmtDate(order.dueDate || new Date())}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[8px] font-semibold text-zinc-700 whitespace-nowrap">Currency *</label>
              <div className="input-field w-16 h-7 text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                {currency}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors ml-auto xl:ml-0"
              aria-label="Close"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: LEFT FORM | RIGHT ITEMS ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-white">
        
        {/* ── LEFT COLUMN: ALL FORM INPUTS ── */}
        <div className="w-full lg:w-[256px] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
          
          {/* 1. CUSTOMER DETAILS */}
          <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Customer Details</h3>
            </div>
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Customer *</label>
                <div className="input-field w-full min-h-[25.6px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2 font-medium">
                  {order.customer?.name || order.customerName || order.customerId}
                </div>
              </div>
              <div>
                <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Delivery Address</label>
                <div className="input-field w-full min-h-[38.4px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-start border border-zinc-200 rounded px-2 py-1.5 whitespace-pre-wrap">
                  {getFormattedAddress(order.addresses?.delivery) || getFormattedAddress(order.addresses?.billing) || getFormattedAddress(order.customer?.deliveryAddress) || order.shippingAddress || order.deliveryAddressSnapshot || '—'}
                </div>
              </div>
              <div>
                <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Place of Supply *</label>
                <div className="input-field w-full h-8 text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                  {order.placeOfSupply || order.placeOfSupplyStateCode || order.addresses?.delivery?.state || order.addresses?.billing?.state || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. INVOICE TERMS */}
          <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Invoice Terms</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div>
                <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">Payment Terms</label>
                <div className="input-field w-full min-h-[25.6px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                  {order.commercial?.paymentTerms || order.paymentTerms || '—'}
                </div>
              </div>
              <div>
                <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">Delivery Terms</label>
                <div className="input-field w-full min-h-[25.6px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-center border border-zinc-200 rounded px-2">
                  {order.commercial?.deliveryTerms || order.deliveryTerms || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. NOTES */}
          <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5 mb-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Notes & Conditions</h3>
            </div>
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[7.2px] font-semibold text-zinc-600 block mb-0.5">Notes</label>
                <div className="input-field w-full min-h-[38.4px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-start border border-zinc-200 rounded px-2 py-1.5 whitespace-pre-wrap">
                  {order.commercial?.notes || order.notes || '—'}
                </div>
              </div>
              <div>
                <label className="text-[7.2px] font-semibold text-zinc-600 block mb-0.5">Terms & Conditions</label>
                <div className="input-field w-full min-h-[51.2px] text-[8.8px] text-zinc-700 bg-zinc-50 flex items-start border border-zinc-200 rounded px-2 py-1.5 whitespace-pre-wrap">
                  {order.commercial?.termsAndConditions || order.commercial?.terms || order.termsAndConditions || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: ITEMS + INVOICE SUMMARY ── */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white">
          
          {/* 1. Items Section Header */}
          <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Items</h3>
              <span className="text-[8.8px] font-medium text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                {order.items?.length || 0} {(order.items?.length === 1) ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* 2. Items Table Header */}
          <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-[36px] z-10 flex-none pr-1">
            <div className="grid grid-cols-[18%_10%_12%_7%_10%_7%_7%_12%_12%_5%] w-full min-w-0">
              <div className="p-1.5 font-semibold truncate text-[8.8px]">Product *</div>
              <div className="p-1.5 font-semibold truncate text-[8.8px]">HSN / SAC</div>
              <div className="p-1.5 font-semibold truncate text-[8.8px]">Description</div>
              <div className="p-1.5 font-semibold text-center truncate text-[8.8px]">Qty *</div>
              <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Price *</div>
              <div className="p-1.5 font-semibold text-center truncate text-[8.8px]">Unit</div>
              <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Disc %</div>
              <div className="p-1.5 font-semibold truncate text-[8.8px]">GST</div>
              <div className="p-1.5 font-semibold truncate text-[8.8px] text-right">Amount</div>
              <div className="p-1.5 text-center flex items-center justify-center font-semibold text-[8.8px]">Action</div>
            </div>
          </div>

          {/* 3. Items Table Body */}
          <div className="flex-none">
            <div className="flex flex-col divide-y divide-zinc-100 pb-12">
              {(order.items || []).map((item, idx) => {
                const productName = item.item?.name || item.productName || item.itemName || item.productCode || item.itemCode || '—';
                const hsnSac = item.item?.hsnCode || item.hsnSac || item.hsnSacCode || '—';
                const unitPrice = Number(item.pricing?.unitPrice ?? item.unitPrice ?? 0);
                const discountPct = Number(item.pricing?.discountPercent ?? item.discountPercent ?? 0);
                const taxable = Number(item.pricing?.taxableAmount ?? (unitPrice * Number(item.quantity || 0)) ?? 0);
                const taxAmt = Number(item.taxes?.taxAmount ?? item.taxAmount ?? 0);
                const igstAmt = Number(item.taxes?.igstAmount ?? item.igstAmount ?? 0);
                const cgstAmt = Number(item.taxes?.cgstAmount ?? item.cgstAmount ?? 0);
                const sgstAmt = Number(item.taxes?.sgstAmount ?? item.sgstAmount ?? 0);
                const igstRate = Number(item.igstPercent ?? item.igstRate ?? (taxable > 0 && igstAmt > 0 ? Math.round((igstAmt / taxable) * 100) : 0));
                const cgstRate = Number(item.cgstPercent ?? item.cgstRate ?? (taxable > 0 && cgstAmt > 0 ? Math.round((cgstAmt / taxable) * 100) : 0));
                const sgstRate = Number(item.sgstPercent ?? item.sgstRate ?? (taxable > 0 && sgstAmt > 0 ? Math.round((sgstAmt / taxable) * 100) : 0));
                const totalTaxRate = Number(item.gstRate ?? (igstRate > 0 ? igstRate : (cgstRate + sgstRate > 0 ? (cgstRate + sgstRate) : (taxable > 0 && taxAmt > 0 ? Math.round((taxAmt / taxable) * 100) : 0))));
                const isInterState = igstAmt > 0 || igstRate > 0;
                const totalAmount = Number(item.totalAmount ?? (taxable + taxAmt) ?? 0);
                
                return (
                  <div key={item.id || idx} className="grid grid-cols-[18%_10%_12%_7%_10%_7%_7%_12%_12%_5%] w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border">
                    <div className="p-1.5 pt-2 min-w-0 flex items-center">
                      <div className="text-[8.8px] text-zinc-700 font-medium truncate px-1" title={productName}>{productName}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center">
                      <div className="text-[8.8px] text-zinc-600 truncate px-1">{hsnSac}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center">
                      <div className="text-[8.8px] text-zinc-600 truncate px-1">{item.description || item.item?.description || '—'}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center justify-center">
                      <div className="text-[8.8px] text-zinc-800 font-bold px-1">{item.quantity}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center justify-end">
                      <div className="text-[8.8px] text-zinc-800 px-1">{fmtCurr(unitPrice)}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center justify-center">
                      <div className="text-[8.8px] text-zinc-600 px-1">{item.unit || 'Pieces'}</div>
                    </div>
                    <div className="p-1.5 pt-2 min-w-0 flex items-center justify-end">
                      <div className="text-[8.8px] text-zinc-600 px-1">{discountPct}%</div>
                    </div>
                    
                    <div className="p-1.5 pt-2 min-w-0 flex flex-col justify-center text-[8px] leading-tight px-2">
                      {totalTaxRate > 0 || taxAmt > 0 ? (
                        <div className="flex flex-col gap-1 w-full px-1">
                          <div className="text-zinc-800 font-semibold mb-0.5 border-b border-zinc-100 pb-0.5">
                            {totalTaxRate > 0 ? `GST ${totalTaxRate}%` : `Tax`}
                          </div>
                          {isInterState ? (
                            <div className="flex justify-between items-center w-full">
                              <span className="text-zinc-500">{igstRate > 0 ? `IGST ${igstRate}%` : 'IGST'}</span>
                              <span className="text-zinc-700 font-medium">{fmtCurr(igstAmt || taxAmt)}</span>
                            </div>
                          ) : (
                            <>
                              {cgstAmt > 0 && (
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-zinc-500">{cgstRate > 0 ? `CGST ${cgstRate}%` : 'CGST'}</span>
                                  <span className="text-zinc-700 font-medium">{fmtCurr(cgstAmt)}</span>
                                </div>
                              )}
                              {sgstAmt > 0 && (
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-zinc-500">{sgstRate > 0 ? `SGST ${sgstRate}%` : 'SGST'}</span>
                                  <span className="text-zinc-700 font-medium">{fmtCurr(sgstAmt)}</span>
                                </div>
                              )}
                              {cgstAmt === 0 && sgstAmt === 0 && (
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-zinc-500">Tax</span>
                                  <span className="text-zinc-700 font-medium">{fmtCurr(taxAmt)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-center">-</div>
                      )}
                    </div>
                    
                    <div className="p-1.5 pt-2 min-w-0 flex items-center justify-end">
                      <div className="text-[9.6px] font-bold text-zinc-800 px-1">{fmtCurr(totalAmount)}</div>
                    </div>
                    
                    <div className="p-1.5 pt-2 pb-2 min-w-0 flex items-center justify-center">
                      <div className="text-zinc-300">
                        <CheckCircle size={14} className="opacity-50" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 4. Right-Side Bottom: INVOICE SUMMARY */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col justify-between shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Invoice Summary</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 font-medium">Sub Total</span>
                  <span className="font-semibold text-zinc-800">{fmtCurr(order.amounts?.subtotal ?? order.subtotal ?? order.subTotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 font-medium">Freight Charges</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 font-medium">₹</span>
                    <div className="input-field w-24 h-8 text-right font-semibold text-zinc-800 text-[9.6px] bg-zinc-50 border border-zinc-200 flex items-center justify-end px-2">
                      {order.amounts?.freight != null ? fmt(order.amounts.freight) : (order.freightCharges || '0.00')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 font-medium">Other Charges</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 font-medium">₹</span>
                    <div className="input-field w-24 h-8 text-right font-semibold text-zinc-800 text-[9.6px] bg-zinc-50 border border-zinc-200 flex items-center justify-end px-2">
                      {order.amounts?.otherCharges != null ? fmt(order.amounts.otherCharges) : (order.otherCharges || '0.00')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 font-medium">Tax Amount</span>
                  <span className="text-zinc-800 font-semibold">{fmtCurr(order.amounts?.tax ?? order.taxAmount ?? order.totalTaxAmount)}</span>
                </div>

                {(order.amounts?.roundOff !== 0 && order.roundOff !== 0) && (
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Round Off</span>
                    <span className="text-zinc-700 font-medium">{fmtCurr(order.amounts?.roundOff ?? order.roundOff)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-900">Grand Total</span>
                  <span className="text-base font-black text-indigo-600">{fmtCurr(order.amounts?.total ?? order.totalAmount ?? order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* ─ BOTTOM ACTION BAR ─ */}
      <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none">
        <div className="flex items-center gap-6 px-2">
          <label className="flex items-center gap-2 cursor-not-allowed group opacity-50">
            <input type="checkbox" disabled className="w-4 h-4 rounded border-zinc-300 text-indigo-600 cursor-not-allowed" />
            <span className="text-xs font-medium text-zinc-600">Download PDF</span>
          </label>
          <label className="flex items-center gap-2 cursor-not-allowed group opacity-50">
            <input type="checkbox" disabled className="w-4 h-4 rounded border-zinc-300 text-indigo-600 cursor-not-allowed" />
            <span className="text-xs font-medium text-zinc-600">Send Email</span>
          </label>
          <button type="button" disabled className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 cursor-not-allowed opacity-50">
            <Printer size={14} /> Print Invoice
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handleClose} 
            className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 shadow-xs transition-colors disabled:opacity-50"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmInvoice}
            disabled={isGenerating}
            className="px-6 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary/90 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> Creating...</>
            ) : (
              <>Save Invoice</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
