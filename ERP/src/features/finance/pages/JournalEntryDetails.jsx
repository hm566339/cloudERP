import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, FileText, 
  LayoutList, History, CheckSquare,
  Building2, Clock, Calendar, Activity,
  Network, BookOpen, Lock, ListOrdered,
  Paperclip, XCircle, Percent, Mail, Info, FileDigit, Settings, Book, DollarSign,
  ArrowRightCircle, RotateCcw, Copy
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { glJournalEntriesApi, chartOfAccountsApi, periodsApi, financeApi } from '../../../api/account';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import StatusBadge from '../../../components/common/StatusBadge';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import JournalEntryForm from '../components/JournalEntryForm';
import { useRoutePath } from "../../../hooks/useRoutePath";

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-100 rounded-xl shadow-sm h-full">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-zinc-400" />
    </div>
    <h3 className="text-sm font-bold text-zinc-800 mb-1">{title}</h3>
    <p className="text-xs text-zinc-500 max-w-sm">{message}</p>
  </div>
);

export default function JournalEntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    glJournalEntriesApi.getJournalEntryById,
    id,
    { enabled: !!id }
  );
  
  const { data: fyData, isLoading: isLoadingFY } = useApiQuery(financeApi.getFiscalYears, { companyId, page: 0, size: 50 });
  const fiscalYears = fyData?.data?.fiscalYears || fyData?.fiscalYears || [];

  const { data: periodsData, isLoading: isLoadingPeriods } = useApiQuery(periodsApi.getAccountingPeriods, { companyId, page: 0, size: 50 });
  const periods = periodsData?.data?.accountingPeriods || periodsData?.accountingPeriods || [];

  const { data: coaData } = useApiQuery(chartOfAccountsApi.getChartOfAccounts, { companyId, page: 0, size: 1000 }, { skip: !companyId });
  const accounts = coaData?.data?.chartOfAccounts || coaData?.chartOfAccounts || coaData?.content || [];

  const [updateJournal, { isLoading: isUpdating }] = useApiMutation(glJournalEntriesApi.updateJournalEntry);
  const postMutation = useApiMutation(glJournalEntriesApi.postJournalEntry);
  const reverseMutation = useApiMutation(glJournalEntriesApi.reverseJournalEntry);
  const cancelMutation = useApiMutation(glJournalEntriesApi.cancelJournalEntry);

  const rawData = response?.data?.data || response?.data || response || {};
  const journal = rawData.journalEntry || rawData;

  if (isLoading) return <PageLoader message="Loading Journal Entry details..." />;

  if (error || !journal || (!journal.journalEntryId && !journal.id)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 mb-2">Journal Entry Not Found</h2>
        <p className="text-sm text-zinc-600 mb-6">{error?.message || "The requested Journal Entry could not be found or you do not have permission to view it."}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const handleAction = async (actionFn, actionName) => {
    if (await confirmDialog({ 
      title: `${actionName} Journal Entry`,
      message: `Are you sure you want to ${actionName.toLowerCase()} Journal Entry ${journal.voucherNumber || journal.voucherNo || id}?`
    })) {
      try {
        const res = await actionFn.mutateAsync(journal.journalEntryId || journal.id);
        const message = res?.data?.message || res?.message || `Journal Entry ${actionName.toLowerCase()}d successfully.`;
        dispatch(addAlert({ type: 'success', message }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || `Failed to ${actionName.toLowerCase()} Journal Entry` }));
      }
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      await updateJournal({ id: journal.journalEntryId || journal.id, companyId, ...payload });
      dispatch(addAlert({ type: 'success', message: 'Journal updated successfully' }));
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      dispatch(addwindow.print());
    }
  };

  const companyInfo = rawData.company || journal.company || {};
  const fiscalInfo = rawData.fiscalInformation || {
    fiscalYear: journal.fiscalYearValue,
    period: journal.periodName,
    status: journal.periodStatus || 'Open'
  };
  const journalLines = rawData.journalLines || journal.journalLines || [];
  const ledgerInfo = rawData.ledgerInformation || [];
  const sourceTx = rawData.sourceTransaction || {};
  const approvalInfo = rawData.approvalInformation || {};
  const postingInfo = rawData.postingInformation || {};
  const hashInfo = rawData.hashInformation || {};
  const attachments = Array.isArray(rawData.attachments) ? rawData.attachments : [];
  const stats = rawData.statistics || {};
  const auditTrail = rawData.auditTrail || [];

  const curr = journal.currency || 'INR';
  const totalDebit = journal.totalDebit ?? stats.totalDebit ?? 0;
  const totalCredit = journal.totalCredit ?? stats.totalCredit ?? 0;
  const difference = stats.difference ?? Math.abs(totalDebit - totalCredit);
  const isBalanced = journal.isBalanced;
  
  const debitLines = stats.debitLineCount ?? journalLines.filter(l => l.debitAmount > 0).length;
  const creditLines = stats.creditLineCount ?? journalLines.filter(l => l.creditAmount > 0).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'lines', label: 'Journal Lines', icon: <ListOrdered size={16} /> },
    { id: 'ledger', label: 'Ledger Information', icon: <BookOpen size={16} /> },
    { id: 'source', label: 'Source Transaction', icon: <Network size={16} /> },
    { id: 'fiscal', label: 'Fiscal Information', icon: <Calendar size={16} /> },
    { id: 'approval', label: 'Approval', icon: <CheckSquare size={16} /> },
    { id: 'posting', label: 'Posting Information', icon: <FileDigit size={16} /> },
    { id: 'hash', label: 'Hash Information', icon: <Lock size={16} /> },
    { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
    { id: 'audit', label: 'Audit Trail', icon: <History size={16} /> }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 -m-6">
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
                {journal.voucherNumber || journal.voucherNo || journal.journalEntryId || journal.id}
              </h1>
              <StatusBadge status={journal.status} />
              <StatusBadge status={journal.isBalanced ? 'BALANCED' : 'UNBALANCED'} />
              {(journal.sourceModule || sourceTx.sourceNumber) && (
                <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-100 text-zinc-700 border-zinc-200 uppercase">
                  {journal.sourceModule || sourceTx.sourceModule || 'Source Tx'}
                </span>
              )}
              <span className="text-sm text-zinc-400">
                ({journal.voucherDate ? new Date(journal.voucherDate).toLocaleDateString() : '-'})
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
          {journal.status === 'DRAFT' && (
            <button onClick={() => setIsEditModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Edit size={16} /> Edit Journal
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
                  <button className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 flex items-center gap-2">
                     <Copy size={14} /> Clone Journal
                  </button>
                  <button className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 flex items-center gap-2">
                    <Building2 size={14} /> View General Ledger
                  </button>
                  <div className="h-px bg-zinc-100 my-1" />
                  
                  {journal.status === 'DRAFT' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(postMutation, 'Post'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                      <CheckSquare size={14} /> Post Journal
                    </button>
                  )}
                  {journal.status === 'POSTED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(reverseMutation, 'Reverse'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                      <RotateCcw size={14} /> Reverse Journal
                    </button>
                  )}
                  {journal.status !== 'CANCELLED' && journal.status !== 'REVERSED' && (
                    <button onClick={() => { setShowMoreActions(false); handleAction(cancelMutation, 'Cancel'); }} className="w-full text-left px-4 py-2 text-[10.4px] font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                      <XCircle size={14} /> Cancel Journal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        <div className="flex px-6 md:px-8 border-t border-zinc-200 bg-zinc-50/50 gap-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-zinc-900 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}>
            <Info size={16} strokeWidth={2.5} /> Overview
          </button>
          <button onClick={() => setActiveTab('lines')} className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'lines' ? 'border-zinc-900 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}>
            <FileText size={16} strokeWidth={2.5} /> Line Items ({journal.lineCount || 0})
          </button>
        </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6">
          
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                <Info size={16} className="text-blue-500" /> Journal Summary
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher No.</p>
                <p className="text-sm font-semibold text-zinc-900 font-mono">{journal.voucherNumber || journal.voucherNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-medium text-zinc-800">{journal.voucherDate ? new Date(journal.voucherDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference No.</p>
                <p className="text-sm font-medium text-zinc-800">{journal.referenceNumber || journal.referenceNo || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Module</p>
                <p className="text-sm font-medium text-zinc-800">{journal.sourceModule || sourceTx.sourceModule || 'Manual'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Document</p>
                <p className="text-sm font-medium text-zinc-800">{sourceTx.sourceNumber || journal.sourceDocumentId || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Currency</p>
                <p className="text-sm font-medium text-zinc-800">{journal.currency || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Exchange Rate</p>
                <p className="text-sm font-medium text-zinc-800">{journal.exchangeRate || 1}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Narration</p>
                <p className="text-sm font-medium text-zinc-800 bg-zinc-50 p-2 rounded-md border border-zinc-100 whitespace-pre-wrap mt-1">
                  {journal.narration || 'No narration provided.'}
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
              {journal.status === 'DRAFT' && (
                <button onClick={() => setIsEditModalOpen(true)} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                  <Edit size={14} /> Edit Journal
                </button>
              )}
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Printer size={14} /> Print Journal
              </button>
              <button className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Download size={14} /> Export PDF
              </button>
              <button className="w-full text-left px-4 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2">
                <Building2 size={14} /> View General Ledger
              </button>
            </div>
          </div>
        </div>

        {/* Main Content (70%) */}
        <div className="w-full lg:w-[70%] bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-280px)] min-h-[400px]">
          {/* Scrollable Tabs Header */}
          <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar bg-zinc-50/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[10.4px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-zinc-900 text-blue-700 bg-white shadow-[0_-2px_0_0_rgba(37,99,235,0.02)_inset]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 hover:border-zinc-300'
                }`}
              >
                {React.cloneElement(tab.icon, { 
                  className: activeTab === tab.id ? 'text-blue-600' : 'text-zinc-400' 
                })}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-500" /> Journal Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher No.</p>
                        <p className="text-sm font-medium text-zinc-900">{journal.voucherNumber || journal.voucherNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-medium text-zinc-900">{journal.voucherDate ? new Date(journal.voucherDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                        <StatusBadge status={journal.status} />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference No.</p>
                        <p className="text-sm font-medium text-zinc-900">{journal.referenceNumber || journal.referenceNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Debit</p>
                        <p className="text-sm font-bold text-emerald-600">{curr} {fmt(totalDebit)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Credit</p>
                        <p className="text-sm font-bold text-rose-600">{curr} {fmt(totalCredit)}</p>
                      </div>
                      <div className="col-span-2 mt-2">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Narration</p>
                        <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{journal.narration || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <Building2 size={16} className="text-indigo-500" /> Company Information
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Company Name</p>
                        <p className="text-sm font-bold text-zinc-900">{companyInfo.companyName || companyInfo.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Company Code</p>
                        <p className="text-sm font-medium text-zinc-900">{companyInfo.companyCode || companyInfo.code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Base Currency</p>
                        <p className="text-sm font-medium text-zinc-900">{companyInfo.baseCurrency || 'INR'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GSTIN</p>
                        <p className="text-sm font-medium text-zinc-900">{companyInfo.gstin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">PAN</p>
                        <p className="text-sm font-medium text-zinc-900">{companyInfo.pan || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'lines' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
                {journalLines.length === 0 ? (
                  <EmptyState title="No Journal Lines" message="There are no line items recorded for this Journal Entry." icon={ListOrdered} />
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">Account Code</th>
                            <th className="px-4 py-3 min-w-[160px]">Account Name</th>
                            <th className="px-4 py-3">Group</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 min-w-[160px]">Description</th>
                            <th className="px-4 py-3 text-right">Debit</th>
                            <th className="px-4 py-3 text-right">Credit</th>
                            <th className="px-4 py-3 text-right">Base Amount</th>
                            <th className="px-4 py-3">Cost Center</th>
                            <th className="px-4 py-3">Branch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {journalLines.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3 text-center text-zinc-500 font-medium">{item.lineNumber || (idx + 1)}</td>
                              <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{item.accountCode || '-'}</td>
                              <td className="px-4 py-3 font-semibold text-zinc-900">{item.accountName || '-'}</td>
                              <td className="px-4 py-3 text-zinc-600">{item.accountGroup || '-'}</td>
                              <td className="px-4 py-3 text-zinc-600">{item.accountCategory || '-'}</td>
                              <td className="px-4 py-3 text-zinc-700 truncate max-w-[200px]" title={item.description || item.lineDescription}>{item.description || item.lineDescription || '-'}</td>
                              <td className="px-4 py-3 text-right font-medium text-emerald-700">{item.debitAmount ? fmt(item.debitAmount) : '-'}</td>
                              <td className="px-4 py-3 text-right font-medium text-rose-700">{item.creditAmount ? fmt(item.creditAmount) : '-'}</td>
                              <td className="px-4 py-3 text-right text-zinc-900">{fmt(item.baseAmount || (item.debitAmount || item.creditAmount))}</td>
                              <td className="px-4 py-3 text-zinc-600">{item.costCenterName || '-'}</td>
                              <td className="px-4 py-3 text-zinc-600">{item.branchName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-zinc-50/80 border-t border-zinc-200 p-4">
                       <div className="flex justify-end gap-16 items-center px-4">
                           <div className="flex gap-4 items-center">
                               <span className="text-sm font-bold text-zinc-600 uppercase">Totals:</span>
                           </div>
                           <div className="flex gap-16">
                               <div className="text-right w-24 font-bold text-emerald-700">{fmt(totalDebit)}</div>
                               <div className="text-right w-24 font-bold text-rose-700">{fmt(totalCredit)}</div>
                           </div>
                       </div>
                       {!isBalanced && (
                          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-md text-sm font-semibold text-center flex items-center justify-center gap-2">
                             <XCircle size={16} /> Journal is out of balance by {curr} {fmt(difference)}
                          </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {journalLines.length === 0 ? (
                  <EmptyState title="No Ledger Data" message="No ledger information available as there are no journal lines." icon={BookOpen} />
                ) : (
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <Settings size={16} className="text-blue-500" /> Account Settings & Balances
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Account Code</th>
                            <th className="px-4 py-3">Account Name</th>
                            <th className="px-4 py-3">Account Type</th>
                            <th className="px-4 py-3">Posting Allowed</th>
                            <th className="px-4 py-3 text-right">Opening Balance</th>
                            <th className="px-4 py-3 text-right">Closing Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {ledgerInfo.length > 0 ? ledgerInfo.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3 font-mono text-xs text-zinc-900">{item.accountCode || '-'}</td>
                              <td className="px-4 py-3 font-semibold text-zinc-700">{item.accountName || '-'}</td>
                              <td className="px-4 py-3 text-zinc-600">{item.accountType || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block w-2 h-2 rounded-full ${item.postingAllowed !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-zinc-900">{item.openingBalance != null ? fmt(item.openingBalance) : '-'}</td>
                              <td className="px-4 py-3 text-right font-bold text-blue-600">{item.closingBalance != null ? fmt(item.closingBalance) : '-'}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="6" className="text-center py-4 text-zinc-500">No ledger information available.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'source' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!sourceTx.sourceNumber && !journal.sourceModule ? (
                  <EmptyState title="No Source Transaction" message="This is a manual journal entry with no related source documents." icon={Network} />
                ) : (
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-2xl">
                    <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                      <Network size={16} className="text-indigo-500" /> Source Transaction Details
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Module</p>
                        <p className="text-sm font-semibold text-zinc-900">{journal.sourceModule || sourceTx.sourceModule || 'Manual'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Document ID</p>
                        <p className="text-sm font-mono font-medium text-blue-600 hover:underline cursor-pointer">{sourceTx.sourceNumber || journal.sourceDocumentId || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'fiscal' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-2xl">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-purple-500" /> Fiscal Information
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Fiscal Year</p>
                      <p className="text-sm font-bold text-zinc-900">{fiscalInfo.fiscalYear || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Accounting Period</p>
                      <p className="text-sm font-bold text-zinc-900">{fiscalInfo.accountingPeriodName || fiscalInfo.period || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Period Status</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 uppercase ${
                        (fiscalInfo.periodStatus || fiscalInfo.status || '').toUpperCase() === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {fiscalInfo.periodStatus || fiscalInfo.status || 'OPEN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'approval' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <CheckSquare size={16} className="text-emerald-500" /> Approval Workflow
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approval Status</p>
                      <StatusBadge status={approvalInfo.approvalStatus || journal.status} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved By</p>
                      <p className="text-sm font-medium text-zinc-900">{approvalInfo.approvedBy || journal.approvedBy || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved Date</p>
                      <p className="text-sm font-medium text-zinc-900">{approvalInfo.approvedAt ? new Date(approvalInfo.approvedAt).toLocaleString() : journal.approvedAt ? new Date(journal.approvedAt).toLocaleString() : '-'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-4 mt-2">
                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approval Remarks</p>
                       <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{approvalInfo.approvalRemarks || journal.approvalRemarks || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'posting' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <FileDigit size={16} className="text-blue-500" /> Posting Information
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Status</p>
                      <StatusBadge status={postingInfo.postingStatus || (journal.status === 'POSTED' ? 'POSTED' : 'UNPOSTED')} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posted By</p>
                      <p className="text-sm font-medium text-zinc-900">{postingInfo.postedBy || journal.postedBy || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posted At</p>
                      <p className="text-sm font-medium text-zinc-900">{postingInfo.postedAt ? new Date(postingInfo.postedAt).toLocaleString() : journal.postedAt ? new Date(journal.postedAt).toLocaleString() : '-'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-3 mt-2">
                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Remarks</p>
                       <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{postingInfo.postingRemarks || journal.postingRemarks || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hash' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-zinc-900 text-white max-w-4xl">
                  <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 font-semibold flex items-center gap-2 text-sm text-zinc-300">
                    <Lock size={16} className="text-zinc-500" /> Security Hash Information
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Hash Value</p>
                      <p className="text-sm font-mono text-emerald-400 bg-zinc-950 p-3 rounded border border-zinc-800 break-all">{hashInfo.hashValue || journal.hashValue || 'PENDING'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Previous Hash</p>
                      <p className="text-sm font-mono text-zinc-400 bg-zinc-950 p-3 rounded border border-zinc-800 break-all">{hashInfo.previousHash || journal.previousHash || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Hash Algorithm</p>
                      <p className="text-sm font-mono text-zinc-300">{hashInfo.hashAlgorithm || journal.hashAlgorithm || 'SHA-256'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Created At</p>
                      <p className="text-sm text-zinc-300">{hashInfo.createdAt ? new Date(hashInfo.createdAt).toLocaleString() : journal.createdAt ? new Date(journal.createdAt).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                 <EmptyState title="No Attachments" message="There are no files attached to this Journal Entry." icon={Paperclip} />
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                    <History size={16} className="text-zinc-500" /> Audit Log
                  </div>
                  <div className="p-6">
                    {auditTrail.length > 0 ? (
                      <div className="relative border-l border-zinc-200 ml-3 space-y-8">
                        {auditTrail.map((log, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[26.4px] bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-full p-1">
                              {log.action?.includes('POSTED') ? <CheckSquare size={14}/> : <Activity size={14}/>}
                            </span>
                            <div className="pl-4">
                              <p className="text-sm font-bold text-zinc-900">{log.action || 'Action Performed'}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{log.performedAt ? new Date(log.performedAt).toLocaleString() : '-'} by {log.performedBy || 'System'}</p>
                              <p className="text-sm text-zinc-700 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100 font-mono text-[8.8px] break-all">{log.details || '—'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative border-l border-zinc-200 ml-3 space-y-8">
                         <div className="relative">
                            <span className="absolute -left-[26.4px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full p-1"><Activity size={14}/></span>
                            <div className="pl-4">
                               <p className="text-sm font-bold text-zinc-900">Journal Created</p>
                               <p className="text-xs text-zinc-500 mt-0.5">{hashInfo.createdAt ? new Date(hashInfo.createdAt).toLocaleString() : journal.createdAt ? new Date(journal.createdAt).toLocaleString() : '-'} by {hashInfo.createdBy || journal.createdBy || 'System'}</p>
                               <p className="text-sm text-zinc-700 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100">Journal entry initialized in DRAFT status.</p>
                            </div>
                         </div>
                         {(postingInfo.postedAt || journal.postedAt) && (
                           <div className="relative">
                              <span className="absolute -left-[26.4px] bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full p-1"><CheckSquare size={14}/></span>
                              <div className="pl-4">
                                 <p className="text-sm font-bold text-zinc-900">Journal Posted</p>
                                 <p className="text-xs text-zinc-500 mt-0.5">{new Date(postingInfo.postedAt || journal.postedAt).toLocaleString()} by {postingInfo.postedBy || journal.postedBy || 'System'}</p>
                                 <p className="text-sm text-zinc-700 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100">Journal entry was posted to the general ledger.</p>
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <JournalEntryForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={journal}
        fiscalYears={fiscalYears}
        periods={periods}
        accounts={accounts}
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
        isLoadingFY={isLoadingFY}
        isLoadingPeriods={isLoadingPeriods}
      />
    </div>
  );
}

