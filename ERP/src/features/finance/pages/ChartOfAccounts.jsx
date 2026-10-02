import React, { useState, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle,
  Download, BookOpen, BookMarked
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetAccountGroupsQuery, chartOfAccountsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import usePermission from '../../../hooks/usePermission';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import ChartOfAccountsModal from '../components/ChartOfAccountsModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'accountCode',
  'accountName',
  'groupName',
  'parentAccount',
  'accountType',
  'openingBalance',
  'postingAllowed',
  'isActive'
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'All Account Types' },
  { value: 'AST', label: 'Asset' },
  { value: 'LIA', label: 'Liability' },
  { value: 'EQU', label: 'Equity' },
  { value: 'REV', label: 'Revenue' },
  { value: 'EXP', label: 'Expense' }
];

export default function ChartOfAccounts() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const location = useLocation();
  const canCreate = usePermission('CHART_OF_ACCOUNTS', 'CREATE');
  const canUpdate = usePermission('CHART_OF_ACCOUNTS', 'UPDATE');
  const canDelete = usePermission('CHART_OF_ACCOUNTS', 'DELETE');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 });

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.content && Array.isArray(res.content)) return res.content;
    return [];
  };

  const groups = extractArray(groupsResponse);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'accountCode', defaultSortOrder: 'asc' });

  // Dynamically build filter payload without empty or null values
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.accountCode && filters.accountCode.trim()) q.accountCode = filters.accountCode.trim();
    if (filters.accountName && filters.accountName.trim()) q.accountName = filters.accountName.trim();
    if (filters.groupId && filters.groupId.trim()) q.groupId = filters.groupId.trim();
    if (filters.accountType && filters.accountType.trim()) q.accountTypes = [filters.accountType.trim()];

    if (filters.postingAllowed !== undefined && filters.postingAllowed !== '') {
      q.postingAllowed = filters.postingAllowed === 'true' || filters.postingAllowed === true;
    }
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;
    if (filters.updatedFrom) q.updatedFrom = filters.updatedFrom;
    if (filters.updatedTo) q.updatedTo = filters.updatedTo;

    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters,
    page,
    size: apiParams.size || 10,
    sortBy: sortBy || 'accountCode',
    sortDir: sortOrder || 'asc'
  }), [queryFilters, page, apiParams.size, sortBy, sortOrder]);

  const { data: apiData, isLoading, refetch, isFetching } = useApiQuery(
    chartOfAccountsApi.getList,
    finalParams,
    { keepPreviousData: true }
  );

  const rawAccounts = extractArray(apiData);

  const extractedTotalElements = apiData?._pageInfo?.totalElements ||
    apiData?.paginationResponse?.totalElements ||
    apiData?.pagination?.totalElements ||
    apiData?.data?.paginationResponse?.totalElements ||
    apiData?.data?.pagination?.totalElements ||
    apiData?.totalElements ||
    apiData?.data?.totalElements ||
    rawAccounts.length;

  const currentSize = apiParams.size || 10;

  const pageInfo = {
    totalPages: Math.ceil(extractedTotalElements / currentSize) || 1,
    totalElements: extractedTotalElements
  };

  const isFullyLoaded = rawAccounts.length === extractedTotalElements && rawAccounts.length > 0;
  const accounts = isFullyLoaded
    ? rawAccounts.slice(page * currentSize, (page + 1) * currentSize)
    : rawAccounts;

  // Fetch all accounts for Parent Account modal dropdown (only when modal is open)
  const { data: allAccountsResponse, refetch: refetchAllAccounts } = useApiQuery(
    chartOfAccountsApi.getList,
    { pageSize: 1000 },
    { enabled: isModalOpen }
  );
  const allAccounts = extractArray(allAccountsResponse);

  const { mutateAsync: createAccountMutation, isLoading: isCreating } = useApiMutation(
    (payload) => chartOfAccountsApi.create(payload),
    { onSuccess: () => { refetch(); refetchAllAccounts(); } }
  );

  const { mutateAsync: updateAccountMutation, isLoading: isUpdating } = useApiMutation(
    (payload) => chartOfAccountsApi.update(payload.id, payload),
    { onSuccess: () => refetch() }
  );

  const { mutateAsync: deleteAccountMutation } = useApiMutation(
    (id) => chartOfAccountsApi.delete(id),
    { onSuccess: () => refetch() }
  );

  const createAccount = async (payload) => {
    try {
      await createAccountMutation(payload);
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const updateAccount = async (payload) => {
    try {
      await updateAccountMutation(payload);
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const handleOpenModal = (account = null, mode = 'create') => {
    if (account && account.nativeEvent) {
      account = null;
    }
    setSelectedAccount(account);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    const id = typeof record === "object" ? record.id : record;
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this account? This action cannot be undone.',
      'Delete Account'
    );
    if (confirmed) {
      try {
        await deleteAccountMutation(id);
        refetch();
      } catch (err) {
        alert('Failed to delete account.');
      }
    }
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'accountCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-bold border border-zinc-200/60">
          {row.accountCode || '-'}
        </span>
      )
    },
    {
      id: 'accountName',
      label: 'Account Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.accountName || '-'}</span>
      )
    },
    {
      id: 'groupName',
      label: 'Group Name',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-600 font-medium">{row.groupName || '-'}</span>
      )
    },
    {
      id: 'parentAccount',
      label: 'Parent Account',
      sortable: false,
      render: (val, row) => (
        <span className="text-zinc-500 text-xs">
          {row.parentAccountName || row.parentAccountCode || '-'}
        </span>
      )
    },
    {
      id: 'accountType',
      label: 'Type',
      sortable: true,
      render: (val, row) => (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-blue-50 text-blue-700 border-blue-200">
          {row.accountType || '-'}
        </span>
      )
    },
    {
      id: 'openingBalance',
      label: 'Balance',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-mono text-zinc-900 font-semibold">
          ₹{fmt(row.currentBalance ?? row.openingBalance)}
        </span>
      )
    },
    {
      id: 'postingAllowed',
      label: 'Posting',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${row.postingAllowed ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-50 text-zinc-400'}`}>
          {row.postingAllowed ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.isActive} />
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'accountType',
      label: 'Account Type',
      type: 'select',
      options: ACCOUNT_TYPE_OPTIONS
    },
    {
      id: 'groupId',
      label: 'Account Group',
      type: 'select',
      placeholder: 'All Groups',
      options: groups.map((g) => ({ label: g.name, value: g.id }))
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ]
    }
  ], [groups]);

  // Expandable Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Account Information',
      fields: [
        { id: 'accountCode', label: 'Account Code', placeholder: 'e.g. 1010' },
        { id: 'accountName', label: 'Account Name', placeholder: 'Account name' },
        {
          id: 'postingAllowed',
          label: 'Posting Allowed',
          type: 'select',
          options: [
            { label: 'All', value: '' },
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' }
          ]
        }
      ]
    },
    {
      title: 'Date Filters',
      fields: [
        { id: 'createdFrom', label: 'Created From', type: 'date' },
        { id: 'createdTo', label: 'Created To', type: 'date' },
        { id: 'updatedFrom', label: 'Updated From', type: 'date' },
        { id: 'updatedTo', label: 'Updated To', type: 'date' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
    {
      key: 'ledger',
      label: 'General Ledger',
      icon: BookMarked,
      onClick: (row) => navigate(buildPath(`/accounts/reports/ledger?accountId=${row.id}`)),
      tooltip: 'View General Ledger',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/ledgers/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      hidden: !canUpdate,
      onClick: (row) => handleOpenModal(row, 'edit'),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      hidden: !canDelete,
      onClick: (row) => handleDelete(row),
      tooltip: 'Delete'
    }
  ], [canUpdate, canDelete]);

  // Sub-row drawer renderer
  const renderExpandedRow = (acc) => (
    <div className="p-4 bg-white border border-zinc-100 rounded-lg shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {acc.accountCode}
          </span>
          <div>
            <h3 className="text-base font-bold text-zinc-900">{acc.accountName}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">{acc.groupName || 'Account Group'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(buildPath(`/accounts/reports/ledger?accountId=${acc.id}`));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs"
          >
            <BookMarked size={14} />
            <span>General Ledger</span>
          </button>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">
            {acc.accountType}
          </span>
          <DataTableStatusBadge status={acc.isActive} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Parent Account</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{acc.parentAccountName || acc.parentAccountCode || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Current Balance</p>
          <p className="text-sm font-bold text-blue-700 mt-1">₹{fmt(acc.currentBalance ?? acc.openingBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Closing Balance</p>
          <p className="text-sm font-bold text-blue-700 mt-1">₹{fmt(acc.closingBalance ?? acc.openingBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Posting Allowed</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{acc.postingAllowed ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Txn Date</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{acc.lastTransactionDate || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Reconciled</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{acc.lastReconciliationDate || '-'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your organization's accounts"
        icon={BookOpen}
      >


        {canCreate && (
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>Create Account</span>
          </button>
        )}
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={accounts}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/accounts/masters/ledgers/${row.id}`))}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by name or code..."
          onSearchChange={(val) => setFilter('searchKey', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page,
            pageSize: currentSize,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || accounts.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="accounts"

          // Empty State
          emptyMessage="No accounts found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find accounts."
        />
      </div>

      <ChartOfAccountsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        account={selectedAccount}
        allAccounts={allAccounts}
        groups={groups}
        onSubmit={modalMode === 'create' ? createAccount : updateAccount}
        onDelete={handleDelete}
        isLoading={isCreating || isUpdating}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="chart-of-accounts-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}