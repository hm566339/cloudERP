import React, { useState } from 'react';
import { BarChart3, Plus, AlertTriangle, Download, ArrowRight, Settings, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useGetBudgetHeadersQuery, useGetBudgetLinesSummaryQuery } from '../../../api/account';
import { useNavigate, useParams } from 'react-router-dom';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';

export default function BudgetManagement() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { data: budgetsData, isLoading } = useGetBudgetHeadersQuery({ page: 0, size: 100, companyId }, { skip: !companyId || companyId === '000000' });
  const { data: summaryData } = useGetBudgetLinesSummaryQuery(companyId, { skip: !companyId || companyId === '000000' });

  const budgets = budgetsData?.data?.budgetHeaders || budgetsData?.budgetHeaders || (Array.isArray(budgetsData) ? budgetsData : []);
  const summary = summaryData?.data || summaryData;

  const { page, setPage, pageSize } = useUrlFilters({ defaultPageSize: 5 });
  const displayedBudgets = budgets.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(budgets.length / pageSize);

  const totalFiscalBudget = summary?.totalAllocatedAmount ?? budgets.reduce((s, b) => s + (b.totalAllocatedAmount || b.totalBudget || 0), 0);
  const totalFiscalSpent  = summary?.totalConsumedAmount  ?? budgets.reduce((s, b) => s + (b.totalConsumedAmount  || b.totalUtilized || 0), 0);
  const totalRemaining    = summary?.totalRemainingAmount !== undefined
    ? summary.totalRemainingAmount
    : totalFiscalBudget - totalFiscalSpent;
  const overallPct = totalFiscalBudget > 0 ? Math.min(100, Math.round((totalFiscalSpent / totalFiscalBudget) * 100)) : 0;

  const alertBudgets = budgets.filter(b => (b.totalConsumedAmount || b.totalUtilized || 0) > (b.totalAllocatedAmount || b.totalBudget || 1));
  const warnBudgets  = budgets.filter(b => {
    const pct = (b.totalConsumedAmount || b.totalUtilized || 0) / (b.totalAllocatedAmount || b.totalBudget || 1);
    return pct >= 0.8 && pct < 1;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="text-indigo-500" size={22} />
            Budget Management
          </h1>
          <p className="page-subtitle">Allocate and monitor departmental budgets for the fiscal year.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary">
            <Download size={15} /> Export
          </button>
          <button onClick={() => navigate(buildPath('/accounts/finance/budget-headers'))} className="btn-primary">
            <Settings size={15} /> Manage Budgets
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="card p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-lg shadow-indigo-200/50 relative overflow-hidden col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
          <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Total Fiscal Budget</p>
          <p className="text-3xl font-bold tracking-tight">₹{totalFiscalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className="mt-3 pt-3 border-t border-indigo-500/30 flex justify-between items-end">
            <div>
              <p className="text-[8px] text-indigo-200 mb-0.5">Utilized</p>
              <p className="font-mono font-bold text-sm">₹{totalFiscalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-indigo-200 mb-0.5">Remaining</p>
              <p className={`font-mono font-bold text-sm ${totalRemaining < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                ₹{totalRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-3">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${overallPct > 90 ? 'bg-rose-400' : overallPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-[8px] text-indigo-200 mt-1">{overallPct}% utilized</p>
          </div>
        </div>

        {/* Spent Card */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Spent</p>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-rose-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">₹{totalFiscalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-zinc-400 mt-1">{overallPct}% of total budget</p>
        </div>

        {/* Remaining Card */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Remaining</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalRemaining < 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
              <TrendingDown size={16} className={totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
            ₹{totalRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{100 - overallPct}% available</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Chart */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Departmental Allocations vs Spend</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} active</p>
            </div>
            <button onClick={() => navigate(buildPath('/accounts/finance/budget-headers'))} className="btn-secondary text-xs py-1.5 px-3">
              <Plus size={13} /> Add Budget
            </button>
          </div>

          <div className="p-5">
            {isLoading ? (
              <TableSkeleton columns={2} rows={4} />
            ) : budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-zinc-200 rounded-xl text-center">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <BarChart3 size={22} className="text-indigo-400" />
                </div>
                <p className="font-semibold text-zinc-600 text-sm">No active budgets found</p>
                <p className="text-xs text-zinc-400 mt-1 mb-4">Create your first budget to start tracking allocations</p>
                <button onClick={() => navigate(buildPath('/accounts/finance/budget-headers'))}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Create your first budget <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {displayedBudgets.map(b => {
                  const allocated = b.totalAllocatedAmount || b.totalBudget || 1;
                  const spent = b.totalConsumedAmount || b.totalUtilized || 0;
                  const pct = Math.min(100, Math.round((spent / allocated) * 100));
                  const isOver = spent > allocated;
                  return (
                    <div key={b.id || b.budgetHeaderId}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm font-semibold text-zinc-800">{b.budgetName || b.name || b.budgetCode}</span>
                          {b.fiscalYearName && <span className="ml-2 text-xs text-zinc-400">{b.fiscalYearName}</span>}
                        </div>
                        <span className="text-xs font-mono text-zinc-500">
                          <span className={isOver ? 'text-rose-600 font-bold' : ''}> ₹{spent.toLocaleString('en-IN')}</span>
                          {' '}/ ₹{allocated.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className={`text-[8px] font-medium ${isOver ? 'text-rose-500' : pct > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {isOver ? '⚠ Over budget' : `${pct}% used`}
                        </span>
                        <span className="text-[8px] text-zinc-400">
                          ₹{(allocated - spent).toLocaleString('en-IN')} remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {budgets.length > 0 && (
              <div className="mt-6">
                <Pagination
                  page={page}
                  onPageChange={setPage}
                  totalPages={totalPages}
                  totalElements={budgets.length}
                  pageSize={pageSize}
                  onPageSizeChange={() => {}}
                />
              </div>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                Budget Alerts
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {alertBudgets.map(b => (
                <div key={`alert-${b.id}`} className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-800">{b.budgetName || b.name} — Over Budget</p>
                  <p className="text-[8px] text-rose-600 mt-0.5">Spend exceeds allocation. Review required.</p>
                </div>
              ))}
              {warnBudgets.map(b => (
                <div key={`warn-${b.id}`} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-800">{b.budgetName || b.name} — Nearing Limit</p>
                  <p className="text-[8px] text-amber-600 mt-0.5">Budget is ≥80% utilized.</p>
                </div>
              ))}
              {!isLoading && budgets.length > 0 && alertBudgets.length === 0 && warnBudgets.length === 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">All budgets within healthy limits.</p>
                </div>
              )}
              {!isLoading && budgets.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-4">No budgets to monitor yet.</p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Quick Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Total Budgets</span>
                <span className="text-xs font-bold text-zinc-800">{budgets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Over Budget</span>
                <span className={`text-xs font-bold ${alertBudgets.length > 0 ? 'text-rose-600' : 'text-zinc-800'}`}>{alertBudgets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">At Risk</span>
                <span className={`text-xs font-bold ${warnBudgets.length > 0 ? 'text-amber-600' : 'text-zinc-800'}`}>{warnBudgets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Healthy</span>
                <span className="text-xs font-bold text-emerald-600">{budgets.length - alertBudgets.length - warnBudgets.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="budget-allocations"
      />
    </div>
  );
}

