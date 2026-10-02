import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, FileText, ShoppingCart, 
  Package, LayoutList, History, Activity, Calendar, Lock, 
  Unlock, CheckCircle, AlertCircle, BarChart2, CreditCard, RefreshCw,
  Building2, DollarSign, Clock, ShieldAlert, CheckSquare, ChevronDown, TrendingUp, TrendingDown, IndianRupee, Wallet,
  Edit2, Hash, Building, ArrowRightLeft
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { fiscalYearsApi } from '../../../api/account';
import Modal from '../../../components/common/Modal';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';
import KPICard from '../../../components/common/KPICard';
import EmptyState from '../../../components/common/EmptyState';
import { useRoutePath } from '../../../hooks/useRoutePath';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const FiscalStatusBadge = ({ isClosed }) => {
  if (isClosed) {
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Closed
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open
    </span>
  );
};

export default function FiscalYearDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fiscalYear: '',
    startDate: '',
    endDate: '',
    isClosed: false
  });

  const { data: response, isLoading, error, refetch } = useApiQuery(
    fiscalYearsApi.getFiscalYearById,
    id,
    { enabled: !!id }
  );

  const rawFy = response?.data?.data || response?.data || response;
  const fy = (rawFy && typeof rawFy === 'object' && ('fiscalYear' in rawFy || 'companyName' in rawFy || 'startDate' in rawFy))
    ? rawFy
    : (rawFy?.data || rawFy);

  const updateMutation = useApiMutation(
    (data) => fiscalYearsApi.updateFiscalYear(id, data),
    {
      onSuccess: () => {
        setIsEditModalOpen(false);
        refetch();
      }
    }
  );

  const toggleStatusMutation = useApiMutation(
    (status) => fiscalYearsApi.updateFiscalYearStatus(id, status),
    {
      onSuccess: () => refetch()
    }
  );

  const handleToggleStatus = async () => {
    const isClosed = fy?.isClosed;
    const confirmed = await confirmDialog({
      title: isClosed ? 'Reopen Fiscal Year?' : 'Close Fiscal Year?',
      message: isClosed
        ? 'Reopening this fiscal year will allow posting transactions. Continue?'
        : 'Closing this fiscal year will lock accounting periods and prevent changes. Continue?'
    });
    if (confirmed) {
      toggleStatusMutation.mutateAsync(!isClosed);
    }
  };

  const handleOpenEditModal = () => {
    if (fy) {
      setFormData({
        fiscalYear: fy.fiscalYear || '',
        startDate: fy.startDate || '',
        endDate: fy.endDate || '',
        isClosed: !!fy.isClosed
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  if (isLoading) return <PageLoader message="Loading Fiscal Year details..." />;

  if (error || !fy) {
    return (
      <ErrorState 
        title="Fiscal Year Not Found" 
        message={error?.message || "The requested fiscal year could not be found or you do not have permission to view it."} 
        onRetry={refetch} 
      />
    );
  }

  const ci = fy.companyInformation || {};
  const fs = fy.financialSummary || {};
  const ts = fy.transactionSummary || {};
  const fr = fy.financialReportsSummary || {};
  const stats = fy.statistics || {};
  const auditInfo = fy.auditInformation || {};
  const ye = fy.yearEndClosingInformation || {};

  const companyCode = ci.companyCode || fy.companyCode;
  const gstin = ci.gstin || fy.gstin;
  const pan = ci.pan || fy.pan;
  const currency = ci.currency || fy.currency || 'INR';
  const fyFormat = ci.financialYearFormat || fy.fyFormat || 'April - March';

  const totalAccountingPeriods = stats.totalAccountingPeriods ?? fy.totalAccountingPeriods ?? fy.totalPeriods ?? 0;
  const openPeriods = stats.openPeriods ?? fy.openPeriods ?? 0;
  const closedPeriods = stats.closedPeriods ?? fy.closedPeriods ?? 0;
  const totalTransactions = stats.totalTransactions ?? fy.totalTransactions ?? 0;

  const tb = {
    totalDebit: fr.trialBalanceTotalDebit ?? fr.trialBalance?.totalDebit ?? 0,
    totalCredit: fr.trialBalanceTotalCredit ?? fr.trialBalance?.totalCredit ?? 0,
    difference: fr.trialBalanceDifference ?? fr.trialBalance?.difference ?? 0,
  };

  const pl = {
    totalRevenue: fr.plTotalRevenue ?? fr.profitAndLoss?.totalRevenue ?? 0,
    totalExpenses: fr.plTotalExpenses ?? fr.profitAndLoss?.totalExpenses ?? 0,
    netProfit: fr.plNetProfit ?? fr.profitAndLoss?.netProfit ?? 0,
  };

  const bs = {
    totalAssets: fr.bsTotalAssets ?? fr.balanceSheet?.totalAssets ?? 0,
    totalLiabilities: fr.bsTotalLiabilities ?? fr.balanceSheet?.totalLiabilities ?? 0,
    totalEquity: fr.bsEquity ?? fr.balanceSheet?.totalEquity ?? 0,
  };

  const cf = {
    totalReceipts: fr.cfTotalReceipts ?? fr.cashFlow?.totalReceipts ?? 0,
    totalPayments: fr.cfTotalPayments ?? fr.cashFlow?.totalPayments ?? 0,
    netCashFlow: fr.cfNetCashFlow ?? fr.cashFlow?.netCashFlow ?? 0,
  };

  const createdBy = auditInfo.createdBy || fy.createdBy || 'System';
  const createdAt = auditInfo.createdAt || fy.createdAt;
  const updatedBy = auditInfo.updatedBy || fy.updatedBy || 'System';
  const updatedAt = auditInfo.updatedAt || fy.updatedAt;

  const accountingPeriods = fy.accountingPeriods || [];
  const recentTransactions = fy.recentTransactions || [];
  const transactionsList = fy.transactions || [];

  const handlePrint = () => window.print();
  const handleExport = () => window.print();

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutList },
    { id: 'periods', label: 'Accounting Periods', icon: Clock },
    { id: 'financial', label: 'Financial Summary', icon: BarChart2 },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'closing', label: 'Year End Closing', icon: CheckSquare },
    { id: 'recent', label: 'Recent Transactions', icon: History },
    { id: 'audit', label: 'Audit Log', icon: History }
  ];

  const isEmpty = (arr) => !arr || arr.length === 0;

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 pb-6">
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
        title="Total Assets"
        value={`₹${fmt(fs.totalAssets)}`}
        valueClass="text-blue-700"
        icon={Building2}
      />
      <KPICard
        title="Total Liabilities"
        value={`₹${fmt(fs.totalLiabilities)}`}
        valueClass="text-red-700"
        icon={ArrowLeft}
      />
      <KPICard
        title="Total Txns"
        value={totalTransactions}
        valueClass="text-zinc-900"
        icon={FileText}
      />
      <KPICard
        title="Periods"
        value={totalAccountingPeriods}
        subtitle={`${openPeriods} Open / ${closedPeriods} Closed`}
        valueClass="text-zinc-900"
        icon={Clock}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Year',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'FISCAL_YEARS', action: 'UPDATE', behavior: 'disable' },
      onClick: handleOpenEditModal
    },
    {
      label: fy.isClosed ? 'Reopen Year' : 'Close Year',
      icon: RefreshCw,
      variant: fy.isClosed ? 'secondary' : 'primary',
      permission: { module: 'FISCAL_YEARS', action: 'UPDATE', behavior: 'disable' },
      onClick: handleToggleStatus,
      disabled: toggleStatusMutation.isLoading
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'secondary',
      items: [
        { label: 'Print Summary', icon: Printer, onClick: handlePrint },
        { label: 'Export PDF', icon: Download, onClick: handleExport },
        { type: 'divider' },
        { label: 'Generate Reports', icon: FileText, onClick: () => setActiveTab('reports') },
        { label: 'View Trial Balance', icon: BarChart2, onClick: () => setActiveTab('reports') },
        { label: 'View Profit & Loss', icon: Activity, onClick: () => setActiveTab('reports') }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: fy.fiscalYear },
    { icon: Building, label: fy.companyName || 'Company' },
    { icon: Calendar, label: `${fy.startDate} to ${fy.endDate}` },
    { custom: <FiscalStatusBadge isClosed={fy.isClosed} /> }
  ];

  const quickActions = [
    {
      label: 'Edit Fiscal Year',
      icon: Edit2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      permission: { module: 'FISCAL_YEARS', action: 'UPDATE' },
      onClick: handleOpenEditModal
    },
    {
      label: fy.isClosed ? 'Reopen Fiscal Year' : 'Close Fiscal Year',
      icon: RefreshCw,
      iconBg: fy.isClosed ? 'bg-orange-50' : 'bg-red-50',
      iconColor: fy.isClosed ? 'text-orange-600' : 'text-red-600',
      permission: { module: 'FISCAL_YEARS', action: 'UPDATE' },
      onClick: handleToggleStatus
    },
    {
      label: 'Financial Reports',
      icon: FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => setActiveTab('reports')
    },
    {
      label: 'Accounting Periods',
      icon: Clock,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => setActiveTab('periods')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      <EntityHeader
        onBack={() => navigate(buildPath('/accounts/organization/financial-years'))}
        title={`Fiscal Year ${fy.fiscalYear}`}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Fiscal Year Summary" icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600">
              <div className="space-y-4">
                <InfoField label="Fiscal Year" value={fy.fiscalYear} mono />
                <InfoField label="Start Date" value={fy.startDate} />
                <InfoField label="End Date" value={fy.endDate} />
                <InfoField label="FY Format" value={fyFormat} />
                <InfoField label="Status" custom={<FiscalStatusBadge isClosed={fy.isClosed} />} />
              </div>
            </InfoCard>

            <InfoCard title="Company Information" icon={Building} iconBg="bg-purple-50" iconColor="text-purple-600">
              <div className="space-y-4">
                <InfoField label="Company" value={fy.companyName} />
                <InfoField label="Company Code" value={companyCode} mono />
                <InfoField label="GSTIN" value={gstin} />
                <InfoField label="PAN" value={pan} />
                <InfoField label="Currency" value={currency} />
              </div>
            </InfoCard>

            <QuickActionsCard title="Quick Actions" actions={quickActions} />
          </div>

          {/* RIGHT TABS AREA (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="bg-zinc-100/50 p-1.5 rounded-lg border border-zinc-200/50 overflow-x-auto mb-6">
              <div className="flex items-center min-w-max gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-md transition-all outline-none ${
                      activeTab === tab.id 
                        ? 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80 border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900" : "text-zinc-400"} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  
                  <div className="bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Transaction Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                      {[
                        ['Journal Entries', ts.totalJournalEntries, FileText, 'text-blue-600', 'bg-blue-50'],
                        ['Sales Invoices', ts.totalSalesInvoices, ShoppingCart, 'text-emerald-600', 'bg-emerald-50'],
                        ['Purchase Bills', ts.totalPurchaseBills, Package, 'text-rose-600', 'bg-rose-50'],
                        ['Receipts', ts.totalReceipts, CreditCard, 'text-emerald-600', 'bg-emerald-50'],
                        ['Payments', ts.totalPayments, CreditCard, 'text-rose-600', 'bg-rose-50'],
                        ['Credit Notes', ts.totalCreditNotes, FileText, 'text-blue-600', 'bg-blue-50'],
                        ['Debit Notes', ts.totalDebitNotes, FileText, 'text-purple-600', 'bg-purple-50'],
                        ['Total', totalTransactions, Activity, 'text-zinc-600', 'bg-zinc-100']
                      ].map(([label, val, Icon, iconColor, iconBg]) => (
                        <div key={label} className="p-5 bg-zinc-50 rounded-md border border-zinc-100 flex flex-col justify-between">
                          <div className={`w-8 h-8 rounded-md ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
                            <Icon size={16} />
                          </div>
                          <p className="text-2xl font-black text-zinc-900 leading-none mb-1">{val || 0}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ACCOUNTING PERIODS TAB */}
              {activeTab === 'periods' && (
                <div className="animate-fade-in bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Accounting Periods</h3>
                    <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md">{accountingPeriods.length || 0} Total</span>
                  </div>
                  {isEmpty(accountingPeriods) ? (
                    <EmptyState icon={Clock} title="No Accounting Periods" description="There are no accounting periods configured for this fiscal year." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Period</th>
                            <th className="p-4">Start Date</th>
                            <th className="p-4">End Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Txns</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {accountingPeriods.map((p, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-4">
                                <span className="font-mono text-xs text-zinc-500 mr-2">#{p.periodNumber || idx + 1}</span>
                                <span className="font-bold text-zinc-900">{p.periodName}</span>
                              </td>
                              <td className="p-4 font-medium text-zinc-600">{p.startDate}</td>
                              <td className="p-4 font-medium text-zinc-600">{p.endDate}</td>
                              <td className="p-4 font-medium text-zinc-600">{p.periodType}</td>
                              <td className="p-4 text-center">
                                <FiscalStatusBadge isClosed={p.status === 'CLOSED' || p.isClosed} />
                              </td>
                              <td className="p-4 text-center font-bold text-zinc-800">{p.totalTransactions || 0}</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => navigate(buildPath(`/accounts/organization/accounting-periods/${p.periodId || p.id}`))}
                                  className="text-blue-600 font-semibold hover:text-blue-800 text-xs"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* FINANCIAL SUMMARY TAB */}
              {activeTab === 'financial' && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Revenue', val: fs.totalRevenue, color: 'text-emerald-700', border: 'border-emerald-200' },
                      { label: 'Total Expenses', val: fs.totalExpenses, color: 'text-rose-700', border: 'border-rose-200' },
                      { label: 'Gross Profit', val: fs.grossProfit, color: (fs.grossProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700', border: 'border-zinc-200' },
                      { label: 'Net Profit', val: fs.netProfit, color: (fs.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700', border: 'border-zinc-200' },
                      { label: 'Total Assets', val: fs.totalAssets, color: 'text-blue-700', border: 'border-blue-200' },
                      { label: 'Total Liabilities', val: fs.totalLiabilities, color: 'text-rose-700', border: 'border-rose-200' },
                      { label: 'Total Equity', val: fs.totalEquity, color: 'text-blue-700', border: 'border-blue-200' },
                      { label: 'Opening Balance', val: fs.openingBalance || fy.openingBalance, color: 'text-blue-700', border: 'border-blue-200' },
                      { label: 'Closing Balance', val: fs.closingBalance || fy.closingBalance, color: 'text-blue-700', border: 'border-blue-200' },
                    ].map(({ label, val, color, border }) => (
                      <div key={label} className={`p-6 rounded-md border ${border} bg-white shadow-sm flex flex-col`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>₹{fmt(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINANCIAL REPORTS TAB */}
              {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  
                  {/* Trial Balance */}
                  <div className="bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <BarChart2 size={16} className="text-blue-500" />
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Trial Balance Summary</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-md border border-zinc-100">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Debit</span>
                        <span className="text-sm font-black text-rose-600">₹{fmt(tb.totalDebit)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-md border border-zinc-100">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Credit</span>
                        <span className="text-sm font-black text-emerald-600">₹{fmt(tb.totalCredit)}</span>
                      </div>
                      <div className={`flex justify-between items-center p-3 rounded-md border ${(tb.difference || 0) !== 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Difference</span>
                        <span className={`text-sm font-black ${(tb.difference || 0) !== 0 ? 'text-rose-700' : 'text-emerald-700'}`}>₹{fmt(tb.difference)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit & Loss */}
                  <div className="bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <Activity size={16} className="text-emerald-500" />
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Profit & Loss Summary</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-md border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Revenue</span>
                        <span className="text-sm font-black text-emerald-700">₹{fmt(pl.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/50 rounded-md border border-rose-100">
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Expenses</span>
                        <span className="text-sm font-black text-rose-700">₹{fmt(pl.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-md border border-zinc-100">
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Net Profit</span>
                        <span className={`text-sm font-black ${(pl.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{fmt(pl.netProfit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Sheet */}
                  <div className="bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <Building2 size={16} className="text-purple-500" />
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Balance Sheet Summary</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-md border border-blue-100">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Assets</span>
                        <span className="text-sm font-black text-blue-700">₹{fmt(bs.totalAssets)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/50 rounded-md border border-rose-100">
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Liabilities</span>
                        <span className="text-sm font-black text-rose-700">₹{fmt(bs.totalLiabilities)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-md border border-blue-100">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Equity</span>
                        <span className="text-sm font-black text-blue-700">₹{fmt(bs.totalEquity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow */}
                  <div className="bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <CreditCard size={16} className="text-orange-500" />
                      <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Cash Flow Summary</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-md border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Receipts</span>
                        <span className="text-sm font-black text-emerald-700">₹{fmt(cf.totalReceipts)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/50 rounded-md border border-rose-100">
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Payments</span>
                        <span className="text-sm font-black text-rose-700">₹{fmt(cf.totalPayments)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-md border border-zinc-100">
                        <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Net Cash Flow</span>
                        <span className={`text-sm font-black ${(cf.netCashFlow || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{fmt(cf.netCashFlow)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <div className="animate-fade-in bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">All Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md">{transactionsList.length || 0} Total</span>
                  </div>
                  {isEmpty(transactionsList) ? (
                    <EmptyState icon={Activity} title="No Transactions" description="There are no transactions recorded for this fiscal year." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px]">
                          <tr>
                            <th className="p-4">Voucher Number</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Party Name</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {transactionsList.map((t, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-blue-600">{t.voucherNumber}</td>
                              <td className="p-4 font-medium text-zinc-600">{t.transactionType}</td>
                              <td className="p-4 font-medium text-zinc-600">{t.transactionDate}</td>
                              <td className="p-4 font-medium text-zinc-900">{t.partyName || '-'}</td>
                              <td className="p-4 text-right font-black text-zinc-900">₹{fmt(t.amount)}</td>
                              <td className="p-4 text-center"><FiscalStatusBadge isClosed={t.status === 'CLOSED'} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* YEAR END CLOSING TAB */}
              {activeTab === 'closing' && (
                <div className="animate-fade-in bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden max-w-3xl">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Year End Closing Information</h3>
                  </div>
                  <div className="p-6">
                    {fy.isClosed || ye.closingStatus === 'CLOSED' ? (
                      <div className="border border-red-200 rounded-md p-6 bg-red-50/30">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <Lock size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-red-700">Fiscal Year is Closed</h4>
                            <p className="text-sm text-red-600/80 font-medium">Transactions can no longer be posted to this year.</p>
                          </div>
                        </div>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-md border border-red-100">
                          <div className="flex flex-col gap-1">
                            <dt className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Closed By</dt>
                            <dd className="text-sm font-mono font-bold text-zinc-900 bg-zinc-50 px-2 py-1 rounded border border-zinc-200 inline-block w-fit">{ye.closedBy || fy.updatedBy || 'System'}</dd>
                          </div>
                          <div className="flex flex-col gap-1">
                            <dt className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Closed Date</dt>
                            <dd className="text-sm font-bold text-zinc-900">{ye.closedDate || fy.updatedAt || '-'}</dd>
                          </div>
                          <div className="flex flex-col gap-1 col-span-2 mt-2">
                            <dt className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Closing Remarks</dt>
                            <dd className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-md border border-zinc-200">{ye.closingRemarks || 'No closing remarks recorded.'}</dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center bg-amber-50/50 rounded-md border border-amber-200">
                        <ShieldAlert size={64} className="mb-4 text-amber-500" />
                        <h4 className="text-xl font-black text-zinc-900">Fiscal Year is Open</h4>
                        <p className="text-sm text-zinc-600 font-medium mt-2 max-w-md">Closing the fiscal year will lock all accounting periods and calculate year-end opening balances for the next year.</p>
                        <button onClick={handleToggleStatus} className="mt-8 px-6 py-2 bg-zinc-900 text-white text-sm font-bold rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-2">
                          <Lock size={16} /> Close Fiscal Year
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RECENT TRANSACTIONS TAB */}
              {activeTab === 'recent' && (
                <div className="animate-fade-in bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Recent Transactions</h3>
                    <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md">{recentTransactions.length || 0} Total</span>
                  </div>
                  {isEmpty(recentTransactions) ? (
                    <EmptyState icon={Activity} title="No Recent Transactions" description="There are no recent transactions recorded for this fiscal year." />
                  ) : (
                    <div className="p-6">
                      <div className="relative border-l-2 border-zinc-200 ml-4 space-y-8">
                        {recentTransactions.map((txn, idx) => (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-zinc-300" />
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="text-sm font-bold text-zinc-900">
                                {txn.transactionType || 'Transaction'}{' '}
                                <span className="text-zinc-400 font-mono text-xs font-normal ml-2">{txn.voucherNumber}</span>
                              </h4>
                              <span className="text-xs text-zinc-500 font-semibold">{txn.transactionDate || '-'}</span>
                            </div>
                            <p className="text-sm font-medium text-zinc-600 mb-2">{txn.partyName || 'Unknown Party'}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold px-2 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-md">
                                ₹{fmt(txn.amount)}
                              </span>
                              {txn.status && <FiscalStatusBadge isClosed={txn.status === 'CLOSED'} />}
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
                <div className="animate-fade-in bg-white rounded-md shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Audit Trail</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2"><ArrowRightLeft size={14} /> Created Record</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Created By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-md border border-zinc-200">{createdBy}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900">{createdAt ? new Date(createdAt).toLocaleString() : '-'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-md border border-zinc-200">{updatedBy}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900">{updatedAt ? new Date(updatedAt).toLocaleString() : '-'}</p>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Fiscal Year"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Fiscal Year <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="fiscalYear"
                value={formData.fiscalYear}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscalYear: e.target.value }))}
                className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                placeholder="e.g. 2026-2027"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full h-10 px-3 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                  required
                />
              </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-zinc-50 border border-zinc-200 rounded-lg mt-2 hover:bg-zinc-100 transition-colors">
              <input
                type="checkbox"
                name="isClosed"
                checked={formData.isClosed}
                onChange={(e) => setFormData(prev => ({ ...prev, isClosed: e.target.checked }))}
                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
              />
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Mark this Fiscal Year as Closed
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2 text-sm font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 bg-white border border-zinc-200 rounded-md transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50"
            >
              {updateMutation.isLoading && (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              Update Fiscal Year
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
