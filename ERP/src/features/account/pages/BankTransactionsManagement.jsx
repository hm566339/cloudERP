import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import { 
  Plus, Edit2, Trash2, CheckCircle, Search, FileText, Download, Building2
} from 'lucide-react';
import { bankTransactionsApi, bankAccountsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import BankTransactionFormModal from '../components/BankTransactionFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import BankTransactionStatusBadge from '../components/BankTransactionStatusBadge';
import BankTransactionDetails from '../components/BankTransactionDetails';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { format } from 'date-fns';

const DEFAULT_COLUMNS = [
  'transactionDate',
  'referenceNo',
  'bankAccount',
  'transactionType',
  'debitAmount',
  'creditAmount',
  'status'
];

const getTransactionsList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.transactions)) return response.data.transactions;
  if (Array.isArray(response?.transactions)) return response.transactions;
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

export default function BankTransactionsManagement() {
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
    if (filters.transactionType && filters.transactionType.trim()) q.transactionType = filters.transactionType.trim();
    if (filters.bankAccountId && filters.bankAccountId.trim()) q.bankAccountId = filters.bankAccountId.trim();
    return q;
  }, [filters]);

  // Data Fetching
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch
  } = useApiQuery(bankTransactionsApi.getBankTransactions, { 
    page, 
    pageSize: apiParams.pageSize, 
    sortBy, 
    sortDir: sortOrder, 
    ...queryFilters 
  }, {
    keepPreviousData: true
  });

  const { data: accountsResponse } = useApiQuery(bankAccountsApi.getBankAccounts, { pageSize: 100 });
  const accounts = useMemo(() => getTransactionsList(accountsResponse), [accountsResponse]);

  const transactions = useMemo(() => getTransactionsList(responseData), [responseData]);
  const pageInfo = useMemo(() => getPageInfo(responseData), [responseData]);

  // Mutations
  const { mutate: deleteTransaction } = useApiMutation(bankTransactionsApi.deleteBankTransaction, {
    onSuccess: () => {
      dispatch(addAlert({ type: 'success', message: 'Transaction deleted successfully' }));
      refetch();
    },
    onError: (err) => dispatch(addAlert({ type: 'error', message: err.message || 'Failed to delete transaction' }))
  });

  // Handlers
  const handleCreate = (prefillData = {}) => {
    setEditingRecord(prefillData);
    setIsFormModalOpen(true);
  };

  const handleEdit = (record) => {
    if (record.reconciled || record.glStatus === 'POSTED') {
      dispatch(addAlert({ type: 'error', message: 'Reconciled or posted transactions cannot be edited' }));
      return;
    }
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (record) => {
    if (record.reconciled || record.glStatus === 'POSTED') {
      dispatch(addAlert({ type: 'error', message: 'Reconciled or posted transactions cannot be deleted' }));
      return;
    }

    const isConfirmed = await confirmDialog({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this bank transaction? This action cannot be undone.',
      confirmText: 'Delete Transaction',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: <Trash2 size={24} className="text-rose-500" />
    });

    if (isConfirmed) {
      deleteTransaction(record.id);
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
      tooltip: 'Edit Transaction',
      className: 'hover:text-blue-600 hover:bg-blue-50',
      hidden: (record) => record.reconciled || record.glStatus === 'POSTED'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'BANKING', action: 'DELETE' },
      onClick: handleDelete,
      tooltip: 'Delete Transaction',
      hidden: (record) => record.reconciled || record.glStatus === 'POSTED'
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
  ], [handleEdit, handleDelete]);

  // Columns definition
  const columns = useMemo(() => [
    {
      id: 'transactionDate',
      label: 'Date',
      sortable: true,
      render: (val) => {
        try {
          return <span className="text-zinc-900 font-medium">{format(new Date(val), 'dd MMM yyyy')}</span>;
        } catch {
          return val || '-';
        }
      }
    },
    {
      id: 'referenceNo',
      label: 'Reference / UTR',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-900 font-medium font-mono text-xs">{row.referenceNo || row.utrNo || '-'}</span>
        </div>
      )
    },
    {
      id: 'bankAccount',
      label: 'Bank Account',
      sortable: false,
      render: (val, row) => (
        <span className="text-zinc-700">
          {row.bankAccount?.bankName} {row.bankAccount?.accountNumber ? `(${row.bankAccount?.accountNumber.slice(-4)})` : ''}
        </span>
      )
    },
    {
      id: 'transactionType',
      label: 'Type',
      sortable: true,
      render: (val) => (
        <span className="text-zinc-700 uppercase tracking-wider text-[10px] font-bold">
          {val?.replace(/_/g, ' ') || '-'}
        </span>
      )
    },
    {
      id: 'debitAmount',
      label: 'Debit (Out)',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-medium text-rose-600 font-mono">
          {val ? formatAmount(val) : '-'}
        </span>
      )
    },
    {
      id: 'creditAmount',
      label: 'Credit (In)',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-medium text-emerald-600 font-mono">
          {val ? formatAmount(val) : '-'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (val, row) => (
        <div className="flex justify-center">
          <BankTransactionStatusBadge 
            reconciled={row.reconciled} 
            glStatus={row.glStatus} 
          />
        </div>
      )
    }
  ], []);

  const basicFilters = [
    {
      id: 'bankAccountId',
      label: 'Bank Account',
      type: 'select',
      options: accounts.map(a => ({ value: a.id, label: `${a.bankName} - ${a.accountNumber}` }))
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'RECONCILED', label: 'Reconciled' },
        { value: 'UNRECONCILED', label: 'Unreconciled' }
      ]
    },
    {
      id: 'transactionType',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'DEPOSIT', label: 'Deposit' },
        { value: 'WITHDRAWAL', label: 'Withdrawal' },
        { value: 'TRANSFER', label: 'Transfer' },
        { value: 'BANK_CHARGE', label: 'Bank Charge' }
      ]
    }
  ];

  const advancedFilters = [];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Bank Transactions"
        description="Manage bank transactions, ledger entries, and reconciliation"
      >
        <RequirePermission module="BANKING" action="CREATE">
          <button onClick={() => handleCreate()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Transaction</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={transactions}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by ref no, UTR, narration..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Record new transaction',
            onCreate: (searchTerm) => handleCreate({ referenceNo: searchTerm })
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
          renderExpandedRow={(record) => <BankTransactionDetails transaction={record} />}

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
            totalElements: pageInfo?.totalElements || transactions.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="transactions"
          emptyDescription="Try adjusting your search keywords or filter criteria to find transactions."
        />
      </div>

      <BankTransactionFormModal
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
        title="Export Bank Transactions"
        fileName="bank_transactions_export.csv"
        apiEndpoint="/api/account/bank-transactions/export"
        filters={filters}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
