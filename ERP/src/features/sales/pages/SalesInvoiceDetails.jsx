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
import { confirmDialog } from '../../../utils/confirmDialog';
import PartialPaymentModal from '../components/PartialPaymentModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import StatusBadge from '../../../components/common/StatusBadge';
import WorkflowActionButtons from '../../workflows/components/WorkflowActionButtons';
import SalesInvoiceOverviewTab from '../components/sales-invoice-details/SalesInvoiceOverviewTab';
import SalesInvoiceItemsTab from '../components/sales-invoice-details/SalesInvoiceItemsTab';
import SalesInvoiceEditModal from '../components/sales-invoice-details/SalesInvoiceEditModal';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

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
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath('/accounts/sales/invoices'))}
            className="p-2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-900 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight font-mono">
                {inv.invoiceNumber || inv.invoiceNo}
              </h1>
              <StatusBadge status={inv.status} />
              <StatusBadge status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />
              <span className="text-sm font-medium text-zinc-500 dark:text-[#6B7184]">
                {inv.customerName || inv.customer}
              </span>
              <span className="text-sm text-zinc-400 dark:text-[#6B7184]">
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
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-lg z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowMoreActions(false)}
              >
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <Printer size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Print Invoice
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
                }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <Download size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Download PDF
                </button>
                <button onClick={async () => {
                  try {
                    await salesInvoicesApi.sendEmail(inv.id, companyId);
                    dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
                  } catch (err) {
                    dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
                  }
                  setShowMoreActions(false);
                }} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <Mail size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Email Invoice
                </button>
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <QrCode size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Download eInvoice
                </button>
                <button onClick={() => alert("Share link copied")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <Share2 size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Share Invoice
                </button>
                {outstandingAmount > 0 && (
                  <button onClick={() => setSelectedInvoiceForPayment(inv)} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold border-t border-zinc-100 dark:border-[#2A2F3D]">
                    <CreditCard size={14} className="text-emerald-500" /> Record Payment
                  </button>
                )}
                <button onClick={() => navigate(buildPath('/accounts/transactions/credit-notes'))} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium border-t border-zinc-100 dark:border-[#2A2F3D]">
                  <FilePlus size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Create Credit Note
                </button>
                <button onClick={() => navigate(buildPath('/accounts/transactions/debit-notes'))} className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-2 text-zinc-700 dark:text-[#E6E8EE] font-medium">
                  <FilePlus size={14} className="text-zinc-400 dark:text-[#6B7184]" /> Create Debit Note
                </button>
                {(inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL') && (
                  <>
                    <button onClick={handleApproveInvoice} className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold border-t border-zinc-100 dark:border-[#2A2F3D]">
                      <CheckCircle size={14} className="text-emerald-500" /> Approve Invoice
                    </button>
                    <button onClick={handleRejectInvoice} className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
                      <XCircle size={14} className="text-rose-500" /> Reject Invoice
                    </button>
                  </>
                )}
                {inv.status === 'APPROVED' && (
                  <button onClick={handlePostInvoice} className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2 text-blue-700 dark:text-[#4C8DFF] font-semibold border-t border-zinc-100 dark:border-[#2A2F3D]">
                    <Activity size={14} className="text-blue-500" /> Post to GL
                  </button>
                )}
                {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                  <button onClick={handleCancelInvoice} className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold border-t border-zinc-100 dark:border-[#2A2F3D]">
                    <XCircle size={14} className="text-rose-500" /> Cancel Invoice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Action Bar */}
      <div className="px-6 pt-4">
        <WorkflowActionButtons
          module="SALES"
          documentType="SALES_INVOICE"
          documentId={invoiceId}
          documentStatus={inv.status}
          onActionComplete={refetch}
        />
      </div>

      {/* Top 8 KPI Cards (Color Coded: Paid -> Green, Outstanding -> Red, Draft -> Orange) */}
      <div className="p-6 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D]">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-1">Grand Total</p>
            <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(totalAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-1">Taxable Amount</p>
            <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(inv.taxableAmount ?? inv.subtotal)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-1">Total Tax</p>
            <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(inv.taxAmount ?? inv.totalTax)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/20 flex flex-col">
            <p className="text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-base font-black text-red-700 dark:text-red-400">{curr} {fmt(outstandingAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col">
            <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Received</p>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{curr} {fmt(receivedAmount)}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col">
            <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Payment %</p>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{paymentPercentage}%</p>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col">
            <p className="text-[8px] font-bold text-amber-600 dark:text-[#F5B544] uppercase tracking-wider mb-1">Days Outstanding</p>
            <p className="text-base font-black text-amber-700 dark:text-[#F5B544]">{inv.daysOutstanding || 0} d</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-col">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-1">Item Count</p>
            <p className="text-base font-black text-zinc-900 dark:text-[#E6E8EE]">{inv.itemCount || lineItems.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] overflow-y-auto hidden lg:block">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Invoice Summary</h3>
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
                    <dt className="text-xs font-semibold text-zinc-500 dark:text-[#6B7184] uppercase">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: <Edit size={16} className="text-zinc-400 dark:text-[#6B7184]" />, label: 'Edit Invoice', onClick: handleOpenEditModal },
                  { icon: <CreditCard size={16} className="text-emerald-500" />, label: 'Record Payment', onClick: () => setSelectedInvoiceForPayment(inv) },
                  { icon: <Printer size={16} className="text-zinc-400 dark:text-[#6B7184]" />, label: 'Print Invoice', onClick: () => window.print() },
                  { icon: <Download size={16} className="text-zinc-400 dark:text-[#6B7184]" />, label: 'Download PDF', onClick: () => window.print() },
                  { icon: <QrCode size={16} className="text-zinc-400 dark:text-[#6B7184]" />, label: 'Download eInvoice', onClick: () => window.print() },
                  { icon: <User size={16} className="text-zinc-400 dark:text-[#6B7184]" />, label: 'View Customer Ledger', onClick: () => navigate(buildPath('/accounts/masters/customers')) },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick} className="w-full flex items-center justify-between p-2.5 text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] bg-zinc-50 dark:bg-[#1D212C] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] transition-colors">
                    <span className="flex items-center gap-2">{icon}{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content (70%) */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-[#0F1117]">
          <div className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-[#161922]/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-md transition-all ${activeTab === tab.id
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-sm border border-zinc-200/50 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#6B7184] hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:bg-zinc-100/50 dark:hover:bg-[#222736]'
                    }`}
                >
                  <span className={activeTab === tab.id ? "text-blue-600 dark:text-[#4C8DFF]" : "text-zinc-400 dark:text-[#6B7184]"}>
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
              <SalesInvoiceOverviewTab
                inv={inv}
                companyInfo={companyInfo}
                customerInfo={customerInfo}
                deliveryInfo={deliveryInfo}
                eInvoiceInfo={eInvoiceInfo}
                curr={curr}
                fmt={fmt}
                StatusBadge={StatusBadge}
                totalAmount={totalAmount}
                outstandingAmount={outstandingAmount}
              />
            )}

            {/* ── LINE ITEMS TAB ── */}
            {activeTab === 'items' && (
              <SalesInvoiceItemsTab
                lineItems={lineItems}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                fmt={fmt}
                isEmpty={isEmpty}
                EmptyState={EmptyState}
              />
            )}

            {/* ── TAX SUMMARY TAB ── */}
            {activeTab === 'tax' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Taxable Amount', val: taxSummary.taxableAmount ?? inv.taxableAmount ?? inv.subtotal, color: 'text-zinc-900 dark:text-[#E6E8EE]' },
                    { label: 'CGST', val: taxSummary.cgstAmount ?? inv.cgstAmount, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'SGST', val: taxSummary.sgstAmount ?? inv.sgstAmount, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'IGST', val: taxSummary.igstAmount ?? inv.igstAmount, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'CESS', val: taxSummary.cessAmount ?? inv.cessAmount, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'TCS', val: taxSummary.tcsAmount ?? inv.tcsAmount, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'Round Off', val: taxSummary.roundOff ?? inv.roundOff, color: 'text-zinc-700 dark:text-[#A0A6B5]' },
                    { label: 'Total Tax', val: taxSummary.totalTax ?? inv.taxAmount, color: 'text-blue-700 dark:text-[#4C8DFF]' },
                    { label: 'Grand Total', val: taxSummary.grandTotal ?? totalAmount, color: 'text-emerald-700 dark:text-emerald-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="p-5 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">{label}</p>
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
                  <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Received</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{curr} {fmt(receivedAmount)}</p>
                  </div>
                  <div className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Outstanding Amount</p>
                    <p className="text-xl font-black text-red-700 dark:text-red-400">{curr} {fmt(outstandingAmount)}</p>
                  </div>
                  <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex flex-col">
                    <p className="text-[8px] font-bold text-blue-600 dark:text-[#4C8DFF] uppercase tracking-wider mb-1">Payment Percentage</p>
                    <p className="text-xl font-black text-blue-700 dark:text-[#4C8DFF]">{paymentPercentage}%</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-between">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Payment History</h3>
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
                    <div className="overflow-x-auto min-w-0 custom-scrollbar">
                      <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Payment History Table">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider text-xs sticky top-0 z-10">
                          <tr>
                            <th scope="col" className="p-4">Receipt Number</th>
                            <th scope="col" className="p-4">Receipt Date</th>
                            <th scope="col" className="p-4 text-right">Amount</th>
                            <th scope="col" className="p-4">Payment Mode</th>
                            <th scope="col" className="p-4">Reference Number</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {paymentHistory.map((p, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                              <td className="p-4 font-mono text-xs font-semibold text-blue-600 dark:text-[#4C8DFF]">{p.receiptNumber || p.id}</td>
                              <td className="p-4 text-zinc-600 dark:text-[#A0A6B5]">{p.receiptDate || p.date}</td>
                              <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">{curr} {fmt(p.amount)}</td>
                              <td className="p-4 text-zinc-700 dark:text-[#E6E8EE] font-medium">{p.paymentMode || 'BANK_TRANSFER'}</td>
                              <td className="p-4 font-mono text-xs text-zinc-500 dark:text-[#6B7184]">{p.referenceNumber || '-'}</td>
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
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in max-w-4xl">
                <div className="p-5 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Voucher Number</p>
                    <p className="text-base font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">{journalEntry.voucherNumber || `JV-${inv.invoiceNumber || 'INV'}`}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Posting Date</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-[#E6E8EE]">{journalEntry.postingDate || inv.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">GL Posting Status</p>
                    <StatusBadge status={inv.glPostingStatus || 'DRAFT'} />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="overflow-x-auto min-w-0 custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Journal Entries Table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider text-xs sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="p-4">Account Code</th>
                          <th scope="col" className="p-4">Account Name</th>
                          <th scope="col" className="p-4 text-right">Debit ({curr})</th>
                          <th scope="col" className="p-4 text-right">Credit ({curr})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                        {/* Accounts Receivable (Debit) */}
                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5]">1100-AR</td>
                          <td className="p-4 font-medium text-zinc-900 dark:text-[#E6E8EE]">Accounts Receivable - {inv.customerName || inv.customer}</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600 dark:text-red-400">₹{fmt(totalAmount)}</td>
                          <td className="p-4 text-right font-mono text-zinc-400 dark:text-[#6B7184]">0.00</td>
                        </tr>
                        {/* Sales Revenue (Credit) */}
                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                          <td className="p-4 font-mono text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5]">4000-REV</td>
                          <td className="p-4 font-medium text-zinc-900 dark:text-[#E6E8EE]">Sales Revenue</td>
                          <td className="p-4 text-right font-mono text-zinc-400 dark:text-[#6B7184]">0.00</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{fmt(inv.taxableAmount ?? inv.subtotal)}</td>
                        </tr>
                        {/* Output Tax (Credit) */}
                        {(inv.taxAmount ?? 0) > 0 && (
                          <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                            <td className="p-4 font-mono text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5]">2200-TAX</td>
                            <td className="p-4 font-medium text-zinc-900 dark:text-[#E6E8EE]">Output GST Payable</td>
                            <td className="p-4 text-right font-mono text-zinc-400 dark:text-[#6B7184]">0.00</td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{fmt(inv.taxAmount)}</td>
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
                  { name: 'Accounts Receivable Ledger', code: '1100-AR', type: 'DEBIT', amt: totalAmount, color: 'text-red-600 dark:text-red-400' },
                  { name: 'Sales Revenue Ledger', code: '4000-REV', type: 'CREDIT', amt: inv.taxableAmount ?? inv.subtotal, color: 'text-emerald-600 dark:text-emerald-400' },
                  { name: 'Output CGST Ledger', code: '2201-CGST', type: 'CREDIT', amt: inv.cgstAmount ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                  { name: 'Output SGST Ledger', code: '2202-SGST', type: 'CREDIT', amt: inv.sgstAmount ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                  { name: 'Output IGST Ledger', code: '2203-IGST', type: 'CREDIT', amt: inv.igstAmount ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                  { name: 'Output CESS Ledger', code: '2204-CESS', type: 'CREDIT', amt: inv.cessAmount ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(({ name, code, type, amt, color }) => (
                  <div key={code} className="p-5 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded">{code}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${type === 'DEBIT' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>{type}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] mt-2">{name}</h4>
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
                <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Inventory Stock Movements</h3>
                  </div>
                  <div className="p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Stock Movement</dt>
                        <dd className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{inventoryInfo.stockMovement || 'N/A'}</dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Inventory Sync Status</dt>
                        <dd className={`text-sm font-bold ${inventoryInfo.inventorySyncStatus === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : inventoryInfo.inventorySyncStatus === 'FAILED' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-[#A0A6B5]'}`}>
                          {inventoryInfo.inventorySyncStatus || 'N/A'}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Inventory Transaction ID</dt>
                        <dd className="text-sm font-mono text-zinc-700 dark:text-[#A0A6B5]">{inventoryInfo.inventoryTransactionId || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Line Items Inventory Details */}
                <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Invoice Items Inventory</h3>
                  </div>
                  {isEmpty(lineItems) ? (
                    <div className="p-6 text-center text-sm font-medium text-zinc-500 dark:text-[#6B7184]">
                      No line items available.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                      {lineItems.map((item, idx) => (
                        <div key={idx} className="p-6">
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.itemName || item.name || `Item ${idx + 1}`}</h4>
                            {item.itemCode && <p className="text-xs font-mono text-zinc-500 dark:text-[#6B7184] mt-0.5">Code: {item.itemCode}</p>}
                          </div>

                          {!item.inventory ? (
                            <div className="text-sm font-medium text-zinc-500 dark:text-[#6B7184] bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                              Inventory information unavailable for this item.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50/50 dark:bg-[#1D212C] p-5 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D]">
                              <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Warehouse</span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.warehouseName || 'N/A'}</span>
                                {item.inventory.warehouseId && <span className="text-[8px] font-mono text-zinc-400 dark:text-[#6B7184]">ID: {item.inventory.warehouseId}</span>}
                              </div>
                              <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Location</span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.locationName || 'N/A'}</span>
                                {item.inventory.locationId && <span className="text-[8px] font-mono text-zinc-400 dark:text-[#6B7184]">ID: {item.inventory.locationId}</span>}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Stock</span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.stockQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Reserved</span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.reservedQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Available</span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.availableQuantity ?? 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Batch</span>
                                <span className="text-sm font-mono text-zinc-900 dark:text-[#E6E8EE]">{item.inventory.batchCode || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1 col-span-4 mt-2 pt-3 border-t border-zinc-200/60 dark:border-[#2A2F3D]">
                                <span className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Inventory Fetch Status</span>
                                <span className={`text-sm font-bold inline-flex items-center gap-1.5 ${item.inventory.inventoryFetchStatus === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : item.inventory.inventoryFetchStatus === 'FAILED' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-[#A0A6B5]'}`}>
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
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Dispatch & Delivery Details</h3>
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
                        <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">{label}</dt>
                        <dd className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* ── APPROVAL WORKFLOW TAB ── */}
            {activeTab === 'approval' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden max-w-4xl animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Approval Workflow</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Approval Status</dt>
                      <dd className="mt-1"><StatusBadge status={approvalInfo.status || inv.status || 'APPROVED'} /></dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Approved By</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">{approvalInfo.approvedBy || approvalInfo.approverName || inv.approverName || '-'}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Approved Date</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">{approvalInfo.approvedDate || inv.approvedAt ? new Date(approvalInfo.approvedDate || inv.approvedAt).toLocaleString() : '-'}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Approval Notes</dt>
                      <dd className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">{approvalInfo.notes || approvalInfo.approvalNotes || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* ── RELATED TRANSACTIONS TAB ── */}
            {activeTab === 'related' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in">
                <div className="flex space-x-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
                  {['payments', 'creditNotes', 'debitNotes', 'journalEntries'].map(st => (
                    <button
                      key={st}
                      onClick={() => setRelatedSubTab(st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${relatedSubTab === st ? 'bg-zinc-900 dark:bg-[#4C8DFF] text-white' : 'bg-white dark:bg-[#161922] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-6">
                  {relatedSubTab === 'payments' && (isEmpty(paymentHistory) ? <EmptyState icon={<CreditCard size={36} />} title="No Payments" desc="No payments linked." /> : <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">{paymentHistory.length} payment(s) linked.</p>)}
                  {relatedSubTab === 'creditNotes' && <EmptyState icon={<FileText size={36} />} title="No Credit Notes" desc="No credit notes issued for this invoice." />}
                  {relatedSubTab === 'debitNotes' && <EmptyState icon={<FileText size={36} />} title="No Debit Notes" desc="No debit notes issued for this invoice." />}
                  {relatedSubTab === 'journalEntries' && <p className="text-sm font-medium text-zinc-700 dark:text-[#A0A6B5]">1 General Ledger Journal Entry Posted.</p>}
                </div>
              </div>
            )}

            {/* ── ATTACHMENTS TAB ── */}
            {activeTab === 'attachments' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-6 max-w-4xl animate-in fade-in">
                {isEmpty(attachments) ? (
                  <EmptyState icon={<Paperclip size={48} />} title="No Attachments" desc="No file attachments uploaded for this sales invoice." />
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                    {attachments.map((att, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800 dark:text-[#E6E8EE]">{att.name}</span>
                        <button className="text-xs font-semibold text-blue-600 dark:text-[#4C8DFF] hover:underline">Download</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── AUDIT LOG TAB ── */}
            {activeTab === 'audit' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in max-w-4xl">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Audit Trail</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-2">Created Information</dt>
                      <dd className="bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">By: {auditInfo.createdBy || auditInfo.createdByName || inv.createdByName || '-'}</p>
                        <p className="text-xs text-zinc-500 dark:text-[#6B7184] mt-1">At: {auditInfo.createdAt || inv.createdAt ? new Date(auditInfo.createdAt || inv.createdAt).toLocaleString() : '-'}</p>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-2">Last Updated Information</dt>
                      <dd className="bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">By: {auditInfo.updatedBy || auditInfo.updatedByName || inv.updatedByName || '-'}</p>
                        <p className="text-xs text-zinc-500 dark:text-[#6B7184] mt-1">At: {auditInfo.updatedAt || inv.updatedAt ? new Date(auditInfo.updatedAt || inv.updatedAt).toLocaleString() : '-'}</p>
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
      <SalesInvoiceEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isLoading}
      />

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
    <div className="p-12 text-center text-zinc-500 dark:text-[#6B7184] flex flex-col items-center">
      <div className="mb-4 text-zinc-200 dark:text-[#2A2F3D]">{icon}</div>
      <p className="text-lg font-bold text-zinc-700 dark:text-[#E6E8EE]">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}
