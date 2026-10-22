import React, { useState, useMemo } from 'react';
import {
  Plus, Eye, RefreshCw, Trash2, Edit2, Download, FileText,
  CheckCircle, AlertCircle, Ban, XCircle, Search, RotateCcw,
  SlidersHorizontal, ChevronDown, ChevronUp, Filter, X,
  Send, Check, BookOpen, Undo, Receipt, FileMinus, ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { creditNotesApi, salesInvoicesApi, chartOfAccountsApi, customersApi, useGetAccountGroupsQuery } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import { getCreditNoteWorkflowActions } from '../../../utils/creditNotePermissions';
import { hasPermission } from '../../../utils/rbacUtils';
import Modal from '../../../components/common/Modal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomerFormModal from '../../account/components/CustomerFormModal';
import ComboBox from '../../../components/common/ComboBox';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import InvoiceFormModal from '../../sales/components/InvoiceFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { ModuleTabs, accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';

const ALL_COLUMNS = [
  { id: 'creditNoteNo', label: 'Credit Note No.' },
  { id: 'customerName', label: 'Customer' },
  { id: 'invoiceNo', label: 'Invoice No.' },
  { id: 'noteDate', label: 'Date' },
  { id: 'amount', label: 'Amount' },
  { id: 'allocatedAmount', label: 'Allocated' },
  { id: 'remainingBalance', label: 'Remaining' },
  { id: 'status', label: 'Status' },
  { id: 'glPostingStatus', label: 'GL Status' },
  { id: 'gstAmount', label: 'GST Amount' },
  { id: 'referenceNo', label: 'Reference No.' },
  { id: 'approvedDate', label: 'Approved Date' },
  { id: 'createdAt', label: 'Created At' }
];

const DEFAULT_COLUMNS = [
  'creditNoteNo', 'customerName', 'invoiceNo', 'noteDate', 'amount', 'allocatedAmount', 'remainingBalance', 'status', 'glPostingStatus'
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'POSTED':
    case 'APPROVED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 uppercase">{status}</span>;
    case 'CANCELLED':
    case 'REJECTED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 uppercase">{status}</span>;
    case 'DRAFT':
    case 'REVERSED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D] uppercase">{status}</span>;
    case 'SUBMITTED':
    default:
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 dark:bg-[#4C8DFF]/10 text-blue-700 dark:text-[#4C8DFF] border-blue-200 dark:border-[#4C8DFF]/30 uppercase">{status || 'UNKNOWN'}</span>;
  }
};

const getPostingBadge = (status) => {
  switch (status) {
    case 'POSTED': return <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8.8px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-500/30 uppercase">POSTED</span>;
    case 'REVERSED': return <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[8.8px] font-semibold rounded-md border border-amber-200 dark:border-amber-500/30 uppercase">REVERSED</span>;
    case 'FAILED': return <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[8.8px] font-semibold rounded-md border border-rose-200 dark:border-rose-500/30 uppercase">FAILED</span>;
    default: return <span className="px-2.5 py-1 bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] text-[8.8px] font-semibold rounded-md border border-zinc-200 dark:border-[#2A2F3D] uppercase">{status || 'UNPOSTED'}</span>;
  }
};

const CreditNoteOverview = ({ creditNote, onViewDetails }) => {
  const calculatedRemaining = Number(creditNote.remainingBalance ?? (Number(creditNote.amount || 0) - Number(creditNote.allocatedAmount || 0)));

  return (
    <div className="p-5 bg-white dark:bg-[#161922] border border-zinc-100 dark:border-[#2A2F3D] rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2">
      {/* Header Pill & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] rounded-md border border-zinc-200 dark:border-[#2A2F3D]">
            {creditNote.creditNoteNo || creditNote.id?.substring(0, 8)}
          </span>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{creditNote.customerName || 'Customer Credit Note'}</h4>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
              <span>Invoice: <strong className="text-zinc-700 dark:text-[#E6E8EE] font-medium">{creditNote.invoiceNo || creditNote.salesInvoiceId || '—'}</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-zinc-700 dark:text-[#E6E8EE] font-medium">{creditNote.noteDate ? new Date(creditNote.noteDate).toLocaleDateString() : '—'}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(creditNote.status)}
          {getPostingBadge(creditNote.glPostingStatus)}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(creditNote)}
              className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 dark:text-[#4C8DFF] bg-blue-50 dark:bg-[#4C8DFF]/10 border border-blue-200 dark:border-[#4C8DFF]/30 rounded-lg hover:bg-blue-100 dark:hover:bg-[#4C8DFF]/20 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={13} /> View Full Details
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Credit Note Details */}
        <div className="bg-zinc-50/50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5 pb-1 border-b border-zinc-200/60 dark:border-[#2A2F3D]">
            <FileText size={13} /> Note Details
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Customer:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.customerName || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Sales Invoice:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.invoiceNo || creditNote.salesInvoiceId || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Reference No:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.referenceNo || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Reason:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE] truncate max-w-[180px]">{creditNote.reason || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Created:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.createdAt ? new Date(creditNote.createdAt).toLocaleDateString() : '—'}</span></div>
        </div>

        {/* Card 2: Financials & Taxes */}
        <div className="bg-zinc-50/50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5 pb-1 border-b border-zinc-200/60 dark:border-[#2A2F3D]">
            <Receipt size={13} /> Financial Breakdown
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Total Amount:</span> <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{creditNote.currency || 'INR'} {Number(creditNote.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">GST Amount:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.currency || 'INR'} {Number(creditNote.gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Allocated:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{creditNote.currency || 'INR'} {Number(creditNote.allocatedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Remaining Credit:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{creditNote.currency || 'INR'} {calculatedRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        </div>

        {/* Card 3: Workflow & GL Accounts */}
        <div className="bg-zinc-50/50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5 pb-1 border-b border-zinc-200/60 dark:border-[#2A2F3D]">
            <BookOpen size={13} /> Workflow & Ledger
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Approval Status:</span> <span>{getStatusBadge(creditNote.status)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">GL Status:</span> <span>{getPostingBadge(creditNote.glPostingStatus)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Receivable A/C:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE] font-mono text-[11px] truncate max-w-[160px]">{creditNote.receivableAccountName || creditNote.receivableAccountId || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Revenue Adj A/C:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE] font-mono text-[11px] truncate max-w-[160px]">{creditNote.revenueAdjustmentAccountName || creditNote.revenueAdjustmentAccountId || '—'}</span></div>
          {creditNote.approvedDate && (
            <div className="flex justify-between text-xs"><span className="text-zinc-500 dark:text-[#A0A6B5]">Approved Date:</span> <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{new Date(creditNote.approvedDate).toLocaleDateString()}</span></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CreditNotes() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const location = useLocation();
  const authState = useAppSelector((state) => state.auth);
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('creditNotes_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [prefillCustomerName, setPrefillCustomerName] = useState('');

  const createCustomerMutation = useApiMutation(customersApi.create);

  const handleCreateCustomerFromSearch = async (payload) => {
    try {
      await createCustomerMutation.mutateAsync([payload]);
      dispatch(addAlert({ type: 'success', message: 'Customer created successfully' }));
      setIsCustomerFormOpen(false);
      setPrefillCustomerName('');
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create customer' }));
    }
  };

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [activeAccountTarget, setActiveAccountTarget] = useState(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 });
  const groups = groupsResponse?.data?.content || groupsResponse?.data || groupsResponse?.content || [];

  const createAccount = async (payload) => {
    try {
      const response = await chartOfAccountsApi.create(payload);
      refetchReceivable();
      refetchRevenue();
      return { success: true, data: response?.data || response };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const handleAccountSuccess = (newAccount) => {
    setIsAddAccountOpen(false);
    if (newAccount?.id) {
      if (activeAccountTarget === 'receivable') {
        setFormData(prev => ({ ...prev, receivableAccountId: newAccount.id }));
      } else if (activeAccountTarget === 'revenue') {
        setFormData(prev => ({ ...prev, revenueAdjustmentAccountId: newAccount.id }));
      }
    }
  };

  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const createInvoiceMutation = useApiMutation(salesInvoicesApi.create);
  const [actionCreditNoteId, setActionCreditNoteId] = useState(null);

  const generateDefaultCreditNoteNo = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CN-${y}${m}-${rand}`;
  };

  const [formData, setFormData] = useState({
    salesInvoiceId: '',
    creditNoteNo: '',
    noteDate: new Date().toISOString().split('T')[0],
    amount: '',
    gstAmount: '',
    referenceNo: '',
    reason: '',
    receivableAccountId: '',
    revenueAdjustmentAccountId: ''
  });

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter
  } = useUrlFilters({ size: 10 });

  const handleClearFilters = () => {
    setSearch('');
    setFilter('statuses', '');
    setFilter('noteDateFrom', '');
    setFilter('noteDateTo', '');

    // Clear advanced filters
    const keys = [
      'creditNoteNo', 'referenceNo', 'customerId', 'salesInvoiceId',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    keys.forEach(k => setFilter(k, ''));
  };

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = [
      'creditNoteNo', 'referenceNo', 'customerId', 'salesInvoiceId',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    return keys.filter(k => filters[k]).length;
  }, [filters]);

  const queryFilters = {
    searchKey: debouncedSearch || undefined,
    creditNoteNo: filters.creditNoteNo || undefined,
    referenceNo: filters.referenceNo || undefined,
    customerId: filters.customerId || undefined,
    salesInvoiceId: filters.salesInvoiceId || undefined,
    statuses: filters.statuses ? [filters.statuses] : undefined,
    glPostingStatuses: filters.glPostingStatuses ? [filters.glPostingStatuses] : undefined,
    minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
    maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
    noteDateFrom: filters.noteDateFrom || undefined,
    noteDateTo: filters.noteDateTo || undefined,
    companyId
  };

  const payload = {
    page: apiParams.page,
    size: apiParams.size,
    ...(sortBy ? { sort: `${sortBy},${sortOrder || 'asc'}` } : {}),
    ...queryFilters
  };

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    creditNotesApi.getCreditNotes,
    payload
  );

  const { data: customersData } = useApiQuery(
    customersApi.getList,
    [{ isActive: true }],
    { page: 0, size: 100, sort: 'customerName,asc' }
  );

  const { data: invoicesData, refetch: refetchInvoices } = useApiQuery(salesInvoicesApi.getList, { size: 100, companyId, eligibleForCreditNote: true });

  const { data: receivableAccountsData, refetch: refetchReceivable } = useApiQuery(chartOfAccountsApi.getList, { size: 100, companyId, groupCode: 'AST-AR', groupCodes: 'AST-AR' });
  const { data: revenueAccountsData, refetch: refetchRevenue } = useApiQuery(chartOfAccountsApi.getList, { size: 100, companyId, categoryCode: 'INC', categoryCodes: 'INC' });

  const raw_invoicesList = invoicesData?.data?.content || invoicesData?.data || invoicesData || [];
  const invoicesList = Array.isArray(raw_invoicesList) ? raw_invoicesList : [];

  const raw_receivableAccounts = receivableAccountsData?.data?.data || receivableAccountsData?.data?.content || receivableAccountsData?.data || receivableAccountsData || [];
  const receivableAccountsList = Array.isArray(raw_receivableAccounts) ? raw_receivableAccounts : [];

  const raw_revenueAccounts = revenueAccountsData?.data?.data || revenueAccountsData?.data?.content || revenueAccountsData?.data || revenueAccountsData || [];
  const revenueAccountsList = Array.isArray(raw_revenueAccounts) ? raw_revenueAccounts : [];

  const raw_creditNotesList = responseData?.data?.data || responseData?.data || responseData?.content || [];
  const creditNotes = Array.isArray(raw_creditNotesList) ? raw_creditNotesList : [];
  const pageInfo = responseData?.pagination || responseData?.data?.pagination || responseData || null;
  const customers = customersData?.content || [];

  // Form Mutations
  const createMutation = useApiMutation(creditNotesApi.createCreditNote);
  const updateMutation = useApiMutation(creditNotesApi.updateCreditNote);
  const deleteMutation = useApiMutation(creditNotesApi.deleteCreditNote);

  // Workflow mutations for list-level actions
  const submitMutation = useApiMutation((id) => creditNotesApi.submitCreditNote(id));
  const approveMutation = useApiMutation((id) => creditNotesApi.approveCreditNote(id));
  const rejectMutation = useApiMutation((id) => creditNotesApi.rejectCreditNote(id));
  const postMutation = useApiMutation((id) => creditNotesApi.postCreditNote(id));
  const reverseMutation = useApiMutation((id) => creditNotesApi.reverseCreditNote(id));
  const cancelMutation = useApiMutation((id) => creditNotesApi.cancelCreditNote(id));

  const workflowMutations = {
    submitMutation,
    approveMutation,
    rejectMutation,
    postMutation,
    reverseMutation,
    cancelMutation,
  };

  /** Execute a workflow action from the list with confirmation + toast */
  const handleWorkflowAction = async (creditNoteId, action) => {
    if (action.confirm) {
      const confirmed = await confirmDialog({
        title: action.confirmTitle,
        message: action.confirmMessage,
        confirmLabel: action.label,
        isDestructive: ['reject', 'cancel', 'reverse', 'delete'].includes(action.key),
      });
      if (!confirmed) return;
    }

    const mutation = workflowMutations[action.mutationKey];
    if (!mutation) return;

    setActionCreditNoteId(creditNoteId);
    try {
      const response = await mutation.mutateAsync(creditNoteId);
      const message = response?.data?.message || response?.message || action.successMessage;
      dispatch(addAlert({ type: 'success', message: message }));
      refetch();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${action.label.toLowerCase()} this credit note.`
        : (err?.response?.data?.message || err?.response?.data?.error || err?.message || `Failed to ${action.label.toLowerCase()} credit note.`);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setActionCreditNoteId(null);
    }
  };

  /** Icon lookup for workflow action buttons */
  const WORKFLOW_ICON_MAP = { Send, Check, X, BookOpen, Undo, XCircle };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete Credit Note',
      message: 'Are you sure you want to delete this credit note? This action cannot be undone.',
      confirmLabel: 'Delete',
      isDestructive: true
    });
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      dispatch(addAlert({ type: 'success', message: 'Credit Note deleted successfully' }));
      refetch();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to delete credit note';
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  const handleEdit = (record) => {
    if (record.status !== 'DRAFT') {
      dispatch(addAlert({ type: 'warning', message: 'Only draft credit notes can be edited.' }));
      return;
    }
    setEditingId(record.id);
    setFormData({
      salesInvoiceId: record.salesInvoiceId || '',
      creditNoteNo: record.creditNoteNo || '',
      noteDate: record.noteDate || new Date().toISOString().split('T')[0],
      amount: record.amount ?? '',
      gstAmount: record.gstAmount ?? '',
      referenceNo: record.referenceNo || '',
      reason: record.reason || '',
      receivableAccountId: record.receivableAccountId || '',
      revenueAdjustmentAccountId: record.revenueAdjustmentAccountId || ''
    });
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      salesInvoiceId: '',
      creditNoteNo: generateDefaultCreditNoteNo(),
      noteDate: new Date().toISOString().split('T')[0],
      amount: '',
      gstAmount: '',
      referenceNo: '',
      reason: '',
      receivableAccountId: '',
      revenueAdjustmentAccountId: ''
    });
    setIsFormOpen(true);
  };

  const handleInvoiceChange = (invId) => {
    const selectedInv = invoicesList.find(i => i.id === invId);
    setFormData(prev => ({
      ...prev,
      salesInvoiceId: invId,
      receivableAccountId: selectedInv?.receivableAccountId || prev.receivableAccountId || '',
      amount: prev.amount || (selectedInv?.eligibleCreditAmount ?? selectedInv?.outstandingAmount ?? selectedInv?.totalAmount ?? '')
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.salesInvoiceId) return "Sales Invoice is required";
    if (!formData.creditNoteNo?.trim()) return "Credit Note Number is required";
    if (!formData.noteDate) return "Note Date is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0) return "Amount must be greater than zero";
    if (formData.gstAmount && parseFloat(formData.gstAmount) < 0) return "GST Amount cannot be negative";
    if (!formData.reason?.trim()) return "Reason is required";
    if (!formData.receivableAccountId) return "Receivable Account is required";
    if (!formData.revenueAdjustmentAccountId) return "Revenue Adjustment Account is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      dispatch(addAlert({ type: 'error', message: error }));
      return;
    }

    try {
      const payloadData = {
        salesInvoiceId: formData.salesInvoiceId,
        creditNoteNo: formData.creditNoteNo.trim(),
        noteDate: formData.noteDate,
        amount: parseFloat(formData.amount),
        gstAmount: formData.gstAmount ? parseFloat(formData.gstAmount) : 0,
        referenceNo: formData.referenceNo?.trim() || undefined,
        reason: formData.reason.trim(),
        receivableAccountId: formData.receivableAccountId,
        revenueAdjustmentAccountId: formData.revenueAdjustmentAccountId
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payloadData });
      } else {
        await createMutation.mutateAsync(payloadData);
      }
      setIsFormOpen(false);
      refetch();
      dispatch(addAlert({ type: 'success', message: `Credit Note ${editingId ? 'updated' : 'created'} successfully` }));
    } catch (err) {
      console.error('Failed to save Credit Note:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Validation failed';
      dispatch(addAlert({ type: 'error', message: errMsg }));
    }
  };

  const updateVisibleColumns = (cols) => {
    setVisibleColumns(cols);
    localStorage.setItem('creditNotes_visible_columns', JSON.stringify(cols));
  };

  const [selectedCreditNotes, setSelectedCreditNotes] = useState([]);
  const canUpdate = hasPermission(authState, 'CREDIT_NOTES', 'UPDATE');
  const canDelete = hasPermission(authState, 'CREDIT_NOTES', 'DELETE');

  const columns = useMemo(() => [
    {
      id: 'creditNoteNo',
      key: 'creditNoteNo',
      label: 'Credit Note No.',
      sortable: true,
      render: (val, row) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(buildPath(`transactions/credit-notes/${row.id}`));
          }}
          className="font-mono text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] rounded-md border border-zinc-200 dark:border-[#2A2F3D] cursor-pointer hover:bg-zinc-200 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-[#4C8DFF] transition-colors"
          title="Click to view full details"
        >
          {val || row.id?.substring(0, 8) || '—'}
        </span>
      )
    },
    {
      id: 'customerName',
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (val) => <span className="font-semibold text-zinc-900">{val || '—'}</span>
    },
    {
      id: 'invoiceNo',
      key: 'invoiceNo',
      label: 'Invoice No.',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600 font-medium">{val || row.salesInvoiceId || '—'}</span>
    },
    {
      id: 'noteDate',
      key: 'noteDate',
      label: 'Date',
      sortable: true,
      render: (val) => <span className="text-zinc-600">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    },
    {
      id: 'amount',
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">
          {row.currency || 'INR'} {Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: 'allocatedAmount',
      key: 'allocatedAmount',
      label: 'Allocated',
      align: 'right',
      render: (val, row) => (
        <span className="text-zinc-600">
          {row.currency || 'INR'} {Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: 'remainingBalance',
      key: 'remainingBalance',
      label: 'Remaining',
      align: 'right',
      render: (val, row) => {
        const rem = Number(val ?? (Number(row.amount || 0) - Number(row.allocatedAmount || 0)));
        return (
          <span className="font-medium text-emerald-600">
            {row.currency || 'INR'} {rem.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      id: 'status',
      key: 'status',
      label: 'Status',
      align: 'center',
      sortable: true,
      render: (val) => getStatusBadge(val)
    },
    {
      id: 'glPostingStatus',
      key: 'glPostingStatus',
      label: 'Posting Status',
      align: 'center',
      sortable: true,
      render: (val) => getPostingBadge(val)
    },
    {
      id: 'gstAmount',
      key: 'gstAmount',
      label: 'GST Amount',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-600">
          {row.currency || 'INR'} {Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: 'referenceNo',
      key: 'referenceNo',
      label: 'Reference No.',
      render: (val) => <span className="text-zinc-600">{val || '—'}</span>
    },
    {
      id: 'approvedDate',
      key: 'approvedDate',
      label: 'Approved Date',
      render: (val) => <span className="text-zinc-600">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    },
    {
      id: 'createdAt',
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
      render: (val) => <span className="text-zinc-600">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    }
  ], [navigate, buildPath]);

  const basicFilters = useMemo(() => [
    {
      key: 'statuses',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Posted', value: 'POSTED' },
        { label: 'Reversed', value: 'REVERSED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      key: 'noteDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'noteDateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFiltersConfig = useMemo(() => [
    {
      key: 'customerId',
      label: 'Customer',
      type: 'select',
      options: [
        { label: 'All Customers', value: '' },
        ...customers.map(c => ({ label: c.customerName, value: c.id }))
      ]
    },
    {
      key: 'glPostingStatuses',
      label: 'Posting Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft / Unposted', value: 'DRAFT' },
        { label: 'Posted', value: 'POSTED' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Reversed', value: 'REVERSED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      key: 'creditNoteNo',
      label: 'Credit Note No.',
      type: 'text',
      placeholder: 'Credit Note #'
    },
    {
      key: 'referenceNo',
      label: 'Reference No.',
      type: 'text',
      placeholder: 'Reference #'
    },
    {
      key: 'minAmount',
      label: 'Min Amount',
      type: 'number',
      placeholder: 'Min Amount'
    },
    {
      key: 'maxAmount',
      label: 'Max Amount',
      type: 'number',
      placeholder: 'Max Amount'
    }
  ], [customers]);

  const getRowActions = (record) => {
    const workflowActions = getCreditNoteWorkflowActions(authState, record.status);
    const isRowActionPending = actionCreditNoteId === record.id;

    const actions = [
      {
        key: 'view',
        label: 'View',
        icon: Eye,
        tooltip: 'View Full Details',
        onClick: () => {
          navigate(buildPath(`transactions/credit-notes/${record.id}`));
        }
      },
      ...(record.status === 'DRAFT' && canUpdate ? [{
        key: 'edit',
        label: 'Edit',
        icon: Edit2,
        tooltip: 'Edit Credit Note',
        onClick: () => handleEdit(record)
      }] : []),
      ...workflowActions.map(action => {
        const IconComponent = WORKFLOW_ICON_MAP[action.icon] || FileText;
        return {
          key: action.key,
          label: action.label,
          icon: IconComponent,
          tooltip: action.label,
          disabled: isRowActionPending,
          variant: action.key === 'post' ? 'indigo' : action.key === 'approve' ? 'emerald' : action.key === 'reject' || action.key === 'cancel' ? 'danger' : 'blue',
          onClick: () => handleWorkflowAction(record.id, action)
        };
      }),
      ...(record.status === 'DRAFT' && canDelete ? [{
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        tooltip: 'Delete Credit Note',
        danger: true,
        disabled: isRowActionPending,
        onClick: () => handleDelete(record.id)
      }] : [])
    ];

    return actions;
  };

  const handleReset = () => {
    handleClearFilters();
    setSelectedCreditNotes([]);
  };

  const selectedInvoice = useMemo(() => {
    return invoicesList.find(i => i.id === formData.salesInvoiceId);
  }, [formData.salesInvoiceId, invoicesList]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        icon={FileMinus}
        title="Credit Notes"
        description="Manage customer credit notes, sales returns, and revenue adjustments"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <Download size={15} /> Export
            </button>
            <RequirePermission module="CREDIT_NOTES" action="CREATE">
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                New Credit Note
              </button>
            </RequirePermission>
          </div>
        }
      />

      <ModuleTabs tabs={accountingTabs} />

      <div className="p-6">
        <DataTable
          data={creditNotes}
          columns={columns}
          loading={isLoading || isFetching}
          selectable={true}
          selectedRows={selectedCreditNotes}
          onSelectionChange={setSelectedCreditNotes}
          rowKey="id"
          pageIndexBase={0}
          bulkActions={[
            {
              label: 'Export Selected',
              icon: Download,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          searchable={true}
          searchValue={search || ''}
          onSearchChange={(val) => setSearch(val)}
          searchPlaceholder="Search credit notes by number or customer..."
          basicFilters={basicFilters}
          filterValues={filters}
          onFilterChange={(key, val) => setFilter(key, val)}
          advancedFilters={advancedFiltersConfig}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={updateVisibleColumns}
          onReset={handleReset}
          onRefresh={refetch}
          isRefreshing={isLoading || isFetching}
          exportable={true}
          onExport={() => setIsExportModalOpen(true)}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(row) => (
            <CreditNoteOverview
              creditNote={row}
              onViewDetails={(cn) => navigate(buildPath(`transactions/credit-notes/${cn.id}`))}
            />
          )}
          rowActions={getRowActions}
          pagination={{
            page: page,
            pageSize: pageSize,
            totalElements: pageInfo?.totalElements ?? creditNotes.length,
            totalPages: pageInfo?.totalPages ?? 1
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={{
            key: sortBy,
            direction: sortOrder
          }}
          onSortChange={handleColumnSort}
          itemName="items"
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Credit Note' : 'New Credit Note'}
        maxWidth="max-w-[620px]"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Sales Invoice *</label>
              <ComboBox
                name="salesInvoiceId"
                value={formData.salesInvoiceId}
                onChange={handleInvoiceChange}
                options={invoicesList.map(inv => ({
                  value: inv.id,
                  label: `${inv.invoiceNumber || inv.invoiceNo} - ${inv.customerName} ${inv.eligibleCreditAmount ? `(Available: ${inv.invoiceCurrency || 'INR'} ${inv.eligibleCreditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})` : ''}`
                }))}
                placeholder="Search Invoice..."
                onCreateClick={(searchTerm) => {
                  setInvoiceSearchTerm(searchTerm);
                  setIsAddInvoiceOpen(true);
                }}
                createSubtext="Create new sales invoice"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none dark:text-[#E6E8EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Credit Note No. *</label>
              <input
                type="text"
                name="creditNoteNo"
                value={formData.creditNoteNo}
                onChange={handleInputChange}
                className="input-field w-full font-mono"
                placeholder="e.g. CN-202609-1001"
                required
              />
            </div>
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs space-y-1 text-blue-900 dark:text-blue-300">
              <div className="flex justify-between">
                <span>Customer: <strong>{selectedInvoice.customerName || '—'}</strong></span>
                <span>Outstanding: <strong>{selectedInvoice.invoiceCurrency || 'INR'} {Number(selectedInvoice.outstandingAmount || selectedInvoice.eligibleCreditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Note Date *</label>
              <input
                type="date"
                name="noteDate"
                value={formData.noteDate}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Reference No.</label>
              <input
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Optional customer reference"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">GST Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="gstAmount"
                value={formData.gstAmount}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Receivable Account *</label>
              <ComboBox
                name="receivableAccountId"
                value={formData.receivableAccountId}
                onChange={(val) => handleInputChange({ target: { name: 'receivableAccountId', value: val } })}
                options={receivableAccountsList.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                placeholder="Search Receivable Account..."
                onCreateClick={(searchTerm) => {
                  setAccountSearchTerm(searchTerm);
                  setActiveAccountTarget('receivable');
                  setIsAddAccountOpen(true);
                }}
                createSubtext="Add as new account"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none dark:text-[#E6E8EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">Revenue Adjustment Account *</label>
              <ComboBox
                name="revenueAdjustmentAccountId"
                value={formData.revenueAdjustmentAccountId}
                onChange={(val) => handleInputChange({ target: { name: 'revenueAdjustmentAccountId', value: val } })}
                options={revenueAccountsList.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                placeholder="Search Revenue Account..."
                onCreateClick={(searchTerm) => {
                  setAccountSearchTerm(searchTerm);
                  setActiveAccountTarget('revenue');
                  setIsAddAccountOpen(true);
                }}
                createSubtext="Add as new account"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none dark:text-[#E6E8EE]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Reason *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="input-field w-full h-20 resize-none py-2"
              placeholder="Reason for credit note / adjustment..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Credit Note'}
            </button>
          </div>
        </form>
      </Modal>

      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => { setIsCustomerFormOpen(false); setPrefillCustomerName(''); }}
        initialData={prefillCustomerName ? { customerName: prefillCustomerName } : null}
        onSubmit={handleCreateCustomerFromSearch}
      />

      <ChartOfAccountsModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        accountGroups={groups}
        initialData={{ accountName: accountSearchTerm }}
        onSubmit={createAccount}
        onSuccess={handleAccountSuccess}
      />

      {isAddInvoiceOpen && (
        <InvoiceFormModal
          isOpen={true}
          onClose={() => setIsAddInvoiceOpen(false)}
          initialData={{ invoiceNumber: invoiceSearchTerm }}
          onSubmit={async (payload) => {
            try {
              const response = await createInvoiceMutation.mutateAsync(payload);
              dispatch(addAlert({ type: 'success', message: 'Invoice created successfully' }));
              setIsAddInvoiceOpen(false);
              refetchInvoices();
              if (response?.data?.id || response?.id) {
                setFormData(prev => ({ ...prev, salesInvoiceId: response?.data?.id || response?.id }));
              }
            } catch (error) {
              dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create invoice' }));
            }
          }}
          isSubmitting={createInvoiceMutation.isPending}
        />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="credit-notes"
      />
    </div>
  );
}
