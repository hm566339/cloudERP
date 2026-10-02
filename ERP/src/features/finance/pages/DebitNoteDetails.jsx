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
import { debitNotesApi } from '../../../api/account';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import Modal from '../../../components/common/Modal';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    SUBMITTED: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    DRAFT: { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-500' },
    REVERSED: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  }[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`px-2.5 py-1 text-[8.8px] font-semibold rounded-md border inline-flex items-center gap-1.5 uppercase ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s}
    </span>
  );
};

const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-100 rounded-xl shadow-sm h-full">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-zinc-400" />
    </div>
    <h3 className="text-sm font-bold text-zinc-800 mb-1">{title}</h3>
    <p className="text-xs text-zinc-500 max-w-sm">{message}</p>
  </div>
);

export default function DebitNoteDetails() {
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
    debitNotesApi.getDebitNoteById,
    id,
    { enabled: !!id }
  );

  const submitMutation = useApiMutation(debitNotesApi.submitDebitNote);
  const approveMutation = useApiMutation(debitNotesApi.approveDebitNote);
  const rejectMutation = useApiMutation(debitNotesApi.rejectDebitNote);
  const postMutation = useApiMutation(debitNotesApi.postDebitNote);
  const reverseMutation = useApiMutation(debitNotesApi.reverseDebitNote);
  const cancelMutation = useApiMutation(debitNotesApi.cancelDebitNote);
  const updateMutation = useApiMutation(
    (payload) => debitNotesApi.updateDebitNote({ id, data: payload }),
    {
      onSuccess: () => {
        dispatch(addAlert({ type: 'success', message: 'Debit Note updated successfully.' }));
        setIsEditModalOpen(false);
        refetch();
      }
    }
  );

  const raw = response?.data?.data || response?.data || response;
  const cnData = raw && typeof raw === 'object' && ('debitNote' in raw || 'master' in raw || 'vendor' in raw || 'Vendor' in raw) ? raw : null;

  if (isLoading) return <PageLoader message="Loading Debit Note details..." />;

  if (error || !cnData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 mb-2">Debit Note Not Found</h2>
        <p className="text-sm text-zinc-600 mb-6">{error?.message || "The requested Debit Note could not be found."}</p>
        <button onClick={() => refetch()} className="btn-secondary">Retry</button>
      </div>
    );
  }

  const master = cnData.debitNote || cnData.master || {};
  const company = cnData.company || {};
  const Vendor = cnData.vendor || cnData.Vendor || {};
  const invoice = cnData.purchaseInvoice || cnData.invoice || {};
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
      title: `${actionName} Debit Note`,
      message: `Are you sure you want to ${actionName.toLowerCase()} Debit Note ${master.debitNoteNo || master.DebitNoteNo}?`
    })) {
      try {
        const res = await actionFn.mutateAsync(master.id);
        const message = res?.data?.message || res?.message || `Debit Note ${actionName.toLowerCase()}d successfully.`;
        dispatch(addAlert({ type: 'success', message }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || `Failed to ${actionName.toLowerCase()} Debit Note` }));
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
      await updateMutation.mutateAsync(formData);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to update Debit Note.' }));
    }
  };

  const curr = company.baseCurrency || 'INR';
  const totalAmount = taxSummary.totalDebitNoteAmount ?? 0;
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
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-sm md:text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {master.debitNoteNo || master.DebitNoteNo || '-'}
              </h1>
              <StatusBadge status={master.status} />
              <StatusBadge status={master.postingStatus} />
              <span className="text-sm font-medium text-zinc-500">
                {Vendor.vendorName || Vendor.name || '-'}
              </span>
              <span className="text-sm text-zinc-400">
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
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-40">
                  <button onClick={() => alert('Email functionality coming soon')} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 flex items-center gap-2">
                    <Mail size={14} /> Email Debit Note
                  </button>
                  <button onClick={() => navigate(buildPath('/accounts/masters/vendors'))} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 flex items-center gap-2">
                    <Building2 size={14} /> View Vendor Ledger
                  </button>
                  <div className="h-px bg-zinc-100 my-1" />
                  
                  {master.status === 'DRAFT' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(submitMutation, 'Submit'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                      <CheckSquare size={14} /> Submit
                    </button>
                  )}
                  {master.status === 'SUBMITTED' && (
                    <>
                      <button onClick={() => { setShowMoreActions(false); handleAction(approveMutation, 'Approve'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                        <CheckSquare size={14} /> Approve
                      </button>
                      <button onClick={() => { setShowMoreActions(false); handleAction(rejectMutation, 'Reject'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {master.status === 'APPROVED' && master.postingStatus !== 'POSTED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(postMutation, 'Post to GL'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                      <FileDigit size={14} /> Post to GL
                    </button>
                  )}
                  {master.status !== 'CANCELLED' && master.status !== 'REVERSED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(master.postingStatus === 'POSTED' ? reverseMutation : cancelMutation, master.postingStatus === 'POSTED' ? 'Reverse' : 'Cancel'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                      <XCircle size={14} /> {master.postingStatus === 'POSTED' ? 'Reverse' : 'Cancel'}
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
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Debit Note Amount</p>
            <p className="text-lg font-bold text-zinc-900">{curr} {fmt(totalAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Taxable Amount</p>
            <p className="text-lg font-bold text-zinc-900">{curr} {fmt(taxableAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total GST</p>
            <p className="text-lg font-bold text-zinc-700">{curr} {fmt(gstAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Adjusted</p>
            <p className="text-lg font-bold text-blue-600">{curr} {fmt(totalAdjustedAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Remaining Credit</p>
            <p className="text-lg font-bold text-emerald-600">{curr} {fmt(remainingCredit)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Allocations</p>
            <p className="text-lg font-bold text-zinc-900">{statistics.allocationCount ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Journals</p>
            <p className="text-lg font-bold text-zinc-900">{journalCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6">
          
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                <Info size={16} className="text-blue-500" /> Debit Note Summary
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Debit Note No.</p>
                <p className="text-sm font-semibold text-zinc-900">{master.debitNoteNo || master.DebitNoteNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendor</p>
                <p className="text-sm font-medium text-zinc-800">{Vendor.vendorName || Vendor.name || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Invoice No.</p>
                <p className="text-sm font-medium text-zinc-800">{invoice.invoiceNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-medium text-zinc-800">{master.noteDate ? new Date(master.noteDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-medium text-zinc-800">{master.status || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Status</p>
                <p className="text-sm font-medium text-zinc-800">{master.postingStatus || 'UNPOSTED'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference No.</p>
                <p className="text-sm font-medium text-zinc-800">{master.referenceNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm font-medium text-zinc-800 bg-zinc-50 p-2 rounded-md border border-zinc-100 whitespace-pre-wrap mt-1">
                  {master.reason || 'No reason provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                <FileDigit size={16} className="text-amber-500" /> Quick Actions
              </h3>
            </div>
            <div className="p-2 flex flex-col">
              <button onClick={handleEditClick} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Edit size={14} /> Edit Debit Note
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Printer size={14} /> Print Debit Note
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Download size={14} /> Export PDF
              </button>
              <button onClick={() => alert('Email functionality coming soon')} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Mail size={14} /> Email Vendor
              </button>
              <button onClick={() => navigate(buildPath('/accounts/masters/vendors'))} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Building2 size={14} /> View Vendor Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Main Content (70%) */}
        <div className="w-full lg:w-[70%] bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-280px)] min-h-[400px]">
          {/* Scrollable Tabs Header */}
          <div className="bg-zinc-50/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 shadow-sm sticky top-0 z-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
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
                  {React.cloneElement(tab.icon, { 
                    className: activeTab === tab.id ? 'text-blue-600' : 'text-zinc-400' 
                  })}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-500" /> Debit Note Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Debit Note No.</p>
                        <p className="text-sm font-medium text-zinc-900">{master.debitNoteNo || master.DebitNoteNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-medium text-zinc-900">{master.noteDate ? new Date(master.noteDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                        <StatusBadge status={master.status} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Status</p>
                        <StatusBadge status={master.postingStatus} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference No.</p>
                        <p className="text-sm font-medium text-zinc-900">{master.referenceNo || '-'}</p>
                      </div>
                      <div className="col-span-2 mt-2">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{master.reason || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-indigo-500" /> Vendor Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendor Name</p>
                        <p className="text-sm font-bold text-zinc-900">{Vendor.vendorName || Vendor.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendor Code</p>
                        <p className="text-sm font-medium text-zinc-900">{Vendor.vendorCode || Vendor.code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GSTIN</p>
                        <p className="text-sm font-medium text-zinc-900">{Vendor.gstin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">PAN</p>
                        <p className="text-sm font-medium text-zinc-900">{Vendor.pan || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-medium text-zinc-900">{Vendor.email || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 mt-2">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Billing Address</p>
                        <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{Vendor.address || Vendor.billingAddress || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!invoice.invoiceNumber ? (
                  <EmptyState title="No Linked Invoice" message="This Debit Note is not linked to a specific sales invoice." icon={FileText} />
                ) : (
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-500" /> Linked Invoice Details
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Invoice Number</p>
                        <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">{invoice.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm font-medium text-zinc-900">{invoice.invoiceDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Invoice Amount</p>
                        <p className="text-sm font-bold text-zinc-900">{curr} {fmt(invoice.invoiceAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Outstanding</p>
                        <p className="text-sm font-bold text-rose-600">{curr} {fmt(invoice.outstandingAmount)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'items' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {items.length === 0 ? (
                  <EmptyState title="No Line Items" message="There are no specific line items recorded for this Debit Note." icon={ShoppingCart} />
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Item Code</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                          <th className="px-4 py-3 text-right">Unit Price</th>
                          <th className="px-4 py-3 text-right">Taxable</th>
                          <th className="px-4 py-3 text-right">Tax</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-3 font-medium text-zinc-900">{item.itemCode || '-'}</td>
                            <td className="px-4 py-3 text-zinc-700">{item.description || item.itemName || '-'}</td>
                            <td className="px-4 py-3 text-right text-zinc-900">{item.quantity || 1}</td>
                            <td className="px-4 py-3 text-right text-zinc-900">{fmt(item.unitPrice || item.rate)}</td>
                            <td className="px-4 py-3 text-right font-medium text-zinc-900">{fmt(item.taxableAmount || item.amount)}</td>
                            <td className="px-4 py-3 text-right text-zinc-600">{fmt(item.taxAmount || item.gstAmount || (item.cgst + item.sgst + item.igst + item.cess))}</td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900">{fmt(item.totalAmount)}</td>
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
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Taxable Amount</p>
                    <p className="text-2xl font-bold text-zinc-900">{curr} {fmt(taxSummary.taxableAmount)}</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">CGST</p>
                    <p className="text-2xl font-bold text-blue-600">{curr} {fmt(taxSummary.cgstAmount || 0)}</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">SGST</p>
                    <p className="text-2xl font-bold text-indigo-600">{curr} {fmt(taxSummary.sgstAmount || 0)}</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">IGST</p>
                    <p className="text-2xl font-bold text-purple-600">{curr} {fmt(taxSummary.igstAmount || 0)}</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cess</p>
                    <p className="text-2xl font-bold text-rose-600">{curr} {fmt(taxSummary.cessAmount || 0)}</p>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center bg-zinc-900">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Tax</p>
                    <p className="text-2xl font-bold text-white">{curr} {fmt(taxSummary.totalGst)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <Settings size={16} className="text-blue-500" /> Account Settings
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receivable Account</p>
                      <p className="text-sm font-semibold text-zinc-900 bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-mono text-xs">{ledgerAccounts.receivableAccount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Revenue Adjustment Account</p>
                      <p className="text-sm font-semibold text-zinc-900 bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-mono text-xs">{ledgerAccounts.revenueAdjustmentAccount || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gl' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {!glPosting ? (
                  <EmptyState title="Not Posted to GL" message="This Debit Note has not been posted to the general ledger yet." icon={BookOpen} />
                ) : (
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500" /> GL Journal Entry
                      </div>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-zinc-200">Ref: {glPosting.journalId || 'N/A'}</span>
                    </div>
                    <div className="p-6 text-center text-sm text-zinc-600">
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
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <FileDigit size={16} className="text-purple-500" /> Ledger Impacts
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(ledgerImpact).map(([key, value]) => (
                        <div key={key} className="bg-white border border-zinc-100 p-4 rounded-lg shadow-sm">
                           <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                           <p className="text-sm font-medium text-zinc-900">{value}</p>
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
                  <EmptyState title="No Allocations" message="This Debit Note has not been allocated to any invoices." icon={CheckSquare} />
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Applied Invoice</th>
                          <th className="px-4 py-3 text-right">Allocated Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {allocations.map((alloc, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-3 font-semibold text-blue-600 hover:underline cursor-pointer">{alloc.invoiceNo || alloc.invoiceNumber || '-'}</td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900">{curr} {fmt(alloc.allocatedAmount)}</td>
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
                 <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <Network size={16} className="text-indigo-500" /> Related Documents
                  </div>
                  <div className="p-4 flex gap-4 flex-wrap">
                    {relatedDocuments.apInvoiceId ? (
                       <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors">
                         <FileText size={16} /> Sales Invoice: <span className="font-mono text-xs">{relatedDocuments.apInvoiceId}</span>
                       </div>
                    ) : (
                      <p className="text-sm text-zinc-500 p-2">No related documents found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <CheckSquare size={16} className="text-emerald-500" /> Approval Workflow
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approval Status</p>
                      <StatusBadge status={workflow.approvalStatus} />
                    </div>
                    {workflow.approvedBy && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved By</p>
                        <p className="text-sm font-medium text-zinc-900">{workflow.approvedBy}</p>
                      </div>
                    )}
                    {workflow.approvedDate && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved Date</p>
                        <p className="text-sm font-medium text-zinc-900">{new Date(workflow.approvedDate).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                {(!attachments.supportingDocuments || attachments.supportingDocuments.length === 0) && !attachments.DebitNotePdf ? (
                 <EmptyState title="No Attachments" message="There are no files attached to this Debit Note." icon={Paperclip} />
                ) : (
                 <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <Paperclip size={16} className="text-zinc-500" /> Attached Files
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {attachments.DebitNotePdf && (
                        <div className="bg-white border border-zinc-200 p-4 rounded-lg flex items-center gap-3">
                           <FileText size={24} className="text-rose-500" />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-zinc-900 truncate">Debit Note PDF</p>
                             <p className="text-[8px] text-zinc-500">System Generated</p>
                           </div>
                           <button className="text-blue-600 hover:text-blue-700">
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
                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <History size={16} className="text-zinc-500" /> Audit Log
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Created At</p>
                      <p className="text-sm font-medium text-zinc-900">{audit.createdAt ? new Date(audit.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Created By</p>
                      <p className="text-sm font-medium text-zinc-900 font-mono text-xs truncate" title={audit.createdBy}>{audit.createdBy || 'System'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Updated At</p>
                      <p className="text-sm font-medium text-zinc-900">{audit.updatedAt ? new Date(audit.updatedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Updated By</p>
                      <p className="text-sm font-medium text-zinc-900 font-mono text-xs truncate" title={audit.updatedBy}>{audit.updatedBy || 'N/A'}</p>
                    </div>
                    {audit.approvedDate && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved Date</p>
                        <p className="text-sm font-medium text-zinc-900">{new Date(audit.approvedDate).toLocaleString()}</p>
                      </div>
                    )}
                    {audit.postingTime && (
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posted Date</p>
                        <p className="text-sm font-medium text-zinc-900">{new Date(audit.postingTime).toLocaleString()}</p>
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
        title="Edit Debit Note"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Note Date</label>
              <input
                type="date"
                required
                value={formData.noteDate}
                onChange={e => setFormData({ ...formData, noteDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Reference No</label>
              <input
                type="text"
                value={formData.referenceNo}
                onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Reason</label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[64px] resize-y"
                placeholder="Reason for Debit Note"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-6">
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

