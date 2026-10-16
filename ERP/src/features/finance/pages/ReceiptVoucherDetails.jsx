import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { receiptVouchersApi } from '../../../api/account';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, Edit, Download, Printer, 
  Mail, Share2, DollarSign, Activity, Calendar, User, Building2,
  FileCheck, ShieldAlert, History, Paperclip, BarChart2, Layers,
  CornerUpLeft, SearchX, Link, Search, MoreVertical
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import usePermission from '../../../hooks/usePermission';
import RequirePermission from '../../../components/common/RequirePermission';
import ReceiptWorkflowActions from '../components/ReceiptWorkflowActions';
import { useRoutePath } from "../../../hooks/useRoutePath";

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'tax', label: 'Tax Information' },
  { id: 'general-ledger', label: 'General Ledger' },
  { id: 'ledger-impact', label: 'Ledger Impact' },
  { id: 'reconciliation', label: 'Reconciliation' },
  { id: 'related-docs', label: 'Related Documents' },
  { id: 'approval', label: 'Approval Workflow' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'audit', label: 'Audit Log' }
];

export default function ReceiptVoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  
  const canRead = usePermission('RECEIPTS', 'READ');
  const canUpdate = usePermission('RECEIPTS', 'UPDATE');
  const canDelete = usePermission('RECEIPTS', 'DELETE');
  const canApprove = usePermission('RECEIPTS', 'APPROVE');
  const canPost = usePermission('RECEIPTS', 'POST');

  const { data: apiData, isLoading, isError, error, refetch } = useApiQuery(
    receiptVouchersApi.getReceiptById,
    [id],
    null,
    { enabled: !!id }
  );

  const handleAction = async (actionName, mutationFn) => {
    try {
      const result = await mutationFn(id);
      dispatch(addAlert({ type: 'success', message: result?.message || `Receipt ${actionName.toLowerCase()} successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || `Failed to ${actionName.toLowerCase()}` }));
    }
  };

  const renderEmptyState = (title, message) => (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 min-h-[240px]">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <SearchX className="text-zinc-400" size={24} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse bg-zinc-50/50 min-h-screen">
        <div className="h-20 bg-zinc-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-200 rounded-xl"></div>)}
        </div>
        <div className="flex gap-6">
          <div className="w-[30%] h-96 bg-zinc-200 rounded-xl"></div>
          <div className="w-[70%] h-96 bg-zinc-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !apiData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] bg-zinc-50/50">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Receipt Not Found</h2>
        <p className="text-sm text-zinc-500 mb-4">{error?.message || 'The requested Receipt Voucher could not be found.'}</p>
        <button onClick={() => navigate(buildPath('/accounts/transactions/receipts'))} className="btn-secondary">
          Back to Receipts
        </button>
      </div>
    );
  }

  // The backend might return the data wrapped in { data: ... } or just the object
  const receipt = apiData?.data || apiData || {};
  const ccy = receipt.companyInformation?.baseCurrency || 'INR';

  const getStatusColor = (status) => {
    switch (status) {
      case 'POSTED':
      case 'CLEARED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DRAFT': return 'bg-zinc-50 text-zinc-600 border-zinc-200';
      case 'CANCELLED':
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REVERSED': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };
  
  const isFullyAllocated = receipt.statistics?.remainingBalance === 0 && receipt.statistics?.totalAllocatedAmount > 0;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      
      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(buildPath('/accounts/transactions/receipts'))}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <DollarSign size={20} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 leading-none">{receipt.receiptNo || 'New Receipt'}</h1>
              <span className={`px-2 py-0.5 text-[8px] font-bold rounded-md border ${getStatusColor(receipt.receiptStatus)}`}>
                {receipt.receiptStatus}
              </span>
              {receipt.glPostingStatus && (
                <span className="px-2 py-0.5 text-[8px] font-bold rounded-md bg-zinc-50 text-zinc-600 border border-zinc-200 uppercase">
                  GL: {receipt.glPostingStatus}
                </span>
              )}
              {isFullyAllocated && (
                <span className="px-2 py-0.5 text-[8px] font-bold rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                  ALLOCATED
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 font-medium">
              <span>{receipt.customerInformation?.customerName}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
              <span>Date: {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : '-'}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
              <span>Mode: {receipt.paymentMode || '-'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* More Actions Dropdown */}
          <div className="relative group">
            <button className="h-9 px-3 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
              More Actions <MoreVertical size={14} className="text-zinc-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="p-1">
                {canRead && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); window.print(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left">
                      <Printer size={14} /> Print Receipt
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); alert('Export PDF coming soon'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left">
                      <Download size={14} /> Export PDF
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); alert('Email coming soon'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left">
                      <Mail size={14} /> Email Receipt
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); alert('Share coming soon'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left">
                      <Share2 size={14} /> Share Receipt
                    </button>
                    <div className="h-px bg-zinc-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); setActiveTab('customer-ledger'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left">
                      <User size={14} /> View Customer Ledger
                    </button>
                    <div className="h-px bg-zinc-100 my-1"></div>
                  </>
                )}
                
                {/* Workflow actions in dropdown */}
                <ReceiptWorkflowActions
                  receiptId={id}
                  receiptStatus={receipt.receiptStatus}
                  onActionComplete={refetch}
                  variant="dropdown"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        
        {/* 2. Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Receipt Amount</span>
            <span className="text-lg font-bold text-emerald-600">{ccy} {receipt.receiptAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Allocated Amount</span>
            <span className="text-lg font-bold text-zinc-700">{ccy} {receipt.statistics?.totalAllocatedAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</span>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Remaining Balance</span>
            <span className={`text-lg font-bold ${receipt.statistics?.remainingBalance > 0 ? 'text-orange-500' : 'text-zinc-400'}`}>
              {ccy} {receipt.statistics?.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Invoices Allocated</span>
            <span className="text-lg font-bold text-blue-600">
              {receipt.statistics?.numberOfAllocatedInvoices || 0}
            </span>
          </div>
        </div>

        {/* 3. Layout (30/70) */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar (30%) */}
          <div className="w-full lg:w-[30%] space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-emerald-500" />
                  Receipt Summary
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">Receipt No</span>
                  <span className="text-sm font-semibold text-zinc-900">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">Customer</span>
                  <span className="text-sm font-semibold text-zinc-900 text-right">{receipt.customerInformation?.customerName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">Receipt Date</span>
                  <span className="text-sm font-medium text-zinc-800">{receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">Payment Mode</span>
                  <span className="text-sm font-medium text-zinc-800">{receipt.paymentMode || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">Status</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(receipt.receiptStatus)}`}>{receipt.receiptStatus}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">GL Status</span>
                  <span className="text-sm font-medium text-zinc-800">{receipt.glPostingStatus || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-medium">Ref Number</span>
                  <span className="text-sm font-medium text-zinc-800">{receipt.referenceNo || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2 text-sm">
                  <Activity size={16} className="text-blue-500" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-1">
                  {canRead && (
                    <>
                      <button onClick={() => window.print()} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors w-full text-left">
                        <Download size={15} className="text-zinc-400" /> Export PDF
                      </button>
                      <button onClick={() => alert('Email functionality coming soon')} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors w-full text-left">
                        <Mail size={15} className="text-zinc-400" /> Email Receipt
                      </button>
                      <button onClick={() => navigate(buildPath('/accounts/masters/customers'))} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors w-full text-left">
                        <User size={15} className="text-zinc-400" /> View Customer Ledger
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2 text-sm">
                  <BarChart2 size={16} className="text-purple-500" />
                  Statistics
                </h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-lg p-3 text-center border border-zinc-100">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase">Journal Entries</p>
                  <p className="text-lg font-bold text-zinc-800">{receipt.statistics?.totalJournalEntries || 0}</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 text-center border border-zinc-100">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase">Linked Docs</p>
                  <p className="text-lg font-bold text-zinc-800">{receipt.statistics?.totalLinkedDocuments || 0}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[480px]">
              
              {/* Sticky Tabs */}
              <div className="bg-zinc-50/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 shadow-sm sticky top-0 z-10 overflow-x-auto no-scrollbar">
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 min-w-max">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all shrink-0 whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                          : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 overflow-y-auto bg-zinc-50/30 flex-1">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText size={14} /> Receipt Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Receipt Number</p>
                          <p className="text-sm font-semibold text-zinc-900">{receipt.receiptNo || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Receipt Date</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Receipt Amount</p>
                          <p className="text-sm font-semibold text-emerald-600">{ccy} {receipt.receiptAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Payment Mode</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.paymentMode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Reference No</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.referenceNo || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Transaction Ref</p>
                          <p className="text-sm font-medium text-zinc-800 break-all">{receipt.transactionReference || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Remarks</p>
                          <p className="text-sm text-zinc-700">{receipt.remarks || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Building2 size={14} /> Bank & Instrument Details
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                        <div className="col-span-2">
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Bank Name</p>
                          <p className="text-sm font-semibold text-zinc-900">{receipt.bankAccountInformation?.bankName || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Bank Account / Branch</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.bankAccountInformation?.bankAccount || '-'} {receipt.bankAccountInformation?.branch ? `(${receipt.bankAccountInformation.branch})` : ''}</p>
                        </div>
                        {receipt.receiptInstrumentDetails && (
                          <>
                            <div>
                              <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Instrument No</p>
                              <p className="text-sm font-medium text-zinc-800">{receipt.receiptInstrumentDetails.instrumentNumber || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Instrument Date</p>
                              <p className="text-sm font-medium text-zinc-800">{receipt.receiptInstrumentDetails.instrumentDate ? new Date(receipt.receiptInstrumentDetails.instrumentDate).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Drawn On Bank</p>
                              <p className="text-sm font-medium text-zinc-800">{receipt.receiptInstrumentDetails.drawnOnBank || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Clearing Date</p>
                              <p className="text-sm font-medium text-zinc-800">{receipt.receiptInstrumentDetails.clearingDate ? new Date(receipt.receiptInstrumentDetails.clearingDate).toLocaleDateString() : '-'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={14} /> Customer Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                        <div className="col-span-2">
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Customer Name</p>
                          <p className="text-sm font-semibold text-zinc-900">{receipt.customerInformation?.customerName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Customer Code</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.customerInformation?.customerCode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">GSTIN</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.customerInformation?.gstin || '-'}</p>
                        </div>
                        <div className="col-span-4">
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Receivable Account</p>
                          <p className="text-sm font-medium text-zinc-800 break-all">{receipt.customerInformation?.receivableAccount || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 2. ALLOCATIONS TAB */}
                {activeTab === 'allocations' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {receipt.invoiceAllocations?.length > 0 ? (
                      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-x-auto min-w-0 max-w-full custom-scrollbar">
                        <table className="w-full min-w-[720px] sm:min-w-full text-left text-sm whitespace-nowrap" aria-label="Invoice Allocations Table">
                          <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Invoice Number</th>
                              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Invoice Date</th>
                              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Due Date</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-zinc-600">Invoice Amount</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-zinc-600">Previously Received</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-zinc-600">Allocated Amount</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-zinc-600">Remaining</th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-zinc-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {receipt.invoiceAllocations.map((alloc, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline">{alloc.invoiceNumber || '-'}</td>
                                <td className="px-4 py-3 text-zinc-600">{alloc.invoiceDate ? new Date(alloc.invoiceDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-zinc-600">{alloc.dueDate ? new Date(alloc.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-right text-zinc-600 tabular-nums">{alloc.invoiceAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-4 py-3 text-right text-zinc-600 tabular-nums">{alloc.previouslyReceivedAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{alloc.allocatedAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-4 py-3 text-right font-medium text-orange-500 tabular-nums">{alloc.remainingOutstanding?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${
                                    alloc.allocationStatus === 'FULLY_ALLOCATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>{alloc.allocationStatus}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : renderEmptyState('No Allocations', 'This receipt voucher has not been allocated to any invoices.')}
                  </div>
                )}
                
                {/* 3. TAX INFORMATION TAB */}
                {activeTab === 'tax' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {receipt.taxInformation ? (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase mb-1">TDS Amount</p>
                            <p className="text-lg font-bold text-rose-600">{ccy} {receipt.taxInformation.tdsAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase mb-1">TDS Section</p>
                            <p className="text-lg font-bold text-zinc-700">{receipt.taxInformation.tdsSection || '-'}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase mb-1">TDS Percentage</p>
                            <p className="text-lg font-bold text-zinc-700">{receipt.taxInformation.tdsPercentage || '0'}%</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase mb-1">Exchange Gain/Loss</p>
                            <p className="text-lg font-bold text-zinc-700">{ccy} {receipt.taxInformation.exchangeGainLossAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</p>
                          </div>
                       </div>
                    ) : renderEmptyState('No Tax Data', 'No tax deductions or exchange variations apply to this receipt.')}
                  </div>
                )}
                
                {/* 4. GENERAL LEDGER TAB */}
                {activeTab === 'general-ledger' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {receipt.generalLedgerPosting ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Journal Number</p>
                            <p className="text-sm font-semibold text-zinc-900">{receipt.generalLedgerPosting.journalNumber || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Reverse Journal</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.generalLedgerPosting.reverseJournalEntryId || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Posting Status</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.generalLedgerPosting.postingStatus || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Posting Date</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.generalLedgerPosting.postingDate ? new Date(receipt.generalLedgerPosting.postingDate).toLocaleString() : '-'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Debit Entries</h4>
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                              <ul className="divide-y divide-zinc-100 max-h-[240px] overflow-y-auto">
                                {(receipt.generalLedgerPosting.debitEntries || []).length > 0 ? (
                                  receipt.generalLedgerPosting.debitEntries.map((entry, idx) => (
                                    <li key={idx} className="p-3 text-sm text-zinc-700">{entry}</li>
                                  ))
                                ) : (
                                  <li className="p-4 text-sm text-zinc-500 text-center">No debit entries</li>
                                )}
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Credit Entries</h4>
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                              <ul className="divide-y divide-zinc-100 max-h-[240px] overflow-y-auto">
                                {(receipt.generalLedgerPosting.creditEntries || []).length > 0 ? (
                                  receipt.generalLedgerPosting.creditEntries.map((entry, idx) => (
                                    <li key={idx} className="p-3 text-sm text-zinc-700">{entry}</li>
                                  ))
                                ) : (
                                  <li className="p-4 text-sm text-zinc-500 text-center">No credit entries</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : renderEmptyState('No GL Data', 'General Ledger posting details are not available yet.')}
                  </div>
                )}
                
                {/* 5. LEDGER IMPACT TAB */}
                {activeTab === 'ledger-impact' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {receipt.ledgerImpact ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Layers size={18} /></div>
                          <div>
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase">Receivable Ledger</p>
                            <p className="text-sm font-semibold text-zinc-900 mt-1 break-all">{receipt.ledgerImpact.receivableLedger || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Layers size={18} /></div>
                          <div>
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase">Bank/Cash Ledger</p>
                            <p className="text-sm font-semibold text-zinc-900 mt-1 break-all">{receipt.ledgerImpact.bankCashLedger || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600"><Layers size={18} /></div>
                          <div>
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase">TDS Ledger</p>
                            <p className="text-sm font-semibold text-zinc-900 mt-1 break-all">{receipt.ledgerImpact.tdsLedger || '-'}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"><Layers size={18} /></div>
                          <div>
                            <p className="text-[8.8px] font-bold text-zinc-500 uppercase">Exchange Gain/Loss Ledger</p>
                            <p className="text-sm font-semibold text-zinc-900 mt-1 break-all">{receipt.ledgerImpact.exchangeGainLossLedger || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ) : renderEmptyState('No Impact Data', 'Ledger impact details are not available.')}
                  </div>
                )}
                
                {/* 6. RECONCILIATION TAB */}
                {activeTab === 'reconciliation' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {receipt.receiptReconciliation ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Reconciliation Status</p>
                          <p className="text-sm font-semibold text-zinc-900">{receipt.receiptReconciliation.reconciliationStatus || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Cleared Date</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.receiptReconciliation.clearedDate ? new Date(receipt.receiptReconciliation.clearedDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Bank Statement Ref</p>
                          <p className="text-sm font-medium text-zinc-800">{receipt.receiptReconciliation.bankStatementReference || '-'}</p>
                        </div>
                      </div>
                    ) : renderEmptyState('No Reconciliation', 'This receipt has not been reconciled with the bank statement.')}
                  </div>
                )}
                
                {/* 7. RELATED DOCUMENTS TAB */}
                {activeTab === 'related-docs' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {receipt.relatedDocuments ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4"><Link size={14} className="inline mr-1" /> Sales Invoices</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                            <ul className="divide-y divide-zinc-100 max-h-[240px] overflow-y-auto">
                              {(receipt.relatedDocuments.linkedSalesInvoices || []).length > 0 ? (
                                receipt.relatedDocuments.linkedSalesInvoices.map((doc, idx) => (
                                  <li key={idx} className="p-3 text-sm text-blue-600 hover:bg-zinc-50 cursor-pointer">{doc}</li>
                                ))
                              ) : (
                                <li className="p-4 text-sm text-zinc-500 text-center">No linked sales invoices</li>
                              )}
                            </ul>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4"><Link size={14} className="inline mr-1" /> Other Documents</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                            <ul className="divide-y divide-zinc-100 max-h-[240px] overflow-y-auto">
                              {(receipt.relatedDocuments.creditNotes || []).length > 0 && receipt.relatedDocuments.creditNotes.map((doc, idx) => (
                                <li key={`cn-${idx}`} className="p-3 text-sm text-blue-600 hover:bg-zinc-50 cursor-pointer">[Credit Note] {doc}</li>
                              ))}
                              {(receipt.relatedDocuments.debitNotes || []).length > 0 && receipt.relatedDocuments.debitNotes.map((doc, idx) => (
                                <li key={`dn-${idx}`} className="p-3 text-sm text-blue-600 hover:bg-zinc-50 cursor-pointer">[Debit Note] {doc}</li>
                              ))}
                              {(!(receipt.relatedDocuments.creditNotes?.length > 0) && !(receipt.relatedDocuments.debitNotes?.length > 0)) && (
                                <li className="p-4 text-sm text-zinc-500 text-center">No other linked documents</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : renderEmptyState('No Related Documents', 'There are no related documents linked to this receipt.')}
                  </div>
                )}
                
                {/* 8. APPROVAL WORKFLOW TAB */}
                {activeTab === 'approval' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {receipt.approvalWorkflow ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Approval Status</p>
                            <p className="text-sm font-semibold text-zinc-900">{receipt.approvalWorkflow.approvalStatus || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Approved Date</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.approvalWorkflow.approvedDate ? new Date(receipt.approvalWorkflow.approvedDate).toLocaleString() : '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Approved By</p>
                            <p className="text-sm font-medium text-zinc-800 break-all">{receipt.approvalWorkflow.approvedBy || '-'}</p>
                          </div>
                          <div className="col-span-4">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1">Approval Notes</p>
                            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{receipt.approvalWorkflow.approvalNotes || '-'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <History size={14} /> Workflow Timeline
                          </h4>
                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                            <div className="relative border-l border-zinc-200 ml-3 space-y-6">
                              {(receipt.approvalWorkflow.workflowHistory || []).length > 0 ? (
                                receipt.approvalWorkflow.workflowHistory.map((history, idx) => (
                                  <div key={idx} className="relative pl-6">
                                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                                    <p className="text-sm text-zinc-700">{history}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-zinc-500 pl-6">No workflow history recorded.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : renderEmptyState('No Workflow', 'No approval workflow data exists for this receipt.')}
                  </div>
                )}
                
                {/* 9. ATTACHMENTS TAB */}
                {activeTab === 'attachments' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {receipt.attachments ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={14} /> System Documents
                          </h4>
                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><FileText size={20} /></div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900">Receipt PDF</p>
                                  <p className="text-xs text-zinc-500">System generated receipt copy</p>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Preview"><Search size={16} /></button>
                                <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Download"><Download size={16} /></button>
                              </div>
                            </div>
                            
                            {receipt.attachments.depositSlip && (
                              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><FileText size={20} /></div>
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900">Deposit Slip</p>
                                    <p className="text-xs text-zinc-500">Bank deposit slip</p>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Preview"><Search size={16} /></button>
                                  <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Download"><Download size={16} /></button>
                                </div>
                              </div>
                            )}
                            
                            {receipt.attachments.chequeScan && (
                              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><FileText size={20} /></div>
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900">Cheque Scan</p>
                                    <p className="text-xs text-zinc-500">Scanned instrument image</p>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Preview"><Search size={16} /></button>
                                  <button className="p-2 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Download"><Download size={16} /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Paperclip size={14} /> Supporting Documents
                          </h4>
                          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                            <ul className="divide-y divide-zinc-100 max-h-[240px] overflow-y-auto">
                              {(receipt.attachments.supportingDocuments || []).length > 0 ? (
                                receipt.attachments.supportingDocuments.map((doc, idx) => (
                                  <li key={idx} className="p-3 text-sm text-blue-600 hover:bg-zinc-50 cursor-pointer flex items-center gap-2">
                                    <Paperclip size={14} className="text-zinc-400" /> {doc}
                                  </li>
                                ))
                              ) : (
                                <li className="p-6 flex flex-col items-center justify-center text-center">
                                  <Paperclip size={24} className="text-zinc-300 mb-2" />
                                  <p className="text-sm text-zinc-500">No supporting documents attached</p>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : renderEmptyState('No Attachments', 'There are no documents attached to this receipt.')}
                  </div>
                )}
                
                {/* 10. AUDIT LOG TAB */}
                {activeTab === 'audit' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    {receipt.auditInformation ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-5 rounded-xl border border-zinc-100 shadow-sm">
                          <div className="col-span-2">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1 flex items-center gap-1"><User size={12}/> Created By</p>
                            <p className="text-sm font-semibold text-zinc-900 break-all">{receipt.auditInformation.createdBy || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1 flex items-center gap-1"><Calendar size={12}/> Created At</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.auditInformation.createdAt ? new Date(receipt.auditInformation.createdAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1 flex items-center gap-1"><User size={12}/> Updated By</p>
                            <p className="text-sm font-semibold text-zinc-900 break-all">{receipt.auditInformation.updatedBy || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[8.8px] text-zinc-500 font-medium mb-1 flex items-center gap-1"><Calendar size={12}/> Updated At</p>
                            <p className="text-sm font-medium text-zinc-800">{receipt.auditInformation.updatedAt ? new Date(receipt.auditInformation.updatedAt).toLocaleString() : '-'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} /> Document Permissions
                          </h4>
                          <div className="bg-white p-5 rounded-xl border border-zinc-100 shadow-sm flex flex-wrap gap-4">
                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${receipt.auditInformation.editable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                              {receipt.auditInformation.editable ? <CheckCircle size={14}/> : <XCircle size={14}/>} Editable
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${receipt.auditInformation.deletable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                              {receipt.auditInformation.deletable ? <CheckCircle size={14}/> : <XCircle size={14}/>} Deletable
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${receipt.auditInformation.approvable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                              {receipt.auditInformation.approvable ? <CheckCircle size={14}/> : <XCircle size={14}/>} Approvable
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${receipt.auditInformation.postable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                              {receipt.auditInformation.postable ? <CheckCircle size={14}/> : <XCircle size={14}/>} Postable
                            </div>
                          </div>
                        </div>
                      </>
                    ) : renderEmptyState('No Audit Data', 'Audit information is not available for this receipt.')}
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
