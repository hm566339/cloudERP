import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Download, FileText, ShoppingCart,
  Package, LayoutList, History, Activity, Calendar, Lock,
  Unlock, CheckCircle, AlertCircle, BarChart2, CreditCard, RefreshCw,
  Building2, DollarSign, Clock, ShieldAlert, CheckSquare, ChevronDown,
  Layers, GitCommit, Network, BookOpen, FileCheck, HelpCircle, IndianRupee, Edit2, Hash
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { chartOfAccountsApi } from '../../../api/account/chartOfAccounts';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import KPICard from '../../../components/common/KPICard';
import EmptyState from '../../../components/common/EmptyState';
import { useRoutePath } from '../../../hooks/useRoutePath';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function LedgerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: '',
    groupId: '',
    parentAccountId: '',
    postingAllowed: true,
    isActive: true,
    openingBalance: 0
  });

  const { data: response, isLoading, error, refetch } = useApiQuery(
    chartOfAccountsApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const account = (raw && typeof raw === 'object' && ('accountName' in raw || 'accountCode' in raw || 'id' in raw))
    ? raw
    : (raw?.data || raw);

  const updateMutation = useApiMutation(
    (payload) => chartOfAccountsApi.update(id, payload),
    {
      onSuccess: () => {
        dispatch(addAlert({ type: 'success', message: 'Chart of Account updated successfully' }));
        setIsEditModalOpen(false);
        refetch();
      },
      onError: (err) => {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to update account' }));
      }
    }
  );

  const handleOpenEditModal = () => {
    if (account) {
      setFormData({
        accountCode: account.accountCode || '',
        accountName: account.accountName || '',
        accountType: account.accountType || '',
        groupId: account.groupId || account.groupCode || '',
        parentAccountId: account.parentAccountId || account.parentAccountCode || '',
        postingAllowed: account.postingAllowed !== undefined ? account.postingAllowed : true,
        isActive: account.isActive !== undefined ? account.isActive : true,
        openingBalance: account.openingBalance || 0
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  if (isLoading) return <PageLoader message="Loading Chart of Account details..." />;

  if (error || !account) {
    return (
      <ErrorState
        title="Chart of Account Not Found"
        message={error?.message || "The requested account could not be found or you do not have permission to view it."}
        onRetry={refetch}
      />
    );
  }

  const bs = account.balanceSummary || {};
  const fs = account.financialSummary || {};
  const rec = account.reconciliationStatus || {};
  const audit = account.auditInformation || {};
  const group = account.groupInformation || account.accountGroup || {};

  const ledgerTransactions = account.ledgerTransactions || account.transactions || [];
  const journalEntries = account.journalEntries || [];
  const childAccounts = account.childAccounts || [];
  const relatedDocs = account.relatedDocuments || {};

  const paginate = (arr) => arr.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutList },
    { id: 'balance', label: 'Balance Summary', icon: BarChart2 },
    { id: 'ledger', label: 'Ledger Transactions', icon: BookOpen },
    { id: 'journals', label: 'Journal Entries', icon: FileText },
    { id: 'children', label: 'Child Accounts', icon: GitCommit },
    { id: 'documents', label: 'Related Documents', icon: FileCheck },
    { id: 'financial', label: 'Financial Summary', icon: Activity },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckSquare },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  const isEmpty = (arr) => !arr || arr.length === 0;

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Opening Balance"
        value={`₹${fmt(bs.openingBalance ?? account.openingBalance)}`}
        valueClass="text-blue-700"
        icon={IndianRupee}
      />
      <KPICard
        title="Current Balance"
        value={`₹${fmt(bs.currentBalance ?? account.currentBalance ?? account.openingBalance)}`}
        valueClass="text-blue-700"
        icon={Activity}
      />
      <KPICard
        title="Closing Balance"
        value={`₹${fmt(bs.closingBalance ?? account.closingBalance ?? account.openingBalance)}`}
        valueClass="text-blue-700"
        icon={CheckCircle}
      />
      <KPICard
        title="Total Debit"
        value={`₹${fmt(bs.totalDebit ?? account.totalDebit)}`}
        valueClass="text-rose-700"
        icon={ArrowLeft}
      />
      <KPICard
        title="Total Credit"
        value={`₹${fmt(bs.totalCredit ?? account.totalCredit)}`}
        valueClass="text-emerald-700"
        icon={BarChart2}
      />
      <KPICard
        title="Net Movement"
        value={`₹${fmt(fs.netMovement ?? account.netMovement)}`}
        valueClass="text-blue-700"
        icon={Activity}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Account',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'ACCOUNTS', action: 'UPDATE', behavior: 'disable' },
      onClick: handleOpenEditModal
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'primary',
      items: [
        { label: 'Print Account', icon: Printer, onClick: () => window.print() },
        { label: 'Export PDF', icon: Download, onClick: () => window.print() },
        { type: 'divider' },
        { label: 'View Ledger', icon: BookOpen, onClick: () => setActiveTab('ledger') },
        { label: 'View Journal Entries', icon: FileText, onClick: () => setActiveTab('journals') },
        { label: 'View Related Documents', icon: FileCheck, onClick: () => setActiveTab('documents') },
        { label: 'Reconcile Account', icon: CheckSquare, onClick: () => setActiveTab('reconciliation') }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: account.accountCode || 'N/A' },
    { icon: Activity, label: account.accountType || 'N/A' },
    { icon: account.postingAllowed ? CheckCircle : AlertCircle, label: account.postingAllowed ? 'Posting Allowed' : 'Posting Disabled' }
  ];

  const quickActions = [
    {
      label: 'Edit Account',
      icon: Edit2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      permission: { module: 'ACCOUNTS', action: 'UPDATE' },
      onClick: handleOpenEditModal
    },
    {
      label: 'View Ledger',
      icon: BookOpen,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => setActiveTab('ledger')
    },
    {
      label: 'Reconcile Account',
      icon: CheckSquare,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => setActiveTab('reconciliation')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      <EntityHeader
        onBack={() => navigate(buildPath('/accounts/masters/chart-of-accounts'))}
        title={account.accountName}
        badge={{ isActive: account.isActive }}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Account Details" icon={BookOpen} iconBg="bg-blue-50 dark:bg-blue-950/40" iconColor="text-blue-600 dark:text-blue-400">
              <div className="space-y-4">
                <InfoField label="Account Code" value={account.accountCode} mono />
                <InfoField label="Account Name" value={account.accountName} />
                <InfoField label="Account Type" value={account.accountType} />
              </div>
            </InfoCard>

            <InfoCard title="Group Information" icon={Layers} iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400">
              <div className="space-y-4">
                <InfoField label="Group Name" value={group.groupName || account.groupName} />
                <InfoField label="Group Code" value={group.groupCode || account.groupCode} mono />
                <InfoField label="Category" value={group.categoryName || account.categoryName} />
                <InfoField label="Nature" value={group.nature || account.nature} />
              </div>
            </InfoCard>

            <InfoCard title="Parent Account" icon={Network} iconBg="bg-purple-50 dark:bg-purple-950/40" iconColor="text-purple-600 dark:text-purple-400">
              <div className="space-y-4">
                <InfoField label="Parent Code" value={account.parentAccountCode} mono />
                <InfoField label="Parent Name" value={account.parentAccountName} />
              </div>
            </InfoCard>

            <QuickActionsCard title="Quick Actions" actions={quickActions} />
          </div>

          {/* RIGHT TABS AREA (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="bg-zinc-100/50 dark:bg-[#1D212C] p-1.5 rounded-lg border border-zinc-200/50 dark:border-[#2A2F3D] overflow-x-auto mb-6">
              <div className="flex items-center min-w-max gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-md transition-all outline-none ${
                      activeTab === tab.id 
                        ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60 dark:border-[#2A2F3D]' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-[#222736] border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  {/* Visual Representation (Balance vs Debit vs Credit) */}
                  <div className="bg-white dark:bg-[#161922] p-6 rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
                      <Activity size={16} className="text-zinc-500 dark:text-zinc-400" /> Account Utilization
                    </h3>
                    
                    <div className="relative pt-2">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40">
                            Total Credit: ₹{fmt(bs.totalCredit ?? account.totalCredit)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40">
                            Total Debit: ₹{fmt(bs.totalDebit ?? account.totalDebit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-zinc-100 dark:border-[#2A2F3D]">
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Current Balance</p>
                         <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">₹{fmt(bs.currentBalance ?? account.currentBalance ?? account.openingBalance)}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Opening Balance</p>
                         <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1">₹{fmt(bs.openingBalance ?? account.openingBalance)}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Closing Balance</p>
                         <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1">₹{fmt(bs.closingBalance ?? account.closingBalance ?? account.openingBalance)}</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BALANCE SUMMARY TAB */}
              {activeTab === 'balance' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Opening Balance', val: bs.openingBalance ?? account.openingBalance, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40' },
                      { label: 'Total Debit', val: bs.totalDebit ?? account.totalDebit, color: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/40' },
                      { label: 'Total Credit', val: bs.totalCredit ?? account.totalCredit, color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40' },
                      { label: 'Current Balance', val: bs.currentBalance ?? account.currentBalance ?? account.openingBalance, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40' },
                      { label: 'Closing Balance', val: bs.closingBalance ?? account.closingBalance ?? account.openingBalance, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40' },
                    ].map(({ label, val, color, border }) => (
                      <div key={label} className={`p-6 rounded-md border ${border} bg-white dark:bg-[#161922] shadow-sm flex flex-col`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>₹{fmt(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LEDGER TRANSACTIONS TAB */}
              {activeTab === 'ledger' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Ledger Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#222736] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{ledgerTransactions.length} Total</span>
                  </div>
                  {isEmpty(ledgerTransactions) ? (
                    <EmptyState icon={BookOpen} title="No Ledger Transactions" description="There are no ledger transactions recorded for this account." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[8.8px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Voucher No</th>
                            <th className="px-6 py-4">Voucher Type</th>
                            <th className="px-6 py-4">Party Name</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4 text-right">Debit</th>
                            <th className="px-6 py-4 text-right">Credit</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {paginate(ledgerTransactions).map((tx, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736]/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-zinc-600 dark:text-zinc-300">{tx.transactionDate || tx.date}</td>
                              <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">{tx.voucherNumber}</td>
                              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{tx.voucherType}</td>
                              <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">{tx.partyName || '-'}</td>
                              <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{tx.referenceNumber || '-'}</td>
                              <td className="px-6 py-4 text-right text-rose-600 dark:text-rose-400 font-bold">₹{fmt(tx.debit)}</td>
                              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{fmt(tx.credit)}</td>
                              <td className="px-6 py-4 text-right font-black text-zinc-900 dark:text-zinc-100">₹{fmt(tx.runningBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination
                        page={currentPage - 1}
                        totalPages={Math.ceil(ledgerTransactions.length / pageSize)}
                        totalElements={ledgerTransactions.length}
                        pageSize={pageSize}
                        onPageChange={(p) => setCurrentPage(p + 1)}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                        itemName="transactions"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* JOURNAL ENTRIES TAB */}
              {activeTab === 'journals' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Journal Entries</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#222736] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{journalEntries.length} Total</span>
                  </div>
                  {isEmpty(journalEntries) ? (
                    <EmptyState icon={FileText} title="No Journal Entries" description="There are no journal entries recorded for this account." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[8.8px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                          <tr>
                            <th className="px-6 py-4">Voucher No</th>
                            <th className="px-6 py-4">Voucher Type</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Debit</th>
                            <th className="px-6 py-4 text-right">Credit</th>
                            <th className="px-6 py-4">Narration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {paginate(journalEntries).map((je, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736]/50 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">{je.voucherNumber}</td>
                              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{je.voucherType}</td>
                              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">{je.transactionDate}</td>
                              <td className="px-6 py-4 text-right text-rose-600 dark:text-rose-400 font-bold">₹{fmt(je.debitAmount)}</td>
                              <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{fmt(je.creditAmount)}</td>
                              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-xs" title={je.narration}>{je.narration || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <Pagination
                        page={currentPage - 1}
                        totalPages={Math.ceil(journalEntries.length / pageSize)}
                        totalElements={journalEntries.length}
                        pageSize={pageSize}
                        onPageChange={(p) => setCurrentPage(p + 1)}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                        itemName="entries"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* CHILD ACCOUNTS TAB */}
              {activeTab === 'children' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Child Accounts</h3>
                  </div>
                  {isEmpty(childAccounts) ? (
                    <EmptyState icon={GitCommit} title="No Child Accounts" description="There are no child accounts under this account." />
                  ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginate(childAccounts).map((child, idx) => (
                        <div key={idx} className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
                            {child.accountName} 
                            <span className="font-mono text-[10px] bg-zinc-100 dark:bg-[#222736] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-zinc-300">{child.accountCode}</span>
                          </h4>
                          <div className="flex justify-between items-end mt-4">
                            <span className="text-lg font-black text-blue-700 dark:text-blue-400">₹{fmt(child.currentBalance)}</span>
                            <button
                              onClick={() => navigate(buildPath(`/accounts/masters/chart-of-accounts/${child.id}`))}
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 text-xs flex items-center gap-1"
                            >
                              View Account <ArrowLeft size={12} className="rotate-180" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RELATED DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="animate-fade-in space-y-6 max-w-4xl">
                  {['salesInvoices', 'purchaseBills', 'receipts', 'payments', 'creditNotes', 'debitNotes', 'journalVouchers'].every(k => isEmpty(relatedDocs[k])) ? (
                    <div className="bg-white dark:bg-[#161922] rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                      <EmptyState icon={FileCheck} title="No Related Documents" description="There are no related documents linked to this account." />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'salesInvoices', label: 'Sales Invoices', icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
                        { key: 'purchaseBills', label: 'Purchase Bills', icon: Package, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
                        { key: 'receipts', label: 'Receipt Vouchers', icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                        { key: 'payments', label: 'Payment Vouchers', icon: CreditCard, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                        { key: 'creditNotes', label: 'Credit Notes', icon: FileText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                        { key: 'debitNotes', label: 'Debit Notes', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                        { key: 'journalVouchers', label: 'Journal Vouchers', icon: BookOpen, color: 'text-zinc-600 dark:text-zinc-300', bg: 'bg-zinc-100 dark:bg-[#222736]' },
                      ].map(({ key, label, icon: Icon, color, bg }) => {
                        const docs = relatedDocs[key] || [];
                        if (docs.length === 0) return null;
                        
                        return (
                          <div key={key} className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                            <div className="px-4 py-3 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
                              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                                <span className={`p-1.5 rounded-md ${bg} ${color}`}><Icon size={14} /></span> {label}
                              </span>
                              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#161922] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{docs.length}</span>
                            </div>
                            <div className="p-4">
                              <ul className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                                {docs.slice(0, 5).map((d, idx) => (
                                  <li key={idx} className="py-2.5 flex items-center justify-between text-sm">
                                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{d.documentNumber || d.voucherNumber}</span>
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">₹{fmt(d.amount)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FINANCIAL SUMMARY TAB */}
              {activeTab === 'financial' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Current Month Debit', val: fs.currentMonthDebit ?? account.currentMonthDebit, color: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/40' },
                      { label: 'Current Month Credit', val: fs.currentMonthCredit ?? account.currentMonthCredit, color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40' },
                      { label: 'Financial Year Debit', val: fs.financialYearDebit ?? account.financialYearDebit, color: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/40' },
                      { label: 'Financial Year Credit', val: fs.financialYearCredit ?? account.financialYearCredit, color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40' },
                      { label: 'Net Movement', val: fs.netMovement ?? account.netMovement, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/40' },
                    ].map(({ label, val, color, border }) => (
                      <div key={label} className={`p-6 rounded-md border ${border} bg-white dark:bg-[#161922] shadow-sm flex flex-col`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>₹{fmt(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECONCILIATION TAB */}
              {activeTab === 'reconciliation' && (
                <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in max-w-3xl">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Reconciliation Status</h3>
                  </div>
                  <div className="p-6">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-2">
                        <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reconciled Status</dt>
                        <dd>
                          {rec.isReconciled || rec.reconciledStatus === 'RECONCILED' ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1.5">
                              <CheckCircle size={14} /> Reconciled
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1.5">
                              <AlertCircle size={14} /> Pending Reconciliation
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-2">
                        <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last Reconciliation Date</dt>
                        <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{rec.lastReconciliationDate || account.lastReconciliationDate || '-'}</dd>
                      </div>
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Outstanding Entries</dt>
                        <dd className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{rec.outstandingEntries || 0} entries pending</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* HIERARCHY TAB */}
              {activeTab === 'hierarchy' && (
                <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-8 animate-in fade-in max-w-2xl">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider mb-8 pb-4 border-b border-zinc-100 dark:border-[#2A2F3D] text-center">Account Hierarchy</h3>
                  <div className="flex flex-col items-center space-y-4 font-medium text-sm">
                    <div className="p-3 px-6 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800/60 text-center font-bold shadow-sm">
                      Category: {group.categoryName || account.categoryName || 'Chart of Accounts'}
                    </div>
                    <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                    <div className="p-3 px-6 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/60 text-center font-bold shadow-sm">
                      Group: {group.groupName || account.groupName || 'Account Group'}
                    </div>
                    {(account.parentAccountName || account.parentAccountCode) && (
                      <>
                        <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                        <div className="p-3 px-6 bg-zinc-50 dark:bg-[#1D212C] text-zinc-800 dark:text-zinc-200 rounded-md border border-zinc-200 dark:border-[#2A2F3D] text-center font-semibold shadow-sm">
                          Parent: {account.parentAccountName || account.parentAccountCode}
                        </div>
                      </>
                    )}
                    <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                    <div className="p-4 px-8 bg-zinc-900 dark:bg-blue-600 text-white rounded-md shadow-md text-center font-bold flex items-center gap-2">
                      <BookOpen size={18} /> Current Account: {account.accountName} ({account.accountCode})
                    </div>
                    {!isEmpty(childAccounts) && (
                      <>
                        <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
                        <div className="p-3 px-6 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800/60 text-center font-semibold shadow-sm">
                          Child Accounts ({childAccounts.length})
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* AUDIT LOG TAB */}
              {activeTab === 'audit' && (
                <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Audit Trail</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><ArrowLeft size={14} className="rotate-180" /> Created Record</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{audit.createdBy || account.createdBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{audit.createdAt || account.createdAt ? new Date(audit.createdAt || account.createdAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{audit.updatedBy || account.updatedBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{audit.updatedAt || account.updatedAt ? new Date(audit.updatedAt || account.updatedAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Chart of Account"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="accountCode"
                  value={formData.accountCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCode: e.target.value }))}
                  className="w-full h-10 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Type <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="accountType"
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full h-10 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                className="w-full h-10 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Opening Balance</label>
              <input
                type="number"
                step="0.01"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full h-10 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-sm font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
              />
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="postingAllowed"
                  checked={formData.postingAllowed}
                  onChange={(e) => setFormData(prev => ({ ...prev, postingAllowed: e.target.checked }))}
                  className="w-4 h-4 text-zinc-900 rounded-md border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Posting Allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-zinc-900 rounded-md border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-[#222736] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 rounded-md transition-all active:scale-95 disabled:opacity-50"
            >
              {updateMutation.isLoading && (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              Update Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
