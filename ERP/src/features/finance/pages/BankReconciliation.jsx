import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, CheckCircle, XCircle, RefreshCw, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, Calculator, FileCheck2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankTransactionsApi } from '../../../api/account';
import { accountHttpClient } from '../../../api/common/client';
import useUrlFilters from '../../../hooks/useUrlFilters';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import CustomSelect from '../../../components/common/CustomSelect';
import { confirmDialog } from '../../../utils/confirmDialog';
import Pagination from '../../../components/common/Pagination';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function BankReconciliation() {
  const { buildPath } = useRoutePath();

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
  
  // Update state when URL filter changes
  useEffect(() => {
    if (filters.bankStatementBalance && filters.bankStatementBalance !== statementBalance) {
      setStatementBalance(filters.bankStatementBalance);
    }
  }, [filters.bankStatementBalance]);

  // Fetch Bank Accounts for dropdown
  const { data: bankAccountsData } = useApiQuery(() => accountHttpClient.get('/api/account/bank-accounts', { params: { size: 1000 } }).catch(() => ({ data: [] })));
  const raw_bankAccountsList = bankAccountsData?.data?.content || bankAccountsData?.data || [];
  const bankAccountsList = Array.isArray(raw_bankAccountsList) ? raw_bankAccountsList : [];

  const { data, isLoading, refetch } = useApiQuery(bankTransactionsApi.getReconciliationSummary, {
    bankAccountId: filters.bankAccountId,
    bankStatementBalance: filters.bankStatementBalance,
    page,
    size: pageSize
  }, {
    enabled: !!filters.bankAccountId
  });

  const summary = data?.data || {};
  const raw_unmatchedList = summary.unmatchedTransactions || [];
  const unmatchedList = Array.isArray(raw_unmatchedList) ? raw_unmatchedList : [];
  const pageInfo = data?.pagination || data?.data?.pagination || {};

  const reconcileMutation = useApiMutation(bankTransactionsApi.reconcileTransaction);

  const handleApplyBalance = () => {
    handleFilterChange('bankStatementBalance', statementBalance);
  };

  const handleReconcile = async (transaction) => {
    if (await confirmDialog({ message: `Are you sure you want to reconcile this transaction (${transaction.referenceNo || transaction.transactionId})?` })) {
      try {
        await reconcileMutation.mutateAsync(transaction.transactionId || transaction.id);
        refetch();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to reconcile transaction');
      }
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileCheck2 size={22} className="text-blue-600" />
            Bank Reconciliation
          </h1>
          <p className="page-subtitle">Match your book records with your bank statement</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to={buildPath("/accounts/transactions/bank-transactions")} className="btn-secondary">
            Back to Transactions
          </Link>
          <button 
            onClick={() => refetch()} 
            className="btn-secondary flex items-center gap-2"
            disabled={!filters.bankAccountId || isLoading}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="card p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Select Bank Account *</label>
            <CustomSelect
              options={bankAccountsList.map(a => ({ value: a.id, label: `${a.bankName} - ${a.accountNumber}` }))}
              value={filters.bankAccountId || ''}
              onChange={(e) => handleFilterChange('bankAccountId', e.target.value)}
              placeholder="Choose a bank account"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Bank Statement Balance</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyBalance()}
                  className="input-field pl-8 w-full"
                  placeholder="0.00"
                  disabled={!filters.bankAccountId}
                />
              </div>
              <button 
                onClick={handleApplyBalance}
                disabled={!filters.bankAccountId}
                className="btn-primary whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dashboard (Only if account selected) */}
      {!filters.bankAccountId ? (
        <div className="card p-12 text-center text-zinc-500">
          <Calculator size={48} className="mx-auto mb-4 text-zinc-300" />
          <p className="text-lg font-medium text-zinc-700">Select a bank account to begin reconciliation</p>
          <p className="text-sm mt-1">You can also provide a bank statement balance to calculate differences.</p>
        </div>
      ) : isLoading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card h-28 animate-pulse bg-zinc-100"></div>
          <div className="card h-28 animate-pulse bg-zinc-100"></div>
          <div className="card h-28 animate-pulse bg-zinc-100"></div>
          <div className="card h-28 animate-pulse bg-zinc-100"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Book Balance</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {summary.bookBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}
              </p>
            </div>
            
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileCheck2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Statement Balance</span>
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {summary.bankStatementBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}
              </p>
            </div>
            
            <div className={`card p-4 flex flex-col gap-2 ${summary.reconciliationDifference === 0 ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
              <div className={`flex items-center gap-2 ${summary.reconciliationDifference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {summary.reconciliationDifference === 0 ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span className="text-xs font-semibold uppercase tracking-wider">Difference</span>
              </div>
              <p className={`text-2xl font-bold ${summary.reconciliationDifference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {summary.reconciliationDifference?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}
              </p>
            </div>
            
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-600">
                <Calculator size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-zinc-900">
                  {summary.totalOutstanding?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-4 flex justify-between items-center bg-emerald-50/50 border-emerald-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Outstanding Deposits</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{summary.outstandingDeposits?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <ArrowDownLeft size={20} />
              </div>
            </div>
            <div className="card p-4 flex justify-between items-center bg-rose-50/50 border-rose-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Outstanding Withdrawals</p>
                <p className="text-xl font-bold text-rose-700 mt-1">{summary.outstandingWithdrawals?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-full text-rose-600">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="card p-4 flex justify-between items-center bg-zinc-50/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Transactions State</p>
                <p className="text-lg font-bold text-zinc-800 mt-1 flex items-center gap-2">
                  <span className="text-emerald-600" title="Matched">{summary.matchedTransactionCount || 0}</span>
                  <span className="text-zinc-300">/</span>
                  <span className="text-amber-600" title="Unmatched">{summary.unmatchedTransactionCount || 0}</span>
                </p>
              </div>
              <div className="p-3 bg-zinc-100 rounded-full text-zinc-500">
                <Activity size={20} />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                Unmatched Transactions
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {summary.unmatchedTransactionCount || unmatchedList.length}
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ref / UTR</th>
                    <th>Narration</th>
                    <th>Type</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="staggered-list">
                  {isLoading ? (
                    <TableRowSkeleton columns={7} />
                  ) : unmatchedList.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="p-12 text-center text-zinc-500">
                          <CheckCircle size={32} className="mx-auto mb-3 text-emerald-400" />
                          All caught up! No unmatched transactions found.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    unmatchedList.map((record) => {
                      const typeColors = {
                        DEPOSIT: 'bg-emerald-50 text-emerald-700',
                        WITHDRAWAL: 'bg-rose-50 text-rose-700',
                        TRANSFER: 'bg-blue-50 text-blue-700',
                        PAYMENT: 'bg-amber-50 text-amber-700'
                      };
                      return (
                        <tr key={record.transactionId || record.id}>
                          <td className="whitespace-nowrap">{new Date(record.transactionDate).toLocaleDateString()}</td>
                          <td className="font-medium text-zinc-900">
                            {record.referenceNo || '-'} {record.utrNo ? ` / ${record.utrNo}` : ''}
                          </td>
                          <td className="max-w-[160px] truncate" title={record.narration}>
                            {record.narration || '-'}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${typeColors[record.transactionType] || 'bg-zinc-100 text-zinc-700'}`}>
                              {record.transactionType}
                            </span>
                          </td>
                          <td className="text-right font-medium text-rose-600">
                            {record.debitAmount > 0 ? record.debitAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                          </td>
                          <td className="text-right font-medium text-emerald-600">
                            {record.creditAmount > 0 ? record.creditAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                          </td>
                          <td>
                            <div className="flex items-center justify-end">
                              <button 
                                onClick={() => handleReconcile(record)} 
                                className="btn-secondary text-emerald-600 py-1 px-2 text-xs flex items-center gap-1"
                                disabled={reconcileMutation.isPending}
                              >
                                <CheckCircle size={14} /> Reconcile
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {!isLoading && unmatchedList.length > 0 && pageInfo && (
                <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
                  <Pagination
                    page={pageInfo.currentPage || page || 0}
                    pageSize={pageInfo.pageSize || pageSize || 10}
                    totalPages={pageInfo.totalPages || 1}
                    totalElements={pageInfo.totalElements || summary.unmatchedTransactionCount || unmatchedList.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    itemName="unmatched transactions"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
