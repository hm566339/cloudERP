import React, { useRef, useState } from 'react';
import { BarChart2, RefreshCw, Download } from 'lucide-react';
import ExportModal from '../../../components/common/ExportModal';
import { useApiQuery } from '../../../hooks/useApi';
import { budgetLinesApi, chartOfAccountsApi } from '../../../api/account';
import { accountHttpClient } from '../../../api/common/client';
import useUrlFilters from '../../../hooks/useUrlFilters';

import Pagination from '../../../components/common/Pagination';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import CustomSelect from '../../../components/common/CustomSelect';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function BudgetVarianceReport() {
  const { buildPath } = useRoutePath();

  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    filters,
    handleFilterChange,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  resetFilters
  } = useUrlFilters({ defaultSortBy: 'createdAt', defaultSortDir: 'desc' });

  // Fetch Report Data
  const { data, isLoading, refetch } = useApiQuery(budgetLinesApi.getBudgetVarianceReport, {
    page,
    pageSize,
    budgetHeaderId: filters.budgetHeaderId,
    accountId: filters.accountId,
    departmentId: filters.departmentId
  });

  const reportData = data?.data?.varianceLines || [];
  const pageInfo = data?.data?.paginationResponse || data?.pagination || {};

  // Fetch Dropdown Data
  const { data: accountsData } = useApiQuery(chartOfAccountsApi.getList, { size: 1000, companyId });
  const accountsResponse = accountsData?.data?.data ?? accountsData?.data ?? accountsData;
  const raw_accountsList = Array.isArray(accountsResponse?.content)
    ? accountsResponse.content
    : Array.isArray(accountsResponse?.items)
      ? accountsResponse.items
      : Array.isArray(accountsResponse)
        ? accountsResponse
        : [];
  const accountsList = Array.isArray(raw_accountsList) ? raw_accountsList : [];

  const { data: budgetHeadersData } = useApiQuery(() => accountHttpClient.get('/api/account/budget-headers', { params: { size: 1000, companyId } }));
  const raw_budgetHeadersList = budgetHeadersData?.data?.content || budgetHeadersData?.data || [];
  const budgetHeadersList = Array.isArray(raw_budgetHeadersList) ? raw_budgetHeadersList : [];

  const departmentsData = { data: [] };
  const raw_departmentsList = [];
  const departmentsList = [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 size={22} className="text-purple-600" />
            Budget Variance Report
          </h1>
          <p className="page-subtitle">Analyze budget performance and variances</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap gap-3">
          <div className="w-56">
            <CustomSelect
              options={budgetHeadersList.map(h => ({ value: h.id, label: h.budgetName || h.name || h.budgetHeaderName || h.id }))}
              value={filters.budgetHeaderId || ''}
              onChange={(e) => handleFilterChange('budgetHeaderId', e.target.value)}
              placeholder="All Budget Headers"
            />
          </div>
          <div className="w-56">
            <CustomSelect
              options={accountsList.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }))}
              value={filters.accountId || ''}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
              placeholder="All Accounts"
            />
          </div>
          <div className="w-56">
            <CustomSelect
              options={departmentsList.map(d => ({ value: d.id, label: d.name || d.departmentName || d.id }))}
              value={filters.departmentId || ''}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              placeholder="All Departments"
            />
          </div>
          {Object.keys(filters).length > 0 && (
            <button onClick={() => resetFilters()} className="btn-secondary">
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="print-header hidden p-6 text-center border-b border-zinc-200">
            <h1 className="text-2xl font-bold text-zinc-900">Budget Variance Report</h1>
            <p className="text-zinc-500 mt-2">Generated on {new Date().toLocaleString()}</p>
          </div>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Budget Header</th>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Department</th>
                <th className="text-right">Allocated Amount</th>
                <th className="text-right">Actual Expense</th>
                <th className="text-right">Remaining Amount</th>
                <th className="text-right">Variance Amount</th>
                <th className="text-right">Variance %</th>
                <th className="text-center">Variance Type</th>
              </tr>
            </thead>
            <tbody className="staggered-list">
              {isLoading ? (
                <TableRowSkeleton columns={10} />
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="p-12 text-center text-zinc-500">
                      No report data found for the selected criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.map((row, index) => {
                  const departmentName = departmentsList.find(d => d.id === row.departmentId)?.name || row.departmentId || '-';
                  return (
                    <tr key={index}>
                      <td className="font-medium text-zinc-900">{row.budgetHeaderName || row.budgetHeaderId}</td>
                      <td className="font-mono text-sm text-blue-600">{row.accountCode}</td>
                      <td>{row.accountName}</td>
                      <td>{departmentName}</td>
                      <td className="text-right font-medium">{row.allocatedAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}</td>
                      <td className="text-right">{row.actualExpense?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}</td>
                      <td className="text-right">{row.remainingAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}</td>
                      <td className={`text-right font-semibold ${row.varianceAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {row.varianceAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0.00'}
                      </td>
                      <td className="text-right font-medium">{row.variancePercentage?.toFixed(1) || 0}%</td>
                      <td className="text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                          row.varianceType === 'FAVORABLE' ? 'bg-emerald-50 text-emerald-700' :
                          row.varianceType === 'ADVERSE' ? 'bg-red-50 text-red-700' :
                          'bg-zinc-100 text-zinc-700'
                        }`}>
                          {row.varianceType || 'NONE'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && reportData.length > 0 && (
          <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
            <Pagination
              page={pageInfo.page || pageInfo.currentPage || page || 0}
              pageSize={pageInfo.size || pageInfo.pageSize || pageSize || 10}
              totalPages={pageInfo.totalPages || 1}
              totalElements={pageInfo.totalElements || reportData.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName="report rows"
            />
          </div>
        )}
      </div>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="budget-variance-report"
      />
    </div>
  );
}
