import React, { useState, useMemo } from 'react';
import { Clock, Plus, Filter, FileText, Check, Send, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, X, RefreshCw, Download, Edit, Trash2, CheckCircle, XCircle, ShoppingCart, Banknote } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProformaInvoicesQuery, useGetProformaInvoiceByIdQuery, useDeleteProformaInvoiceMutation, useSendProformaInvoiceMutation, useConfirmProformaInvoiceMutation, useCancelProformaInvoiceMutation, useGetCustomersQuery } from '../../../api/sales-crm';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import { SkeletonBox } from '../../../components/common/SkeletonLoader';
import useApiFilters from '../../../hooks/useApiFilters';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import SalesOrderFromPiModal from '../components/SalesOrderFromPiModal';
import ProformaInvoiceFormModal from '../components/ProformaInvoiceFormModal';
import AdvancePaymentModal from '../components/AdvancePaymentModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import AuditLogHover from '../../../components/common/AuditLogHover';

const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
};

const PIStatusBadge = ({ status }) => {
  return <DataTableStatusBadge status={status || 'DRAFT'} showIcon={false} />;
};

const ProformaInvoiceOverview = ({ pi, isLoading, isError, onRetry }) => {
  const navigate = useNavigate();
  const curr = pi.currency || 'INR';
  const quotation = pi.quotation || {};
  const quotationNumber = quotation.quotationNumber || pi.sourceQuotationNumber;
  const quotationId = quotation.id || pi.sourceQuotationId;
  const items = pi.items || [];

  const taxPctOf = (it) => {
    const rates = [it?.cgstRate, it?.sgstRate, it?.igstRate, it?.cessRate];
    const present = rates.filter(v => v !== null && v !== undefined && Number(v) > 0);
    return present.length ? present.reduce((a, b) => a + Number(b), 0) : null;
  };

  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.stopPropagation()}>
      {/* PI Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {pi.piNumber}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{pi.customerName || '—'}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {fmtDate(pi.piDate)} | Valid Till: {fmtDate(pi.piValidTill)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PIStatusBadge status={pi.status} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonBox className="h-4 w-48" />
          <SkeletonBox className="h-4 w-72" />
          <SkeletonBox className="h-32 w-full" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-zinc-600">Unable to load Proforma Invoice details.</p>
          <button onClick={onRetry} className="mt-3 h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* Source Quotation */}
          <div className="mb-6 border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-500" /> Source Quotation
              </h4>
              {quotationId && (
                <button
                  onClick={() => navigate(`/accounts/transactions/quotations/${quotationId}`)}
                  className="text-xs font-semibold text-zinc-900 hover:text-zinc-700 bg-white border border-zinc-200 shadow-sm px-2.5 py-1 rounded-md transition-colors"
                >
                  View Quotation
                </button>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Quotation No.</p>
                  <p className="font-mono font-semibold text-zinc-900">{quotationNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Date</p>
                  <p className="font-medium text-zinc-900">{fmtDate(quotation.quotationDate)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                  <PIStatusBadge status={quotation.status || 'ACCEPTED'} />
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Valid Till</p>
                  <p className="font-medium text-zinc-900">{fmtDate(quotation.validTill)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Customer</p>
                  <p className="font-medium text-zinc-900">{quotation.customerName || pi.customerName || '—'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total</p>
                  <p className="font-bold text-zinc-900">{quotation.currency || curr} {fmt(quotation.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-zinc-200 rounded-lg overflow-hidden">
            <div className="p-4">
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Customer</p>
              <p className="text-sm font-bold text-zinc-900">{pi.customerName || '—'}</p>
            </div>
            <div className="p-4 border-t sm:border-t-0 sm:border-l border-zinc-200">
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Customer Code</p>
              <p className="text-sm font-mono text-zinc-700">{pi.customerCode || '—'}</p>
            </div>
            <div className="p-4 border-t sm:border-t-0 sm:border-l border-zinc-200">
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Currency</p>
              <p className="text-sm font-medium text-zinc-900">{curr}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Items</h4>
              <span className="text-xs font-semibold text-zinc-500 bg-white px-2.5 py-1 rounded-md border border-zinc-200 shadow-sm">{items.length} items</span>
            </div>
            <div className="border border-zinc-200 rounded-lg overflow-x-auto min-w-0 custom-scrollbar">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2 font-medium text-zinc-500">Product</th>
                    <th className="px-4 py-2 font-medium text-zinc-500">Description</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Qty</th>
                    <th className="px-4 py-2 font-medium text-zinc-500">Unit</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Rate</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Discount</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Tax</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Tax %</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.length > 0 ? items.map((it, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2 font-medium text-zinc-900">{it.itemName || it.productName || '—'}</td>
                      <td className="px-4 py-2 text-zinc-500 truncate max-w-[160px]">{it.description || '—'}</td>
                      <td className="px-4 py-2 text-right">{it.quantity ?? it.qty ?? 0}</td>
                      <td className="px-4 py-2">{it.unit || it.uom || '—'}</td>
                      <td className="px-4 py-2 text-right">{fmt(it.unitPrice ?? it.rate)}</td>
                      <td className="px-4 py-2 text-right">{fmt(it.discountAmount || 0)}</td>
                      <td className="px-4 py-2 text-right">{fmt(it.taxAmount || 0)}</td>
                      <td className="px-4 py-2 text-right">{taxPctOf(it) !== null ? `${taxPctOf(it)}%` : '—'}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(it.totalAmount ?? it.lineTotal)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={9} className="px-4 py-6 text-center text-zinc-400">No items available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Amount Summary */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Amount Summary</h4>
              <div className="space-y-2 text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span className="font-medium">{curr} {fmt(pi.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span className={`font-medium ${pi.discountAmount ? 'text-red-600' : ''}`}>{curr} {fmt(pi.discountAmount || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Tax Amount</span><span className="font-medium">{curr} {fmt(pi.taxAmount)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Freight Charges</span><span className="font-medium">{curr} {fmt(pi.freightCharges || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Other Charges</span><span className="font-medium">{curr} {fmt(pi.otherCharges || 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Round Off</span><span className="font-medium">{curr} {fmt(pi.roundOff || 0)}</span></div>
                <div className="pt-2 mt-2 border-t border-zinc-200 flex justify-between items-center">
                  <span className="font-bold text-zinc-900">Grand Total</span>
                  <span className="font-bold text-lg text-zinc-900">{curr} {fmt(pi.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Payment Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <span className="font-semibold text-indigo-900">Advance Required</span>
                  <span className={`font-bold ${pi.advanceRequired ? 'text-emerald-600' : 'text-zinc-500'}`}>
                    {pi.advanceRequired ? 'Yes' : 'No'}
                  </span>
                </div>
                {pi.advanceRequired && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Advance Amount</span>
                    <span className="font-bold text-zinc-900">{curr} {fmt(pi.advanceAmount)}</span>
                  </div>
                )}
                {!!pi.paymentCondition && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Payment Condition</span>
                    <span className="font-medium text-right text-zinc-900">{pi.paymentCondition}</span>
                  </div>
                )}
                {!!pi.paymentTerms && (
                  <div>
                    <span className="text-zinc-500 block mb-1">Payment Terms</span>
                    <p className="text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-100 text-xs min-h-[32px] whitespace-pre-wrap">{pi.paymentTerms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Address */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Address</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Billing Address</span>
                  <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100 min-h-[48px]">
                    {pi.billingAddressSnapshot || 'No billing address provided.'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Delivery Address</span>
                  <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100 min-h-[48px]">
                    {pi.deliveryAddressSnapshot || 'No delivery address provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Bank Details</h4>
              <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100 min-h-[48px]">
                {pi.bankDetailsSnapshot || 'No bank details provided.'}
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Additional Details</h4>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 block mb-1">Notes</span>
                <p className="text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-100 text-xs min-h-[32px] whitespace-pre-wrap">{pi.notes || '—'}</p>
              </div>
              {!!pi.deliveryTerms && (
                <div>
                  <span className="text-zinc-500 block mb-1">Delivery Terms</span>
                  <p className="text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-100 text-xs min-h-[32px] whitespace-pre-wrap">{pi.deliveryTerms}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created By</span>
                  <span className="font-medium text-right text-zinc-900">{pi.audit?.created?.by?.username || pi.createdByName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated By</span>
                  <span className="font-medium text-right text-zinc-900">{pi.audit?.updated?.by?.username || pi.updatedByName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Created Date</span>
                  <span className="font-medium text-right text-zinc-900">
                    {pi.audit?.created?.on ? new Date(pi.audit.created.on).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (pi.createdAt ? new Date(pi.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated Date</span>
                  <span className="font-medium text-right text-zinc-900">
                    {pi.audit?.updated?.on ? new Date(pi.audit.updated.on).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (pi.updatedAt ? new Date(pi.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function ProformaInvoicesPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canEdit, canDelete, canApprove } = useRBAC();
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort, debouncedSearch, apiParams } = useApiFilters(FILTER_CONFIGS.proformaInvoices || {}, { defaultPageSize: 20, defaultSortBy: 'createdAt,desc' });

  const { data: customersResponse } = useGetCustomersQuery(
    { companyId, page: 0, size: 500 },
    { skip: !companyId }
  );

  // RTK Queries & Mutations
  const { data: apiResponse, isLoading, isFetching, refetch } = useGetProformaInvoicesQuery({
    companyId,
    ...apiParams
  }, { skip: !companyId });

  const [deletePI] = useDeleteProformaInvoiceMutation();
  const [sendPI] = useSendProformaInvoiceMutation();
  const [confirmPI] = useConfirmProformaInvoiceMutation();
  const [cancelPI] = useCancelProformaInvoiceMutation();

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSalesOrderModalOpen, setIsSalesOrderModalOpen] = useState(false);
  const [isAdvancePaymentModalOpen, setIsAdvancePaymentModalOpen] = useState(false);
  const [piForAdvancePayment, setPiForAdvancePayment] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [soPiForModal, setSoPiForModal] = useState(null);
  const [isCreateDirectPiModalOpen, setIsCreateDirectPiModalOpen] = useState(false);

  // Expandable row state + on-demand details fetch (only when a row is expanded)
  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleRow = (id) => setExpandedRowId(prev => (prev === id ? null : id));

  const { data: detailsResponse, isLoading: isLoadingDetails, isError: isErrorDetails, refetch: refetchDetails } = useGetProformaInvoiceByIdQuery(
    { id: expandedRowId, companyId },
    { skip: !expandedRowId || !companyId }
  );

  const detailRaw = detailsResponse?.data?.data ?? detailsResponse?.data ?? detailsResponse;
  const detailPi = detailRaw && typeof detailRaw === 'object' ? detailRaw : null;

  // Full details for "Create Sales Order" — reuses RTK cache if the row was already expanded
  const { data: soPiResponse } = useGetProformaInvoiceByIdQuery(
    { id: soPiForModal?.id, companyId },
    { skip: !soPiForModal?.id || !companyId }
  );
  const soPiRaw = soPiResponse?.data?.data ?? soPiResponse?.data ?? soPiResponse;
  const soPiFull = soPiRaw && typeof soPiRaw === 'object' ? soPiRaw : null;

  const refreshExpanded = (piId) => {
    if (expandedRowId === piId) refetchDetails();
    refetch();
  };

  const handleSend = async (pi) => {
    if (!(await confirmDialog('Send Proforma Invoice', 'Are you sure you want to mark this Proforma Invoice as SENT?'))) return;
    try {
      await sendPI({ id: pi.id, companyId }).unwrap();
      refreshExpanded(pi.id);
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice sent successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to send Proforma Invoice' }));
    }
  };

  const handleConfirm = async (pi) => {
    if (!(await confirmDialog('Confirm Proforma Invoice', 'Once confirmed, this PI will be locked and cannot be edited. Continue?'))) return;
    try {
      await confirmPI({ id: pi.id, companyId }).unwrap();
      refreshExpanded(pi.id);
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice confirmed' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to confirm Proforma Invoice' }));
    }
  };

  const handleCancel = async (pi) => {
    if (!(await confirmDialog('Cancel Proforma Invoice', 'Are you sure you want to cancel this Proforma Invoice?'))) return;
    try {
      await cancelPI({ id: pi.id, companyId }).unwrap();
      refreshExpanded(pi.id);
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice cancelled' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to cancel Proforma Invoice' }));
    }
  };

  const handleDelete = async (pi) => {
    if (!(await confirmDialog('Delete Proforma Invoice', 'Are you sure you want to delete this Proforma Invoice?'))) return;
    try {
      await deletePI({ id: pi.id, companyId }).unwrap();
      setExpandedRowId(null);
      refetch();
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice deleted successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to delete Proforma Invoice' }));
    }
  };

  const pageData = apiResponse?.data ?? apiResponse;
  const invoices = pageData?.content ?? (Array.isArray(apiResponse) ? apiResponse : []);
  const serverPagination = apiResponse?._pageInfo || apiResponse?.pagination || pageData?.pagination || apiResponse?.page || pageData || {};
  const totalElements = serverPagination.totalElements ?? serverPagination.totalCount ?? invoices.length;
  const totalPages = serverPagination.totalPages ?? Math.max(1, Math.ceil(invoices.length / (pageSize || 10)));

  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : (customersResponse?.content || customersResponse?.data?.content || customersResponse?.data || []);

  const customerOptions = useMemo(() => customers
    .filter(customer => customer?.id)
    .map(customer => ({
      label: customer.customerName || customer.name || customer.customerCode || customer.id,
      value: customer.id
    })), [customers]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedInvoices(invoices.map(q => q.id));
    else setSelectedInvoices([]);
  };

  const columns = useMemo(() => [
    {
      key: 'invoiceNumber',
      label: 'PI NO.',
      sortable: true,
      render: (val, row) => (
        <span
          className="font-mono text-sm font-semibold text-blue-600 hover:underline cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/accounts/transactions/proforma-invoices/${row.id}`); }}
        >
          {row.piNumber}
        </span>
      )
    },
    {
      key: 'quotationNumber',
      label: 'QUOTATION NO.',
      render: (val, row) => (
        row.quotation?.quotationNumber || row.sourceQuotationNumber ? (
          <span
            className="font-mono text-sm font-medium text-blue-600 hover:underline cursor-pointer transition-colors flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); navigate(`/accounts/transactions/quotations/${row.quotation?.id || row.sourceQuotationId}`); }}
          >
            <FileText size={12} className="text-blue-400" />
            {row.quotation?.quotationNumber || row.sourceQuotationNumber}
          </span>
        ) : (
          <span className="text-sm text-zinc-400">—</span>
        )
      )
    },
    {
      key: 'customerName',
      label: 'CUSTOMER',
      sortable: true,
      render: (val, row) => <span className="font-medium text-zinc-900">{row.customerName || '—'}</span>
    },
    {
      key: 'invoiceDate',
      label: 'DATE',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600">{row.piDate ? new Date(row.piDate).toLocaleDateString() : '—'}</span>
    },
    {
      key: 'totalAmount',
      label: 'TOTAL AMOUNT',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">
          {row.currency || 'INR'} {(row.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val, row) => <PIStatusBadge status={row.status} />
    }
  ], [navigate]);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      hideAllOption: true,
      options: [
        { label: 'All Statuses', value: '' },
        ...((filterBarProps.filters || []).find(f => f.key === 'status')?.options || [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Issued', value: 'ISSUED' },
          { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Partially Converted', value: 'PARTIALLY_CONVERTED' },
          { label: 'Fully Converted', value: 'FULLY_CONVERTED' },
          { label: 'Expired', value: 'EXPIRED' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ])
      ]
    },
    {
      key: 'startDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'endDate',
      label: 'Date To',
      type: 'date'
    }
  ], [filterBarProps.filters]);

  const advancedFilters = useMemo(() => [
    {
      title: 'Document Filters',
      fields: [
        {
          key: 'piNumber',
          label: 'PI Number',
          type: 'text'
        },
        {
          key: 'sourceQuotationId',
          label: 'Source Quotation ID',
          type: 'text'
        }
      ]
    },
    {
      title: 'Customer Filters',
      fields: [
        {
          key: 'customerId',
          label: 'Customer',
          type: 'select',
          options: customerOptions
        }
      ]
    }
  ], [customerOptions]);

  const filterValues = useMemo(() => {
    const obj = {};
    (filterBarProps.filters || []).forEach(f => {
      if (f.value !== undefined && f.value !== null) {
        obj[f.key] = f.value;
      }
    });
    return obj;
  }, [filterBarProps.filters]);

  const getRowActions = (pi) => {
    const rowStatus = pi.status || 'DRAFT';
    return [
      {
        key: 'view',
        label: 'View PI',
        tooltip: 'View Proforma Invoice Details',
        'aria-label': 'View Proforma Invoice Details',
        icon: <FileText size={14} />,
        onClick: () => navigate(`/accounts/transactions/proforma-invoices/${pi.id}`),
        className: 'text-zinc-600 hover:text-indigo-600'
      },
      {
        key: 'audit',
        component: ({ row }) => <AuditLogHover audit={row.audit} />
      },
      ...(rowStatus === 'DRAFT' && canEdit() ? [
        {
          key: 'edit',
          label: 'Edit PI',
          tooltip: 'Edit Proforma Invoice',
          'aria-label': 'Edit Proforma Invoice',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/accounts/transactions/proforma-invoices/${pi.id}`),
          className: 'text-zinc-600 hover:text-blue-600'
        }
      ] : []),
      ...(rowStatus === 'DRAFT' && canDelete() ? [
        {
          key: 'delete',
          label: 'Delete PI',
          tooltip: 'Delete Proforma Invoice',
          'aria-label': 'Delete Proforma Invoice',
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => handleDelete(pi),
          className: 'text-red-600 hover:text-red-700'
        }
      ] : []),
      ...(rowStatus === 'DRAFT' && canEdit() ? [
        {
          key: 'send',
          label: 'Send PI',
          tooltip: 'Send Proforma Invoice to Customer',
          'aria-label': 'Send Proforma Invoice to Customer',
          icon: <Send size={14} />,
          onClick: () => handleSend(pi),
          className: 'text-zinc-900 hover:text-zinc-700'
        }
      ] : []),
      ...(rowStatus === 'ISSUED' && canApprove() ? [
        {
          key: 'confirm',
          label: 'Confirm PI',
          tooltip: 'Confirm Proforma Invoice',
          'aria-label': 'Confirm Proforma Invoice',
          icon: <CheckCircle size={14} />,
          onClick: () => handleConfirm(pi),
          className: 'text-emerald-600 hover:text-emerald-700'
        },
        {
          key: 'cancel',
          label: 'Cancel PI',
          tooltip: 'Cancel Proforma Invoice',
          'aria-label': 'Cancel Proforma Invoice',
          icon: <XCircle size={14} />,
          danger: true,
          onClick: () => handleCancel(pi),
          className: 'text-red-600 hover:text-red-700'
        }
      ] : []),
      ...(rowStatus === 'CONFIRMED' ? [
        {
          key: 'convert-so',
          label: 'Create Sales Order',
          tooltip: 'Convert Proforma Invoice to Sales Order',
          'aria-label': 'Convert Proforma Invoice to Sales Order',
          icon: <ShoppingCart size={14} />,
          onClick: () => setSoPiForModal(pi),
          className: 'text-zinc-900 hover:text-zinc-700'
        }
      ] : []),
      ...(rowStatus === 'CONFIRMED' && pi.advanceRequired ? [
        {
          key: 'advance-payment',
          label: 'Record Advance Payment',
          tooltip: 'Record Advance Payment',
          'aria-label': 'Record Advance Payment',
          icon: <Banknote size={14} />,
          onClick: () => {
            setPiForAdvancePayment(pi);
            setIsAdvancePaymentModalOpen(true);
          },
          className: 'text-emerald-600 hover:text-emerald-700'
        }
      ] : [])
    ];
  };

  const DEFAULT_COLUMNS = ['invoiceNumber', 'quotationNumber', 'customerName', 'invoiceDate', 'totalAmount', 'status', 'actions'];
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('proforma_visible_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 animate-in fade-in">
      {/* ── Page Header ── */}
      <PageHeader title="Proforma Invoices (PI)" description="Manage proforma invoices" icon={Clock}>
        <button
          onClick={() => setIsCreateDirectPiModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create Direct PI</span>
        </button>
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
          columns={columns}
          data={invoices}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filterBarProps.searchTerm || ''}
          searchPlaceholder="Search Proforma Invoices..."
          onSearchChange={(val) => filterBarProps.onSearchChange(val)}

          // Filters
          filters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => filterBarProps.onFilterChange(key, val)}

          // Advanced Filters
          advancedFilters={advancedFilters}
          isAdvancedOpen={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(prev => !prev)}

          // Reset, Refresh, Export
          onReset={() => {
            filterBarProps.onClearAll();
            setSelectedInvoices([]);
            setShowAdvancedFilters(false);
          }}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('proforma_visible_columns', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={toggleRow}
          renderExpandedRow={(pi) => (
            <ProformaInvoiceOverview
              pi={{ ...pi, ...(detailPi || {}) }}
              isLoading={isLoadingDetails}
              isError={isErrorDetails}
              onRetry={refetchDetails}
            />
          )}

          // Pagination
          pagination={{
            page: paginationProps.page,
            pageSize: paginationProps.pageSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          itemName="proforma invoices"

          // Empty State
          emptyMessage="No proforma invoices found"
          emptyDescription="Try adjusting your filters or search keywords."
        />
      </div>

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="proforma-invoices"
          selectedIds={selectedInvoices}
          selectedCount={selectedInvoices.length}
        />
      )}

      {soPiForModal && (
        <SalesOrderFromPiModal
          isOpen={true}
          onClose={() => setSoPiForModal(null)}
          companyId={companyId}
          proformaInvoice={soPiFull || soPiForModal}
          onSuccess={() => {
            setSoPiForModal(null);
            refetch();
          }}
        />
      )}

      {isCreateDirectPiModalOpen && (
        <ProformaInvoiceFormModal
          isOpen={isCreateDirectPiModalOpen}
          onClose={() => setIsCreateDirectPiModalOpen(false)}
          companyId={companyId}
          mode="direct"
          onSuccess={() => {
            setIsCreateDirectPiModalOpen(false);
            refetch();
          }}
        />
      )}

      <AdvancePaymentModal
        isOpen={isAdvancePaymentModalOpen}
        onClose={() => {
          setIsAdvancePaymentModalOpen(false);
          setPiForAdvancePayment(null);
        }}
        pi={piForAdvancePayment}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
