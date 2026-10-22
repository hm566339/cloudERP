import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Printer, Download, FileText, LayoutList, 
  Layers, FolderTree, History, Activity, AlertCircle, CheckCircle, Wallet, Network,
  Hash, BookOpen, Building, ChevronDown, Edit2, ArrowRightLeft
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountCategoriesApi } from '../../../api/account/accountCategories';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import AccountCategoryForm from '../components/AccountCategoryForm';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import KPICard from '../../../components/common/KPICard';
import EmptyState from '../../../components/common/EmptyState';
import { useRoutePath } from '../../../hooks/useRoutePath';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

export default function AccountCategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    accountCategoriesApi.getById,
    id,
    { enabled: !!id }
  );

  const category = response?.data || response;

  const updateMutation = useApiMutation(accountCategoriesApi.update, {
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    }
  });

  if (isLoading) {
    return <PageLoader message="Loading account category details..." />;
  }

  if (error || !category) {
    return (
      <ErrorState 
        title="Account Category Not Found" 
        message={error?.message || "The requested account category could not be found or you do not have permission to view it."} 
        onRetry={refetch} 
      />
    );
  }

  const handleEditSubmit = async (payload) => {
    await updateMutation.mutateAsync({ id, data: payload });
  };

  const handlePrint = () => window.print();
  const handleExport = () => window.print();

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'groups', label: 'Account Groups', icon: Network },
    { id: 'ledgers', label: 'Ledger Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'journals', label: 'Journal Entries', icon: FileText },
    { id: 'hierarchy', label: 'Hierarchy', icon: FolderTree },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  const accountGroups = category.accountGroups || [];
  const ledgerAccounts = category.ledgerAccounts || [];
  const recentTransactions = category.recentTransactions || [];
  const journalEntries = category.journalEntries || [];
  const hierarchy = category.hierarchy || { groups: [], subGroups: [], ledgers: [] };

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Net Balance"
        value={`₹${fmt(Math.abs(category.netBalance || 0))}`}
        valueClass={(category.netBalance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}
        subtitle={(category.netBalance || 0) < 0 ? 'Credit (Cr)' : 'Debit (Dr)'}
        icon={Activity}
      />
      <KPICard
        title="Opening Bal."
        value={`₹${fmt(Math.abs(category.openingBalance || 0))}`}
        icon={Wallet}
      />
      <KPICard
        title="Total Debit"
        value={`₹${fmt(category.totalDebit || 0)}`}
        valueClass="text-rose-700"
        icon={ArrowLeft}
      />
      <KPICard
        title="Total Credit"
        value={`₹${fmt(category.totalCredit || 0)}`}
        valueClass="text-emerald-700"
        icon={Wallet}
      />
      <KPICard
        title="Groups / Ledgers"
        value={`${category.totalAccountGroups || 0} / ${category.totalLedgers || 0}`}
        icon={FolderTree}
      />
      <KPICard
        title="Active Ledgers"
        value={category.activeLedgers || category.totalLedgers || '0'}
        subtitle="Total"
        valueClass="text-emerald-600"
        icon={CheckCircle}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Category',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'ACCOUNT_CATEGORIES', action: 'UPDATE', behavior: 'disable' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'primary',
      items: [
        { label: 'Print Category', icon: Printer, onClick: handlePrint },
        { label: 'Export PDF', icon: Download, onClick: handleExport },
        { type: 'divider' },
        { label: 'View Groups', icon: Network, onClick: () => setActiveTab('groups') },
        { label: 'View Ledgers', icon: Wallet, onClick: () => setActiveTab('ledgers') }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: category.code || 'N/A' },
    { icon: Layers, label: category.nature || 'N/A' },
    { icon: Building, label: category.companyName || 'Global' }
  ];

  const quickActions = [
    {
      label: 'Edit Category',
      icon: Edit2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      permission: { module: 'ACCOUNT_CATEGORIES', action: 'UPDATE' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'View Groups',
      icon: Network,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => setActiveTab('groups')
    },
    {
      label: 'View Ledgers',
      icon: Wallet,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => setActiveTab('ledgers')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      <EntityHeader
        onBack={() => navigate(buildPath('/accounts/masters/account-categories'))}
        title={category.name}
        badge={{ isActive: !category.isDeleted }}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Category Summary" icon={Layers} iconBg="bg-blue-50" iconColor="text-blue-600">
              <div className="space-y-4">
                <InfoField label="Category Code" value={category.code} mono />
                <InfoField label="Category Name" value={category.name} />
                <InfoField label="Nature" value={category.nature} />
                <InfoField label="Company" value={category.companyName || 'Global'} />
                <InfoField label="Status" value={category.isDeleted ? 'Deleted' : 'Active'} />
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
                    <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  
                  <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Balance Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Opening Balance</p>
                        <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(category.openingBalance || 0))}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Debit</p>
                        <p className="text-xl font-black text-rose-600 dark:text-rose-400">₹{fmt(category.totalDebit || 0)}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Credit</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{fmt(category.totalCredit || 0)}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D] md:col-span-1">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Net Balance</p>
                        <p className={`text-xl font-black ${(category.netBalance || 0) < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ₹{fmt(Math.abs(category.netBalance || 0))}
                        </p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D] md:col-span-2">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Closing Balance</p>
                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">₹{fmt(Math.abs(category.closingBalance || category.netBalance || 0))}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Category Elements</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-5 border border-zinc-100 dark:border-[#2A2F3D] rounded-md bg-zinc-50 dark:bg-[#1D212C]">
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{category.totalAccountGroups || 0}</p>
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-2">Total Groups</p>
                        </div>
                        <div className="p-5 border border-zinc-100 dark:border-[#2A2F3D] rounded-md bg-zinc-50 dark:bg-[#1D212C]">
                          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{category.totalLedgers || 0}</p>
                          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-2">Total Ledgers</p>
                        </div>
                        <div className="p-5 border border-emerald-100 dark:border-emerald-800/60 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{category.activeLedgers || 0}</p>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-2">Active Ledgers</p>
                        </div>
                        <div className="p-5 border border-rose-100 dark:border-rose-800/60 rounded-md bg-rose-50 dark:bg-rose-950/30">
                          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{category.inactiveLedgers || 0}</p>
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mt-2">Inactive Ledgers</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ACCOUNT GROUPS TAB */}
              {activeTab === 'groups' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Account Groups</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{accountGroups.length || 0} Total</span>
                  </div>
                  {accountGroups.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Group Code</th>
                            <th className="p-4">Group Name</th>
                            <th className="p-4">Parent Group</th>
                            <th className="p-4 text-center">Total Ledgers</th>
                            <th className="p-4 text-right">Opening Balance</th>
                            <th className="p-4 text-right">Current Balance</th>
                            <th className="p-4 text-right">Closing Balance</th>
                            <th className="p-4 text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {accountGroups.map(grp => (
                            <tr key={grp.id} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">{grp.code}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{grp.name}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400">{grp.parentGroupName || '-'}</td>
                              <td className="p-4 text-center font-medium text-zinc-900 dark:text-zinc-100">{grp.totalLedgers || 0}</td>
                              <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(grp.openingBalance || 0))}</td>
                              <td className={`p-4 text-right font-bold ${(grp.currentBalance || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                ₹{fmt(Math.abs(grp.currentBalance || 0))}
                              </td>
                              <td className="p-4 text-right font-black text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(grp.closingBalance || 0))}</td>
                              <td className="p-4 text-right sticky right-0 bg-white dark:bg-[#161922] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                <button 
                                  onClick={() => navigate(buildPath(`/accounts/masters/account-groups/${grp.id}`))}
                                  className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Network} title="No Account Groups" description="There are no account groups associated with this category." />
                  )}
                </div>
              )}

              {/* LEDGER ACCOUNTS TAB */}
              {activeTab === 'ledgers' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Ledger Accounts</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{ledgerAccounts.length || 0} Total</span>
                  </div>
                  {ledgerAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Ledger Code</th>
                            <th className="p-4">Ledger Name</th>
                            <th className="p-4">Group Name</th>
                            <th className="p-4 text-right">Opening Balance</th>
                            <th className="p-4 text-right">Current Balance</th>
                            <th className="p-4 text-right">Closing Balance</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {ledgerAccounts.map(ledger => (
                            <tr key={ledger.id} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">{ledger.code}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{ledger.name}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400">{ledger.groupName || '-'}</td>
                              <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(ledger.openingBalance || 0))}</td>
                              <td className={`p-4 text-right font-bold ${(ledger.currentBalance || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                ₹{fmt(Math.abs(ledger.currentBalance || 0))}
                              </td>
                              <td className="p-4 text-right font-black text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(ledger.closingBalance || 0))}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ledger.isActive !== false ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' : 'bg-zinc-100 dark:bg-[#2A2F3D] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>
                                  {ledger.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right sticky right-0 bg-white dark:bg-[#161922] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                <button className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 text-xs">View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={Wallet} title="No Ledger Accounts" description="There are no ledger accounts associated with this category." />
                  )}
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Recent Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{recentTransactions.length || 0} Total</span>
                  </div>
                  {recentTransactions.length > 0 ? (
                    <div className="p-6">
                      <div className="relative border-l-2 border-zinc-200 dark:border-[#2A2F3D] ml-4 space-y-8">
                        {recentTransactions.map((txn, idx) => (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white dark:bg-[#161922] border-2 border-zinc-300 dark:border-zinc-600"></div>
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{txn.voucherType || 'Transaction'} <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs font-normal ml-2">{txn.voucherNumber}</span></h4>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{txn.date ? new Date(txn.date).toLocaleDateString() : '-'}</span>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium mb-2">{txn.ledgerName || 'Unknown Ledger'}</p>
                            <div className="flex gap-4 mb-2">
                              {txn.debit > 0 && <span className="text-xs font-bold px-2 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-800/60">Dr: ₹{fmt(txn.debit)}</span>}
                              {txn.credit > 0 && <span className="text-xs font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-800/60">Cr: ₹{fmt(txn.credit)}</span>}
                            </div>
                            {txn.remarks && <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-md border border-zinc-100 dark:border-[#2A2F3D]">{txn.remarks}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={Activity} title="No Recent Transactions" description="There are no recent transactions associated with this category." />
                  )}
                </div>
              )}

              {/* JOURNAL ENTRIES TAB */}
              {activeTab === 'journals' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Journal Entries</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{journalEntries.length || 0} Total</span>
                  </div>
                  {journalEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Voucher Number</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-right">Debit</th>
                            <th className="p-4 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {journalEntries.map((je, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{je.transactionDate ? new Date(je.transactionDate).toLocaleDateString() : '-'}</td>
                              <td className="p-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">{je.voucherNumber}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium">{je.voucherType}</td>
                              <td className="p-4 text-right text-rose-600 dark:text-rose-400 font-bold">₹{fmt(je.debit || 0)}</td>
                              <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{fmt(je.credit || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="No Journal Entries" description="There are no journal entries found for this category." />
                  )}
                </div>
              )}

              {/* HIERARCHY TAB */}
              {activeTab === 'hierarchy' && (
                <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-8 animate-in fade-in overflow-x-auto">
                  <div className="flex flex-col items-center max-w-lg mx-auto">
                    
                    <div className="w-full text-center p-4 rounded-xl border-2 border-zinc-900 dark:border-zinc-400 bg-white dark:bg-[#1D212C] shadow-md relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 dark:bg-zinc-400 rounded-full border-2 border-white dark:border-[#1D212C]"></div>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Category</p>
                      <p className="font-black text-zinc-900 dark:text-zinc-100 text-xl">{category.name}</p>
                      <p className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 mt-1">{category.code}</p>
                    </div>

                    {hierarchy.groups && hierarchy.groups.length > 0 ? (
                      <>
                        <div className="h-8 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 my-1 relative">
                          <div className="absolute top-1/2 left-0 w-full flex justify-between" style={{width: Math.min(hierarchy.groups.length * 150, 400) + 'px', transform: 'translateX(-50%)'}}>
                            <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 w-full"></div>
                          </div>
                        </div>
                        <div className="flex gap-4 justify-center flex-wrap" style={{width: 'max-content'}}>
                          {hierarchy.groups.map(child => (
                            <div key={child.id} className="w-40 text-center p-3 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] shadow-sm flex-shrink-0 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-md transition-all" onClick={() => navigate(buildPath(`/accounts/masters/account-groups/${child.id}`))}>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={child.name}>{child.name}</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mt-1">{child.code}</p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-semibold bg-zinc-100 dark:bg-[#222736] inline-block px-1.5 py-0.5 rounded-md">GROUP</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-8 text-center text-zinc-400 dark:text-zinc-500 italic">No groups under this category</div>
                    )}

                  </div>
                </div>
              )}

              {/* AUDIT LOG TAB */}
              {activeTab === 'audit' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Audit Trail</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><ArrowRightLeft size={14} /> Created Record</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{category.createdBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{category.createdAt ? new Date(category.createdAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{category.updatedBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{category.updatedAt ? new Date(category.updatedAt).toLocaleString() : '-'}</p>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Category" size="md">
        <AccountCategoryForm 
          initialData={category}
          onSubmit={handleEditSubmit} 
          onCancel={() => setIsEditModalOpen(false)} 
          isLoading={updateMutation.isLoading}
        />
      </Modal>
    </div>
  );
}
