import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Printer,
  Download,
  RotateCcw,
  AlertCircle,
  ChevronsUpDown
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { profitLossApi } from '../../../api/account/reports';
import { fiscalYearsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import DataTableHeader from '../../../components/data-table/DataTableHeader';
import DataTableAdvancedFilters from '../../../components/data-table/DataTableAdvancedFilters';
import FinancialStatementTable from '../../../components/accounting/FinancialStatementTable';
import ProfitLossSummary from '../../../components/accounting/ProfitLossSummary';

export default function ProfitLoss() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);

  const fallbackCompanyId = useMemo(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode ||
        ''
      );
    } catch {
      return '';
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  // Column visibility matching General Ledger
  const [visibleColumns, setVisibleColumns] = useState([
    'accountCode',
    'accountName',
    'category',
    'amount'
  ]);

  const initialFilters = {
    companyId: selectedCompany?.id || fallbackCompanyId || '',
    fromDate: '',
    toDate: '',
    fiscalYearId: '',
    categoryFilter: '',
    accountCode: '',
    branchId: '',
    costCenterId: '',
    minAmount: '',
    maxAmount: '',
    page: 0,
    pageSize: 100
  };

  const [filters, setFilters] = useState(initialFilters);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  // Fetch Fiscal Years for filter dropdown
  const { data: fiscalYearsResponse } = useApiQuery(
    () => fiscalYearsApi.getFiscalYears({ companyId: effectiveCompanyId, size: 100 }),
    null,
    { skip: !effectiveCompanyId }
  );

  const fiscalYears = useMemo(() => {
    const raw =
      fiscalYearsResponse?.data?.data ||
      fiscalYearsResponse?.data?.content ||
      fiscalYearsResponse?.data ||
      [];
    return Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
  }, [fiscalYearsResponse]);

  const fetchReport = useCallback(
    async (overrideFilters = {}) => {
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
        if (currentFilters.fiscalYearId) params.fiscalYearId = currentFilters.fiscalYearId;
        if (currentFilters.branchId) params.branchId = currentFilters.branchId;
        if (currentFilters.costCenterId) params.costCenterId = currentFilters.costCenterId;

        const res = await profitLossApi.getProfitLoss(params);
        const parsedData = res?.data?.data || res?.data || res;

        if (res && res.success !== false) {
          setData(parsedData);
        } else {
          setError(res?.message || 'Failed to fetch Profit & Loss Statement');
        }
      } catch (err) {
        console.error('P&L API error:', err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'An error occurred while generating Profit & Loss Statement'
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, selectedCompany, fallbackCompanyId]
  );

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchReport();
    }
  }, [
    effectiveCompanyId,
    filters.fromDate,
    filters.toDate,
    filters.fiscalYearId,
    filters.page,
    filters.pageSize
  ]);

  useEffect(() => {
    if (selectedCompany?.id && filters.companyId !== selectedCompany.id) {
      setFilters((prev) => ({ ...prev, companyId: selectedCompany.id, page: 0 }));
    }
  }, [selectedCompany]);

  const handleFilterChange = (name, value) => {
    // If fiscal year changes, auto-populate dates if available
    if (name === 'fiscalYearId' && value) {
      const selectedFy = fiscalYears.find((fy) => String(fy.id) === String(value));
      if (selectedFy?.startDate && selectedFy?.endDate) {
        setFilters((prev) => ({
          ...prev,
          fiscalYearId: value,
          fromDate: selectedFy.startDate.split('T')[0],
          toDate: selectedFy.endDate.split('T')[0],
          page: 0
        }));
        return;
      }
    }

    setFilters((prev) => ({ ...prev, [name]: value, page: 0 }));
  };

  const handleResetFilters = () => {
    const reset = {
      ...initialFilters,
      companyId: selectedCompany?.id || fallbackCompanyId || ''
    };
    setFilters(reset);
    setSearchTerm('');
    setData(null);
    setError(null);
    fetchReport(reset);
  };

  const handleAccountClick = (accountId) => {
    if (!accountId) return;
    const searchParams = new URLSearchParams();
    searchParams.set('accountId', accountId);
    if (filters.fromDate) searchParams.set('fromDate', filters.fromDate);
    if (filters.toDate) searchParams.set('toDate', filters.toDate);
    navigate(buildPath(`/accounts/reports/ledger?${searchParams.toString()}`));
  };

  const toggleSection = (id) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reportData = data?.data || data;
  const rawRows = reportData?.rows || reportData?.accounts || [];
  const summary = reportData?.summary || {};

  // Group accounts into Revenue and Expense sections with local filter support
  const { revenueRows, expenseRows, calculatedTotalRevenue, calculatedTotalExpenses } = useMemo(() => {
    const rev = [];
    const exp = [];
    let totRev = 0;
    let totExp = 0;

    const codeFilter = (filters.accountCode || '').trim().toLowerCase();
    const minAmt = filters.minAmount !== '' && !isNaN(Number(filters.minAmount)) ? Number(filters.minAmount) : null;
    const maxAmt = filters.maxAmount !== '' && !isNaN(Number(filters.maxAmount)) ? Number(filters.maxAmount) : null;

    rawRows.forEach((r) => {
      // Apply advanced code and amount range filtering
      if (codeFilter && !String(r.accountCode || '').toLowerCase().includes(codeFilter)) {
        return;
      }

      const amt = Math.abs(Number(r.closingBalance ?? r.amount ?? r.netAmount ?? 0));
      if (minAmt !== null && amt < minAmt) return;
      if (maxAmt !== null && amt > maxAmt) return;

      const type = String(r.accountType || r.category || '').toUpperCase();
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
  }, [rawRows, filters.accountCode, filters.minAmount, filters.maxAmount]);

  const totalRevenue =
    summary.totalRevenue != null
      ? summary.totalRevenue
      : summary.totalIncome != null
      ? summary.totalIncome
      : calculatedTotalRevenue;

  const totalExpenses =
    summary.totalExpenses != null ? summary.totalExpenses : calculatedTotalExpenses;

  const grossProfit =
    summary.grossProfit != null
      ? summary.grossProfit
      : totalRevenue - (summary.costOfGoodsSold || 0);

  const netProfit =
    summary.netProfit != null ? summary.netProfit : totalRevenue - totalExpenses;

  const isNetProfitPositive = netProfit >= 0;

  // Hierarchical Statement Sections respecting Category filter
  const sections = useMemo(() => {
    const secList = [];

    if (!filters.categoryFilter || filters.categoryFilter === 'REVENUE') {
      secList.push({
        id: 'revenue',
        title: 'Operating Revenue & Income',
        subtotalLabel: 'Total Revenue & Income',
        subtotal: totalRevenue,
        rows: revenueRows
      });
    }

    if (!filters.categoryFilter || filters.categoryFilter === 'EXPENSE') {
      secList.push({
        id: 'expenses',
        title: 'Operating & Administrative Expenses',
        subtotalLabel: 'Total Operating Expenses',
        subtotal: totalExpenses,
        rows: expenseRows
      });
    }

    return secList;
  }, [filters.categoryFilter, totalRevenue, totalExpenses, revenueRows, expenseRows]);

  const toggleAllSections = () => {
    const allCollapsed = sections.every((s) => collapsedSections[s.id]);
    const next = {};
    sections.forEach((s) => {
      next[s.id] = !allCollapsed;
    });
    setCollapsedSections(next);
  };

  // Grand totals footer rows
  const grandTotals = useMemo(() => {
    return [
      {
        label: 'Gross Operating Profit',
        amount: grossProfit,
        color: 'text-blue-600 dark:text-blue-400'
      },
      {
        label: isNetProfitPositive ? 'Net Operating Profit' : 'Net Operating Loss',
        amount: Math.abs(netProfit),
        isNetProfit: isNetProfitPositive
      }
    ];
  }, [grossProfit, netProfit, isNetProfitPositive]);

  // Column definitions for ColumnVisibilityToggle
  const columns = useMemo(() => [
    { key: 'accountCode', label: 'ACCOUNT CODE' },
    { key: 'accountName', label: 'ACCOUNT NAME & DESCRIPTION' },
    { key: 'category', label: 'CATEGORY / TYPE' },
    { key: 'amount', label: 'AMOUNT' }
  ], []);

  // Basic Filter Inputs matching GeneralLedger
  const basicFilters = useMemo(() => [
    {
      key: 'fromDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'Date To',
      type: 'date'
    },
    {
      key: 'categoryFilter',
      label: 'Category / Section',
      type: 'select',
      options: [
        { value: '', label: 'All Sections' },
        { value: 'REVENUE', label: 'Revenue & Income' },
        { value: 'EXPENSE', label: 'Operating Expenses' }
      ]
    }
  ], []);

  // Advanced Filters matching GeneralLedger
  const advancedFilterGroups = useMemo(() => [
    {
      id: 'period_and_account',
      title: 'Fiscal Period & Classification',
      fields: [
        {
          id: 'fiscalYearId',
          label: 'Fiscal Year',
          type: 'select',
          options: [
            { value: '', label: 'All Fiscal Years' },
            ...fiscalYears.map((fy) => ({
              value: fy.id,
              label:
                fy.name ||
                fy.fiscalYear ||
                `${fy.startDate?.split('-')[0] || ''} - ${fy.endDate?.split('-')[0] || ''}`
            }))
          ]
        },
        {
          id: 'accountCode',
          label: 'Account Code',
          type: 'text',
          placeholder: 'e.g. 4001 or 5001'
        }
      ]
    },
    {
      id: 'accounting_allocations',
      title: 'Allocations & Amounts',
      fields: [
        {
          id: 'branchId',
          label: 'Branch ID',
          type: 'text',
          placeholder: 'Branch ID'
        },
        {
          id: 'costCenterId',
          label: 'Cost Center ID',
          type: 'text',
          placeholder: 'Cost Center ID'
        },
        {
          id: 'minAmount',
          label: 'Min Amount',
          type: 'number',
          placeholder: '0.00'
        },
        {
          id: 'maxAmount',
          label: 'Max Amount',
          type: 'number',
          placeholder: '0.00'
        }
      ]
    }
  ], [fiscalYears]);

  const activeAdvancedCount = useMemo(() => {
    return [
      filters.fiscalYearId,
      filters.accountCode,
      filters.branchId,
      filters.costCenterId,
      filters.minAmount,
      filters.maxAmount
    ].filter((v) => v !== '' && v !== null && v !== undefined).length;
  }, [filters]);

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
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* 1. Common Enterprise Page Header matching General Ledger */}
      <PageHeader
        title="Profit & Loss Statement"
        description="Comprehensive financial performance statement showing revenue, expenditure, and resulting net profit or loss."
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

      {/* 2. Common Enterprise Module Tabs with Profit & Loss active */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Area matching General Ledger layout */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 3. Main Unified Report Card Container */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1">
            {/* Unified Filter Toolbar matching General Ledger DataTableHeader */}
            <DataTableHeader
              searchable={true}
              searchValue={searchTerm}
              searchPlaceholder="Search account name, code, or description..."
              onSearchChange={(val) => setSearchTerm(val)}
              filters={basicFilters}
              filterValues={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              onRefresh={() => fetchReport()}
              isRefreshing={loading}
              onExport={() => setIsExportModalOpen(true)}
              hasAdvancedFilters={true}
              isAdvancedOpen={isAdvancedOpen}
              onToggleAdvanced={() => setIsAdvancedOpen((prev) => !prev)}
              activeAdvancedCount={activeAdvancedCount}
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              leftHeaderActions={
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="h-9 px-3 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:text-[#E6E8EE] dark:hover:text-white dark:bg-[#1D212C] dark:hover:bg-[#222736] transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Expand or collapse all report sections"
                >
                  <ChevronsUpDown size={13} />
                  <span>Toggle Sections</span>
                </button>
              }
              headerActions={
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Print Report"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              }
            />

            {/* Collapsible Advanced Filters matching General Ledger */}
            <DataTableAdvancedFilters
              isOpen={isAdvancedOpen}
              onClose={() => setIsAdvancedOpen(false)}
              groups={advancedFilterGroups}
              filterValues={filters}
              onFilterChange={handleFilterChange}
            />

            {/* Hierarchical Financial Statement Table inside the same card */}
            <div className="flex-1 overflow-x-auto">
              <FinancialStatementTable
                sections={sections}
                grandTotals={grandTotals}
                loading={loading}
                searchTerm={searchTerm}
                visibleColumns={visibleColumns}
                hideToolbar={true}
                collapsedSections={collapsedSections}
                onToggleSection={toggleSection}
                onAccountClick={handleAccountClick}
                emptyMessage="No revenue or expense records found"
                emptyDescription="Try selecting a different date range or fiscal year to generate the report."
              />
            </div>
          </div>

          {/* 4. Compact Bottom Total Summary matching GeneralLedger AccountSummary */}
          {rawRows.length > 0 && !loading && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-none">
              <ProfitLossSummary
                totalRevenue={totalRevenue}
                totalExpenses={totalExpenses}
                grossProfit={grossProfit}
                netProfit={netProfit}
                isNetProfitPositive={isNetProfitPositive}
                revenueAccountCount={revenueRows.length}
                expenseAccountCount={expenseRows.length}
              />
            </div>
          )}
        </div>

        {/* 5. Subtle Enterprise Footer matching General Ledger */}
        <div className="pt-4 pb-2 border-t border-zinc-200 dark:border-[#2A2F3D] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-zinc-500 dark:text-[#6B7184]">
          <span>© {new Date().getFullYear()} CloudERP Systems • Profit &amp; Loss Statement</span>
          <span className="hidden sm:inline">•</span>
          <span>Fiscal Year Reporting &amp; Audit Trail Compliant</span>
          <span className="hidden sm:inline">•</span>
          <span>Confidential Financial Document</span>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="profit-loss"
        defaultFilters={Object.fromEntries(
          Object.entries(filters).filter(([k, v]) => v !== '' && v !== null && v !== undefined)
        )}
        onExportCustom={handleCustomExport}
      />
    </div>
  );
}
