import React, { useState, useMemo } from 'react';
import {
  Plus, Search, CheckCircle, RefreshCw, FileText, RotateCcw,
  SlidersHorizontal, ChevronDown, ChevronUp, X, Edit, Trash2,
  Filter, Mail, Download, XCircle, Ban, ArrowRightCircle,
  FileMinus, FilePlus, BookOpen, Eye, Receipt
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
import DataTable from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import APInvoiceFormModal from '../components/APInvoiceFormModal';
import VendorFormModal from '../../account/components/VendorFormModal';
import ExportModal from '../../../components/common/ExportModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import StatusBadge from '../../../components/common/StatusBadge';

const ALL_COLUMNS = [
  { id: 'invoiceNo', label: 'INVOICE NO' },
  { id: 'companyName', label: 'COMPANY' },
  { id: 'vendorName', label: 'VENDOR' },
  { id: 'invoiceDate', label: 'DATE' },
  { id: 'dueDate', label: 'DUE DATE' },
  { id: 'totalAmount', label: 'TOTAL AMOUNT' },
  { id: 'outstandingAmount', label: 'OUTSTANDING' },
  { id: 'paymentPercentage', label: 'PAID %' },
  { id: 'status', label: 'STATUS' }
];

const DEFAULT_COLUMNS = ['invoiceNo', 'companyName', 'vendorName', 'invoiceDate', 'dueDate', 'totalAmount', 'outstandingAmount', 'paymentPercentage', 'status'];

const PurchaseInvoiceOverview = ({ inv }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const curr = inv.invoiceCurrency || inv.currency || 'INR';

  return (
    <div className="bg-zinc-50/70 p-6 rounded-xl border border-zinc-200/80 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white dark:bg-surface-dark text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-border-dark shadow-2xs">
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
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Grand Total</p>
          <p className="text-sm font-bold text-zinc-900 mt-1 font-mono">{curr} {fmt(inv.totalAmount ?? inv.grandTotal)}</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Outstanding</p>
          <p className="text-sm font-bold text-rose-600 mt-1 font-mono">{curr} {fmt(inv.outstandingAmount ?? inv.outstanding)}</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Payment %</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">{inv.paymentPercentage ?? 0}%</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Item Count</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.itemCount || (inv.items?.length) || 0}</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Days Outstanding</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.daysOutstanding || 0} days</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Days Overdue</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.daysOverdue || 0} days</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200/70 dark:border-border-dark shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Currency</p>
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

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('api_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

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
    setSearch('');
    setSelectedInvoices([]);
    setPage(0);
  };

  const getInvoiceActions = (inv) => {
    const actions = [];

    actions.push({
      key: 'view',
      label: 'View Details',
      tooltip: 'View Details',
      'aria-label': 'View Details',
      icon: <Eye size={14} />,
      onClick: () => navigate(buildPath(`/accounts/purchases/invoices/${inv.id}`)),
      className: 'text-zinc-600 hover:text-indigo-600'
    });

    if ((inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL') && canUpdate) {
      actions.push({
        key: 'edit',
        label: 'Edit Invoice',
        tooltip: 'Edit Invoice',
        'aria-label': 'Edit Invoice',
        icon: <Edit size={14} />,
        onClick: () => { setEditingInvoiceId(inv.id); setIsFormOpen(true); },
        className: 'text-zinc-600 hover:text-blue-600'
      });
    }

    if (inv.status === 'DRAFT' && canUpdate) {
      actions.push({
        key: 'submit',
        label: 'Submit for Approval',
        tooltip: 'Submit for Approval',
        'aria-label': 'Submit for Approval',
        icon: <CheckCircle size={14} />,
        onClick: () => handleAction('Submit', submitMutation, inv.id, 'Are you sure you want to submit this invoice for approval?'),
        className: 'text-zinc-600 hover:text-emerald-600'
      });
    }

    if (inv.status === 'PENDING_APPROVAL' && canApprove) {
      actions.push({
        key: 'approve',
        label: 'Approve',
        tooltip: 'Approve',
        'aria-label': 'Approve',
        icon: <CheckCircle size={14} className="text-emerald-600" />,
        onClick: () => handleAction('Approve', approveMutation, inv.id, 'Are you sure you want to approve this invoice?'),
        className: 'text-emerald-600 hover:text-emerald-700'
      });
      actions.push({
        key: 'reject',
        label: 'Reject',
        tooltip: 'Reject',
        'aria-label': 'Reject',
        icon: <XCircle size={14} className="text-rose-600" />,
        onClick: () => handleAction('Reject', rejectMutation, inv.id, 'Are you sure you want to reject this invoice?'),
        className: 'text-rose-600 hover:text-rose-700'
      });
    }

    if (inv.status === 'APPROVED' && (canUpdate || canApprove)) {
      actions.push({
        key: 'post',
        label: 'Post to GL',
        tooltip: 'Post to GL',
        'aria-label': 'Post to GL',
        icon: <ArrowRightCircle size={14} className="text-purple-600" />,
        onClick: () => handleAction('Post', postMutation, inv.id, 'Are you sure you want to post this invoice to the General Ledger?'),
        className: 'text-purple-600 hover:text-purple-700'
      });
    }

    if ((inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL' || inv.status === 'APPROVED') && (canUpdate || canDelete)) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Invoice',
        tooltip: 'Cancel Invoice',
        'aria-label': 'Cancel Invoice',
        icon: <Ban size={14} className="text-rose-600" />,
        onClick: () => handleAction('Cancel', cancelMutation, inv.id, 'Are you sure you want to cancel this invoice?'),
        className: 'text-rose-600 hover:text-rose-700'
      });
    }

    if (inv.status === 'APPROVED' && canCreateDebitNote) {
      actions.push({
        key: 'debit-note',
        label: 'Create Debit Note',
        tooltip: 'Create Debit Note',
        'aria-label': 'Create Debit Note',
        icon: <FileMinus size={14} className="text-amber-600" />,
        onClick: () => navigate(buildPath(`/accounts/purchases/debit-notes/new?invoiceId=${inv.id}`)),
        className: 'text-amber-600 hover:text-amber-700'
      });
    }

    if (inv.status === 'APPROVED' && canCreateCreditNote) {
      actions.push({
        key: 'credit-note',
        label: 'Create Credit Note',
        tooltip: 'Create Credit Note',
        'aria-label': 'Create Credit Note',
        icon: <FilePlus size={14} className="text-teal-600" />,
        onClick: () => navigate(buildPath(`/accounts/purchases/credit-notes/new?invoiceId=${inv.id}`)),
        className: 'text-teal-600 hover:text-teal-700'
      });
    }

    if (inv.status !== 'DRAFT' && inv.status !== 'PENDING_APPROVAL' && canReadGL) {
      actions.push({
        key: 'ledger',
        label: 'View Vendor Ledger',
        tooltip: 'View Vendor Ledger',
        'aria-label': 'View Vendor Ledger',
        icon: <BookOpen size={14} className="text-indigo-600" />,
        onClick: () => navigate(buildPath(`/accounts/ledger/vendor/${inv.vendorId}`)),
        className: 'text-indigo-600 hover:text-indigo-700'
      });
    }

    if (canPrint) {
      actions.push({
        key: 'print',
        label: 'Print Invoice',
        tooltip: 'Print Invoice',
        'aria-label': 'Print Invoice',
        icon: <FileText size={14} />,
        onClick: () => { window.open(buildPath(`/accounts/purchases/invoices/${inv.id}/print`), '_blank'); },
        className: 'text-zinc-600 hover:text-zinc-800'
      });
    }

    if (canExport) {
      actions.push({
        key: 'download',
        label: 'Download PDF',
        tooltip: 'Download PDF',
        'aria-label': 'Download PDF',
        icon: <Download size={14} />,
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
        },
        className: 'text-zinc-600 hover:text-zinc-800'
      });
      actions.push({
        key: 'email',
        label: 'Email Invoice',
        tooltip: 'Email Invoice',
        'aria-label': 'Email Invoice',
        icon: <Mail size={14} className="text-emerald-600" />,
        onClick: async () => {
          try {
            await apInvoicesApi.sendEmail(inv.id, companyId);
            dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
          }
        },
        className: 'text-emerald-600 hover:text-emerald-700'
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      key: 'invoiceNo',
      id: 'invoiceNo',
      label: 'INVOICE NO',
      header: 'INVOICE NO',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
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
      key: 'companyName',
      id: 'companyName',
      label: 'COMPANY',
      header: 'COMPANY',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{row.companyName || '-'}</span>
      )
    },
    {
      key: 'vendorName',
      id: 'vendorName',
      label: 'VENDOR',
      header: 'VENDOR',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">{row.vendorName || '-'}</span>
          {row.vendorGstin && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">GST: {row.vendorGstin}</span>}
        </div>
      )
    },
    {
      key: 'invoiceDate',
      id: 'invoiceDate',
      label: 'DATE',
      header: 'DATE',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          {row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'dueDate',
      id: 'dueDate',
      label: 'DUE DATE',
      header: 'DUE DATE',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className={`text-xs font-medium ${row.isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-700 dark:text-zinc-300'}`}>
            {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}
          </span>
          {row.isOverdue && <span className="text-[10px] text-rose-500 block font-medium">{row.daysOverdue}d overdue</span>}
        </div>
      )
    },
    {
      key: 'totalAmount',
      id: 'totalAmount',
      label: 'TOTAL AMOUNT',
      header: 'TOTAL AMOUNT',
      sortable: true,
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <div className="text-right font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {row.invoiceCurrency || 'INR'} {(row.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: 'outstandingAmount',
      id: 'outstandingAmount',
      label: 'OUTSTANDING',
      header: 'OUTSTANDING',
      sortable: true,
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <div className="text-right font-mono text-xs font-semibold text-rose-600">
          {row.invoiceCurrency || 'INR'} {(row.outstandingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: 'paymentPercentage',
      id: 'paymentPercentage',
      label: 'PAID %',
      header: 'PAID %',
      sortable: true,
      align: 'center',
      headerClassName: 'text-center',
      render: (val, row) => (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 bg-zinc-200 dark:bg-[#2A2F3D] rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full ${row.paymentPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, row.paymentPercentage || 0))}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 font-mono">{row.paymentPercentage || 0}%</span>
        </div>
      )
    },
    {
      key: 'status',
      id: 'status',
      label: 'STATUS',
      header: 'STATUS',
      sortable: true,
      align: 'center',
      headerClassName: 'text-center',
      render: (val, row) => (
        <div className="text-center">
          <StatusBadge status={row.status} />
        </div>
      )
    }
  ], [navigate, buildPath]);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Posted to GL', value: 'POSTED' },
        { label: 'Partially Paid', value: 'PARTIAL_PAID' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Rejected', value: 'REJECTED' }
      ]
    },
    {
      key: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'dateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Approval & Due Date',
      fields: [
        {
          key: 'approvalStatus',
          label: 'Approval Status',
          type: 'select',
          options: [
            { label: 'All Approvals', value: '' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' }
          ]
        },
        {
          key: 'dueDateFrom',
          label: 'Due Date From',
          type: 'date'
        },
        {
          key: 'dueDateTo',
          label: 'Due Date To',
          type: 'date'
        }
      ]
    },
    {
      title: 'Financials & Status',
      fields: [
        {
          key: 'minTotalAmount',
          label: 'Min Total Amount',
          type: 'number'
        },
        {
          key: 'maxTotalAmount',
          label: 'Max Total Amount',
          type: 'number'
        },
        {
          key: 'isOverdue',
          label: 'Overdue Only',
          type: 'select',
          options: [
            { label: 'Any', value: '' },
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' }
          ]
        },
        {
          key: 'hasOutstandingBalance',
          label: 'Has Outstanding',
          type: 'select',
          options: [
            { label: 'Any', value: '' },
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' }
          ]
        }
      ]
    }
  ], []);

  const filterValues = useMemo(() => ({
    status: filters.status || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    approvalStatus: filters.approvalStatus || '',
    dueDateFrom: filters.dueDateFrom || '',
    dueDateTo: filters.dueDateTo || '',
    minTotalAmount: filters.minTotalAmount || '',
    maxTotalAmount: filters.maxTotalAmount || '',
    isOverdue: filters.isOverdue || '',
    hasOutstandingBalance: filters.hasOutstandingBalance || ''
  }), [filters]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Top Header */}
      <PageHeader
        title="Purchase Invoices"
        description="Manage accounts payable bills and vendor tracking"
        icon={Receipt}
      >
        <RequirePermission module="PURCHASE_INVOICES" action="CREATE">
          <button
            onClick={() => { setEditingInvoiceId(null); setIsFormOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>New Purchase Invoice</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={purchaseTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
          bulkActions={[
            {
              key: 'email',
              label: 'Email',
              icon: <Mail size={14} />,
              onClick: handleBulkEmail,
              disabled: isProcessingBulk
            },
            {
              key: 'download',
              label: 'Download PDF',
              icon: <Download size={14} />,
              onClick: handleBulkDownload,
              disabled: isProcessingBulk
            },
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={invoices}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={search || ''}
          searchPlaceholder="Search invoices, vendors, company..."
          onSearchChange={(val) => { setSearch(val); setPage(0); }}

          // Filters
          filters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => { setFilter(key, val); setPage(0); }}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset, Refresh, Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('api_visible_columns_v2', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getInvoiceActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(inv) => <PurchaseInvoiceOverview inv={inv} />}

          // Pagination
          pagination={{
            page,
            pageSize: currentSize,
            totalPages,
            totalElements: actualTotalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="invoices"

          // Empty State
          emptyMessage="No purchase invoices found"
          emptyDescription="Record your first vendor bill to track accounts payable and disbursements."
        />
      </div>

      {/* Invoice Form Modal */}
      {isFormOpen && (
        <APInvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingInvoiceId(null); }}
          onSubmit={handleCreateOrUpdate}
          invoice={selectedInvoice}
          companyId={companyId}
          onOpenNewVendor={(name) => {
            setPrefillVendorName(name || '');
            setIsVendorFormOpen(true);
          }}
        />
      )}

      {/* Vendor Form Modal */}
      {isVendorFormOpen && (
        <VendorFormModal
          isOpen={isVendorFormOpen}
          onClose={() => setIsVendorFormOpen(false)}
          companyId={companyId}
          initialData={prefillVendorName ? { name: prefillVendorName, vendorName: prefillVendorName } : null}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="purchase-invoices"
          defaultFilters={listFilters}
          selectedIds={selectedInvoices}
          selectedCount={selectedInvoices.length}
        />
      )}
    </div>
  );
}
