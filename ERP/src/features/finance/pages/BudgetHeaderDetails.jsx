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
    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-[#222736] overflow-hidden">
      <div className={`${colorClass} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const VarianceBadge = ({ amount }) => {
  if (amount > 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
        Positive
      </span>
    );
  }
  if (amount < 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
        Negative
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 text-[8.8px] font-semibold rounded-full bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#2A2F3D]">
      Neutral
    </span>
  );
};

const WarningBadge = ({ show }) => {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 text-[8.8px] font-semibold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
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
      <div className="p-6 space-y-6 bg-zinc-50 dark:bg-[#0F1117] min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 w-full md:w-2/3">
            <div className="h-10 w-2/3 rounded-xl bg-zinc-100 dark:bg-[#1D212C] animate-pulse" />
            <div className="h-4 w-1/2 rounded-xl bg-zinc-100 dark:bg-[#1D212C] animate-pulse" />
          </div>
          <div className="flex gap-2 flex-wrap justify-end w-full md:w-auto">
            <div className="h-10 w-28 rounded-xl bg-zinc-100 dark:bg-[#1D212C] animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-100 dark:bg-[#1D212C] animate-pulse" />
            <div className="h-10 w-28 rounded-xl bg-zinc-100 dark:bg-[#1D212C] animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#161922] rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] p-6"><TableSkeleton rows={4} columns={1} /></div>
          <div className="bg-white dark:bg-[#161922] rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] p-6"><TableSkeleton rows={4} columns={1} /></div>
          <div className="bg-white dark:bg-[#161922] rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] p-6"><TableSkeleton rows={4} columns={1} /></div>
        </div>

        <div className="bg-white dark:bg-[#161922] rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden"><TableSkeleton rows={5} columns={8} /></div>
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
    <div className="flex flex-col min-h-full bg-zinc-50 dark:bg-[#0F1117]">
      <div className="sticky top-0 z-20 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
        <div className="mx-auto max-w-7xl 3xl:max-w-[1800px] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(buildPath('/accounts/budget/budget-headers'))}
                    className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{headerTitle}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">View complete budget header details, allocations and utilization metrics.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 px-3 py-1">
                    <FolderTree size={14} /> Budget
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 px-3 py-1">
                    <Clock size={14} /> {fiscalYearLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 px-3 py-1">
                    <Activity size={14} /> {statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                  <Download size={16} /> Export
                </button>
                <button onClick={() => navigate(buildPath(`/accounts/budget/budget-headers/edit/${id}`))} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:hover:bg-blue-700 transition-colors">
                  <Edit size={16} /> Edit Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl 3xl:max-w-[1800px] space-y-6 px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5 sm:p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Total Budget</p>
            <p className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(metrics.totalBudget)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5 sm:p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Total Allocated</p>
            <p className="mt-4 text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(metrics.totalAllocated)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5 sm:p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Total Utilized</p>
            <p className="mt-4 text-2xl sm:text-3xl font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(metrics.totalUtilized)}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5 sm:p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Remaining Budget</p>
            <p className="mt-4 text-2xl sm:text-3xl font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(effectiveRemaining)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Basic Information</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Budget Name</p>
                  <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{headerTitle}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Fiscal Year</p>
                  <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{fiscalYearLabel}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Company</p>
                  <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{companyLabel}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Budget Header ID</p>
                  <p className="mt-2 font-mono text-[10.4px] text-zinc-600 dark:text-zinc-300 break-words">{record.id || record.budgetHeaderId || '-'}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Created At</p>
                  <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{formatDate(record.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[8.8px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Updated At</p>
                  <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{formatDate(record.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Financial Summary</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Allocation and utilization performance</p>
                </div>
                <PieChart size={20} className="text-zinc-400" />
              </div>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                    <span>Utilization %</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatPct(metrics.overallUtilization)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-[#222736] overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(metrics.overallUtilization, 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                    <span>Allocation %</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-400">{formatPct(metrics.overallAllocation)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-[#222736] overflow-hidden">
                    <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${Math.min(metrics.overallAllocation, 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                    <span>Remaining %</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatPct(metrics.overallRemaining)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-[#222736] overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(metrics.overallRemaining, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Total Budget Lines</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{budgetLines.length}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Highest Allocation</p>
                <p className="mt-4 text-3xl font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(metrics.highestAllocation)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Highest Utilization</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">{formatPct(metrics.highestUtilization)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Average Utilization</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{formatPct(metrics.averageUtilization)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Total Variance</p>
                <p className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(metrics.totalVariance)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Positive Variance</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(metrics.positiveVariance)}</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
                <p className="text-[8.8px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Negative Variance</p>
                <p className="mt-4 text-3xl font-semibold text-red-700 dark:text-red-400">{formatCurrency(metrics.negativeVariance)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Budget Utilization Chart</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Each budget line has its own progress indicator.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-[#1D212C] px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {budgetLines.length} lines
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {budgetLines.map((line) => {
                  const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                  return (
                    <div key={line.id || line.budgetLineId || line.accountCode} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{line.accountName || line.account?.accountName || 'Unknown account'}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{formatPct(utilization)}</div>
                      </div>
                      <div className="h-3 rounded-full bg-zinc-100 dark:bg-[#222736] overflow-hidden">
                        <div className={`h-full ${utilization > 100 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Top Consuming Accounts</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Top 5 budget lines sorted by utilized amount.</p>
                </div>
                <Activity size={20} className="text-zinc-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-[#1D212C] text-[8.8px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#2A2F3D]">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Allocated</th>
                      <th className="px-4 py-3 text-right">Utilized</th>
                      <th className="px-4 py-3 text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                    {metrics.topConsumers.map((line) => (
                      <tr key={line.id || line.budgetLineId}>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{line.accountName || line.account?.accountName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(line.allocatedAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(line.utilizedAmount)}</td>
                        <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">{formatCurrency(line.remainingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Variance Report</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Highlight lines where variance & utilization need review.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  {metrics.varianceAlertLines.length} flagged
                </span>
              </div>
              {metrics.varianceAlertLines.length === 0 ? (
                <div className="rounded-3xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-sm text-emerald-700 dark:text-emerald-400">
                  No variance warnings found. Budget is operating within expected thresholds.
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.varianceAlertLines.map((line) => {
                    const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                    return (
                      <div key={line.id || line.budgetLineId} className="rounded-3xl border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{line.accountName || line.account?.accountName || 'Unknown account'}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{line.accountCode || '-'}</p>
                          </div>
                          <WarningBadge show />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <div className="rounded-2xl bg-white dark:bg-[#1D212C] p-3 border border-orange-100 dark:border-orange-900/40">
                            <p className="text-[8.8px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Variance Amount</p>
                            <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(line.varianceAmount)}</p>
                          </div>
                          <div className="rounded-2xl bg-white dark:bg-[#1D212C] p-3 border border-orange-100 dark:border-orange-900/40">
                            <p className="text-[8.8px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Utilization</p>
                            <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">{formatPct(utilization)}</p>
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

        <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-100">Budget Lines</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Detailed budget line review with expandable sections.</p>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{budgetLines.length} lines</div>
            </div>
          </div>

          {budgetLines.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1D212C] text-zinc-300 dark:text-zinc-600">
                <BarChart2 size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No Budget Lines Found</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">This budget header has not been allocated to any budget lines yet.</p>
              <button
                onClick={() => navigate(buildPath('/accounts/budget/budget-lines'))}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} /> Create Budget Line
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-[#1D212C] text-[8.8px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#2A2F3D]">
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
                <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                  {budgetLines.map((line, index) => {
                    const lineId = line.id || line.budgetLineId || index;
                    const utilization = line.allocatedAmount > 0 ? ((line.utilizedAmount || 0) / line.allocatedAmount) * 100 : 0;
                    const variancePct = line.variancePercentage ?? ((line.allocatedAmount > 0 && line.varianceAmount != null) ? ((line.varianceAmount / line.allocatedAmount) * 100) : 0);
                    const varianceType = line.varianceType || (line.varianceAmount > 0 ? 'FAVORABLE' : line.varianceAmount < 0 ? 'ADVERSE' : 'NEUTRAL');
                    const isAlert = (line.varianceAmount || 0) > 0 || utilization > 100;

                    return (
                      <React.Fragment key={lineId}>
                        <tr
                          className={`border-b border-zinc-100 dark:border-[#2A2F3D] transition-colors ${isAlert ? 'bg-rose-50/30 dark:bg-rose-950/20' : 'hover:bg-zinc-50 dark:hover:bg-[#222736]'} cursor-pointer`}
                          onClick={() => toggleLine(lineId)}
                        >
                          <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-zinc-100">{index + 1}</td>
                          <td className="px-4 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">{line.accountCode || '-'}</td>
                          <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100">{line.accountName || line.account?.accountName || '-'}</td>
                          <td className="px-4 py-4">{line.departmentName || line.department?.departmentName || '-'}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.allocatedAmount)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.utilizedAmount)}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(line.remainingAmount)}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="space-y-2">
                              <div className={`text-[8.8px] font-semibold ${utilization > 100 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>{formatPct(utilization)}</div>
                              <ProgressBar allocated={line.allocatedAmount} utilized={line.utilizedAmount || 0} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(line.varianceAmount)}</td>
                          <td className="px-4 py-4 text-right text-zinc-500 dark:text-zinc-400">
                            <ChevronDown className={`inline-block transition-transform ${expandedLineId === lineId ? 'rotate-180' : ''}`} size={18} />
                          </td>
                        </tr>
                        {expandedLineId === lineId && (
                          <tr className="bg-zinc-50 dark:bg-[#0F1117]">
                            <td colSpan={10} className="px-4 py-5">
                              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                                <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-4"><Info size={14} />Account Information</div>
                                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Account Code</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{line.accountCode || '-'}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Account Name</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{line.accountName || line.account?.accountName || '-'}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Department</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{line.departmentName || line.department?.departmentName || '-'}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-4"><BookOpen size={14} />Budget Details</div>
                                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Allocated Amount</span><span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(line.allocatedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Utilized Amount</span><span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(line.utilizedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Actual Expense</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(line.actualExpense ?? line.utilizedAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Remaining Amount</span><span className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(line.remainingAmount)}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-4"><Activity size={14} />Variance Analysis</div>
                                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Variance Amount</span><span className={`font-semibold ${line.varianceAmount > 0 ? 'text-emerald-700 dark:text-emerald-400' : line.varianceAmount < 0 ? 'text-red-700 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>{formatCurrency(line.varianceAmount)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Variance %</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPct(variancePct)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Variance Type</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{varianceType}</span></div>
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-5">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-4"><Clock size={14} />Timeline</div>
                                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Created At</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(line.createdAt)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-zinc-500 dark:text-zinc-400">Updated At</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(line.updatedAt)}</span></div>
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
