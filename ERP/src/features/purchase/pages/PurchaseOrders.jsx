import React, { useState, useMemo } from 'react';
import {
  Plus, FileSearch, RefreshCw, X, RotateCcw, FileText,
  Eye, Edit2, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  Filter, Package, Users, ShoppingCart, CheckCircle, Ban, ArrowRightCircle, Download, Loader2, CreditCard, DollarSign, Truck
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import AuditLogHover from '../../../components/common/AuditLogHover';
import ExportModal from '../../../components/common/ExportModal';
import CreateAdvancePaymentModal from '../components/CreateAdvancePaymentModal';
import RequireAdvanceModal from '../components/RequireAdvanceModal';
import CreateGrnModal from '../components/CreateGrnModal';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useRBAC } from '../../../utils/rbac';

import { 
  useGetPurchaseOrdersQuery,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation
} from '../../../api/purchase';
import { useApiQuery } from '../../../hooks/useApi';
import { vendorsApi } from '../../../api/account';

const STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PARTIALLY_RECEIVED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  RECEIVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  const cfg = STATUS_CONFIG[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s.replace(/_/g, ' ')}
    </span>
  );
};

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

const ActionReasonModal = ({ isOpen, onClose, onSubmit, actionType, loading }) => {
  const [reason, setReason] = useState('');
  
  React.useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 bg-zinc-50/50">
          <h2 className="text-lg font-bold text-zinc-900 leading-tight">{actionType} Purchase Order</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <form id="action-reason-form" onSubmit={(e) => { e.preventDefault(); onSubmit(reason); }}>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">{actionType} Reason *</label>
            <textarea
              required
              disabled={loading}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Enter ${actionType?.toLowerCase()} reason`}
              rows={4}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none disabled:opacity-60 disabled:bg-zinc-50"
            />
          </form>
        </div>
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-60 disabled:hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="action-reason-form"
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm border border-rose-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-60 disabled:hover:bg-rose-600"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : `${actionType} Purchase Order`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Expanded Purchase Order Overview */
const PurchaseOrderOverview = ({ po, navigate, buildPath }) => {
  return (
    <div className="bg-zinc-50/70 p-6 rounded-xl border border-zinc-200/80 space-y-6">
      {/* Source Document Section */}
      {(po.supplierQuotationId || po.supplierQuotationNumber || po.rfqId || po.rfqNumber || po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <FileText size={13} /> Source Document
          </span>
          <div className="flex flex-wrap items-center divide-x divide-blue-200">
            {(po.supplierQuotationId || po.supplierQuotationNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 font-medium">Supplier Quotation:</span>
                {po.supplierQuotationId ? (
                  <span 
                    className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations/' + po.supplierQuotationId))}
                    title={po.supplierQuotationNumber || po.quotationNumber || 'View Supplier Quotation'}
                  >
                    {po.supplierQuotationNumber || po.quotationNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 font-mono font-semibold">
                    {po.supplierQuotationNumber || po.quotationNumber || '—'}
                  </span>
                )}
              </div>
            )}
            {(po.rfqId || po.rfqNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 font-medium">RFQ:</span>
                {po.rfqId ? (
                  <span 
                    className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/rfqs/' + po.rfqId))}
                    title={po.rfqNumber || 'View RFQ'}
                  >
                    {po.rfqNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 font-mono font-semibold">
                    {po.rfqNumber || '—'}
                  </span>
                )}
              </div>
            )}
            {(po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
              <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                <span className="text-zinc-500 font-medium">Purchase Requisition:</span>
                {po.purchaseRequisitionId ? (
                  <span 
                    className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                    onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions/' + po.purchaseRequisitionId))}
                    title={po.purchaseRequisitionNumber || po.requisitionNumber || 'View Purchase Requisition'}
                  >
                    {po.purchaseRequisitionNumber || po.requisitionNumber || '—'}
                  </span>
                ) : (
                  <span className="text-zinc-700 font-mono font-semibold">
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
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2">
            <FileText size={13} className="text-zinc-500" />
            Purchase Order Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PO Number</span>
              <p className="text-sm font-semibold text-zinc-900 font-mono">{po.poNumber || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</span>
              <div><StatusBadge status={po.status} /></div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reference Number</span>
              <p className="text-sm font-medium text-zinc-900">{po.referenceNumber || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Created At</span>
              <p className="text-sm font-medium text-zinc-700">{formatDateTime(po.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PO Date</span>
              <p className="text-sm font-medium text-zinc-700">{formatDate(po.poDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Expected Delivery</span>
              <p className="text-sm font-medium text-zinc-700">{formatDate(po.expectedDeliveryDate)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Currency</span>
              <p className="text-sm font-medium text-zinc-700">{po.currency || 'INR'} (Rate: {po.exchangeRate || 1})</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Terms</span>
              <p className="text-sm font-medium text-zinc-700">{po.paymentTerms || po.deliveryTerms || '-'}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Notes</span>
              <p className="text-sm font-medium text-zinc-700">{po.notes || po.termsAndConditions || '-'}</p>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2">
            <Package size={13} className="text-zinc-500" />
            Ordered Items
          </h4>
          {po.items && po.items.length > 0 ? (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {po.items.map((item, idx) => {
                const quantity = Number(item.orderedQuantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const total = Number(item.totalAmount) || (quantity * unitPrice);

                return (
                  <div key={item.id || idx} className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-xs space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Item Name</span>
                        <p className="text-xs font-semibold text-zinc-900">{item.itemName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ordered Qty</span>
                        <p className="text-xs font-medium text-zinc-700">{quantity.toLocaleString()} {item.unit}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Received / Pending</span>
                        <p className="text-xs font-medium text-zinc-700 font-mono">{(item.receivedQuantity || 0)} / {(item.pendingQuantity || quantity)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Unit Price</span>
                        <p className="text-xs font-medium text-zinc-700">{fmt(unitPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total</span>
                        <p className="text-xs font-semibold text-primary">{fmt(total)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">No items</p>
          )}
        </div>

        {/* Supplier & Totals */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2">
            <Users size={13} className="text-zinc-500" />
            Supplier & Shipping
          </h4>
          <div className="bg-white p-3.5 rounded-lg border border-zinc-200/70 shadow-xs space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Supplier</span>
                <p className="text-sm font-semibold text-zinc-900">{po.vendorName || '-'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GSTIN</span>
                <p className="text-xs font-medium text-zinc-700">{po.vendorGstin || '-'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Purchase Address</span>
                <p className="text-xs font-medium text-zinc-700">
                  {[po.purchaseAddressLine1, po.purchaseAddressLine2, po.purchaseCity, po.purchaseState, po.purchaseCountry, po.purchasePostalCode].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
              <div className="space-y-1 col-span-2 mt-2 pt-2 border-t border-zinc-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Shipping Address</span>
                <p className="text-xs font-medium text-zinc-700">{po.shippingAddressSnapshot || '-'}</p>
              </div>
            </div>
          </div>
          
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2 mt-4">
            <FileText size={13} className="text-zinc-500" />
            Tax & Total Summary
          </h4>
          <div className="bg-white p-4 rounded-lg border border-zinc-200/70 shadow-xs space-y-2">
            <div className="flex justify-between text-xs font-medium text-zinc-600">
              <span>Subtotal</span>
              <span>{fmt(po.subtotal)}</span>
            </div>
            {po.discountAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600">
                <span>Discount</span>
                <span className="text-rose-600">-{fmt(po.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-medium text-zinc-600 pt-1 border-t border-zinc-100">
              <span>Taxable Amount</span>
              <span>{fmt(po.taxableAmount)}</span>
            </div>
            {(po.cgstAmount > 0 || po.sgstAmount > 0) && (
              <>
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>CGST</span>
                  <span>{fmt(po.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>SGST</span>
                  <span>{fmt(po.sgstAmount)}</span>
                </div>
              </>
            )}
            {po.igstAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600">
                <span>IGST</span>
                <span>{fmt(po.igstAmount)}</span>
              </div>
            )}
            {po.cessAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-zinc-600">
                <span>CESS</span>
                <span>{fmt(po.cessAmount)}</span>
              </div>
            )}
            {(po.freightCharges > 0 || po.otherCharges > 0) && (
              <div className="flex justify-between text-xs font-medium text-zinc-600">
                <span>Additional Charges</span>
                <span>{fmt((po.freightCharges || 0) + (po.otherCharges || 0))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200 mt-2">
              <span>Grand Total</span>
              <span className="text-primary">{po.currency || 'INR'} {(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Advance Payments */}
        {po.advancePayments && po.advancePayments.length > 0 && (
          <div className="space-y-4 col-span-1 lg:col-span-3">
            <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-2">
              <CreditCard size={13} className="text-zinc-500" />
              Advance Payments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {po.advancePayments.map((payment, idx) => (
                <div key={payment.id || idx} className="bg-white p-3.5 rounded-lg border border-zinc-200/70 shadow-xs space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Voucher No</span>
                      <p className="text-sm font-semibold text-zinc-900 font-mono">{payment.voucherNo || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Amount</span>
                      <p className="text-sm font-bold text-emerald-600 font-mono">{fmt(payment.paymentAmount)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mode</span>
                      <p className="text-xs font-medium text-zinc-700">{payment.paymentMode || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Date</span>
                      <p className="text-xs font-medium text-zinc-700">{formatDate(payment.voucherDate || payment.paymentDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</span>
                      <div><StatusBadge status={payment.paymentStatus || payment.status} /></div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GL Status</span>
                      <div><StatusBadge status={payment.glPostingStatus} /></div>
                    </div>
                    {payment.referenceNo && (
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reference</span>
                        <p className="text-xs font-medium text-zinc-700">{payment.referenceNo}</p>
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
};

export default function PurchaseOrders() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const { canCreate, canEdit, canApprove } = useRBAC();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedPoForAdvance, setSelectedPoForAdvance] = useState(null);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState(null);
  const [requireAdvanceModalConfig, setRequireAdvanceModalConfig] = useState({ isOpen: false, po: null });
  const [processingId, setProcessingId] = useState(null);
  const [reasonModalConfig, setReasonModalConfig] = useState({ isOpen: false, poId: null, actionType: null });

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: vendorsResp } = useApiQuery(vendorsApi.getActiveVendors, undefined, { enabled: true });
  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : vendorsResp?.data || vendorsResp?.content || [];
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);

  const listFilters = useMemo(() => {
    const q = {};
    if (debouncedSearch && debouncedSearch.trim()) q.search = debouncedSearch.trim();
    if (filters.status) q.status = filters.status;
    if (filters.poDateFrom) q.fromDate = filters.poDateFrom;
    if (filters.poDateTo) q.toDate = filters.poDateTo;
    if (filters.expectedDeliveryDateFrom) q.expectedDeliveryDateFrom = filters.expectedDeliveryDateFrom;
    if (filters.expectedDeliveryDateTo) q.expectedDeliveryDateTo = filters.expectedDeliveryDateTo;
    if (filters.vendorId) q.vendorId = filters.vendorId;
    q.companyId = companyId;
    return q;
  }, [debouncedSearch, filters, companyId]);

  const payload = {
    ...apiParams,
    ...listFilters
  };

  const { data: apiData = {}, isLoading, isFetching, refetch } = useGetPurchaseOrdersQuery(payload);

  let allOrders = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  if (debouncedSearch) {
    const s = debouncedSearch.toLowerCase();
    allOrders = allOrders.filter(
      po =>
        po.poNumber?.toLowerCase().includes(s) ||
        po.vendorName?.toLowerCase().includes(s) ||
        po.referenceNumber?.toLowerCase().includes(s)
    );
  }
  if (filters.status) {
    allOrders = allOrders.filter(po => po.status === filters.status);
  }

  const sortedOrders = useMemo(() => {
    if (!sortBy) return allOrders;
    return [...allOrders].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [allOrders, sortBy, sortOrder]);

  const extractedTotalElements = apiData?.data?.pagination?.totalElements || apiData?.pagination?.totalElements || apiData?.data?.totalElements || sortedOrders.length;
  const actualTotalElements = sortedOrders.length < extractedTotalElements ? sortedOrders.length : extractedTotalElements;
  const currentSize = apiParams.size || 10;
  
  const totalElements = actualTotalElements;
  const totalPages = Math.ceil(totalElements / currentSize) || 1;

  const orders = sortedOrders.slice(page * currentSize, (page + 1) * currentSize);

  const [submitMutation] = useSubmitPurchaseOrderMutation();
  const [approveMutation] = useApprovePurchaseOrderMutation();
  const [rejectMutation] = useRejectPurchaseOrderMutation();
  const [sendMutation] = useSendPurchaseOrderMutation();
  const [cancelMutation] = useCancelPurchaseOrderMutation();
  const [closeMutation] = useClosePurchaseOrderMutation();

  const handleAction = async (e, actionName, mutationFn, poId, confirmMsg, successMessage, extraArgs = {}) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (processingId) return;

    if (!await confirmDialog({
      title: `${actionName} Purchase Order`,
      message: confirmMsg,
      confirmText: actionName,
      cancelText: 'Cancel'
    })) return;

    setProcessingId(poId + actionName);
    try {
      await mutationFn({ id: poId, companyId, ...extraArgs }).unwrap();
      dispatch(addAlert({ type: 'success', message: successMessage || `Purchase Order ${actionName.toLowerCase()}d successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()} Purchase Order` }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedOrders([]);
    setPage(0);
  };

  const getPoActions = (po) => {
    const actions = [];
    
    actions.push({
      tooltip: 'View Details',
      icon: <Eye size={16} />,
      onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id))
    });

    if ((po.status === 'DRAFT' || po.status === 'REJECTED') && canEdit()) {
      actions.push({
        tooltip: 'Edit',
        icon: <Edit2 size={16} />,
        onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id))
      });
    }

    if (po.status === 'DRAFT') {
      actions.push({
        tooltip: 'Submit for Approval',
        icon: <CheckCircle size={16} />,
        onClick: () => handleAction(null, 'Submit', submitMutation, po.id, 'Are you sure you want to submit this Purchase Order for approval?')
      });
    }

    if (po.status === 'PENDING_APPROVAL' && canApprove()) {
      actions.push({
        tooltip: 'Approve',
        icon: <CheckCircle size={16} className="text-emerald-600" />,
        onClick: () => handleAction(null, 'Approve', approveMutation, po.id, 'Are you sure you want to approve this Purchase Order?')
      });
      actions.push({
        tooltip: 'Reject',
        icon: <Ban size={16} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Reject' })
      });
    }

    if (['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      actions.push({
        tooltip: 'Create GRN',
        icon: <Truck size={16} className="text-emerald-600" />,
        onClick: () => setSelectedPoForGrn(po)
      });
    }

    if (['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      const advanceRequired = po.advanceRequired === true;
      const advanceAmount = Number(po.advanceAmount) || 0;
      const advancePaidAmount = Number(po.advancePaidAmount) || 0;
      const remainingAdvance = Math.max(advanceAmount - advancePaidAmount, 0);

      if (!advanceRequired) {
        actions.push({
          tooltip: 'Require Advance Payment',
          icon: <DollarSign size={16} />,
          onClick: () => setRequireAdvanceModalConfig({ isOpen: true, po })
        });
      } else if (remainingAdvance > 0) {
        actions.push({
          tooltip: 'Create Advance Payment',
          icon: <CreditCard size={16} />,
          onClick: () => setSelectedPoForAdvance(po)
        });
      }
    }

    if (po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED') {
      actions.push({
        tooltip: 'Close Purchase Order',
        icon: <CheckCircle size={16} />,
        onClick: () => handleAction(null, 'Close', closeMutation, po.id, 'Are you sure you want to close this Purchase Order?')
      });
    }

    const hasReceivedItems = po.items?.some(i => (Number(i.receivedQuantity) || 0) > 0) || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED';
    
    if (['DRAFT', 'APPROVED', 'SENT'].includes(po.status) && !hasReceivedItems) {
      actions.push({
        tooltip: 'Cancel Purchase Order',
        icon: <Ban size={16} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Cancel' })
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      id: 'poNumber',
      header: 'PO NUMBER',
      accessor: 'poNumber',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(buildPath('/accounts/transactions/purchase-orders/' + row.id));
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.poNumber || '-'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'vendorName',
      header: 'SUPPLIER',
      accessor: 'vendorName',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-zinc-900">
          {row.vendorName || '-'}
        </span>
      )
    },
    {
      id: 'poDate',
      header: 'PO DATE',
      accessor: 'poDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.poDate)}</span>
      )
    },
    {
      id: 'expectedDeliveryDate',
      header: 'EXPECTED DELIVERY',
      accessor: 'expectedDeliveryDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.expectedDeliveryDate)}</span>
      )
    },
    {
      id: 'referenceNumber',
      header: 'REFERENCE NUMBER',
      accessor: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{row.referenceNumber || '-'}</span>
      )
    },
    {
      id: 'grandTotal',
      header: 'GRAND TOTAL',
      accessor: 'totalAmount',
      sortable: true,
      headerClassName: 'text-right',
      cell: (row) => (
        <div className="text-right font-mono text-xs font-semibold text-zinc-900">
          {row.currency || 'INR'} {(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      headerClassName: 'text-center',
      cell: (row) => (
        <div className="text-center">
          <StatusBadge status={row.status} />
        </div>
      )
    }
  ], [navigate, buildPath]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status || '',
      onChange: (val) => setFilter('status', val),
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'SENT', label: 'Sent' },
        { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
        { value: 'RECEIVED', label: 'Received' },
        { value: 'CLOSED', label: 'Closed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'REJECTED', label: 'Rejected' },
      ]
    },
    {
      id: 'poDateFrom',
      label: 'Date From',
      type: 'date',
      value: filters.poDateFrom || '',
      onChange: (val) => setFilter('poDateFrom', val)
    },
    {
      id: 'poDateTo',
      label: 'Date To',
      type: 'date',
      value: filters.poDateTo || '',
      onChange: (val) => setFilter('poDateTo', val)
    }
  ], [filters.status, filters.poDateFrom, filters.poDateTo, setFilter]);

  const advancedFilters = useMemo(() => [
    {
      id: 'vendorId',
      label: 'Supplier',
      type: 'select',
      value: filters.vendorId || '',
      onChange: (val) => setFilter('vendorId', val),
      options: [
        { value: '', label: 'All Suppliers' },
        ...vendorList.map(v => ({ value: String(v.id), label: v.vendorName || v.name }))
      ]
    },
    {
      id: 'poDateFrom',
      label: 'PO Date From',
      type: 'date',
      value: filters.poDateFrom || '',
      onChange: (val) => setFilter('poDateFrom', val)
    },
    {
      id: 'poDateTo',
      label: 'PO Date To',
      type: 'date',
      value: filters.poDateTo || '',
      onChange: (val) => setFilter('poDateTo', val)
    },
    {
      id: 'expectedDeliveryDateFrom',
      label: 'Expected Delivery From',
      type: 'date',
      value: filters.expectedDeliveryDateFrom || '',
      onChange: (val) => setFilter('expectedDeliveryDateFrom', val)
    },
    {
      id: 'expectedDeliveryDateTo',
      label: 'Expected Delivery To',
      type: 'date',
      value: filters.expectedDeliveryDateTo || '',
      onChange: (val) => setFilter('expectedDeliveryDateTo', val)
    }
  ], [filters, setFilter, vendorList]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and track procurement"
        icon={ShoppingCart}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {canCreate() && (
              <button
                onClick={() => navigate(buildPath('/accounts/transactions/purchase-orders/new'))}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} />
                <span>New Purchase Order</span>
              </button>
            )}
          </div>
        }
      />

      <ModuleTabs tabs={purchaseTabs} />

      <div className="p-6">
        <DataTable
          data={orders}
          columns={columns}
          keyField="id"
          loading={isLoading || isFetching}
          searchable
          searchPlaceholder="Search purchase orders..."
          searchValue={searchTerm || ''}
          onSearchChange={setSearchTerm}
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}
          onReset={handleReset}
          advancedFilters={advancedFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleColumnSort}
          pagination={{
            currentPage: page,
            totalPages,
            totalElements,
            pageSize: currentSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
          columnVisibility
          selectable
          selectedRows={selectedOrders}
          onSelectionChange={setSelectedOrders}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          exportable
          onExport={() => setIsExportModalOpen(true)}
          refreshable
          onRefresh={refetch}
          getRowActions={getPoActions}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(po) => <PurchaseOrderOverview po={po} navigate={navigate} buildPath={buildPath} />}
          emptyState={{
            icon: ShoppingCart,
            title: 'No Purchase Orders found',
            description: 'Create a purchase order to start managing your procurement.',
            action: canCreate() ? {
              label: 'New Purchase Order',
              icon: Plus,
              onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/new'))
            } : null
          }}
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="purchase-orders"
      />

      <CreateAdvancePaymentModal
        isOpen={!!selectedPoForAdvance}
        onClose={() => setSelectedPoForAdvance(null)}
        purchaseOrder={selectedPoForAdvance}
      />

      {selectedPoForGrn && (
        <CreateGrnModal
          isOpen={!!selectedPoForGrn}
          onClose={() => setSelectedPoForGrn(null)}
          purchaseOrder={selectedPoForGrn}
          companyId={companyId}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
      
      <RequireAdvanceModal
        isOpen={requireAdvanceModalConfig.isOpen}
        onClose={() => setRequireAdvanceModalConfig({ isOpen: false, po: null })}
        purchaseOrder={requireAdvanceModalConfig.po}
        refetch={refetch}
      />

      <ActionReasonModal
        isOpen={reasonModalConfig.isOpen}
        onClose={() => setReasonModalConfig({ isOpen: false, poId: null, actionType: null })}
        onSubmit={async (reason) => {
          const { poId, actionType } = reasonModalConfig;
          if (processingId) return;
          
          setProcessingId(poId + actionType);
          try {
            const extraArgs = { reason };
            if (actionType === 'Reject') {
              await rejectMutation({ id: poId, companyId, ...extraArgs }).unwrap();
            } else if (actionType === 'Cancel') {
              await cancelMutation({ id: poId, companyId, ...extraArgs }).unwrap();
            }
            dispatch(addAlert({ type: 'success', message: `Purchase Order ${actionType.toLowerCase()}ed successfully.` }));
            refetch();
            setReasonModalConfig({ isOpen: false, poId: null, actionType: null });
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || `Failed to ${actionType.toLowerCase()} Purchase Order` }));
          } finally {
            setProcessingId(null);
          }
        }}
        actionType={reasonModalConfig.actionType}
        loading={processingId === reasonModalConfig.poId + reasonModalConfig.actionType}
      />
    </div>
  );
}
