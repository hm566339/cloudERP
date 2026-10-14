import React, { useState, useMemo, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import { Download, Building2, BookOpen,
  Plus, 
  Star,
  Printer,
  FileText,
  Loader2,
  Edit2, Trash2, Eye } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankAccountsApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import BankAccountForm from '../components/BankAccountForm';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRoutePath } from '../../../hooks/useRoutePath';
import apiClient from '../../../api/common/client';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'bankName', 
  'accountNumber', 
  'accountType',
  'isPrimary',
  'currentBalance', 
  'reconciledBalance',
  'status'
];

const BankAccountOverview = ({ account }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {account.accountNumber ? `XXXX${account.accountNumber.slice(-4)}` : '-'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{account.bankName}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Branch: {account.branchName} | IFSC: {account.ifscCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${account.isActive || account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {account.isActive || account.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Opening Balance</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">₹ {fmt(account.openingBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Current Balance</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">₹ {fmt(account.currentBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reconciled</p>
          <p className="text-sm font-bold text-amber-600 mt-1">₹ {fmt(account.reconciledBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Transactions</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{account.transactionCount || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Account Type</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{account.accountType}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GL Account</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{account.glAccountName || account.glAccountCode || '-'}</p>
        </div>
      </div>
    </div>
  );
};

export default function BankAccounts() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const { 
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilter,
    resetFilters,
    apiParams,
    sortBy,
    sortOrder,
    handleColumnSort
  } = useUrlFilters();

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('bankAccounts_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  
  // Selection State
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    localStorage.setItem('bankAccounts_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  // Sync searchKey with the apiParams
  const queryParams = { ...apiParams, companyId };
  if (filters.searchKey && filters.searchKey.trim()) queryParams.searchKey = filters.searchKey.trim();
  
  if (queryParams.createdFrom && !queryParams.createdFrom.includes('T')) {
    queryParams.createdFrom = `${queryParams.createdFrom}T00:00:00`;
  }
  
  if (queryParams.createdTo && !queryParams.createdTo.includes('T')) {
    queryParams.createdTo = `${queryParams.createdTo}T23:59:59`;
  }

  const { 
    data: responseData, 
    isLoading, 
    isFetching,
    error,
    refetch 
  } = useApiQuery(bankAccountsApi.getBankAccounts, queryParams);
  
  const bankAccounts = responseData?.data?.bankAccounts || responseData?.bankAccounts || responseData?.data?.content || responseData?.content || [];
  const pagination = responseData?.data?.pagination || responseData?.pagination || responseData?.data || responseData || {};

  const { mutateAsync: createAccount, isLoading: isCreating } = useApiMutation(bankAccountsApi.createBankAccount);
  const { mutateAsync: updateAccount, isLoading: isUpdating } = useApiMutation(bankAccountsApi.updateBankAccount);
  const { mutateAsync: deleteAccount } = useApiMutation(bankAccountsApi.deleteBankAccount);
  const { mutateAsync: setPrimaryAccount } = useApiMutation(bankAccountsApi.setAsPrimary);
  const { mutateAsync: removePrimaryAccount } = useApiMutation(bankAccountsApi.removeAsPrimary);

  const handleCreateSubmit = async (formData) => {
    try {
      await createAccount(formData);
      dispatch(addAlert({ type: 'success', message: 'Bank account created successfully' }));
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to create account:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to create bank account' }));
      throw err; 
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await updateAccount({ id: selectedAccount.id, data: formData });
      dispatch(addAlert({ type: 'success', message: 'Bank account updated successfully' }));
      setIsEditModalOpen(false);
      setSelectedAccount(null);
      refetch();
    } catch (err) {
      console.error('Failed to update account:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to update bank account' }));
      throw err; 
    }
  };

  const handleDelete = async (account) => {
    if (await confirmDialog({ message: `Are you sure you want to delete bank account ${account.bankName}?` })) {
      try {
        await deleteAccount(account.id);
        dispatch(addAlert({ type: 'success', message: 'Bank account deleted successfully' }));
        refetch();
      } catch (err) {
        console.error("Failed to delete account:", err);
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete account' }));
      }
    }
  };

  const handleSetPrimary = async (account) => {
    try {
      await setPrimaryAccount(account.id);
      dispatch(addAlert({ type: 'success', message: 'Bank account set as primary successfully' }));
      refetch();
    } catch (err) {
      console.error("Failed to set primary account:", err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to set primary account' }));
    }
  };

  const handleRemovePrimary = async (account) => {
    try {
      await removePrimaryAccount(account.id);
      dispatch(addAlert({ type: 'success', message: 'Primary status removed successfully' }));
      refetch();
    } catch (err) {
      console.error("Failed to remove primary status:", err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to remove primary status' }));
    }
  };

  const fetchBankLedgerPdf = async (bankAccountId) => {
    const res = await apiClient.get('/api/account/bank-transactions/ledger/pdf', {
      params: { bankAccountId, companyId },
      responseType: 'blob'
    });
    return res.data;
  };

  const handleDownloadPdf = async () => {
    if (selectedRows.length === 0) return;
    setIsDownloadingPdf(true);
    try {
      for (const accountId of selectedRows) {
        const acc = bankAccounts.find(a => a.id === accountId);
        const blob = await fetchBankLedgerPdf(accountId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bank_Ledger_${acc?.bankName || accountId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      dispatch(addAlert({ type: 'success', message: 'Bank ledger PDF(s) downloaded successfully' }));
    } catch (err) {
      console.error(err);
      dispatch(addAlert({ type: 'error', message: 'Failed to download bank ledger PDF' }));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = async () => {
    if (selectedRows.length === 0) return;
    setIsPrinting(true);
    try {
      const blob = await fetchBankLedgerPdf(selectedRows[0]); // Print first selected
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error(err);
      dispatch(addAlert({ type: 'error', message: 'Failed to prepare print' }));
    } finally {
      setIsPrinting(false);
    }
  };

  const columns = useMemo(() => [
    {
      id: 'bankName',
      label: 'Bank Name',
      sortable: true,
      render: (val, row) => <span className="font-semibold text-zinc-900">{row.bankName}</span>
    },
    {
      id: 'branchName',
      label: 'Branch',
      sortable: true,
      render: (val, row) => <span className="text-zinc-500">{row.branchName}</span>
    },
    {
      id: 'accountNumber',
      label: 'Account Number',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-600">
          {row.accountNumber ? `XXXX${row.accountNumber.slice(-4)}` : '-'}
        </span>
      )
    },
    {
      id: 'ifscCode',
      label: 'IFSC Code',
      sortable: true,
      render: (val, row) => <span className="font-mono text-xs text-zinc-600">{row.ifscCode}</span>
    },
    {
      id: 'accountType',
      label: 'Account Type',
      sortable: false,
      render: (val, row) => (
        <span className="px-2 py-1 text-[8.8px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase">
          {row.accountType}
        </span>
      )
    },
    {
      id: 'isPrimary',
      label: 'Primary',
      sortable: false,
      align: 'center',
      render: (val, row) => (
        row.isPrimary ? (
          <span className="px-2 py-1 text-[8px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase">
            PRIMARY
          </span>
        ) : (
          <span className="text-zinc-300">-</span>
        )
      )
    },
    {
      id: 'openingBalance',
      label: 'Opening Balance',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-zinc-600 font-mono">{formatCurrency(row.openingBalance)}</span>
    },
    {
      id: 'currentBalance',
      label: 'Current Balance',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-emerald-600 font-mono">{formatCurrency(row.currentBalance)}</span>
    },
    {
      id: 'reconciledBalance',
      label: 'Reconciled Balance',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-amber-600 font-mono">{formatCurrency(row.reconciledBalance)}</span>
    },
    {
      id: 'transactionCount',
      label: 'Transactions',
      sortable: false,
      render: (val, row) => <span className="text-zinc-600">{row.transactionCount}</span>
    },
    {
      id: 'glAccountName',
      label: 'GL Account',
      sortable: false,
      render: (val, row) => <span className="text-zinc-500">{row.glAccountName || row.glAccountCode}</span>
    },
    {
      id: 'ledgerAccountName',
      label: 'Ledger Account',
      sortable: false,
      render: (val, row) => <span className="text-zinc-500">{row.ledgerAccountName}</span>
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
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
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      sortable: true,
      render: (val, row) => <span className="text-zinc-500">{row.createdAt ? format(new Date(row.createdAt), 'dd MMM yyyy') : '-'}</span>
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/bank-accounts/${row.id}`)),
      tooltip: 'View Account',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'BANKING', action: 'UPDATE' },
      onClick: (row) => { setSelectedAccount(row); setIsEditModalOpen(true); },
      tooltip: 'Edit Account',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'ledger',
      label: 'View Ledger',
      icon: BookOpen,
      onClick: (row) => navigate(buildPath(`/accounts/masters/bank-accounts/${row.id}/ledger`)),
      tooltip: 'View Ledger',
      className: 'hover:text-cyan-600 hover:bg-cyan-50'
    },
    {
      key: 'setPrimary',
      label: 'Set as Primary',
      icon: Star,
      hidden: (row) => row.isPrimary || (!row.isActive && row.status !== 'ACTIVE'),
      onClick: (row) => handleSetPrimary(row),
      tooltip: 'Set as Primary',
      className: 'hover:text-amber-600 hover:bg-amber-50'
    },
    {
      key: 'removePrimary',
      label: 'Remove Primary',
      icon: Star,
      hidden: (row) => !row.isPrimary,
      onClick: (row) => handleRemovePrimary(row),
      tooltip: 'Remove Primary',
      className: 'hover:text-zinc-600 hover:bg-zinc-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'BANKING', action: 'DELETE' },
      onClick: (row) => handleDelete(row),
      tooltip: 'Delete Account'
    }
  ], [navigate, buildPath]);

  const basicFilters = [
    {
      id: 'accountTypes',
      label: 'Account Type',
      type: 'select',
      options: [
        { value: '', label: 'All Types' },
        { value: 'SAVINGS', label: 'Savings' },
        { value: 'CURRENT', label: 'Current' },
        { value: 'CASH', label: 'Cash' },
        { value: 'CREDIT_CARD', label: 'Credit Card' }
      ]
    },
    {
      id: 'isActive',
      label: 'Active Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  const advancedFilters = [
    {
      title: 'Details',
      fields: [
        { id: 'bankName', label: 'Bank Name', placeholder: 'Bank Name' },
        { id: 'branchName', label: 'Branch Name', placeholder: 'Branch Name' },
        { id: 'accountNumber', label: 'Account Number', placeholder: 'Account Number' },
        { id: 'ifscCode', label: 'IFSC Code', placeholder: 'IFSC Code' }
      ]
    },
    {
      title: 'Dates',
      fields: [
        { id: 'createdFrom', label: 'Created From', type: 'date' },
        { id: 'createdTo', label: 'Created To', type: 'date' }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Bank Accounts"
        description="Manage company bank accounts and balances"
      >
        <button 
          onClick={handlePrint} 
          disabled={selectedRows.length === 0 || isPrinting}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPrinting ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />} Print
        </button>
        <button 
          onClick={handleDownloadPdf} 
          disabled={selectedRows.length === 0 || isDownloadingPdf}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} PDF Download
        </button>
        <RequirePermission module="BANKING" action="CREATE">
          <button onClick={() => setIsFormOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Account</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={bankAccounts}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search Bank Accounts..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new bank account',
            onCreate: () => setIsFormOpen(true)
          }}

          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          advancedFilters={advancedFilters}

          onReset={resetFilters}
          onRefresh={refetch}

          rowActions={rowActions}

          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(record) => <BankAccountOverview account={record} />}

          visibleColumns={visibleColumns}
          defaultVisibleColumns={DEFAULT_COLUMNS}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          pagination={{
            page,
            pageSize: apiParams.pageSize || pageSize,
            totalPages: pagination.totalPages || 1,
            totalElements: pagination.totalElements ?? pagination.total ?? bankAccounts.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="bank accounts"
          emptyDescription="Try adjusting your search keywords or filter criteria to find bank accounts."
        />
      </div>

      <BankAccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />

      <BankAccountForm
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedAccount(null); }}
        initialData={selectedAccount}
        onSubmit={handleEditSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
}
