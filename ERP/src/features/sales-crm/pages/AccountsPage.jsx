import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Eye,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import ConfirmModal from '../../../components/common/ConfirmModal';
import {
  useGetCrmAccountsQuery,
  useOnboardAccountToErpMutation,
} from '../../../api/sales-crm/crm.api';
import AccountFormModal from '../components/AccountFormModal';
import useCrmPermissions from '../hooks/useCrmPermissions';

const DEFAULT_COLUMNS = [
  'accountName',
  'accountTier',
  'taxDetails',
  'creditLimit',
  'outstandingBalance',
  'status'
];

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';
};

export default function AccountsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [onboardingAccount, setOnboardingAccount] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: accountsRes, isLoading, refetch, isFetching } = useGetCrmAccountsQuery({
    companyId,
    search: filters.searchKey || undefined,
    tier: filters.tier || undefined,
    page,
    size: apiParams.size || 10,
  });

  const [onboardAccount, { isLoading: isOnboarding }] = useOnboardAccountToErpMutation();

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const accounts = toArray(accountsRes);
  const totalElements = accountsRes?.data?.totalElements || accountsRes?.totalElements || accounts.length;

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

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

  const basicFilters = useMemo(() => [
    {
      id: 'tier',
      label: 'Account Tier',
      type: 'select',
      options: [
        { label: 'All Account Tiers', value: '' },
        { label: 'Strategic Accounts', value: 'STRATEGIC' },
        { label: 'Enterprise Accounts', value: 'ENTERPRISE' },
        { label: 'Mid-Market Accounts', value: 'MID_MARKET' },
        { label: 'SMB Accounts', value: 'SMB' },
      ]
    }
  ], []);

  const columns = useMemo(() => [
    {
      id: 'accountName',
      label: 'Account & Industry',
      sortable: true,
      render: (val, acc) => (
        <div className="space-y-0.5">
          <button
            onClick={() => navigate(`${crmBase}/accounts/${acc.id}`)}
            className="font-semibold text-zinc-900 dark:text-white hover:text-primary text-xs text-left block transition-colors"
          >
            {acc.accountName || acc.name}
          </button>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>{acc.industry || 'Commercial Enterprise'}</span>
            {acc.accountCode && <span className="font-mono text-[10px] bg-zinc-100 dark:bg-[#1C202B] px-1 rounded">{acc.accountCode}</span>}
          </div>
        </div>
      )
    },
    {
      id: 'accountTier',
      label: 'Corporate Tier',
      sortable: true,
      render: (val, acc) => {
        const tier = acc.accountTier || 'SMB';
        let color = 'bg-zinc-100 text-zinc-600';
        if (tier === 'STRATEGIC') color = 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
        else if (tier === 'ENTERPRISE') color = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
        else if (tier === 'MID_MARKET') color = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
            {tier}
          </span>
        );
      }
    },
    {
      id: 'taxDetails',
      label: 'PAN / GSTIN',
      sortable: false,
      render: (val, acc) => (
        <div className="text-xs space-y-0.5 font-mono">
          {acc.pan && <span className="text-zinc-700 dark:text-[#A0A6B5] block">PAN: {acc.pan}</span>}
          {acc.gstin && <span className="text-zinc-500 text-[11px] block">GST: {acc.gstin}</span>}
          {!acc.pan && !acc.gstin && <span className="text-zinc-400 text-xs">-</span>}
        </div>
      )
    },
    {
      id: 'creditLimit',
      label: 'Credit Limit',
      sortable: true,
      align: 'right',
      render: (val, acc) => (
        <span className="font-medium text-zinc-900 dark:text-white font-mono text-xs">
          {formatAmount(acc.creditLimit)}
        </span>
      )
    },
    {
      id: 'outstandingBalance',
      label: 'Outstanding',
      sortable: true,
      align: 'right',
      render: (val, acc) => (
        <span className={`font-mono text-xs font-semibold ${acc.outstandingBalance > 0 ? 'text-rose-600' : 'text-zinc-700 dark:text-[#A0A6B5]'}`}>
          {formatAmount(acc.outstandingBalance)}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      render: (val, acc) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${acc.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
          {acc.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], [crmBase, navigate]);

  const { accounts: accountPerms } = useCrmPermissions();

  const rowActions = useMemo(() => {
    const actions = [];
    if (accountPerms.canRead) {
      actions.push({
        key: 'view',
        label: 'View Dossier',
        icon: Eye,
        onClick: (row) => navigate(`${crmBase}/accounts/${row.id}`),
        tooltip: 'View Account Dossier',
        className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
      });
    }
    if (accountPerms.canOnboard) {
      actions.push({
        key: 'sync',
        label: 'Sync to ERP',
        icon: UserCheck,
        onClick: (row) => setOnboardingAccount(row),
        tooltip: 'Sync and create Customer Ledger in ERP',
        className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      });
    }
    if (accountPerms.canUpdate) {
      actions.push({
        key: 'edit',
        label: 'Edit Account',
        icon: Edit2,
        onClick: (row) => setEditingAccount(row),
        tooltip: 'Edit Account',
        className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
      });
    }
    return actions;
  }, [crmBase, navigate, accountPerms.canRead, accountPerms.canOnboard, accountPerms.canUpdate]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Account Management"
        description={`Managing ${totalElements} corporate accounts, credit limits, and client profiles.`}
      >
        {accountPerms.canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={16} />
            <span>New Account</span>
          </button>
        )}
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="CRM_ACCOUNTS"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={accounts}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search accounts, PAN, GSTIN..."
          onSearchChange={(val) => setFilter('searchKey', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Reset & Refresh
          onReset={handleReset}
          onRefresh={refetch}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size || 10,
            totalPages: Math.ceil(totalElements / (apiParams.size || 10)) || 1,
            totalElements: totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="accounts"

          // Empty State
          emptyMessage="No accounts found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find corporate accounts."
        />
      </div>

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
