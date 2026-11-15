import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { PageHeader, ConfirmModal, StatusBadge } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmAccountsQuery,
  useOnboardAccountToErpMutation,
} from '../../../api/sales-crm/crm.api';
import AccountFormModal from '../components/AccountFormModal';

export default function AccountsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [page, setPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [onboardingAccount, setOnboardingAccount] = useState(null);

  const { data: accountsRes, isLoading, refetch } = useGetCrmAccountsQuery({
    companyId,
    search: searchTerm || undefined,
    tier: selectedTier || undefined,
    page,
    size: 15,
  });

  const [onboardAccount, { isLoading: isOnboarding }] = useOnboardAccountToErpMutation();

  const accounts = accountsRes?.data?.content || accountsRes?.data || [];
  const totalElements = accountsRes?.data?.totalElements || accounts.length;

  const handleOnboardConfirm = async () => {
    if (!onboardingAccount) return;
    try {
      await onboardAccount({ id: onboardingAccount.id, companyId }).unwrap();
      setOnboardingAccount(null);
      refetch();
    } catch (err) {
      console.error('Failed to onboard account to ERP', err);
    }
  };

  const columns = [
    {
      header: 'Account & Industry',
      accessorKey: 'accountName',
      cell: ({ row }) => {
        const acc = row.original;
        return (
          <div className="space-y-0.5">
            <button
              onClick={() => navigate(`/sales-crm/accounts/${acc.id}`)}
              className="font-semibold text-zinc-900 dark:text-white hover:text-primary text-xs text-left block transition-colors"
            >
              {acc.accountName || acc.name}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span>{acc.industry || 'Commercial Enterprise'}</span>
              {acc.pan && <span className="font-mono text-[10px] bg-zinc-100 dark:bg-[#1C202B] px-1 rounded">PAN: {acc.pan}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Corporate Tier',
      accessorKey: 'accountTier',
      cell: ({ row }) => {
        const tier = row.original.accountTier || 'SMB';
        let color = 'bg-zinc-100 text-zinc-600';
        if (tier === 'STRATEGIC') color = 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
        else if (tier === 'ENTERPRISE') color = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
        else if (tier === 'MID_MARKET') color = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
            {tier}
          </span>
        );
      },
    },
    {
      header: 'Financial Limits',
      accessorKey: 'creditLimit',
      cell: ({ row }) => {
        const acc = row.original;
        return (
          <div className="space-y-0.5 text-xs">
            <span className="font-mono font-semibold text-zinc-800 dark:text-[#E6E8EE]">
              Limit: ₹{(acc.creditLimit || 0).toLocaleString('en-IN')}
            </span>
            <span className="block text-[11px] text-zinc-500">
              Terms: {acc.paymentTerms || 'NET_30'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'GSTIN',
      accessorKey: 'gstin',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {row.original.gstin || 'Unregistered'}
        </span>
      ),
    },
    {
      header: 'ERP Status',
      accessorKey: 'erpCustomerId',
      cell: ({ row }) => {
        const hasErp = !!row.original.erpCustomerId;
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit ${
            hasErp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 dark:bg-[#1C202B] text-zinc-500'
          }`}>
            <ShieldCheck size={11} /> {hasErp ? 'Onboarded' : 'CRM Only'}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const acc = row.original;
        const hasErp = !!acc.erpCustomerId;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {!hasErp && (
              <button
                onClick={() => setOnboardingAccount(acc)}
                className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                title="Sync and create Ledger Customer in ERP Account service"
              >
                <UserCheck size={12} /> Sync to ERP
              </button>
            )}
            <button
              onClick={() => setEditingAccount(acc)}
              className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="Edit Account"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => navigate(`/sales-crm/accounts/${acc.id}`)}
              className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="View Account Dossier"
            >
              <ExternalLink size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Corporate Accounts"
        subtitle={`Managing ${totalElements} B2B accounts, credit limits, and ERP customer ledgers.`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Account
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search accounts, PAN, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
        >
          <option value="">All Account Tiers</option>
          <option value="STRATEGIC">Strategic Accounts</option>
          <option value="ENTERPRISE">Enterprise Accounts</option>
          <option value="MID_MARKET">Mid-Market Accounts</option>
          <option value="SMB">SMB Accounts</option>
        </select>
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

      <AccountFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <AccountFormModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        initialData={editingAccount}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <ConfirmModal
        isOpen={!!onboardingAccount}
        onClose={() => setOnboardingAccount(null)}
        onConfirm={handleOnboardConfirm}
        title="Onboard to ERP Accounts Service"
        message={`This will register "${onboardingAccount?.accountName}" as an active Sundry Debtor customer ledger in the Accounting & Finance service, establishing financial credit checks.`}
        confirmText={isOnboarding ? 'Onboarding...' : 'Confirm Onboarding'}
        variant="primary"
      />
    </div>
  );
}

