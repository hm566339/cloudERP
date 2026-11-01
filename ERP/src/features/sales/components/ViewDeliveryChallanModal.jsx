import React from 'react';
import { 
  X, Truck, CheckCircle, Clock, Package, FileText, 
  MapPin, Calendar, Check, AlertCircle, ReceiptText 
} from 'lucide-react';
import { useGetDeliveryChallanByIdQuery } from '../../../api/sales-crm/sales.api';

import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import WorkflowActionButtons from '../../workflows/components/WorkflowActionButtons';

function isUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

function fmtDate(d, fallback = '—') {
  if (!d) return fallback;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return fallback;
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

function fmtCurrency(n, fallback = '₹0.00') {
  if (n === undefined || n === null) return fallback;
  const num = Number(n);
  if (isNaN(num)) return fallback;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddress(addr) {
  if (!addr) return '—';
  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      return [
        parsed.attention,
        parsed.addressLine1,
        parsed.addressLine2,
        parsed.city,
        parsed.state,
        parsed.pinCode,
        parsed.country
      ].filter(Boolean).join(', ') || addr;
    } catch {
      return addr;
    }
  }
  if (typeof addr === 'object') {
    return [
      addr.attention,
      addr.addressLine1,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pinCode,
      addr.country
    ].filter(Boolean).join(', ') || '—';
  }
  return '—';
}

export default function ViewDeliveryChallanModal({ 
  isOpen, 
  onClose, 
  challan: propChallan,
  challanId, 
  companyId, 
  onEdit, 
  onConfirm, 
  onCancel,
  onGenerateInvoice 
}) {
  const dispatch = useAppDispatch();
  const effectiveId = propChallan?.id || challanId;

  const { data: responseData, isLoading, error } = useGetDeliveryChallanByIdQuery(
    { id: effectiveId, companyId },
    { skip: !isOpen || !effectiveId || !!propChallan }
  );

  React.useEffect(() => {
    if (error) {
      dispatch(addAlert({ type: 'error', message: 'Unable to load Delivery Challan details.' }));
    }
  }, [error, dispatch]);

  const challan = propChallan || (responseData?.data?.id ? responseData.data : (responseData?.id ? responseData : null));

  if (!isOpen) return null;

  const renderStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CONFIRMED' || s === 'APPROVED') {
      return (
        <span className="badge badge-success inline-flex items-center gap-1">
          <CheckCircle size={12} /> {s === 'APPROVED' ? 'Approved' : 'Confirmed'}
        </span>
      );
    }
    if (s === 'PENDING_APPROVAL') {
      return (
        <span className="badge badge-warning inline-flex items-center gap-1 text-amber-700 bg-amber-50">
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    if (s === 'CHANGES_REQUESTED') {
      return (
        <span className="badge badge-warning inline-flex items-center gap-1 text-orange-700 bg-orange-50">
          <Clock size={12} /> Changes Requested
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return (
        <span className="badge badge-error inline-flex items-center gap-1">
          <X size={12} /> {s === 'REJECTED' ? 'Rejected' : 'Cancelled'}
        </span>
      );
    }
    return (
      <span className="badge badge-warning inline-flex items-center gap-1">
        <Clock size={12} /> Draft
      </span>
    );
  };

  const isDraft = String(challan?.status || '').toUpperCase() === 'DRAFT';
  const isConfirmed = String(challan?.status || '').toUpperCase() === 'CONFIRMED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161922] border border-transparent dark:border-[#2A2F3D] rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/50 dark:bg-[#1D212C] rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-blue-500/10 flex items-center justify-center border border-indigo-100 dark:border-blue-500/20 text-indigo-600 dark:text-[#4C8DFF]">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                  {challan?.dcNumber || 'Delivery Challan Details'}
                </h2>
                {challan && renderStatusBadge(challan.status)}
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mt-0.5">
                From Sales Order <span className="font-mono text-zinc-900 dark:text-[#E6E8EE] font-semibold">{challan?.sourceSalesOrderNumber || '—'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 dark:bg-[#0F1117] space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-400 dark:text-[#6B7184]">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-zinc-900 dark:border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading Delivery Challan...</span>
              </div>
            </div>
          ) : error || !challan ? (
            <div className="p-8 text-center bg-white dark:bg-[#161922] rounded-lg border border-red-200 dark:border-red-900/40">
              <AlertCircle size={24} className="mx-auto text-red-500 dark:text-red-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">Unable to load Delivery Challan details.</p>
            </div>
          ) : (
            <>
              {/* Workflow Action Bar */}
              <WorkflowActionButtons
                module="SALES"
                documentType="DELIVERY_CHALLAN"
                documentId={deliveryChallanId}
                documentStatus={challan.status}
                onActionComplete={refetch}
              />

              {/* Primary Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Customer</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate" title={challan.customerName}>{challan.customerName || '—'}</p>
                </div>
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Challan Date</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{fmtDate(challan.dcDate)}</p>
                </div>
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Dispatch Date</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{fmtDate(challan.dispatchDate)}</p>
                </div>
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Transporter</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">
                    {challan.transporterName && !isUuid(challan.transporterName) ? challan.transporterName : '—'}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Vehicle / LR</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate font-mono">
                    {challan.vehicleNumber || '—'} {challan.lrNumber ? `(${challan.lrNumber})` : ''}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Reference</p>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate font-mono">
                    {challan.referenceNumber || '—'}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] flex items-center gap-1.5">
                    <MapPin size={12} className="text-zinc-400 dark:text-[#6B7184]" />
                    Billing Address
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-[#A0A6B5] leading-relaxed">
                    {formatAddress(challan.billingAddressSnapshot)}
                  </p>
                  {challan.billingStateCode && (
                    <span className="text-[10px] text-zinc-400 dark:text-[#6B7184] block mt-1 font-mono">State Code: {challan.billingStateCode}</span>
                  )}
                </div>

                <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] flex items-center gap-1.5">
                    <Truck size={12} className="text-zinc-400 dark:text-[#6B7184]" />
                    Delivery Address
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-[#A0A6B5] leading-relaxed">
                    {formatAddress(challan.deliveryAddressSnapshot)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-zinc-400 dark:text-[#6B7184]" />
                    Items & Dispatched Quantities
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-[#6B7184] font-medium">
                    {challan.items?.length || 0} items
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-white dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D]">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5]">Product</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5]">Description</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5]">HSN/SAC</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Quantity</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Unit Price</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Discount</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Taxable</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Tax</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 dark:text-[#A0A6B5] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                      {(challan.items || []).map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                          <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-[#E6E8EE]">{it.itemName || '—'}</td>
                          <td className="px-3 py-2.5 text-zinc-500 dark:text-[#6B7184] max-w-[140px] truncate">{it.description || '—'}</td>
                          <td className="px-3 py-2.5 text-zinc-500 dark:text-[#6B7184] font-mono">{it.hsnSacCode || '—'}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-zinc-900 dark:text-[#E6E8EE] font-mono">
                            {it.quantity} {it.unit || ''}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-700 dark:text-[#A0A6B5]">{fmtCurrency(it.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-500 dark:text-[#6B7184]">{fmtCurrency(it.discountAmount)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-700 dark:text-[#A0A6B5]">{fmtCurrency(it.taxableAmount)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-700 dark:text-[#A0A6B5]">{fmtCurrency(it.taxAmount)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">{fmtCurrency(it.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 text-xs text-zinc-600 dark:text-[#A0A6B5] space-y-1">
                  {challan.referenceNumber && (
                    <p><strong>Reference:</strong> {challan.referenceNumber}</p>
                  )}
                  {challan.notes && (
                    <p className="bg-white dark:bg-[#161922] p-2.5 rounded border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5]">
                      <strong>Notes:</strong> {challan.notes}
                    </p>
                  )}
                </div>

                <div className="w-full sm:w-72 bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600 dark:text-[#A0A6B5]">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-[#E6E8EE]">{fmtCurrency(challan.subtotal)}</span>
                  </div>
                  {Number(challan.discountAmount) > 0 && (
                    <div className="flex justify-between text-zinc-600 dark:text-[#A0A6B5]">
                      <span>Discount</span>
                      <span className="font-mono text-red-600 dark:text-red-400">-{fmtCurrency(challan.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600 dark:text-[#A0A6B5]">
                    <span>Tax Amount</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-[#E6E8EE]">{fmtCurrency(challan.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 dark:border-[#2A2F3D] pt-2 font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">
                    <span>Total Amount</span>
                    <span className="font-mono text-indigo-700 dark:text-[#4C8DFF]">{fmtCurrency(challan.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] flex items-center justify-between rounded-b-xl shrink-0">
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button
                  type="button"
                  onClick={() => { onClose(); if (onConfirm) onConfirm(challan); }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Confirm Challan</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); if (onEdit) onEdit(challan); }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); if (onCancel) onCancel(challan); }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                >
                  Cancel Challan
                </button>
              </>
            )}
            {isConfirmed && (
              <>
                {onGenerateInvoice && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onGenerateInvoice(challan); }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 dark:bg-primary hover:bg-zinc-800 dark:hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <ReceiptText size={14} />
                    <span>Generate Sales Invoice</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { onClose(); if (onCancel) onCancel(challan); }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                >
                  Cancel Challan
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
