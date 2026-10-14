import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { glJournalLinesApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import Pagination from '../../../components/common/Pagination';
import SortableHeader from '../../../components/common/SortableHeader';
import { useRoutePath } from "../../../hooks/useRoutePath";
import { getSerialNumber } from '../../../utils/serialNumberHelper';

const JournalLinesByJournal = () => {
  const { buildPath } = useRoutePath();
  const { journalId } = useParams();

  const {
    handleSort,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getSortConfig,
    filters
  } = useUrlFilters({
    defaultSortBy: 'id',
    defaultSortOrder: 'desc'
  });

  const { data: linesData, isLoading, refetch } = useApiQuery(glJournalLinesApi.getJournalLinesByJournal, {
    journalId,
    params: {
      page,
      size: pageSize,
      sortBy,
      sortDir: sortOrder
    }
  });

  const journalLines = linesData?.content || linesData?.data?.content || linesData || [];
  const pageInfo = linesData?.pageable ? linesData : (linesData?.data || {});

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to={buildPath(`/accounts/transactions/journals/${journalId}`)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-zinc-500" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <BookOpen size={22} className="text-blue-600" />
              Lines for Journal
            </h1>
            <p className="page-subtitle text-xs truncate max-w-sm">ID: {journalId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-12 text-center">S.No.</th>
                <SortableHeader label="Voucher No." field="voucherNo" sortConfig={getSortConfig('voucherNo')} onSort={handleSort} />
                <SortableHeader label="A/C Code" field="accountCode" sortConfig={getSortConfig('accountCode')} onSort={handleSort} />
                <SortableHeader label="Account Name" field="accountName" sortConfig={getSortConfig('accountName')} onSort={handleSort} />
                <SortableHeader label="Debit" field="debitAmount" sortConfig={getSortConfig('debitAmount')} onSort={handleSort} align="right" />
                <SortableHeader label="Credit" field="creditAmount" sortConfig={getSortConfig('creditAmount')} onSort={handleSort} align="right" />
                <SortableHeader label="Currency" field="currencyCode" sortConfig={getSortConfig('currencyCode')} onSort={handleSort} />
                <SortableHeader label="Base Amount" field="baseAmount" sortConfig={getSortConfig('baseAmount')} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody className="staggered-list">
              {isLoading ? (
                <TableRowSkeleton columns={8} />
              ) : journalLines.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="p-12 text-center text-zinc-500">
                      No lines found for this journal
                    </div>
                  </td>
                </tr>
              ) : (
                journalLines.map((line, index) => (
                  <tr key={line.id}>
                    <td className="text-center text-zinc-500 tabular-nums">{getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}</td>
                    <td>{line.voucherNo}</td>
                    <td className="font-mono text-zinc-600">{line.accountCode}</td>
                    <td className="font-semibold">{line.accountName}</td>
                    <td className="text-right text-emerald-600 font-medium">{line.debitAmount > 0 ? line.debitAmount.toLocaleString() : '-'}</td>
                    <td className="text-right text-rose-600 font-medium">{line.creditAmount > 0 ? line.creditAmount.toLocaleString() : '-'}</td>
                    <td>{line.currencyCode}</td>
                    <td className="text-right font-medium">{line.baseAmount?.toLocaleString() || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && journalLines.length > 0 && (
            <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
              <Pagination
                page={pageInfo.number || page || 0}
                pageSize={pageInfo.size || pageSize || 10}
                totalPages={pageInfo.totalPages || 1}
                totalElements={pageInfo.totalElements || journalLines.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemName="lines"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalLinesByJournal;
