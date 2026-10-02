import React, { useState, useMemo } from 'react';
import { Plus, Eye, RefreshCw, Trash2, Edit2, Download, FileText, CheckCircle, AlertCircle, Ban, XCircle, Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, Filter, X, Send, Check, BookOpen, Undo, Receipt, FilePlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { debitNotesApi, apInvoicesApi, chartOfAccountsApi, vendorsApi, useGetAccountGroupsQuery } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import { getDebitNoteWorkflowActions } from '../../../utils/debitNotePermissions';
import { hasPermission } from '../../../utils/rbacUtils';
import Modal from '../../../components/common/Modal';
import VendorFormModal from '../../account/components/VendorFormModal';
import ComboBox from '../../../components/common/ComboBox';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import APInvoiceFormModal from '../../purchase/components/APInvoiceFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { ModuleTabs, accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';

const ALL_COLUMNS = [
  { id: 'debitNoteNo', label: 'Debit Note No.' },
  { id: 'vendorName', label: 'Vendor' },
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
  'debitNoteNo', 'vendorName', 'invoiceNo', 'noteDate', 'amount', 'allocatedAmount', 'remainingBalance', 'status', 'glPostingStatus'
];

const DebitNoteOverview = ({ debitNote }) => {
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2">
      {/* Header Pill & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-md border border-zinc-200">
            {debitNote.debitNoteNo || debitNote.id?.substring(0, 8)}
          </span>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">{debitNote.vendorName || 'Vendor Debit Note'}</h4>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
              <span>Bill/Invoice: <strong className="text-zinc-700 font-medium">{debitNote.invoiceNo || debitNote.apInvoiceId || '—'}</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-zinc-700 font-medium">{debitNote.noteDate ? new Date(debitNote.noteDate).toLocaleDateString() : '—'}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(debitNote.status)}
          {getPostingBadge(debitNote.glPostingStatus)}
        </div>
      </div>

      {/* 3-Column Info Cards matching RFQ pattern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Debit Note Details */}
        <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 pb-1 border-b border-zinc-200/60">
            <FileText size={13} /> Note Details
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Vendor:</span> <span className="font-medium text-zinc-800">{debitNote.vendorName || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Bill/Invoice:</span> <span className="font-medium text-zinc-800">{debitNote.invoiceNo || debitNote.apInvoiceId || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Reference No:</span> <span className="font-medium text-zinc-800">{debitNote.referenceNo || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Reason:</span> <span className="font-medium text-zinc-800 truncate max-w-[180px]">{debitNote.reason || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Created:</span> <span className="font-medium text-zinc-800">{debitNote.createdAt ? new Date(debitNote.createdAt).toLocaleDateString() : '—'}</span></div>
        </div>

        {/* Card 2: Financials & Taxes */}
        <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 pb-1 border-b border-zinc-200/60">
            <Receipt size={13} /> Financial Breakdown
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Total Amount:</span> <span className="font-bold text-zinc-900">{debitNote.currency || 'INR'} {Number(debitNote.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">GST Amount:</span> <span className="font-medium text-zinc-800">{debitNote.currency || 'INR'} {Number(debitNote.gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Allocated:</span> <span className="font-medium text-zinc-800">{debitNote.currency || 'INR'} {Number(debitNote.allocatedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Remaining Credit:</span> <span className="font-bold text-emerald-600">{debitNote.currency || 'INR'} {Number(debitNote.remainingBalance ?? debitNote.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        </div>

        {/* Card 3: Workflow & GL Accounts */}
        <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 space-y-2.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 pb-1 border-b border-zinc-200/60">
            <BookOpen size={13} /> Workflow & Ledger
          </h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Approval Status:</span> <span>{getStatusBadge(debitNote.status)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">GL Status:</span> <span>{getPostingBadge(debitNote.glPostingStatus)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Payable A/C:</span> <span className="font-medium text-zinc-800 font-mono text-[11px] truncate max-w-[160px]">{debitNote.payableAccountName || debitNote.payableAccountId || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Purchase Return A/C:</span> <span className="font-medium text-zinc-800 font-mono text-[11px] truncate max-w-[160px]">{debitNote.purchaseReturnAccountName || debitNote.purchaseReturnAccountId || '—'}</span></div>
          {debitNote.approvedDate && (
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Approved Date:</span> <span className="font-medium text-zinc-800">{new Date(debitNote.approvedDate).toLocaleDateString()}</span></div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'POSTED':
    case 'APPROVED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{status}</span>;
    case 'CANCELLED':
    case 'REJECTED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 text-rose-700 border-rose-200">{status}</span>;
    case 'DRAFT':
    case 'REVERSED':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">{status}</span>;
    case 'SUBMITTED':
    default:
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">{status || 'UNKNOWN'}</span>;
  }
};

const getPostingBadge = (status) => {
  switch (status) {
    case 'POSTED': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[8.8px] font-semibold rounded-md border border-emerald-200">POSTED</span>;
    case 'REVERSED': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[8.8px] font-semibold rounded-md border border-amber-200">REVERSED</span>;
    default: return <span className="px-2.5 py-1 bg-zinc-50 text-zinc-600 text-[8.8px] font-semibold rounded-md border border-zinc-200">{status || 'UNPOSTED'}</span>;
  }
};

export default function DebitNotes() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fullState = useAppSelector((state) => state);
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('debitNotes_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [prefillVendorName, setPrefillVendorName] = useState('');
  const [actionDebitNoteId, setActionDebitNoteId] = useState(null);

  const [formData, setFormData] = useState({
    apInvoiceId: '',
    debitNoteNo: '',
    noteDate: new Date().toISOString().split('T')[0],
    amount: '',
    gstAmount: '',
    referenceNo: '',
    reason: '',
    payableAccountId: '',
    purchaseReturnAccountId: ''
  });

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [activeAccountTarget, setActiveAccountTarget] = useState(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 });
  const groups = groupsResponse?.data?.content || groupsResponse?.data || groupsResponse?.content || [];

  const createAccount = async (payload) => {
    try {
      const response = await chartOfAccountsApi.create(payload);
      refetchPayable();
      refetchPurchaseReturn();
      return { success: true, data: response?.data || response };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const handleAccountSuccess = (newAccount) => {
    setIsAddAccountOpen(false);
    if (newAccount?.id) {
      if (activeAccountTarget === 'payable') {
        setFormData(prev => ({ ...prev, payableAccountId: newAccount.id }));
      } else if (activeAccountTarget === 'purchaseReturn') {
        setFormData(prev => ({ ...prev, purchaseReturnAccountId: newAccount.id }));
      }
    }
  };

  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const createInvoiceMutation = useApiMutation(apInvoicesApi.create);

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

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
      'debitNoteNo', 'referenceNo', 'vendorId', 'apInvoiceId',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    keys.forEach(k => setFilter(k, ''));
  };

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = [
      'debitNoteNo', 'referenceNo', 'vendorId', 'apInvoiceId',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    return keys.filter(k => filters[k]).length;
  }, [filters]);

  const queryFilters = {
    searchKey: debouncedSearch || undefined,
    debitNoteNo: filters.debitNoteNo || undefined,
    referenceNo: filters.referenceNo || undefined,
    vendorId: filters.vendorId || undefined,
    apInvoiceId: filters.apInvoiceId || undefined,
    statuses: filters.statuses ? [filters.statuses] : undefined,
    glPostingStatuses: filters.glPostingStatuses ? [filters.glPostingStatuses] : undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
    noteDateFrom: filters.noteDateFrom || undefined,
    noteDateTo: filters.noteDateTo || undefined,
    companyId
  };

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    debitNotesApi.getDebitNotes,
    { ...queryFilters, ...apiParams }
  );

  const { data: vendorsData } = useApiQuery(
    vendorsApi.getVendors,
    [{ isActive: true }],
    { page: 0, size: 500, sort: 'vendorName,asc' }
  );

  const { data: invoicesData, isLoading: isLoadingInvoices, isError: isErrorInvoices, refetch: refetchInvoices } = useApiQuery(apInvoicesApi.getList, {
    size: 100,
    companyId,
    'filter.statuses': 'POSTED',
    'filter.hasOutstandingBalance': true
  });

  const { data: payableAccountsData, refetch: refetchPayable } = useApiQuery(chartOfAccountsApi.getList, { size: 1000, companyId, groupCode: 'LIA-AP', groupCodes: 'LIA-AP' });
  const { data: purchaseReturnAccountsData, refetch: refetchPurchaseReturn } = useApiQuery(chartOfAccountsApi.getList, { size: 1000, companyId, categoryCode: 'EXP', categoryCodes: 'EXP' });

  const apiContent = invoicesData?.content || invoicesData?.data?.content || invoicesData?.data || invoicesData || [];
  const filteredInvoices = Array.isArray(apiContent) ? apiContent.filter(inv => inv.status === 'POSTED') : [];
  const finalOptions = filteredInvoices.map(invoice => ({
    value: invoice.id,
    label: `${invoice.invoiceNo} - ${invoice.vendorName}`
  }));

  console.log('API response:', invoicesData);
  console.log('response.data.content:', apiContent);
  console.log('filtered invoices:', filteredInvoices);
  console.log('final Select options:', finalOptions);


  const raw_payableAccounts = payableAccountsData?.data?.data || payableAccountsData?.data?.content || payableAccountsData?.data || payableAccountsData || [];
  const payableAccountsList = Array.isArray(raw_payableAccounts) ? raw_payableAccounts : [];

  const raw_purchaseReturnAccounts = purchaseReturnAccountsData?.data?.data || purchaseReturnAccountsData?.data?.content || purchaseReturnAccountsData?.data || purchaseReturnAccountsData || [];
  const purchaseReturnAccountsList = Array.isArray(raw_purchaseReturnAccounts)
    ? raw_purchaseReturnAccounts.filter(acc => /purchase\s*return|returns?\s*outward/i.test(acc.accountName))
    : [];

  const raw_debitNotesList = responseData?.data?.data || responseData?.data || responseData?.content || [];
  const debitNotes = Array.isArray(raw_debitNotesList) ? raw_debitNotesList : [];
  const pageInfo = responseData?.pagination || responseData?.data?.pagination || responseData || null;
  const vendors = vendorsData?.content || [];

  // Form Mutations
  const createMutation = useApiMutation(debitNotesApi.create);
  const updateMutation = useApiMutation(debitNotesApi.update);
  const deleteMutation = useApiMutation(debitNotesApi.delete);

  // Workflow mutations for list-level actions
  const submitMutation = useApiMutation((id) => debitNotesApi.submitDebitNote(id));
  const approveMutation = useApiMutation((id) => debitNotesApi.approveDebitNote(id));
  const rejectMutation = useApiMutation((id) => debitNotesApi.rejectDebitNote(id));
  const postMutation = useApiMutation((id) => debitNotesApi.postDebitNote(id));
  const reverseMutation = useApiMutation((id) => debitNotesApi.reverseDebitNote(id));
  const cancelMutation = useApiMutation((id) => debitNotesApi.cancelDebitNote(id));

  const workflowMutations = {
    submitMutation,
    approveMutation,
    rejectMutation,
    postMutation,
    reverseMutation,
    cancelMutation,
  };

  /** Execute a workflow action from the list with confirmation + toast */
  const handleWorkflowAction = async (debitNoteId, action) => {
    if (action.confirm) {
      const confirmed = await confirmDialog({
        title: action.confirmTitle,
        message: action.confirmMessage,
        confirmLabel: action.label,
        isDestructive: ['reject', 'cancel', 'reverse'].includes(action.key),
      });
      if (!confirmed) return;
    }

    const mutation = workflowMutations[action.mutationKey];
    if (!mutation) return;

    setActionDebitNoteId(debitNoteId);
    try {
      const response = await mutation.mutateAsync(debitNoteId);
      const message = response?.data?.message || response?.message || action.successMessage;
      dispatch(addAlert({ type: 'success', message: message }));
      refetch();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${action.label.toLowerCase()} this debit note.`
        : (err?.response?.data?.message || err?.message || `Failed to ${action.label.toLowerCase()} debit note.`);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setActionDebitNoteId(null);
    }
  };

  /** Icon lookup for workflow action buttons */
  const WORKFLOW_ICON_MAP = { Send, Check, X, BookOpen, Undo, XCircle };

  /** Build extraActions array for a debit note row's 3-dot menu */
  const buildWorkflowExtraActions = (debitNote) => {
    const actions = getDebitNoteWorkflowActions(fullState, debitNote.status);
    return actions.map((action) => {
      const IconComponent = WORKFLOW_ICON_MAP[action.icon] || FileText;
      return {
        icon: <IconComponent size={14} />,
        tooltip: action.label,
        className: `text-zinc-700 hover:bg-zinc-100`,
        onClick: () => handleWorkflowAction(debitNote.id, action),
      };
    });
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Debit Note',
      'Are you sure you want to delete this debit note? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Debit Note deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete debit note' }));
        }
      }
    );
  };

  const handleEdit = (record) => {
    if (record.status !== 'DRAFT') {
      dispatch(addAlert({ type: 'warning', message: 'Only draft debit notes can be edited.' }));
      return;
    }
    setEditingId(record.id);
    setFormData({
      apInvoiceId: record.apInvoiceId || '',
      debitNoteNo: record.debitNoteNo || '',
      noteDate: record.noteDate || new Date().toISOString().split('T')[0],
      amount: record.amount || '',
      gstAmount: record.gstAmount || '',
      referenceNo: record.referenceNo || '',
      reason: record.reason || '',
      payableAccountId: record.payableAccountId || '',
      purchaseReturnAccountId: record.purchaseReturnAccountId || ''
    });
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      apInvoiceId: '',
      debitNoteNo: '',
      noteDate: new Date().toISOString().split('T')[0],
      amount: '',
      gstAmount: '',
      referenceNo: '',
      reason: '',
      payableAccountId: '',
      purchaseReturnAccountId: ''
    });
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.apInvoiceId) return "Bill/Invoice is required";
    if (!formData.noteDate) return "Note Date is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0) return "Amount must be greater than zero";
    if (formData.gstAmount && parseFloat(formData.gstAmount) < 0) return "GST Amount cannot be negative";
    if (!formData.reason.trim()) return "Reason is required";
    if (!formData.payableAccountId) return "Payable Account is required";
    if (!formData.purchaseReturnAccountId) return "Purchase Return Account is required";
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
      const payload = {
        data: {
          apInvoiceId: formData.apInvoiceId,
          debitNoteNo: formData.debitNoteNo.trim(),
          noteDate: formData.noteDate,
          amount: parseFloat(formData.amount),
          gstAmount: formData.gstAmount ? parseFloat(formData.gstAmount) : 0,
          referenceNo: formData.referenceNo.trim(),
          reason: formData.reason.trim(),
          payableAccountId: formData.payableAccountId,
          purchaseReturnAccountId: formData.purchaseReturnAccountId
        }
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload.data });
      } else {
        await createMutation.mutateAsync({ data: payload.data });
      }
      setIsFormOpen(false);
      refetch();
      dispatch(addAlert({ type: 'success', message: 'Debit Note saved successfully' }));
    } catch (err) {
      console.error('Failed to save Debit Note:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Validation failed' }));
    }
  };

  const updateVisibleColumns = (cols) => {
    setVisibleColumns(cols);
    localStorage.setItem('debitNotes_visible_columns', JSON.stringify(cols));
  };

  const [selectedDebitNotes, setSelectedDebitNotes] = useState([]);
  const canUpdate = hasPermission(fullState, 'DEBIT_NOTES', 'UPDATE');
  const canDelete = hasPermission(fullState, 'DEBIT_NOTES', 'DELETE');

  const columns = useMemo(() => [
    {
      id: 'debitNoteNo',
      key: 'debitNoteNo',
      label: 'Debit Note No.',
      sortable: true,
      render: (val, row) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRowId(prev => prev === row.id ? null : row.id);
          }}
          className="font-mono text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-900 rounded-md border border-zinc-200 cursor-pointer hover:bg-zinc-200 transition-colors"
        >
          {val || row.id?.substring(0, 8) || '—'}
        </span>
      )
    },
    {
      id: 'vendorName',
      key: 'vendorName',
      label: 'Vendor',
      sortable: true,
      render: (val) => <span className="font-semibold text-zinc-900">{val || '—'}</span>
    },
    {
      id: 'invoiceNo',
      key: 'invoiceNo',
      label: 'Invoice No.',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600 font-medium">{val || row.apInvoiceId || '—'}</span>
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
      render: (val, row) => (
        <span className="font-medium text-emerald-600">
          {row.currency || 'INR'} {Number(val ?? row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
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
      label: 'Posting',
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
  ], []);

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
      key: 'vendorId',
      label: 'Vendor',
      type: 'select',
      options: [
        { label: 'All Vendors', value: '' },
        ...vendors.map(v => ({ label: v.vendorName, value: v.id }))
      ]
    },
    {
      key: 'glPostingStatuses',
      label: 'Posting Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Unposted', value: 'UNPOSTED' },
        { label: 'Posted', value: 'POSTED' },
        { label: 'Reversed', value: 'REVERSED' }
      ]
    },
    {
      key: 'debitNoteNo',
      label: 'Debit Note No.',
      type: 'text',
      placeholder: 'Debit Note #'
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
  ], [vendors]);

  const getRowActions = (record) => {
    const workflowActions = getDebitNoteWorkflowActions(fullState, record.status);

    const actions = [
      {
        key: 'view',
        label: 'View',
        icon: Eye,
        tooltip: expandedRowId === record.id ? 'Collapse Details' : 'View Details',
        active: expandedRowId === record.id,
        onClick: () => {
          setExpandedRowId(prev => prev === record.id ? null : record.id);
        }
      },
      ...(record.status === 'DRAFT' && canUpdate ? [{
        key: 'edit',
        label: 'Edit',
        icon: Edit2,
        tooltip: 'Edit Debit Note',
        onClick: () => handleEdit(record)
      }] : []),
      ...workflowActions.map(action => {
        const IconComponent = WORKFLOW_ICON_MAP[action.icon] || FileText;
        return {
          key: action.key,
          label: action.label,
          icon: IconComponent,
          tooltip: action.label,
          variant: action.key === 'post' ? 'indigo' : action.key === 'approve' ? 'emerald' : action.key === 'reject' || action.key === 'cancel' ? 'danger' : 'blue',
          onClick: () => handleWorkflowAction(record.id, action)
        };
      }),
      ...(record.status === 'DRAFT' && canDelete ? [{
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        tooltip: 'Delete Debit Note',
        danger: true,
        onClick: () => handleDelete(record.id)
      }] : [])
    ];

    return actions;
  };

  const handleReset = () => {
    handleClearFilters();
    setSelectedDebitNotes([]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        icon={FilePlus}
        title="Debit Notes"
        description="Manage vendor debit notes, purchase returns, and supplier adjustments"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <Download size={15} /> Export
            </button>
            <RequirePermission module="DEBIT_NOTES" action="CREATE">
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                New Debit Note
              </button>
            </RequirePermission>
          </div>
        }
      />

      <ModuleTabs tabs={accountingTabs} />

      <div className="p-6">
        <DataTable
          data={debitNotes}
          columns={columns}
          loading={isLoading || isFetching}
          selectable={true}
          selectedRows={selectedDebitNotes}
          onSelectionChange={setSelectedDebitNotes}
          rowKey="id"
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
          searchPlaceholder="Search Debit Notes..."
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
          renderExpandedRow={(row) => <DebitNoteOverview debitNote={row} />}
          rowActions={getRowActions}
          pagination={{
            page: page,
            pageSize: pageSize,
            totalElements: pageInfo?.totalElements ?? debitNotes.length,
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
        title={editingId ? 'Edit Debit Note' : 'New Debit Note'}
        maxWidth="max-w-[576px]"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Bill/Invoice *</label>
              <ComboBox
                name="apInvoiceId"
                value={formData.apInvoiceId}
                onChange={(val) => setFormData(prev => ({ ...prev, apInvoiceId: val }))}
                options={finalOptions}
                placeholder="Search Invoice..."
                onCreateClick={(searchTerm) => {
                  setInvoiceSearchTerm(searchTerm);
                  setIsAddInvoiceOpen(true);
                }}
                createSubtext="Create new bill/invoice"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white border border-zinc-200 rounded-lg text-sm hover:border-zinc-300 focus:border-zinc-400 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Debit Note No.</label>
              <input
                type="text"
                name="debitNoteNo"
                value={formData.debitNoteNo}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Leave empty to auto-generate"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Note Date *</label>
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
              <label className="text-sm font-semibold text-zinc-700">Reference No.</label>
              <input
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleInputChange}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">GST Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="gstAmount"
                value={formData.gstAmount}
                onChange={handleInputChange}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Payable Account *</label>
              <ComboBox
                name="payableAccountId"
                value={formData.payableAccountId}
                onChange={(val) => handleInputChange({ target: { name: 'payableAccountId', value: val } })}
                options={payableAccountsList.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                placeholder="Search Payable Account..."
                onCreateClick={(searchTerm) => {
                  setAccountSearchTerm(searchTerm);
                  setActiveAccountTarget('payable');
                  setIsAddAccountOpen(true);
                }}
                createSubtext="Add as new account"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white border border-zinc-200 rounded-lg text-sm hover:border-zinc-300 focus:border-zinc-400 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Purchase Return Account *</label>
              <ComboBox
                name="purchaseReturnAccountId"
                value={formData.purchaseReturnAccountId}
                onChange={(val) => handleInputChange({ target: { name: 'purchaseReturnAccountId', value: val } })}
                options={purchaseReturnAccountsList.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                placeholder="Search Return Account..."
                onCreateClick={(searchTerm) => {
                  setAccountSearchTerm(searchTerm);
                  setActiveAccountTarget('purchaseReturn');
                  setIsAddAccountOpen(true);
                }}
                createSubtext="Add as new account"
                inputClassName="w-full h-9 pl-8 pr-2 bg-white border border-zinc-200 rounded-lg text-sm hover:border-zinc-300 focus:border-zinc-400 outline-none"
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
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Debit Note'}
            </button>
          </div>
        </form>
      </Modal>

      <VendorFormModal
        isOpen={isVendorFormOpen}
        onClose={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); }}
        initialData={prefillVendorName ? { vendorName: prefillVendorName } : null}
        onSuccess={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); dispatch(addAlert({ type: 'success', message: 'Vendor created successfully' })); }}
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
        <APInvoiceFormModal
          isOpen={true}
          onClose={() => setIsAddInvoiceOpen(false)}
          initialData={{ invoiceNo: invoiceSearchTerm }}
          onSubmit={async (payload) => {
            try {
              const response = await createInvoiceMutation.mutateAsync(payload);
              dispatch(addAlert({ type: 'success', message: 'Invoice created successfully' }));
              setIsAddInvoiceOpen(false);
              refetchInvoices();
              if (response?.id) {
                setFormData(prev => ({ ...prev, apInvoiceId: response.id }));
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
        reportName="debit-notes"
      />
    </div>
  );
}
