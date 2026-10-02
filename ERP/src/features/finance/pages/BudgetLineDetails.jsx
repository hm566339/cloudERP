import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  Download,
  Edit,
  PieChart,
  Activity,
  Info,
  Clock,
  BookOpen,
  IndianRupee,
  AlertTriangle,
  FolderTree,
  ShieldCheck,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Paperclip,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { budgetLinesApi } from '../../../api/account';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useRoutePath } from "../../../hooks/useRoutePath";

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------

const ReadOnlyField = ({ label, value, valueClass = "text-zinc-900", icon: Icon }) => (
  <div className="bg-zinc-50/70 rounded-2xl p-4 border border-zinc-100">
    <div className="flex items-center gap-1.5 text-[8.8px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
      {Icon && <Icon size={13} className="text-zinc-400" />}
      {label}
    </div>
    <p className={`font-semibold break-words text-sm ${valueClass}`}>{value || '-'}</p>
  </div>
);

const SummaryCard = ({ label, value, valueClass, icon: Icon, subtitle }) => (
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all">
    <div className="flex items-center justify-between text-[8.8px] font-bold uppercase tracking-[0.24em] text-zinc-400">
      <span>{label}</span>
      {Icon && <Icon size={18} className="text-zinc-400" />}
    </div>
    <div className="mt-4">
      <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const DetailCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm h-full ${className}`}>
    <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.22em] text-zinc-900 mb-6 pb-4 border-b border-zinc-100">
      {Icon && <Icon size={16} className="text-zinc-500" />}
      <span>{title}</span>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {children}
    </div>
  </div>
);

const HealthBanner = ({ health }) => {
  const isHealthy = health?.healthStatus === 'Healthy' || health?.riskLevel === 'LOW';
  const isWarning = health?.riskLevel === 'MEDIUM';
  
  const bgClass = isHealthy 
    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
    : isWarning 
    ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
    : 'bg-rose-50/80 border-rose-200 text-rose-900';

  const badgeClass = isHealthy 
    ? 'bg-emerald-600 text-white' 
    : isWarning 
    ? 'bg-amber-600 text-white' 
    : 'bg-rose-600 text-white';

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${bgClass}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${badgeClass} shrink-0 mt-0.5`}>
            {isHealthy ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Health Status: {health?.healthStatus || 'Healthy'}</h3>
              <span className={`px-2.5 py-0.5 text-[8.8px] font-bold uppercase tracking-wider rounded-full ${badgeClass}`}>
                {health?.riskLevel || 'LOW'} Risk
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90">{health?.recommendation || 'Budget utilization is on track. No action needed.'}</p>
          </div>
        </div>
        <div className="shrink-0 text-right md:border-l border-zinc-200/60 md:pl-6">
          <p className="text-[8.8px] uppercase tracking-wider font-bold opacity-75">Progress</p>
          <p className="text-2xl font-bold">{health?.progressPercentage?.toFixed(1) || '0.0'}%</p>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="p-6 space-y-6 max-w-7xl mx-auto">
    <div className="flex justify-between items-center">
      <div className="w-1/3 h-10 bg-zinc-200 rounded-xl animate-pulse" />
      <div className="w-48 h-10 bg-zinc-200 rounded-xl animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-zinc-200 rounded-3xl animate-pulse" />)}
    </div>
    <div className="h-28 bg-zinc-200 rounded-3xl animate-pulse" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
      <div className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
    </div>
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle size={32} />
    </div>
    <h2 className="text-lg font-bold text-zinc-900">Unable to load Budget Line details</h2>
    <p className="text-sm text-zinc-500 mt-1 mb-4">Please check your network connection or try again.</p>
    <button onClick={onRetry} className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors">
      Retry Loading
    </button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mb-4">
      <FolderTree size={32} />
    </div>
    <h2 className="text-lg font-bold text-zinc-900">Budget Line not found</h2>
    <p className="text-sm text-zinc-500 mt-1">The requested budget line could not be retrieved.</p>
  </div>
);

// ------------------------------------------------------------
// Main Page Component
// ------------------------------------------------------------

export default function BudgetLineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
    isFetching
  } = useApiQuery(budgetLinesApi.getBudgetLineById, id, { skip: !id });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;

  const resData = apiResponse?.data?.data || apiResponse?.data || apiResponse;

  if (!resData) return <EmptyState />;

  const budgetLine = resData.budgetLine || resData;
  const budgetHeader = resData.budgetHeader || {};
  const company = resData.company || {};
  const glAccount = resData.glAccount || {};
  const department = resData.department || null;
  const performanceSummary = resData.performanceSummary || {};
  const health = resData.health || {};
  const transactions = resData.transactions?.content || (Array.isArray(resData.transactions) ? resData.transactions : []);
  const monthlyTrend = resData.monthlyTrend || [];
  const analytics = resData.analytics || {};
  const relatedDocuments = resData.relatedDocuments || {};
  const approval = resData.approval || {};
  const attachments = Array.isArray(resData.attachments) ? resData.attachments : [];
  const audit = resData.audit || {};
  const permissions = resData.permissions || {};
  const metadata = resData.metadata || {};

  const handleBack = () => navigate(buildPath('/accounts/budget/budget-lines'));

  const allocated = performanceSummary.allocatedAmount ?? budgetLine.allocatedAmount ?? 0;
  const utilized = performanceSummary.utilizedAmount ?? budgetLine.utilizedAmount ?? 0;
  const actual = performanceSummary.actualExpense ?? budgetLine.actualExpense ?? 0;
  const remaining = performanceSummary.remainingAmount ?? budgetLine.remainingAmount ?? 0;
  const utilPct = performanceSummary.utilizationPercentage ?? budgetLine.utilizationPercentage ?? 0;

  const utilPctColor = utilPct > 85 ? 'text-rose-600' : utilPct > 60 ? 'text-amber-600' : 'text-emerald-600';

  const varianceType = budgetLine.varianceType || 'FAVORABLE';
  const isFavorable = varianceType === 'FAVORABLE' || (budgetLine.varianceAmount || 0) >= 0;

  return (
    <div className="min-h-full bg-zinc-50/60 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-all flex items-center justify-center shadow-2xs shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {budgetLine.accountName || glAccount.accountName || 'Budget Line'}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
                    {budgetLine.accountCode || glAccount.accountCode || '-'}
                  </span>
                  <span className={`px-2.5 py-1 text-[8.8px] font-bold uppercase rounded-md border ${
                    approval.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {approval.approvalStatus || 'APPROVED'}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-1 font-medium">
                  Budget Header: <span className="text-zinc-800 font-semibold">{budgetHeader.budgetName || budgetLine.budgetHeaderId || '-'}</span> ({budgetHeader.budgetCode || '-'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={refetch}
                disabled={isFetching}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
              >
                <Printer size={16} />
                Print
              </button>
              {(permissions.canEdit || metadata.editable) && (
                <button
                  onClick={() => navigate(buildPath('/accounts/budget/budget-lines'))}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <Edit size={16} />
                  Manage Lines
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-2 border-t border-zinc-100 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview & Details', icon: BookOpen },
              { id: 'analytics', label: 'Monthly Trend & Analytics', icon: BarChart3 },
              { id: 'documents', label: 'Related Docs & Transactions', icon: FileText, count: transactions.length },
              { id: 'approval', label: 'Approval & Audit', icon: ShieldCheck }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 text-[8px] rounded-full font-extrabold ${isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Top Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <SummaryCard
            label="Allocated Amount"
            value={formatCurrency(allocated)}
            valueClass="text-zinc-900"
            icon={IndianRupee}
            subtitle="Base Budget Limit"
          />
          <SummaryCard
            label="Utilized Amount"
            value={formatCurrency(utilized)}
            valueClass="text-emerald-700"
            icon={TrendingUp}
            subtitle="Consumed so far"
          />
          <SummaryCard
            label="Actual Expense"
            value={formatCurrency(actual)}
            valueClass="text-blue-700"
            icon={Activity}
            subtitle="Actual posted entries"
          />
          <SummaryCard
            label="Remaining Budget"
            value={formatCurrency(remaining)}
            valueClass="text-amber-700"
            icon={Layers}
            subtitle="Available balance"
          />
          <SummaryCard
            label="Utilization %"
            value={`${utilPct.toFixed(1)}%`}
            valueClass={utilPctColor}
            icon={PieChart}
            subtitle={`${(100 - utilPct).toFixed(1)}% remaining`}
          />
        </div>

        {/* Health Banner */}
        <HealthBanner health={health} />

        {/* TAB 1: OVERVIEW & DETAILS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetailCard title="Budget Line & Financials" icon={BookOpen}>
                <ReadOnlyField label="Budget Line ID" value={budgetLine.id} icon={Layers} />
                <ReadOnlyField label="Budget Header ID" value={budgetLine.budgetHeaderId} icon={FolderTree} />
                <ReadOnlyField label="Allocated Amount" value={formatCurrency(allocated)} valueClass="text-zinc-900" />
                <ReadOnlyField label="Utilized Amount" value={formatCurrency(utilized)} valueClass="text-emerald-700" />
                <ReadOnlyField label="Actual Expense" value={formatCurrency(actual)} valueClass="text-blue-700" />
                <ReadOnlyField label="Remaining Amount" value={formatCurrency(remaining)} valueClass="text-amber-700" />
                <ReadOnlyField label="Variance Amount" value={formatCurrency(budgetLine.varianceAmount)} valueClass={isFavorable ? 'text-emerald-700' : 'text-rose-700'} />
                <ReadOnlyField label="Variance %" value={`${(budgetLine.variancePercentage || 0).toFixed(1)}%`} />
                <ReadOnlyField label="Variance Type" value={varianceType} valueClass={isFavorable ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'} />
                <ReadOnlyField label="Utilization %" value={`${utilPct.toFixed(1)}%`} valueClass={utilPctColor} />
              </DetailCard>

              <DetailCard title="GL Account Information" icon={Info}>
                <ReadOnlyField label="Account Code" value={glAccount.accountCode || budgetLine.accountCode} icon={BookOpen} />
                <ReadOnlyField label="Account Name" value={glAccount.accountName || budgetLine.accountName} />
                <ReadOnlyField label="Account ID" value={glAccount.accountId || budgetLine.accountId} />
                <ReadOnlyField label="Account Group" value={glAccount.accountGroup} />
                <ReadOnlyField label="Account Category" value={glAccount.accountCategory} />
                <ReadOnlyField label="Account Type" value={glAccount.accountType} />
                <ReadOnlyField label="Normal Balance" value={glAccount.normalBalance} />
                <ReadOnlyField label="Department" value={department?.departmentName || department?.name || 'Unassigned'} />
              </DetailCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetailCard title="Budget Header Context" icon={FolderTree}>
                <ReadOnlyField label="Header Name" value={budgetHeader.budgetName} />
                <ReadOnlyField label="Header Code" value={budgetHeader.budgetCode} />
                <ReadOnlyField label="Budget Type" value={budgetHeader.budgetType} />
                <ReadOnlyField label="Fiscal Year" value={budgetHeader.fiscalYearName} />
                <ReadOnlyField label="Start Date" value={formatDate(budgetHeader.startDate)} icon={Calendar} />
                <ReadOnlyField label="End Date" value={formatDate(budgetHeader.endDate)} icon={Calendar} />
                <ReadOnlyField label="Header Total Budget" value={formatCurrency(budgetHeader.totalBudget)} />
                <ReadOnlyField label="Header Status" value={budgetHeader.status} valueClass="text-emerald-700 font-bold" />
              </DetailCard>

              <DetailCard title="Company Details" icon={Building2}>
                <ReadOnlyField label="Company Name" value={company.companyName} />
                <ReadOnlyField label="Company Code" value={company.companyCode} />
                <ReadOnlyField label="Company ID" value={company.companyId} />
                <ReadOnlyField label="Base Currency" value={company.baseCurrency || 'INR'} />
              </DetailCard>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY TREND & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Monthly Trend Visual Breakdown */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-900">Monthly Allocation & Utilization Trend</h2>
                  <p className="text-xs text-zinc-500 mt-1">Breakdown by fiscal calendar months</p>
                </div>
                <BarChart3 size={20} className="text-zinc-400" />
              </div>

              {monthlyTrend.length === 0 ? (
                <p className="text-sm text-zinc-500 py-6 text-center">No monthly trend data available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {monthlyTrend.map((m, idx) => {
                    const itemUtil = m.utilized || 0;
                    const itemAlloc = m.allocated || 0;
                    const itemPct = itemAlloc > 0 ? (itemUtil / itemAlloc) * 100 : 0;
                    return (
                      <div key={idx} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-900">{m.month}</span>
                          <span className="text-xs font-semibold text-zinc-500">{itemPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                          <div
                            className={`h-full transition-all ${itemPct > 85 ? 'bg-rose-500' : itemPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(itemPct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8.8px] text-zinc-600 font-medium pt-1">
                          <span>Allocated: {formatCurrency(itemAlloc)}</span>
                          <span className="text-emerald-700 font-semibold">Utilized: {formatCurrency(itemUtil)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Performance Summary & Expense Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetailCard title="Performance Summary Metrics" icon={TrendingUp}>
                <ReadOnlyField label="Allocated Amount" value={formatCurrency(performanceSummary.allocatedAmount)} />
                <ReadOnlyField label="Utilized Amount" value={formatCurrency(performanceSummary.utilizedAmount)} valueClass="text-emerald-700" />
                <ReadOnlyField label="Committed Amount" value={formatCurrency(performanceSummary.committedAmount)} />
                <ReadOnlyField label="Actual Expense" value={formatCurrency(performanceSummary.actualExpense)} valueClass="text-blue-700" />
                <ReadOnlyField label="Remaining Amount" value={formatCurrency(performanceSummary.remainingAmount)} valueClass="text-amber-700" />
                <ReadOnlyField label="Available Budget" value={formatCurrency(performanceSummary.availableBudget)} valueClass="text-emerald-700 font-bold" />
              </DetailCard>

              <DetailCard title="Expense Analytics" icon={Activity}>
                <ReadOnlyField label="Transaction Count" value={analytics.transactionCount ?? 0} />
                <ReadOnlyField label="Average Monthly Expense" value={formatCurrency(analytics.averageMonthlyExpense)} />
                <ReadOnlyField label="Highest Expense" value={formatCurrency(analytics.highestExpense)} valueClass="text-rose-700 font-semibold" />
                <ReadOnlyField label="Lowest Expense" value={formatCurrency(analytics.lowestExpense)} valueClass="text-emerald-700 font-semibold" />
                <ReadOnlyField label="Last Expense Date" value={formatDate(analytics.lastExpenseDate)} icon={Calendar} />
                <ReadOnlyField label="Total Attachments" value={analytics.totalAttachments ?? 0} icon={Paperclip} />
              </DetailCard>
            </div>
          </div>
        )}

        {/* TAB 3: RELATED DOCS & TRANSACTIONS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Related Documents Grid */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-900 mb-6 pb-4 border-b border-zinc-100">
                <FileText size={16} className="text-zinc-500" />
                <span>Related Document Counters</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Purchase Invoices', count: relatedDocuments.purchaseInvoices ?? 0 },
                  { label: 'Journal Entries', count: relatedDocuments.journalEntries ?? 0 },
                  { label: 'Payment Vouchers', count: relatedDocuments.paymentVouchers ?? 0 },
                  { label: 'Receipt Vouchers', count: relatedDocuments.receiptVouchers ?? 0 },
                  { label: 'Credit Notes', count: relatedDocuments.creditNotes ?? 0 },
                  { label: 'Debit Notes', count: relatedDocuments.debitNotes ?? 0 }
                ].map((doc, idx) => (
                  <div key={idx} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-center">
                    <p className="text-2xl font-bold text-zinc-900">{doc.count}</p>
                    <p className="text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">{doc.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 bg-zinc-50/70 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-900">Budget Transactions</h2>
                  <p className="text-xs text-zinc-500 mt-1">Direct postings and journal lines associated with this line</p>
                </div>
                <span className="px-3 py-1 text-xs font-bold bg-zinc-200 text-zinc-800 rounded-full">
                  {transactions.length} items
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <Activity size={36} className="mx-auto mb-3 text-zinc-300" />
                  <p className="font-semibold text-zinc-800">No Transactions Found</p>
                  <p className="text-xs text-zinc-500 mt-1">There are no financial transactions recorded under this budget line yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-zinc-700">
                    <thead className="bg-zinc-50 text-[8.8px] uppercase tracking-wider text-zinc-500 font-bold">
                      <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {transactions.map((tx, index) => (
                        <tr key={tx.id || index} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-zinc-600">{tx.id || `-`}</td>
                          <td className="px-6 py-4">{formatDate(tx.date || tx.createdAt)}</td>
                          <td className="px-6 py-4 font-medium text-zinc-900">{tx.description || '-'}</td>
                          <td className="px-6 py-4 text-right font-bold text-zinc-900">{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-900 mb-6 pb-4 border-b border-zinc-100">
                <Paperclip size={16} className="text-zinc-500" />
                <span>Attachments</span>
              </div>
              {attachments.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No attachments uploaded for this budget line.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 bg-zinc-50">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip size={14} className="text-zinc-400 shrink-0" />
                        <span className="text-xs font-medium text-zinc-800 truncate">{att.fileName || `Attachment ${i + 1}`}</span>
                      </div>
                      <a href={att.fileUrl || '#'} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline shrink-0">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: APPROVAL & AUDIT */}
        {activeTab === 'approval' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetailCard title="Approval Workflow Details" icon={UserCheck}>
                <ReadOnlyField label="Approval Status" value={approval.approvalStatus || 'APPROVED'} valueClass="text-emerald-700 font-bold" />
                <ReadOnlyField label="Approval Level" value={approval.approvalLevel ?? 1} />
                <ReadOnlyField label="Approved By" value={approval.approvedBy || '-'} icon={UserCheck} />
                <ReadOnlyField label="Approved Date" value={formatDate(approval.approvedDate, 'dd MMM yyyy hh:mm a')} icon={Clock} />
                <ReadOnlyField label="Approval Remarks" value={approval.approvalRemarks || '-'} />
              </DetailCard>

              <DetailCard title="Audit Information" icon={Clock}>
                <ReadOnlyField label="Created By" value={audit.createdBy || budgetLine.createdBy} />
                <ReadOnlyField label="Created At" value={formatDate(audit.createdAt || budgetLine.createdAt, 'dd MMM yyyy hh:mm a')} icon={Clock} />
                <ReadOnlyField label="Updated By" value={audit.updatedBy || budgetLine.updatedBy} />
                <ReadOnlyField label="Updated At" value={formatDate(audit.updatedAt || budgetLine.updatedAt, 'dd MMM yyyy hh:mm a')} icon={Clock} />
                <ReadOnlyField label="Version" value={audit.version ?? 1} />
              </DetailCard>
            </div>

            <DetailCard title="Permissions & Access Rights" icon={ShieldCheck}>
              <ReadOnlyField label="Can Edit" value={permissions.canEdit ? 'Yes' : 'No'} valueClass={permissions.canEdit ? 'text-emerald-700 font-bold' : 'text-zinc-500'} />
              <ReadOnlyField label="Can Delete" value={permissions.canDelete ? 'Yes' : 'No'} valueClass={permissions.canDelete ? 'text-emerald-700 font-bold' : 'text-zinc-500'} />
              <ReadOnlyField label="Can Approve" value={permissions.canApprove ? 'Yes' : 'No'} valueClass={permissions.canApprove ? 'text-emerald-700 font-bold' : 'text-zinc-500'} />
              <ReadOnlyField label="Can Export" value={permissions.canExport ? 'Yes' : 'No'} valueClass={permissions.canExport ? 'text-emerald-700 font-bold' : 'text-zinc-500'} />
              <ReadOnlyField label="Can Update Utilization" value={permissions.canUpdateUtilization ? 'Yes' : 'No'} valueClass={permissions.canUpdateUtilization ? 'text-emerald-700 font-bold' : 'text-zinc-500'} />
            </DetailCard>
          </div>
        )}
      </div>
    </div>
  );
}

