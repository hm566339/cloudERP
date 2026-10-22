import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Printer, Download, FileText, LayoutList, 
  Layers, FolderTree, History, Activity, AlertCircle, CheckCircle, Wallet,
  Building, Hash, BookOpen, ChevronDown, Edit2, Network, ArrowRightLeft
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountGroupsApi } from '../../../api/account/accountGroups';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import AccountGroupForm from '../components/AccountGroupForm';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import KPICard from '../../../components/common/KPICard';
import EmptyState from '../../../components/common/EmptyState';
import { useRoutePath } from '../../../hooks/useRoutePath';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

export default function AccountGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    accountGroupsApi.getById,
    id,
    { enabled: !!id }
  );

  const group = response?.data || response;

  const updateMutation = useApiMutation(accountGroupsApi.update, {
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    }
  });

  if (isLoading) {
    return <PageLoader message="Loading account group details..." />;
  }

  if (error || !group) {
    return (
      <ErrorState 
        title="Account Group Not Found" 
        message={error?.message || "The requested account group could not be found or you do not have permission to view it."} 
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
    { id: 'ledgers', label: 'Ledger Accounts', icon: Wallet },
    { id: 'children', label: 'Child Groups', icon: FolderTree },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'journals', label: 'Journal Entries', icon: FileText },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Net Balance"
        value={`₹${fmt(Math.abs(group.netBalance || 0))}`}
        valueClass={(group.netBalance || 0) < 0 ? 'text-emerald-600' : 'text-rose-600'}
        subtitle={(group.netBalance || 0) < 0 ? 'Credit (Cr)' : 'Debit (Dr)'}
        icon={Activity}
      />
      <KPICard
        title="Opening Bal."
        value={`₹${fmt(Math.abs(group.openingBalance || 0))}`}
        icon={Wallet}
      />
      <KPICard
        title="Total Debit"
        value={`₹${fmt(group.totalDebit || 0)}`}
        valueClass="text-rose-700"
        icon={ArrowLeft}
      />
      <KPICard
        title="Total Credit"
        value={`₹${fmt(group.totalCredit || 0)}`}
        valueClass="text-emerald-700"
        icon={Wallet}
      />
      <KPICard
        title="Child / Ledgers"
        value={`${group.totalChildGroups || 0} / ${group.totalLedgers || 0}`}
        icon={FolderTree}
      />
      <KPICard
        title="Active Ledgers"
        value={group.activeLedgerCount || group.totalLedgers || '0'}
        subtitle="Total"
        valueClass="text-emerald-600"
        icon={CheckCircle}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Group',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'ACCOUNT_GROUPS', action: 'UPDATE', behavior: 'disable' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'primary',
      items: [
        { label: 'Print Group', icon: Printer, onClick: handlePrint },
        { label: 'Export PDF', icon: Download, onClick: handleExport },
        { type: 'divider' },
        { label: 'View Ledgers', icon: Wallet, onClick: () => setActiveTab('ledgers') },
        { label: 'View Journal Entries', icon: FileText, onClick: () => setActiveTab('journals') }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: group.code || 'N/A' },
    { icon: Layers, label: group.categoryName || 'No Category' },
    { icon: FolderTree, label: `Parent: ${group.parentGroupName || 'Root'}` }
  ];

  const quickActions = [
    {
      label: 'Edit Group',
      icon: Edit2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      permission: { module: 'ACCOUNT_GROUPS', action: 'UPDATE' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'View Ledgers',
      icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => setActiveTab('ledgers')
    },
    {
      label: 'View Journal Entries',
      icon: FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => setActiveTab('journals')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      <EntityHeader
        onBack={() => navigate(buildPath('/accounts/masters/account-groups'))}
        title={group.name}
        badge={{ isActive: !group.deleted }}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Group Summary" icon={Layers} iconBg="bg-blue-50" iconColor="text-blue-600">
              <div className="space-y-4">
                <InfoField label="Group Code" value={group.code} mono />
                <InfoField label="Group Name" value={group.name} />
                <InfoField label="Status" value={group.deleted ? 'Deleted' : 'Active'} />
              </div>
            </InfoCard>

            <InfoCard title="Hierarchy Details" icon={FolderTree} iconBg="bg-emerald-50" iconColor="text-emerald-600">
              <div className="space-y-4">
                <InfoField label="Category" value={group.categoryName || '-'} />
                <InfoField label="Parent Group" value={group.parentGroupName || 'Root'} />
                <InfoField label="Hierarchy Level" value={group.levelDepth ?? group.level ?? 1} />
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
                        <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(group.openingBalance || 0))}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Debit</p>
                        <p className="text-xl font-black text-rose-600 dark:text-rose-400">₹{fmt(group.totalDebit || 0)}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Credit</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{fmt(group.totalCredit || 0)}</p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D] md:col-span-1">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Net Balance</p>
                        <p className={`text-xl font-black ${(group.netBalance || 0) < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₹{fmt(Math.abs(group.netBalance || 0))}
                        </p>
                      </div>
                      <div className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D] md:col-span-2">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Closing Balance</p>
                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">₹{fmt(Math.abs(group.closingBalance || group.netBalance || 0))}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                      <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Category Details</h3>
                      </div>
                      <div className="p-6">
                        <dl className="space-y-6">
                          <div>
                            <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category Name</dt>
                            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{group.categoryName || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category Type</dt>
                            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{group.categoryType || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Description</dt>
                            <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{group.description || 'No description provided.'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                      <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Parent Group</h3>
                      </div>
                      <div className="p-6 h-[calc(100%-53px)]">
                        {group.parentGroupId ? (
                          <dl className="space-y-6">
                            <div>
                              <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Parent Group Name</dt>
                              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{group.parentGroupName}</dd>
                            </div>
                            <div>
                              <dt className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Parent Group Code</dt>
                              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono">{group.parentGroupCode || '-'}</dd>
                            </div>
                          </dl>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-500">
                            <FolderTree size={32} className="mb-2 opacity-20" />
                            <p className="text-sm font-medium italic">Root Group</p>
                            <p className="text-xs">This group has no parent.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* LEDGER ACCOUNTS TAB */}
              {activeTab === 'ledgers' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Ledger Accounts</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{group.ledgerAccounts?.length || 0} Total</span>
                  </div>
                  {group.ledgerAccounts && group.ledgerAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Ledger Code</th>
                            <th className="p-4">Ledger Name</th>
                            <th className="p-4 text-right">Opening Balance</th>
                            <th className="p-4 text-right">Current Balance</th>
                            <th className="p-4 text-right">Closing Balance</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {group.ledgerAccounts.map(ledger => (
                            <tr key={ledger.id} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">{ledger.code}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{ledger.name}</td>
                              <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{fmt(Math.abs(ledger.openingBalance || 0))}</td>
                              <td className={`p-4 text-right font-bold ${(ledger.currentBalance || 0) < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
                    <EmptyState icon={Wallet} title="No Ledger Accounts" description="There are no ledger accounts associated with this group." />
                  )}
                </div>
              )}

              {/* CHILD GROUPS TAB */}
              {activeTab === 'children' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Child Groups</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{group.childGroups?.length || 0} Total</span>
                  </div>
                  {group.childGroups && group.childGroups.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Group Code</th>
                            <th className="p-4">Group Name</th>
                            <th className="p-4 text-center">Total Ledgers</th>
                            <th className="p-4 text-right">Total Balance</th>
                            <th className="p-4 text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {group.childGroups.map(child => (
                            <tr key={child.id} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">{child.code}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{child.name}</td>
                              <td className="p-4 text-center font-bold text-zinc-700 dark:text-zinc-300">{child.totalLedgers || 0}</td>
                              <td className={`p-4 text-right font-black ${(child.netBalance || 0) < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                ₹{fmt(Math.abs(child.netBalance || 0))}
                              </td>
                              <td className="p-4 text-right sticky right-0 bg-white dark:bg-[#161922] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                <button 
                                  onClick={() => navigate(buildPath(`/accounts/masters/account-groups/${child.id}`))}
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
                    <EmptyState icon={FolderTree} title="No Child Groups" description="This group does not have any sub-groups." />
                  )}
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Recent Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{group.transactions?.length || 0} Total</span>
                  </div>
                  {group.transactions && group.transactions.length > 0 ? (
                    <div className="p-6">
                      <div className="relative border-l-2 border-zinc-200 dark:border-[#2A2F3D] ml-4 space-y-8">
                        {group.transactions.map((txn, idx) => (
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
                    <EmptyState icon={Activity} title="No Recent Transactions" description="There are no recent transactions associated with this group." />
                  )}
                </div>
              )}

              {/* JOURNAL ENTRIES TAB */}
              {activeTab === 'journals' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Journal Entries</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{group.journalEntries?.length || 0} Total</span>
                  </div>
                  {group.journalEntries && group.journalEntries.length > 0 ? (
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
                          {group.journalEntries.map((je, idx) => (
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
                    <EmptyState icon={FileText} title="No Journal Entries" description="There are no journal entries found for this group." />
                  )}
                </div>
              )}

              {/* HIERARCHY TAB */}
              {activeTab === 'hierarchy' && (
                <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] p-8 animate-in fade-in overflow-x-auto">
                  <div className="flex flex-col items-center max-w-lg mx-auto">
                    
                    {group.parentGroupName && (
                      <>
                        <div className="w-full text-center p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] shadow-sm cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-all" onClick={() => group.parentGroupId && navigate(buildPath(`/accounts/masters/account-groups/${group.parentGroupId}`))}>
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Parent Group</p>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{group.parentGroupName}</p>
                        </div>
                        <div className="h-8 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 my-1"></div>
                      </>
                    )}

                    <div className="w-full text-center p-4 rounded-xl border-2 border-zinc-900 dark:border-zinc-400 bg-white dark:bg-[#1D212C] shadow-md relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 dark:bg-zinc-400 rounded-full border-2 border-white dark:border-[#1D212C]"></div>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Current Group (Level {group.levelDepth ?? 1})</p>
                      <p className="font-black text-zinc-900 dark:text-zinc-100 text-xl">{group.name}</p>
                      <p className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 mt-1">{group.code}</p>
                    </div>

                    {group.childGroups && group.childGroups.length > 0 && (
                      <>
                        <div className="h-8 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 my-1 relative">
                          <div className="absolute top-1/2 left-0 w-full flex justify-between" style={{width: Math.min(group.childGroups.length * 150, 400) + 'px', transform: 'translateX(-50%)'}}>
                            <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 w-full"></div>
                          </div>
                        </div>
                        <div className="flex gap-4 justify-center flex-wrap" style={{width: 'max-content'}}>
                          {group.childGroups.map(child => (
                            <div key={child.id} className="w-40 text-center p-3 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] shadow-sm flex-shrink-0 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-md transition-all" onClick={() => navigate(buildPath(`/accounts/masters/account-groups/${child.id}`))}>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={child.name}>{child.name}</p>
                              <p className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mt-1">{child.code}</p>
                            </div>
                          ))}
                        </div>
                      </>
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
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{group.createdBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{group.createdAt ? new Date(group.createdAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{group.updatedBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{group.updatedAt ? new Date(group.updatedAt).toLocaleString() : '-'}</p>
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Account Group" size="md">
        <AccountGroupForm 
          initialData={group}
          onSubmit={handleEditSubmit} 
          onCancel={() => setIsEditModalOpen(false)} 
          isLoading={updateMutation.isLoading}
        />
      </Modal>
    </div>
  );
}
