import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Printer,
  Download,
  RotateCcw,
  AlertCircle,
  DollarSign,
  TrendingDown,
  PieChart,
  Calendar,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { profitLossApi } from '../../../api/account/reports';
import { fiscalYearsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import FinancialSummaryCards from '../../../components/accounting/FinancialSummaryCards';
import FinancialStatementTable from '../../../components/accounting/FinancialStatementTable';

export default function ProfitLoss() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);

  const fallbackCompanyId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode || '';
    } catch {
      return '';
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const initialFilters = {
    companyId: selectedCompany?.id || fallbackCompanyId || '',
    fromDate: '',
    toDate: '',
    fiscalYearId: '',
    page: 0,
    pageSize: 100
  };

  const [filters, setFilters] = useState(initialFilters);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  // Fiscal Years for filter
  const { data: fiscalYearsResponse } = useApiQuery(
    () => fiscalYearsApi.getFiscalYears({ companyId: effectiveCompanyId, size: 100 }),
    null,
    { skip: !effectiveCompanyId }
  );

  const fiscalYears = useMemo(() => {
    const raw = fiscalYearsResponse?.data?.data || fiscalYearsResponse?.data?.content || fiscalYearsResponse?.data || [];
    return Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
  }, [fiscalYearsResponse]);

  const fetchReport = useCallback(async (overrideFilters = {}) => {
    const currentFilters = { ...filters, ...overrideFilters };
    const companyId = currentFilters.companyId || selectedCompany?.id || fallbackCompanyId;

    if (!companyId) {
      setError('Company is required. Please select a company from the top menu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        companyId,
        page: currentFilters.page || 0,
        pageSize: currentFilters.pageSize || 100
      };

      if (currentFilters.fromDate) params.fromDate = currentFilters.fromDate;
      if (currentFilters.toDate) params.toDate = currentFilters.toDate;

      const res = await profitLossApi.getProfitLoss(params);
      const parsedData = res?.data?.data || res?.data || res;

      if (res && res.success !== false) {
        setData(parsedData);
      } else {
        setError(res?.message || 'Failed to fetch Profit & Loss Statement');
      }
    } catch (err) {
      console.error('P&L API error:', err);
      setError(err?.response?.data?.message || err?.message || 'An error occurred while generating Profit & Loss Statement');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCompany, fallbackCompanyId]);

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchReport();
    }
  }, [effectiveCompanyId, filters.fromDate, filters.toDate, filters.page, filters.pageSize]);

  useEffect(() => {
    if (selectedCompany?.id && filters.companyId !== selectedCompany.id) {
      setFilters(prev => ({ ...prev, companyId: selectedCompany.id, page: 0 }));
    }
  }, [selectedCompany]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
  };

  const handleResetFilters = () => {
    const reset = {
      ...initialFilters,
      companyId: selectedCompany?.id || fallbackCompanyId || ''
    };
    setFilters(reset);
    setData(null);
    setError(null);
  };

  const handleAccountClick = (accountId) => {
    if (!accountId) return;
    const searchParams = new URLSearchParams();
    searchParams.set('accountId', accountId);
    if (filters.fromDate) searchParams.set('fromDate', filters.fromDate);
    if (filters.toDate) searchParams.set('toDate', filters.toDate);
    navigate(buildPath(`/accounts/reports/ledger?${searchParams.toString()}`));
  };

  const reportData = data?.data || data;
  const rows = reportData?.rows || reportData?.accounts || [];
  const summary = reportData?.summary || {};

  // Group accounts into Revenue and Expense sections
  const { revenueRows, expenseRows, calculatedTotalRevenue, calculatedTotalExpenses } = useMemo(() => {
    const rev = [];
    const exp = [];
    let totRev = 0;
    let totExp = 0;

    rows.forEach(r => {
      const type = String(r.accountType || r.category || '').toUpperCase();
      const amt = Math.abs(Number(r.closingBalance ?? r.amount ?? r.netAmount ?? 0));
      
      const isExpense = type.includes('EXPENSE') || type.includes('COST') || type.includes('LOSS');
      if (isExpense) {
        exp.push({ ...r, amount: amt });
        totExp += amt;
      } else {
        // Defaults to revenue/income
        rev.push({ ...r, amount: amt });
        totRev += amt;
      }
    });

    return {
      revenueRows: rev,
      expenseRows: exp,
      calculatedTotalRevenue: totRev,
      calculatedTotalExpenses: totExp
    };
  }, [rows]);

  const totalRevenue = summary.totalRevenue != null ? summary.totalRevenue : (summary.totalIncome != null ? summary.totalIncome : calculatedTotalRevenue);
  const totalExpenses = summary.totalExpenses != null ? summary.totalExpenses : calculatedTotalExpenses;
  const grossProfit = summary.grossProfit != null ? summary.grossProfit : (totalRevenue - (summary.costOfGoodsSold || 0));
  const netProfit = summary.netProfit != null ? summary.netProfit : (totalRevenue - totalExpenses);

  const isNetProfitPositive = netProfit >= 0;

  // KPI Summary Cards
  const summaryCards = [
    {
      label: 'Total Revenue / Income',
      value: totalRevenue,
      color: 'text-emerald-600',
      icon: TrendingUp,
      subtext: 'Gross operating and non-operating revenue'
    },
    {
      label: 'Total Expenses',
      value: totalExpenses,
      color: 'text-rose-600',
      icon: TrendingDown,
      subtext: 'Direct and operational expenditure'
    },
    {
      label: 'Gross Profit',
      value: grossProfit,
      color: 'text-blue-600',
      icon: PieChart,
      subtext: 'Revenue minus direct costs'
    },
    {
      label: 'Net Profit / (Loss)',
      value: Math.abs(netProfit),
      color: isNetProfitPositive ? 'text-emerald-600' : 'text-rose-600',
      icon: DollarSign,
      badge: isNetProfitPositive ? 'Net Profit' : 'Net Loss',
      badgeType: isNetProfitPositive ? 'success' : 'danger',
      subtext: isNetProfitPositive ? 'Profitable reporting period' : 'Loss incurred for the period'
    }
  ];

  // Hierarchical Statement Sections
  const sections = [
    {
      id: 'revenue',
      title: 'Operating Revenue & Income',
      subtotalLabel: 'Total Revenue & Income',
      subtotal: totalRevenue,
      rows: revenueRows
    },
    {
      id: 'expenses',
      title: 'Operating & Administrative Expenses',
      subtotalLabel: 'Total Operating Expenses',
      subtotal: totalExpenses,
      rows: expenseRows
    }
  ];

  // Grand totals footer rows
  const grandTotals = [
    {
      label: 'Gross Profit',
      amount: grossProfit,
      color: 'text-blue-600'
    },
    {
      label: isNetProfitPositive ? 'Net Profit' : 'Net Loss',
      amount: Math.abs(netProfit),
      isNetProfit: isNetProfitPositive
    }
  ];

  const handleCustomExport = async ({ format, dateFrom, dateTo }) => {
    const params = {
      companyId: effectiveCompanyId,
      fromDate: dateFrom || filters.fromDate || undefined,
      toDate: dateTo || filters.toDate || undefined
    };

    const isPdf = String(format).toUpperCase() === 'PDF';
    const exporter = isPdf ? profitLossApi.exportProfitLossPdf : profitLossApi.exportProfitLossExcel;
    const ext = isPdf ? 'pdf' : 'xlsx';

    const blob = await exporter(params);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `profit-loss-${Date.now()}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* 1. Page Header */}
      <PageHeader
        title="Profit & Loss Statement"
        description="Detailed financial performance statement showing revenue, expenses, and resulting net profit or loss."
        icon={TrendingUp}
        actionButtons={[
          {
            key: 'print',
            label: 'Print',
            icon: Printer,
            variant: 'outline',
            onClick: () => window.print()
          },
          {
            key: 'export',
            label: 'Export',
            icon: Download,
            variant: 'outline',
            onClick: () => setIsExportModalOpen(true)
          },
          {
            key: 'generate',
            label: loading ? 'Generating...' : 'Generate Statement',
            icon: RotateCcw,
            variant: 'primary',
            disabled: loading,
            onClick: () => fetchReport()
          }
        ]}
      />

      {/* 2. Module Tabs */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 3. KPI Metric Cards */}
        <FinancialSummaryCards cards={summaryCards} />

        {/* 4. Filter Controls Bar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-700">Period:</span>
            </div>
            <div>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="From Date"
              />
            </div>
            <span className="text-zinc-400 text-xs">to</span>
            <div>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="To Date"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-3 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => fetchReport()}
              disabled={loading}
              className="h-8 px-3 text-[11px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 5. Hierarchical Financial Statement Table */}
        <div className="flex-1 min-h-[350px]">
          <FinancialStatementTable
            sections={sections}
            grandTotals={grandTotals}
            loading={loading}
            onAccountClick={handleAccountClick}
            emptyMessage="No revenue or expense records found"
            emptyDescription="Select a date range and click Generate Statement to view the Profit & Loss report."
          />
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="profit-loss"
        defaultFilters={Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null))}
        onExportCustom={handleCustomExport}
      />
    </div>
  );
}
