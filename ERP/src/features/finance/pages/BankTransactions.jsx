import React, { useState, useMemo, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { Download, Building2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankTransactionsApi, bankAccountsApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from "../../../hooks/useRoutePath";

import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'transactionDate',
  'bankName',
  'transactionType',
  'referenceNo',
  'debitAmount',
  'creditAmount',
  'reconciled'
];

export default function BankTransactions() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    filters,
    setFilter: handleFilterChange,
    handleColumnSort: handleSort,
    page,
    pageSize,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    sortBy,
    sortOrder,
    resetFilters
  } = useUrlFilters({
    defaultSortBy: 'transactionDate',
    defaultSortOrder: 'desc'
  });

  const { data, isLoading, isFetching, refetch } = useApiQuery(bankTransactionsApi.getBankTransactions, {
    bankAccountId: filters.bankAccountId,
    referenceNo: filters.referenceNo,
    utrNo: filters.utrNo,
    transactionType: filters.transactionType,
    reconciled: filters.reconciled === 'true' ? true : filters.reconciled === 'false' ? false : undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    minDebitAmount: filters.minDebitAmount,
    maxDebitAmount: filters.maxDebitAmount,
    minCreditAmount: filters.minCreditAmount,
    maxCreditAmount: filters.maxCreditAmount,
    narration: filters.narration,
    isDeleted: filters.isDeleted === 'true' ? true : false,
    page,
    size: pageSize,
    sortBy,
    sortDir: sortOrder
  });

  const payload = data?.data || data || {};
  const transactionsList = useMemo(() => {
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(data?.transactions)) return data.transactions;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  }, [data, payload]);

  const pageInfo = useMemo(() => {
    return {
      currentPage: payload?.pagination?.page ?? payload?.pageNumber ?? payload?.number ?? payload?.page ?? data?.pagination?.page ?? page ?? 0,
      pageSize: payload?.pagination?.size ?? payload?.pageSize ?? payload?.size ?? data?.pagination?.size ?? pageSize ?? 10,
      totalPages: payload?.pagination?.totalPages ?? payload?.totalPages ?? data?.pagination?.totalPages ?? 1,
      totalElements: payload?.pagination?.totalElements ?? payload?.totalElements ?? data?.pagination?.totalElements ?? transactionsList.length,
    };
  }, [payload, data, page, pageSize, transactionsList.length]);

  const createMutation = useApiMutation(bankTransactionsApi.createBankTransaction);
  const updateMutation = useApiMutation(bankTransactionsApi.updateBankTransaction);
  const deleteMutation = useApiMutation(bankTransactionsApi.deleteBankTransaction);

  const { data: bankAccountsData } = useApiQuery(bankAccountsApi.getBankAccounts, { size: 1000 });
  const raw_bankAccountsList = bankAccountsData?.data?.bankAccounts || bankAccountsData?.data?.content || bankAccountsData?.data || bankAccountsData || [];
  const bankAccountsList = Array.isArray(raw_bankAccountsList) ? raw_bankAccountsList : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('bankTransactions_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('bankTransactions_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  
  const [formData, setFormData] = useState({
    bankAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: 'DEPOSIT',
    referenceNo: '',
    utrNo: '',
    debitAmount: '',
    creditAmount: '',
    narration: '',
    reconciled: false
  });

  const handleOpenModal = (record = null) => {
    if (record && record.id) {
      setEditingId(record.id);
      setFormData({
        bankAccountId: record.bankAccount?.id || record.bankAccountId || '',
        transactionDate: record.transactionDate ? record.transactionDate.split('T')[0] : '',
        transactionType: record.transactionType || 'DEPOSIT',
        referenceNo: record.referenceNo || '',
        utrNo: record.utrNo || '',
        debitAmount: record.debitAmount || '',
        creditAmount: record.creditAmount || '',
        narration: record.narration || '',
        reconciled: record.reconciled || false
      });
    } else {
      setEditingId(null);
      setFormData({
        bankAccountId: '',
        transactionDate: new Date().toISOString().split('T')[0],
        transactionType: 'DEPOSIT',
        referenceNo: '',
        utrNo: '',
        debitAmount: '',
        creditAmount: '',
        narration: '',
        reconciled: false
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.bankAccountId) return "Bank Account is required";
    if (!formData.transactionDate) return "Transaction Date is required";
    if (!formData.transactionType) return "Transaction Type is required";
    
    const debit = parseFloat(formData.debitAmount || 0);
    const credit = parseFloat(formData.creditAmount || 0);

    if (debit > 0 && credit > 0) return "Either Debit OR Credit must contain a value. Both cannot contain values.";
    if (debit <= 0 && credit <= 0) return "Amount must be greater than zero.";
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      const payloadObj = {
        data: {
          bankAccountId: formData.bankAccountId,
          transactionDate: formData.transactionDate,
          transactionType: formData.transactionType,
          referenceNo: formData.referenceNo?.trim() || null,
          utrNo: formData.utrNo?.trim() || null,
          debitAmount: parseFloat(formData.debitAmount || 0),
          creditAmount: parseFloat(formData.creditAmount || 0),
          narration: formData.narration?.trim() || null,
          reconciled: formData.reconciled
        }
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payloadObj.data });
      } else {
        await createMutation.mutateAsync(payloadObj);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      alert(`Error: ${err?.response?.data?.message || err?.message || 'Validation failed'}`);
    }
  };

  const handleDelete = async (record) => {
    if (await confirmDialog({ message: `Are you sure you want to delete transaction "${record.referenceNo || record.id}"?`, info: record })) {
      try {
        await deleteMutation.mutateAsync(record.id);
        refetch();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete Transaction');
      }
    }
  };

  const columns = useMemo(() => [
    {
      id: 'transactionDate',
      label: 'Date',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      id: 'bankName',
      label: 'Bank Name',
      sortable: true,
      render: (val, row) => <span className="font-medium text-zinc-900">{row.bankAccount?.bankName || 'N/A'}</span>
    },
    {
      id: 'accountNumber',
      label: 'Account Number',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600">{row.bankAccount?.accountNumber || 'N/A'}</span>
    },
    {
      id: 'transactionType',
      label: 'Type',
      sortable: true,
      render: (val) => {
        const typeColors = {
          DEPOSIT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          WITHDRAWAL: 'bg-rose-50 text-rose-700 border-rose-200',
          TRANSFER: 'bg-blue-50 text-blue-700 border-blue-200',
          PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200'
        };
        const colorClass = typeColors[val] || 'bg-zinc-50 text-zinc-700 border-zinc-200';
        return (
          <span className={`px-2.5 py-1 rounded-md text-[8.8px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {val}
          </span>
        );
      }
    },
    {
      id: 'referenceNo',
      label: 'Ref / UTR',
      sortable: false,
      render: (val, row) => (
        <span className="text-[10.4px] text-zinc-600">
          {row.referenceNo || '-'} {row.utrNo ? ` / ${row.utrNo}` : ''}
        </span>
      )
    },
    {
      id: 'debitAmount',
      label: 'Debit',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-rose-600">
          {val > 0 ? val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
        </span>
      )
    },
    {
      id: 'creditAmount',
      label: 'Credit',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-emerald-600">
          {val > 0 ? val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
        </span>
      )
    },
    {
      id: 'runningBalance',
      label: 'Running Bal',
      sortable: true,
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-zinc-900">
          {val != null ? val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
        </span>
      )
    },
    {
      id: 'glStatus',
      label: 'GL Status',
      sortable: false,
      align: 'center',
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-md text-[8.8px] font-bold uppercase tracking-wider border ${val === 'POSTED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
          {val || 'PENDING'}
        </span>
      )
    },
    {
      id: 'reconciled',
      label: 'Reconciled',
      sortable: true,
      align: 'center',
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-md text-[8.8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto border ${val ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {val ? 'Reconciled' : 'Unreconciled'}
        </span>
      )
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/transactions/bank-transactions/${row.id}`)),
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
      icon: Edit2,
      permission: { module: 'BANKING', action: 'UPDATE' },
      onClick: handleOpenModal,
      tooltip: 'Edit',
      className: 'hover:text-zinc-900 hover:bg-zinc-100'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'BANKING', action: 'DELETE' },
      onClick: handleDelete,
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const basicFilters = [
    {
      id: 'bankAccountId',
      label: 'Bank Account',
      type: 'select',
      options: [
        { value: '', label: 'All Accounts' },
        ...bankAccountsList.map(a => ({ value: a.id, label: `${a.bankName} - ${a.accountNumber}` }))
      ]
    },
    {
      id: 'transactionType',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: '', label: 'All Types' },
        { value: 'DEPOSIT', label: 'Deposit' },
        { value: 'WITHDRAWAL', label: 'Withdrawal' },
        { value: 'TRANSFER', label: 'Transfer' },
        { value: 'PAYMENT', label: 'Payment' }
      ]
    },
    {
      id: 'reconciled',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'true', label: 'Reconciled' },
        { value: 'false', label: 'Unreconciled' }
      ]
    }
  ];

  const advancedFilters = [
    {
      title: 'Date Range',
      fields: [
        { id: 'fromDate', label: 'From Date', type: 'date' },
        { id: 'toDate', label: 'To Date', type: 'date' }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Bank Transactions"
        description="Manage deposits, withdrawals, and bank reconciliation"
      >
        <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center gap-2">
          <Download size={15} /> Export
        </button>
        <Link to={buildPath("/accounts/transactions/bank-reconciliation")} className="px-4 py-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-200">
          Reconciliation
        </Link>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> <span>New Transaction</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={transactionsList}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.referenceNo || filters.utrNo || filters.narration || ''}
          searchPlaceholder="Reference, UTR or Narration..."
          onSearchChange={(val) => {
            handleFilterChange('referenceNo', val);
            handleFilterChange('utrNo', val);
            handleFilterChange('narration', val);
          }}

          filters={basicFilters}
          filterValues={filters}
          onFilterChange={handleFilterChange}

          advancedFilters={advancedFilters}

          onReset={resetFilters}
          onRefresh={refetch}

          rowActions={rowActions}

          visibleColumns={visibleColumns}
          defaultVisibleColumns={DEFAULT_COLUMNS}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleSort(key)}

          pagination={{
            page: pageInfo.currentPage,
            pageSize: pageInfo.pageSize,
            totalPages: pageInfo.totalPages || 1,
            totalElements: pageInfo.totalElements
          }}
          pageIndexBase={0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemName="transactions"
          emptyDescription="Try adjusting your search keywords or filter criteria to find transactions."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Bank Transaction' : 'New Bank Transaction'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-zinc-700">Bank Account *</label>
              <CustomSelect
                options={bankAccountsList.map(a => ({ value: a.id, label: `${a.bankName} - ${a.accountNumber} (${a.accountType})` }))}
                value={formData.bankAccountId}
                onChange={(e) => handleInputChange({ target: { name: 'bankAccountId', value: e.target.value } })}
              />
              {formData.bankAccountId && (
                <div className="text-xs text-blue-600 font-medium">
                  Current Balance: {bankAccountsList.find(b => b.id === formData.bankAccountId)?.currentBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Transaction Date *</label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Transaction Type *</label>
              <CustomSelect
                options={[
                  { value: 'DEPOSIT', label: 'Deposit' },
                  { value: 'WITHDRAWAL', label: 'Withdrawal' },
                  { value: 'TRANSFER', label: 'Transfer' },
                  { value: 'PAYMENT', label: 'Payment' }
                ]}
                value={formData.transactionType}
                onChange={(e) => handleInputChange({ target: { name: 'transactionType', value: e.target.value } })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Reference Number</label>
              <input
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="e.g. CHQ-12345"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">UTR Number</label>
              <input
                type="text"
                name="utrNo"
                value={formData.utrNo}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="e.g. UTR294819385"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Debit Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="debitAmount"
                  value={formData.debitAmount}
                  onChange={handleInputChange}
                  className="input-field pl-8 w-full"
                  disabled={formData.creditAmount > 0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Credit Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="creditAmount"
                  value={formData.creditAmount}
                  onChange={handleInputChange}
                  className="input-field pl-8 w-full"
                  disabled={formData.debitAmount > 0}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-zinc-700">Narration</label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleInputChange}
                className="input-field w-full h-20 resize-none"
                placeholder="Transaction details..."
              ></textarea>
            </div>
            
            <div className="space-y-1.5 md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                name="reconciled"
                id="reconciled"
                checked={formData.reconciled}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="reconciled" className="text-sm font-medium text-zinc-700">
                Mark as Reconciled
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="bank-transactions"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
