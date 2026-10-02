import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Eye,
  Info
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { cashFlowApi } from '../../../api/account/reports';
import { fiscalYearsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';

/**
 * Currency formatter respecting dynamic baseCurrency from API
 */
const formatMoney = (amount, currencyCode = 'INR') => {
  const safeAmount = amount === null || amount === undefined || isNaN(Number(amount)) ? 0 : Number(amount);
  
  if (!currencyCode || currencyCode === 'null' || currencyCode === 'undefined' || String(currencyCode).trim() === '') {
    currencyCode = 'INR';
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
 * Date formatter
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

const getStatusBadge = (status) => {
  if (!status) return <span className="px-2.5 py-0.5 text-[8.5px] font-bold uppercase rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">POSTED</span>;
  const s = status.toString().toUpperCase();
  if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') return <span className="px-2.5 py-0.5 text-[8.5px] font-bold uppercase rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{status}</span>;
  if (s === 'DRAFT' || s === 'PENDING') return <span className="px-2.5 py-0.5 text-[8.5px] font-bold uppercase rounded-md border bg-amber-50 text-amber-700 border-amber-200">{status}</span>;
  if (s === 'CANCELLED' || s === 'REJECTED') return <span className="px-2.5 py-0.5 text-[8.5px] font-bold uppercase rounded-md border bg-rose-50 text-rose-700 border-rose-200">{status}</span>;
  return <span className="px-2.5 py-0.5 text-[8.5px] font-bold uppercase rounded-md border bg-blue-50 text-blue-700 border-blue-200">{status}</span>;
};

/**
 * Expandable Row Component for Cash Flow Records
 */
const CashFlowRowDetails = ({ row, currency }) => {
  return (
    <div className="p-4 bg-zinc-50/70 border-y border-zinc-200 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-zinc-600" />
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Cash Flow Line Detail: {row.accountName}
            </h4>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {row.accountCode || '—'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Category</span>
            <span className="font-semibold text-zinc-800">{row.cashFlowCategory || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Status</span>
            <div className="mt-0.5">{getStatusBadge(row.status)}</div>
          </div>
          <div>
            <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Reference</span>
            <span className="font-mono text-zinc-700">{row.reference || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Net Cash Flow</span>
            <span className={`font-bold ${Number(row.netCash) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(row.netCash, currency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 text-xs">
          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Cash Inflow</span>
            <span className="font-bold text-emerald-700">{formatMoney(row.cashIn, currency)}</span>
          </div>
          <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-800">Cash Outflow</span>
            <span className="font-bold text-rose-700">{formatMoney(row.cashOut, currency)}</span>
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

  const [visibleColumns, setVisibleColumns] = useState([
    'rowIndex',
    'cashFlowCategory',
    'accountCode',
    'accountName',
    'cashIn',
    'cashOut',
    'netCash',
    'status',
    'reference'
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
  const tableRows = useMemo(() => {
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

  // DataTable column definitions
  const columns = [
    {
      key: 'rowIndex',
      label: '#',
      sortable: false,
      className: 'w-12 text-center text-zinc-400 font-mono text-[11px]',
      render: (_, __, idx) => (filters.page * filters.pageSize) + idx + 1
    },
    {
      key: 'cashFlowCategory',
      label: 'CASH FLOW CATEGORY',
      sortable: true,
      className: 'w-48 whitespace-nowrap',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'accountCode',
      label: 'ACCOUNT CODE',
      sortable: true,
      className: 'w-32 whitespace-nowrap font-mono font-medium text-zinc-700',
      render: (val) => val || '—'
    },
    {
      key: 'accountName',
      label: 'ACCOUNT NAME',
      sortable: true,
      className: 'min-w-[200px]',
      render: (val) => (
        <span className="font-semibold text-zinc-900">{val || '—'}</span>
      )
    },
    {
      key: 'cashIn',
      label: 'CASH IN',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => {
        const amt = Number(val || 0);
        return amt > 0 ? (
          <span className="font-bold text-emerald-600">{formatMoney(amt, baseCurrency)}</span>
        ) : (
          <span className="text-zinc-400 font-medium">—</span>
        );
      }
    },
    {
      key: 'cashOut',
      label: 'CASH OUT',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => {
        const amt = Number(val || 0);
        return amt > 0 ? (
          <span className="font-bold text-rose-600">{formatMoney(amt, baseCurrency)}</span>
        ) : (
          <span className="text-zinc-400 font-medium">—</span>
        );
      }
    },
    {
      key: 'netCash',
      label: 'NET CASH',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => {
        const amt = Number(val || 0);
        const isPos = amt >= 0;
        return (
          <span className={`font-bold tabular-nums ${isPos ? 'text-zinc-900' : 'text-rose-600'}`}>
            {formatMoney(amt, baseCurrency)}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      className: 'text-center w-28 whitespace-nowrap',
      render: (val) => getStatusBadge(val)
    },
    {
      key: 'reference',
      label: 'REFERENCE',
      sortable: false,
      className: 'w-36 font-mono text-zinc-600 truncate',
      render: (val) => val || '—'
    }
  ];

  const basicFilters = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search account or category...'
    },
    {
      key: 'fiscalYearId',
      label: 'Fiscal Year',
      type: 'select',
      options: fiscalYearOptions,
      placeholder: 'All Fiscal Years'
    },
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
      key: 'cashFlowType',
      label: 'Cash Flow Type',
      type: 'select',
      options: [
        { value: '', label: 'All Cash Flow Types' },
        { value: 'OPERATING', label: 'Operating' },
        { value: 'INVESTING', label: 'Investing' },
        { value: 'FINANCING', label: 'Financing' }
      ]
    }
  ];

  const advancedFilters = [
    {
      id: 'cash_flow_advanced',
      title: 'Allocation Filters',
      fields: [
        {
          id: 'branchId',
          label: 'Branch ID',
          type: 'text',
          placeholder: 'Filter by Branch'
        },
        {
          id: 'departmentId',
          label: 'Department ID',
          type: 'text',
          placeholder: 'Filter by Department'
        }
      ]
    }
  ];

  const rowActions = (row) => [
    {
      key: 'view',
      label: 'View Line Details',
      icon: <Eye size={15} />,
      onClick: () => toggleRow(row.id)
    }
  ];

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

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* 1. Page Header */}
      <PageHeader
        title="Cash Flow Statement"
        description="Detailed summary of cash inflows and outflows for the selected reporting period."
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

        {/* 3. Company Information Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-zinc-100">
            <Building2 size={16} className="text-zinc-600" />
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Reporting Entity &amp; Audit Metadata
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">Company Name</span>
              <span className="font-semibold text-zinc-900 truncate block" title={summary.companyName || selectedCompany?.name}>
                {summary.companyName || selectedCompany?.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">Base Currency</span>
              <span className="font-semibold text-zinc-800">{baseCurrency}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">Start Date</span>
              <span className="font-semibold text-zinc-800">{formatDate(summary.startDate || filters.fromDate)}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">End Date</span>
              <span className="font-semibold text-zinc-800">{formatDate(summary.endDate || filters.toDate)}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">Generated At</span>
              <span className="font-medium text-zinc-700">{summary.reportGeneratedAt ? formatDate(summary.reportGeneratedAt) : '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9.5px] uppercase font-semibold">Generated By</span>
              <span className="font-medium text-zinc-700">{summary.generatedBy || 'System'}</span>
            </div>
          </div>
        </div>

        {/* 4. Main Financial Summary Cards (Row 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Opening Cash Balance */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
            <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Opening Cash Balance
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-600 tabular-nums block">
              {formatMoney(openingCash, baseCurrency)}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">Balance at start of period</span>
          </div>

          {/* Card 2: Cash Inflow */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
            <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Cash Inflow
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums block">
              {formatMoney(totalInflow, baseCurrency)}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">Total inflows across activities</span>
          </div>

          {/* Card 3: Cash Outflow */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
            <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Cash Outflow
            </span>
            <span className="text-xl sm:text-2xl font-bold text-rose-600 tabular-nums block">
              {formatMoney(totalOutflow, baseCurrency)}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">Total disbursements and payments</span>
          </div>

          {/* Card 4: Closing Cash Balance */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
            <span className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Closing Cash Balance
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-600 tabular-nums block">
              {formatMoney(closingCash, baseCurrency)}
            </span>
            <span className="text-[10px] text-zinc-400 mt-1 block">Net liquid funds at end of period</span>
          </div>
        </div>

        {/* 5. Secondary Summary Cards (Row 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Operating Cash Flow">
              Net Operating
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(netOperating) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netOperating, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Investing Cash Flow">
              Net Investing
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(netInvesting) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netInvesting, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Financing Cash Flow">
              Net Financing
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(netFinancing) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netFinancing, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Net Cash Flow">
              Net Cash Flow
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(netCash) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netCash, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Total Transactions">
              Transactions
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate block tabular-nums mt-0.5">
              {totalTxCount}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Previous Net Cash Flow">
              Prev Net Cash
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-700 truncate block tabular-nums mt-0.5">
              {formatMoney(prevNetCash, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Variance Amount">
              Variance Amt
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(varianceAmt) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(varianceAmt, baseCurrency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block truncate" title="Variance Percentage">
              Variance %
            </span>
            <span className={`text-xs sm:text-sm font-bold truncate block tabular-nums mt-0.5 ${Number(variancePct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(variancePct) >= 0 ? `+${Number(variancePct).toFixed(1)}%` : `${Number(variancePct).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* 6. Bank Accounts Section (if present) */}
        {bankAccounts.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
              <Landmark size={16} className="text-zinc-600" />
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Bank &amp; Cash Accounts Summary
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[9.5px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Account Name</th>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5 text-right">Opening Balance</th>
                    <th className="px-4 py-2.5 text-right text-emerald-700">Total Receipts</th>
                    <th className="px-4 py-2.5 text-right text-rose-700">Total Payments</th>
                    <th className="px-4 py-2.5 text-right">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {bankAccounts.map((b, idx) => (
                    <tr key={b.id || b.accountCode || idx} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-2.5 font-semibold text-zinc-900">{b.accountName || b.name || '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-600">{b.accountCode || b.code || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-zinc-700">{formatMoney(b.openingBalance, baseCurrency)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatMoney(b.totalReceipts ?? b.totalCashIn, baseCurrency)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-rose-600">{formatMoney(b.totalPayments ?? b.totalCashOut, baseCurrency)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-zinc-900">{formatMoney(b.closingBalance, baseCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Cash Flow Statement Table */}
        <div className="flex-1 flex flex-col min-h-[350px]">
          <DataTable
            columns={columns}
            data={tableRows}
            rowKey={(row, idx) => row.id || `${row.accountCode}-${idx}`}
            loading={loading}
            selectable={false}
            showIndex={false}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            searchable={false}
            basicFilters={basicFilters}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            advancedFilters={advancedFilters}
            onReset={handleResetFilters}
            onRefresh={() => fetchReport()}
            onExport={() => setIsExportModalOpen(true)}
            expandedRowId={expandedRowId}
            onToggleExpand={toggleRow}
            renderExpandedRow={(row) => (
              <CashFlowRowDetails row={row} currency={baseCurrency} />
            )}
            rowActions={rowActions}
            pagination={{
              page: filters.page,
              pageSize: filters.pageSize,
              totalPages,
              totalElements
            }}
            pageIndexBase={0}
            onPageChange={(p) => handleFilterChange('page', p)}
            onPageSizeChange={(s) => handleFilterChange('pageSize', s)}
            itemName="cash flow entries"
            emptyMessage="No cash flow records found"
            emptyDescription="Select a date range and click Refresh to generate the Cash Flow report."
            headerActions={
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Print Report"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            }
          />
        </div>
      </div>

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
