import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Building2, Calendar, CreditCard, Banknote, HelpCircle, 
  CheckCircle, XCircle, Clock, AlertCircle, Ban, ArrowRightLeft, UploadCloud,
  Edit, Printer, Download, View, CheckSquare, ShieldAlert, BookOpen, Layers,
  RefreshCw, Lock, Unlock, Paperclip, ChevronDown, Activity, User, Network,
  RotateCcw, ChevronRight, Check
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { paymentVouchersApi } from '../../../api/account';
import { TableRowSkeleton, PageLoader } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import PaymentVoucherFormModal from '../components/PaymentVoucherFormModal';
import StatusBadge from '../../../components/common/StatusBadge';
import { useRoutePath } from "../../../hooks/useRoutePath";
import usePermission from '../../../hooks/usePermission';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const displayValue = (val) => (val === null || val === undefined || val === '') ? '-' : val;

const PostingBadge = ({ status }) => {
  if (!status) return <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full font-medium border border-zinc-200">UNPOSTED</span>;
  const s = status.toString().toUpperCase();
  if (s === 'POSTED') return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium shadow-sm border border-emerald-200">POSTED</span>;
  if (s === 'REVERSED') return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium shadow-sm border border-amber-200">REVERSED</span>;
  return <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full font-medium border border-zinc-200">{s}</span>;
};

const KPICard = ({ title, value, subtitle, colorClass, icon: Icon }) => (
  <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</h3>
      {Icon && <Icon size={16} className={colorClass} />}
    </div>
    <div>
      <p className={`text-xl font-black ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-xs font-medium text-zinc-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="p-12 text-center flex flex-col items-center bg-white rounded-xl border border-zinc-100 shadow-sm h-full justify-center">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
      <Icon size={28} className="text-zinc-400" />
    </div>
    <h3 className="text-lg font-bold text-zinc-800">{title}</h3>
    <p className="text-sm text-zinc-500 mt-1 max-w-sm">{message}</p>
  </div>
);

export default function PaymentVoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const { data: response, isLoading, error, refetch } = useApiQuery(
    paymentVouchersApi.getPaymentVoucherById,
    [id],
    null,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const v = (raw && typeof raw === 'object' && ('voucherNo' in raw || 'paymentAmount' in raw))
    ? raw
    : (raw?.data || raw);

  // Mapped Data Objects
  const vendorInfo = v?.vendorInformation || {};
  const companyInfo = v?.companyInformation || {};
  const bankInfo = v?.bankAccountInformation || {};
  const instrumentInfo = v?.paymentInstrumentDetails || {};
  const taxInfo = v?.taxInformation || {};
  const reconInfo = v?.paymentReconciliation || {};
  const wfInfo = v?.approvalWorkflow || {};
  const auditInfo = v?.auditInformation || {};
  const stats = v?.statistics || {};
  
  // Flatten Related Docs
  const relatedDocs = [];
  if (v?.relatedDocuments) {
    v.relatedDocuments.linkedPurchaseInvoices?.forEach(doc => relatedDocs.push({ type: 'Purchase Invoice', documentNo: doc }));
    v.relatedDocuments.debitNotes?.forEach(doc => relatedDocs.push({ type: 'Debit Note', documentNo: doc }));
    v.relatedDocuments.creditNotes?.forEach(doc => relatedDocs.push({ type: 'Credit Note', documentNo: doc }));
    v.relatedDocuments.journalEntries?.forEach(doc => relatedDocs.push({ type: 'Journal Entry', documentNo: doc }));
  }

  // Mutations
  const submitMutation = useApiMutation(paymentVouchersApi.submitPaymentVoucher);
  const approveMutation = useApiMutation(paymentVouchersApi.approvePaymentVoucher);
  const rejectMutation = useApiMutation(paymentVouchersApi.rejectPaymentVoucher);
  const postMutation = useApiMutation(paymentVouchersApi.postPaymentVoucher);
  const reverseMutation = useApiMutation(paymentVouchersApi.reversePaymentVoucher);
  const cancelMutation = useApiMutation(paymentVouchersApi.cancelPaymentVoucher);
  
  const canUpdate = usePermission('PAYMENT_VOUCHERS', 'UPDATE');
  const canApprove = usePermission('PAYMENT_VOUCHERS', 'APPROVE');

  const handleAction = async (actionName, mutation, confirmMsg, successMessage) => {
    if (!await confirmDialog({ 
      title: `${actionName} Payment Voucher?`, 
      message: confirmMsg,
      confirmText: actionName
    })) return;
    try {
      await mutation.mutateAsync([id]);
      dispatch(addAlert({ type: 'success', message: successMessage || `${actionName} completed successfully.` }));
      setShowMoreActions(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}` }));
    }
  };

  const handleEdit = () => {
    if (v.status !== 'DRAFT') {
      dispatch(addAlert({ type: 'warning', message: 'Only draft vouchers can be edited.' }));
      return;
    }
    setIsEditModalOpen(true);
  };

  const getDynamicActions = () => {
    const actions = [];
    const status = v?.status;
    const glStatus = v?.glPostingStatus;

    if (status === 'DRAFT') {
      if (canUpdate) {
        actions.push({ id: 'edit', label: 'Edit Voucher', icon: Edit, handler: handleEdit, color: 'text-blue-600' });
        actions.push({ 
          id: 'submit', label: 'Submit for Approval', icon: CheckCircle, 
          handler: () => handleAction('Submit', submitMutation, 'Are you sure you want to submit this voucher for approval?'), 
          color: 'text-blue-600', isLoading: submitMutation.isLoading 
        });
        actions.push({ 
          id: 'cancel', label: 'Cancel', icon: Ban, 
          handler: () => handleAction('Cancel', cancelMutation, 'Are you sure you want to cancel this voucher?'), 
          color: 'text-rose-600', isLoading: cancelMutation.isLoading 
        });
      }
    } else if (status === 'SUBMITTED') {
      if (canApprove) {
        actions.push({ 
          id: 'approve', label: 'Approve', icon: CheckCircle, 
          handler: () => handleAction('Approve', approveMutation, 'Are you sure you want to approve this payment voucher?'), 
          color: 'text-emerald-600', isLoading: approveMutation.isLoading 
        });
        actions.push({ 
          id: 'reject', label: 'Reject', icon: XCircle, 
          handler: () => handleAction('Reject', rejectMutation, 'Please confirm that you want to reject this payment voucher.', 'Payment voucher rejected.'), 
          color: 'text-rose-600', isLoading: rejectMutation.isLoading 
        });
      }
    } else if (status === 'APPROVED') {
      if (canUpdate && glStatus !== 'POSTED') {
        actions.push({ 
          id: 'post', label: 'Post', icon: Activity, 
          handler: () => handleAction('Post', postMutation, 'Once posted, the voucher will be posted to the general ledger.', 'Voucher posted successfully.'), 
          color: 'text-emerald-600', isLoading: postMutation.isLoading 
        });
      }
    }
    
    if (glStatus === 'POSTED') {
      if (canUpdate) {
        actions.push({ 
          id: 'reverse', label: 'Reverse', icon: RotateCcw, 
          handler: () => handleAction('Reverse', reverseMutation, 'This action will reverse the posted payment voucher.', 'Voucher reversed successfully.'), 
          color: 'text-amber-600', isLoading: reverseMutation.isLoading 
        });
      }
    }
    
    return actions;
  };

  const dynamicActions = getDynamicActions();
  const isAnyActionLoading = submitMutation.isLoading || approveMutation.isLoading || rejectMutation.isLoading || postMutation.isLoading || reverseMutation.isLoading || cancelMutation.isLoading;


  if (isLoading) return <PageLoader message="Loading payment voucher details..." />;
  if (error || !v) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <EmptyState 
          icon={Ban} 
          title="Payment Voucher Not Found" 
          message="The payment voucher you are looking for does not exist or you do not have permission to view it." 
        />
      </div>
    );
  }

  const curr = companyInfo.baseCurrency || 'INR';
  const total = v.paymentAmount || 0;
  const allocated = stats.totalAllocatedAmount || 0;
  const remaining = stats.remainingBalance || 0;
  
  const allocCount = stats.numberOfAllocatedInvoices || 0;
  const jeCount = stats.totalJournalEntries || 0;
  const docCount = stats.totalLinkedDocuments || 0;

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 animate-in fade-in duration-300">
      
      {/* ─── STICKY HEADER ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => navigate(buildPath('/accounts/transactions/payments'))} 
              className="p-2 mt-0.5 text-zinc-400 hover:text-zinc-800 rounded-full hover:bg-zinc-100 transition-colors -ml-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{displayValue(v.voucherNo)}</h1>
                <StatusBadge status={v.status} />
                <PostingBadge status={v.glPostingStatus} />
                {v.paymentMode && (
                  <span className="px-2 py-1 bg-zinc-100 text-zinc-700 text-[8px] font-bold uppercase tracking-wider rounded-md border border-zinc-200">
                    {v.paymentMode}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <span className="text-zinc-900">{displayValue(vendorInfo.vendorName)}</span>
                <span className="text-zinc-300">|</span>
                {displayValue(v.voucherDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Payment Amount</p>
              <p className="text-lg font-black text-zinc-900 leading-none">{curr} {fmt(total)}</p>
            </div>
            
            <button className="h-10 px-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 flex items-center gap-2 font-semibold text-sm transition-colors">
              <Printer size={16} className="text-zinc-500" /> Print
            </button>
            <button className="h-10 px-3 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 flex items-center gap-2 font-semibold text-sm transition-colors">
              <Download size={16} className="text-zinc-500" /> Export PDF
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="h-10 px-3 bg-white border border-zinc-900 text-zinc-900 rounded-lg hover:bg-zinc-50 flex items-center gap-2 font-semibold text-sm transition-colors"
              >
                More Actions <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
              </button>
              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg py-1.5 z-50">
                  {dynamicActions.length > 0 && (
                    <>
                      {dynamicActions.map(action => (
                        <button
                          key={action.id}
                          onClick={action.handler}
                          disabled={action.isLoading || isAnyActionLoading}
                          className={`w-full text-left px-4 py-2.5 text-sm ${action.color} hover:bg-zinc-50 font-medium flex items-center gap-3 transition-colors ${action.isLoading || isAnyActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <action.icon size={16} /> 
                          {action.isLoading ? `${action.label}...` : action.label}
                        </button>
                      ))}
                      <div className="h-px bg-zinc-100 my-1.5"></div>
                    </>
                  )}
                  
                  {/* Read-Only Actions always visible when applicable */}
                  <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                    <BookOpen size={16} className="text-zinc-400" /> View Vendor Ledger
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                    <Activity size={16} className="text-zinc-400" /> Bank Reconciliation
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                    <Paperclip size={16} className="text-zinc-400" /> Download Attachments
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard title="Payment Amount" value={`${curr} ${fmt(total)}`} colorClass="text-zinc-900" icon={Banknote} />
            <KPICard title="Allocated" value={`${curr} ${fmt(allocated)}`} colorClass="text-emerald-600" icon={CheckSquare} />
            <KPICard title="Remaining" value={`${curr} ${fmt(remaining)}`} colorClass={remaining > 0 ? 'text-rose-600' : 'text-emerald-600'} icon={ArrowRightLeft} />
            <KPICard title="Invoices Paid" value={allocCount} colorClass="text-zinc-900" icon={FileText} />
            <KPICard title="Journal Entries" value={jeCount} colorClass="text-zinc-900" icon={BookOpen} />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* ─── LEFT SIDEBAR (30%) ──────────────────────────────────────────────── */}
            <div className="w-full lg:w-[272px] flex-shrink-0 space-y-6">
              
              {/* Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Voucher Summary
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher No</p>
                    <p className="text-sm font-semibold text-zinc-900 font-mono bg-zinc-100 px-2 py-1 rounded inline-block border border-zinc-200">{displayValue(v.voucherNo)}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-medium text-zinc-800">{displayValue(v.voucherDate)}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendor</p>
                    <p className="text-sm font-semibold text-zinc-900">{displayValue(vendorInfo.vendorName)}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Payment Mode</p>
                    <p className="text-sm font-medium text-zinc-800">{displayValue(v.paymentMode)}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference / UTR</p>
                    <p className="text-sm font-medium text-zinc-800">{displayValue(v.referenceNo)}</p>
                  </div>
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Remarks</p>
                    <p className="text-sm font-medium text-zinc-600 bg-zinc-50 p-2.5 rounded-md border border-zinc-100 leading-relaxed">
                      {v.remarks || 'No remarks provided.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* ─── MAIN TABS (70%) ─────────────────────────────────────────────────── */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col min-h-[480px]">
              
              {/* Tabs Navigation */}
              <div className="bg-zinc-50/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 shadow-sm sticky top-0 z-10 overflow-x-auto no-scrollbar">
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 min-w-max">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'allocations', label: 'Allocations', icon: CheckSquare },
                  { id: 'bank', label: 'Bank Account', icon: Building2 },
                  { id: 'instrument', label: 'Instrument', icon: CreditCard },
                  { id: 'tax', label: 'Tax Info', icon: Activity },
                  { id: 'gl', label: 'General Ledger', icon: BookOpen },
                  { id: 'ledger', label: 'Ledger Impact', icon: Layers },
                  { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
                  { id: 'workflow', label: 'Approval', icon: CheckCircle },
                  { id: 'documents', label: 'Documents', icon: Network },
                  { id: 'attachments', label: 'Attachments', icon: Paperclip },
                  { id: 'audit', label: 'Audit Log', icon: Lock }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all shrink-0 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50'
                    }`}
                  >
                    <tab.icon size={16} className={activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-400'} />
                    {tab.label}
                    {tab.id === 'allocations' && allocCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200">{allocCount}</span>
                    )}
                  </button>
                ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 flex-1 bg-white overflow-x-auto">
                
                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Vendor Info */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
                          <User size={16} className="text-zinc-400" /> Vendor Information
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Vendor Name</p>
                              <p className="text-sm font-semibold text-zinc-900 mt-1">{displayValue(vendorInfo.vendorName)}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Vendor Code</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.vendorCode)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">GSTIN</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.gstin)}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">PAN</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.pan)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Email</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.email)}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Phone</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.phone)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Address</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(vendorInfo.address)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
                          <Building2 size={16} className="text-zinc-400" /> Company Information
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Company Name</p>
                              <p className="text-sm font-semibold text-zinc-900 mt-1">{displayValue(companyInfo.companyName)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Base Currency</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{curr}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Company GSTIN</p>
                              <p className="text-sm font-medium text-zinc-800 mt-1">{displayValue(companyInfo.companyGstin)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ALLOCATIONS TAB ── */}
                {activeTab === 'allocations' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4">Invoice Allocations</h3>
                    {v.invoiceAllocations && v.invoiceAllocations.length > 0 ? (
                      <div className="border border-zinc-200 rounded-xl overflow-x-auto min-w-0 max-w-full custom-scrollbar shadow-sm">
                        <table className="w-full min-w-[700px] text-left text-sm whitespace-nowrap" aria-label="Invoice Allocations Table">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 py-3">Invoice No</th>
                              <th scope="col" className="px-4 py-3">Date</th>
                              <th scope="col" className="px-4 py-3 text-right">Invoice Amount</th>
                              <th scope="col" className="px-4 py-3 text-right">Prev. Paid</th>
                              <th scope="col" className="px-4 py-3 text-right">Allocated Amount</th>
                              <th scope="col" className="px-4 py-3 text-right">Remaining Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {v.invoiceAllocations.map((alloc, i) => {
                              const isExpanded = expandedRows[i];
                              return (
                                <React.Fragment key={i}>
                                  <tr 
                                    onClick={() => toggleRow(i)}
                                    className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-zinc-50/50'}`}
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <button className={`p-1 rounded-md text-zinc-400 hover:text-zinc-700 transition-transform ${isExpanded ? 'rotate-90 bg-zinc-200/50' : 'hover:bg-zinc-100'}`}>
                                          <ChevronRight size={14} />
                                        </button>
                                        <span className="font-semibold text-primary">{displayValue(alloc.invoiceNumber)}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-zinc-600">{displayValue(alloc.invoiceDate)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-zinc-900">{curr} {fmt(alloc.invoiceAmount)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-zinc-600">{curr} {fmt(alloc.previouslyPaidAmount)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{curr} {fmt(alloc.allocatedAmount)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-amber-600">{curr} {fmt(alloc.remainingOutstanding)}</td>
                                  </tr>
                                  {isExpanded && (
                                    <tr className="bg-zinc-50/50">
                                      <td colSpan={6} className="p-0 border-t border-zinc-100">
                                        <div className="p-4 pl-12 animate-in slide-in-from-top-2 duration-200">
                                          <div className="bg-white border border-zinc-200 shadow-sm rounded-lg p-4">
                                            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100">
                                              Allocation Details
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                              <div>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Status</p>
                                                <p className="text-sm font-semibold text-zinc-900 mt-1">{displayValue(alloc.status)}</p>
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Due Date</p>
                                                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(alloc.dueDate)}</p>
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Total Invoice</p>
                                                <p className="text-sm font-medium text-zinc-900 mt-1">{curr} {fmt(alloc.invoiceAmount)}</p>
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Allocated Now</p>
                                                <p className="text-sm font-bold text-emerald-600 mt-1">{curr} {fmt(alloc.allocatedAmount)}</p>
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
                    ) : (
                      <EmptyState 
                        icon={Layers}
                        title="No Invoice Allocations"
                        message="This payment voucher has not been allocated against any purchase invoices yet."
                      />
                    )}
                  </div>
                )}

                {/* ── BANK TAB ── */}
                {activeTab === 'bank' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-3xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <Building2 size={20} className="text-primary" /> Bank Account Details
                    </h3>
                    {bankInfo.bankName || bankInfo.accountName ? (
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Bank Name</p>
                          <p className="text-sm font-semibold text-zinc-900 mt-1">{displayValue(bankInfo.bankName)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Name</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(bankInfo.accountName)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Number</p>
                          <p className="text-sm font-mono font-medium text-zinc-900 bg-white px-2 py-1 rounded inline-block mt-1 border border-zinc-200">
                            {displayValue(bankInfo.accountNumber)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">IFSC / Routing</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(bankInfo.ifscCode)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Branch</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(bankInfo.branch)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Type</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(bankInfo.accountType)}</p>
                        </div>
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Building2}
                        title="No Bank Details"
                        message="This voucher was not paid via a configured bank account."
                      />
                    )}
                  </div>
                )}

                {/* ── PAYMENT INSTRUMENT TAB ── */}
                {activeTab === 'instrument' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-3xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <CreditCard size={20} className="text-primary" /> Payment Instrument
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Payment Mode</p>
                        <span className="inline-block mt-1 px-2.5 py-1 bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-sm">
                          {displayValue(instrumentInfo.paymentMode || v.paymentMode)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Transaction Date</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(v.voucherDate)}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Reference No / UTR</p>
                        <p className="text-sm font-mono font-medium text-zinc-900 bg-white px-2 py-1 rounded inline-block mt-1 border border-zinc-200">
                          {displayValue(instrumentInfo.utrNumber || v.referenceNo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Gateway Reference</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(instrumentInfo.gatewayReference)}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Cheque Number</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(instrumentInfo.chequeNumber)}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Cheque Date</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(instrumentInfo.chequeDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAX TAB ── */}
                {activeTab === 'tax' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-3xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <Activity size={20} className="text-primary" /> Tax Information
                    </h3>
                    {(taxInfo.tdsDeducted > 0 || taxInfo.gstAdjustment > 0) ? (
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">TDS Deducted</p>
                          <p className="text-sm font-bold text-zinc-900 mt-1">{curr} {fmt(taxInfo.tdsDeducted || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">TDS Section</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(taxInfo.tdsSection)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">TDS Rate</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{taxInfo.tdsRate ? `${taxInfo.tdsRate}%` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">GST Adjustment</p>
                          <p className="text-sm font-medium text-zinc-900 mt-1">{curr} {fmt(taxInfo.gstAdjustment || 0)}</p>
                        </div>
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Activity}
                        title="No Tax Data"
                        message="There are no TDS or GST adjustments on this payment voucher."
                      />
                    )}
                  </div>
                )}

                {/* ── GENERAL LEDGER TAB ── */}
                {activeTab === 'gl' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <BookOpen size={20} className="text-primary" /> General Ledger Journal Entries
                    </h3>
                    {v.generalLedgerPosting && (Array.isArray(v.generalLedgerPosting) ? v.generalLedgerPosting.length > 0 : Object.keys(v.generalLedgerPosting).length > 0) ? (
                      <div className="space-y-6">
                        {/* Assuming generalLedgerPosting might be an array of journals, or handle accordingly. For now mapping array if it is one. */}
                        {[].concat(v.generalLedgerPosting || []).map((je, i) => (
                          <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-sm text-zinc-900">{je.journalNo || 'New Journal'}</span>
                                <span className="text-xs text-zinc-500 ml-3">Posted: {je.postingDate || '-'} by {je.postedBy || '-'}</span>
                              </div>
                              <span className="badge badge-success">POSTED</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-200">
                              <div className="bg-white p-4">
                                <h4 className="text-sm font-bold text-emerald-600 mb-3 uppercase tracking-wider border-b border-emerald-100 pb-2">Debit Entries</h4>
                                <table className="w-full text-left text-sm">
                                  <tbody className="divide-y divide-zinc-50">
                                    {je.lines?.filter(l => l.type === 'DEBIT').map((line, j) => (
                                      <tr key={j} className="group">
                                        <td className="py-2.5">
                                          <p className="font-medium text-zinc-900">{line.accountName}</p>
                                          <p className="text-xs text-zinc-500 font-mono mt-0.5">{line.accountCode}</p>
                                          {line.narration && <p className="text-[8px] text-zinc-400 mt-1 italic">{line.narration}</p>}
                                        </td>
                                        <td className="py-2.5 text-right font-bold text-emerald-600 align-top tabular-nums">
                                          {fmt(line.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="bg-white p-4">
                                <h4 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wider border-b border-red-100 pb-2">Credit Entries</h4>
                                <table className="w-full text-left text-sm">
                                  <tbody className="divide-y divide-zinc-50">
                                    {je.lines?.filter(l => l.type === 'CREDIT').map((line, j) => (
                                      <tr key={j} className="group">
                                        <td className="py-2.5">
                                          <p className="font-medium text-zinc-900">{line.accountName}</p>
                                          <p className="text-xs text-zinc-500 font-mono mt-0.5">{line.accountCode}</p>
                                          {line.narration && <p className="text-[8px] text-zinc-400 mt-1 italic">{line.narration}</p>}
                                        </td>
                                        <td className="py-2.5 text-right font-bold text-red-600 align-top tabular-nums">
                                          {fmt(line.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={BookOpen}
                        title="No Journal Entries"
                        message="There are no GL postings associated with this payment voucher yet. Post the voucher to generate journal entries."
                      />
                    )}
                  </div>
                )}

                {/* ── LEDGER IMPACT TAB ── */}
                {activeTab === 'ledger' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <Layers size={20} className="text-primary" /> Ledger Impact Summary
                    </h3>
                    {v.ledgerImpact ? (
                      <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100 text-sm text-zinc-600">
                        {/* Custom render if ledger impact object structure exists */}
                        <pre>{JSON.stringify(v.ledgerImpact, null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm divide-y divide-zinc-100">
                        <div className="p-4 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                          <div>
                            <p className="font-semibold text-zinc-900">Bank / Cash Ledger</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Credited</p>
                          </div>
                          <p className="font-bold text-zinc-900">{curr} {fmt(total)}</p>
                        </div>
                        <div className="p-4 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                          <div>
                            <p className="font-semibold text-zinc-900">Vendor Ledger ({vendorInfo.vendorName || '-'})</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Debited</p>
                          </div>
                          <p className="font-bold text-zinc-900">{curr} {fmt(total + (taxInfo.tdsDeducted || 0))}</p>
                        </div>
                        {(taxInfo.tdsDeducted > 0) && (
                          <div className="p-4 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                            <div>
                              <p className="font-semibold text-zinc-900">TDS Payable Ledger</p>
                              <p className="text-xs text-zinc-500 mt-0.5">Credited</p>
                            </div>
                            <p className="font-bold text-zinc-900">{curr} {fmt(taxInfo.tdsDeducted)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── RECONCILIATION TAB ── */}
                {activeTab === 'reconciliation' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <RefreshCw size={20} className="text-primary" /> Bank Reconciliation
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Reconciliation Status</p>
                        <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-md ${reconInfo.reconciliationStatus === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {reconInfo.reconciliationStatus || 'UNRECONCILED'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Reconciliation Date</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(reconInfo.bankReconciliationDate)}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Cleared Amount</p>
                        <p className="text-sm font-bold text-emerald-600 mt-1">{curr} {fmt(reconInfo.clearedAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Uncleared Amount</p>
                        <p className="text-sm font-bold text-amber-600 mt-1">{curr} {fmt(reconInfo.unclearedAmount || total)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Reconciliation Remarks</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(reconInfo.reconciliationRemarks)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── WORKFLOW TAB ── */}
                {activeTab === 'workflow' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <CheckCircle size={20} className="text-primary" /> Approval Workflow Timeline
                    </h3>
                    
                    <div className="relative pl-6 border-l-2 border-zinc-200 space-y-8 pb-4">
                      {/* Step 1: Created */}
                      <div className="relative">
                        <div className="absolute -left-[26.4px] top-1.5 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-emerald-50"></div>
                        <h4 className="font-bold text-zinc-900">Voucher Created</h4>
                        <p className="text-sm text-zinc-500 mt-1">{auditInfo.createdBy || 'System'} on {auditInfo.createdAt ? new Date(auditInfo.createdAt).toLocaleString() : '-'}</p>
                      </div>

                      {/* Step 2: Approved / Pending */}
                      <div className="relative">
                        <div className={`absolute -left-[26.4px] top-1.5 w-4 h-4 rounded-full ring-4 ${
                          v.status === 'APPROVED' || v.status === 'POSTED'
                            ? 'bg-emerald-500 ring-emerald-50' 
                            : v.status === 'REJECTED'
                              ? 'bg-red-500 ring-red-50'
                              : 'bg-zinc-300 ring-zinc-50'
                        }`}></div>
                        <h4 className="font-bold text-zinc-900">
                          {v.status === 'APPROVED' || v.status === 'POSTED' ? 'Approved' 
                            : v.status === 'REJECTED' ? 'Rejected' 
                            : 'Pending Approval'}
                        </h4>
                        {(wfInfo.approvedBy || v.status === 'APPROVED') && (
                          <p className="text-sm text-zinc-500 mt-1">
                            Action by {wfInfo.approvedBy || 'System'} on {wfInfo.approvedDate ? new Date(wfInfo.approvedDate).toLocaleString() : '-'}
                          </p>
                        )}
                        {v.status === 'DRAFT' && (
                          <p className="text-sm text-zinc-500 mt-1">Waiting for submission.</p>
                        )}
                        {wfInfo.approvalNotes && (
                          <div className="mt-2 p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-sm text-zinc-700 italic">
                            "{wfInfo.approvalNotes}"
                          </div>
                        )}
                      </div>

                      {/* Step 3: Posted */}
                      <div className="relative">
                        <div className={`absolute -left-[26.4px] top-1.5 w-4 h-4 rounded-full ring-4 ${
                          v.glPostingStatus === 'POSTED' ? 'bg-emerald-500 ring-emerald-50' : 'bg-zinc-300 ring-zinc-50'
                        }`}></div>
                        <h4 className="font-bold text-zinc-900">Posted to General Ledger</h4>
                        {v.glPostingStatus === 'POSTED' ? (
                          <p className="text-sm text-zinc-500 mt-1">Successfully posted.</p>
                        ) : (
                          <p className="text-sm text-zinc-500 mt-1">Awaiting GL posting.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DOCUMENTS TAB ── */}
                {activeTab === 'documents' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Network size={20} className="text-primary" /> Related Documents
                    </h3>
                    {relatedDocs.length > 0 ? (
                      <div className="border border-zinc-200 rounded-xl overflow-x-auto min-w-0 max-w-full custom-scrollbar shadow-sm">
                        <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Related Documents Table">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 py-3">Document Type</th>
                              <th scope="col" className="px-4 py-3">Document Number / ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {relatedDocs.map((doc, i) => (
                              <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-zinc-600">{doc.type || '-'}</td>
                                <td className="px-4 py-3 font-semibold text-primary cursor-pointer hover:underline font-mono text-xs">{doc.documentNo || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Network}
                        title="No Related Documents"
                        message="There are no other related documents (like Debit Notes or Credit Notes) linked to this voucher."
                      />
                    )}
                  </div>
                )}

                {/* ── ATTACHMENTS TAB ── */}
                {activeTab === 'attachments' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Paperclip size={20} className="text-primary" /> Attachments
                      </h3>
                      <button className="h-8 px-3 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-md shadow-sm hover:bg-zinc-50 flex items-center gap-1.5 transition-colors">
                        <UploadCloud size={14} /> Upload File
                      </button>
                    </div>
                    
                    {v.attachments && v.attachments.length > 0 ? (
                      <div className="border border-zinc-200 rounded-xl overflow-x-auto min-w-0 max-w-full custom-scrollbar shadow-sm">
                        <table className="w-full min-w-[500px] text-left text-sm whitespace-nowrap" aria-label="Attachments Table">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 py-3">Document Type</th>
                              <th scope="col" className="px-4 py-3">File Name</th>
                              <th scope="col" className="px-4 py-3">Uploaded At</th>
                              <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {v.attachments.map((att, i) => (
                              <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                                <td className="px-4 py-3 font-medium text-zinc-600">{att.type || 'Document'}</td>
                                <td className="px-4 py-3 text-zinc-900 flex items-center gap-2">
                                  <FileText size={14} className="text-zinc-400" />
                                  {att.fileName || '-'}
                                </td>
                                <td className="px-4 py-3 text-zinc-500">{att.uploadedAt ? new Date(att.uploadedAt).toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 text-right">
                                  <button className="p-1.5 text-zinc-400 hover:text-blue-600 rounded transition-colors" title="Preview">
                                    <View size={16} />
                                  </button>
                                  <button className="p-1.5 text-zinc-400 hover:text-blue-600 rounded transition-colors" title="Download">
                                    <Download size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Paperclip}
                        title="No Attachments"
                        message="There are no files attached to this payment voucher."
                      />
                    )}
                  </div>
                )}

                {/* ── AUDIT TAB ── */}
                {activeTab === 'audit' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
                      <Lock size={20} className="text-primary" /> System Audit Log
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Record ID</p>
                        <p className="text-sm font-mono text-zinc-500 mt-1">{v.voucherId}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Company ID</p>
                        <p className="text-sm font-mono text-zinc-500 mt-1">{companyInfo.companyId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Created By</p>
                        <p className="text-sm font-semibold text-zinc-900 mt-1 flex items-center gap-2">
                          <User size={14} className="text-zinc-400" /> {auditInfo.createdBy || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Created At</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-2">
                          <Clock size={14} className="text-zinc-400" /> {auditInfo.createdAt ? new Date(auditInfo.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Last Updated By</p>
                        <p className="text-sm font-semibold text-zinc-900 mt-1 flex items-center gap-2">
                          <User size={14} className="text-zinc-400" /> {auditInfo.updatedBy || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Last Updated At</p>
                        <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-2">
                          <Clock size={14} className="text-zinc-400" /> {auditInfo.updatedAt ? new Date(auditInfo.updatedAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-zinc-200/60">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Deleted Status</p>
                        <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-md ${auditInfo.isDeleted ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {auditInfo.isDeleted ? 'DELETED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <PaymentVoucherFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          initialData={v}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
