import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import {
  Plus, Search, CheckCircle, RefreshCw, FileText, RotateCcw,
  SlidersHorizontal, ChevronDown, ChevronUp, X, Edit, Trash2,
  Filter, Mail, Download, XCircle, Ban, ArrowRightCircle,
  FileMinus, FilePlus, BookOpen, Eye
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { apInvoicesApi, vendorsApi } from '../../../api/account';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import usePermission from '../../../hooks/usePermission';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import AuditLogHover from '../../../components/common/AuditLogHover';
import APInvoiceFormModal from '../components/APInvoiceFormModal';
import VendorFormModal from '../../account/components/VendorFormModal';
import ExportModal from '../../../components/common/ExportModal';
import { useRoutePath } from "../../../hooks/useRoutePath";

const STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  SUBMITTED: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  POSTED: { cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  PARTIAL_PAID: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PARTIALLY_PAID: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  OVERDUE: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
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

const PurchaseInvoiceOverview = ({ inv }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const curr = inv.invoiceCurrency || inv.currency || 'INR';

  return (
    <div className="bg-zinc-50/70 p-6 rounded-xl border border-zinc-200/80 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white text-zinc-800 rounded-lg border border-zinc-200 shadow-2xs">
            {inv.invoiceNumber || inv.invoiceNo}
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">{inv.vendorName || inv.vendor}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'} | Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={inv.status} />
          {inv.approvalStatus && (
            <span className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full border ${
              inv.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {inv.approvalStatus}
            </span>
          )}
          {inv.paymentStatus && (
            <span className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full border ${
              inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {inv.paymentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Grand Total</p>
          <p className="text-sm font-bold text-zinc-900 mt-1 font-mono">{curr} {fmt(inv.totalAmount ?? inv.grandTotal)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Outstanding</p>
          <p className="text-sm font-bold text-rose-600 mt-1 font-mono">{curr} {fmt(inv.outstandingAmount ?? inv.outstanding)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Payment %</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">{inv.paymentPercentage ?? 0}%</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Item Count</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.itemCount || (inv.items?.length) || 0}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Days Outstanding</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.daysOutstanding || 0} days</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Days Overdue</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.daysOverdue || 0} days</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-zinc-200/70 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Currency</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{curr}</p>
        </div>
      </div>
    </div>
  );
};

export default function APInvoices() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const userPermissions = useAppSelector(state => state.auth?.permissions || []);
  const safePerms = userPermissions.map(p => typeof p === 'string' ? p.toUpperCase() : '');
  const canUpdate = safePerms.includes('PURCHASE_INVOICE_EDIT') || safePerms.includes('UPDATE');
  const canDelete = safePerms.includes('PURCHASE_INVOICE_DELETE') || safePerms.includes('DELETE');
  const canApprove = usePermission('PURCHASE_INVOICES', 'APPROVE');
  const canCreateDebitNote = usePermission('DEBIT_NOTES', 'CREATE');
  const canCreateCreditNote = usePermission('CREDIT_NOTES', 'CREATE');
  const canReadGL = usePermission('GENERAL_LEDGER', 'READ');
  const canPrint = usePermission('PURCHASE_INVOICES', 'PRINT');
  const canExport = usePermission('PURCHASE_INVOICES', 'EXPORT');

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [prefillVendorName, setPrefillVendorName] = useState('');

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleBulkEmail = async () => {
    if (selectedInvoices.length === 0) return;
    if (!await confirmDialog({
      title: 'Send Bulk Email',
      message: `Are you sure you want to send email for ${selectedInvoices.length} selected invoice(s)?`,
      confirmText: 'Send Email'
    })) return;

    setIsProcessingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedInvoices) {
      try {
        await apInvoicesApi.sendEmail(id, companyId);
        successCount++;
      } catch (err) {
        console.error('Email error for ID', id, err);
        failCount++;
      }
    }

    setIsProcessingBulk(false);
    if (successCount > 0) dispatch(addAlert({ type: 'success', message: `Successfully sent email for ${successCount} invoice(s).` }));
    if (failCount > 0) dispatch(addAlert({ type: 'error', message: `Failed to send email for ${failCount} invoice(s).` }));

    setSelectedInvoices([]);
  };

  const handleBulkDownload = async () => {
    if (selectedInvoices.length === 0) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedInvoices) {
      try {
        const response = await apInvoicesApi.downloadPdf(id, companyId);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const invoice = invoices.find(i => (i.id || i.invoiceId) === id);
        const fileName = invoice?.invoiceNo ? `Purchase_Invoice_${invoice.invoiceNo}.pdf` : `Purchase_Invoice_${id}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        successCount++;
      } catch (err) {
        console.error('Download error for ID', id, err);
        failCount++;
      }
    }

    setIsProcessingBulk(false);
    if (successCount > 0) dispatch(addAlert({ type: 'success', message: `Successfully downloaded ${successCount} invoice(s).` }));
    if (failCount > 0) dispatch(addAlert({ type: 'error', message: `Failed to download ${failCount} invoice(s).` }));

    setSelectedInvoices([]);
  };

  // Filters mapping matching backend
  const listFilters = {
    keyword: debouncedSearch || undefined,
    'filter.statuses': filters.status || undefined,
    fromDate: filters.dateFrom || undefined,
    toDate: filters.dateTo || undefined,
    minAmount: filters.minTotalAmount || undefined,
    maxAmount: filters.maxTotalAmount || undefined,
    minOutstanding: filters.minOutstandingAmount || undefined,
    maxOutstanding: filters.maxOutstandingAmount || undefined,
    'filter.hasOutstandingBalance': filters.hasOutstandingBalance || undefined,
    companyId,
    ...Object.fromEntries(
      Object.entries(filters).filter(([k, v]) =>
        v !== '' && v !== undefined &&
        !['status', 'dateFrom', 'dateTo', 'minTotalAmount', 'maxTotalAmount', 'minOutstandingAmount', 'maxOutstandingAmount', 'hasOutstandingBalance'].includes(k)
      )
    )
  };

  const { data: apiData = {}, isLoading, isFetching, refetch } = useApiQuery(apInvoicesApi.getList, { ...apiParams });

  let allInvoices = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  // Local Filtering Fallback
  if (debouncedSearch) {
    const s = debouncedSearch.toLowerCase();
    allInvoices = allInvoices.filter(inv =>
      inv.invoiceNo?.toLowerCase().includes(s) ||
      inv.vendorName?.toLowerCase().includes(s) ||
      inv.companyName?.toLowerCase().includes(s)
    );
  }
  if (filters.status) {
    allInvoices = allInvoices.filter(inv => inv.status === filters.status);
  }

  const extractedTotalElements = apiData?.data?.pagination?.totalElements || apiData?.pagination?.totalElements || allInvoices.length;
  const actualTotalElements = allInvoices.length < extractedTotalElements ? allInvoices.length : extractedTotalElements;

  const currentSize = pageSize || 10;
  const totalPages = Math.ceil(actualTotalElements / currentSize) || 1;

  const isFullyLoaded = (Array.isArray(apiData) || allInvoices.length === extractedTotalElements) && allInvoices.length > 0;
  const shouldSlice = isFullyLoaded || debouncedSearch || filters.status;

  const invoices = shouldSlice
    ? allInvoices.slice(page * currentSize, (page + 1) * currentSize)
    : allInvoices;

  // Fetch detailed invoice for Edit Modal
  const { data: detailResponse } = useApiQuery(
    apInvoicesApi.getById,
    editingInvoiceId,
    { enabled: !!editingInvoiceId && editingInvoiceId !== 'undefined' && editingInvoiceId !== 'null' }
  );

  const selectedInvoice = detailResponse;

  const createMutation = useApiMutation(apInvoicesApi.create);
  const updateMutation = useApiMutation(apInvoicesApi.update);
  const submitMutation = useApiMutation(apInvoicesApi.submitForApproval);
  const approveMutation = useApiMutation(apInvoicesApi.approve);
  const rejectMutation = useApiMutation(apInvoicesApi.reject);
  const postMutation = useApiMutation(apInvoicesApi.postToGL);
  const cancelMutation = useApiMutation(apInvoicesApi.cancel);

  const handleAction = async (actionName, mutation, invoiceId, confirmMsg, successMessage) => {
    if (!await confirmDialog({
      title: `${actionName} Invoice?`,
      message: confirmMsg,
      confirmText: actionName
    })) return;
    try {
      await mutation.mutateAsync([invoiceId]);
      dispatch(addAlert({ type: 'success', message: successMessage || `${actionName} completed successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}` }));
    }
  };

  const handleCreateOrUpdate = async (payload, flags = {}) => {
    try {
      let result;
      if (editingInvoiceId) {
        result = await updateMutation.mutateAsync([editingInvoiceId, payload]);
        dispatch(addAlert({ type: 'success', message: 'Invoice updated successfully' }));
      } else {
        result = await createMutation.mutateAsync([payload]);
        dispatch(addAlert({ type: 'success', message: 'Invoice generated successfully' }));
      }
      setIsFormOpen(false);

      const newInvoiceId = editingInvoiceId || result?.data?.id || result?.id || result?.data?.invoiceId || result?.invoiceId;
      if (newInvoiceId && !editingInvoiceId) {
        if (flags.sendEmail) {
          try {
            await apInvoicesApi.sendEmail(newInvoiceId, companyId);
            dispatch(addAlert({ type: 'success', message: 'Email sent successfully' }));
          } catch (err) {
            console.error('Email error', err);
            dispatch(addAlert({ type: 'error', message: 'Invoice generated but failed to send email' }));
          }
        }

        if (flags.downloadPdf) {
          try {
            const response = await apInvoicesApi.downloadPdf(newInvoiceId, companyId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = payload.invoiceNo ? `Purchase_Invoice_${payload.invoiceNo}.pdf` : `Purchase_Invoice_${newInvoiceId}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
          } catch (err) {
            console.error('Download error', err);
            dispatch(addAlert({ type: 'error', message: 'Invoice generated but failed to download PDF' }));
          }
        }
      }

      setEditingInvoiceId(null);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save invoice' }));
    }
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const getInvoiceActions = (inv) => {
    const actions = [];

    actions.push({
      tooltip: 'View Details',
      icon: <Eye size={16} />,
      onClick: () => navigate(buildPath(`/accounts/purchases/invoices/${inv.id}`))
    });

    if ((inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL') && canUpdate) {
      actions.push({
        tooltip: 'Edit Invoice',
        icon: <Edit size={16} />,
        onClick: () => { setEditingInvoiceId(inv.id); setIsFormOpen(true); }
      });
    }

    if (inv.status === 'DRAFT' && canUpdate) {
      actions.push({
        tooltip: 'Submit for Approval',
        icon: <CheckCircle size={16} />,
        onClick: () => handleAction('Submit', submitMutation, inv.id, 'Are you sure you want to submit this invoice for approval?')
      });
    }

    if (inv.status === 'PENDING_APPROVAL' && canApprove) {
      actions.push({
        tooltip: 'Approve',
        icon: <CheckCircle size={16} className="text-emerald-600" />,
        onClick: () => handleAction('Approve', approveMutation, inv.id, 'Are you sure you want to approve this invoice?')
      });
      actions.push({
        tooltip: 'Reject',
        icon: <XCircle size={16} className="text-rose-600" />,
        onClick: () => handleAction('Reject', rejectMutation, inv.id, 'Are you sure you want to reject this invoice?')
      });
    }

    if (inv.status === 'APPROVED' && (canUpdate || canApprove)) {
      actions.push({
        tooltip: 'Post to GL',
        icon: <ArrowRightCircle size={16} className="text-purple-600" />,
        onClick: () => handleAction('Post', postMutation, inv.id, 'Are you sure you want to post this invoice to the General Ledger?')
      });
    }

    if ((inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL' || inv.status === 'APPROVED') && (canUpdate || canDelete)) {
      actions.push({
        tooltip: 'Cancel Invoice',
        icon: <Ban size={16} className="text-rose-600" />,
        onClick: () => handleAction('Cancel', cancelMutation, inv.id, 'Are you sure you want to cancel this invoice?')
      });
    }

    if (inv.status === 'APPROVED' && canCreateDebitNote) {
      actions.push({
        tooltip: 'Create Debit Note',
        icon: <FileMinus size={16} className="text-amber-600" />,
        onClick: () => navigate(buildPath(`/accounts/purchases/debit-notes/new?invoiceId=${inv.id}`))
      });
    }

    if (inv.status === 'APPROVED' && canCreateCreditNote) {
      actions.push({
        tooltip: 'Create Credit Note',
        icon: <FilePlus size={16} className="text-teal-600" />,
        onClick: () => navigate(buildPath(`/accounts/purchases/credit-notes/new?invoiceId=${inv.id}`))
      });
    }

    if (inv.status !== 'DRAFT' && inv.status !== 'PENDING_APPROVAL' && canReadGL) {
      actions.push({
        tooltip: 'View Vendor Ledger',
        icon: <BookOpen size={16} className="text-indigo-600" />,
        onClick: () => navigate(buildPath(`/accounts/ledger/vendor/${inv.vendorId}`))
      });
    }

    if (canPrint) {
      actions.push({
        tooltip: 'Print Invoice',
        icon: <FileText size={16} />,
        onClick: () => { window.open(buildPath(`/accounts/purchases/invoices/${inv.id}/print`), '_blank'); }
      });
    }

    if (canExport) {
      actions.push({
        tooltip: 'Download PDF',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            const response = await apInvoicesApi.downloadPdf(inv.id, companyId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Purchase_Invoice_${inv.invoiceNo || inv.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: 'Failed to download PDF' }));
          }
        }
      });
      actions.push({
        tooltip: 'Email Invoice',
        icon: <Mail size={16} className="text-emerald-600" />,
        onClick: async () => {
          try {
            await apInvoicesApi.sendEmail(inv.id, companyId);
            dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
          }
        }
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      id: 'invoiceNo',
      header: 'INVOICE NO',
      accessor: 'invoiceNo',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(buildPath(`/accounts/purchases/invoices/${row.id}`));
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.invoiceNo || row.invoiceNumber || '-'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'companyName',
      header: 'COMPANY',
      accessor: 'companyName',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-zinc-800">{row.companyName || '-'}</span>
      )
    },
    {
      id: 'vendorName',
      header: 'VENDOR',
      accessor: 'vendorName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-zinc-900 block">{row.vendorName || '-'}</span>
          {row.vendorGstin && <span className="text-[10px] text-zinc-400 font-mono">GST: {row.vendorGstin}</span>}
        </div>
      )
    },
    {
      id: 'invoiceDate',
      header: 'DATE',
      accessor: 'invoiceDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600 font-medium">
          {row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'dueDate',
      header: 'DUE DATE',
      accessor: 'dueDate',
      sortable: true,
      cell: (row) => (
        <div>
          <span className={`text-xs font-medium ${row.isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-700'}`}>
            {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}
          </span>
          {row.isOverdue && <span className="text-[10px] text-rose-500 block font-medium">{row.daysOverdue}d overdue</span>}
        </div>
      )
    },
    {
      id: 'totalAmount',
      header: 'TOTAL AMOUNT',
      accessor: 'totalAmount',
      sortable: true,
      headerClassName: 'text-right',
      cell: (row) => (
        <div className="text-right font-mono text-xs font-semibold text-zinc-900">
          {row.invoiceCurrency || 'INR'} {(row.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'outstandingAmount',
      header: 'OUTSTANDING',
      accessor: 'outstandingAmount',
      sortable: true,
      headerClassName: 'text-right',
      cell: (row) => (
        <div className="text-right font-mono text-xs font-semibold text-rose-600">
          {row.invoiceCurrency || 'INR'} {(row.outstandingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'paymentPercentage',
      header: 'PAID %',
      accessor: 'paymentPercentage',
      sortable: true,
      headerClassName: 'text-center',
      cell: (row) => (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 bg-zinc-200 rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full ${row.paymentPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, row.paymentPercentage || 0))}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 font-mono">{row.paymentPercentage || 0}%</span>
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
      type: 'select',
      value: filters.status || '',
      onChange: (val) => setFilter('status', val),
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SUBMITTED', label: 'Submitted' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'POSTED', label: 'Posted to GL' },
        { value: 'PARTIAL_PAID', label: 'Partially Paid' },
        { value: 'PAID', label: 'Paid' },
        { value: 'OVERDUE', label: 'Overdue' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'REJECTED', label: 'Rejected' },
      ]
    }
  ], [filters.status, setFilter]);

  const advancedFilters = useMemo(() => [
    {
      id: 'approvalStatus',
      label: 'Approval Status',
      type: 'select',
      value: filters.approvalStatus || '',
      onChange: (val) => setFilter('approvalStatus', val),
      options: [
        { value: '', label: 'All Approvals' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' }
      ]
    },
    {
      id: 'dateFrom',
      label: 'Date From',
      type: 'date',
      value: filters.dateFrom || '',
      onChange: (val) => setFilter('dateFrom', val)
    },
    {
      id: 'dateTo',
      label: 'Date To',
      type: 'date',
      value: filters.dateTo || '',
      onChange: (val) => setFilter('dateTo', val)
    },
    {
      id: 'dueDateFrom',
      label: 'Due Date From',
      type: 'date',
      value: filters.dueDateFrom || '',
      onChange: (val) => setFilter('dueDateFrom', val)
    },
    {
      id: 'dueDateTo',
      label: 'Due Date To',
      type: 'date',
      value: filters.dueDateTo || '',
      onChange: (val) => setFilter('dueDateTo', val)
    },
    {
      id: 'minTotalAmount',
      label: 'Min Total Amount',
      type: 'number',
      value: filters.minTotalAmount || '',
      onChange: (val) => setFilter('minTotalAmount', val)
    },
    {
      id: 'maxTotalAmount',
      label: 'Max Total Amount',
      type: 'number',
      value: filters.maxTotalAmount || '',
      onChange: (val) => setFilter('maxTotalAmount', val)
    },
    {
      id: 'isOverdue',
      label: 'Overdue Only',
      type: 'select',
      value: filters.isOverdue || '',
      onChange: (val) => setFilter('isOverdue', val),
      options: [
        { value: '', label: 'Any' },
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    },
    {
      id: 'hasOutstandingBalance',
      label: 'Has Outstanding',
      type: 'select',
      value: filters.hasOutstandingBalance || '',
      onChange: (val) => setFilter('hasOutstandingBalance', val),
      options: [
        { value: '', label: 'Any' },
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
  ], [filters, setFilter]);

  const bulkActions = useMemo(() => [
    {
      label: 'Email',
      icon: Mail,
      onClick: handleBulkEmail,
      disabled: isProcessingBulk
    },
    {
      label: 'Download PDF',
      icon: Download,
      onClick: handleBulkDownload,
      disabled: isProcessingBulk
    }
  ], [handleBulkEmail, handleBulkDownload, isProcessingBulk]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Purchase Invoices"
        description="Manage accounts payable bills and vendor tracking"
        icon={FileText}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <RequirePermission module="PURCHASE_INVOICES" action="CREATE">
              <button
                onClick={() => { setEditingInvoiceId(null); setIsFormOpen(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} /> <span>New Purchase Invoice</span>
              </button>
            </RequirePermission>
          </div>
        }
      />

      <ModuleTabs tabs={purchaseTabs} />

      <div className="p-6">
        <DataTable
          data={invoices}
          columns={columns}
          rowKey={(row) => row.id || row.invoiceId}
          loading={isLoading || isFetching}
          searchable
          searchPlaceholder="Search invoices, vendors, company..."
          searchValue={search || ''}
          onSearchChange={setSearch}
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
            totalElements: actualTotalElements,
            pageSize: currentSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
          columnVisibility
          selectable
          selectedRows={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
          bulkActions={bulkActions}
          exportable
          onExport={() => setIsExportModalOpen(true)}
          refreshable
          onRefresh={refetch}
          getRowActions={getInvoiceActions}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(inv) => <PurchaseInvoiceOverview inv={inv} />}
          emptyState={{
            icon: FileText,
            title: 'No invoices found',
            description: 'Try adjusting your filters or create a new purchase invoice.',
            action: {
              label: 'New Purchase Invoice',
              icon: Plus,
              onClick: () => { setEditingInvoiceId(null); setIsFormOpen(true); }
            }
          }}
        />
      </div>

      {isFormOpen && (
        <APInvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingInvoiceId(null); }}
          onSubmit={handleCreateOrUpdate}
          initialData={editingInvoiceId ? selectedInvoice : null}
        />
      )}

      <VendorFormModal
        isOpen={isVendorFormOpen}
        onClose={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); }}
        initialData={prefillVendorName ? { vendorName: prefillVendorName } : null}
        onSuccess={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); dispatch(addAlert({ type: 'success', message: 'Vendor created successfully' })); }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="ap-invoices"
      />
    </div>
  );
}
