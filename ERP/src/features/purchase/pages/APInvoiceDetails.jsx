import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, Share2, FileText, ShoppingCart, 
  Package, LayoutList, History, Activity, Calendar, Lock, 
  Unlock, CheckCircle, AlertCircle, BarChart2, CreditCard, RefreshCw,
  Building2, DollarSign, Clock, ShieldAlert, CheckSquare, ChevronDown,
  Paperclip, User, FilePlus, XCircle, Percent, Eye, FileMinus, ArrowRightCircle, RotateCcw, Send, Check, X, Undo, Banknote, StopCircle, ChevronRight, Mail
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { apInvoicesApi } from '../../../api/account/apInvoices';
import Modal from '../../../components/common/Modal';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { getWorkflowActions, isReadOnly, canEditInvoice } from '../../../utils/invoicePermissions';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import PaymentVoucherFormModal from '../components/PaymentVoucherFormModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import APInvoiceItemsTable from '../components/APInvoiceItemsTable';
import APInvoiceEditModal from '../components/APInvoiceEditModal';
import APInvoiceKpiCards from '../components/APInvoiceKpiCards';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status, labelPrefix = '' }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    SUCCESS: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    FAILED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    PARTIALLY_PAID: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    UNPAID: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    OVERDUE: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CANCELLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
    VOIDED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {labelPrefix}{s.replace('_', ' ')}
    </span>
  );
};

export default function APInvoiceDetails() {
  const { id: paramId, invoiceId: routeInvoiceId } = useParams();
  const id = routeInvoiceId || paramId;
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const authState = useAppSelector(state => state.auth);
  const userRole = authState?.user?.role || 'viewer';
  const readOnly = isReadOnly(authState);

  const [activeTab, setActiveTab] = useState('overview');
  const [relatedSubTab, setRelatedSubTab] = useState('payments');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const displayValue = (value) => 
    value === null || value === undefined || value === "" ? "N/A" : value;

  const { data: response, isLoading, error, refetch } = useApiQuery(
    apInvoicesApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const inv = (raw && typeof raw === 'object' && ('invoiceNo' in raw || 'invoiceNumber' in raw || 'vendorName' in raw || 'totalAmount' in raw))
    ? raw
    : (raw?.data || raw);

  // Compute workflow actions dynamically from status + permissions
  const workflowActions = inv ? getWorkflowActions(fullState, inv.status, inv.paymentStatus) : [];



  const [formData, setFormData] = useState({
    invoiceNo: '',
    invoiceDate: '',
    dueDate: '',
    referenceNumber: '',
    notes: '',
    vendorInvoiceNo: ''
  });

  const updateMutation = useApiMutation(
    (payload) => apInvoicesApi.update(id, payload),
    {
      onSuccess: () => {
        dispatch(addAlert({ type: 'success', message: 'Purchase Invoice updated successfully' }));
        setIsEditModalOpen(false);
        refetch();
      },
      onError: (err) => {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update purchase invoice' }));
      }
    }
  );

  const handleOpenEditModal = () => {
    if (inv) {
      setFormData({
        invoiceNo: inv.invoiceNo || inv.invoiceNumber || '',
        invoiceDate: inv.invoiceDate || '',
        dueDate: inv.dueDate || '',
        referenceNumber: inv.referenceNumber || '',
        notes: inv.notes || inv.remarks || '',
        vendorInvoiceNo: inv.vendorInvoiceNo || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  // NOTE: useApiMutation only accepts the api function — onSuccess is handled in handleAction
  const submitMutation = useApiMutation(() => apInvoicesApi.submitForApproval(id));
  const approveMutation = useApiMutation(() => apInvoicesApi.approve(id));
  const rejectMutation = useApiMutation(() => apInvoicesApi.reject(id));
  const cancelMutation = useApiMutation(() => apInvoicesApi.cancel(id));
  const postMutation = useApiMutation(() => apInvoicesApi.postToGL(id));
  const reverseMutation = useApiMutation(() => apInvoicesApi.reverse(id));
  const writeOffMutation = useApiMutation(() => apInvoicesApi.writeOff(id));
  const voidMutation = useApiMutation(() => apInvoicesApi.voidInvoice(id));

  // Map mutation keys to mutation objects for dynamic lookup
  const mutations = {
    submitMutation,
    approveMutation,
    rejectMutation,
    cancelMutation,
    postMutation,
    reverseMutation,
    writeOffMutation,
    voidMutation,
  };

  const handleAction = async (mutation, actionName, needsConfirm = false) => {
    if (needsConfirm) {
      if (!await confirmDialog({ title: `Confirm ${actionName}`, message: `Are you sure you want to ${actionName.toLowerCase()} this invoice?` })) return;
    }
    try {
      await mutation.mutateAsync();
      // Success: show toast, close dropdown, refresh data
      dispatch(addAlert({ type: 'success', message: `${actionName} completed successfully.` }));
      setShowMoreActions(false);
      await refetch();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${actionName.toLowerCase()} this invoice.`
        : (err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  /** Handle a workflow action click from the dynamic menu */
  const handleWorkflowAction = (action) => {
    if (action.type === 'edit') {
      handleOpenEditModal();
      setShowMoreActions(false);
      return;
    }
    if (action.type === 'payment') {
      setShowPaymentModal(true);
      setShowMoreActions(false);
      return;
    }
    // workflow type — use mutation
    const mutation = mutations[action.mutationKey];
    if (mutation) {
      handleAction(mutation, action.label, action.confirm);
    }
  };

  if (isLoading) return <PageLoader message="Loading Purchase Invoice details..." />;

  if (error || !inv) {
    return (
      <ErrorState 
        title="Purchase Invoice Not Found" 
        message={error?.message || "The requested purchase invoice could not be found."} 
        onRetry={refetch} 
      />
    );
  }

  const curr = inv.invoiceCurrency || inv.currency || 'INR';
  const companyInfo = inv.companyInformation || inv.company || {};
  const vendorInfo = inv.vendorInformation || inv.vendorDetails || {};
  const items = inv.items || inv.lineItems || inv.purchaseItems || [];
  const taxSummary = inv.taxSummary || {};
  const payments = inv.paymentHistory || inv.payments || [];
  const vendorLedger = inv.vendorLedger || {};
  const journalEntry = inv.journalEntry || inv.glJournalEntry || {};
  const ledgerImpact = inv.ledgerImpact || inv.ledgerPostings || [];
  const inventoryInfo = inv.inventoryInformation || inv.inventory || {};
  const relatedDocs = inv.relatedDocuments || {};
  const approvalInfo = inv.approvalWorkflow || inv.approval || {};
  const auditInfo = inv.auditInformation || {};
  const attachments = Array.isArray(inv.attachments) ? inv.attachments : [];

  const totalAmount = inv.totalAmount ?? inv.grandTotal ?? 0;
  const totalPaid = inv.paymentInformation?.totalPaid ?? inv.receivedAmount ?? 0;
  const outstandingAmount = inv.paymentInformation?.outstandingAmount ?? inv.outstandingAmount ?? (totalAmount - totalPaid);
  const paymentPercentage = inv.paymentInformation?.paymentPercentage ?? inv.paymentPercentage ?? (totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'items', label: 'Purchase Items', icon: <ShoppingCart size={16} /> },
    { id: 'tax', label: 'Tax Summary', icon: <Percent size={16} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
    { id: 'vendorLedger', label: 'Vendor Ledger', icon: <User size={16} /> },
    { id: 'journals', label: 'Journal Entry', icon: <FileText size={16} /> },
    { id: 'ledger', label: 'Ledger Impact', icon: <BookOpen size={16} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={16} /> },
    { id: 'docs', label: 'Related Documents', icon: <FileCheck size={16} /> },
    { id: 'approval', label: 'Approval Workflow', icon: <CheckSquare size={16} /> },
    { id: 'related', label: 'Related Transactions', icon: <Network size={16} /> },
    { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <History size={16} /> }
  ];

  const isEmpty = (arr) => !arr || arr.length === 0;

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath('/accounts/purchases/invoices'))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {inv.invoiceNo || inv.invoiceNumber}
              </h1>
              <span className="text-sm font-medium text-zinc-600">
                ({inv.vendorName || inv.vendor})
              </span>
              <StatusBadge status={inv.status} />
              <StatusBadge status={inv.approvalStatus || 'PENDING'} />
              <StatusBadge status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />
              {inv.inventorySyncStatus && <StatusBadge status={inv.inventorySyncStatus} labelPrefix="INV: " />}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Date: {inv.invoiceDate} &mdash; Due: {inv.dueDate}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* More Actions Dropdown — hidden for read-only users (AUDITOR, VIEWER) */}
          {!readOnly && (
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(prev => !prev)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <span>More Actions</span>
                <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
              </button>
              {showMoreActions && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-2"
                >
                  {/* ─── Dynamic Workflow Actions ─── */}
                  {workflowActions.length > 0 && (
                    <>
                      {workflowActions.map((action) => {
                        const IconMap = { Edit, Send, Check, X, StopCircle, BookOpen, CreditCard, XCircle, Undo };
                        const IconComponent = IconMap[action.icon] || FileText;
                        const mutation = action.mutationKey ? mutations[action.mutationKey] : null;
                        const isLoading = mutation?.isLoading || false;
                        const colorMap = {
                          zinc:    { bg: 'hover:bg-zinc-50',    text: 'text-zinc-700',   icon: 'text-zinc-400' },
                          blue:    { bg: 'hover:bg-blue-50',    text: 'text-blue-700',   icon: 'text-blue-500' },
                          emerald: { bg: 'hover:bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
                          rose:    { bg: 'hover:bg-rose-50',    text: 'text-rose-600',   icon: 'text-rose-500' },
                          amber:   { bg: 'hover:bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500' },
                        };
                        const colors = colorMap[action.color] || colorMap.zinc;

                        return (
                          <button
                            key={action.key}
                            onClick={() => handleWorkflowAction(action)}
                            disabled={isLoading}
                            className={`w-full text-left px-4 py-2 ${colors.bg} flex items-center gap-2 ${colors.text} font-semibold border-t border-zinc-100 disabled:opacity-50`}
                          >
                            {isLoading
                              ? <RefreshCw size={14} className={`animate-spin ${colors.icon}`} />
                              : <IconComponent size={14} className={colors.icon} />
                            }
                            {action.label}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {workflowActions.length === 0 && (
                    <div className="px-4 py-2 text-zinc-400 italic">No workflow actions available</div>
                  )}

                  {/* ─── Static Actions (always visible) ─── */}
                  <div className="h-px bg-zinc-200 my-1"></div>

                  <button onClick={() => { window.print(); setShowMoreActions(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                    <Printer size={14} className="text-zinc-400" /> Print Invoice
                  </button>
                  <button onClick={async () => {
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
                    setShowMoreActions(false);
                  }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium border-t border-zinc-100">
                    <Download size={14} className="text-zinc-400" /> Download PDF
                  </button>
                  <button onClick={async () => {
                    try {
                      await apInvoicesApi.sendEmail(inv.id, companyId);
                      dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
                    } catch (err) {
                      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
                    }
                    setShowMoreActions(false);
                  }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                    <Mail size={14} className="text-zinc-400" /> Email Invoice
                  </button>
                  <button onClick={() => { navigate(buildPath('/accounts/transactions/debit-notes')); setShowMoreActions(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium border-t border-zinc-100">
                    <FileMinus size={14} className="text-zinc-400" /> Create Debit Note
                  </button>
                  <button onClick={() => { navigate(buildPath('/accounts/transactions/credit-notes')); setShowMoreActions(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                    <FilePlus size={14} className="text-zinc-400" /> Create Credit Note
                  </button>
                  <button onClick={() => { navigate(buildPath('/accounts/masters/vendors')); setShowMoreActions(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium border-t border-zinc-100">
                    <User size={14} className="text-zinc-400" /> View Vendor Ledger
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top 9 KPI Cards */}
      <APInvoiceKpiCards
        curr={curr}
        fmt={fmt}
        totalAmount={totalAmount}
        inv={inv}
        items={items}
        totalPaid={totalPaid}
        outstandingAmount={outstandingAmount}
        paymentPercentage={paymentPercentage}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-zinc-200 bg-white overflow-y-auto hidden lg:block">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Purchase Invoice Summary</h3>
              <dl className="space-y-4">
                {[
                  ['Invoice Number', displayValue(inv.invoiceNo || inv.invoiceNumber)],
                  ['Vendor', displayValue(vendorInfo?.vendorName || inv.vendorName || inv.vendor)],
                  ['Status', <StatusBadge key="sb1" status={inv.status} />],
                  ['Approval Status', <StatusBadge key="sb2" status={approvalInfo?.status || inv.approvalStatus} />],
                  ['Payment Status', <StatusBadge key="sb3" status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />],
                  ['Currency', curr],
                  ['Exchange Rate', displayValue(inv.exchangeRate)],
                  ['Base Currency Amt', `${companyInfo?.baseCurrency || curr} ${fmt(inv.baseCurrencyAmount || totalAmount)}`],
                  ['Reference Number', displayValue(inv.referenceNumber || inv.vendorInvoiceNo)],
                  ['Notes', displayValue(inv.notes || inv.remarks)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold text-zinc-500 uppercase">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: <Edit size={16} className="text-zinc-400" />, label: 'Edit Invoice', onClick: handleOpenEditModal },
                  { icon: <CreditCard size={16} className="text-emerald-500" />, label: 'Record Payment', onClick: () => setShowPaymentModal(true) },
                  { icon: <Printer size={16} className="text-zinc-400" />, label: 'Print Invoice', onClick: () => window.print() },
                  { icon: <Download size={16} className="text-zinc-400" />, label: 'Download PDF', onClick: () => window.print() },
                  { icon: <User size={16} className="text-zinc-400" />, label: 'View Vendor Ledger', onClick: () => navigate(buildPath('/accounts/masters/vendors')) },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick} className="w-full flex items-center justify-between p-2.5 text-sm font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors">
                    <span className="flex items-center gap-2">{icon}{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (70%) */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50">
          <div className="sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-md transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50'
                  }`}
                >
                  <span className={activeTab === tab.id ? "text-blue-600" : "text-zinc-400"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Invoice Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Invoice Number', displayValue(inv.invoiceNo || inv.invoiceNumber)],
                      ['Invoice Date', displayValue(inv.invoiceDate)],
                      ['Due Date', displayValue(inv.dueDate)],
                      ['Status', <StatusBadge key="sb1" status={inv.status} />],
                      ['Approval Status', <StatusBadge key="sb2" status={approvalInfo?.status || inv.approvalStatus} />],
                      ['Payment Status', <StatusBadge key="sb3" status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />],
                      ['Currency', curr],
                      ['Exchange Rate', displayValue(inv.exchangeRate)],
                      ['Base Currency Amount', `${companyInfo?.baseCurrency || curr} ${fmt(inv.baseCurrencyAmount || totalAmount)}`],
                      ['Reference Number', displayValue(inv.referenceNumber || inv.vendorInvoiceNo)],
                      ['Notes', displayValue(inv.notes || inv.remarks)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Company Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Company Name', displayValue(companyInfo?.companyName)],
                      ['Company ID', displayValue(companyInfo?.companyId)],
                      ['GSTIN', displayValue(companyInfo?.gstin)],
                      ['PAN', displayValue(companyInfo?.pan)],
                      ['Address', displayValue(companyInfo?.address)],
                      ['Base Currency', displayValue(companyInfo?.baseCurrency)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Vendor Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Vendor Name', displayValue(vendorInfo?.vendorName)],
                      ['Vendor Code', displayValue(vendorInfo?.vendorCode)],
                      ['GSTIN', displayValue(vendorInfo?.gstin)],
                      ['PAN', displayValue(vendorInfo?.pan)],
                      ['Email', displayValue(vendorInfo?.email)],
                      ['Phone', displayValue(vendorInfo?.phone)],
                      ['Billing Address', displayValue(vendorInfo?.billingAddress)],
                      ['Payment Terms', displayValue(vendorInfo?.paymentTerms)],
                      ['Credit Period', vendorInfo?.creditPeriod ? `${vendorInfo.creditPeriod} Days` : 'N/A'],
                      ['Outstanding Balance', vendorInfo?.outstandingBalance !== null && vendorInfo?.outstandingBalance !== undefined ? `₹${fmt(vendorInfo.outstandingBalance)}` : 'N/A'],
                      ['Available Credit', vendorInfo?.availableCredit !== null && vendorInfo?.availableCredit !== undefined ? `₹${fmt(vendorInfo.availableCredit)}` : 'N/A'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PURCHASE ITEMS TAB ── */}
            {activeTab === 'items' && (
              <APInvoiceItemsTable
                items={items}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                displayValue={displayValue}
                fmt={fmt}
                isEmpty={isEmpty}
              />
            )}

            {/* ── TAX SUMMARY TAB ── */}
            {activeTab === 'tax' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Taxable Amount', val: taxSummary.taxableAmount, color: 'text-zinc-900' },
                    { label: 'CGST Amount', val: taxSummary.cgstAmount, color: 'text-zinc-700' },
                    { label: 'SGST Amount', val: taxSummary.sgstAmount, color: 'text-zinc-700' },
                    { label: 'IGST Amount', val: taxSummary.igstAmount, color: 'text-zinc-700' },
                    { label: 'CESS Amount', val: taxSummary.cessAmount, color: 'text-zinc-700' },
                    { label: 'TDS Amount', val: taxSummary.tdsAmount, color: 'text-zinc-700' },
                    { label: 'Round Off', val: taxSummary.roundOff, color: 'text-zinc-700' },
                    { label: 'Total Tax', val: taxSummary.totalTax, color: 'text-blue-700' },
                    { label: 'Grand Total', val: taxSummary.grandTotal, color: 'text-emerald-700' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
                      <p className={`text-xl font-black ${color}`}>{curr} {fmt(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PAYMENTS TAB ── */}
            {activeTab === 'payments' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-xl font-black text-emerald-700">{curr} {fmt(totalPaid)}</p>
                  </div>
                  <div className="p-5 bg-red-50/50 border border-red-100 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-red-600 uppercase tracking-wider mb-1">Outstanding Amount</p>
                    <p className="text-xl font-black text-red-700">{curr} {fmt(outstandingAmount)}</p>
                  </div>
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider mb-1">Payment Percentage</p>
                    <p className="text-xl font-black text-blue-700">{paymentPercentage}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Payment History</h3>
                    {outstandingAmount > 0 && (
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                  {isEmpty(payments) ? (
                    <EmptyState icon={<CreditCard size={48} />} title="No Payments Recorded" desc="No payment transactions recorded for this purchase invoice yet." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Payment Number</th>
                            <th className="p-4">Payment Date</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Payment Mode</th>
                            <th className="p-4">Reference Number</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {payments.map((p, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-4 font-mono text-xs font-semibold text-blue-600">{displayValue(p.paymentNumber)}</td>
                              <td className="p-4 text-zinc-600">{displayValue(p.paymentDate)}</td>
                              <td className="p-4 text-right font-bold text-emerald-600">{curr} {fmt(p.amount)}</td>
                              <td className="p-4 text-zinc-700 font-medium">{displayValue(p.paymentMode)}</td>
                              <td className="p-4 font-mono text-xs text-zinc-500">{displayValue(p.referenceNumber)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VENDOR LEDGER TAB ── */}
            {activeTab === 'vendorLedger' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Opening Balance</p>
                    <p className="text-xl font-black text-zinc-900">₹{fmt(vendorLedger.openingBalance)}</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Current Balance</p>
                    <p className="text-xl font-black text-zinc-900">₹{fmt(vendorLedger.currentBalance)}</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Closing Balance</p>
                    <p className="text-xl font-black text-zinc-900">₹{fmt(vendorLedger.closingBalance)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider mb-4">Ledger Entries</h3>
                  {isEmpty(vendorLedger.ledgerEntries) ? (
                    <EmptyState icon={<BookOpen size={48} />} title="Vendor Ledger" desc="No ledger entries available." />
                  ) : (
                    <div className="space-y-2">
                      {vendorLedger.ledgerEntries.map((entry, i) => (
                        <div key={i} className="p-3 border border-zinc-100 rounded-lg flex justify-between bg-zinc-50">
                          <div>
                            <p className="text-sm font-medium">{displayValue(entry.description)}</p>
                            <p className="text-xs text-zinc-500">{displayValue(entry.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {entry.type === 'CREDIT' ? '+' : '-'}₹{fmt(entry.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── JOURNAL ENTRY TAB ── */}
            {activeTab === 'journals' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in max-w-4xl">
                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Voucher Number</p>
                    <p className="text-base font-mono font-bold text-zinc-900">{journalEntry.voucherNumber || `JV-PUR-${inv.invoiceNo || 'INV'}`}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Posting Date</p>
                    <p className="text-sm font-medium text-zinc-800">{journalEntry.postingDate || inv.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Posting Status</p>
                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">
                      {inv.glPostingStatus || 'POSTED'}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                        <tr>
                          <th className="p-4">Account Code</th>
                          <th className="p-4">Account Name</th>
                          <th className="p-4 text-right">Debit ({curr})</th>
                          <th className="p-4 text-right">Credit ({curr})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {/* Purchase Expense (Debit) */}
                        <tr className="hover:bg-zinc-50/50">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700">5000-PUR</td>
                          <td className="p-4 font-medium text-zinc-900">Purchase Expense</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600">₹{fmt(inv.taxableAmount ?? inv.subtotal)}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                        </tr>
                        {/* Input Tax (Debit) */}
                        {(inv.taxAmount ?? 0) > 0 && (
                          <tr className="hover:bg-zinc-50/50">
                            <td className="p-4 font-mono text-xs font-semibold text-zinc-700">1200-ITAX</td>
                            <td className="p-4 font-medium text-zinc-900">Input GST Recoverable</td>
                            <td className="p-4 text-right font-mono font-bold text-red-600">₹{fmt(inv.taxAmount)}</td>
                            <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                          </tr>
                        )}
                        {/* Accounts Payable (Credit) */}
                        <tr className="hover:bg-zinc-50/50">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700">2100-AP</td>
                          <td className="p-4 font-medium text-zinc-900">Accounts Payable - {inv.vendorName || inv.vendor}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{fmt(totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEDGER IMPACT TAB ── */}
            {activeTab === 'ledger' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl animate-in fade-in">
                {ledgerImpact.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState icon={<BookOpen size={48} />} title="Ledger Impact" desc="No ledger postings available." />
                  </div>
                ) : (
                  ledgerImpact.map(({ accountName, accountCode, entryType, amount }) => (
                    <div key={accountCode} className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{displayValue(accountCode)}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${entryType === 'DEBIT' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{displayValue(entryType)}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 mt-2">{displayValue(accountName)}</h4>
                      </div>
                      <p className={`text-xl font-black mt-4 ${entryType === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}`}>{curr} {fmt(amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── INVENTORY TAB ── */}
            {activeTab === 'inventory' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Inventory Movements</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Inventory Transaction ID</dt>
                      <dd className="text-sm font-mono text-zinc-700">{displayValue(inventoryInfo.transactionId)}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Stock Before Purchase</dt>
                      <dd className="text-sm font-medium text-zinc-900">{displayValue(inventoryInfo.stockBefore)}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Stock After Purchase</dt>
                      <dd className="text-sm font-bold text-emerald-600">{displayValue(inventoryInfo.stockAfter)}</dd>
                    </div>
                  </dl>
                  
                  {inventoryInfo.warehouses && inventoryInfo.warehouses.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Locations Affected</h4>
                      <div className="space-y-4">
                        {inventoryInfo.warehouses.map((wh, idx) => (
                          <div key={idx} className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                            <p className="text-sm font-bold text-zinc-900 mb-2">{displayValue(wh.warehouseName)} <span className="text-xs text-zinc-500 font-normal">({displayValue(wh.warehouseId)})</span></p>
                            {wh.locations && wh.locations.length > 0 ? (
                              <ul className="space-y-1 pl-4 border-l-2 border-zinc-200">
                                {wh.locations.map((loc, lidx) => (
                                  <li key={lidx} className="text-sm text-zinc-700 flex gap-2 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                                    {displayValue(loc.locationName)} <span className="text-xs text-zinc-400">({displayValue(loc.locationId)})</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-zinc-500 italic pl-4 border-l-2 border-zinc-200">No specific locations listed</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RELATED DOCUMENTS TAB ── */}
            {activeTab === 'docs' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Linked Purchasing Documents</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Purchase Order', displayValue(relatedDocs.poNumber)],
                      ['Goods Receipt Note (GRN)', displayValue(relatedDocs.grnNumber)],
                      ['Debit Notes', displayValue(relatedDocs.debitNotesCount)],
                      ['Credit Notes', displayValue(relatedDocs.creditNotesCount)],
                      ['Vendor Payments', displayValue(relatedDocs.vendorPaymentsCount)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</dt>
                        <dd className="text-sm font-medium text-zinc-900">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* ── APPROVAL WORKFLOW TAB ── */}
            {activeTab === 'approval' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Approval Workflow</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approval Status</dt>
                      <dd className="mt-1"><StatusBadge status={approvalInfo.status} /></dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approved By</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{displayValue(approvalInfo.approvedBy)}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approved Date</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{displayValue(approvalInfo.approvedDate)}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approval Notes</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{displayValue(approvalInfo.notes)}</dd>
                    </div>
                  </dl>

                  {approvalInfo.workflowHistory && approvalInfo.workflowHistory.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-zinc-100">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Workflow History</h4>
                      <ul className="space-y-4 relative before:content-[''] before:absolute before:left-[8.8px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
                        {approvalInfo.workflowHistory.map((step, sidx) => (
                          <li key={sidx} className="relative pl-8">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                            </div>
                            <p className="text-sm font-bold text-zinc-900">{displayValue(step.action)} by {displayValue(step.user)}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{displayValue(step.date)}</p>
                            {step.notes && <p className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded mt-1">{step.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RELATED TRANSACTIONS TAB ── */}
            {activeTab === 'related' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="flex space-x-2 border-b border-zinc-200 pb-2 overflow-x-auto">
                  {['vendorPayments', 'journalEntries', 'inventoryTxns', 'purchaseReturns', 'debitNotes'].map(st => (
                    <button
                      key={st}
                      onClick={() => setRelatedSubTab(st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${relatedSubTab === st ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                  {relatedSubTab === 'vendorPayments' && (isEmpty(inv.relatedTransactions?.vendorPayments) ? <EmptyState icon={<CreditCard size={36} />} title="No Vendor Payments" desc="No payment transactions linked." /> : <p className="text-sm font-medium text-zinc-700">{inv.relatedTransactions.vendorPayments.length} payment(s) linked.</p>)}
                  {relatedSubTab === 'journalEntries' && (isEmpty(inv.relatedTransactions?.journalEntries) ? <EmptyState icon={<BookOpen size={36} />} title="No Journal Entries" desc="No journals linked." /> : <p className="text-sm font-medium text-zinc-700">{inv.relatedTransactions.journalEntries.length} GL Journal Entry linked.</p>)}
                  {relatedSubTab === 'inventoryTxns' && (isEmpty(inv.relatedTransactions?.inventoryTransactions) ? <EmptyState icon={<Package size={36} />} title="No Inventory Transactions" desc="No inventory actions linked." /> : <p className="text-sm font-medium text-zinc-700">{inv.relatedTransactions.inventoryTransactions.length} Inventory Txn linked.</p>)}
                  {relatedSubTab === 'purchaseReturns' && (isEmpty(inv.relatedTransactions?.purchaseReturns) ? <EmptyState icon={<RotateCcw size={36} />} title="No Purchase Returns" desc="No returns for this bill." /> : <p className="text-sm font-medium text-zinc-700">{inv.relatedTransactions.purchaseReturns.length} Purchase Returns linked.</p>)}
                  {relatedSubTab === 'debitNotes' && (isEmpty(inv.relatedTransactions?.debitNotes) ? <EmptyState icon={<FileMinus size={36} />} title="No Debit Notes" desc="No debit notes issued." /> : <p className="text-sm font-medium text-zinc-700">{inv.relatedTransactions.debitNotes.length} Debit Notes linked.</p>)}
                </div>
              </div>
            )}

            {/* ── ATTACHMENTS TAB ── */}
            {activeTab === 'attachments' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 max-w-4xl animate-in fade-in">
                {isEmpty(attachments) ? (
                  <EmptyState icon={<Paperclip size={48} />} title="No Attachments" desc="No file attachments uploaded for this purchase invoice." />
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {attachments.map((att, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800">{att.name}</span>
                        <button className="text-xs font-semibold text-blue-600 hover:underline">Download</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── AUDIT LOG TAB ── */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in max-w-4xl">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Audit Trail & Permissions</h3>
                </div>
                <div className="p-6 space-y-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Created Information</dt>
                      <dd className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <p className="text-sm font-medium text-zinc-900">By: {displayValue(auditInfo.createdBy)}</p>
                        <p className="text-xs text-zinc-500 mt-1">At: {displayValue(auditInfo.createdAt)}</p>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Last Updated Information</dt>
                      <dd className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <p className="text-sm font-medium text-zinc-900">By: {displayValue(auditInfo.updatedBy)}</p>
                        <p className="text-xs text-zinc-500 mt-1">At: {displayValue(auditInfo.updatedAt)}</p>
                      </dd>
                    </div>
                  </dl>

                  <div className="pt-4 border-t border-zinc-100">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Permissions</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['Editable', auditInfo.editable],
                        ['Deletable', auditInfo.deletable],
                        ['Postable', auditInfo.postable],
                        ['Payable', auditInfo.payable],
                      ].map(([perm, val]) => (
                        <span key={perm} className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${val ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                          {perm}: {val ? 'Yes' : (val === false ? 'No' : 'N/A')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <APInvoiceEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isLoading}
      />

      {/* Payment Voucher Modal */}
      {showPaymentModal && (
        <PaymentVoucherFormModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          initialData={{ vendorId: inv.vendorId, apInvoiceId: inv.id, amount: outstandingAmount }}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
      <div className="mb-4 text-zinc-200">{icon}</div>
      <p className="text-lg font-bold text-zinc-700">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}
