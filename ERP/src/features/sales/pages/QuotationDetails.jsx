import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Download, Share2, FileText, ShoppingCart,
  Package, LayoutList, History, CheckCircle, Percent, Mail, Building2,
  DollarSign, CheckSquare, ChevronDown, BookOpen, Truck, QrCode,
  Paperclip, User, XCircle, Eye, ChevronRight, Send, Check
} from 'lucide-react';
import { 
  useGetQuotationByIdQuery, 
  useLazyGetQuotationPdfQuery,
  useSendQuotationMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
  useCancelQuotationMutation 
} from '../../../api/sales-crm/sales.api';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import StatusBadge from '../../../components/common/StatusBadge';
import { useRBAC } from '../../../utils/rbac';

import PIConversionFormModal from '../components/PIConversionFormModal';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function QuotationDetails() {
  const { id: paramId, quotationId: routeQuotationId } = useParams();
  const quotationId = routeQuotationId || paramId;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const { canEdit, canApprove } = useRBAC();

  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showPiModal, setShowPiModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const { data: response, isLoading, error, refetch } = useGetQuotationByIdQuery({ id: quotationId, companyId }, { skip: !quotationId });
  const [sendQuotation, { isLoading: isSending }] = useSendQuotationMutation();
  const [acceptQuotation, { isLoading: isAccepting }] = useAcceptQuotationMutation();
  const [rejectQuotation, { isLoading: isRejecting }] = useRejectQuotationMutation();
  const [cancelQuotation, { isLoading: isCanceling }] = useCancelQuotationMutation();
  
  const isUpdating = isSending || isAccepting || isRejecting || isCanceling;

  const raw = response?.data?.data || response?.data || response;
  const quotation = (raw && typeof raw === 'object' && ('quotationNumber' in raw || 'customerInformation' in raw))
    ? raw
    : (raw?.data || raw);

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const [downloadPdf, { isLoading: isDownloadingPdf }] = useLazyGetQuotationPdfQuery();

  const handleSend = async () => {
    try {
      await sendQuotation({ id: quotationId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Quotation marked as SENT and emailed successfully' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to email quotation' }));
    }
    setShowMoreActions(false);
  };

  const handleAccept = async () => {
    try {
      await acceptQuotation({ id: quotationId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Quotation marked as ACCEPTED' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to accept quotation' }));
    }
  };

  const handleReject = async () => {
    try {
      await rejectQuotation({ id: quotationId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Quotation marked as REJECTED' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to reject quotation' }));
    }
    setShowMoreActions(false);
  };

  const handleCancel = async () => {
    try {
      await cancelQuotation({ id: quotationId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Quotation marked as CANCELLED' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to cancel quotation' }));
    }
    setShowMoreActions(false);
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await downloadPdf({ id: quotationId, companyId }).unwrap();
      const blob = response instanceof Blob ? response : new Blob([response?.data || response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales_Quotation_${quotation?.quotationNumber || quotationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to download PDF' }));
    }
    setShowMoreActions(false);
  };



  if (isLoading) return <PageLoader message="Loading Quotation details..." />;

  if (error || !quotation) {
    return (
      <ErrorState
        title="Quotation Not Found"
        message={error?.message || "The requested quotation could not be found."}
        onRetry={refetch}
      />
    );
  }

  const curr = quotation.currency || quotation.quotationCurrency || 'INR';
  const c = quotation.companyInformation || quotation.company || {};
  const cust = quotation.customerInformation || quotation.customer || {};
  const lineItems = quotation.lineItems || quotation.items || [];
  const taxSummary = quotation.taxSummary || {};
  const amtSummary = quotation.amountSummary || {};
  const terms = quotation.termsAndConditions || {};
  const approval = quotation.approvalWorkflow || {};
  const stats = quotation.statistics || {};
  const deliveryInfo = quotation.deliveryInformation || {};
  const billingInfo = quotation.billingInformation || {};

  const totalAmount = amtSummary.totalAmount ?? 0;
  const taxableAmount = taxSummary.taxableAmount ?? amtSummary.subtotal ?? 0;
  const totalTax = taxSummary.totalTax ?? 0;
  
  // Calculate days validity
  let validityDays = 0;
  if (quotation.quotationDate && quotation.validUntil) {
     const start = new Date(quotation.quotationDate);
     const end = new Date(quotation.validUntil);
     validityDays = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'items', label: 'Line Items', icon: <ShoppingCart size={16} /> },
    { id: 'tax', label: 'Tax Summary', icon: <Percent size={16} /> },
    { id: 'approval', label: 'Approval Workflow', icon: <CheckSquare size={16} /> },
  ];

  const isEmpty = (arr) => !arr || arr.length === 0;

  const renderOptionalText = (val) => {
     if (typeof val === 'string' || typeof val === 'number') return val;
     if (val && typeof val === 'object') return JSON.stringify(val);
     return '';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {quotation.quotationNumber}
              </h1>
              <StatusBadge status={quotation.status} />
              <span className="text-sm font-medium text-zinc-500">
                {cust.customerName || cust.companyName}
              </span>
              <span className="text-sm text-zinc-400">
                ({quotation.quotationDate} &mdash; Valid Until: {quotation.validUntil})
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> <span className="hidden sm:inline">{isDownloadingPdf ? 'Downloading...' : 'Export PDF'}</span>
          </button>
          
          {quotation.status === 'DRAFT' && canEdit() && (
            <button onClick={handleSend} disabled={isUpdating} className="btn-secondary flex items-center gap-2">
              <Send size={16} /> Mark as Sent
            </button>
          )}
          {quotation.status === 'SENT' && canApprove() && (
            <button onClick={handleAccept} disabled={isUpdating} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check size={16} /> Mark Accepted
            </button>
          )}
          {quotation.status === 'ACCEPTED' && (
            <button onClick={() => setShowPiModal(true)} disabled={isUpdating} className="btn-primary flex items-center gap-2">
              <FileText size={16} /> Create PI
            </button>
          )}

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
                  <Printer size={14} className="text-zinc-400" /> Print Quotation
                </button>
                <button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                  <Download size={14} className="text-zinc-400" /> Download PDF
                </button>
                {quotation.status === 'DRAFT' && canEdit() && (
                  <button onClick={handleSend} disabled={isUpdating} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-medium">
                    <Mail size={14} className="text-zinc-400" /> Email & Send
                  </button>
                )}
                {quotation.status === 'SENT' && canApprove() && (
                  <button onClick={handleReject} disabled={isUpdating} className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium">
                    <XCircle size={14} className="text-rose-400" /> Reject Quotation
                  </button>
                )}
                {quotation.status !== 'CANCELLED' && quotation.status !== 'ACCEPTED' && (
                  <button onClick={handleCancel} disabled={isUpdating} className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-zinc-100">
                    <XCircle size={14} className="text-rose-500" /> Cancel Quotation
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="p-4 sm:p-6 bg-white border-b border-zinc-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Grand Total</p>
            <p className="text-sm sm:text-base font-black text-zinc-900">{curr} {fmt(totalAmount)}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Taxable Amount</p>
            <p className="text-sm sm:text-base font-black text-zinc-900">{curr} {fmt(taxableAmount)}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Tax</p>
            <p className="text-sm sm:text-base font-black text-zinc-900">{curr} {fmt(totalTax)}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Validity</p>
            <p className="text-sm sm:text-base font-black text-amber-700">{validityDays} Days</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Count</p>
            <p className="text-sm sm:text-base font-black text-zinc-900">{stats.itemCount || lineItems.length}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Conversion %</p>
            <p className="text-sm sm:text-base font-black text-emerald-700">{quotation.status === 'ACCEPTED' ? '100%' : '0%'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-zinc-200 bg-white overflow-y-auto hidden lg:block">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Quotation Summary</h3>
              <dl className="space-y-4">
                {[
                  ['Quotation No', quotation.quotationNumber],
                  ['Customer', cust.customerName || cust.companyName],
                  ['Status', <StatusBadge key="sb1" status={quotation.status} />],
                  ['Currency', curr],
                  ['Exchange Rate', quotation.exchangeRate || 1],
                  ['Reference Number', quotation.referenceNumber],
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
                  { icon: <Printer size={16} className="text-zinc-400" />, label: 'Print Quotation', onClick: () => window.print() },
                  { icon: <Download size={16} className="text-zinc-400" />, label: 'Download PDF', onClick: () => window.print() },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick} className="w-full flex items-center justify-between p-2.5 text-sm font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors">
                    <span className="flex items-center gap-2">{icon}{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50">
          <div className="sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-sm p-1.5 border-b border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all shrink-0 whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50'
                    }`}
                >
                  <span className={activeTab === tab.id ? "text-zinc-900" : "text-zinc-400"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Quotation Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      ['Quotation Number', quotation.quotationNumber],
                      ['Quotation Date', quotation.quotationDate],
                      ['Valid Until', quotation.validUntil],
                      ['Status', <StatusBadge key="sb1" status={quotation.status} />],
                      ['Currency', curr],
                      ['Exchange Rate', quotation.exchangeRate || 1],
                      ['Place of Supply', quotation.placeOfSupplyStateCode || quotation.placeOfSupply],
                      ['Reference Number', quotation.referenceNumber],
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
                      ['Company Name', c.companyName],
                      ['Company Code', c.companyCode],
                      ['GSTIN', c.gstin],
                      ['PAN', c.pan],
                      ['Address', c.address || [c.addressLine1, c.city, c.state].filter(Boolean).join(', ')],
                      ['Contact Details', c.phone || c.email || '-'],
                      ['Company Type', c.companyType],
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
                      ['Customer Code', cust.customerCode],
                      ['Customer Name', cust.customerName],
                      ['Company Name', cust.companyName],
                      ['GSTIN', cust.gstin],
                      ['PAN', cust.pan || cust.panNo],
                      ['Email', cust.email],
                      ['Phone', cust.phone],
                      ['Billing Address', cust.billingAddress || cust.addressLine1],
                    ].map(([label, val]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-zinc-900">{val || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {(terms.paymentTerms || terms.deliveryTerms || terms.warrantyTerms || terms.termsAndConditions || terms.notes) && (
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" /> Terms & Conditions
                      </h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {terms.paymentTerms && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Payment Terms</p>
                          <p className="text-sm font-medium text-zinc-900 whitespace-pre-wrap">{renderOptionalText(terms.paymentTerms)}</p>
                        </div>
                      )}
                      {terms.deliveryTerms && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Delivery Terms</p>
                          <p className="text-sm font-medium text-zinc-900 whitespace-pre-wrap">{renderOptionalText(terms.deliveryTerms)}</p>
                        </div>
                      )}
                      {terms.warrantyTerms && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Warranty Terms</p>
                          <p className="text-sm font-medium text-zinc-900 whitespace-pre-wrap">{renderOptionalText(terms.warrantyTerms)}</p>
                        </div>
                      )}
                      {terms.termsAndConditions && (
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Other Terms</p>
                          <p className="text-sm font-medium text-zinc-900 whitespace-pre-wrap">{renderOptionalText(terms.termsAndConditions)}</p>
                        </div>
                      )}
                      {terms.notes && (
                        <div className="flex flex-col gap-1 md:col-span-2 bg-amber-50 p-4 rounded-lg">
                          <p className="text-[8.8px] font-bold text-amber-700 uppercase tracking-wider">Notes</p>
                          <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">{renderOptionalText(terms.notes)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LINE ITEMS TAB */}
            {activeTab === 'items' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in">
                {isEmpty(lineItems) ? (
                  <div className="p-10 flex flex-col items-center justify-center text-zinc-400">
                     <ShoppingCart size={48} className="mb-4 text-zinc-300" />
                     <h3 className="text-lg font-bold text-zinc-900 mb-1">No Line Items</h3>
                     <p className="text-sm text-zinc-500">There are no line items recorded for this quotation.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto min-w-0 custom-scrollbar rounded-lg border border-zinc-200">
                    <table className="w-full min-w-[640px] sm:min-w-full text-left text-sm" aria-label="Quotation Items Table">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="p-4 w-10 text-center"></th>
                          <th scope="col" className="p-4 w-1/3">Item Name</th>
                          <th scope="col" className="p-4 hidden sm:table-cell">Item Code</th>
                          <th scope="col" className="p-4 hidden lg:table-cell">HSN/SAC</th>
                          <th scope="col" className="p-4 hidden lg:table-cell">GST</th>
                          <th scope="col" className="p-4 text-right">Qty</th>
                          <th scope="col" className="p-4 hidden sm:table-cell">Unit</th>
                          <th scope="col" className="p-4 text-right">Price</th>
                          <th scope="col" className="p-4 text-right hidden sm:table-cell">Disc %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {lineItems.map((item, idx) => {
                          const isExpanded = !!expandedRows[idx];

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
                                <td className="p-4 hidden lg:table-cell text-zinc-500 font-mono text-xs">{item.hsnSacCode || item.hsnSac || '-'}</td>
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
                                          <div className="space-y-3">
                                            <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Item Details</h4>
                                            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
                                              <div className="col-span-2">
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Name</dt>
                                                <dd className="text-sm font-medium text-zinc-900">{item.itemName || item.name || '-'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Item Code</dt>
                                                <dd className="text-sm font-mono font-medium text-zinc-900">{item.itemCode || item.code || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">HSN/SAC</dt>
                                                <dd className="text-sm font-mono text-zinc-700">{item.hsnSacCode || item.hsnSac || 'N/A'}</dd>
                                              </div>
                                              <div className="col-span-2">
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</dt>
                                                <dd className="text-sm text-zinc-700">{item.description || item.hsnSacDescription || 'N/A'}</dd>
                                              </div>
                                              <div>
                                                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GST Slab</dt>
                                                <dd className="text-sm font-medium text-zinc-900">{item.gstSlab || `${item.gstRate || 0}%`}</dd>
                                              </div>
                                            </dl>
                                          </div>
                                        </div>

                                        <div className="space-y-6">
                                          <div className="space-y-3">
                                            <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Pricing & Tax</h4>
                                            <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
                                              <dl className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                  <dt className="text-zinc-500">Unit Price</dt>
                                                  <dd className="font-medium text-zinc-900">₹{fmt(item.unitPrice)}</dd>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                  <dt className="text-zinc-500">Quantity</dt>
                                                  <dd className="font-medium text-zinc-900">{item.quantity} {item.unit}</dd>
                                                </div>
                                                {item.discountAmount > 0 && (
                                                  <div className="flex justify-between items-center text-sm text-emerald-600">
                                                    <dt>Discount ({item.discountPercentage}%)</dt>
                                                    <dd className="font-medium">-₹{fmt(item.discountAmount)}</dd>
                                                  </div>
                                                )}
                                                <div className="flex justify-between items-center text-sm font-medium border-t border-zinc-100 pt-2 mt-2">
                                                  <dt className="text-zinc-700">Taxable Amount</dt>
                                                  <dd className="text-zinc-900">₹{fmt(item.taxableAmount)}</dd>
                                                </div>
                                                {item.cgst > 0 && (
                                                  <div className="flex justify-between items-center text-sm">
                                                    <dt className="text-zinc-500">CGST</dt>
                                                    <dd className="font-medium text-zinc-600">₹{fmt(item.cgst)}</dd>
                                                  </div>
                                                )}
                                                {item.sgst > 0 && (
                                                  <div className="flex justify-between items-center text-sm">
                                                    <dt className="text-zinc-500">SGST</dt>
                                                    <dd className="font-medium text-zinc-600">₹{fmt(item.sgst)}</dd>
                                                  </div>
                                                )}
                                                {item.igst > 0 && (
                                                  <div className="flex justify-between items-center text-sm">
                                                    <dt className="text-zinc-500">IGST</dt>
                                                    <dd className="font-medium text-zinc-600">₹{fmt(item.igst)}</dd>
                                                  </div>
                                                )}
                                                <div className="flex justify-between items-center text-base font-bold border-t-2 border-zinc-900 pt-2 mt-2">
                                                  <dt className="text-zinc-900">Total Amount</dt>
                                                  <dd className="text-zinc-900">₹{fmt(item.totalAmount)}</dd>
                                                </div>
                                              </dl>
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

            {/* TAX SUMMARY TAB */}
            {activeTab === 'tax' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Tax Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-500 uppercase">Taxable Amount</p>
                      <p className="text-lg font-bold text-zinc-900 mt-1">₹{fmt(taxSummary.taxableAmount)}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-500 uppercase">CGST / SGST</p>
                      <p className="text-lg font-bold text-zinc-900 mt-1">₹{fmt(taxSummary.cgst)} / ₹{fmt(taxSummary.sgst)}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-500 uppercase">IGST</p>
                      <p className="text-lg font-bold text-zinc-900 mt-1">₹{fmt(taxSummary.igst)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase">Total Tax</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">₹{fmt(taxSummary.totalTax)}</p>
                    </div>
                  </div>
                  
                  <h4 className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Amount Summary</h4>
                  <div className="max-w-sm space-y-2 border border-zinc-200 rounded-lg p-4">
                     <div className="flex justify-between text-sm">
                       <span className="text-zinc-500">Subtotal</span>
                       <span className="font-medium text-zinc-900">₹{fmt(amtSummary.subtotal)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-emerald-600">
                       <span>Discount</span>
                       <span className="font-medium">-₹{fmt(amtSummary.discountAmount)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-zinc-500">Tax</span>
                       <span className="font-medium text-zinc-900">₹{fmt(taxSummary.totalTax)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-zinc-500">Round Off</span>
                       <span className="font-medium text-zinc-900">₹{fmt(amtSummary.roundOff)}</span>
                     </div>
                     <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-200">
                       <span className="text-zinc-900">Total Amount</span>
                       <span className="text-zinc-900">₹{fmt(amtSummary.totalAmount)}</span>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVAL WORKFLOW TAB */}
            {activeTab === 'approval' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in max-w-2xl">
                 <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Approval Status</h3>
                </div>
                <div className="p-6">
                   <dl className="space-y-4">
                     <div>
                       <dt className="text-xs font-semibold text-zinc-500 uppercase">Status</dt>
                       <dd className="mt-1"><StatusBadge status={approval.approvalStatus || quotation.status} /></dd>
                     </div>
                     {approval.approvedAt && (
                       <div>
                         <dt className="text-xs font-semibold text-zinc-500 uppercase">Approved At</dt>
                         <dd className="mt-1 text-sm font-medium text-zinc-900">{new Date(approval.approvedAt).toLocaleString()}</dd>
                       </div>
                     )}
                   </dl>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {showPiModal && (
        <PIConversionFormModal
          isOpen={showPiModal}
          onClose={() => setShowPiModal(false)}
          companyId={companyId}
          sourceQuotation={quotation}
          onSuccess={(newPiId) => {
            setShowPiModal(false);
            if (newPiId) {
              navigate(`/accounts/transactions/proforma-invoices/${newPiId}`);
            } else {
              navigate('/accounts/transactions/proforma-invoices');
            }
          }}
        />
      )}
    </div>
  );
}


