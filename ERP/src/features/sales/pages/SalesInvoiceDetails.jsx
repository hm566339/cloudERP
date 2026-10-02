import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Download, Share2, FileText, ShoppingCart,
  Package, LayoutList, History, Activity, Calendar, Lock,
  Unlock, CheckCircle, AlertCircle, BarChart2, CreditCard, RefreshCw,
  Building2, DollarSign, Clock, ShieldAlert, CheckSquare, ChevronDown,
  Layers, GitCommit, Network, BookOpen, FileCheck, Truck, QrCode,
  Paperclip, User, FilePlus, XCircle, Percent, Eye, ChevronRight, Mail
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { salesInvoicesApi } from '../../../api/account/salesInvoices';
import Modal from '../../../components/common/Modal';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import PartialPaymentModal from '../components/PartialPaymentModal';
import { useRoutePath } from "../../../hooks/useRoutePath";

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    PARTIALLY_PAID: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    UNPAID: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    OVERDUE: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    CANCELLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  }[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s}
    </span>
  );
};

export default function SalesInvoiceDetails() {
  const { id: paramId, invoiceId: routeInvoiceId } = useParams();
  const invoiceId = routeInvoiceId || paramId;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [activeTab, setActiveTab] = useState('overview');
  const [relatedSubTab, setRelatedSubTab] = useState('payments');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const { data: response, isLoading, error, refetch } = useApiQuery(
    salesInvoicesApi.getById,
    invoiceId,
    { enabled: !!invoiceId }
  );

  const raw = response?.data?.data || response?.data || response;
  const inv = (raw && typeof raw === 'object' && ('invoiceNumber' in raw || 'customerName' in raw || 'totalAmount' in raw))
    ? raw
    : (raw?.data || raw);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    referenceNumber: '',
    businessDescription: '',
    remarks: '',
    placeOfSupplyStateId: ''
  });

  const updateMutation = useApiMutation(
    (payload) => salesInvoicesApi.update(invoiceId, payload),
    {
      onSuccess: () => {
        dispatch(addAlert({ type: 'success', message: 'Sales Invoice updated successfully' }));
        setIsEditModalOpen(false);
        refetch();
      },
      onError: (err) => {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update invoice' }));
      }
    }
  );

  const handleOpenEditModal = () => {
    if (inv) {
      setFormData({
        invoiceNumber: inv.invoiceNumber || inv.invoiceNo || '',
        invoiceDate: inv.invoiceDate || '',
        dueDate: inv.dueDate || '',
        referenceNumber: inv.referenceNumber || '',
        businessDescription: inv.businessDescription || '',
        remarks: inv.remarks || '',
        placeOfSupplyStateId: inv.placeOfSupplyStateId || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  const cancelMutation = useApiMutation(
    () => salesInvoicesApi.cancel(invoiceId),
    {
      onSuccess: (response) => {
        const message = response?.data?.message || response?.message || 'Invoice cancelled successfully';
        dispatch(addAlert({ type: 'success', message: message }));
        refetch();
      }
    }
  );

  const approveMutation = useApiMutation(
    () => salesInvoicesApi.approve(invoiceId),
    {
      onSuccess: (response) => {
        const message = response?.data?.message || response?.message || 'Invoice approved successfully';
        dispatch(addAlert({ type: 'success', message: message }));
        refetch();
      }
    }
  );

  const rejectMutation = useApiMutation(
    () => salesInvoicesApi.reject(invoiceId),
    {
      onSuccess: (response) => {
        const message = response?.data?.message || response?.message || 'Invoice rejected successfully';
        dispatch(addAlert({ type: 'success', message: message }));
        refetch();
      }
    }
  );

  const postMutation = useApiMutation(
    () => salesInvoicesApi.postToGL(invoiceId),
    {
      onSuccess: (response) => {
        const message = response?.data?.message || response?.message || 'Invoice posted successfully';
        dispatch(addAlert({ type: 'success', message: message }));
        refetch();
      }
    }
  );

  const handleCancelInvoice = async () => {
    if (await confirmDialog({
      title: 'Cancel Invoice?',
      message: 'Are you sure you want to cancel this sales invoice? This action cannot be undone.',
      isDestructive: true
    })) {
      await cancelMutation.mutateAsync();
    }
  };

  const handleApproveInvoice = async () => {
    if (await confirmDialog({
      title: 'Approve Invoice?',
      message: 'Are you sure you want to approve this sales invoice?',
      confirmLabel: 'Approve'
    })) {
      await approveMutation.mutateAsync();
    }
  };

  const handleRejectInvoice = async () => {
    if (await confirmDialog({
      title: 'Reject Invoice?',
      message: 'Are you sure you want to reject this sales invoice?',
      isDestructive: true,
      confirmLabel: 'Reject'
    })) {
      await rejectMutation.mutateAsync();
    }
  };

  const handlePostInvoice = async () => {
    if (await confirmDialog({
      title: 'Post to General Ledger?',
      message: 'Are you sure you want to post this sales invoice to the General Ledger? This will create journal entries.',
      confirmLabel: 'Post to GL'
    })) {
      await postMutation.mutateAsync();
    }
  };

  if (isLoading) return <PageLoader message="Loading Sales Invoice details..." />;

  if (error || !inv) {
    return (
      <ErrorState
        title="Sales Invoice Not Found"
        message={error?.message || "The requested sales invoice could not be found."}
        onRetry={refetch}
      />
    );
  }

  const curr = inv.invoiceCurrency || inv.currency || 'INR';
  const companyInfo = inv.companyInformation || inv.company || {};
  const customerInfo = inv.customerInformation || inv.customerDetails || {};
  const lineItems = Array.isArray(inv.lineItems) ? inv.lineItems : (Array.isArray(inv.items) ? inv.items : []);
  const taxSummary = inv.taxSummary || {};
  const paymentHistory = Array.isArray(inv.paymentHistory) ? inv.paymentHistory : (Array.isArray(inv.payments) ? inv.payments : []);
  const journalEntry = inv.journalEntry || inv.glJournalEntry || {};
  const ledgerImpact = Array.isArray(inv.ledgerImpact) ? inv.ledgerImpact : (Array.isArray(inv.ledgerPostings) ? inv.ledgerPostings : []);
  const inventoryInfo = inv.inventoryInformation || inv.inventory || {};
  const deliveryInfo = inv.deliveryInformation || inv.delivery || {};
  const approvalInfo = inv.approvalWorkflow || inv.approval || {};
  const eInvoiceInfo = inv.eInvoiceAndEWayBill || inv.eInvoiceInformation || inv.eInvoice || {};
  const auditInfo = inv.auditInformation || {};
  const attachments = Array.isArray(inv.attachments) ? inv.attachments : [];

  const totalAmount = inv.totalAmount ?? inv.grandTotal ?? 0;
  const receivedAmount = inv.receivedAmount ?? inv.totalReceived ?? 0;
  const outstandingAmount = inv.outstandingAmount ?? inv.outstanding ?? (totalAmount - receivedAmount);
  const paymentPercentage = inv.paymentPercentage ?? (totalAmount > 0 ? Math.round((receivedAmount / totalAmount) * 100) : 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'items', label: 'Line Items', icon: <ShoppingCart size={16} /> },
    { id: 'tax', label: 'Tax Summary', icon: <Percent size={16} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
    { id: 'journals', label: 'Journal Entry', icon: <FileText size={16} /> },
    { id: 'ledger', label: 'Ledger Impact', icon: <BookOpen size={16} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={16} /> },
    { id: 'delivery', label: 'Delivery', icon: <Truck size={16} /> },
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
            onClick={() => navigate(buildPath('/accounts/sales/invoices'))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {inv.invoiceNumber || inv.invoiceNo}
              </h1>
              <StatusBadge status={inv.status} />
              <StatusBadge status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />
              <span className="text-sm font-medium text-zinc-500">
                {inv.customerName || inv.customer}
              </span>
              <span className="text-sm text-zinc-400">
                ({inv.invoiceDate} &mdash; Due: {inv.dueDate})
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> <span className="hidden sm:inline">Export PDF</span>
          </button>
          {outstandingAmount > 0 && (
            <button
              onClick={() => setSelectedInvoiceForPayment(inv)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CreditCard size={14} /> Record Payment
            </button>
          )}
          <button onClick={handleOpenEditModal} className="btn-primary flex items-center gap-2">
            <Edit size={16} /> Edit Invoice
          </button>

          {/* More Actions Dropdown */}
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
                onClick={() => setShowMoreActions(false)}
              >
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <Printer size={14} className="text-zinc-400" /> Print Invoice
                </button>
                <button onClick={async () => {
                  try {
                    const response = await salesInvoicesApi.downloadPdf(inv.id, companyId);
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Sales_Invoice_${inv.invoiceNumber || inv.id}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
                  } catch (err) {
                    dispatch(addAlert({ type: 'error', message: 'Failed to download PDF' }));
                  }
                  setShowMoreActions(false);
                }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <Download size={14} className="text-zinc-400" /> Download PDF
                </button>
                <button onClick={async () => {
                  try {
                    await salesInvoicesApi.sendEmail(inv.id, companyId);
                    dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
                  } catch (err) {
                    dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
                  }
                  setShowMoreActions(false);
                }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <Mail size={14} className="text-zinc-400" /> Email Invoice
                </button>
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <QrCode size={14} className="text-zinc-400" /> Download eInvoice
                </button>
                <button onClick={() => alert("Share link copied")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <Share2 size={14} className="text-zinc-400" /> Share Invoice
                </button>
                {outstandingAmount > 0 && (
                  <button onClick={() => setSelectedInvoiceForPayment(inv)} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-emerald-700 font-semibold border-t border-zinc-100">
                    <CreditCard size={14} className="text-emerald-500" /> Record Payment
                  </button>
                )}
                <button onClick={() => navigate(buildPath('/accounts/transactions/credit-notes'))} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium border-t border-zinc-100">
                  <FilePlus size={14} className="text-zinc-400" /> Create Credit Note
                </button>
                <button onClick={() => navigate(buildPath('/accounts/transactions/debit-notes'))} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <FilePlus size={14} className="text-zinc-400" /> Create Debit Note
                </button>
                {(inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL') && (
                  <>
                    <button onClick={handleApproveInvoice} className="w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-semibold border-t border-zinc-100">
                      <CheckCircle size={14} className="text-emerald-500" /> Approve Invoice
                    </button>
                    <button onClick={handleRejectInvoice} className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold">
                      <XCircle size={14} className="text-rose-500" /> Reject Invoice
                    </button>
                  </>
                )}
                {inv.status === 'APPROVED' && (
                  <button onClick={handlePostInvoice} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 text-blue-700 font-semibold border-t border-zinc-100">
                    <Activity size={14} className="text-blue-500" /> Post to GL
                  </button>
                )}
                {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                  <button onClick={handleCancelInvoice} className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-zinc-100">
                    <XCircle size={14} className="text-rose-500" /> Cancel Invoice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 8 KPI Cards (Color Coded: Paid -> Green, Outstanding -> Red, Draft -> Orange) */}
      <div className="p-6 bg-white border-b border-zinc-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Grand Total</p>
            <p className="text-base font-black text-zinc-900">{curr} {fmt(totalAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Taxable Amount</p>
            <p className="text-base font-black text-zinc-900">{curr} {fmt(inv.taxableAmount ?? inv.subtotal)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Tax</p>
            <p className="text-base font-black text-zinc-900">{curr} {fmt(inv.taxAmount ?? inv.totalTax)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/30 flex flex-col">
            <p className="text-[8px] font-bold text-red-600 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-base font-black text-red-700">{curr} {fmt(outstandingAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col">
            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Received</p>
            <p className="text-base font-black text-emerald-700">{curr} {fmt(receivedAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col">
            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Payment %</p>
            <p className="text-base font-black text-emerald-700">{paymentPercentage}%</p>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col">
            <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider mb-1">Days Outstanding</p>
            <p className="text-base font-black text-amber-700">{inv.daysOutstanding || 0} d</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Count</p>
            <p className="text-base font-black text-zinc-900">{inv.itemCount || lineItems.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-zinc-200 bg-white overflow-y-auto hidden lg:block">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Invoice Summary</h3>
              <dl className="space-y-4">
                {[
                  ['Invoice Number', inv.invoiceNumber || inv.invoiceNo],
                  ['Customer', inv.customerName || inv.customer],
                  ['Status', <StatusBadge key="sb1" status={inv.status} />],
                  ['Payment Status', <StatusBadge key="sb2" status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />],
                  ['Currency', curr],
                  ['Exchange Rate', inv.exchangeRate || 1],
                  ['Reference Number', inv.referenceNumber],
                  ['Business Description', inv.businessDescription],
                  ['Remarks', inv.remarks],
                ].map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold text-zinc-500 uppercase">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900">{val || '-'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: <Edit size={16} className="text-zinc-400" />, label: 'Edit Invoice', onClick: handleOpenEditModal },
                  { icon: <CreditCard size={16} className="text-emerald-500" />, label: 'Record Payment', onClick: () => setSelectedInvoiceForPayment(inv) },
                  { icon: <Printer size={16} className="text-zinc-400" />, label: 'Print Invoice', onClick: () => window.print() },
                  { icon: <Download size={16} className="text-zinc-400" />, label: 'Download PDF', onClick: () => window.print() },
                  { icon: <QrCode size={16} className="text-zinc-400" />, label: 'Download eInvoice', onClick: () => window.print() },
                  { icon: <User size={16} className="text-zinc-400" />, label: 'View Customer Ledger', onClick: () => navigate(buildPath('/accounts/masters/customers')) },
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
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-md transition-all ${activeTab === tab.id
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
                      ['Invoice Number', inv.invoiceNumber || inv.invoiceNo],
                      ['Invoice Date', inv.invoiceDate],
                      ['Due Date', inv.dueDate],
                      ['Status', <StatusBadge key="sb1" status={inv.status} />],
                      ['Payment Status', <StatusBadge key="sb2" status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />],
                      ['Currency', curr],
                      ['Exchange Rate', inv.exchangeRate || 1],
                      ['Base Currency Amount', `${inv.companyBaseCurrency || curr} ${fmt(inv.baseCurrencyAmount || totalAmount)}`],
                      ['Place of Supply', inv.placeOfSupplyDisplayName
                        || (inv.placeOfSupplyStateCode
                          ? `${inv.placeOfSupplyStateCode} - ${inv.placeOfSupply || ''}`
                          : (inv.placeOfSupply || '-'))],
                      ['GL Posting Status', <StatusBadge key="glps" status={inv.glPostingStatus || inv.status || 'DRAFT'} />],
                      ['Reference Number', inv.referenceNumber],
                      ['Business Description', inv.businessDescription],
                      ['Remarks', inv.remarks],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val || '-'}</p>
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
                      ['Company Name', companyInfo.companyName || inv.companyName],
                      ['Company Code', companyInfo.companyCode || inv.companyCode],
                      ['GSTIN', companyInfo.gstin || inv.companyGstin],
                      ['PAN', companyInfo.pan || inv.companyPan],
                      ['Address', companyInfo.address || inv.companyAddress],
                      ['Contact Details', companyInfo.phone || companyInfo.email || '-'],
                      ['Base Currency', companyInfo.baseCurrency || inv.companyBaseCurrency || 'INR'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Customer Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Customer Code', customerInfo.customerCode || inv.customerCode],
                      ['Customer Name', customerInfo.customerName || inv.customerName],
                      ['GSTIN', customerInfo.gstin || inv.customerGstin],
                      ['PAN', customerInfo.pan || inv.customerPan],
                      ['Email', customerInfo.email || inv.customerEmail],
                      ['Phone', customerInfo.phone || inv.customerPhone],
                      ['Billing Address', customerInfo.billingAddress || inv.billingAddress],
                      ['Shipping Address', customerInfo.shippingAddress || inv.shippingAddress],
                      ['Credit Limit', customerInfo.creditLimit ? `₹${fmt(customerInfo.creditLimit)}` : '-'],
                      ['Outstanding Balance', customerInfo.outstandingBalance ? `₹${fmt(customerInfo.outstandingBalance)}` : '-'],
                      ['Available Credit', customerInfo.availableCredit ? `₹${fmt(customerInfo.availableCredit)}` : '-'],
                      ['Payment Terms', customerInfo.paymentTerms || inv.paymentTerms],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transport & Delivery Information */}
                {(inv.deliveryAddressLine1 || inv.deliveryCity || inv.deliveryState || inv.transporter || inv.transportDocNo || inv.vehicleNo || deliveryInfo.transporter) && (
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                        <Truck size={15} className="text-zinc-500" /> Delivery & Transport Details
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(inv.deliveryAddressLine1 || inv.deliveryCity || inv.deliveryState) && (
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Delivery Address</p>
                          <address className="not-italic text-sm font-medium text-zinc-900 leading-6">
                            {inv.deliveryAddressLine1 && <span className="block">{inv.deliveryAddressLine1}</span>}
                            {inv.deliveryAddressLine2 && <span className="block">{inv.deliveryAddressLine2}</span>}
                            {inv.deliveryCity && <span className="block">{inv.deliveryCity}{inv.deliveryState ? `, ${inv.deliveryState}` : ''}{inv.deliveryPostalCode ? ` ${inv.deliveryPostalCode}` : ''}</span>}
                            {inv.deliveryCountry && <span className="block text-zinc-500">{inv.deliveryCountry}</span>}
                          </address>
                        </div>
                      )}
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Transport Information</p>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-[8px] font-bold text-zinc-400 uppercase">Transporter</dt>
                            <dd className="text-sm font-semibold text-zinc-800">{inv.transporter || deliveryInfo.transporter || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-bold text-zinc-400 uppercase">Transport Doc No</dt>
                            <dd className="text-sm font-semibold text-zinc-800">{inv.transportDocNo || deliveryInfo.lrNumber || deliveryInfo.transportDocNo || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-bold text-zinc-400 uppercase">Vehicle No</dt>
                            <dd className="text-sm font-semibold text-zinc-800">{inv.vehicleNo || deliveryInfo.vehicleNumber || '-'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* E-Invoice & E-Way Bill */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                      <QrCode size={16} className="text-blue-600" /> E-Invoice & E-Way Bill Information
                    </h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['IRN', eInvoiceInfo.irn],
                      ['Ack Number', eInvoiceInfo.ackNumber || eInvoiceInfo.ackNo],
                      ['Ack Date', eInvoiceInfo.ackDate || inv.ackDate],
                      ['E-Way Bill Number', eInvoiceInfo.ewbNumber || inv.ewbNumber],
                      ['E-Way Bill Validity', eInvoiceInfo.ewbValidity || inv.ewbValidity],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-mono font-medium text-zinc-900">{val || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── LINE ITEMS TAB ── */}
            {activeTab === 'items' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in">
                {isEmpty(lineItems) ? (
                  <EmptyState icon={<ShoppingCart size={48} />} title="No Line Items" desc="There are no line items recorded for this invoice." />
                ) : (
                  <div className="w-full overflow-hidden rounded-lg border border-zinc-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                        <tr>
                          <th className="p-4 w-10 text-center"></th>
                          <th className="p-4 w-1/3">Item Name</th>
                          <th className="p-4 hidden sm:table-cell">Item Code</th>
                          <th className="p-4 hidden lg:table-cell">SKU</th>
                          <th className="p-4 hidden lg:table-cell">HSN/SAC</th>
                          <th className="p-4 hidden lg:table-cell">GST</th>
                          <th className="p-4 text-right">Qty</th>
                          <th className="p-4 hidden sm:table-cell">Unit</th>
                          <th className="p-4 text-right">Price</th>
                          <th className="p-4 text-right hidden sm:table-cell">Disc %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {lineItems.map((item, idx) => {
                          const isExpanded = !!expandedRows[idx];
                          const invData = item.inventory;

                          return (
                            <React.Fragment key={idx}>
                              <tr
                                onClick={() => toggleRow(idx)}
                                className={`hover:bg-zinc-50/80 cursor-pointer transition-colors group ${isExpanded ? 'bg-zinc-50' : ''}`}
                              >
                                <td className="p-4 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </td>
                                <td className="p-4">
                                  <p className="font-medium text-zinc-900 truncate max-w-[120px] sm:max-w-[200px]" title={item.itemName || item.name}>
                                    {item.itemName || item.name || '-'}
                                  </p>
                                </td>
                                <td className="p-4 hidden sm:table-cell font-mono text-xs font-semibold text-zinc-700">
                                  {item.itemCode || item.code || '-'}
                                </td>
                                <td className="p-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">{item.sku || '-'}</td>
                                <td className="p-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">{item.hsnCode || item.hsnSac || '-'}</td>
                                <td className="p-4 hidden lg:table-cell text-zinc-600">{item.gstSlab || `${item.gstRate || 0}%`}</td>
                                <td className="p-4 text-right font-bold text-zinc-900">{item.quantity}</td>
                                <td className="p-4 hidden sm:table-cell text-zinc-500">{item.unit || 'PCS'}</td>
                                <td className="p-4 text-right font-mono">₹{fmt(item.unitPrice || item.price)}</td>
                                <td className="p-4 text-right hidden sm:table-cell text-zinc-500">
                                  {item.discountPercentage || item.discount || 0}%
                                </td>
                              </tr>

                              {/* Expanded Inline Details */}
                              {isExpanded && (
                                <tr className="bg-zinc-50/50">
                                  <td colSpan={10} className="p-0 border-t border-zinc-100">
                                    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-200">

                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                        <div className="space-y-6">
                                          {/* Item Details */}
                                          <div className="space-y-3">
                                            <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Item Details</h4>
                                            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
                                              <div className="col-span-2">
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Name</dt>
                                                <dd className="text-sm font-medium text-zinc-900">{item.itemName || item.name || '-'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item ID</dt>
                                                <dd className="text-xs font-mono text-zinc-700">{item.itemId || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Code</dt>
                                                <dd className="text-sm font-mono font-medium text-zinc-900">{item.itemCode || item.code || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">SKU</dt>
                                                <dd className="text-sm font-mono text-zinc-700">{item.sku || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">HSN/SAC</dt>
                                                <dd className="text-sm font-mono text-zinc-700">{item.hsnCode || item.hsnSac || 'N/A'}</dd>
                                              </div>
                                              <div className="col-span-2">
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</dt>
                                                <dd className="text-sm text-zinc-700">{item.description || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GST Slab</dt>
                                                <dd className="text-sm font-medium text-zinc-900">{item.gstSlab || `${item.gstRate || 0}%`}</dd>
                                              </div>
                                            </dl>
                                          </div>

                                          {/* Additional Information */}
                                          <div className="space-y-3">
                                            <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Additional Information</h4>
                                            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Expiry Date</dt>
                                                <dd className="text-sm text-zinc-700">{item.expiryDate || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cost Center</dt>
                                                <dd className="text-sm text-zinc-700">{item.costCenter || 'N/A'}</dd>
                                              </div>
                                              <div className="col-span-2">
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Line Remarks</dt>
                                                <dd className="text-sm text-zinc-700">{item.lineRemarks || item.remarks || 'N/A'}</dd>
                                              </div>
                                            </dl>
                                          </div>
                                        </div>

                                        <div className="space-y-6">
                                          {/* Pricing & Tax */}
                                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-2 divide-x divide-zinc-100">

                                              {/* Pricing */}
                                              <div className="p-5 space-y-4">
                                                <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Pricing</h4>
                                                <dl className="space-y-3">
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">Quantity</dt>
                                                    <dd className="text-xs font-bold text-zinc-900">{item.quantity} {item.unit || 'PCS'}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">Unit Price</dt>
                                                    <dd className="text-xs font-mono font-medium text-zinc-900">₹{fmt(item.unitPrice || item.price)}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">Discount</dt>
                                                    <dd className="text-xs font-medium text-zinc-700">{item.discountPercentage || item.discount || 0}% (₹{fmt(item.discountAmount)})</dd>
                                                  </div>
                                                  <div className="flex justify-between pt-2 border-t border-zinc-100">
                                                    <dt className="text-xs font-bold text-zinc-700">Taxable Amt</dt>
                                                    <dd className="text-sm font-mono font-bold text-zinc-900">₹{fmt(item.taxableAmount)}</dd>
                                                  </div>
                                                </dl>
                                              </div>

                                              {/* Tax */}
                                              <div className="p-5 space-y-4 bg-zinc-50/50">
                                                <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Tax Details</h4>
                                                <dl className="space-y-3">
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">CGST</dt>
                                                    <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.cgst ?? item.cgstAmount ?? 0)}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">SGST</dt>
                                                    <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.sgst ?? item.sgstAmount ?? 0)}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">IGST</dt>
                                                    <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.igst ?? item.igstAmount ?? 0)}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <dt className="text-xs font-medium text-zinc-500">CESS</dt>
                                                    <dd className="text-xs font-mono text-zinc-700">₹{fmt(item.cess ?? item.cessAmount ?? 0)}</dd>
                                                  </div>
                                                  <div className="flex justify-between pt-2 border-t border-zinc-200 border-dashed">
                                                    <dt className="text-xs font-bold text-zinc-700">Tax Amount</dt>
                                                    <dd className="text-sm font-mono font-bold text-zinc-900">₹{fmt(item.taxAmount ?? 0)}</dd>
                                                  </div>
                                                </dl>
                                              </div>

                                            </div>
                                            <div className="bg-zinc-900 p-4 flex justify-between items-center text-white">
                                              <span className="text-xs font-bold uppercase tracking-widest">Total Amount</span>
                                              <span className="text-lg font-mono font-black text-emerald-400">₹{fmt(item.totalAmount)}</span>
                                            </div>
                                          </div>

                                          {/* Inventory Card */}
                                          <div className="bg-amber-50/30 rounded-xl border border-amber-200 shadow-sm overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-3">
                                              <div className={`px-2 py-1 text-[7.2px] font-black uppercase tracking-widest rounded shadow-sm border ${!invData ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
                                                  invData.inventoryFetchStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    invData.inventoryFetchStatus === 'FAILED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                      'bg-zinc-100 text-zinc-600 border-zinc-200'
                                                }`}>
                                                {!invData ? 'N/A' : (invData.inventoryFetchStatus || 'UNKNOWN')}
                                              </div>
                                            </div>
                                            <div className="px-5 py-4 border-b border-amber-200/50 bg-amber-50/50">
                                              <h4 className="text-[8.8px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                                                <Package size={14} className="text-amber-600" /> Inventory Information
                                              </h4>
                                            </div>
                                            <div className="p-5">
                                              {!invData ? (
                                                <p className="text-sm font-medium text-amber-700/70 text-center py-2">No inventory information available for this item.</p>
                                              ) : (
                                                <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
                                                  <div className="col-span-2">
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Warehouse</dt>
                                                    <dd className="text-sm font-semibold text-amber-950">{invData.warehouseName || 'N/A'}</dd>
                                                    {invData.warehouseId && <p className="text-[8px] font-mono text-amber-700/50 mt-0.5">{invData.warehouseId}</p>}
                                                  </div>
                                                  <div className="col-span-2">
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Location</dt>
                                                    <dd className="text-sm font-semibold text-amber-950">{invData.locationName || 'N/A'}</dd>
                                                    {invData.locationId && <p className="text-[8px] font-mono text-amber-700/50 mt-0.5">{invData.locationId}</p>}
                                                  </div>
                                                  <div>
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Batch</dt>
                                                    <dd className="text-sm font-mono text-amber-900">{invData.batchCode || 'N/A'}</dd>
                                                  </div>
                                                  <div>
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Stock Qty</dt>
                                                    <dd className="text-sm font-bold text-amber-950">{invData.stockQuantity ?? 'N/A'}</dd>
                                                  </div>
                                                  <div>
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Reserved Qty</dt>
                                                    <dd className="text-sm font-bold text-rose-700">{invData.reservedQuantity ?? 'N/A'}</dd>
                                                  </div>
                                                  <div>
                                                    <dt className="text-[8px] font-bold text-amber-700/60 uppercase tracking-wider mb-1">Available Qty</dt>
                                                    <dd className="text-sm font-bold text-emerald-700">{invData.availableQuantity ?? 'N/A'}</dd>
                                                  </div>
                                                </dl>
                                              )}
                                            </div>
                                          </div>

                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAX SUMMARY TAB ── */}
            {activeTab === 'tax' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Taxable Amount', val: taxSummary.taxableAmount ?? inv.taxableAmount ?? inv.subtotal, color: 'text-zinc-900' },
                    { label: 'CGST', val: taxSummary.cgstAmount ?? inv.cgstAmount, color: 'text-zinc-700' },
                    { label: 'SGST', val: taxSummary.sgstAmount ?? inv.sgstAmount, color: 'text-zinc-700' },
                    { label: 'IGST', val: taxSummary.igstAmount ?? inv.igstAmount, color: 'text-zinc-700' },
                    { label: 'CESS', val: taxSummary.cessAmount ?? inv.cessAmount, color: 'text-zinc-700' },
                    { label: 'TCS', val: taxSummary.tcsAmount ?? inv.tcsAmount, color: 'text-zinc-700' },
                    { label: 'Round Off', val: taxSummary.roundOff ?? inv.roundOff, color: 'text-zinc-700' },
                    { label: 'Total Tax', val: taxSummary.totalTax ?? inv.taxAmount, color: 'text-blue-700' },
                    { label: 'Grand Total', val: taxSummary.grandTotal ?? totalAmount, color: 'text-emerald-700' },
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
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Received</p>
                    <p className="text-xl font-black text-emerald-700">{curr} {fmt(receivedAmount)}</p>
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
                        onClick={() => setSelectedInvoiceForPayment(inv)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                  {isEmpty(paymentHistory) ? (
                    <EmptyState icon={<CreditCard size={48} />} title="No Payments Recorded" desc="No payments have been received for this invoice yet." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Receipt Number</th>
                            <th className="p-4">Receipt Date</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Payment Mode</th>
                            <th className="p-4">Reference Number</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {paymentHistory.map((p, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-4 font-mono text-xs font-semibold text-blue-600">{p.receiptNumber || p.id}</td>
                              <td className="p-4 text-zinc-600">{p.receiptDate || p.date}</td>
                              <td className="p-4 text-right font-bold text-emerald-600">{curr} {fmt(p.amount)}</td>
                              <td className="p-4 text-zinc-700 font-medium">{p.paymentMode || 'BANK_TRANSFER'}</td>
                              <td className="p-4 font-mono text-xs text-zinc-500">{p.referenceNumber || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    <p className="text-base font-mono font-bold text-zinc-900">{journalEntry.voucherNumber || `JV-${inv.invoiceNumber || 'INV'}`}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Posting Date</p>
                    <p className="text-sm font-medium text-zinc-800">{journalEntry.postingDate || inv.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">GL Posting Status</p>
                    <StatusBadge status={inv.glPostingStatus || 'DRAFT'} />
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
                        {/* Accounts Receivable (Debit) */}
                        <tr className="hover:bg-zinc-50/50">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700">1100-AR</td>
                          <td className="p-4 font-medium text-zinc-900">Accounts Receivable - {inv.customerName || inv.customer}</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600">₹{fmt(totalAmount)}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                        </tr>
                        {/* Sales Revenue (Credit) */}
                        <tr className="hover:bg-zinc-50/50">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700">4000-REV</td>
                          <td className="p-4 font-medium text-zinc-900">Sales Revenue</td>
                          <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{fmt(inv.taxableAmount ?? inv.subtotal)}</td>
                        </tr>
                        {/* Output Tax (Credit) */}
                        {(inv.taxAmount ?? 0) > 0 && (
                          <tr className="hover:bg-zinc-50/50">
                            <td className="p-4 font-mono text-xs font-semibold text-zinc-700">2200-TAX</td>
                            <td className="p-4 font-medium text-zinc-900">Output GST Payable</td>
                            <td className="p-4 text-right font-mono text-zinc-400">0.00</td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{fmt(inv.taxAmount)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEDGER IMPACT TAB ── */}
            {activeTab === 'ledger' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl animate-in fade-in">
                {[
                  { name: 'Accounts Receivable Ledger', code: '1100-AR', type: 'DEBIT', amt: totalAmount, color: 'text-red-600' },
                  { name: 'Sales Revenue Ledger', code: '4000-REV', type: 'CREDIT', amt: inv.taxableAmount ?? inv.subtotal, color: 'text-emerald-600' },
                  { name: 'Output CGST Ledger', code: '2201-CGST', type: 'CREDIT', amt: inv.cgstAmount ?? 0, color: 'text-emerald-600' },
                  { name: 'Output SGST Ledger', code: '2202-SGST', type: 'CREDIT', amt: inv.sgstAmount ?? 0, color: 'text-emerald-600' },
                  { name: 'Output IGST Ledger', code: '2203-IGST', type: 'CREDIT', amt: inv.igstAmount ?? 0, color: 'text-emerald-600' },
                  { name: 'Output CESS Ledger', code: '2204-CESS', type: 'CREDIT', amt: inv.cessAmount ?? 0, color: 'text-emerald-600' },
                ].map(({ name, code, type, amt, color }) => (
                  <div key={code} className="p-5 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{code}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${type === 'DEBIT' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 mt-2">{name}</h4>
                    </div>
                    <p className={`text-xl font-black ${color} mt-4`}>{curr} {fmt(amt)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── INVENTORY TAB ── */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                {/* Top Level Inventory Movement */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Inventory Stock Movements</h3>
                  </div>
                  <div className="p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Stock Movement</dt>
                        <dd className="text-sm font-medium text-zinc-900">{inventoryInfo.stockMovement || 'N/A'}</dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Inventory Sync Status</dt>
                        <dd className={`text-sm font-bold ${inventoryInfo.inventorySyncStatus === 'SUCCESS' ? 'text-emerald-600' : inventoryInfo.inventorySyncStatus === 'FAILED' ? 'text-rose-600' : 'text-zinc-600'}`}>
                          {inventoryInfo.inventorySyncStatus || 'N/A'}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Inventory Transaction ID</dt>
                        <dd className="text-sm font-mono text-zinc-700">{inventoryInfo.inventoryTransactionId || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Line Items Inventory Details */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Invoice Items Inventory</h3>
                  </div>
                  {isEmpty(lineItems) ? (
                    <div className="p-6 text-center text-sm font-medium text-zinc-500">
                      No line items available.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {lineItems.map((item, idx) => (
                        <div key={idx} className="p-6">
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-zinc-900">{item.itemName || item.name || `Item ${idx + 1}`}</h4>
                            {item.itemCode && <p className="text-xs font-mono text-zinc-500 mt-0.5">Code: {item.itemCode}</p>}
                          </div>

                          {!item.inventory ? (
                            <div className="text-sm font-medium text-zinc-500 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                              Inventory information unavailable for this item.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50/50 p-5 rounded-lg border border-zinc-200/60">
                              <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Warehouse</span>
                                <span className="text-sm font-medium text-zinc-900">{item.inventory.warehouseName || 'N/A'}</span>
                                {item.inventory.warehouseId && <span className="text-[8px] font-mono text-zinc-400">ID: {item.inventory.warehouseId}</span>}
                              </div>
                              <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Location</span>
                                <span className="text-sm font-medium text-zinc-900">{item.inventory.locationName || 'N/A'}</span>
                                {item.inventory.locationId && <span className="text-[8px] font-mono text-zinc-400">ID: {item.inventory.locationId}</span>}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Stock</span>
                                <span className="text-sm font-medium text-zinc-900">{item.inventory.stockQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Reserved</span>
                                <span className="text-sm font-medium text-zinc-900">{item.inventory.reservedQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Available</span>
                                <span className="text-sm font-medium text-zinc-900">{item.inventory.availableQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Batch</span>
                                <span className="text-sm font-mono text-zinc-900">{item.inventory.batchCode || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1 col-span-4 mt-2 pt-3 border-t border-zinc-200/60">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Inventory Fetch Status</span>
                                <span className={`text-sm font-bold inline-flex items-center gap-1.5 ${item.inventory.inventoryFetchStatus === 'SUCCESS' ? 'text-emerald-600' : item.inventory.inventoryFetchStatus === 'FAILED' ? 'text-rose-600' : 'text-zinc-600'}`}>
                                  {item.inventory.inventoryFetchStatus === 'SUCCESS' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                  {item.inventory.inventoryFetchStatus === 'FAILED' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                  {item.inventory.inventoryFetchStatus || 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DELIVERY TAB ── */}
            {activeTab === 'delivery' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Dispatch & Delivery Details</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Delivery Challan', deliveryInfo.challanNumber || deliveryInfo.deliveryChallan || '-'],
                      ['Dispatch Date', deliveryInfo.dispatchDate || '-'],
                      ['Transporter Name', deliveryInfo.transporterName || deliveryInfo.transporter || inv.transporter || '-'],
                      ['Vehicle Number', deliveryInfo.vehicleNumber || deliveryInfo.vehicleNo || inv.vehicleNo || '-'],
                      ['Transport Doc No / LR', deliveryInfo.trackingNumber || deliveryInfo.lrNumber || deliveryInfo.transportDocNo || inv.transportDocNo || '-'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</dt>
                        <dd className="text-sm font-medium text-zinc-900">{val || '-'}</dd>
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
                      <dd className="mt-1"><StatusBadge status={approvalInfo.status || inv.status || 'APPROVED'} /></dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approved By</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{approvalInfo.approvedBy || approvalInfo.approverName || inv.approverName || '-'}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approved Date</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{approvalInfo.approvedDate || inv.approvedAt ? new Date(approvalInfo.approvedDate || inv.approvedAt).toLocaleString() : '-'}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Approval Notes</dt>
                      <dd className="text-sm font-medium text-zinc-900 mt-1">{approvalInfo.notes || approvalInfo.approvalNotes || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* ── RELATED TRANSACTIONS TAB ── */}
            {activeTab === 'related' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="flex space-x-2 border-b border-zinc-200 pb-2">
                  {['payments', 'creditNotes', 'debitNotes', 'journalEntries'].map(st => (
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
                  {relatedSubTab === 'payments' && (isEmpty(paymentHistory) ? <EmptyState icon={<CreditCard size={36} />} title="No Payments" desc="No payments linked." /> : <p className="text-sm font-medium text-zinc-700">{paymentHistory.length} payment(s) linked.</p>)}
                  {relatedSubTab === 'creditNotes' && <EmptyState icon={<FileText size={36} />} title="No Credit Notes" desc="No credit notes issued for this invoice." />}
                  {relatedSubTab === 'debitNotes' && <EmptyState icon={<FileText size={36} />} title="No Debit Notes" desc="No debit notes issued for this invoice." />}
                  {relatedSubTab === 'journalEntries' && <p className="text-sm font-medium text-zinc-700">1 General Ledger Journal Entry Posted.</p>}
                </div>
              </div>
            )}

            {/* ── ATTACHMENTS TAB ── */}
            {activeTab === 'attachments' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 max-w-4xl animate-in fade-in">
                {isEmpty(attachments) ? (
                  <EmptyState icon={<Paperclip size={48} />} title="No Attachments" desc="No file attachments uploaded for this sales invoice." />
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
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Audit Trail</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Created Information</dt>
                      <dd className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <p className="text-sm font-medium text-zinc-900">By: {auditInfo.createdBy || auditInfo.createdByName || inv.createdByName || '-'}</p>
                        <p className="text-xs text-zinc-500 mt-1">At: {auditInfo.createdAt || inv.createdAt ? new Date(auditInfo.createdAt || inv.createdAt).toLocaleString() : '-'}</p>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Last Updated Information</dt>
                      <dd className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <p className="text-sm font-medium text-zinc-900">By: {auditInfo.updatedBy || auditInfo.updatedByName || inv.updatedByName || '-'}</p>
                        <p className="text-xs text-zinc-500 mt-1">At: {auditInfo.updatedAt || inv.updatedAt ? new Date(auditInfo.updatedAt || inv.updatedAt).toLocaleString() : '-'}</p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Sales Invoice"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10.4px] font-semibold text-zinc-700">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10.4px] font-semibold text-zinc-700">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700">Reference Number</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full h-20 p-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-1.5 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="px-5 py-1.5 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Partial Payment Modal */}
      {selectedInvoiceForPayment && (
        <PartialPaymentModal
          invoice={selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => refetch()}
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
