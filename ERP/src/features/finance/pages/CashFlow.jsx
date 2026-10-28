import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Info,
  SlidersHorizontal,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { cashFlowApi } from '../../../api/account/reports';
import { fiscalYearsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import PageHeader from '../../../components/common/PageHeader';
import { getSerialNumber, getSerialNumberRange } from '../../../utils/serialNumberHelper';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import ColumnVisibilityToggle from '../../../components/common/ColumnVisibilityToggle';

/**
 * Currency formatter respecting dynamic baseCurrency from API
 */
const formatMoney = (amount, currencyCode = 'INR') => {
  const safeAmount = amount === null || amount === undefined || isNaN(Number(amount)) ? 0 : Number(amount);
  
  if (!currencyCode || currencyCode === 'null' || currencyCode === 'undefined' || String(currencyCode).trim() === '') {
    currencyCode = 'INR';
  } else {
    currencyCode = String(currencyCode).trim().toUpperCase();
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeAmount);
  } catch {
    return `${currencyCode} ${safeAmount.toFixed(2)}`;
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
 * POSTED displayed as a crisp enterprise green pill
 */
const getStatusBadge = (status) => {
  const s = status ? status.toString().toUpperCase() : 'POSTED';
  if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#22C997]/10 text-[#22C997] border border-[#22C997]/30">
        {status || 'POSTED'}
      </span>
    );
  }
  if (s === 'DRAFT' || s === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
        {status}
      </span>
    );
  }
  if (s === 'CANCELLED' || s === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#FF647C]/10 text-[#FF647C] border border-[#FF647C]/30">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/30">
      {status}
    </span>
  );
};

/**
 * Category Badge with subtle tonal styling
 */
const getCategoryBadge = (category) => {
  const cat = String(category || 'General');
  const lower = cat.toLowerCase();
  if (lower.includes('operating')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/20">
        {cat}
      </span>
    );
  }
  if (lower.includes('investing')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
        {cat}
      </span>
    );
  }
  if (lower.includes('financing')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
        {cat}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#1E2333] text-zinc-300 border border-[#2A3040]">
      {cat}
    </span>
  );
};

/**
 * Expandable Row Component for Cash Flow Records (Line Details)
 */
const CashFlowRowDetails = ({ row, currency }) => {
  return (
    <div className="p-4 bg-[#12151D] border-t border-[#2A3040] animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-[#171A23] rounded-xl border border-[#2A3040] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#2A3040]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center">
              <Wallet size={13} />
            </div>
            <h4 className="text-xs font-bold text-[#E6E8EE] uppercase tracking-wider">
              Line Detail: {row.accountName}
            </h4>
          </div>
          <span className="text-[11px] text-[#9DA4B4] font-mono px-2 py-0.5 rounded bg-[#12151D] border border-[#2A3040]">
            {row.accountCode || '—'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#6B7280] block text-[9.5px] uppercase font-bold tracking-wider">Category</span>
            <div className="mt-1">{getCategoryBadge(row.cashFlowCategory)}</div>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[9.5px] uppercase font-bold tracking-wider">Status</span>
            <div className="mt-1">{getStatusBadge(row.status)}</div>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[9.5px] uppercase font-bold tracking-wider">Reference</span>
            <span className="font-mono text-[#E6E8EE] mt-1 block font-medium">{row.reference || '—'}</span>
          </div>
          <div>
            <span className="text-[#6B7280] block text-[9.5px] uppercase font-bold tracking-wider">Net Cash Flow</span>
            <span className={`font-mono text-sm font-extrabold mt-0.5 block ${Number(row.netCash) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(row.netCash, currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-[#2A3040] text-xs">
          <div className="bg-[#22C997]/5 p-3 rounded-lg border border-[#22C997]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#22C997]/15 text-[#22C997] flex items-center justify-center">
                <ArrowDownLeft size={12} />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#22C997] tracking-wider">Cash Inflow</span>
            </div>
            <span className="font-mono text-sm font-extrabold text-[#22C997]">{formatMoney(row.cashIn, currency)}</span>
          </div>
          <div className="bg-[#FF647C]/5 p-3 rounded-lg border border-[#FF647C]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#FF647C]/15 text-[#FF647C] flex items-center justify-center">
                <ArrowUpRight size={12} />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#FF647C] tracking-wider">Cash Outflow</span>
            </div>
            <span className="font-mono text-sm font-extrabold text-[#FF647C]">{formatMoney(row.cashOut, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CashFlow() {
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);

  const fallbackCompanyId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode || '';
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

  const initialFilters = useMemo(() => ({
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
  }), [selectedCompany, fallbackCompanyId, defaultDates]);

  const [filters, setFilters] = useState(initialFilters);

  // Column definitions for visibility toggle
  const ALL_COLUMNS = useMemo(() => [
    { key: 'rowIndex', label: '#' },
    { key: 'cashFlowCategory', label: 'Cash Flow Category' },
    { key: 'accountCode', label: 'Account Code' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'cashIn', label: 'Cash In' },
    { key: 'cashOut', label: 'Cash Out' },
    { key: 'netCash', label: 'Net Cash' },
    { key: 'status', label: 'Status' },
    { key: 'reference', label: 'Reference' },
    { key: 'actions', label: 'Actions' }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    'rowIndex',
    'cashFlowCategory',
    'accountCode',
    'accountName',
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
    const raw = fiscalYearsResponse?.data?.data || fiscalYearsResponse?.data?.content || fiscalYearsResponse?.data || [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
    return [
      { value: '', label: 'All Fiscal Years' },
      ...list.map((fy) => ({
        value: fy.id,
        label: fy.name || fy.fiscalYear || `${fy.startDate?.split('-')[0] || ''} - ${fy.endDate?.split('-')[0] || ''}`,
        startDate: fy.startDate,
        endDate: fy.endDate
      }))
    ];
  }, [fiscalYearsResponse]);

  // Fetch report data
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
      const errorMsg = err?.response?.data?.message || err?.response?.data?.data?.startDate || err?.response?.data?.data?.endDate || err?.message || 'An error occurred while fetching the Cash Flow Statement';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCompany, fallbackCompanyId, defaultDates]);

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchReport();
    }
  }, [effectiveCompanyId, filters.fromDate, filters.toDate, filters.fiscalYearId, filters.cashFlowType, filters.page, filters.pageSize]);

  useEffect(() => {
    if (selectedCompany?.id && filters.companyId !== selectedCompany.id) {
      setFilters(prev => ({ ...prev, companyId: selectedCompany.id, page: 0 }));
    }
  }, [selectedCompany]);

  const handleFilterChange = (name, value) => {
    if (name === 'fiscalYearId') {
      const selectedFy = fiscalYearOptions.find(o => o.value === value);
      if (selectedFy?.startDate && selectedFy?.endDate) {
        setFilters(prev => ({
          ...prev,
          fiscalYearId: value,
          fromDate: selectedFy.startDate.split('T')[0],
          toDate: selectedFy.endDate.split('T')[0],
          page: 0
        }));
        return;
      }
    }
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
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
  };

  const toggleRow = (id) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
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

  let baseCurrency = selectedCompany?.baseCurrency;
  if (!baseCurrency || baseCurrency === 'null' || baseCurrency === 'undefined' || String(baseCurrency).trim() === '') {
    baseCurrency = 'INR';
  } else {
    baseCurrency = String(baseCurrency).trim().toUpperCase();
  }

  // Extract rows dynamically from API
  const rawRows = useMemo(() => {
    if (!reportData) return [];
    if (Array.isArray(reportData.rows) && reportData.rows.length > 0) {
      return reportData.rows;
    }
    if (Array.isArray(reportData.transactions) && reportData.transactions.length > 0) {
      return reportData.transactions.map((tx, idx) => ({
        id: tx.id || `tx-${idx}`,
        cashFlowCategory: tx.category || tx.cashFlowCategory || 'Transaction',
        accountCode: tx.accountCode || tx.code || '—',
        accountName: tx.accountName || tx.name || tx.description || '—',
        cashIn: Number(tx.cashIn ?? tx.inflow ?? (tx.cashDirection === 'IN' ? tx.amount : 0) ?? tx.debit ?? 0),
        cashOut: Number(tx.cashOut ?? tx.outflow ?? (tx.cashDirection === 'OUT' ? tx.amount : 0) ?? tx.credit ?? 0),
        netCash: Number(tx.netCash ?? tx.netCashFlow ?? (Number(tx.cashIn || 0) - Number(tx.cashOut || 0))),
        status: tx.status || 'POSTED',
        reference: tx.reference || tx.referenceNo || tx.voucherNumber || '—'
      }));
    }

    const list = [];
    const pushCategory = (items, categoryTitle) => {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const cIn = Number(item.cashIn ?? item.inflow ?? item.totalCashIn ?? 0);
          const cOut = Number(item.cashOut ?? item.outflow ?? item.totalCashOut ?? 0);
          const net = item.netCash != null ? Number(item.netCash) : (cIn - cOut);

          list.push({
            id: item.id || item.accountId || `${categoryTitle}-${idx}`,
            cashFlowCategory: item.cashFlowCategory || item.category || categoryTitle,
            accountCode: item.accountCode || item.code || '—',
            accountName: item.accountName || item.name || item.description || '—',
            cashIn: cIn,
            cashOut: cOut,
            netCash: net,
            status: item.status || 'POSTED',
            reference: item.reference || item.referenceNo || item.voucherNumber || '—'
          });
        });
      }
    };

    pushCategory(reportData?.operatingActivities?.cashIn, 'Operating Cash In');
    pushCategory(reportData?.operatingActivities?.cashOut, 'Operating Cash Out');
    pushCategory(reportData?.operatingActivities?.items || reportData?.operatingActivities?.rows, 'Operating Activities');

    pushCategory(reportData?.investingActivities?.cashIn, 'Investing Cash In');
    pushCategory(reportData?.investingActivities?.cashOut, 'Investing Cash Out');
    pushCategory(reportData?.investingActivities?.items || reportData?.investingActivities?.rows, 'Investing Activities');

    pushCategory(reportData?.financingActivities?.cashIn, 'Financing Cash In');
    pushCategory(reportData?.financingActivities?.cashOut, 'Financing Cash Out');
    pushCategory(reportData?.financingActivities?.items || reportData?.financingActivities?.rows, 'Financing Activities');

    pushCategory(reportData?.cashAccounts, 'Cash Account');
    pushCategory(reportData?.bankAccounts, 'Bank Account');

    return list;
  }, [reportData]);

  // Client-side search and sorting support
  const tableRows = useMemo(() => {
    let rows = [...rawRows];

    // Client-side search filtering (responsive real-time search)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter(r =>
        (r.accountName && String(r.accountName).toLowerCase().includes(q)) ||
        (r.accountCode && String(r.accountCode).toLowerCase().includes(q)) ||
        (r.cashFlowCategory && String(r.cashFlowCategory).toLowerCase().includes(q)) ||
        (r.reference && String(r.reference).toLowerCase().includes(q))
      );
    }

    // Cash flow type client filter
    if (filters.cashFlowType) {
      const type = filters.cashFlowType.toLowerCase();
      rows = rows.filter(r => String(r.cashFlowCategory || '').toLowerCase().includes(type));
    }

    // Sorting
    if (sortConfig.key) {
      rows.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [rawRows, filters.search, filters.cashFlowType, sortConfig]);

  // Main Summary Cards values
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

  // Secondary Summary Cards values
  const netOperating = stats.netOperatingCashFlow ?? reportData?.netOperatingCashFlow ?? 0;
  const netInvesting = stats.netInvestingCashFlow ?? reportData?.netInvestingCashFlow ?? 0;
  const netFinancing = stats.netFinancingCashFlow ?? reportData?.netFinancingCashFlow ?? 0;
  const netCash = stats.netCashFlow ?? reportData?.netCashFlow ?? (Number(totalInflow) - Number(totalOutflow));
  const totalTxCount = stats.totalTransactions ?? reportData?.totalTransactions ?? tableRows.length;
  const prevNetCash = stats.previousNetCashFlow ?? reportData?.previousNetCashFlow ?? 0;
  const varianceAmt = stats.varianceAmount ?? reportData?.varianceAmount ?? (Number(netCash) - Number(prevNetCash));
  const variancePct = stats.variancePercentage != null
    ? stats.variancePercentage
    : (prevNetCash !== 0 ? ((varianceAmt / Math.abs(prevNetCash)) * 100) : 0);

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

  const totalElements = reportData?.pagination?.totalElements ?? tableRows.length;
  const totalPages = reportData?.pagination?.totalPages || Math.max(1, Math.ceil(totalElements / (filters.pageSize || 50)));
  const pageZero = Math.max(0, filters.page || 0);
  const pageSize = filters.pageSize || 50;
  const { from, to } = getSerialNumberRange({ page: pageZero, pageSize, total: totalElements, pageBase: 0 });

  return (
    <div className="flex flex-col h-full bg-[#0F1117] text-[#E6E8EE] min-h-screen">
      {/* 1. Page Header */}
      <PageHeader
        title="Cash Flow Statement"
        description="Comprehensive enterprise dashboard for cash inflows, outflows, liquidity positions, and transaction audit trails."
        icon={Wallet}
        actionButtons={[
          {
            key: 'export',
            label: 'Export',
            icon: Download,
            variant: 'outline',
            onClick: () => setIsExportModalOpen(true)
          },
          {
            key: 'print',
            label: 'Print',
            icon: Printer,
            variant: 'outline',
            onClick: () => window.print()
          },
          {
            key: 'excel',
            label: 'Export Excel',
            icon: FileSpreadsheet,
            variant: 'outline',
            onClick: () => handleExport('excel')
          },
          {
            key: 'pdf',
            label: 'Export PDF',
            icon: FileText,
            variant: 'outline',
            onClick: () => handleExport('pdf')
          }
        ]}
      />

      {/* 2. Module Navigation Tabs */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-[#FF647C]/10 border border-[#FF647C]/30 text-[#FF647C] px-4 py-3 rounded-xl text-sm font-medium shadow-sm animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Reporting Entity & Audit Metadata Panel */}
        <div className="bg-[#171A23] rounded-xl border border-[#2A3040] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#2A3040]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center">
                <Building2 size={15} />
              </div>
              <h3 className="text-xs font-bold text-[#E6E8EE] uppercase tracking-wider">
                Reporting Entity &amp; Audit Metadata
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-[#22C997]/10 text-[#22C997] border border-[#22C997]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C997] animate-pulse" />
                Live Statement
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">Company Name</span>
              <span className="font-bold text-[#E6E8EE] truncate block text-sm" title={summary.companyName || selectedCompany?.name}>
                {summary.companyName || selectedCompany?.name || '—'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">Base Currency</span>
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30">
                  {baseCurrency}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">Start Date</span>
              <span className="font-semibold text-zinc-300 font-mono text-sm block">
                {formatDate(summary.startDate || filters.fromDate)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">End Date</span>
              <span className="font-semibold text-zinc-300 font-mono text-sm block">
                {formatDate(summary.endDate || filters.toDate)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">Generated At</span>
              <span className="font-medium text-zinc-400 font-mono text-xs block">
                {summary.reportGeneratedAt ? formatDate(summary.reportGeneratedAt) : formatDate(new Date().toISOString())}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold tracking-wider">Generated By</span>
              <span className="font-medium text-zinc-300 truncate block text-xs">
                {summary.generatedBy || 'SYSTEM'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Main Financial Summary Cards (Primary 4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Opening Cash Balance */}
          <div className="bg-[#171A23] p-5 rounded-xl border border-[#2A3040] shadow-sm flex flex-col justify-between hover:border-[#3A4154] transition-all min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Opening Cash Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center shrink-0">
                <Landmark size={15} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#4F8CFF] tabular-nums tracking-tight block truncate">
                {formatMoney(openingCash, baseCurrency)}
              </span>
            </div>
            <span className="text-[11px] text-[#9DA4B4] mt-1 block">
              Balance at start of period
            </span>
          </div>

          {/* Card 2: Cash Inflow */}
          <div className="bg-[#171A23] p-5 rounded-xl border border-[#2A3040] shadow-sm flex flex-col justify-between hover:border-[#3A4154] transition-all min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Cash Inflow
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#22C997]/10 text-[#22C997] flex items-center justify-center shrink-0">
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#22C997] tabular-nums tracking-tight block truncate">
                {formatMoney(totalInflow, baseCurrency)}
              </span>
            </div>
            <span className="text-[11px] text-[#9DA4B4] mt-1 block">
              Total receipts across all activities
            </span>
          </div>

          {/* Card 3: Cash Outflow */}
          <div className="bg-[#171A23] p-5 rounded-xl border border-[#2A3040] shadow-sm flex flex-col justify-between hover:border-[#3A4154] transition-all min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Cash Outflow
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#FF647C]/10 text-[#FF647C] flex items-center justify-center shrink-0">
                <TrendingDown size={15} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FF647C] tabular-nums tracking-tight block truncate">
                {formatMoney(totalOutflow, baseCurrency)}
              </span>
            </div>
            <span className="text-[11px] text-[#9DA4B4] mt-1 block">
              Total disbursements &amp; payments
            </span>
          </div>

          {/* Card 4: Closing Cash Balance */}
          <div className="bg-[#171A23] p-5 rounded-xl border border-[#2A3040] shadow-sm flex flex-col justify-between hover:border-[#3A4154] transition-all min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Closing Cash Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center shrink-0">
                <Wallet size={15} />
              </div>
            </div>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#4F8CFF] tabular-nums tracking-tight block truncate">
                {formatMoney(closingCash, baseCurrency)}
              </span>
            </div>
            <span className="text-[11px] text-[#9DA4B4] mt-1 block">
              Net liquid funds at end of period
            </span>
          </div>
        </div>

        {/* 5. Secondary Summary KPI Cards (Row 2 - 8 Responsive Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {/* 1. Net Operating */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Operating Cash Flow">
              Net Operating
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(netOperating) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(netOperating, baseCurrency)}
            </span>
          </div>

          {/* 2. Net Investing */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Investing Cash Flow">
              Net Investing
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(netInvesting) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(netInvesting, baseCurrency)}
            </span>
          </div>

          {/* 3. Net Financing */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Financing Cash Flow">
              Net Financing
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(netFinancing) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(netFinancing, baseCurrency)}
            </span>
          </div>

          {/* 4. Net Cash Flow */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Total Cash Flow">
              Net Cash Flow
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(netCash) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(netCash, baseCurrency)}
            </span>
          </div>

          {/* 5. Transactions */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Total Transactions Count">
              Transactions
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#E6E8EE] truncate block tabular-nums mt-1">
              {totalTxCount}
            </span>
          </div>

          {/* 6. Prev Net Cash */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Previous Net Cash Flow">
              Prev Net Cash
            </span>
            <span className="text-sm sm:text-base font-extrabold text-zinc-300 truncate block tabular-nums mt-1">
              {formatMoney(prevNetCash, baseCurrency)}
            </span>
          </div>

          {/* 7. Variance Amount */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Variance Amount (Current vs Previous)">
              Variance Amt
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(varianceAmt) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {formatMoney(varianceAmt, baseCurrency)}
            </span>
          </div>

          {/* 8. Variance % */}
          <div className="bg-[#171A23] p-3.5 rounded-xl border border-[#2A3040] shadow-sm min-w-0 flex flex-col justify-between hover:border-[#3A4154] transition-colors">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Variance Percentage">
              Variance %
            </span>
            <span className={`text-sm sm:text-base font-extrabold truncate block tabular-nums mt-1 ${Number(variancePct) >= 0 ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
              {Number(variancePct) >= 0 ? `+${Number(variancePct).toFixed(1)}%` : `${Number(variancePct).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* 6. Bank Accounts Section (if present in API response) */}
        {bankAccounts.length > 0 && (
          <div className="bg-[#171A23] rounded-xl border border-[#2A3040] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#141720] border-b border-[#2A3040] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center">
                  <Landmark size={14} />
                </div>
                <h4 className="text-xs font-bold text-[#E6E8EE] uppercase tracking-wider">
                  Bank &amp; Cash Accounts Summary
                </h4>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1D212C] text-[#9DA4B4] border border-[#2A3040]">
                {bankAccounts.length} Accounts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1A1E29] border-b border-[#2A3040] text-zinc-400 font-bold uppercase text-[9.5px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Account Name</th>
                    <th className="px-4 py-3 font-bold">Code</th>
                    <th className="px-4 py-3 text-right font-bold">Opening Balance</th>
                    <th className="px-4 py-3 text-right font-bold text-[#22C997]">Total Receipts</th>
                    <th className="px-4 py-3 text-right font-bold text-[#FF647C]">Total Payments</th>
                    <th className="px-4 py-3 text-right font-bold text-[#4F8CFF]">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3040]/70 font-medium">
                  {bankAccounts.map((b, idx) => (
                    <tr key={b.id || b.accountCode || idx} className="hover:bg-[#1E2333]/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#E6E8EE]">{b.accountName || b.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{b.accountCode || b.code || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-300">{formatMoney(b.openingBalance, baseCurrency)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#22C997]">{formatMoney(b.totalReceipts ?? b.totalCashIn, baseCurrency)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#FF647C]">{formatMoney(b.totalPayments ?? b.totalCashOut, baseCurrency)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#4F8CFF]">{formatMoney(b.closingBalance, baseCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Search & Filter Panel (Redesigned & Distinct) */}
        <div className="bg-[#171A23] rounded-xl border border-[#2A3040] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2A3040]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center">
                <SlidersHorizontal size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#E6E8EE] uppercase tracking-wider">
                  Search &amp; Period Filters
                </h4>
                <p className="text-[10px] text-[#9DA4B4]">Filter records by account, date range, or activity type</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdvancedFiltersOpen(prev => !prev)}
                className={`h-8 px-3 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                  isAdvancedFiltersOpen || activeAdvancedCount > 0
                    ? 'bg-[#4F8CFF]/15 border-[#4F8CFF] text-[#4F8CFF]'
                    : 'bg-[#12151D] border-[#2A3040] text-zinc-300 hover:bg-[#1E2333] hover:text-[#E6E8EE]'
                }`}
                title="Toggle Advanced Allocation Filters"
              >
                <Filter size={13} />
                <span>Advanced</span>
                {activeAdvancedCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#4F8CFF] text-white text-[9px] font-bold flex items-center justify-center">
                    {activeAdvancedCount}
                  </span>
                )}
                {isAdvancedFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-3 text-[11px] font-semibold rounded-lg bg-[#12151D] border border-[#2A3040] text-zinc-400 hover:text-[#E6E8EE] hover:bg-[#1E2333] transition-all flex items-center gap-1.5"
                title="Reset All Filters to Default"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Primary Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Search
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search account, code, category..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] placeholder-zinc-500 focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Fiscal Year */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Fiscal Year
              </label>
              <select
                value={filters.fiscalYearId}
                onChange={(e) => handleFilterChange('fiscalYearId', e.target.value)}
                className="w-full h-9 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all cursor-pointer"
              >
                {fiscalYearOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#171A23] text-[#E6E8EE]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date From */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Date From
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full h-9 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all"
              />
            </div>

            {/* 4. Date To */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Date To
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full h-9 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all"
              />
            </div>

            {/* 5. Cash Flow Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Cash Flow Type
              </label>
              <select
                value={filters.cashFlowType}
                onChange={(e) => handleFilterChange('cashFlowType', e.target.value)}
                className="w-full h-9 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all cursor-pointer"
              >
                <option value="" className="bg-[#171A23] text-[#E6E8EE]">All Cash Flow Types</option>
                <option value="OPERATING" className="bg-[#171A23] text-[#E6E8EE]">Operating Activities</option>
                <option value="INVESTING" className="bg-[#171A23] text-[#E6E8EE]">Investing Activities</option>
                <option value="FINANCING" className="bg-[#171A23] text-[#E6E8EE]">Financing Activities</option>
              </select>
            </div>
          </div>

          {/* Expandable Advanced Filters Drawer */}
          {isAdvancedFiltersOpen && (
            <div className="pt-3 border-t border-[#2A3040] animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
                Organizational &amp; Allocation Filters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block">Branch ID</label>
                  <input
                    type="text"
                    placeholder="Filter by Branch ID..."
                    value={filters.branchId}
                    onChange={(e) => handleFilterChange('branchId', e.target.value)}
                    className="w-full h-8 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] placeholder-zinc-600 focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block">Department ID</label>
                  <input
                    type="text"
                    placeholder="Filter by Department ID..."
                    value={filters.departmentId}
                    onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                    className="w-full h-8 px-3 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] placeholder-zinc-600 focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 8. Action Toolbar (Directly above Data Table) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#E6E8EE] uppercase tracking-wider">
              Cash Flow Statement Table
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#171A23] text-[#9DA4B4] border border-[#2A3040]">
              {tableRows.length} {tableRows.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="h-8 px-3 text-[11px] font-semibold text-[#E6E8EE] bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:border-[#3A4154] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Open Export Modal"
            >
              <Download size={13} className="text-[#4F8CFF]" />
              <span>Export</span>
            </button>

            {/* Direct Export Excel */}
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="h-8 px-2.5 text-[11px] font-semibold text-zinc-300 bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:text-[#22C997] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet size={13} className="text-[#22C997]" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Direct Export PDF */}
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="h-8 px-2.5 text-[11px] font-semibold text-zinc-300 bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:text-[#FF647C] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download PDF Document (.pdf)"
            >
              <FileText size={13} className="text-[#FF647C]" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Columns Visibility Toggle */}
            <ColumnVisibilityToggle
              columns={ALL_COLUMNS}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              buttonClassName="h-8 px-2.5 text-[11px] font-semibold text-zinc-300 bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:text-[#E6E8EE] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            />

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchReport()}
              disabled={loading}
              className="h-8 px-2.5 text-[11px] font-semibold text-zinc-300 bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:text-[#4F8CFF] transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh Statement Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[#4F8CFF]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-2.5 text-[11px] font-semibold text-zinc-300 bg-[#171A23] border border-[#2A3040] rounded-lg hover:bg-[#1E2333] hover:text-[#E6E8EE] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Print Cash Flow Report"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* 9. Cash Flow Data Table (Enterprise Redesign) */}
        <div className="bg-[#171A23] rounded-xl border border-[#2A3040] shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#141720] border-b border-[#2A3040] text-zinc-400 font-bold uppercase text-[9.5px] tracking-wider select-none sticky top-0 z-10">
                <tr>
                  {visibleColumns.includes('rowIndex') && (
                    <th className="px-3.5 py-3 w-12 text-center font-mono">#</th>
                  )}
                  {visibleColumns.includes('cashFlowCategory') && (
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                      onClick={() => handleSort('cashFlowCategory')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Cash Flow Category</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'cashFlowCategory' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.includes('accountCode') && (
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                      onClick={() => handleSort('accountCode')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Account Code</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'accountCode' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.includes('accountName') && (
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-[#E6E8EE] transition-colors min-w-[200px]"
                      onClick={() => handleSort('accountName')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Account Name</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'accountName' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.includes('cashIn') && (
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                      onClick={() => handleSort('cashIn')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[#22C997]">Cash In</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'cashIn' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.includes('cashOut') && (
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                      onClick={() => handleSort('cashOut')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[#FF647C]">Cash Out</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'cashOut' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.includes('netCash') && (
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-[#E6E8EE] transition-colors whitespace-nowrap"
                      onClick={() => handleSort('netCash')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Net Cash</span>
                        <ArrowUpDown size={11} className={sortConfig.key === 'netCash' ? 'text-[#4F8CFF]' : 'text-zinc-600'} />
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

              <tbody className="divide-y divide-[#2A3040]/70 font-medium">
                {/* Loading Skeleton */}
                {loading && (
                  <>
                    {[...Array(6)].map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td colSpan={visibleColumns.length} className="px-4 py-3.5">
                          <div className="h-4 bg-[#1E2333] rounded w-full" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Empty State */}
                {!loading && tableRows.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-[#12151D] border border-[#2A3040] text-zinc-500 flex items-center justify-center">
                          <Layers size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-[#E6E8EE] mt-1">No cash flow records found</h4>
                        <p className="text-xs text-[#9DA4B4] leading-relaxed">
                          Try selecting a different date range or fiscal year, or click Reset Filters to view all default entries.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 h-8 px-3 text-xs font-semibold rounded-lg bg-[#4F8CFF] text-white hover:bg-[#3D7AEA] transition-all"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data Rows */}
                {!loading && tableRows.map((row, idx) => {
                  const isExpanded = expandedRowId === row.id;
                  const cIn = Number(row.cashIn || 0);
                  const cOut = Number(row.cashOut || 0);
                  const net = Number(row.netCash || 0);
                  const isPos = net >= 0;

                  return (
                    <React.Fragment key={row.id || `${row.accountCode}-${idx}`}>
                      <tr
                        onClick={() => toggleRow(row.id)}
                        className={`hover:bg-[#1E2333]/60 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#1E2333]/40' : ''
                        }`}
                      >
                        {/* 1. Row Index */}
                        {visibleColumns.includes('rowIndex') && (
                          <td className="px-3.5 py-3 text-center text-zinc-500 font-mono text-[11px] tabular-nums">
                            {getSerialNumber({ page: filters.page, pageSize: filters.pageSize, rowIndex: idx, pageBase: 0 })}
                          </td>
                        )}

                        {/* 2. Cash Flow Category */}
                        {visibleColumns.includes('cashFlowCategory') && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getCategoryBadge(row.cashFlowCategory)}
                          </td>
                        )}

                        {/* 3. Account Code */}
                        {visibleColumns.includes('accountCode') && (
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-400 text-xs font-medium">
                            {row.accountCode || '—'}
                          </td>
                        )}

                        {/* 4. Account Name */}
                        {visibleColumns.includes('accountName') && (
                          <td className="px-4 py-3 min-w-[200px]">
                            <span className="font-semibold text-[#E6E8EE] block">{row.accountName || '—'}</span>
                          </td>
                        )}

                        {/* 5. Cash In */}
                        {visibleColumns.includes('cashIn') && (
                          <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                            {cIn > 0 ? (
                              <span className="font-bold text-[#22C997]">{formatMoney(cIn, baseCurrency)}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        )}

                        {/* 6. Cash Out */}
                        {visibleColumns.includes('cashOut') && (
                          <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                            {cOut > 0 ? (
                              <span className="font-bold text-[#FF647C]">{formatMoney(cOut, baseCurrency)}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        )}

                        {/* 7. Net Cash */}
                        {visibleColumns.includes('netCash') && (
                          <td className="px-4 py-3 text-right whitespace-nowrap font-mono tabular-nums">
                            <span className={`font-extrabold ${isPos ? 'text-[#22C997]' : 'text-[#FF647C]'}`}>
                              {formatMoney(net, baseCurrency)}
                            </span>
                          </td>
                        )}

                        {/* 8. Status */}
                        {visibleColumns.includes('status') && (
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {getStatusBadge(row.status)}
                          </td>
                        )}

                        {/* 9. Reference */}
                        {visibleColumns.includes('reference') && (
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-zinc-400 text-xs truncate max-w-[140px]">
                            {row.reference || '—'}
                          </td>
                        )}

                        {/* 10. Actions */}
                        {visibleColumns.includes('actions') && (
                          <td className="px-3.5 py-3 text-center w-14" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleRow(row.id)}
                              aria-label={`View line details for ${row.accountName}`}
                              title="View Line Details"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#4F8CFF] hover:bg-[#4F8CFF]/10 transition-colors border border-transparent hover:border-[#4F8CFF]/20 focus:outline-none focus:ring-1 focus:ring-[#4F8CFF]"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={visibleColumns.length} className="p-0 border-0">
                            <CashFlowRowDetails row={row} currency={baseCurrency} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 10. Table Pagination Bar (Responsive) */}
          <div className="px-4 py-3 border-t border-[#2A3040] bg-[#141720] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Record count left */}
            <p className="text-zinc-400 text-xs">
              Showing <span className="font-bold text-[#E6E8EE]">{from}</span>–<span className="font-bold text-[#E6E8EE]">{to}</span> of{' '}
              <span className="font-bold text-[#E6E8EE]">{totalElements.toLocaleString()}</span> entries
            </p>

            {/* Middle: Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Rows per page:</span>
              <select
                value={filters.pageSize}
                onChange={(e) => handleFilterChange('pageSize', Number(e.target.value))}
                className="h-8 px-2.5 bg-[#12151D] border border-[#2A3040] rounded-lg text-xs text-[#E6E8EE] focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] outline-none cursor-pointer"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size} className="bg-[#171A23] text-[#E6E8EE]">
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Right: Pagination Controls */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400 mr-2">
                Page {pageZero + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange('page', Math.max(0, pageZero - 1))}
                disabled={pageZero === 0}
                aria-label="Previous Page"
                className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-[#2A3040] bg-[#12151D] text-zinc-300 hover:bg-[#1E2333] hover:text-[#E6E8EE] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('page', Math.min(totalPages - 1, pageZero + 1))}
                disabled={pageZero >= totalPages - 1}
                aria-label="Next Page"
                className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-[#2A3040] bg-[#12151D] text-zinc-300 hover:bg-[#1E2333] hover:text-[#E6E8EE] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 11. Subtle Enterprise Footer */}
        <div className="pt-6 pb-4 border-t border-[#2A3040]/70 flex flex-col items-center justify-center gap-1.5 text-center text-[11px] text-[#6B7280]">
          <p>© {new Date().getFullYear()} CloudERP Systems. All rights reserved.</p>
          <p className="text-[10px] text-zinc-500">Enterprise Cash Flow Statement • Fiscal Year Reporting &amp; Audit Trail Compliant • Confidential</p>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="cash-flow"
        defaultFilters={Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null))}
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
