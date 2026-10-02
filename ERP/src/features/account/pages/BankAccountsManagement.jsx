import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Power, PowerOff
} from 'lucide-react';
import { bankAccountsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import BankAccountFormModal from '../components/BankAccountFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import BankAccountDetails from '../components/BankAccountDetails';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'accountNumber',
  'bankName',
  'branchName',
  'accountType',
  'currentBalance',
  'status'
];

const getAccountsList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.bankAccounts)) return response.data.bankAccounts;
  if (Array.isArray(response?.bankAccounts)) return response.bankAccounts;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return response._pageInfo || {};
  return response?.pagination || response?.data?.pagination || response?.data?._pageInfo || response?._pageInfo || response || {};
};

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
};

export default function BankAccountsManagement() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.search = filters.searchKey.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    if (filters.accountType && filters.accountType.trim()) q.accountType = filters.accountType.trim();
    return q;
  }, [filters]);

  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch
  } = useApiQuery(bankAccountsApi.getBankAccounts, { 
    page, 
    pageSize: apiParams.pageSize, 
    sortBy, 
    sortDir: sortOrder, 
    ...queryFilters 
  }, {
    keepPreviousData: true
  });

  const accounts = useMemo(() => getAccountsList(responseData), [responseData]);
  const pageInfo = useMemo(() => getPageInfo(responseData), [responseData]);

  // Mutations
  const { mutate: deleteAccount } = useApiMutation(bankAccountsApi.deleteBankAccount, {
    onSuccess: () => {
      dispatch(addAlert({ type: 'success', message: 'Bank account deleted successfully' }));
      refetch();
    },
    onError: (err) => dispatch(addAlert({ type: 'error', message: err.message || 'Failed to delete account' }))
  });

  const { mutate: activateAccount } = useApiMutation(bankAccountsApi.activateBankAccount, {
    onSuccess: () => {
      dispatch(addAlert({ type: 'success', message: 'Bank account activated successfully' }));
      refetch();
    },
    onError: (err) => dispatch(addAlert({ type: 'error', message: err.message || 'Failed to activate account' }))
  });

  const { mutate: deactivateAccount } = useApiMutation(bankAccountsApi.deactivateBankAccount, {
    onSuccess: () => {
      dispatch(addAlert({ type: 'success', message: 'Bank account deactivated successfully' }));
      refetch();
    },
    onError: (err) => dispatch(addAlert({ type: 'error', message: err.message || 'Failed to deactivate account' }))
  });

  // Handlers
  const handleCreate = (prefillData = {}) => {
    setEditingRecord(prefillData);
    setIsFormModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (record) => {
    const isConfirmed = await confirmDialog({
      title: 'Delete Bank Account',
      message: `Are you sure you want to delete bank account "${record.bankName} - ${record.accountNumber}"? This action cannot be undone.`,
      confirmText: 'Delete Account',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: <Trash2 size={24} className="text-rose-500" />
    });

    if (isConfirmed) {
      deleteAccount(record.id);
    }
  };

  const handleToggleStatus = async (record) => {
    const isCurrentlyActive = record.isActive || record.status === 'ACTIVE';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    
    const isConfirmed = await confirmDialog({
      title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} Bank Account`,
      message: `Are you sure you want to ${action} this bank account?`,
      confirmText: isCurrentlyActive ? 'Deactivate' : 'Activate',
      confirmColor: isCurrentlyActive ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    });

    if (isConfirmed) {
      if (isCurrentlyActive) {
        deactivateAccount(record.id);
      } else {
        activateAccount(record.id);
      }
    }
  };

  const handleReset = () => {
    resetFilters();
  };

  const rowActions = useMemo(() => [
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'BANKING', action: 'UPDATE' },
      onClick: handleEdit,
      tooltip: 'Edit Account',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'toggle-status',
      label: (row) => (row.isActive || row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'),
      icon: (row) => (row.isActive || row.status === 'ACTIVE' ? PowerOff : Power),
      permission: { module: 'BANKING', action: 'UPDATE' },
      onClick: handleToggleStatus,
      tooltip: (row) => (row.isActive || row.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'),
      className: (row) => (row.isActive || row.status === 'ACTIVE'
        ? 'hover:text-amber-600 hover:bg-amber-50'
        : 'hover:text-emerald-600 hover:bg-emerald-50')
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'BANKING', action: 'DELETE' },
      onClick: handleDelete,
      tooltip: 'Delete Account'
    },
    {
      key: 'audit',
      component: ({ row }) => (
        row.createdAt && (
          <AuditLogHover
            createdAt={row.createdAt}
            createdBy={row.createdBy}
            updatedAt={row.updatedAt}
            updatedBy={row.updatedBy}
          />
        )
      )
    }
  ], [handleEdit, handleDelete, handleToggleStatus]);

  // Columns definition
  const columns = useMemo(() => [
    {
      id: 'accountNumber',
      label: 'Account Number',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-900 font-medium font-mono">{row.accountNumber || '-'}</span>
          {row.ifscCode && <span className="text-zinc-500 text-xs font-mono">{row.ifscCode}</span>}
        </div>
      )
    },
    {
      id: 'bankName',
      label: 'Bank Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-900 font-medium">{row.bankName || '-'}</span>
          <span className="text-zinc-500 text-xs">{row.accountHolderName || '-'}</span>
        </div>
      )
    },
    {
      id: 'branchName',
      label: 'Branch',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.branchName || '-'}</span>
    },
    {
      id: 'accountType',
      label: 'Type',
      sortable: true,
      render: (val) => (
        <span className="text-zinc-700">
          {val ? val.charAt(0) + val.slice(1).toLowerCase() : '-'}
        </span>
      )
    },
    {
      id: 'currentBalance',
      label: 'Balance',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-emerald-700 font-mono">
          {formatAmount(row.currentBalance)}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'isActive',
      align: 'center',
      render: (val, row) => {
        const isCurrentlyActive = row.isActive || row.status === 'ACTIVE';
        return (
          <div className="flex justify-center">
            <DataTableStatusBadge
              status={isCurrentlyActive ? 'active' : 'inactive'}
              text={isCurrentlyActive ? 'Active' : 'Inactive'}
            />
          </div>
        );
      }
    }
  ], []);

  const basicFilters = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' }
      ]
    },
    {
      id: 'accountType',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: 'SAVINGS', label: 'Savings' },
        { value: 'CURRENT', label: 'Current' },
        { value: 'CASH', label: 'Cash' },
        { value: 'OVERDRAFT', label: 'Overdraft' },
        { value: 'OTHER', label: 'Other' }
      ]
    }
  ];

  const advancedFilters = [];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Bank Accounts"
        description="Manage bank accounts, balances, and banking information"
      >
        <RequirePermission module="BANKING" action="CREATE">
          <button onClick={() => handleCreate()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Bank Account</span>
          </button>
        </RequirePermission>
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
          
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by name, acc no, ifsc..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new bank account',
            onCreate: (searchTerm) => handleCreate({ bankName: searchTerm })
          }}

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

          // Row Actions
          rowActions={rowActions}

          // Expanded Row
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(record) => <BankAccountDetails account={record} />}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting & Pagination
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          pagination={{
            page,
            pageSize: apiParams.pageSize,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || accounts.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="bank accounts"
          emptyDescription="Try adjusting your search keywords or filter criteria to find bank accounts."
        />
      </div>

      <BankAccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
        editingRecord={editingRecord}
        onSuccess={refetch}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Bank Accounts"
        fileName="bank_accounts_export.csv"
        apiEndpoint="/api/account/bank-accounts/export"
        filters={filters}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
