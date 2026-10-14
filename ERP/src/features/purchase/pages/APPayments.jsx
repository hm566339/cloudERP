import React, { useState, useMemo } from 'react';
import {
  CreditCard, Plus, RefreshCw, Power, Search, RotateCcw,
  SlidersHorizontal, ChevronDown, ChevronUp, X, Filter,
  Trash2, Eye, FileText, ArrowRight, Download, Layers
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  useGetApPaymentsQuery,
  useCreateApPaymentMutation,
  useUpdateApPaymentMutation,
  useDeleteApPaymentMutation,
  useReverseApPaymentMutation,
  usePostApPaymentMutation,
} from '../../../api/purchase';
import { useApiQuery } from '../../../hooks/useApi';
import { vendorsApi } from '../../../api/account';
import usePermission from '../../../hooks/usePermission';
import RequirePermission from '../../../components/common/RequirePermission';
import Modal from '../../../components/common/Modal';
import { confirmDialog } from '../../../utils/confirmDialog';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import ExportModal from '../../../components/common/ExportModal';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../../features/notifications/notificationSlice';
import { PaymentMode, PaymentStatus, PostingStatus } from '../../../constants/accountingEnums';

const ALL_COLUMNS = [
  { id: 'paymentNo', key: 'paymentNo', label: 'PAYMENT NO' },
  { id: 'paymentDate', key: 'paymentDate', label: 'DATE' },
  { id: 'vendorName', key: 'vendorName', label: 'VENDOR' },
  { id: 'paymentAmount', key: 'paymentAmount', label: 'AMOUNT' },
  { id: 'paymentMode', key: 'paymentMode', label: 'METHOD' },
  { id: 'referenceNo', key: 'referenceNo', label: 'REFERENCE NO' },
  { id: 'totalAllocatedAmount', key: 'totalAllocatedAmount', label: 'ALLOCATED' },
  { id: 'vendorOutstandingBalance', key: 'vendorOutstandingBalance', label: 'OUTSTANDING' },
  { id: 'paymentStatus', key: 'paymentStatus', label: 'STATUS' },
  { id: 'glPostingStatus', key: 'glPostingStatus', label: 'GL STATUS' }
];

const DEFAULT_COLUMNS = [
  'paymentNo',
  'paymentDate',
  'vendorName',
  'paymentAmount',
  'paymentMode',
  'referenceNo',
  'totalAllocatedAmount',
  'paymentStatus',
  'glPostingStatus'
];

const STATUS_CONFIG = {
  CREATED: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REVERSED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  FAILED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

const GL_STATUS_CONFIG = {
  POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  FAILED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  NOT_POSTED: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
};

const StatusBadge = ({ status, isGl = false }) => {
  if (!status) return <span className="text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  const map = isGl ? GL_STATUS_CONFIG : STATUS_CONFIG;
  const cfg = map[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

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

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Expandable Inline Overview Drawer for AP Payment (RFQ-Style 3 Cards)
 */
const APPaymentOverview = ({ payment, onPost, onReverse, onDelete, canApprove, canDelete, navigate, pathname }) => {
  if (!payment) return null;
  const remainingUnallocated = Number(payment.paymentAmount || 0) - Number(payment.totalAllocatedAmount || 0);

  return (
    <div
      className="p-5 bg-white border border-zinc-200/80 rounded-xl shadow-xs m-2 mb-1 animate-in fade-in slide-in-from-top-2 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Overview Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {payment.paymentNo || '—'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900">
                {payment.vendorName || 'Unknown Vendor'}
              </h3>
              {payment.vendorCode && (
                <span className="font-mono text-xs text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200">
                  {payment.vendorCode}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Payment Date: <span className="font-medium text-zinc-700">{formatDate(payment.paymentDate)}</span>
              {payment.referenceNo && (
                <> | Ref: <span className="font-mono font-medium text-zinc-700">{payment.referenceNo}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={payment.paymentStatus} />
          <StatusBadge status={payment.glPostingStatus} isGl={true} />

          {/* Inline Action Buttons */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200">
            {canApprove && payment.paymentStatus === 'CREATED' && (
              <button
                type="button"
                onClick={() => onPost(payment.id)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1.5"
                title="Post to General Ledger"
              >
                <Power size={13} />
                Post to GL
              </button>
            )}

            {canApprove && payment.paymentStatus === 'POSTED' && (
              <button
                type="button"
                onClick={() => onReverse(payment.id)}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1.5"
                title="Reverse Payment"
              >
                <RefreshCw size={13} />
                Reverse
              </button>
            )}

            {canDelete && payment.paymentStatus === 'CREATED' && (
              <button
                type="button"
                onClick={() => onDelete(payment.id)}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-md transition-colors flex items-center gap-1.5"
                title="Delete Voucher"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(`${pathname}/${payment.id}`)}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>Full Details</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column RFQ-Style Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Payment & Vendor Details */}
        <div className="space-y-2.5 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <FileText size={13} className="text-zinc-600" />
            Payment & Vendor Details
          </h4>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Payment Voucher:</span>
            <span className="font-mono font-bold text-zinc-800">{payment.paymentNo || '—'}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Vendor:</span>
            <span className="font-medium text-zinc-800">{payment.vendorName || '—'}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Payment Method:</span>
            <span className="font-medium text-zinc-800 uppercase tracking-wide">{payment.paymentMode || '—'}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Reference / Cheque:</span>
            <span className="font-mono font-medium text-zinc-800">{payment.referenceNo || '—'}</span>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-zinc-500 block mb-1">Notes / Narration:</span>
            <p className="text-xs text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200/60 min-h-[44px] italic">
              {payment.narration || payment.notes || 'No narration provided.'}
            </p>
          </div>
        </div>

        {/* Card 2: Financials & Allocations */}
        <div className="space-y-2.5 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <CreditCard size={13} className="text-zinc-600" />
            Financials & Allocations
          </h4>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Total Payment Amount:</span>
            <span className="font-mono font-bold text-zinc-900 text-sm">{fmt(payment.paymentAmount)}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Allocated to Invoices:</span>
            <span className="font-mono font-semibold text-emerald-600">{fmt(payment.totalAllocatedAmount)}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Unallocated Balance:</span>
            <span className={`font-mono font-semibold ${remainingUnallocated > 0 ? 'text-amber-600' : 'text-zinc-600'}`}>
              {fmt(remainingUnallocated)}
            </span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Vendor Outstanding:</span>
            <span className="font-mono font-semibold text-zinc-700">{fmt(payment.vendorOutstandingBalance)}</span>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-zinc-500 block mb-1">
              Invoice Allocations ({payment.allocations?.length || 0}):
            </span>
            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
              {payment.allocations && payment.allocations.length > 0 ? (
                payment.allocations.map((alloc, idx) => (
                  <div key={alloc.id || idx} className="bg-white p-2 rounded border border-zinc-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-zinc-900">{alloc.invoiceNo || `Invoice #${idx + 1}`}</span>
                      {alloc.invoiceDate && <span className="text-[10px] text-zinc-400 ml-2">{formatDate(alloc.invoiceDate)}</span>}
                    </div>
                    <span className="font-mono font-semibold text-emerald-600">{fmt(alloc.allocatedAmount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic bg-white p-2.5 rounded-lg border border-zinc-200/60 text-center">
                  Direct payment voucher (no linked invoice breakdown)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Audit & Workflow */}
        <div className="space-y-2.5 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <Layers size={13} className="text-zinc-600" />
            Audit & GL Workflow
          </h4>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">GL Posting Status:</span>
            <StatusBadge status={payment.glPostingStatus} isGl={true} />
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Created Date:</span>
            <span className="font-medium text-zinc-800">{formatDate(payment.createdAt || payment.paymentDate)}</span>
          </div>

          <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Created By:</span>
            <span className="font-medium text-zinc-800">{payment.audit?.createdBy || payment.createdBy || 'System'}</span>
          </div>

          {payment.updatedAt && (
            <div className="flex justify-between text-xs py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Last Updated:</span>
              <span className="font-medium text-zinc-800">{formatDate(payment.updatedAt)}</span>
            </div>
          )}

          {payment.audit && (
            <div className="pt-1">
              <span className="text-[11px] text-zinc-500 block mb-1">Full Audit Trail:</span>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200/60 flex items-center justify-between">
                <span className="text-xs text-zinc-600">Audit metadata recorded</span>
                <AuditLogHover audit={payment.audit} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function APPayments() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const canCreate = usePermission('PAYMENT_VOUCHERS', 'CREATE');
  const canDelete = usePermission('PAYMENT_VOUCHERS', 'DELETE');
  const canApprove = usePermission('PAYMENT_VOUCHERS', 'APPROVE');
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('ap_payments_visible_cols_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

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
    if (filters.paymentStatus) q.paymentStatus = filters.paymentStatus;
    if (filters.fromPaymentDate) q.fromPaymentDate = filters.fromPaymentDate;
    if (filters.toPaymentDate) q.toPaymentDate = filters.toPaymentDate;
    if (filters.vendorId) q.vendorId = filters.vendorId;
    if (filters.paymentNo) q.paymentNo = filters.paymentNo;
    if (filters.referenceNo) q.referenceNo = filters.referenceNo;
    if (filters.paymentMode) q.paymentMode = filters.paymentMode;
    if (filters.glPostingStatus) q.glPostingStatus = filters.glPostingStatus;
    if (filters.minPaymentAmount) q.minPaymentAmount = filters.minPaymentAmount;
    if (filters.maxPaymentAmount) q.maxPaymentAmount = filters.maxPaymentAmount;
    if (filters.minAllocatedAmount) q.minAllocatedAmount = filters.minAllocatedAmount;
    if (filters.maxAllocatedAmount) q.maxAllocatedAmount = filters.maxAllocatedAmount;
    return q;
  }, [debouncedSearch, filters]);

  const { data: apiData = [], isLoading, isFetching, error, refetch } = useGetApPaymentsQuery({
    companyId,
    ...apiParams,
    ...listFilters
  });

  const allPayments = Array.isArray(apiData) ? apiData : (Array.isArray(apiData?.data) ? apiData.data : (apiData?.data?.content || apiData?.content || []));
  const pageInfo = apiData?._pageInfo || apiData?.pagination || apiData?.page || apiData?.data?._pageInfo || apiData?.data?.page;
  const currentSize = pageSize || 10;
  const totalElements = pageInfo?.totalElements || allPayments.length;
  const totalPages = pageInfo?.totalPages || Math.ceil(totalElements / currentSize) || 1;
  const apPayments = pageInfo ? allPayments : allPayments.slice(page * currentSize, (page + 1) * currentSize);

  // Mutations
  const [deletePayment] = useDeleteApPaymentMutation();
  const [postPayment] = usePostApPaymentMutation();
  const [reversePayment] = useReverseApPaymentMutation();

  const handleDelete = async (id) => {
    if (await confirmDialog({
      title: 'Delete Payment?',
      message: 'Are you sure you want to delete this payment voucher? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true
    })) {
      try {
        await deletePayment({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Payment deleted successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete payment' }));
      }
    }
  };

  const handlePost = async (id) => {
    if (await confirmDialog({
      title: 'Post to General Ledger?',
      message: 'Are you sure you want to post this payment voucher to the General Ledger?',
      confirmText: 'Post to GL'
    })) {
      try {
        await postPayment({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Payment posted to GL successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to post payment' }));
      }
    }
  };

  const handleReverse = async (id) => {
    if (await confirmDialog({
      title: 'Reverse Payment?',
      message: 'Are you sure you want to reverse this payment voucher? Outstanding balances will be updated accordingly.',
      confirmText: 'Reverse',
      isDestructive: true
    })) {
      try {
        await reversePayment({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Payment reversed successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to reverse payment' }));
      }
    }
  };

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedPayments([]);
    setPage(0);
  };

  // Export custom fallback for instant & safe CSV export
  const handleCustomExport = async ({ selectedIds }) => {
    const exportItems = selectedIds?.length > 0
      ? allPayments.filter(p => selectedIds.includes(p.id))
      : allPayments;

    if (!exportItems.length) {
      dispatch(addAlert({ type: 'warning', message: 'No payments to export.' }));
      return;
    }

    const csvRows = [
      ['Payment No', 'Date', 'Vendor Name', 'Vendor Code', 'Amount', 'Method', 'Reference No', 'Allocated', 'Outstanding', 'Payment Status', 'GL Status'].join(',')
    ];

    exportItems.forEach(p => {
      csvRows.push([
        `"${p.paymentNo || ''}"`,
        `"${formatDate(p.paymentDate)}"`,
        `"${(p.vendorName || '').replace(/"/g, '""')}"`,
        `"${p.vendorCode || ''}"`,
        `"${p.paymentAmount || 0}"`,
        `"${p.paymentMode || ''}"`,
        `"${p.referenceNo || ''}"`,
        `"${p.totalAllocatedAmount || 0}"`,
        `"${p.vendorOutstandingBalance || 0}"`,
        `"${p.paymentStatus || ''}"`,
        `"${p.glPostingStatus || ''}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Payments_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentActions = (payment) => {
    const actions = [];

    actions.push({
      key: 'view',
      tooltip: 'View Details',
      label: 'View',
      icon: <Eye size={15} />,
      className: 'text-zinc-500 hover:text-zinc-900',
      onClick: () => {
        setExpandedRowId(prev => prev === payment.id ? null : payment.id);
      }
    });

    if (canApprove && payment.paymentStatus === 'CREATED') {
      actions.push({
        key: 'post',
        tooltip: 'Post to GL',
        label: 'Post to GL',
        icon: <Power size={15} />,
        className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
        onClick: () => handlePost(payment.id)
      });
    }

    if (canApprove && payment.paymentStatus === 'POSTED') {
      actions.push({
        key: 'reverse',
        tooltip: 'Reverse Payment',
        label: 'Reverse',
        icon: <RefreshCw size={15} />,
        className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
        onClick: () => handleReverse(payment.id)
      });
    }

    if (canDelete && payment.paymentStatus === 'CREATED') {
      actions.push({
        key: 'delete',
        tooltip: 'Delete Payment',
        label: 'Delete',
        danger: true,
        icon: <Trash2 size={15} />,
        className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
        onClick: () => handleDelete(payment.id)
      });
    }

    actions.push({
      key: 'full-view',
      tooltip: 'Open Full Page',
      label: 'Full View',
      icon: <ArrowRight size={15} />,
      className: 'text-zinc-400 hover:text-primary hover:bg-zinc-50',
      onClick: () => navigate(`${location.pathname}/${payment.id}`)
    });

    return actions;
  };

  const columns = useMemo(() => [
    {
      id: 'paymentNo',
      key: 'paymentNo',
      label: 'PAYMENT NO',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <CreditCard size={15} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${location.pathname}/${row.id}`);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.paymentNo || '—'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'paymentDate',
      key: 'paymentDate',
      label: 'DATE',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600 font-medium">{formatDate(row.paymentDate)}</span>
      )
    },
    {
      id: 'vendorName',
      key: 'vendorName',
      label: 'VENDOR',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="text-xs font-semibold text-zinc-900 block">{row.vendorName || '—'}</span>
          {row.vendorCode && <span className="text-[10px] text-zinc-400 font-mono">{row.vendorCode}</span>}
        </div>
      )
    },
    {
      id: 'paymentAmount',
      key: 'paymentAmount',
      label: 'AMOUNT',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-zinc-900">
          {fmt(row.paymentAmount)}
        </span>
      )
    },
    {
      id: 'paymentMode',
      key: 'paymentMode',
      label: 'METHOD',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs font-medium text-zinc-700 uppercase tracking-wider">
          {row.paymentMode || '—'}
        </span>
      )
    },
    {
      id: 'referenceNo',
      key: 'referenceNo',
      label: 'REFERENCE NO',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-600">{row.referenceNo || '—'}</span>
      )
    },
    {
      id: 'totalAllocatedAmount',
      key: 'totalAllocatedAmount',
      label: 'ALLOCATED',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-emerald-600">
          {fmt(row.totalAllocatedAmount)}
        </span>
      )
    },
    {
      id: 'vendorOutstandingBalance',
      key: 'vendorOutstandingBalance',
      label: 'OUTSTANDING',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-amber-600">
          {fmt(row.vendorOutstandingBalance)}
        </span>
      )
    },
    {
      id: 'paymentStatus',
      key: 'paymentStatus',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <StatusBadge status={row.paymentStatus} />
      )
    },
    {
      id: 'glPostingStatus',
      key: 'glPostingStatus',
      label: 'GL STATUS',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <StatusBadge status={row.glPostingStatus} isGl={true} />
      )
    }
  ], [navigate, location.pathname]);

  const basicFilters = useMemo(() => [
    {
      key: 'paymentStatus',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        ...(PaymentStatus || []).map(opt => ({ value: opt.value, label: opt.label }))
      ]
    },
    {
      key: 'fromPaymentDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'toPaymentDate',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Status & Mode',
      fields: [
        {
          key: 'paymentStatus',
          label: 'Payment Status',
          type: 'select',
          options: [
            { value: '', label: 'All Statuses' },
            ...(PaymentStatus || []).map(opt => ({ value: opt.value, label: opt.label }))
          ]
        },
        {
          key: 'glPostingStatus',
          label: 'GL Posting Status',
          type: 'select',
          options: [
            { value: '', label: 'All Statuses' },
            ...(PostingStatus || []).map(opt => ({ value: opt.value, label: opt.label }))
          ]
        },
        {
          key: 'paymentMode',
          label: 'Payment Mode',
          type: 'select',
          options: [
            { value: '', label: 'All Modes' },
            ...(PaymentMode || []).map(opt => ({ value: opt.value, label: opt.label }))
          ]
        }
      ]
    },
    {
      title: 'Vendor & Reference',
      fields: [
        {
          key: 'vendorId',
          label: 'Vendor',
          type: 'select',
          searchable: true,
          placeholder: 'All Vendors',
          options: [
            { value: '', label: 'All Vendors' },
            ...vendorList.map(v => ({ value: String(v.id), label: v.vendorName || v.name }))
          ]
        },
        {
          key: 'referenceNo',
          label: 'Reference Number',
          type: 'text',
          placeholder: 'e.g. UTR-10294, CHQ-4820'
        }
      ]
    },
    {
      title: 'Payment Amount Range',
      fields: [
        {
          key: 'minPaymentAmount',
          label: 'Min Amount (₹)',
          type: 'number',
          placeholder: '0.00'
        },
        {
          key: 'maxPaymentAmount',
          label: 'Max Amount (₹)',
          type: 'number',
          placeholder: '0.00'
        }
      ]
    }
  ], [vendorList]);

  const filterValues = useMemo(() => ({
    paymentStatus: filters.paymentStatus || '',
    fromPaymentDate: filters.fromPaymentDate || '',
    toPaymentDate: filters.toPaymentDate || '',
    vendorId: filters.vendorId || '',
    paymentMode: filters.paymentMode || '',
    glPostingStatus: filters.glPostingStatus || '',
    minPaymentAmount: filters.minPaymentAmount || '',
    maxPaymentAmount: filters.maxPaymentAmount || '',
    referenceNo: filters.referenceNo || ''
  }), [filters]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      {/* ── Page Header ── */}
      <PageHeader
        title="Payments"
        description="Manage Accounts Payable Payments"
        icon={CreditCard}
        actions={
          <RequirePermission module="PAYMENT_VOUCHERS" action="CREATE" behavior="disable">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Add Payment</span>
            </button>
          </RequirePermission>
        }
      />

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={purchaseTabs} />

      {/* ── Table Container ── */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {error && (
          <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center justify-between">
            <span>
              {error?.data?.message || 'Notice: AP Payments is currently operating with company-level scoping constraints.'}
            </span>
          </div>
        )}
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedPayments}
          onSelectionChange={setSelectedPayments}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={apPayments}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search Payment No, Vendor, Reference..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}

          // Basic Filters
          basicFilters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => {
            setFilter(key, val);
            setPage(0);
          }}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Toolbar Actions
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('ap_payments_visible_cols_v2', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Selection & Expansion
          onRowClick={(row) => {
            setExpandedRowId(prev => prev === row.id ? null : row.id);
          }}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => {
            setExpandedRowId(prev => prev === id ? null : id);
          }}
          renderExpandedRow={(payment) => (
            <APPaymentOverview
              payment={payment}
              onPost={handlePost}
              onReverse={handleReverse}
              onDelete={handleDelete}
              canApprove={canApprove}
              canDelete={canDelete}
              navigate={navigate}
              pathname={location.pathname}
            />
          )}

          // Row Action Icons
          rowActions={getPaymentActions}

          // Pagination
          pagination={{
            page: page,
            pageSize: currentSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="payments"

          // Empty State
          emptyMessage="No payments found matching the criteria."
          emptyDescription="Try adjusting your search or filters, or create a new payment voucher."
        />
      </div>

      {/* ── Create AP Payment Modal Scaffold ── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create AP Payment" maxWidth="max-w-2xl">
        <div className="p-6 text-center text-zinc-500">
          AP Payment Form Modal Scaffold
        </div>
      </Modal>

      {/* ── Export Modal ── */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="ap-payments"
          defaultFilters={listFilters}
          selectedIds={selectedPayments}
          selectedCount={selectedPayments.length}
          onExportCustom={handleCustomExport}
        />
      )}
    </div>
  );
}