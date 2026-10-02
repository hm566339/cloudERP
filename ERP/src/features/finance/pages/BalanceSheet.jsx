import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Printer,
  Download,
  RotateCcw,
  AlertCircle,
  Landmark,
  ShieldCheck,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { balanceSheetApi } from '../../../api/account/reports';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import FinancialSummaryCards from '../../../components/accounting/FinancialSummaryCards';
import FinancialStatementTable from '../../../components/accounting/FinancialStatementTable';

export default function BalanceSheet() {
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
    page: 0,
    pageSize: 100
  };

  const [filters, setFilters] = useState(initialFilters);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

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

      const res = await balanceSheetApi.getBalanceSheet(params);
      const parsedData = res?.data?.data || res?.data || res;

      if (res && res.success !== false) {
        setData(parsedData);
      } else {
        setError(res?.message || 'Failed to fetch Balance Sheet report');
      }
    } catch (err) {
      console.error('Balance Sheet API error:', err);
      setError(err?.response?.data?.message || err?.message || 'An error occurred while generating Balance Sheet');
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

  // Classify rows into Assets, Liabilities, and Equity
  const { assetRows, liabilityRows, equityRows, calculatedAssets, calculatedLiab, calculatedEquity } = useMemo(() => {
    const assets = [];
    const liab = [];
    const eq = [];
    let totAssets = 0;
    let totLiab = 0;
    let totEq = 0;

    rows.forEach(r => {
      const type = String(r.accountType || r.category || '').toUpperCase();
      const amt = Math.abs(Number(r.closingBalance ?? r.amount ?? r.netAmount ?? 0));

      if (type.includes('LIAB')) {
        liab.push({ ...r, amount: amt });
        totLiab += amt;
      } else if (type.includes('EQUITY') || type.includes('CAPITAL') || type.includes('RETAINED')) {
        eq.push({ ...r, amount: amt });
        totEq += amt;
      } else {
        // Defaults to asset
        assets.push({ ...r, amount: amt });
        totAssets += amt;
      }
    });

    return {
      assetRows: assets,
      liabilityRows: liab,
      equityRows: eq,
      calculatedAssets: totAssets,
      calculatedLiab: totLiab,
      calculatedEquity: totEq
    };
  }, [rows]);

  const totalAssets = summary.totalAssets != null ? summary.totalAssets : calculatedAssets;
  const totalLiabilities = summary.totalLiabilities != null ? summary.totalLiabilities : calculatedLiab;
  const totalEquity = summary.totalEquity != null ? summary.totalEquity : calculatedEquity;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isEquationBalanced = summary.balanced !== undefined ? Boolean(summary.balanced) : difference < 0.01;

  // KPI Metric Cards
  const summaryCards = [
    {
      label: 'Total Assets',
      value: totalAssets,
      color: 'text-emerald-600',
      icon: Landmark,
      subtext: 'Current and non-current business assets'
    },
    {
      label: 'Total Liabilities',
      value: totalLiabilities,
      color: 'text-amber-600',
      icon: Briefcase,
      subtext: 'Current and long-term financial obligations'
    },
    {
      label: 'Total Equity',
      value: totalEquity,
      color: 'text-blue-600',
      icon: Layers,
      subtext: 'Owner equity and retained earnings'
    },
    {
      label: 'Accounting Equation',
      value: totalLiabilitiesAndEquity,
      color: isEquationBalanced ? 'text-zinc-900' : 'text-rose-600',
      icon: ShieldCheck,
      badge: isEquationBalanced ? 'Assets = L + E' : 'Discrepancy',
      badgeType: isEquationBalanced ? 'success' : 'danger',
      subtext: isEquationBalanced
        ? 'Fully balanced accounting position'
        : `Unbalanced difference: ₹${difference.toFixed(2)}`
    }
  ];

  // Hierarchical Statement Sections
  const sections = [
    {
      id: 'assets',
      title: 'Assets',
      subtotalLabel: 'Total Assets',
      subtotal: totalAssets,
      rows: assetRows
    },
    {
      id: 'liabilities',
      title: 'Liabilities',
      subtotalLabel: 'Total Liabilities',
      subtotal: totalLiabilities,
      rows: liabilityRows
    },
    {
      id: 'equity',
      title: 'Equity & Retained Earnings',
      subtotalLabel: 'Total Equity',
      subtotal: totalEquity,
      rows: equityRows
    }
  ];

  // Grand totals footer
  const grandTotals = [
    {
      label: 'Total Assets',
      amount: totalAssets,
      color: 'text-emerald-700'
    },
    {
      label: 'Total Liabilities & Equity',
      amount: totalLiabilitiesAndEquity,
      isBalanced: isEquationBalanced,
      color: isEquationBalanced ? 'text-zinc-900' : 'text-rose-700'
    }
  ];

  const handleCustomExport = async ({ format, dateFrom, dateTo }) => {
    const params = {
      companyId: effectiveCompanyId,
      fromDate: dateFrom || filters.fromDate || undefined,
      toDate: dateTo || filters.toDate || undefined
    };

    const isPdf = String(format).toUpperCase() === 'PDF';
    const exporter = isPdf ? balanceSheetApi.exportBalanceSheetPdf : balanceSheetApi.exportBalanceSheetExcel;
    const ext = isPdf ? 'pdf' : 'xlsx';

    const blob = await exporter(params);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balance-sheet-${Date.now()}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* 1. Page Header */}
      <PageHeader
        title="Balance Sheet"
        description="Statement of financial position reflecting company assets, liabilities, and shareholder equity as of reporting date."
        icon={FileSpreadsheet}
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
            label: loading ? 'Generating...' : 'Generate Balance Sheet',
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
              <span className="text-xs font-semibold text-zinc-700">As Of Date / Period:</span>
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
                placeholder="To Date (As of)"
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
            emptyMessage="No balance sheet accounts found"
            emptyDescription="Select an As-of reporting date and click Generate Balance Sheet to view the report."
          />
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="balance-sheet"
        defaultFilters={Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null))}
        onExportCustom={handleCustomExport}
      />
    </div>
  );
}
