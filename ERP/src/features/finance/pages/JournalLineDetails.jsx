import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, FileText, 
  LayoutList, History, CheckSquare,
  Building2, Calendar, Activity,
  Network, BookOpen, Lock, Paperclip, 
  XCircle, Info, FileDigit, ListOrdered, Share2
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { glJournalLinesApi } from '../../../api/account';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomSelect from '../../../components/common/CustomSelect';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-100 rounded-xl shadow-sm h-full min-h-[240px]">
    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-zinc-400" />
    </div>
    <h3 className="text-sm font-bold text-zinc-800 mb-1">{title}</h3>
    <p className="text-xs text-zinc-500 max-w-sm">{message}</p>
  </div>
);

export default function JournalLineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    glJournalLinesApi.getJournalLineById,
    id,
    { enabled: !!id }
  );

  const updateLineMutation = useApiMutation(glJournalLinesApi.updateJournalLine);

  const rawData = response?.data?.data || response?.data || response || {};
  const line = rawData.journalLine || rawData;

  const [editFormData, setEditFormData] = useState({
    accountId: '',
    debitAmount: 0,
    creditAmount: 0,
    currencyCode: 'USD',
    exchangeRate: 1,
    lineDescription: ''
  });

  if (isLoading) return <PageLoader message="Loading Journal Line profile..." />;

  if (error || !line || (!line.journalLineId && !line.id)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50 rounded-xl min-h-[60vh]">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 mb-2">Journal Line Not Found</h2>
        <p className="text-sm text-zinc-600 mb-6">{error?.message || "The requested Journal Line could not be found or you do not have permission to view it."}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setEditFormData({
      accountId: line.accountId || '',
      debitAmount: line.debitAmount || 0,
      creditAmount: line.creditAmount || 0,
      currencyCode: line.currencyCode || 'USD',
      exchangeRate: line.exchangeRate || 1,
      lineDescription: line.lineDescription || line.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        data: {
          accountId: editFormData.accountId,
          debitAmount: parseFloat(editFormData.debitAmount) || 0,
          creditAmount: parseFloat(editFormData.creditAmount) || 0,
          currencyCode: editFormData.currencyCode,
          exchangeRate: parseFloat(editFormData.exchangeRate) || 1,
          lineDescription: editFormData.lineDescription
        }
      };
      await updateLineMutation.mutateAsync({ id: line.journalLineId || line.id, data: submitData });
      dispatch(addAlert({ type: 'success', message: 'Journal Line updated successfully' }));
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update journal line' }));
    }
  };

  const companyInfo = rawData.company || line.company || {};
  const journalInfo = rawData.journalEntry || line.journalEntry || {};
  const accountInfo = rawData.accountInformation || rawData.account || {};
  const ledgerInfo = rawData.ledgerInformation || rawData.ledger || {};
  const fiscalInfo = rawData.fiscalInformation || rawData.fiscal || {};
  const sourceTx = rawData.sourceTransaction || rawData.source || {};
  const costInfo = rawData.costAllocation || {};
  const approvalInfo = rawData.approvalInformation || {};
  const postingInfo = rawData.postingInformation || {};
  const auditTrail = rawData.auditTrail || [];

  const curr = line.currencyCode || line.currency || 'INR';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Info size={16} /> },
    { id: 'journal', label: 'Journal Entry', icon: <BookOpen size={16} /> },
    { id: 'account', label: 'Account Information', icon: <Building2 size={16} /> },
    { id: 'ledger', label: 'Ledger Information', icon: <LayoutList size={16} /> },
    { id: 'fiscal', label: 'Fiscal Information', icon: <Calendar size={16} /> },
    { id: 'source', label: 'Source Transaction', icon: <Network size={16} /> },
    { id: 'cost', label: 'Cost Allocation', icon: <Share2 size={16} /> },
    { id: 'approval', label: 'Approval', icon: <CheckSquare size={16} /> },
    { id: 'posting', label: 'Posting Information', icon: <FileDigit size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <History size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-sm">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-zinc-500" />
              </button>
              <div>
                <div className="flex items-center flex-wrap gap-3">
                  <h1 className="text-sm md:text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                    {line.voucherNumber || line.voucherNo || line.journalLineId || line.id}
                  </h1>
                  <span className="text-sm font-semibold text-zinc-500">Line {line.lineNumber || line.lineId || 'N/A'}</span>
                  <StatusBadge status={line.isDeleted ? 'DELETED' : 'ACTIVE'} />
                  <StatusBadge status={postingInfo.postingStatus || (journalInfo.status === 'POSTED' ? 'POSTED' : 'DRAFT')} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(); }} 
                className="btn-primary flex items-center gap-2"
              >
                <Edit size={16} /> <span className="hidden sm:inline">Edit Line</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="btn-secondary"
                >
                  More Actions
                </button>
                {showMoreActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
                    <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <Printer size={16} className="text-zinc-400"/> Print Journal Line
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <Download size={16} className="text-zinc-400"/> Export PDF
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <FileText size={16} className="text-zinc-400"/> Export Excel
                    </button>
                    <div className="border-t border-zinc-100 my-1"></div>
                    <Link to={buildPath(`/accounts/transactions/journal/${journalInfo.journalEntryId || line.journalEntryId || line.journalId}`)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <BookOpen size={16} className="text-zinc-400"/> View Journal Entry
                    </Link>
                    <Link to={buildPath(`/accounts/masters/ledgers/${line.accountId}`)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <LayoutList size={16} className="text-zinc-400"/> View Ledger
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mt-6">
            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
              <p className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Debit Amount</p>
              <p className="text-lg font-bold text-emerald-700 font-mono truncate">{curr} {fmt(line.debitAmount)}</p>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <p className="text-[8px] font-bold text-blue-600/70 uppercase tracking-wider mb-1">Credit Amount</p>
              <p className="text-lg font-bold text-blue-700 font-mono truncate">{curr} {fmt(line.creditAmount)}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Base Amount</p>
              <p className="text-lg font-bold text-zinc-800 font-mono truncate">{companyInfo.baseCurrency || 'INR'} {fmt(line.baseAmount)}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Current Balance</p>
              <p className="text-lg font-bold text-zinc-800 font-mono truncate">{curr} {fmt(ledgerInfo.closingBalance || ledgerInfo.currentBalance)}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Opening Balance</p>
              <p className="text-lg font-bold text-zinc-800 font-mono truncate">{curr} {fmt(ledgerInfo.openingBalance)}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Exchange Rate</p>
              <p className="text-lg font-bold text-zinc-800 font-mono truncate">{line.exchangeRate || 1}</p>
            </div>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Status</p>
              <div className="mt-1">
                <StatusBadge status={postingInfo.postingStatus || (journalInfo.status === 'POSTED' ? 'POSTED' : 'DRAFT')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Sidebar (30%) */}
            <div className="w-full lg:w-[256px] xl:w-[304px] shrink-0 space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2">
                  <BookOpen size={16} className="text-zinc-500" /> Journal Line Summary
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher Number</p>
                    <p className="text-sm font-semibold text-zinc-900 font-mono">{line.voucherNumber || line.voucherNo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher Date</p>
                    <p className="text-sm font-medium text-zinc-800">{line.voucherDate ? new Date(line.voucherDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Line Number</p>
                    <p className="text-sm font-medium text-zinc-800">{line.lineNumber || line.lineId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Name</p>
                    <p className="text-sm font-medium text-zinc-800">{line.accountName || accountInfo.accountName || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Currency</p>
                      <p className="text-sm font-medium text-zinc-800">{curr}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Exchange Rate</p>
                      <p className="text-sm font-medium text-zinc-800">{line.exchangeRate || 1}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Line Description</p>
                    <p className="text-sm font-medium text-zinc-800 bg-zinc-50 p-2 rounded-md border border-zinc-100 whitespace-pre-wrap mt-1">
                      {line.description || line.lineDescription || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2">
                  <Activity size={16} className="text-zinc-500" /> Quick Actions
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button onClick={handleOpenEdit} className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2 transition-colors">
                    <Edit size={16} className="text-zinc-400"/> Edit Journal Line
                  </button>
                  <Link to={buildPath(`/accounts/transactions/journal/${journalInfo.journalEntryId || line.journalEntryId || line.journalId}`)} className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2 transition-colors">
                    <BookOpen size={16} className="text-zinc-400"/> View Parent Journal Entry
                  </Link>
                  <Link to={buildPath(`/accounts/masters/ledgers/${line.accountId}`)} className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2 transition-colors">
                    <LayoutList size={16} className="text-zinc-400"/> View Account Ledger
                  </Link>
                  <button className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2 transition-colors">
                    <Printer size={16} className="text-zinc-400"/> Print Document
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content (70%) */}
            <div className="flex-1 min-w-0 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
              <div className="flex items-center overflow-x-auto border-b border-zinc-200 hide-scrollbar bg-zinc-50/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-zinc-900 text-blue-700 bg-white'
                        : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50'
                    }`}
                  >
                    {React.cloneElement(tab.icon, { className: activeTab === tab.id ? 'text-blue-600' : 'text-zinc-400' })}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {activeTab === 'overview' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                    <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                      <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                        <Info size={16} className="text-blue-500" /> Journal Line Information
                      </div>
                      <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher No.</p>
                          <p className="text-sm font-medium text-zinc-900">{line.voucherNumber || line.voucherNo || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Date</p>
                          <p className="text-sm font-medium text-zinc-900">{line.voucherDate ? new Date(line.voucherDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Line Number</p>
                          <p className="text-sm font-medium text-zinc-900">{line.lineNumber || line.lineId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Debit Amount</p>
                          <p className="text-sm font-bold text-emerald-600">{curr} {fmt(line.debitAmount)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Credit Amount</p>
                          <p className="text-sm font-bold text-rose-600">{curr} {fmt(line.creditAmount)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Base Amount</p>
                          <p className="text-sm font-bold text-zinc-900">{companyInfo.baseCurrency || 'INR'} {fmt(line.baseAmount)}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3 mt-2">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                          <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{line.description || line.lineDescription || 'None'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                      <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                        <Building2 size={16} className="text-indigo-500" /> Company Information
                      </div>
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <div className="col-span-2">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">GSTIN</p>
                          <p className="text-sm font-medium text-zinc-900">{companyInfo.gstin || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'journal' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!journalInfo.journalEntryId && !journalInfo.id ? (
                      <EmptyState title="No Journal Entry Found" message="This journal line does not seem to have a related journal entry attached." icon={BookOpen} />
                    ) : (
                      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                          <BookOpen size={16} className="text-blue-500" /> Parent Journal Entry
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Journal Entry ID</p>
                            <Link to={buildPath(`/accounts/transactions/journal/${journalInfo.journalEntryId || journalInfo.id}`)} className="text-sm font-mono font-medium text-blue-600 hover:underline cursor-pointer truncate block">{journalInfo.journalEntryId || journalInfo.id || '-'}</Link>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher Number</p>
                            <p className="text-sm font-semibold text-zinc-900 font-mono">{journalInfo.voucherNumber || journalInfo.voucherNo || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Voucher Date</p>
                            <p className="text-sm font-medium text-zinc-900">{journalInfo.voucherDate ? new Date(journalInfo.voucherDate).toLocaleDateString() : '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Journal Status</p>
                            <StatusBadge status={journalInfo.status} />
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Balanced Status</p>
                            <StatusBadge status={journalInfo.isBalanced ? 'BALANCED' : 'UNBALANCED'} />
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference No.</p>
                            <p className="text-sm font-medium text-zinc-900">{journalInfo.referenceNumber || journalInfo.referenceNo || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Debit</p>
                            <p className="text-sm font-bold text-emerald-600">{journalInfo.currency || curr} {fmt(journalInfo.totalDebit)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Credit</p>
                            <p className="text-sm font-bold text-rose-600">{journalInfo.currency || curr} {fmt(journalInfo.totalCredit)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Module</p>
                            <p className="text-sm font-medium text-zinc-900">{journalInfo.sourceModule || sourceTx.sourceModule || 'Manual'}</p>
                          </div>
                          <div className="col-span-2 md:col-span-3 mt-2">
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Narration</p>
                            <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{journalInfo.narration || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                      <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                        <Building2 size={16} className="text-purple-500" /> Account Information
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Code</p>
                          <p className="text-sm font-mono font-semibold text-zinc-900">{accountInfo.accountCode || line.accountCode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Name</p>
                          <p className="text-sm font-semibold text-zinc-900">{accountInfo.accountName || line.accountName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Group</p>
                          <p className="text-sm font-medium text-zinc-800">{accountInfo.accountGroup || line.accountGroup || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Category</p>
                          <p className="text-sm font-medium text-zinc-800">{accountInfo.accountCategory || line.accountCategory || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Account Type</p>
                          <p className="text-sm font-medium text-zinc-800">{accountInfo.accountType || line.accountType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Allowed</p>
                          <span className={`inline-block w-3 h-3 rounded-full ${(accountInfo.postingAllowed !== false) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Opening Balance</p>
                          <p className="text-sm font-bold text-zinc-900">{fmt(accountInfo.openingBalance || ledgerInfo.openingBalance)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Current Balance</p>
                          <p className="text-sm font-bold text-blue-600">{fmt(accountInfo.currentBalance || ledgerInfo.closingBalance || ledgerInfo.currentBalance)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ledger' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                      <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                        <LayoutList size={16} className="text-indigo-500" /> Ledger Information
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ledger Name</p>
                          <p className="text-sm font-semibold text-zinc-900">{ledgerInfo.ledgerName || accountInfo.accountName || line.accountName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ledger Type</p>
                          <p className="text-sm font-medium text-zinc-900">{ledgerInfo.ledgerType || accountInfo.accountType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ledger Balance</p>
                          <p className="text-sm font-bold text-blue-600">{fmt(ledgerInfo.closingBalance || ledgerInfo.currentBalance)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Last Transaction Date</p>
                          <p className="text-sm font-medium text-zinc-900">{ledgerInfo.lastTransactionDate ? new Date(ledgerInfo.lastTransactionDate).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    </div>
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

                {activeTab === 'source' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!sourceTx.sourceNumber && !journalInfo.sourceModule ? (
                      <EmptyState title="No Source Transaction" message="This is a manual journal entry line with no related source documents." icon={Network} />
                    ) : (
                      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-2xl">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                          <Network size={16} className="text-indigo-500" /> Source Transaction Details
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Module</p>
                            <p className="text-sm font-semibold text-zinc-900">{sourceTx.sourceModule || journalInfo.sourceModule || 'Manual'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Number</p>
                            <p className="text-sm font-mono font-medium text-blue-600 hover:underline cursor-pointer">{sourceTx.sourceNumber || journalInfo.sourceDocumentId || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Source Status</p>
                            <p className="text-sm font-medium text-zinc-900">{sourceTx.sourceStatus || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cost' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!costInfo.costCenter && !costInfo.department && !costInfo.project && !costInfo.branch ? (
                      <EmptyState title="No Cost Allocation" message="This journal line does not have any cost center or dimensions assigned." icon={Share2} />
                    ) : (
                      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-2xl">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                          <Share2 size={16} className="text-orange-500" /> Cost Allocation Details
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cost Center</p>
                            <p className="text-sm font-semibold text-zinc-900">{costInfo.costCenter || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Department</p>
                            <p className="text-sm font-medium text-zinc-900">{costInfo.department || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Project</p>
                            <p className="text-sm font-medium text-zinc-900">{costInfo.project || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Branch</p>
                            <p className="text-sm font-medium text-zinc-900">{costInfo.branch || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'approval' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!approvalInfo.approvalStatus ? (
                      <EmptyState title="No Approval Details" message="No approval workflow information found for this transaction." icon={CheckSquare} />
                    ) : (
                      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                          <CheckSquare size={16} className="text-emerald-500" /> Approval Workflow
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approval Status</p>
                            <StatusBadge status={approvalInfo.approvalStatus} />
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved By</p>
                            <p className="text-sm font-medium text-zinc-900">{approvalInfo.approvedBy || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approved Date</p>
                            <p className="text-sm font-medium text-zinc-900">{approvalInfo.approvedAt ? new Date(approvalInfo.approvedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="col-span-2 md:col-span-4 mt-2">
                             <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Approval Remarks</p>
                             <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{approvalInfo.approvalRemarks || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'posting' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!postingInfo.postingStatus && journalInfo.status !== 'POSTED' ? (
                      <EmptyState title="No Posting Information" message="This journal has not been posted to the general ledger yet." icon={FileDigit} />
                    ) : (
                      <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm max-w-3xl">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                          <FileDigit size={16} className="text-blue-500" /> Posting Information
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Status</p>
                            <StatusBadge status={postingInfo.postingStatus || (journalInfo.status === 'POSTED' ? 'POSTED' : 'UNPOSTED')} />
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posted By</p>
                            <p className="text-sm font-medium text-zinc-900">{postingInfo.postedBy || journalInfo.postedBy || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posted At</p>
                            <p className="text-sm font-medium text-zinc-900">{postingInfo.postedAt ? new Date(postingInfo.postedAt).toLocaleString() : journalInfo.postedAt ? new Date(journalInfo.postedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="col-span-2 md:col-span-3 mt-2">
                             <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Posting Remarks</p>
                             <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-md border border-zinc-100">{postingInfo.postingRemarks || journalInfo.postingRemarks || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                   <p className="text-sm font-bold text-zinc-900">Journal Line Created</p>
                                   <p className="text-xs text-zinc-500 mt-0.5">{line.createdAt ? new Date(line.createdAt).toLocaleString() : '-'} by {line.createdBy || 'System'}</p>
                                   <p className="text-sm text-zinc-700 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100">Journal Line was initialized.</p>
                                </div>
                             </div>
                             {line.updatedAt && (
                               <div className="relative">
                                  <span className="absolute -left-[26.4px] bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-full p-1"><Edit size={14}/></span>
                                  <div className="pl-4">
                                     <p className="text-sm font-bold text-zinc-900">Journal Line Updated</p>
                                     <p className="text-xs text-zinc-500 mt-0.5">{new Date(line.updatedAt).toLocaleString()} by {line.updatedBy || 'System'}</p>
                                     <p className="text-sm text-zinc-700 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100">Journal Line details were modified.</p>
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
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Journal Line"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Account ID *</label>
            <input
              type="text"
              value={editFormData.accountId}
              onChange={(e) => setEditFormData(prev => ({ ...prev, accountId: e.target.value }))}
              className="input-field w-full"
              placeholder="Enter Account UUID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Debit Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editFormData.debitAmount}
                onChange={(e) => setEditFormData(prev => {
                  const val = e.target.value;
                  return { ...prev, debitAmount: val, creditAmount: parseFloat(val) > 0 ? 0 : prev.creditAmount };
                })}
                className="input-field w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Credit Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editFormData.creditAmount}
                onChange={(e) => setEditFormData(prev => {
                  const val = e.target.value;
                  return { ...prev, creditAmount: val, debitAmount: parseFloat(val) > 0 ? 0 : prev.debitAmount };
                })}
                className="input-field w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Currency *</label>
              <CustomSelect
                value={editFormData.currencyCode}
                onChange={(e) => setEditFormData(prev => ({ ...prev, currencyCode: e.target.value }))}
                className="input-field w-full"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </CustomSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Exchange Rate *</label>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                value={editFormData.exchangeRate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex justify-between items-center">
            <span className="text-sm font-semibold text-zinc-600">Base Amount (Auto Calculated)</span>
            <span className="text-xl font-bold text-zinc-800">
              {(((parseFloat(editFormData.debitAmount) || 0) + (parseFloat(editFormData.creditAmount) || 0)) * (parseFloat(editFormData.exchangeRate) || 1)).toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Description</label>
            <textarea
              value={editFormData.lineDescription}
              onChange={(e) => setEditFormData(prev => ({ ...prev, lineDescription: e.target.value }))}
              className="input-field w-full min-h-[64px]"
              placeholder="Enter line description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLineMutation.isPending}
              className="btn-primary"
            >
              {updateLineMutation.isPending ? 'Saving...' : 'Save Line'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
