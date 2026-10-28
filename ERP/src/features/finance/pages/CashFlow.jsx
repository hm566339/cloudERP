import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  CheckCircle2,
  Landmark,
  Eye,
  SlidersHorizontal,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ShieldCheck,
  ArrowUpDown,
  ExternalLink,
  Receipt,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { cashFlowApi } from '../../../api/account/reports';
import { fiscalYearsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import { getSerialNumber, getSerialNumberRange } from '../../../utils/serialNumberHelper';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import ColumnVisibilityToggle from '../../../components/common/ColumnVisibilityToggle';

/**
 * Currency formatter respecting dynamic baseCurrency from API
 */
const formatMoney = (amount, currencyCode = 'USD') => {
  const safeAmount = amount === null || amount === undefined || isNaN(Number(amount)) ? 0 : Number(amount);
  const code = String(currencyCode || 'USD').trim().toUpperCase();
  const locale = code === 'INR' ? 'en-IN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeAmount);
  } catch {
    return `${code} ${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Date formatter DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB');
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
};

/**
 * Status Pill Badge
 */
const getStatusBadge = (status) => {
  const s = status ? status.toString().toUpperCase() : 'POSTED';
  if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
        {status || 'POSTED'}
      </span>
    );
  }
  if (s === 'DRAFT' || s === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
        {status}
      </span>
    );
  }
  if (s === 'CANCELLED' || s === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
      {status}
    </span>
  );
};

/**
 * Category Badge with subtle tonal styling
 */
const getCategoryBadge = (category) => {
  const cat = String(category || 'Operating');
  const lower = cat.toLowerCase();
  if (lower.includes('operating')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
        {cat}
      </span>
    );
  }
  if (lower.includes('investing')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
        {cat}
      </span>
    );
  }
  if (lower.includes('financing')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
        {cat}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
      {cat}
    </span>
  );
};

export default function CashFlow() {
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

  const defaultDates = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      fromDate: `${y}-${m}-01`,
      toDate: `${y}-${m}-${d}`
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'transactions' | 'accounts' | 'activities' | 'documents'

  const initialFilters = useMemo(
    () => ({
      companyId: selectedCompany?.id || fallbackCompanyId || '',
      search: '',
      fiscalYearId: '',
      fromDate: defaultDates.fromDate,
      toDate: defaultDates.toDate,
      cashFlowType: '',
      branchId: '',
      departmentId: '',
      page: 0,
      pageSize: 50
    }),
    [selectedCompany, fallbackCompanyId, defaultDates]
  );

  const [filters, setFilters] = useState(initialFilters);

  // Column definitions for visibility toggle
  const ALL_COLUMNS = useMemo(
    () => [
      { key: 'rowIndex', label: '#' },
      { key: 'date', label: 'Date' },
      { key: 'cashFlowCategory', label: 'Category' },
      { key: 'accountCode', label: 'Account Code' },
      { key: 'accountName', label: 'Account Name' },
      { key: 'narration', label: 'Narration / Description' },
      { key: 'cashIn', label: 'Cash In' },
      { key: 'cashOut', label: 'Cash Out' },
      { key: 'netCash', label: 'Net Cash' },
      { key: 'status', label: 'Status' },
      { key: 'reference', label: 'Reference' },
      { key: 'actions', label: 'Actions' }
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState([
    'rowIndex',
    'date',
    'cashFlowCategory',
    'accountCode',
    'accountName',
    'narration',
    'cashIn',
    'cashOut',
    'netCash',
    'status',
    'reference',
    'actions'
  ]);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  // Fiscal Years query
  const { data: fiscalYearsResponse } = useApiQuery(
    () => fiscalYearsApi.getFiscalYears({ companyId: effectiveCompanyId, size: 100 }),
    null,
    { skip: !effectiveCompanyId }
  );

  const fiscalYearOptions = useMemo(() => {
    const raw =
      fiscalYearsResponse?.data?.data ||
      fiscalYearsResponse?.data?.content ||
      fiscalYearsResponse?.data ||
      [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
    return [
      { value: '', label: 'All Fiscal Years' },
      ...list.map((fy) => ({
        value: fy.id,
        label:
          fy.name ||
          fy.fiscalYear ||
          `${fy.startDate?.split('-')[0] || ''} - ${fy.endDate?.split('-')[0] || ''}`,
        startDate: fy.startDate,
        endDate: fy.endDate
      }))
    ];
  }, [fiscalYearsResponse]);

  // Fetch report data
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
        const sDate = currentFilters.fromDate || defaultDates.fromDate;
        const eDate = currentFilters.toDate || defaultDates.toDate;

        const params = {
          companyId,
          startDate: sDate,
          endDate: eDate,
          fromDate: sDate,
          toDate: eDate,
          page: currentFilters.page || 0,
          pageSize: currentFilters.pageSize || 50
        };

        if (currentFilters.fiscalYearId) params.fiscalYearId = currentFilters.fiscalYearId;
        if (currentFilters.cashFlowType) params.cashFlowType = currentFilters.cashFlowType;
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.branchId) params.branchId = currentFilters.branchId;
        if (currentFilters.departmentId) params.departmentId = currentFilters.departmentId;

        const res = await cashFlowApi.getCashFlow(params);
        const parsed = res?.data?.data || res?.data || res;

        if (res && res.success !== false) {
          setData(parsed);
        } else {
          setError(res?.message || 'Failed to fetch Cash Flow Statement');
        }
      } catch (err) {
        console.error('Cash Flow API error:', err);
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.data?.startDate ||
          err?.response?.data?.data?.endDate ||
          err?.message ||
          'An error occurred while fetching the Cash Flow Statement';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [filters, selectedCompany, fallbackCompanyId, defaultDates]
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
    filters.cashFlowType,
    filters.page,
    filters.pageSize
  ]);

  useEffect(() => {
    if (selectedCompany?.id && filters.companyId !== selectedCompany.id) {
      setFilters((prev) => ({ ...prev, companyId: selectedCompany.id, page: 0 }));
    }
  }, [selectedCompany]);

  const handleFilterChange = (name, value) => {
    if (name === 'fiscalYearId') {
      const selectedFy = fiscalYearOptions.find((o) => o.value === value);
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
      companyId: selectedCompany?.id || fallbackCompanyId || '',
      fromDate: defaultDates.fromDate,
      toDate: defaultDates.toDate
    };
    setFilters(reset);
    setData(null);
    setError(null);
    fetchReport(reset);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleAccountClick = (accountId) => {
    if (!accountId) return;
    const searchParams = new URLSearchParams();
    searchParams.set('accountId', accountId);
    if (filters.fromDate) searchParams.set('fromDate', filters.fromDate);
    if (filters.toDate) searchParams.set('toDate', filters.toDate);
    navigate(buildPath(`/accounts/reports/ledger?${searchParams.toString()}`));
  };

  // Count active advanced filters
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (filters.branchId) count++;
    if (filters.departmentId) count++;
    return count;
  }, [filters.branchId, filters.departmentId]);

  // Extract structured API data
  const reportData = data?.data || data;
  const summary = reportData?.summary || {};
  const openingClosing = reportData?.openingClosingBalance || {};
  const stats = reportData?.statistics || {};
  const bankAccounts = Array.isArray(reportData?.bankAccounts) ? reportData.bankAccounts : [];
  const cashAccounts = Array.isArray(reportData?.cashAccounts) ? reportData.cashAccounts : [];
  const operatingActivities = reportData?.operatingActivities || { cashIn: [], cashOut: [], totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 };
  const investingActivities = reportData?.investingActivities || { cashIn: [], cashOut: [], totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 };
  const financingActivities = reportData?.financingActivities || { cashIn: [], cashOut: [], totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 };
  const relatedDocuments = reportData?.relatedDocuments || {};
  const auditInfo = reportData?.audit || null;

  // Use base currency directly from API response; fallback to company or USD
  const baseCurrency = (summary.baseCurrency || reportData?.baseCurrency || selectedCompany?.baseCurrency || 'USD').toUpperCase();

  // Transactions array strictly from API response
  const rawTransactions = useMemo(() => {
    if (!reportData) return [];
    if (Array.isArray(reportData.transactions)) {
      return reportData.transactions;
    }
    if (Array.isArray(reportData.rows)) {
      return reportData.rows;
    }
    return [];
  }, [reportData]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let list = rawTransactions.map((tx, idx) => ({
      id: tx.id || `tx-${idx}`,
      date: tx.date || tx.voucherDate || tx.transactionDate || '—',
      cashFlowCategory: tx.category || tx.cashFlowCategory || tx.type || 'Operating',
      accountCode: tx.accountCode || tx.code || '—',
      accountName: tx.accountName || tx.name || tx.description || '—',
      narration: tx.narration || tx.description || tx.notes || '—',
      cashIn: Number(tx.cashIn ?? tx.inflow ?? (tx.cashDirection === 'IN' ? tx.amount : 0) ?? tx.debit ?? 0),
      cashOut: Number(tx.cashOut ?? tx.outflow ?? (tx.cashDirection === 'OUT' ? tx.amount : 0) ?? tx.credit ?? 0),
      netCash: Number(tx.netCash ?? tx.netCashFlow ?? (Number(tx.cashIn || 0) - Number(tx.cashOut || 0))),
      status: tx.status || 'POSTED',
      reference: tx.reference || tx.referenceNo || tx.voucherNumber || '—'
    }));

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.accountName && String(r.accountName).toLowerCase().includes(q)) ||
          (r.accountCode && String(r.accountCode).toLowerCase().includes(q)) ||
          (r.cashFlowCategory && String(r.cashFlowCategory).toLowerCase().includes(q)) ||
          (r.narration && String(r.narration).toLowerCase().includes(q)) ||
          (r.reference && String(r.reference).toLowerCase().includes(q))
      );
    }

    if (filters.cashFlowType) {
      const type = filters.cashFlowType.toLowerCase();
      list = list.filter((r) => String(r.cashFlowCategory || '').toLowerCase().includes(type));
    }

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [rawTransactions, filters.search, filters.cashFlowType, sortConfig]);

  // Main Summary Cards values from API
  const openingCash = openingClosing.openingCashBalance != null
    ? openingClosing.openingCashBalance
    : (reportData?.openingCashBalance ?? 0);

  const totalInflow = openingClosing.totalCashInflow != null
    ? openingClosing.totalCashInflow
    : (reportData?.totalCashInflow ?? 0);

  const totalOutflow = openingClosing.totalCashOutflow != null
    ? openingClosing.totalCashOutflow
    : (reportData?.totalCashOutflow ?? 0);

  const closingCash = openingClosing.closingCashBalance != null
    ? openingClosing.closingCashBalance
    : (reportData?.closingCashBalance ?? (Number(openingCash) + Number(totalInflow) - Number(totalOutflow)));

  // Secondary Summary Cards values from API
  const netOperating = openingClosing.netOperatingCashFlow ?? stats.netOperatingCashFlow ?? reportData?.netOperatingCashFlow ?? 0;
  const netInvesting = openingClosing.netInvestingCashFlow ?? stats.netInvestingCashFlow ?? reportData?.netInvestingCashFlow ?? 0;
  const netFinancing = openingClosing.netFinancingCashFlow ?? stats.netFinancingCashFlow ?? reportData?.netFinancingCashFlow ?? 0;
  const netCash = openingClosing.netCashFlow ?? stats.netCashFlow ?? reportData?.netCashFlow ?? (Number(totalInflow) - Number(totalOutflow));
  const totalTxCount = openingClosing.totalTransactions ?? stats.totalTransactions ?? reportData?.totalTransactions ?? filteredTransactions.length;
  const prevNetCash = openingClosing.previousNetCashFlow ?? stats.previousNetCashFlow ?? reportData?.previousNetCashFlow ?? 0;
  const varianceAmt = openingClosing.varianceAmount ?? stats.varianceAmount ?? reportData?.varianceAmount ?? 0;
  const variancePct = openingClosing.variancePercentage ?? stats.variancePercentage ?? 0;

  const handleExport = async (type) => {
    const isExcel = type === 'excel';
    const exporter = isExcel ? cashFlowApi.exportCashFlowExcel : cashFlowApi.exportCashFlowPdf;
    const ext = isExcel ? 'xlsx' : 'pdf';

    try {
      const sDate = filters.fromDate || defaultDates.fromDate;
      const eDate = filters.toDate || defaultDates.toDate;

      const params = {
        companyId: effectiveCompanyId,
        startDate: sDate,
        endDate: eDate,
        fromDate: sDate,
        toDate: eDate,
        fiscalYearId: filters.fiscalYearId || undefined
      };

      const blob = await exporter(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-flow-statement-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export Cash Flow report');
    }
  };

  const totalElements = reportData?.pagination?.totalElements ?? filteredTransactions.length;
  const totalPages = reportData?.pagination?.totalPages || Math.max(1, Math.ceil(totalElements / (filters.pageSize || 50)));
  const pageZero = Math.max(0, filters.page || 0);
  const pageSize = filters.pageSize || 50;
  const { from, to } = getSerialNumberRange({ page: pageZero, pageSize, total: totalElements, pageBase: 0 });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-[#0F1117] text-zinc-900 dark:text-[#E6E8EE] font-sans antialiased">
      {/* 1. Page Header matching General Ledger */}
      <PageHeader
        title="Cash Flow Statement"
        description="Comprehensive enterprise statement for cash inflows, outflows, liquidity positions, and transaction audit trails."
        icon={Wallet}
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
            label: loading ? 'Generating...' : 'Generate Report',
            icon: RotateCcw,
            variant: 'primary',
            disabled: loading,
            onClick: () => fetchReport()
          }
        ]}
      />

      {/* 2. Common Enterprise Module Tabs */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Container with natural scrolling */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5 max-w-[1700px] w-full mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium shadow-2xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Reporting Entity & Audit Metadata Panel (Compact & Responsive) */}
        <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 mb-3 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-[#4F8CFF]" />
              <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                Reporting Entity &amp; Audit Metadata
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Statement
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Company Name</span>
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] truncate block text-sm" title={summary.companyName || selectedCompany?.name}>
                {summary.companyName || selectedCompany?.name || 'Enterprise Co.'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Base Currency</span>
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                  {baseCurrency}
                </span>
              </div>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Start Date</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono text-xs block">
                {formatDate(summary.startDate || filters.fromDate)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">End Date</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono text-xs block">
                {formatDate(summary.endDate || filters.toDate)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Generated At</span>
              <span className="font-medium text-zinc-600 dark:text-zinc-400 font-mono text-xs block">
                {summary.reportGeneratedAt ? formatDate(summary.reportGeneratedAt) : formatDate(new Date().toISOString())}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Generated By</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block text-xs">
                {summary.generatedBy || 'System'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Cash Flow Summary Cards (Primary 4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Opening Cash Balance */}
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-[#3A4154] transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                Opening Cash Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#1D212C] text-[#4F8CFF] flex items-center justify-center shrink-0 border border-blue-100 dark:border-[#2A2F3D]">
                <Landmark size={14} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#4F8CFF] tabular-nums font-mono block truncate">
                {formatMoney(openingCash, baseCurrency)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#6B7184] block">
              Balance at start of period
            </span>
          </div>

          {/* Card 2: Cash Inflow */}
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-[#3A4154] transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                Total Cash Inflow
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-[#1D212C] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-[#2A2F3D]">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono block truncate">
                {formatMoney(totalInflow, baseCurrency)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#6B7184] block">
              Total receipts across all activities
            </span>
          </div>

          {/* Card 3: Cash Outflow */}
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-[#3A4154] transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                Total Cash Outflow
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-[#1D212C] text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-[#2A2F3D]">
                <TrendingDown size={14} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums font-mono block truncate">
                {formatMoney(totalOutflow, baseCurrency)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#6B7184] block">
              Total disbursements &amp; payments
            </span>
          </div>

          {/* Card 4: Closing Cash Balance */}
          <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-[#3A4154] transition-all">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                Closing Cash Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#1D212C] text-[#4F8CFF] flex items-center justify-center shrink-0 border border-blue-100 dark:border-[#2A2F3D]">
                <Wallet size={14} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#4F8CFF] tabular-nums font-mono block truncate">
                {formatMoney(closingCash, baseCurrency)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#6B7184] block">
              Net liquid funds at end of period
            </span>
          </div>
        </div>

        {/* 5. Secondary KPI Cards (Row 2 - 8 Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Net Operating
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums font-mono mt-0.5 ${Number(netOperating) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(netOperating, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Net Investing
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums font-mono mt-0.5 ${Number(netInvesting) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(netInvesting, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Net Financing
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums font-mono mt-0.5 ${Number(netFinancing) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(netFinancing, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Net Cash Flow
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums font-mono mt-0.5 ${Number(netCash) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(netCash, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Transactions
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] truncate block tabular-nums mt-0.5">
              {totalTxCount}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Prev Net Cash
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 truncate block tabular-nums font-mono mt-0.5">
              {formatMoney(prevNetCash, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Variance Amt
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums font-mono mt-0.5 ${Number(varianceAmt) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(varianceAmt, baseCurrency)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block truncate">
              Variance %
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(variancePct) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {Number(variancePct) >= 0 ? `+${Number(variancePct).toFixed(1)}%` : `${Number(variancePct).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* 6. Main Unified Report Card Container */}
        <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xs overflow-hidden flex flex-col">
          {/* Section Navigation Tabs & Filter Bar Header */}
          <div className="border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/70 dark:bg-[#141720] px-4 pt-3 flex flex-wrap items-center justify-between gap-3">
            {/* View Sub-Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <span>Full Statement (All)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'accounts'
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <Landmark size={13} />
                <span>Bank &amp; Cash Accounts</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 font-bold">
                  {bankAccounts.length + cashAccounts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'activities'
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <Layers size={13} />
                <span>Activity Breakdown</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <FileText size={13} />
                <span>Transactions Table</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-bold">
                  {filteredTransactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'documents'
                    ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs border border-zinc-200 dark:border-[#2A2F3D]'
                    : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
                }`}
              >
                <BookOpen size={13} />
                <span>Audit &amp; Docs</span>
              </button>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-1.5 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={() => handleExport('excel')}
                className="h-8 px-2.5 text-[10.5px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1 shadow-2xs"
                title="Download Excel Spreadsheet"
              >
                <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="h-8 px-2.5 text-[10.5px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1 shadow-2xs"
                title="Download PDF Document"
              >
                <FileText size={13} className="text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <ColumnVisibilityToggle
                allColumns={ALL_COLUMNS.map((c) => ({ id: c.key, label: c.label }))}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                buttonClassName="h-8 px-2.5 text-[10.5px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1 shadow-2xs"
              />

              <button
                type="button"
                onClick={() => fetchReport()}
                disabled={loading}
                className="h-8 px-2.5 text-[10.5px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1 shadow-2xs"
                title="Refresh Statement Data"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-[#4F8CFF]' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Compact Filter Toolbar */}
          <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              {/* 1. Live Search */}
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  Search
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
                  <input
                    type="text"
                    placeholder="Search account, code, ref..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full h-9 pl-9 pr-8 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none transition-all"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('search', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Fiscal Year */}
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  Fiscal Year
                </label>
                <select
                  value={filters.fiscalYearId}
                  onChange={(e) => handleFilterChange('fiscalYearId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none transition-all cursor-pointer"
                >
                  {fiscalYearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Date From */}
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none transition-all"
                />
              </div>

              {/* 4. Date To */}
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none transition-all"
                />
              </div>

              {/* 5. Cash Flow Type + Advanced / Reset */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[8.8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                    Cash Flow Type
                  </label>
                  <select
                    value={filters.cashFlowType}
                    onChange={(e) => handleFilterChange('cashFlowType', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none transition-all cursor-pointer"
                  >
                    <option value="">All Cash Flow Types</option>
                    <option value="OPERATING">Operating Activities</option>
                    <option value="INVESTING">Investing Activities</option>
                    <option value="FINANCING">Financing Activities</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedFiltersOpen((prev) => !prev)}
                    className={`h-9 px-2.5 text-[10.5px] font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                      isAdvancedFiltersOpen || activeAdvancedCount > 0
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-[#1D212C] dark:border-[#4F8CFF] dark:text-[#4F8CFF]'
                        : 'bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5]'
                    }`}
                    title="Toggle Advanced Filters"
                  >
                    <Filter size={13} />
                    {activeAdvancedCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#4F8CFF] text-white text-[9px] font-bold flex items-center justify-center">
                        {activeAdvancedCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-9 px-2.5 text-[10.5px] font-semibold rounded-lg bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 hover:text-zinc-900 dark:hover:text-[#E6E8EE] transition-all flex items-center gap-1"
                    title="Reset All Filters"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Filters Drawer */}
            {isAdvancedFiltersOpen && (
              <div className="pt-3 border-t border-zinc-100 dark:border-[#2A2F3D] animate-in fade-in duration-150">
                <span className="text-[9.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider block mb-2">
                  Organizational &amp; Allocation Filters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-[#A0A6B5] mb-1 block">
                      Branch ID
                    </label>
                    <input
                      type="text"
                      placeholder="Branch ID..."
                      value={filters.branchId}
                      onChange={(e) => handleFilterChange('branchId', e.target.value)}
                      className="w-full h-8 px-2.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE]"
                    />
                  </div>
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-[#A0A6B5] mb-1 block">
                      Department ID
                    </label>
                    <input
                      type="text"
                      placeholder="Department ID..."
                      value={filters.departmentId}
                      onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                      className="w-full h-8 px-2.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: BANK & CASH ACCOUNTS SUMMARY SECTION */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'accounts') && (
            <div className="border-b border-zinc-200 dark:border-[#2A2F3D]">
              <div className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-[#141720] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark size={15} className="text-[#4F8CFF]" />
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                    Bank &amp; Cash Accounts Summary
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] ml-1">
                    {bankAccounts.length + cashAccounts.length} Accounts
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] hidden sm:inline">
                  Liquid Funds &amp; Bank Balances
                </span>
              </div>

              {bankAccounts.length === 0 && cashAccounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400 dark:text-[#6B7184] italic">
                  No bank or cash accounts found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-50/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center font-mono">#</th>
                        <th className="px-4 py-3 font-bold w-36 whitespace-nowrap">Account Code</th>
                        <th className="px-4 py-3 font-bold min-w-[200px]">Account Name</th>
                        <th className="px-4 py-3 text-right font-bold w-36 whitespace-nowrap">Opening Balance</th>
                        <th className="px-4 py-3 text-right font-bold w-36 whitespace-nowrap text-emerald-600 dark:text-emerald-400">Total Receipts</th>
                        <th className="px-4 py-3 text-right font-bold w-36 whitespace-nowrap text-rose-600 dark:text-rose-400">Total Payments</th>
                        <th className="px-4 py-3 text-right font-bold w-36 whitespace-nowrap text-[#4F8CFF]">Closing Balance</th>
                        <th className="px-4 py-3 text-center w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] font-medium">
                      {[...bankAccounts, ...cashAccounts].map((b, idx) => (
                        <tr key={b.accountId || b.accountCode || idx} className="hover:bg-zinc-50/80 dark:hover:bg-[#1D212C]/60 transition-colors">
                          <td className="px-4 py-3 text-center font-mono text-zinc-400 text-[11px]">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {b.accountCode || b.code || '—'}
                          </td>
                          <td className="px-4 py-3 text-zinc-800 dark:text-[#E6E8EE]">
                            <span className="font-semibold">{b.accountName || b.name || 'Unnamed Account'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-700 dark:text-[#E6E8EE]">
                            {formatMoney(b.openingBalance, baseCurrency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(b.totalReceipts ?? b.totalCashIn ?? 0, baseCurrency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                            {formatMoney(b.totalPayments ?? b.totalCashOut ?? 0, baseCurrency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-extrabold text-[#4F8CFF]">
                            {formatMoney(b.closingBalance, baseCurrency)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleAccountClick(b.accountId)}
                              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-[#1D212C] text-zinc-500 hover:text-[#4F8CFF] transition-colors"
                              title="View Account General Ledger"
                            >
                              <ExternalLink size={13} />
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

          {/* ========================================================================= */}
          {/* TAB 2: ACTIVITIES BREAKDOWN SECTION */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'activities') && (
            <div className="border-b border-zinc-200 dark:border-[#2A2F3D]">
              <div className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-[#141720] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-[#4F8CFF]" />
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                    Cash Flow Activities (Operating, Investing, Financing)
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] hidden sm:inline">
                  Inflows &amp; Outflows by Activity Class
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-[#2A2F3D]">
                {/* 1. Operating Activities */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4F8CFF]" />
                      Operating Activities
                    </span>
                    <span className={`text-xs font-bold tabular-nums font-mono ${Number(operatingActivities.netCashFlow) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatMoney(operatingActivities.netCashFlow, baseCurrency)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Cash In</span>
                      {operatingActivities.cashIn && operatingActivities.cashIn.length > 0 ? (
                        operatingActivities.cashIn.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Receipts'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash inflows</span>
                      )}
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">Cash Out</span>
                      {operatingActivities.cashOut && operatingActivities.cashOut.length > 0 ? (
                        operatingActivities.cashOut.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Disbursements'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash outflows</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Investing Activities */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Investing Activities
                    </span>
                    <span className={`text-xs font-bold tabular-nums font-mono ${Number(investingActivities.netCashFlow) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatMoney(investingActivities.netCashFlow, baseCurrency)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Cash In</span>
                      {investingActivities.cashIn && investingActivities.cashIn.length > 0 ? (
                        investingActivities.cashIn.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Asset Sales'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash inflows</span>
                      )}
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">Cash Out</span>
                      {investingActivities.cashOut && investingActivities.cashOut.length > 0 ? (
                        investingActivities.cashOut.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Asset Purchases'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash outflows</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Financing Activities */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Financing Activities
                    </span>
                    <span className={`text-xs font-bold tabular-nums font-mono ${Number(financingActivities.netCashFlow) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatMoney(financingActivities.netCashFlow, baseCurrency)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Cash In</span>
                      {financingActivities.cashIn && financingActivities.cashIn.length > 0 ? (
                        financingActivities.cashIn.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Capital Raised'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash inflows</span>
                      )}
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#141720] p-2.5 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">Cash Out</span>
                      {financingActivities.cashOut && financingActivities.cashOut.length > 0 ? (
                        financingActivities.cashOut.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 text-zinc-700 dark:text-zinc-300">
                            <span>{item.category || 'Debt Repayment'}</span>
                            <span className="font-mono font-semibold">{formatMoney(item.amount, baseCurrency)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px] italic">No cash outflows</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MAIN CASH FLOW TRANSACTIONS TABLE */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'transactions') && (
            <div>
              <div className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-[#141720] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#4F8CFF]" />
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                    Cash Flow Transactions
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] ml-1">
                    {filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] hidden sm:inline">
                  Detailed Journal &amp; Bank Voucher Records
                </span>
              </div>

              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-zinc-50/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] text-[10px] font-bold uppercase tracking-wider select-none">
                    <tr>
                      {visibleColumns.includes('rowIndex') && (
                        <th className="px-3.5 py-3 w-12 text-center font-mono">#</th>
                      )}
                      {visibleColumns.includes('date') && (
                        <th
                          className="px-4 py-3 cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Date</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'date' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('cashFlowCategory') && (
                        <th
                          className="px-4 py-3 cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('cashFlowCategory')}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Category</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'cashFlowCategory' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('accountCode') && (
                        <th
                          className="px-4 py-3 cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('accountCode')}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Account Code</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'accountCode' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('accountName') && (
                        <th
                          className="px-4 py-3 cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors min-w-[200px]"
                          onClick={() => handleSort('accountName')}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Account Name</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'accountName' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('narration') && (
                        <th className="px-4 py-3 min-w-[180px]">Narration</th>
                      )}
                      {visibleColumns.includes('cashIn') && (
                        <th
                          className="px-4 py-3 text-right cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('cashIn')}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400">Cash In</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'cashIn' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('cashOut') && (
                        <th
                          className="px-4 py-3 text-right cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('cashOut')}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-rose-600 dark:text-rose-400">Cash Out</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'cashOut' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('netCash') && (
                        <th
                          className="px-4 py-3 text-right cursor-pointer hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                          onClick={() => handleSort('netCash')}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>Net Cash</span>
                            <ArrowUpDown size={11} className={sortConfig.key === 'netCash' ? 'text-[#4F8CFF]' : 'text-zinc-400'} />
                          </div>
                        </th>
                      )}
                      {visibleColumns.includes('status') && (
                        <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                      )}
                      {visibleColumns.includes('reference') && (
                        <th className="px-4 py-3 whitespace-nowrap">Reference</th>
                      )}
                      {visibleColumns.includes('actions') && (
                        <th className="px-3.5 py-3 text-center w-14">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] font-medium">
                    {/* Skeleton Loading State */}
                    {loading && (
                      <>
                        {[...Array(6)].map((_, idx) => (
                          <tr key={`skeleton-${idx}`} className="animate-pulse">
                            <td colSpan={visibleColumns.length} className="px-4 py-3.5">
                              <div className="h-4 bg-zinc-100 dark:bg-[#1D212C] rounded w-full" />
                            </td>
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Accurate Empty State when no transactions returned */}
                    {!loading && filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-400 dark:text-[#A0A6B5] flex items-center justify-center">
                              <FileText size={22} />
                            </div>
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] mt-1">No cash flow transactions recorded</h4>
                            <p className="text-xs text-zinc-500 dark:text-[#6B7184] leading-relaxed">
                              There are 0 cash inflows or outflows recorded in this reporting period ({formatDate(summary.startDate || filters.fromDate)} – {formatDate(summary.endDate || filters.toDate)}).
                            </p>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-2 h-8 px-3 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-[#4C8DFF] text-white hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] transition-all shadow-2xs"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Transaction Rows */}
                    {!loading &&
                      filteredTransactions.map((row, idx) => {
                        const isExpanded = expandedRowId === row.id;
                        const cIn = Number(row.cashIn || 0);
                        const cOut = Number(row.cashOut || 0);
                        const net = Number(row.netCash || 0);
                        const isPos = net >= 0;

                        return (
                          <tr
                            key={row.id || `${row.accountCode}-${idx}`}
                            className={`hover:bg-zinc-50/80 dark:hover:bg-[#1D212C]/60 transition-colors ${
                              isExpanded ? 'bg-zinc-50 dark:bg-[#1D212C]/40' : ''
                            }`}
                          >
                            {visibleColumns.includes('rowIndex') && (
                              <td className="px-3.5 py-3 text-center text-zinc-400 font-mono text-[11px] tabular-nums">
                                {getSerialNumber({ page: filters.page, pageSize: filters.pageSize, rowIndex: idx, pageBase: 0 })}
                              </td>
                            )}

                            {visibleColumns.includes('date') && (
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-300 text-xs">
                                {formatDate(row.date)}
                              </td>
                            )}

                            {visibleColumns.includes('cashFlowCategory') && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                {getCategoryBadge(row.cashFlowCategory)}
                              </td>
                            )}

                            {visibleColumns.includes('accountCode') && (
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-300 text-xs font-medium">
                                {row.accountCode || '—'}
                              </td>
                            )}

                            {visibleColumns.includes('accountName') && (
                              <td className="px-4 py-3 min-w-[200px]">
                                <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE] block">{row.accountName || '—'}</span>
                              </td>
                            )}

                            {visibleColumns.includes('narration') && (
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 text-xs truncate max-w-[200px]" title={row.narration}>
                                {row.narration || '—'}
                              </td>
                            )}

                            {visibleColumns.includes('cashIn') && (
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                                {cIn > 0 ? (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(cIn, baseCurrency)}</span>
                                ) : (
                                  <span className="text-zinc-400 dark:text-[#6B7184]">—</span>
                                )}
                              </td>
                            )}

                            {visibleColumns.includes('cashOut') && (
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                                {cOut > 0 ? (
                                  <span className="font-bold text-rose-600 dark:text-rose-400">{formatMoney(cOut, baseCurrency)}</span>
                                ) : (
                                  <span className="text-zinc-400 dark:text-[#6B7184]">—</span>
                                )}
                              </td>
                            )}

                            {visibleColumns.includes('netCash') && (
                              <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                                <span className={`font-extrabold ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {formatMoney(net, baseCurrency)}
                                </span>
                              </td>
                            )}

                            {visibleColumns.includes('status') && (
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                {getStatusBadge(row.status)}
                              </td>
                            )}

                            {visibleColumns.includes('reference') && (
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-300 text-xs truncate max-w-[140px]">
                                {row.reference || '—'}
                              </td>
                            )}

                            {visibleColumns.includes('actions') && (
                              <td className="px-3.5 py-3 text-center w-14">
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId((prev) => (prev === row.id ? null : row.id))}
                                  aria-label="View Details"
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE]"
                                >
                                  <Eye size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/60 dark:bg-[#141720] flex flex-wrap items-center justify-between gap-3 text-xs">
                <p className="text-zinc-500 dark:text-[#A0A6B5] text-xs">
                  Showing <span className="font-bold text-zinc-800 dark:text-[#E6E8EE]">{from}</span>–
                  <span className="font-bold text-zinc-800 dark:text-[#E6E8EE]">{to}</span> of{' '}
                  <span className="font-bold text-zinc-800 dark:text-[#E6E8EE]">{totalElements.toLocaleString()}</span> entries
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] hidden sm:inline">Rows per page:</span>
                  <select
                    value={filters.pageSize}
                    onChange={(e) => handleFilterChange('pageSize', Number(e.target.value))}
                    className="h-8 px-2.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 dark:text-[#E6E8EE] outline-none cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] mr-2">
                    Page {pageZero + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('page', Math.max(0, pageZero - 1))}
                    disabled={pageZero === 0}
                    aria-label="Previous Page"
                    className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('page', Math.min(totalPages - 1, pageZero + 1))}
                    disabled={pageZero >= totalPages - 1}
                    aria-label="Next Page"
                    className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: RELATED DOCUMENTS & AUDIT SECTION */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'documents') && (
            <div>
              <div className="p-3.5 sm:p-4 bg-zinc-50/60 dark:bg-[#141720] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-[#4F8CFF]" />
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                    Related Vouchers &amp; Audit Trail
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-[#6B7184] hidden sm:inline">
                  Receipts, Payments &amp; Audit Log
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Receipt Vouchers */}
                <div className="bg-zinc-50 dark:bg-[#141720] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                  <div className="flex items-center gap-2 mb-1.5 text-zinc-800 dark:text-[#E6E8EE] font-semibold">
                    <Receipt size={14} className="text-emerald-600" />
                    <span>Receipt Vouchers</span>
                  </div>
                  <span className="text-sm font-bold font-mono">
                    {relatedDocuments.receiptVouchers?.length || 0} items
                  </span>
                </div>

                {/* Payment Vouchers */}
                <div className="bg-zinc-50 dark:bg-[#141720] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                  <div className="flex items-center gap-2 mb-1.5 text-zinc-800 dark:text-[#E6E8EE] font-semibold">
                    <CreditCard size={14} className="text-rose-600" />
                    <span>Payment Vouchers</span>
                  </div>
                  <span className="text-sm font-bold font-mono">
                    {relatedDocuments.paymentVouchers?.length || 0} items
                  </span>
                </div>

                {/* Journal Entries */}
                <div className="bg-zinc-50 dark:bg-[#141720] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                  <div className="flex items-center gap-2 mb-1.5 text-zinc-800 dark:text-[#E6E8EE] font-semibold">
                    <FileText size={14} className="text-[#4F8CFF]" />
                    <span>Journal Entries</span>
                  </div>
                  <span className="text-sm font-bold font-mono">
                    {relatedDocuments.journalEntries?.length || 0} items
                  </span>
                </div>

                {/* Audit Status */}
                <div className="bg-zinc-50 dark:bg-[#141720] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                  <div className="flex items-center gap-2 mb-1.5 text-zinc-800 dark:text-[#E6E8EE] font-semibold">
                    <ShieldCheck size={14} className="text-purple-600" />
                    <span>Audit Status</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {auditInfo ? 'Audit verified' : 'Audit trail not recorded'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 11. Subtle Enterprise Footer matching General Ledger */}
        <div className="pt-4 pb-2 border-t border-zinc-200 dark:border-[#2A2F3D] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-zinc-500 dark:text-[#6B7184]">
          <span>© {new Date().getFullYear()} CloudERP Systems • Cash Flow Statement</span>
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
        reportName="cash-flow"
        defaultFilters={Object.fromEntries(
          Object.entries(filters).filter(([k, v]) => v !== '' && v !== null && v !== undefined)
        )}
        onExportCustom={async ({ format, dateFrom, dateTo }) => {
          const isPdf = String(format).toUpperCase() === 'PDF';
          const exporter = isPdf ? cashFlowApi.exportCashFlowPdf : cashFlowApi.exportCashFlowExcel;
          const ext = isPdf ? 'pdf' : 'xlsx';

          const sDate = dateFrom || filters.fromDate || defaultDates.fromDate;
          const eDate = dateTo || filters.toDate || defaultDates.toDate;

          const params = {
            companyId: effectiveCompanyId,
            startDate: sDate,
            endDate: eDate,
            fromDate: sDate,
            toDate: eDate,
            fiscalYearId: filters.fiscalYearId || undefined
          };

          const blob = await exporter(params);
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `cash-flow-${Date.now()}.${ext}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        }}
      />
    </div>
  );
}
