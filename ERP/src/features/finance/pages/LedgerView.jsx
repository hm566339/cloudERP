import React from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Printer, Download } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { glJournalLinesApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from "../../../hooks/useRoutePath";

const LedgerView = () => {
  const { buildPath } = useRoutePath();
  const { accountId } = useParams();

  const {
    filters
  } = useUrlFilters({
    defaultSortBy: 'voucherDate',
    defaultSortDir: 'asc'
  });

  // For a true ledger view, we often need all records to calculate a running balance properly,
  // or the backend should return the running balance. Since schema only shows the basic array,
  // we'll fetch with a large page size and calculate it on the fly.
  const { data: ledgerData, isLoading } = useApiQuery(glJournalLinesApi.getLedgerByAccount, {
    accountId,
    params: {
      page: 0,
      size: 1000,
      sortBy: filters.sortBy || 'voucherDate',
      sortDir: filters.sortDir || 'asc'
    }
  });

  const lines = Array.isArray(ledgerData) ? ledgerData : (ledgerData?.content || ledgerData?.data?.content || []);
  
  let runningBalance = 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link to={buildPath('/accounts/transactions/journal-lines')} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-full transition-colors">
            <ArrowLeft size={20} className="text-zinc-500 dark:text-[#A0A6B5]" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <BookOpen size={22} className="text-emerald-600 dark:text-emerald-400" />
              Ledger View
            </h1>
            <p className="page-subtitle text-xs text-zinc-500 dark:text-[#A0A6B5] truncate max-w-sm">Account ID: {accountId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="erp-table print:text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center">S.No.</th>
                <th>Date</th>
                <th>Voucher No.</th>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Description</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right bg-zinc-50 dark:bg-[#1D212C]">Running Balance</th>
                <th>Currency</th>
                <th className="text-right">Base Amount</th>
              </tr>
            </thead>
            <tbody className="staggered-list">
              {isLoading ? (
                <TableRowSkeleton columns={11} />
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="p-12 text-center text-zinc-500 dark:text-[#A0A6B5]">
                      No ledger entries found for this account
                    </div>
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => {
                  runningBalance += (line.debitAmount || 0) - (line.creditAmount || 0);
                  return (
                    <tr key={line.id}>
                      <td className="text-center text-zinc-500 dark:text-[#6B7184]">{index + 1}</td>
                      <td className="whitespace-nowrap">{line.voucherDate}</td>
                      <td className="font-mono text-zinc-600 dark:text-[#A0A6B5]">{line.voucherNo}</td>
                      <td className="font-mono">{line.accountCode}</td>
                      <td className="font-semibold">{line.accountName}</td>
                      <td className="text-sm truncate max-w-[120px]" title={line.lineDescription}>{line.lineDescription}</td>
                      <td className="text-right text-emerald-600 dark:text-emerald-400 font-medium">{line.debitAmount > 0 ? line.debitAmount.toLocaleString() : '-'}</td>
                      <td className="text-right text-rose-600 dark:text-rose-400 font-medium">{line.creditAmount > 0 ? line.creditAmount.toLocaleString() : '-'}</td>
                      <td className="text-right font-bold bg-zinc-50/50 dark:bg-[#1D212C]/50">
                        <span className={runningBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                          {Math.abs(runningBalance).toLocaleString()} {runningBalance >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </td>
                      <td>{line.currencyCode}</td>
                      <td className="text-right">{line.baseAmount?.toLocaleString() || '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerView;
