import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  FolderTree,
  PieChart,
  Activity,
  BookOpen,
  Clock,
  AlertTriangle,
  Info,
  BarChart2,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { budgetHeadersApi } from '../../../api/account';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import ErrorState from '../../../components/common/ErrorState';
import { StatCardSkeleton, TableSkeleton } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from "../../../hooks/useRoutePath";

const ProgressBar = ({ allocated, utilized }) => {
  const pct = allocated > 0 ? Math.min((utilized / allocated) * 100, 100) : 0;
  const colorClass = pct > 100 ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
      <div className={`${colorClass} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const VarianceBadge = ({ amount }) => {
  if (amount > 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        Positive
      </span>
    );
  }
  if (amount < 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
        Negative
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
      Neutral
    </span>
  );
};

const WarningBadge = ({ show }) => {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[8.8px] font-semibold text-orange-700 border border-orange-200">
      <AlertTriangle size={12} /> Review
    </span>
  );
};

const parseHeader = (headerData) => {
  if (!headerData) return null;
  return headerData?.data?.data || headerData?.data || headerData || null;
};

const parseLines = (linesData) => {
  if (!linesData) return [];
  const raw = linesData?.data?.data?.budgetLines || linesData?.data?.data || linesData?.data?.budgetLines || linesData?.data || linesData || [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.budgetLines)) return raw.budgetLines;
  return [];
};

const formatPct = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
};

export default function BudgetHeaderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [expandedLineId, setExpandedLineId] = useState(null);

  const {
    data: headerData,
    isLoading: isLoadingHeader,
    error: headerError,
    refetch: refetchHeader
  } = useApiQuery(budgetHeadersApi.getBudgetHeaderById, id, { skip: !id });

  const {
    data: linesData,
    isLoading: isLoadingLines,
    error: linesError,
    refetch: refetchLines
  } = useApiQuery(budgetHeadersApi.getBudgetHeaderLines, id, { skip: !id });

  const isLoading = isLoadingHeader || isLoadingLines;
  const error = headerError || linesError;

  const record = useMemo(() => parseHeader(headerData), [headerData]);
  const budgetLines = useMemo(() => parseLines(linesData), [linesData]);

  const metrics = useMemo(() => {
    const totalBudget = record?.totalBudget ?? budgetLines.reduce((sum, line) => sum + (line.allocatedAmount || 0), 0);
    const totalAllocated = record?.totalAllocated ?? budgetLines.reduce((sum, line) => sum + (line.allocatedAmount || 0), 0);
    const totalUtilized = record?.totalUtilized ?? budgetLines.reduce((sum, line) => sum + (line.utilizedAmount || 0), 0);
    const remainingBudget = record?.remainingBudget ?? Math.max(totalBudget - totalUtilized, 0);
    const overallUtilization = totalBudget > 0 ? (totalUtilized / totalBudget) * 100 : 0;
    const overallAllocation = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
    const overallRemaining = totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0;
    const highestAllocation = budgetLines.reduce((max, line) => Math.max(max, line.allocatedAmount || 0), 0);
    const utilizationValues = budgetLines.map((line) => (line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0));
    const highestUtilization = utilizationValues.length ? Math.max(...utilizationValues) : 0;
    const averageUtilization = utilizationValues.length ? utilizationValues.reduce((sum, value) => sum + value, 0) / utilizationValues.length : 0;
    const totalVariance = budgetLines.reduce((sum, line) => sum + (line.varianceAmount || 0), 0);
    const positiveVariance = budgetLines.reduce((sum, line) => sum + Math.max((line.varianceAmount || 0), 0), 0);
    const negativeVariance = budgetLines.reduce((sum, line) => sum + Math.min((line.varianceAmount || 0), 0), 0);
    const varianceAlertLines = budgetLines.filter((line) => {
      const pct = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
      return (line.varianceAmount || 0) > 0 || pct > 100;
    });
    const topConsumers = [...budgetLines]
      .sort((a, b) => (b.utilizedAmount || 0) - (a.utilizedAmount || 0))
      .slice(0, 5);

    return {
      totalBudget,
      totalAllocated,
      totalUtilized,
      remainingBudget,
      overallUtilization,
      overallAllocation,
      overallRemaining,
      highestAllocation,
      highestUtilization,
      averageUtilization,
      totalVariance,
      positiveVariance,
      negativeVariance,
      varianceAlertLines,
      topConsumers
    };
  }, [record, budgetLines]);

  const toggleLine = (lineId) => setExpandedLineId((prev) => (prev === lineId ? null : lineId));
  const handleRetry = () => {
    refetchHeader();
    refetchLines();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 w-full md:w-2/3">
            <div className="h-10 w-2/3 rounded-xl bg-zinc-100 animate-pulse" />
            <div className="h-4 w-1/2 rounded-xl bg-zinc-100 animate-pulse" />
          </div>
          <div className="flex gap-2 flex-wrap justify-end w-full md:w-auto">
            <div className="h-10 w-28 rounded-xl bg-zinc-100 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-100 animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-100 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6"><TableSkeleton rows={4} columns={1} /></div>
          <div className="bg-white rounded-3xl border border-zinc-200 p-6"><TableSkeleton rows={4} columns={1} /></div>
          <div className="bg-white rounded-3xl border border-zinc-200 p-6"><TableSkeleton rows={4} columns={1} /></div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden"><TableSkeleton rows={5} columns={8} /></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <ErrorState
        title="Unable to load budget details"
        message={error?.response?.data?.message || error?.message || 'Something went wrong while fetching this budget.'}
        onRetry={handleRetry}
      />
    );
  }

  const headerTitle = record.budgetName || 'Budget Header';
  const fiscalYearLabel = record.fiscalYearName || record.fiscalYear?.fiscalYearName || record.fiscalYearId || '-';
  const companyLabel = record.companyName || record.company?.companyName || record.companyId || '-';
  const effectiveRemaining = record.remainingBudget ?? Math.max(metrics.totalBudget - metrics.totalUtilized, 0);
  const statusLabel = (record.status || 'Draft').toString().toUpperCase();

  return (
    <div className="flex flex-col min-h-full bg-zinc-50">
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(buildPath('/accounts/budget/budget-headers'))}
                    className="w-10 h-10 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">{headerTitle}</h1>
                    <p className="text-sm text-zinc-500">View complete budget header details, allocations and utilization metrics.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1">
                    <FolderTree size={14} /> Budget
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1">
                    <Clock size={14} /> {fiscalYearLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1">
                    <Activity size={14} /> {statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <Download size={16} /> Export
                </button>
                <button onClick={() => navigate(buildPath(`/accounts/budget/budget-headers/edit/${id}`))} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                  <Edit size={16} /> Edit Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Total Budget</p>
            <p className="mt-4 text-3xl font-semibold text-zinc-900">{formatCurrency(metrics.totalBudget)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Total Allocated</p>
            <p className="mt-4 text-3xl font-semibold text-blue-700">{formatCurrency(metrics.totalAllocated)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Total Utilized</p>
            <p className="mt-4 text-3xl font-semibold text-emerald-700">{formatCurrency(metrics.totalUtilized)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Remaining Budget</p>
            <p className="mt-4 text-3xl font-semibold text-amber-700">{formatCurrency(effectiveRemaining)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Basic Information</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-zinc-700 sm:grid-cols-2">
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Budget Name</p>
                  <p className="mt-2 font-medium text-zinc-900">{headerTitle}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Fiscal Year</p>
                  <p className="mt-2 font-medium text-zinc-900">{fiscalYearLabel}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Company</p>
                  <p className="mt-2 font-medium text-zinc-900">{companyLabel}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Budget Header ID</p>
                  <p className="mt-2 font-mono text-[10.4px] text-zinc-600 break-words">{record.id || record.budgetHeaderId || '-'}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Created At</p>
                  <p className="mt-2 font-medium text-zinc-900">{formatDate(record.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500">Updated At</p>
                  <p className="mt-2 font-medium text-zinc-900">{formatDate(record.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Financial Summary</h2>
                  <p className="text-xs text-zinc-500 mt-1">Allocation and utilization performance</p>
                </div>
                <PieChart size={20} className="text-zinc-400" />
              </div>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700">
                    <span>Utilization %</span>
                    <span className="font-semibold text-emerald-700">{formatPct(metrics.overallUtilization)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(metrics.overallUtilization, 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700">
                    <span>Allocation %</span>
                    <span className="font-semibold text-blue-700">{formatPct(metrics.overallAllocation)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(metrics.overallAllocation, 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700">
                    <span>Remaining %</span>
                    <span className="font-semibold text-amber-700">{formatPct(metrics.overallRemaining)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(metrics.overallRemaining, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Total Budget Lines</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900">{budgetLines.length}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Highest Allocation</p>
                <p className="mt-4 text-3xl font-semibold text-blue-700">{formatCurrency(metrics.highestAllocation)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Highest Utilization</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-700">{formatPct(metrics.highestUtilization)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Average Utilization</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900">{formatPct(metrics.averageUtilization)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Total Variance</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900">{formatCurrency(metrics.totalVariance)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Positive Variance</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-700">{formatCurrency(metrics.positiveVariance)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500">Negative Variance</p>
                <p className="mt-4 text-3xl font-semibold text-red-700">{formatCurrency(metrics.negativeVariance)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Budget Utilization Chart</h2>
                  <p className="text-xs text-zinc-500 mt-1">Each budget line has its own progress indicator.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {budgetLines.length} lines
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {budgetLines.map((line) => {
                  const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                  return (
                    <div key={line.id || line.budgetLineId || line.accountCode} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-700">
                        <div className="font-medium text-zinc-900">{line.accountName || line.account?.accountName || 'Unknown account'}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{formatPct(utilization)}</div>
                      </div>
                      <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div className={`h-full ${utilization > 100 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Top Consuming Accounts</h2>
                  <p className="text-xs text-zinc-500 mt-1">Top 5 budget lines sorted by utilized amount.</p>
                </div>
                <Activity size={20} className="text-zinc-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-zinc-700">
                  <thead className="bg-zinc-50 text-[8.8px] uppercase tracking-[0.18em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Allocated</th>
                      <th className="px-4 py-3 text-right">Utilized</th>
                      <th className="px-4 py-3 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {metrics.topConsumers.map((line) => (
                      <tr key={line.id || line.budgetLineId}>
                        <td className="px-4 py-3 font-medium text-zinc-900">{line.accountName || line.account?.accountName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(line.allocatedAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(line.utilizedAmount)}</td>
                        <td className="px-4 py-3 text-right text-amber-700">{formatCurrency(line.remainingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Variance Report</h2>
                  <p className="text-xs text-zinc-500 mt-1">Highlight lines where variance & utilization need review.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  {metrics.varianceAlertLines.length} flagged
                </span>
              </div>
              {metrics.varianceAlertLines.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-700">
                  No variance warnings found. Budget is operating within expected thresholds.
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.varianceAlertLines.map((line) => {
                    const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                    return (
                      <div key={line.id || line.budgetLineId} className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900">{line.accountName || line.account?.accountName || 'Unknown account'}</p>
                            <p className="text-xs text-zinc-500">{line.accountCode || '-'}</p>
                          </div>
                          <WarningBadge show />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-zinc-700">
                          <div className="rounded-2xl bg-white p-3 border border-orange-100">
                            <p className="text-[8.8px] uppercase tracking-[0.18em] text-zinc-500">Variance Amount</p>
                            <p className="mt-2 font-semibold text-zinc-900">{formatCurrency(line.varianceAmount)}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-3 border border-orange-100">
                            <p className="text-[8.8px] uppercase tracking-[0.18em] text-zinc-500">Utilization</p>
                            <p className="mt-2 font-semibold text-zinc-900">{formatPct(utilization)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-zinc-50 border-b border-zinc-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900">Budget Lines</h2>
                <p className="text-xs text-zinc-500 mt-1">Detailed budget line review with expandable sections.</p>
              </div>
              <div className="text-xs text-zinc-500">{budgetLines.length} lines</div>
            </div>
          </div>

          {budgetLines.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-300">
                <BarChart2 size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">No Budget Lines Found</h3>
              <p className="mt-2 text-sm text-zinc-500">This budget header has not been allocated to any budget lines yet.</p>
              <button
                onClick={() => navigate(buildPath('/accounts/budget/budget-lines'))}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                <Plus size={16} /> Create Budget Line
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-zinc-700">
                <thead className="bg-zinc-50 text-[8.8px] uppercase tracking-[0.18em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-4">#</th>
                    <th className="px-4 py-4">Account Code</th>
                    <th className="px-4 py-4">Account Name</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4 text-right">Allocated</th>
                    <th className="px-4 py-4 text-right">Utilized</th>
                    <th className="px-4 py-4 text-right">Remaining</th>
                    <th className="px-4 py-4 text-center">Utilization %</th>
                    <th className="px-4 py-4 text-right">Variance</th>
                    <th className="px-4 py-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {budgetLines.map((line, index) => {
                    const lineId = line.id || line.budgetLineId || index;
                    const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                    const variancePct = line.variancePercentage ?? ((line.allocatedAmount > 0 && line.varianceAmount != null) ? ((line.varianceAmount / line.allocatedAmount) * 100) : 0);
                    const varianceType = line.varianceType || (line.varianceAmount > 0 ? 'FAVORABLE' : line.varianceAmount < 0 ? 'ADVERSE' : 'NEUTRAL');
                    const isAlert = (line.varianceAmount || 0) > 0 || utilization > 100;

                    return (
                      <React.Fragment key={lineId}>
                        <tr
                          className={`border-b border-zinc-100 transition-colors ${isAlert ? 'bg-rose-50/30' : 'hover:bg-zinc-50'} cursor-pointer`}
                          onClick={() => toggleLine(lineId)}
                        >
                          <td className="px-4 py-4 font-semibold text-zinc-900">{index + 1}</td>
                          <td className="px-4 py-4 font-mono text-xs text-zinc-600">{line.accountCode || '-'}</td>
                          <td className="px-4 py-4 font-medium text-zinc-900">{line.accountName || line.account?.accountName || '-'}</td>
                          <td className="px-4 py-4">{line.departmentName || line.department?.departmentName || '-'}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.allocatedAmount)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.utilizedAmount)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.remainingAmount)}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="space-y-2">
                              <div className={`text-[8.8px] font-semibold ${utilization > 100 ? 'text-red-600' : 'text-zinc-900'}`}>{formatPct(utilization)}</div>
                              <ProgressBar allocated={line.allocatedAmount} utilized={line.utilizedAmount || 0} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-zinc-900">{formatCurrency(line.varianceAmount)}</td>
                          <td className="px-4 py-4 text-right text-zinc-500">
                            <ChevronDown className={`inline-block transition-transform ${expandedLineId === lineId ? 'rotate-180' : ''}`} size={18} />
                          </td>
                        </tr>
                        {expandedLineId === lineId && (
                          <tr className="bg-zinc-50">
                            <td colSpan={9} className="px-4 py-5">
                              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 mb-4"><Info size={14} />Account Information</div>
                                  <div className="space-y-3 text-sm text-zinc-700">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Account Code</span><span className="font-semibold text-zinc-900">{line.accountCode || '-'}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Account Name</span><span className="font-semibold text-zinc-900">{line.accountName || line.account?.accountName || '-'}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Department</span><span className="font-semibold text-zinc-900">{line.departmentName || line.department?.departmentName || '-'}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 mb-4"><BookOpen size={14} />Budget Details</div>
                                  <div className="space-y-3 text-sm text-zinc-700">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Allocated Amount</span><span className="font-semibold text-blue-700">{formatCurrency(line.allocatedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Utilized Amount</span><span className="font-semibold text-emerald-700">{formatCurrency(line.utilizedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Actual Expense</span><span className="font-semibold text-zinc-900">{formatCurrency(line.actualExpense ?? line.utilizedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Remaining Amount</span><span className="font-semibold text-amber-700">{formatCurrency(line.remainingAmount)}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 mb-4"><Activity size={14} />Variance Analysis</div>
                                  <div className="space-y-3 text-sm text-zinc-700">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Variance Amount</span><span className={`font-semibold ${line.varianceAmount > 0 ? 'text-emerald-700' : line.varianceAmount < 0 ? 'text-red-700' : 'text-zinc-900'}`}>{formatCurrency(line.varianceAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Variance %</span><span className="font-semibold text-zinc-900">{formatPct(variancePct)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Variance Type</span><span className="font-semibold text-zinc-900">{varianceType}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 mb-4"><Clock size={14} />Timeline</div>
                                  <div className="space-y-3 text-sm text-zinc-700">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Created At</span><span className="font-semibold text-zinc-900">{formatDate(line.createdAt)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500">Updated At</span><span className="font-semibold text-zinc-900">{formatDate(line.updatedAt)}</span></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
