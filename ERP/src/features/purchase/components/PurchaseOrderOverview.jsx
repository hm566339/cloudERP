import React from 'react';
import { FileText, Package, Users, CreditCard } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { PO_STATUS_CONFIG } from '../constants';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function PurchaseOrderOverview({ po, navigate, buildPath }) {
  if (!po) return null;

  return (
    <div className="bg-zinc-50/70 dark:bg-[#0F1117] p-6 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] space-y-6">
      {/* Source Document Section */}
      {(po.supplierQuotationId || po.supplierQuotationNumber || po.rfqId || po.rfqNumber || po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
        <div className="p-3 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <FileText size={13} /> Source Document
          </span>
          <div className="flex flex-wrap items-center divide-x divide-blue-200 dark:divide-blue-500/20">
            {(po.supplierQuotationId || po.supplierQuotationNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 dark:text-[#A0A6B5] font-medium">Supplier Quotation:</span>
                {po.supplierQuotationId ? (
                  <span 
                    className="text-primary dark:text-[#4C8DFF] font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations/' + po.supplierQuotationId))}
                    title={po.supplierQuotationNumber || po.quotationNumber || 'View Supplier Quotation'}
                  >
                    {po.supplierQuotationNumber || po.quotationNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 dark:text-[#E6E8EE] font-mono font-semibold">
                    {po.supplierQuotationNumber || po.quotationNumber || '—'}
                  </span>
                )}
              </div>
            )}
            {(po.rfqId || po.rfqNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 dark:text-[#A0A6B5] font-medium">RFQ:</span>
                {po.rfqId ? (
                  <span 
                    className="text-primary dark:text-[#4C8DFF] font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/rfqs/' + po.rfqId))}
                    title={po.rfqNumber || 'View RFQ'}
                  >
                    {po.rfqNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 dark:text-[#E6E8EE] font-mono font-semibold">
                    {po.rfqNumber || '—'}
                  </span>
                )}
              </div>
            )}
            {(po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 dark:text-[#A0A6B5] font-medium">Purchase Requisition:</span>
                {po.purchaseRequisitionId ? (
                  <span 
                    className="text-primary dark:text-[#4C8DFF] font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions/' + po.purchaseRequisitionId))}
                    title={po.purchaseRequisitionNumber || po.requisitionNumber || 'View Purchase Requisition'}
                  >
                    {po.purchaseRequisitionNumber || po.requisitionNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 dark:text-[#E6E8EE] font-mono font-semibold">
                    {po.purchaseRequisitionNumber || po.requisitionNumber || '—'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO Information */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <FileText size={13} className="text-zinc-500 dark:text-[#6B7184]" />
            Purchase Order Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">PO Number</span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{po.poNumber || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Status</span>
              <div><StatusBadge status={po.status} statusConfig={PO_STATUS_CONFIG} /></div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Reference Number</span>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{po.referenceNumber || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Created At</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{formatDateTime(po.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">PO Date</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{formatDate(po.poDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Expected Delivery</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{formatDate(po.expectedDeliveryDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Currency</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{po.currency || 'INR'} (Rate: {po.exchangeRate || 1})</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Terms</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{po.paymentTerms || po.deliveryTerms || '-'}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Notes</span>
              <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{po.notes || po.termsAndConditions || '-'}</p>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <Package size={13} className="text-zinc-500 dark:text-[#6B7184]" />
            Ordered Items
          </h4>
          {po.items && po.items.length > 0 ? (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {po.items.map((item, idx) => {
                const quantity = Number(item.orderedQuantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const total = Number(item.totalAmount) || (quantity * unitPrice);

                return (
                  <div key={item.id || idx} className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200/70 dark:border-[#2A2F3D] shadow-xs space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Item Name</span>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{item.itemName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Ordered Qty</span>
                        <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{quantity.toLocaleString()} {item.unit}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Received / Pending</span>
                        <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5] font-mono">{(item.receivedQuantity || 0)} / {(item.pendingQuantity || quantity)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Unit Price</span>
                        <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{fmt(unitPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Total</span>
                        <p className="text-xs font-semibold text-primary dark:text-[#4C8DFF]">{fmt(total)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-[#6B7184] italic">No items</p>
          )}
        </div>

        {/* Supplier & Totals */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <Users size={13} className="text-zinc-500 dark:text-[#6B7184]" />
            Supplier & Shipping
          </h4>
          <div className="bg-white dark:bg-[#161922] p-3.5 rounded-lg border border-zinc-200/70 dark:border-[#2A2F3D] shadow-xs space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Supplier</span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{po.vendorName || '-'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">GSTIN</span>
                <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{po.vendorGstin || '-'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Purchase Address</span>
                <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">
                  {[po.purchaseAddressLine1, po.purchaseAddressLine2, po.purchaseCity, po.purchaseState, po.purchaseCountry, po.purchasePostalCode].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div className="space-y-1 col-span-2 mt-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Shipping Address</span>
                <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{po.shippingAddressSnapshot || '-'}</p>
              </div>
            </div>
          </div>
          
          <h4 className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2 mt-4">
            <FileText size={13} className="text-zinc-500 dark:text-[#6B7184]" />
            Tax & Total Summary
          </h4>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200/70 dark:border-[#2A2F3D] shadow-xs space-y-2">
            <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
              <span>Subtotal</span>
              <span>{fmt(po.subtotal)}</span>
            </div>
            {po.discountAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                <span>Discount</span>
                <span className="text-rose-600 dark:text-rose-400">-{fmt(po.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5] pt-1 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <span>Taxable Amount</span>
              <span>{fmt(po.taxableAmount)}</span>
            </div>
            {(po.cgstAmount > 0 || po.sgstAmount > 0) && (
              <>
                <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                  <span>CGST</span>
                  <span>{fmt(po.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                  <span>SGST</span>
                  <span>{fmt(po.sgstAmount)}</span>
                </div>
              </>
            )}
            {po.igstAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                <span>IGST</span>
                <span>{fmt(po.igstAmount)}</span>
              </div>
            )}
            {po.cessAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                <span>CESS</span>
                <span>{fmt(po.cessAmount)}</span>
              </div>
            )}
            {(po.freightCharges > 0 || po.otherCharges > 0) && (
              <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                <span>Additional Charges</span>
                <span>{fmt((po.freightCharges || 0) + (po.otherCharges || 0))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] pt-2 border-t border-zinc-200 dark:border-[#2A2F3D] mt-2">
              <span>Grand Total</span>
              <span className="text-primary dark:text-[#4C8DFF]">{po.currency || 'INR'} {(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Advance Payments */}
        {po.advancePayments && po.advancePayments.length > 0 && (
          <div className="space-y-4 col-span-1 lg:col-span-3">
            <h4 className="text-[11px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
              <CreditCard size={13} className="text-zinc-500 dark:text-[#6B7184]" />
              Advance Payments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {po.advancePayments.map((payment, idx) => (
                <div key={payment.id || idx} className="bg-white dark:bg-[#161922] p-3.5 rounded-lg border border-zinc-200/70 dark:border-[#2A2F3D] shadow-xs space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Voucher No</span>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{payment.voucherNo || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Amount</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmt(payment.paymentAmount)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Mode</span>
                      <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{payment.paymentMode || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Date</span>
                      <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{formatDate(payment.voucherDate || payment.paymentDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Status</span>
                      <div><StatusBadge status={payment.paymentStatus || payment.status} /></div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">GL Status</span>
                      <div><StatusBadge status={payment.glPostingStatus} /></div>
                    </div>
                    {payment.referenceNo && (
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Reference</span>
                        <p className="text-xs font-medium text-zinc-700 dark:text-[#A0A6B5]">{payment.referenceNo}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
