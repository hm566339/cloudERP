import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Download, FileText, ShoppingCart,
  Package, LayoutList, History, Activity, Calendar, Lock,
  Unlock, CheckCircle, XCircle, BarChart2, CreditCard, RefreshCw, IndianRupee, TrendingUp, TrendingDown, Wallet, Hash, ArrowRightLeft, Edit2
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountingPeriodsApi } from '../../../api/account/accountingPeriods';
import { formatDate } from '../../../utils/dateFormatter';
import Modal from '../../../components/common/Modal';
import AccountingPeriodForm from '../components/AccountingPeriodForm';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';
import KPICard from '../../../components/common/KPICard';
import EmptyState from '../../../components/common/EmptyState';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useRBAC } from '../../../utils/rbac';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const PeriodStatusBadge = ({ status }) => {
  const cfg = {
    OPEN: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
    LOCKED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  }[status] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border inline-flex items-center gap-1.5 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

export default function AccountingPeriodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const { isCompanyAdmin, isSuperAdmin } = useRBAC();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    accountingPeriodsApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const period = (raw && typeof raw === 'object' && ('periodName' in raw || 'periodNumber' in raw || 'startDate' in raw))
    ? raw
    : (raw?.data || raw);

  const updateMutation = useApiMutation(accountingPeriodsApi.update, {
    onSuccess: () => { setIsEditModalOpen(false); refetch(); }
  });

  const toggleStatusMutation = useApiMutation(accountingPeriodsApi.toggleStatus, {
    onSuccess: () => refetch()
  });

  const handleToggleStatus = async () => {
    const isOpen = period?.status === 'OPEN';
    const confirmed = await confirmDialog({
      title: isOpen ? 'Close Period?' : 'Reopen Period?',
      message: isOpen
        ? 'Closing this period will prevent new transactions from being posted. Continue?'
        : 'Reopening this period will allow new transactions. Continue?',
    });
    if (confirmed) toggleStatusMutation.mutateAsync(id);
  };

  if (isLoading) return <PageLoader message="Loading accounting period details..." />;

  if (error || !period) {
    return (
      <ErrorState
        title="Accounting Period Not Found"
        message={error?.message || "The requested accounting period could not be found."}
        onRetry={refetch}
      />
    );
  }

  const fs = period.financialSummary || {};
  const ps = period.periodSummary || {};
  const tb = period.trialBalanceSummary || period.trialBalance || {};
  const fyInfo = period.fiscalYearInformation || {};
  const stats = period.statistics || {};
  const auditInfo = period.auditInformation || {};

  const fiscalYearName = fyInfo.fiscalYearName || period.fiscalYearName || period.fiscalYearId;
  const fyStartDate = fyInfo.financialYearStartDate || period.fiscalYearStartDate;
  const fyEndDate = fyInfo.financialYearEndDate || period.fiscalYearEndDate;
  const fyStatus = fyInfo.currentStatus || period.fiscalYearStatus;

  const totalTransactions = stats.totalTransactions ?? period.totalTransactions ?? 0;
  const totalSales = stats.totalSales ?? period.totalSales ?? 0;
  const totalPurchases = stats.totalPurchases ?? period.totalPurchases ?? 0;
  const totalReceipts = stats.totalReceipts ?? period.totalReceipts ?? 0;
  const totalPayments = stats.totalPayments ?? period.totalPayments ?? 0;

  const createdBy = auditInfo.createdBy || period.createdBy || 'System';
  const createdAt = auditInfo.createdAt || period.createdAt;
  const updatedBy = auditInfo.updatedBy || period.updatedBy || 'System';
  const updatedAt = auditInfo.updatedAt || period.updatedAt;

  const journalEntries = period.journalEntries || [];
  const salesInvoices = period.salesTransactions || period.salesInvoices || [];
  const purchaseBills = period.purchaseTransactions || period.purchaseBills || [];
  const receiptsPayments = period.receiptsAndPayments || period.receiptsPayments || [];
  const recentTransactions = period.recentTransactions || [];

  const handlePrint = () => window.print();
  const handleExport = () => window.print();

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutList },
    { id: 'financial', label: 'Financial Summary', icon: BarChart2 },
    { id: 'journals', label: 'Journal Entries', icon: FileText },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: Package },
    { id: 'receipts', label: 'Receipts & Payments', icon: CreditCard },
    { id: 'trial', label: 'Trial Balance', icon: BarChart2 },
    { id: 'recent', label: 'Recent Transactions', icon: Activity },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  const isEmpty = (arr) => !arr || arr.length === 0;

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Total Revenue"
        value={`₹${fmt(fs.totalRevenue)}`}
        valueClass="text-emerald-700"
        icon={TrendingUp}
      />
      <KPICard
        title="Total Expenses"
        value={`₹${fmt(fs.totalExpenses)}`}
        valueClass="text-red-700"
        icon={TrendingDown}
      />
      <KPICard
        title="Gross Profit"
        value={`₹${fmt(fs.grossProfit)}`}
        valueClass={(fs.grossProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}
        icon={Activity}
      />
      <KPICard
        title="Net Profit"
        value={`₹${fmt(fs.netProfit)}`}
        valueClass={(fs.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}
        icon={BarChart2}
      />
      <KPICard
        title="Sales"
        value={`₹${fmt(totalSales)}`}
        valueClass="text-emerald-600"
        icon={ShoppingCart}
      />
      <KPICard
        title="Purchases"
        value={`₹${fmt(totalPurchases)}`}
        valueClass="text-red-600"
        icon={Package}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Period',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE', behavior: 'disable' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: period.status === 'OPEN' ? 'Close Period' : 'Reopen Period',
      icon: RefreshCw,
      variant: 'primary',
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE', behavior: 'disable' },
      onClick: handleToggleStatus,
      disabled: toggleStatusMutation.isLoading
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'secondary',
      items: [
        { label: 'Print Period', icon: Printer, onClick: handlePrint },
        { label: 'Export PDF', icon: Download, onClick: handleExport },
        { type: 'divider' },
        { label: 'View Journal Entries', icon: FileText, onClick: () => setActiveTab('journals') },
        { label: 'View Trial Balance', icon: BarChart2, onClick: () => setActiveTab('trial') }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: `Period #${period.periodNumber}` },
    { icon: Calendar, label: period.periodType || 'N/A' },
    { icon: Calendar, label: `${formatDate(period.startDate)} to ${formatDate(period.endDate)}` },
    { 
      custom: <PeriodStatusBadge status={period.status} />
    }
  ];

  const quickActions = [
    {
      label: 'Edit Period',
      icon: Edit2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: period.status === 'OPEN' ? 'Close Period' : 'Reopen Period',
      icon: RefreshCw,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE' },
      onClick: handleToggleStatus
    },
    {
      label: 'View Sales',
      icon: ShoppingCart,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => setActiveTab('sales')
    },
    {
      label: 'View Purchases',
      icon: Package,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      onClick: () => setActiveTab('purchases')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      <EntityHeader
        onBack={() => navigate(buildPath('/accounts/organization/accounting-periods'))}
        title={period.periodName}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Period Details" icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600">
              <div className="space-y-4">
                <InfoField label="Period Name" value={period.periodName} />
                <InfoField label="Period Number" value={`#${period.periodNumber}`} mono />
                <InfoField label="Period Type" value={period.periodType} />
                <InfoField label="Fiscal Year" value={fiscalYearName} />
                <InfoField label="Start Date" value={formatDate(period.startDate)} />
                <InfoField label="End Date" value={formatDate(period.endDate)} />
                <InfoField label="Status" custom={<PeriodStatusBadge status={period.status} />} />
              </div>
            </InfoCard>

            {(fiscalYearName || fyStartDate) && (
              <InfoCard title="Fiscal Year" icon={Calendar} iconBg="bg-purple-50" iconColor="text-purple-600">
                <div className="space-y-4">
                  <InfoField label="FY Name" value={fiscalYearName} />
                  <InfoField label="FY Status" value={fyStatus} />
                  <InfoField label="FY Start" value={formatDate(fyStartDate)} />
                  <InfoField label="FY End" value={formatDate(fyEndDate)} />
                </div>
              </InfoCard>
            )}

            <QuickActionsCard title="Quick Actions" actions={quickActions} />
          </div>

          {/* RIGHT TABS AREA (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="bg-zinc-100/50 dark:bg-[#1D212C] p-1.5 rounded-lg border border-zinc-200/50 dark:border-[#2A2F3D] overflow-x-auto mb-6">
              <div className="flex items-center min-w-max gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-md transition-all outline-none ${
                      activeTab === tab.id 
                        ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60 dark:border-[#2A2F3D]' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-[#222736] border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  
                  <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Transaction Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                      {[
                        ['Journal Entries', ps.totalJournalEntries, FileText, 'text-blue-600 dark:text-blue-400', 'bg-blue-50 dark:bg-blue-950/40'],
                        ['Sales Invoices', ps.totalSalesInvoices, ShoppingCart, 'text-emerald-600 dark:text-emerald-400', 'bg-emerald-50 dark:bg-emerald-950/40'],
                        ['Purchase Bills', ps.totalPurchaseBills, Package, 'text-rose-600 dark:text-rose-400', 'bg-rose-50 dark:bg-rose-950/40'],
                        ['Receipts', ps.totalReceipts, CreditCard, 'text-emerald-600 dark:text-emerald-400', 'bg-emerald-50 dark:bg-emerald-950/40'],
                        ['Payments', ps.totalPayments, CreditCard, 'text-rose-600 dark:text-rose-400', 'bg-rose-50 dark:bg-rose-950/40'],
                        ['Credit Notes', ps.totalCreditNotes, FileText, 'text-blue-600 dark:text-blue-400', 'bg-blue-50 dark:bg-blue-950/40'],
                        ['Debit Notes', ps.totalDebitNotes, FileText, 'text-purple-600 dark:text-purple-400', 'bg-purple-50 dark:bg-purple-950/40'],
                        ['Total', totalTransactions, Activity, 'text-zinc-600 dark:text-zinc-400', 'bg-zinc-100 dark:bg-[#222736]']
                      ].map(([label, val, Icon, iconColor, iconBg]) => (
                        <div key={label} className="p-5 bg-zinc-50 dark:bg-[#1D212C] rounded-md border border-zinc-100 dark:border-[#2A2F3D] flex flex-col justify-between">
                          <div className={`w-8 h-8 rounded-md ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
                            <Icon size={16} />
                          </div>
                          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none mb-1">{val || 0}</p>
                          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Cash Flow</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-5 border border-emerald-100 dark:border-emerald-800/60 rounded-md bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Total Receipts</p>
                          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{fmt(totalReceipts)}</p>
                       </div>
                       <div className="p-5 border border-rose-100 dark:border-rose-800/60 rounded-md bg-rose-50/50 dark:bg-rose-950/30 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">Total Payments</p>
                          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">₹{fmt(totalPayments)}</p>
                       </div>
                    </div>
                  </div>

                </div>
              )}

              {/* FINANCIAL SUMMARY TAB */}
              {activeTab === 'financial' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Revenue', val: fs.totalRevenue, color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/60' },
                      { label: 'Total Expenses', val: fs.totalExpenses, color: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/60' },
                      { label: 'Gross Profit', val: fs.grossProfit, color: (fs.grossProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400', border: 'border-zinc-200 dark:border-[#2A2F3D]' },
                      { label: 'Net Profit', val: fs.netProfit, color: (fs.netProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400', border: 'border-zinc-200 dark:border-[#2A2F3D]' },
                      { label: 'Total Assets', val: fs.totalAssets, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/60' },
                      { label: 'Total Liabilities', val: fs.totalLiabilities, color: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/60' },
                      { label: 'Opening Balance', val: period.openingBalance, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/60' },
                      { label: 'Closing Balance', val: period.closingBalance, color: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/60' },
                    ].map(({ label, val, color, border }) => (
                      <div key={label} className={`p-6 rounded-md border ${border} bg-white dark:bg-[#161922] shadow-sm flex flex-col`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>₹{fmt(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JOURNAL ENTRIES TAB */}
              {activeTab === 'journals' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Journal Entries</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{journalEntries.length || 0} Total</span>
                  </div>
                  {isEmpty(journalEntries) ? (
                    <EmptyState icon={FileText} title="No Journal Entries" description="There are no journal entries recorded for this accounting period." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Voucher Number</th>
                            <th className="p-4">Voucher Type</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Total Debit</th>
                            <th className="p-4 text-right">Total Credit</th>
                            <th className="p-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {journalEntries.map((je, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{je.voucherNumber}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{je.voucherType}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{formatDate(je.transactionDate)}</td>
                              <td className="p-4 text-right text-rose-600 dark:text-rose-400 font-bold">₹{fmt(je.totalDebit)}</td>
                              <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{fmt(je.totalCredit)}</td>
                              <td className="p-4 text-center">
                                <PeriodStatusBadge status={je.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SALES TAB */}
              {activeTab === 'sales' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Sales Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{salesInvoices.length || 0} Total</span>
                  </div>
                  {isEmpty(salesInvoices) ? (
                    <EmptyState icon={ShoppingCart} title="No Sales Transactions" description="There are no sales invoices recorded for this accounting period." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Invoice Number</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {salesInvoices.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{inv.customerName}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{formatDate(inv.invoiceDate)}</td>
                              <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">₹{fmt(inv.invoiceAmount)}</td>
                              <td className="p-4 text-center"><PeriodStatusBadge status={inv.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PURCHASES TAB */}
              {activeTab === 'purchases' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Purchase Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{purchaseBills.length || 0} Total</span>
                  </div>
                  {isEmpty(purchaseBills) ? (
                    <EmptyState icon={Package} title="No Purchase Transactions" description="There are no purchase bills recorded for this accounting period." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Invoice Number</th>
                            <th className="p-4">Vendor</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {purchaseBills.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{inv.vendorName}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{formatDate(inv.invoiceDate)}</td>
                              <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400">₹{fmt(inv.invoiceAmount)}</td>
                              <td className="p-4 text-center"><PeriodStatusBadge status={inv.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* RECEIPTS & PAYMENTS TAB */}
              {activeTab === 'receipts' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Receipts & Payments</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{receiptsPayments.length || 0} Total</span>
                  </div>
                  {isEmpty(receiptsPayments) ? (
                    <EmptyState icon={CreditCard} title="No Receipts or Payments" description="There are no receipts or payments recorded for this accounting period." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Voucher Number</th>
                            <th className="p-4">Voucher Type</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Party Name</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Payment Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                          {receiptsPayments.map((rp, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                              <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{rp.voucherNumber}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{rp.voucherType}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{formatDate(rp.date)}</td>
                              <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{rp.partyName}</td>
                              <td className="p-4 text-right font-black text-zinc-900 dark:text-zinc-100">₹{fmt(rp.amount)}</td>
                              <td className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{rp.paymentMode || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TRIAL BALANCE TAB */}
              {activeTab === 'trial' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-[#161922] rounded-md border border-rose-200 dark:border-rose-800/60 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Debit</p>
                      <p className="text-3xl font-black text-rose-600 dark:text-rose-400">₹{fmt(tb.totalDebit)}</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#161922] rounded-md border border-emerald-200 dark:border-emerald-800/60 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Total Credit</p>
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{fmt(tb.totalCredit)}</p>
                    </div>
                    <div className={`p-6 bg-white dark:bg-[#161922] rounded-md border shadow-sm text-center ${(tb.difference || 0) !== 0 ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/30' : 'border-zinc-200 dark:border-[#2A2F3D]'}`}>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Difference</p>
                      <p className={`text-3xl font-black ${(tb.difference || 0) !== 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{fmt(tb.difference)}
                      </p>
                      {(tb.difference || 0) !== 0 && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-3 bg-rose-50 dark:bg-rose-950/40 py-1.5 px-3 rounded-md border border-rose-100 dark:border-rose-800/60 inline-block">⚠ Trial Balance does not tally!</p>
                      )}
                    </div>
                  </div>
                  {tb.ledgerEntries && tb.ledgerEntries.length > 0 && (
                    <div className="bg-white dark:bg-[#161922] rounded-md border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                            <tr>
                              <th className="p-4">Ledger Name</th>
                              <th className="p-4 text-right">Debit</th>
                              <th className="p-4 text-right">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                            {tb.ledgerEntries.map((le, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
                                <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{le.ledgerName}</td>
                                <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">₹{fmt(le.debit)}</td>
                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{fmt(le.credit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RECENT TRANSACTIONS TAB */}
              {activeTab === 'recent' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50 dark:bg-[#1D212C]">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Recent Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{recentTransactions.length || 0} Total</span>
                  </div>
                  {isEmpty(recentTransactions) ? (
                    <EmptyState icon={Activity} title="No Recent Transactions" description="There are no recent transactions for this accounting period." />
                  ) : (
                    <div className="p-6">
                      <div className="relative border-l-2 border-zinc-200 dark:border-[#2A2F3D] ml-4 space-y-8">
                        {recentTransactions.map((txn, idx) => (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white dark:bg-[#161922] border-2 border-zinc-300 dark:border-zinc-600" />
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {txn.transactionType || 'Transaction'}{' '}
                                <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs font-normal ml-2">{txn.voucherNumber}</span>
                              </h4>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{formatDate(txn.transactionDate)}</span>
                            </div>
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-2">{txn.partyName || 'Unknown Party'}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-[#222736] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 dark:text-zinc-300 rounded-md">
                                ₹{fmt(txn.amount)}
                              </span>
                              {txn.status && <PeriodStatusBadge status={txn.status} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIT LOG TAB */}
              {activeTab === 'audit' && (
                <div className="animate-fade-in bg-white dark:bg-[#161922] rounded-md shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Audit Trail</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><ArrowRightLeft size={14} /> Created Record</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{createdBy}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{createdAt ? new Date(createdAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-md p-5 bg-zinc-50/50 dark:bg-[#1D212C]/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-[#161922] inline-block px-2 py-1 rounded-md border border-zinc-200 dark:border-[#2A2F3D]">{updatedBy}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{updatedAt ? new Date(updatedAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Accounting Period" size="md">
        <AccountingPeriodForm
          initialData={period}
          onSubmit={async (data) => { await updateMutation.mutateAsync({ id, data }); }}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={updateMutation.isLoading}
        />
      </Modal>
    </div>
  );
}
