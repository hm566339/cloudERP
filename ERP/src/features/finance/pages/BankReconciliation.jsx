import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Search, CheckCircle, RefreshCw, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, Calculator, FileCheck2,
  SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankTransactionsApi } from '../../../api/account';
import { accountHttpClient } from '../../../api/common/client';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import CustomSelect from '../../../components/common/CustomSelect';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable from '../../../components/data-table';

const formatCurrency = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '₹0.00';
  return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const formatDate = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
  } catch {
    return String(val);
  }
};

export default function BankReconciliation() {
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();

  const {
    filters,
    handleFilterChange,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange
  } = useUrlFilters({
    defaultSortBy: 'transactionDate',
    defaultSortDir: 'desc'
  });

  const [statementBalance, setStatementBalance] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Synchronize state when URL filter changes
  useEffect(() => {
    if (filters.bankStatementBalance && filters.bankStatementBalance !== statementBalance) {
      setStatementBalance(filters.bankStatementBalance);
    }
  }, [filters.bankStatementBalance]);

  // Fetch Bank Accounts for dropdown
  const { data: bankAccountsData } = useApiQuery(() =>
    accountHttpClient.get('/api/account/bank-accounts', { params: { size: 1000 } }).catch(() => ({ data: [] }))
  );
  const raw_bankAccountsList = bankAccountsData?.data?.content || bankAccountsData?.data || [];
  const bankAccountsList = Array.isArray(raw_bankAccountsList) ? raw_bankAccountsList : [];

  // Fetch Reconciliation Summary
  const { data, isLoading, isFetching, refetch } = useApiQuery(
    bankTransactionsApi.getReconciliationSummary,
    {
      bankAccountId: filters.bankAccountId,
      bankStatementBalance: filters.bankStatementBalance,
      page,
      size: pageSize
    },
    {
      enabled: Boolean(filters.bankAccountId)
    }
  );

  const summary = data?.data || {};
  const raw_unmatchedList = summary.unmatchedTransactions || [];
  const unmatchedList = Array.isArray(raw_unmatchedList) ? raw_unmatchedList : [];
  const pageInfo = data?.pagination || data?.data?.pagination || {};

  const reconcileMutation = useApiMutation(bankTransactionsApi.reconcileTransaction);

  const handleApplyBalance = () => {
    handleFilterChange('bankStatementBalance', statementBalance);
  };

  const handleReconcile = async (transaction) => {
    const txId = transaction.transactionId || transaction.id;
    const refDisplay = transaction.referenceNo || transaction.utrNo || txId;

    const confirmed = await confirmDialog({
      title: 'Confirm Reconciliation',
      message: `Are you sure you want to reconcile this transaction (${refDisplay})?`,
      confirmText: 'Reconcile',
      confirmButtonClass: 'btn-primary bg-emerald-600 hover:bg-emerald-700'
    });

    if (confirmed) {
      try {
        await reconcileMutation.mutateAsync(txId);
        dispatch(addAlert({
          type: 'success',
          message: `Transaction ${refDisplay} reconciled successfully`
        }));
        refetch();
      } catch (err) {
        dispatch(addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to reconcile transaction'
        }));
      }
    }
  };

  // Filtered unmatched transactions based on local search & type filter
  const displayedTransactions = useMemo(() => {
    let list = unmatchedList;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((r) =>
        (r.referenceNo && String(r.referenceNo).toLowerCase().includes(q)) ||
        (r.utrNo && String(r.utrNo).toLowerCase().includes(q)) ||
        (r.narration && String(r.narration).toLowerCase().includes(q)) ||
        (r.transactionType && String(r.transactionType).toLowerCase().includes(q))
      );
    }
    if (typeFilter) {
      list = list.filter((r) => r.transactionType === typeFilter);
    }
    return list;
  }, [unmatchedList, searchTerm, typeFilter]);

  const isBalanced = Number(summary.reconciliationDifference || 0) === 0;

  // Table columns definition
  const columns = useMemo(() => [
    {
      key: 'transactionDate',
      id: 'transactionDate',
      label: 'DATE',
      render: (val, row) => (
        <span className="text-xs text-zinc-600 dark:text-[#A0A6B5] whitespace-nowrap">
          {formatDate(row.transactionDate)}
        </span>
      )
    },
    {
      key: 'referenceNo',
      id: 'referenceNo',
      label: 'REF / UTR',
      render: (val, row) => (
        <div className="font-mono text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">
          <span>{row.referenceNo || '—'}</span>
          {row.utrNo && (
            <span className="text-zinc-400 dark:text-[#6B7184] font-normal block text-[10px]">
              UTR: {row.utrNo}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'narration',
      id: 'narration',
      label: 'NARRATION',
      render: (val, row) => (
        <span className="text-xs text-zinc-700 dark:text-[#A0A6B5] max-w-xs truncate block" title={row.narration}>
          {row.narration || '—'}
        </span>
      )
    },
    {
      key: 'transactionType',
      id: 'transactionType',
      label: 'TYPE',
      align: 'center',
      headerClassName: 'text-center',
      render: (val, row) => {
        const typeClasses = {
          DEPOSIT: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
          WITHDRAWAL: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
          TRANSFER: 'bg-blue-50 dark:bg-[#4C8DFF]/10 text-blue-700 dark:text-[#4C8DFF] border-blue-200 dark:border-blue-500/20',
          PAYMENT: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
        };
        const badgeClass = typeClasses[row.transactionType] || 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE] border-zinc-200 dark:border-[#2A2F3D]';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
            {row.transactionType || 'UNKNOWN'}
          </span>
        );
      }
    },
    {
      key: 'debitAmount',
      id: 'debitAmount',
      label: 'DEBIT',
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
          {row.debitAmount > 0
            ? Number(row.debitAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
            : '—'}
        </span>
      )
    },
    {
      key: 'creditAmount',
      id: 'creditAmount',
      label: 'CREDIT',
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {row.creditAmount > 0
            ? Number(row.creditAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
            : '—'}
        </span>
      )
    }
  ], []);

  // Row actions configuration matching Customer Management
  const rowActions = useMemo(() => [
    {
      key: 'reconcile',
      label: 'Reconcile',
      icon: CheckCircle,
      tooltip: 'Reconcile Transaction',
      'aria-label': 'Reconcile Transaction',
      disabled: reconcileMutation.isPending,
      onClick: (row) => handleReconcile(row),
      className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
    }
  ], [reconcileMutation.isPending]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* ── Page Header (Matching Customer Management) ── */}
      <PageHeader
        title="Bank Reconciliation"
        description="Match your book records with your bank statement"
        icon={FileCheck2}
      >
        <Link
          to={buildPath('/accounts/transactions/bank-transactions')}
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
        >
          <span>Back to Transactions</span>
        </Link>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          disabled={!filters.bankAccountId || isLoading}
        >
          <RefreshCw size={14} className={isLoading || isFetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </PageHeader>

      {/* ── Main Content Area ── */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* 1. Control Panel Card */}
        <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <Building2 size={16} className="text-zinc-500 dark:text-[#A0A6B5]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#E6E8EE]">
              Reconciliation Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 block">
                Select Bank Account <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={bankAccountsList.map((a) => ({
                  value: a.id,
                  label: `${a.bankName} - ${a.accountNumber}`
                }))}
                value={filters.bankAccountId || ''}
                onChange={(e) => handleFilterChange('bankAccountId', e.target.value)}
                placeholder="Choose a bank account"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 block">
                Bank Statement Balance
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 dark:text-[#6B7184]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={statementBalance}
                    onChange={(e) => setStatementBalance(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyBalance()}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-medium rounded-lg bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-[#161922] transition-colors"
                    placeholder="0.00"
                    disabled={!filters.bankAccountId}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBalance}
                  disabled={!filters.bankAccountId}
                  className="btn-primary text-xs h-9 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Empty State (When no bank account selected) */}
        {!filters.bankAccountId ? (
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-[#1D212C] flex items-center justify-center text-zinc-400 dark:text-[#A0A6B5] mb-3 mx-auto border border-zinc-200 dark:border-[#2A2F3D]">
              <Calculator size={22} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] tracking-tight mb-1">
              Select a bank account to begin reconciliation
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] leading-relaxed max-w-sm mx-auto">
              Choose an account from the dropdown above to view book balances, enter statement totals, and reconcile unmatched transactions.
            </p>
          </div>
        ) : isLoading && !data ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-24 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
              <div className="h-24 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
              <div className="h-24 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
              <div className="h-24 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-20 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
              <div className="h-20 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
              <div className="h-20 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          /* Reconciliation Content */
          <>
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Book Balance */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500 dark:text-[#A0A6B5] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Book Balance</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#4C8DFF]/10 flex items-center justify-center text-blue-600 dark:text-[#4C8DFF]">
                    <Building2 size={15} />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-zinc-900 dark:text-[#E6E8EE]">
                  {formatCurrency(summary.bookBalance)}
                </p>
              </div>

              {/* Statement Balance */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500 dark:text-[#A0A6B5] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Statement Balance</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileCheck2 size={15} />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-zinc-900 dark:text-[#E6E8EE]">
                  {formatCurrency(summary.bankStatementBalance)}
                </p>
              </div>

              {/* Difference */}
              <div
                className={`rounded-xl shadow-xs border p-4.5 flex flex-col justify-between ${
                  isBalanced
                    ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    Difference
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isBalanced
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isBalanced ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p
                    className={`text-xl font-bold font-mono ${
                      isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(summary.reconciliationDifference)}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isBalanced
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {isBalanced ? 'Balanced' : 'Discrepancy'}
                  </span>
                </div>
              </div>

              {/* Total Outstanding */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500 dark:text-[#A0A6B5] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Outstanding</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Calculator size={15} />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-zinc-900 dark:text-[#E6E8EE]">
                  {formatCurrency(summary.totalOutstanding)}
                </p>
              </div>
            </div>

            {/* Secondary Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Outstanding Deposits */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Outstanding Deposits
                  </p>
                  <p className="text-lg font-bold font-mono text-zinc-900 dark:text-[#E6E8EE] mt-0.5">
                    {formatCurrency(summary.outstandingDeposits)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft size={18} />
                </div>
              </div>

              {/* Outstanding Withdrawals */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Outstanding Withdrawals
                  </p>
                  <p className="text-lg font-bold font-mono text-zinc-900 dark:text-[#E6E8EE] mt-0.5">
                    {formatCurrency(summary.outstandingWithdrawals)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              {/* Transactions State */}
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                    Transactions State
                  </p>
                  <p className="text-lg font-bold font-mono text-zinc-900 dark:text-[#E6E8EE] mt-0.5 flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400" title="Matched Count">
                      {summary.matchedTransactionCount || 0}
                    </span>
                    <span className="text-zinc-400 dark:text-[#6B7184] text-xs font-normal">matched /</span>
                    <span className="text-amber-600 dark:text-amber-400" title="Unmatched Count">
                      {summary.unmatchedTransactionCount || 0}
                    </span>
                    <span className="text-zinc-400 dark:text-[#6B7184] text-xs font-normal">unmatched</span>
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#222736] flex items-center justify-center text-zinc-500 dark:text-[#A0A6B5]">
                  <CheckCircle size={18} />
                </div>
              </div>
            </div>

            {/* 3. Unmatched Transactions Section Header & DataTable */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-[#E6E8EE]">
                    Unmatched Transactions
                  </h3>
                  <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold">
                    {summary.unmatchedTransactionCount || unmatchedList.length}
                  </span>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={displayedTransactions}
                rowKey={(r) => r.transactionId || r.id || r.referenceNo}
                loading={isLoading}
                isRefreshing={isFetching}

                // Search Toolbar
                searchable
                searchValue={searchTerm}
                searchPlaceholder="Search reference, UTR, narration..."
                onSearchChange={setSearchTerm}

                // Filters
                filters={[
                  {
                    key: 'type',
                    label: 'Transaction Type',
                    type: 'select',
                    options: [
                      { label: 'All Types', value: '' },
                      { label: 'Deposit', value: 'DEPOSIT' },
                      { label: 'Withdrawal', value: 'WITHDRAWAL' },
                      { label: 'Transfer', value: 'TRANSFER' },
                      { label: 'Payment', value: 'PAYMENT' }
                    ]
                  }
                ]}
                filterValues={{ type: typeFilter }}
                onFilterChange={(key, val) => setTypeFilter(val)}
                onReset={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                }}
                onRefresh={refetch}

                // Row Actions
                rowActions={rowActions}

                // Pagination
                pagination={{
                  page: pageInfo.currentPage || page || 0,
                  pageSize: pageInfo.pageSize || pageSize || 10,
                  totalPages: pageInfo.totalPages || 1,
                  totalElements: pageInfo.totalElements || summary.unmatchedTransactionCount || unmatchedList.length
                }}
                pageIndexBase={0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemName="unmatched transactions"

                // Empty State
                emptyMessage="No unmatched transactions found"
                emptyDescription="All caught up! All book transactions for this bank account match your statement."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
