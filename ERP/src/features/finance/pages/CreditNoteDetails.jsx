import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, FileText, ShoppingCart, 
  LayoutList, History, CheckSquare,
  Building2, Clock, 
  Network, BookOpen, 
  Paperclip, XCircle, Percent, Mail, Info, FileDigit, Settings
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { creditNotesApi } from '../../../api/account';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import Modal from '../../../components/common/Modal';
import { useAppDispatch } from '../../../app/hooks';
import StatusBadge from '../../../components/common/StatusBadge';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#161922] border border-zinc-100 dark:border-[#2A2F3D] rounded-xl shadow-sm h-full">
    <div className="w-16 h-16 bg-zinc-50 dark:bg-[#1D212C] rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-zinc-400 dark:text-zinc-500" />
    </div>
    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1">{title}</h3>
    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{message}</p>
  </div>
);

export default function CreditNoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    noteDate: '',
    referenceNo: '',
    reason: ''
  });

  const { data: response, isLoading, error, refetch } = useApiQuery(
    creditNotesApi.getCreditNoteById,
    id,
    { enabled: !!id }
  );

  const submitMutation = useApiMutation(creditNotesApi.submitCreditNote);
  const approveMutation = useApiMutation(creditNotesApi.approveCreditNote);
  const rejectMutation = useApiMutation(creditNotesApi.rejectCreditNote);
  const postMutation = useApiMutation(creditNotesApi.postCreditNote);
  const reverseMutation = useApiMutation(creditNotesApi.reverseCreditNote);
  const cancelMutation = useApiMutation(creditNotesApi.cancelCreditNote);
  const updateMutation = useApiMutation(
    (payload) => creditNotesApi.updateCreditNote({ id, data: payload }),
    {
      onSuccess: () => {
        dispatch(addAlert({ type: 'success', message: 'Credit Note updated successfully.' }));
        setIsEditModalOpen(false);
        refetch();
      }
    }
  );

  const raw = response?.data?.data || response?.data || response;
  const cnData = raw && typeof raw === 'object' && ('master' in raw || 'customer' in raw) ? raw : null;

  if (isLoading) return <PageLoader message="Loading Credit Note details..." />;

  if (error || !cnData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50 dark:bg-[#0F1117]">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Credit Note Not Found</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{error?.message || "The requested credit note could not be found."}</p>
        <button onClick={() => refetch()} className="btn-secondary">Retry</button>
      </div>
    );
  }

  const master = cnData.master || {};
  const company = cnData.company || {};
  const customer = cnData.customer || {};
  const invoice = cnData.invoice || {};
  const items = cnData.items || [];
  const taxSummary = cnData.taxSummary || {};
  const ledgerAccounts = cnData.ledgerAccounts || {};
  const allocations = cnData.allocations || [];
  const statistics = cnData.statistics || {};
  const workflow = cnData.workflow || {};
  const audit = cnData.audit || {};
  const glPosting = cnData.glPosting;
  const relatedDocuments = cnData.relatedDocuments || {};
  const attachments = Array.isArray(cnData.attachments) ? cnData.attachments : [];
  const ledgerImpact = cnData.ledgerImpact || {};

  const handleAction = async (actionFn, actionName) => {
    if (await confirmDialog({ 
      title: `${actionName} Credit Note`,
      message: `Are you sure you want to ${actionName.toLowerCase()} Credit Note ${master.creditNoteNo}?`
    })) {
      try {
        const res = await actionFn.mutateAsync(master.id);
        const message = res?.data?.message || res?.message || `Credit Note ${actionName.toLowerCase()}d successfully.`;
        dispatch(addAlert({ type: 'success', message }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || `Failed to ${actionName.toLowerCase()} Credit Note` }));
      }
    }
  };

  const handleEditClick = () => {
    setFormData({
      noteDate: master.noteDate ? new Date(master.noteDate).toISOString().split('T')[0] : '',
      referenceNo: master.referenceNo || '',
      reason: master.reason || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const salesInvoiceId = invoice.id || cnData.salesInvoiceId || master.salesInvoiceId;
      const receivableAccountId = ledgerAccounts.receivableAccount?.id || master.receivableAccountId;
      const revenueAdjustmentAccountId = ledgerAccounts.revenueAdjustmentAccount?.id || master.revenueAdjustmentAccountId;
      const amount = Number(master.amount ?? taxSummary.totalCreditNoteAmount ?? 0);
      const gstAmount = Number(master.gstAmount ?? taxSummary.totalGst ?? 0);

      await updateMutation.mutateAsync({
        salesInvoiceId,
        creditNoteNo: master.creditNoteNo,
        noteDate: formData.noteDate,
        amount,
        gstAmount,
        referenceNo: formData.referenceNo || undefined,
        reason: formData.reason,
        receivableAccountId,
        revenueAdjustmentAccountId
      });
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update credit note.' }));
    }
  };

  const curr = company.baseCurrency || 'INR';
  const totalAmount = taxSummary.totalCreditNoteAmount ?? 0;
  const gstAmount = taxSummary.totalGst ?? 0;
  const taxableAmount = taxSummary.taxableAmount ?? (totalAmount - gstAmount);
  
  const totalAdjustedAmount = statistics.totalAdjustedAmount ?? 0;
  const remainingCredit = statistics.remainingCredit ?? (totalAmount - totalAdjustedAmount);
  
  const journalCount = statistics.journalCount ?? (glPosting ? 1 : 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'invoice', label: 'Invoice Information', icon: <FileText size={16} /> },
    { id: 'items', label: 'Line Items', icon: <ShoppingCart size={16} /> },
    { id: 'tax', label: 'Tax Summary', icon: <Percent size={16} /> },
    { id: 'ledger', label: 'Ledger Accounts', icon: <Settings size={16} /> },
    { id: 'gl', label: 'General Ledger', icon: <BookOpen size={16} /> },
    { id: 'impact', label: 'Ledger Impact', icon: <FileDigit size={16} /> },
    { id: 'allocations', label: 'Allocations', icon: <CheckSquare size={16} /> },
    { id: 'related', label: 'Related Documents', icon: <Network size={16} /> },
    { id: 'workflow', label: 'Workflow', icon: <CheckSquare size={16} /> },
    { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <History size={16} /> }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                {master.creditNoteNo || '-'}
              </h1>
              <StatusBadge status={master.status} />
              <StatusBadge status={master.postingStatus} />
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {customer.name || '-'}
              </span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500">
                ({master.noteDate ? new Date(master.noteDate).toLocaleDateString() : '-'})
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => alert("Export PDF coming soon")} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          {master.status === 'DRAFT' && (
            <button onClick={handleEditClick} className="btn-primary flex items-center gap-2">
              <Edit size={16} /> Edit
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(prev => !prev)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <span>More Actions</span>
            </button>
            {showMoreActions && (
              <>
                <div 
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMoreActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#1D212C] rounded-xl shadow-xl border border-zinc-200 dark:border-[#2A2F3D] py-1.5 z-40">
                  <button onClick={() => alert('Email functionality coming soon')} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                    <Mail size={14} /> Email Credit Note
                  </button>
                  <button onClick={() => navigate(buildPath('/accounts/masters/customers'))} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                    <Building2 size={14} /> View Customer Ledger
                  </button>
                  <div className="h-px bg-zinc-100 dark:bg-[#2A2F3D] my-1" />
                  
                  {master.status === 'DRAFT' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(submitMutation, 'Submit'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2">
                      <CheckSquare size={14} /> Submit
                    </button>
                  )}
                  {master.status === 'SUBMITTED' && (
                    <>
                      <button onClick={() => { setShowMoreActions(false); handleAction(approveMutation, 'Approve'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2">
                        <CheckSquare size={14} /> Approve
                      </button>
                      <button onClick={() => { setShowMoreActions(false); handleAction(rejectMutation, 'Reject'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {master.status === 'APPROVED' && master.postingStatus !== 'POSTED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(postMutation, 'Post to GL'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2">
                      <FileDigit size={14} /> Post to GL
                    </button>
                  )}
                  {master.postingStatus === 'POSTED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(reverseMutation, 'Reverse'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2">
                      <Undo size={14} /> Reverse
                    </button>
                  )}
                  {(master.status === 'DRAFT' || master.status === 'REVERSED') && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(cancelMutation, 'Cancel'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2">
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Credit Note Amount</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{curr} {fmt(totalAmount)}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Taxable Amount</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{curr} {fmt(taxableAmount)}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total GST</p>
            <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{curr} {fmt(gstAmount)}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Adjusted</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{curr} {fmt(totalAdjustedAmount)}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Remaining Credit</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{curr} {fmt(remainingCredit)}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Allocations</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{statistics.allocationCount ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Journals</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{journalCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6">
          
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <Info size={16} className="text-blue-500" /> Credit Note Summary
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Credit Note No.</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{master.creditNoteNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{customer.name || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invoice No.</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{invoice.invoiceNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{master.noteDate ? new Date(master.noteDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{master.status || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Posting Status</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{master.postingStatus || 'UNPOSTED'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Reference No.</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{master.referenceNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-[#1D212C] p-2 rounded-md border border-zinc-100 dark:border-[#2A2F3D] whitespace-pre-wrap mt-1">
                  {master.reason || 'No reason provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <FileDigit size={16} className="text-amber-500" /> Quick Actions
              </h3>
            </div>
            <div className="p-2 flex flex-col">
              <button onClick={handleEditClick} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                <Edit size={14} /> Edit Credit Note
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                <Printer size={14} /> Print Credit Note
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                <Download size={14} /> Export PDF
              </button>
              <button onClick={() => alert('Email functionality coming soon')} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                <Mail size={14} /> Email Customer
              </button>
              <button onClick={() => navigate(buildPath('/accounts/masters/customers'))} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-2">
                <Building2 size={14} /> View Customer Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Main Content (70%) */}
        {/* Main Content (70%) */}
        <div className="w-full lg:w-[70%] bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:h-[calc(100vh-280px)]">
          {/* Scrollable Tabs Header */}
          <div className="bg-zinc-50/80 dark:bg-[#1D212C] backdrop-blur-sm p-1.5 border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm sticky top-0 z-10 overflow-x-auto no-scrollbar">
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all shrink-0 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/50 dark:border-[#2A2F3D]'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-[#222736]'
                  }`}
                >
                  {React.cloneElement(tab.icon, { 
                    className: activeTab === tab.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500' 
                  })}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#161922]">
            
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-500" /> Credit Note Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Credit Note No.</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{master.creditNoteNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{master.noteDate ? new Date(master.noteDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                        <StatusBadge status={master.status} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Posting Status</p>
                        <StatusBadge status={master.postingStatus} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Reference No.</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{master.referenceNo || '-'}</p>
                      </div>
                      <div className="col-span-2 mt-2">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-md border border-zinc-100 dark:border-[#2A2F3D]">{master.reason || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-indigo-500" /> Customer Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Customer Name</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Customer Code</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">GSTIN</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.gstin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">PAN</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.pan || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.email || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 mt-2">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Billing Address</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-md border border-zinc-100 dark:border-[#2A2F3D]">{customer.billingAddress || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!invoice.invoiceNumber ? (
                  <EmptyState title="No Linked Invoice" message="This credit note is not linked to a specific sales invoice." icon={FileText} />
                ) : (
                  <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-500" /> Linked Invoice Details
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invoice Number</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{invoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{invoice.invoiceDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invoice Amount</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{curr} {fmt(invoice.invoiceAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Outstanding</p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{curr} {fmt(invoice.outstandingAmount)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {items.length === 0 ? (
                  <EmptyState title="No Line Items" message="There are no specific line items recorded for this credit note." icon={ShoppingCart} />
                ) : (
                  <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-x-auto min-w-0 max-w-full custom-scrollbar shadow-sm">
                    <table className="w-full min-w-[680px] text-left text-sm whitespace-nowrap" aria-label="Credit Note Items Table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-zinc-400 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-4 py-3">Item Code</th>
                          <th scope="col" className="px-4 py-3">Description</th>
                          <th scope="col" className="px-4 py-3 text-right">Qty</th>
                          <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                          <th scope="col" className="px-4 py-3 text-right">Taxable</th>
                          <th scope="col" className="px-4 py-3 text-right">Tax</th>
                          <th scope="col" className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{item.itemCode || '-'}</td>
                            <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{item.description || item.itemName || '-'}</td>
                            <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">{item.quantity || 1}</td>
                            <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100 tabular-nums">{fmt(item.unitPrice || item.rate)}</td>
                            <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">{fmt(item.taxableAmount || item.amount)}</td>
                            <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400 tabular-nums">{fmt(item.taxAmount || item.gstAmount || (item.cgst + item.sgst + item.igst + item.cess))}</td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{fmt(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Taxable Amount</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{curr} {fmt(taxSummary.taxableAmount)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">CGST</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{curr} {fmt(taxSummary.cgstAmount || 0)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">SGST</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{curr} {fmt(taxSummary.sgstAmount || 0)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">IGST</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{curr} {fmt(taxSummary.igstAmount || 0)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Cess</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{curr} {fmt(taxSummary.cessAmount || 0)}</p>
                  </div>
                  <div className="bg-zinc-900 dark:bg-black border border-zinc-800 dark:border-[#2A2F3D] rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Tax</p>
                    <p className="text-2xl font-bold text-white">{curr} {fmt(taxSummary.totalGst)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                  <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <Settings size={16} className="text-blue-500" /> Account Settings
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Receivable Account</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] font-mono text-xs">{ledgerAccounts.receivableAccount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Revenue Adjustment Account</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] font-mono text-xs">{ledgerAccounts.revenueAdjustmentAccount || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gl' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {!glPosting ? (
                  <EmptyState title="Not Posted to GL" message="This credit note has not been posted to the general ledger yet." icon={BookOpen} />
                ) : (
                  <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500" /> GL Journal Entry
                      </div>
                      <span className="text-xs font-mono bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-[#2A2F3D]">Ref: {glPosting.journalId || 'N/A'}</span>
                    </div>
                    <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                      View Journal Entry details feature is coming soon.
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {Object.keys(ledgerImpact).length === 0 ? (
                  <EmptyState title="Ledger Impact" message="No ledger impact data available." icon={FileDigit} />
                ) : (
                  <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                      <FileDigit size={16} className="text-purple-500" /> Ledger Impacts
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(ledgerImpact).map(([key, value]) => (
                        <div key={key} className="bg-white dark:bg-[#1D212C] border border-zinc-100 dark:border-[#2A2F3D] p-4 rounded-lg shadow-sm">
                           <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                           <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'allocations' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {allocations.length === 0 ? (
                  <EmptyState title="No Allocations" message="This credit note has not been allocated to any invoices." icon={CheckSquare} />
                ) : (
                  <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-x-auto min-w-0 max-w-full custom-scrollbar shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Credit Note Allocations Table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-zinc-400 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-4 py-3">Applied Invoice</th>
                          <th scope="col" className="px-4 py-3 text-right">Allocated Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                        {allocations.map((alloc, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                            <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{alloc.invoiceNo || alloc.invoiceNumber || '-'}</td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{curr} {fmt(alloc.allocatedAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'related' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                  <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <Network size={16} className="text-indigo-500" /> Related Documents
                  </div>
                  <div className="p-4 flex gap-4 flex-wrap">
                    {relatedDocuments.salesInvoiceId ? (
                       <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors">
                         <FileText size={16} /> Sales Invoice: <span className="font-mono text-xs">{relatedDocuments.salesInvoiceId}</span>
                       </div>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2">No related documents found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                  <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <CheckSquare size={16} className="text-emerald-500" /> Approval Workflow
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Approval Status</p>
                      <StatusBadge status={workflow.approvalStatus} />
                    </div>
                    {workflow.approvedBy && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Approved By</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{workflow.approvedBy}</p>
                      </div>
                    )}
                    {workflow.approvedDate && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Approved Date</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(workflow.approvedDate).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {(!attachments.supportingDocuments || attachments.supportingDocuments.length === 0) && !attachments.creditNotePdf ? (
                 <EmptyState title="No Attachments" message="There are no files attached to this credit note." icon={Paperclip} />
                ) : (
                 <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                    <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                      <Paperclip size={16} className="text-zinc-500 dark:text-zinc-400" /> Attached Files
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {attachments.creditNotePdf && (
                        <div className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] p-4 rounded-lg flex items-center gap-3">
                           <FileText size={24} className="text-rose-500" />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">Credit Note PDF</p>
                             <p className="text-[8px] text-zinc-500 dark:text-zinc-400">System Generated</p>
                           </div>
                           <button className="text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300">
                             <Download size={16} />
                           </button>
                        </div>
                      )}
                    </div>
                 </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                <div className="border border-zinc-100 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#161922]">
                  <div className="bg-zinc-50/80 dark:bg-[#1D212C] px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-sm">
                    <History size={16} className="text-zinc-500 dark:text-zinc-400" /> Audit Log
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Created At</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{audit.createdAt ? new Date(audit.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Created By</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono text-xs truncate" title={audit.createdBy}>{audit.createdBy || 'System'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Updated At</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{audit.updatedAt ? new Date(audit.updatedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Updated By</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono text-xs truncate" title={audit.updatedBy}>{audit.updatedBy || 'N/A'}</p>
                    </div>
                    {audit.approvedDate && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Approved Date</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(audit.approvedDate).toLocaleString()}</p>
                      </div>
                    )}
                    {audit.postingTime && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Posted Date</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(audit.postingTime).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Credit Note"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[8.8px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Note Date</label>
              <input
                type="date"
                required
                value={formData.noteDate}
                onChange={e => setFormData({ ...formData, noteDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[8.8px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Reference No</label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-all"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[8.8px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Reason</label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-all min-h-[64px] resize-y"
                placeholder="Reason for credit note"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="btn-primary"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
