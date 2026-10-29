import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Printer, Download, RefreshCw, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
import { addAlert } from '../../notifications/notificationSlice';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import Pagination from '../../../components/common/Pagination';
import CustomSelect from '../../../components/common/CustomSelect';
import {
  GstPeriodFilter,
  getDefaultPeriod,
  GstKpiCards,
  GstEmptyState,
} from '../components';

const TaxBreakdownCard = ({ title, data, currency, variant = 'availed' }) => {
  const isAvailed = variant === 'availed';
  const colorClass = isAvailed
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400';
  const badgeClass = isAvailed
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';

  return (
    <div className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark shadow-xs p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-border-dark mb-3">
        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{title}</h4>
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
          {isAvailed ? 'Credit Inflow' : 'Credit Outflow'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-surface-dark/40 border border-zinc-100 dark:border-border-dark/50">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">CGST</p>
          <p className={`text-xs font-bold ${colorClass}`}>
            {currency} {formatCurrency(data?.cgst || 0)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-surface-dark/40 border border-zinc-100 dark:border-border-dark/50">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">SGST</p>
          <p className={`text-xs font-bold ${colorClass}`}>
            {currency} {formatCurrency(data?.sgst || 0)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-surface-dark/40 border border-zinc-100 dark:border-border-dark/50">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">IGST</p>
          <p className={`text-xs font-bold ${colorClass}`}>
            {currency} {formatCurrency(data?.igst || 0)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-50/60 dark:bg-surface-dark/40 border border-zinc-100 dark:border-border-dark/50">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">CESS</p>
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
            {currency} {formatCurrency(data?.cess || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ItcPage() {
  const dispatch = useDispatch();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const fallbackCompanyId = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode
      );
    } catch {
      return null;
    }
  })();
  const companyId = selectedCompany?.id || fallbackCompanyId || '';

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user')) || {};
    } catch {
      return {};
    }
  })();

  const isSystemAdmin =
    authUser?.loginType === 'ADMIN' ||
    authUser?.role === 'SYSTEM_ADMIN' ||
    authUser?.roles?.includes('SYSTEM_ADMIN') ||
    authUser?.roles?.includes('ROLE_SYSTEM_ADMIN');

  const defaultPeriod = getDefaultPeriod();

  const initialFilters = {
    month: defaultPeriod.month,
    year: defaultPeriod.year,
    companyId: companyId,
    branchId: '',
    gstRegistrationId: '',
    financialYearId: '',
    invoiceType: 'ALL',
    stateCode: '',
    gstRate: '',
    hsn: '',
    customerId: '',
    vendorId: '',
    page: 1,
    size: 20,
    sortBy: 'invoiceDate',
    sortDirection: 'DESC',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const buildPayload = useCallback(
    (currentFilters = filters) => {
      const start = new Date(currentFilters.year, currentFilters.month - 1, 1);
      const end = new Date(currentFilters.year, currentFilters.month, 0);

      const pad = (n) => String(n).padStart(2, '0');
      const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
      const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

      const payloadFilters = {
        fromDate,
        toDate,
        invoiceType: currentFilters.invoiceType || 'ALL',
      };

      if (isSystemAdmin && currentFilters.companyId) {
        payloadFilters.companyId = currentFilters.companyId;
      }

      if (currentFilters.branchId) payloadFilters.branchId = currentFilters.branchId;
      if (currentFilters.gstRegistrationId) payloadFilters.gstRegistrationId = currentFilters.gstRegistrationId;
      if (currentFilters.financialYearId) payloadFilters.financialYearId = currentFilters.financialYearId;
      if (currentFilters.stateCode) payloadFilters.stateCode = currentFilters.stateCode;
      if (currentFilters.gstRate) payloadFilters.gstRate = Number(currentFilters.gstRate);
      if (currentFilters.hsn) payloadFilters.hsn = currentFilters.hsn;
      if (currentFilters.customerId) payloadFilters.customerId = currentFilters.customerId;
      if (currentFilters.vendorId) payloadFilters.vendorId = currentFilters.vendorId;

      return {
        filters: payloadFilters,
        pagination: {
          page: currentFilters.page || 1,
          size: currentFilters.size || 20,
        },
        sort: {
          field: currentFilters.sortBy || 'invoiceDate',
          direction: currentFilters.sortDirection || 'DESC',
        },
      };
    },
    [filters, isSystemAdmin]
  );

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getItc });

  useEffect(() => {
    if (companyId && !hasSearched) {
      refetch(buildPayload(filters));
      setHasSearched(true);
    }
  }, [companyId, hasSearched, refetch, buildPayload, filters]);

  const handleSearch = () => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      refetch(buildPayload(next));
      return next;
    });
    setHasSearched(true);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    if (companyId) {
      refetch(buildPayload(initialFilters));
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async (format) => {
    setExportingType(format);

    try {
      const payload = buildPayload(filters).filters;
      const blob = await gstReportsApi.exportReport('itc', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `ITC-Report-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      dispatch(addAlert({ type: 'success', message: 'Report exported successfully' }));
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err.message || 'Failed to export report',
        })
      );
    } finally {
      setExportingType(null);
    }
  };

  const reportData = data?.data || data;
  const summary = reportData?.summary || {};
  const itcAvailed = reportData?.itcAvailed || {};
  const itcUtilized = reportData?.itcUtilized || {};
  const pagination = reportData?.pagination || null;
  const reportInfo = reportData?.reportInfo || {};
  const currency = selectedCompany?.baseCurrency || 'INR';

  const isZeroState = () => {
    if (!reportData) return true;
    const isZero = (obj) =>
      !obj || Object.values(obj).every((v) => v === 0 || v === null || typeof v === 'object');
    return isZero(itcAvailed) && isZero(itcUtilized) && !summary.closingBalance && !reportData.openingBalance;
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Opening Balance', value: reportData?.openingBalance || 0, isCurrency: true },
      { label: 'Total ITC Availed', value: summary.totalItcAvailed || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Total ITC Utilized', value: summary.totalItcUtilized || 0, isCurrency: true, color: 'text-rose-600 dark:text-rose-400' },
      { label: 'Net ITC Available', value: summary.netItcAvailable || 0, isCurrency: true, color: 'text-primary dark:text-primary-light' },
      { label: 'Closing Balance', value: summary.closingBalance || 0, isCurrency: true },
    ],
    [reportData, summary]
  );

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = [
      'branchId',
      'gstRegistrationId',
      'financialYearId',
      'invoiceType',
      'stateCode',
      'gstRate',
      'hsn',
      'customerId',
      'vendorId',
    ];
    return keys.filter((k) => filters[k] !== '' && filters[k] !== 'ALL').length;
  }, [filters]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Website Standard PageHeader */}
      <PageHeader
        title="ITC Report"
        description="Input Tax Credit statement — availed, utilized, and net balance"
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary h-9 px-3 text-xs bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
              type="button"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportingType === 'pdf' || isLoading}
              className="btn-secondary h-9 px-3 flex items-center gap-1.5"
              type="button"
            >
              {exportingType === 'pdf' ? (
                <RefreshCw size={15} className="animate-spin text-primary" />
              ) : (
                <Download size={15} />
              )}
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exportingType === 'excel' || isLoading}
              className="btn-secondary h-9 px-3 flex items-center gap-1.5"
              type="button"
            >
              {exportingType === 'excel' ? (
                <RefreshCw size={15} className="animate-spin text-primary" />
              ) : (
                <Download size={15} />
              )}
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exportingType === 'csv' || isLoading}
              className="btn-primary h-9 px-3 text-xs flex items-center gap-1.5 shadow-2xs"
              type="button"
            >
              {exportingType === 'csv' ? (
                <RefreshCw size={15} className="animate-spin text-white" />
              ) : (
                <Download size={15} />
              )}
              <span>CSV</span>
            </button>
          </div>
        }
      />

      {/* Cross-report Navigation Tabs */}
      <ModuleTabs tabs={gstTabs} />

      <div className="p-6 space-y-6 flex-1">
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 p-6 rounded-xl flex flex-col items-center text-center">
          <AlertCircle size={28} className="text-rose-500 mb-2" />
          <h3 className="text-sm font-bold">Unable to generate ITC Report</h3>
          <p className="text-xs text-rose-600/80 dark:text-rose-400 mt-1 mb-3">{error}</p>
          <button
            onClick={() => refetch(buildPayload(filters))}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Componentized Period Filter */}
      <GstPeriodFilter
        period={{ month: filters.month, year: filters.year }}
        onPeriodChange={({ month, year }) => setFilters((prev) => ({ ...prev, month, year }))}
        showGstin={false}
        searchButtonText="Generate Report"
        onSearch={handleSearch}
        onReset={handleClearFilters}
        isLoading={isLoading}
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        advancedCount={activeAdvancedFilterCount}
        advancedContent={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
            {isSystemAdmin && (
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Company ID
                </label>
                <input
                  type="text"
                  value={filters.companyId}
                  onChange={(e) => handleFilterChange('companyId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
            )}
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Branch ID
              </label>
              <input
                type="text"
                value={filters.branchId}
                onChange={(e) => handleFilterChange('branchId', e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                GST Registration ID
              </label>
              <input
                type="text"
                value={filters.gstRegistrationId}
                onChange={(e) => handleFilterChange('gstRegistrationId', e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Financial Year ID
              </label>
              <input
                type="text"
                value={filters.financialYearId}
                onChange={(e) => handleFilterChange('financialYearId', e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Invoice Type
              </label>
              <CustomSelect
                value={filters.invoiceType}
                onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                className="w-full h-8 px-2.5 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="B2B">B2B (Business to Business)</option>
                <option value="B2C">B2C (Business to Consumer)</option>
              </CustomSelect>
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                State Code
              </label>
              <input
                type="text"
                value={filters.stateCode}
                onChange={(e) => handleFilterChange('stateCode', e.target.value)}
                placeholder="e.g. 27"
                maxLength={2}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                GST Rate (%)
              </label>
              <input
                type="number"
                value={filters.gstRate}
                onChange={(e) => handleFilterChange('gstRate', e.target.value)}
                placeholder="e.g. 18"
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                HSN/SAC Code
              </label>
              <input
                type="text"
                value={filters.hsn}
                onChange={(e) => handleFilterChange('hsn', e.target.value)}
                placeholder="e.g. 998311"
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Vendor ID
              </label>
              <input
                type="text"
                value={filters.vendorId}
                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        }
      />

      {!error && (
        <>
          {/* Summary KPI Cards */}
          <GstKpiCards cards={summaryCards} currency={currency} isLoading={isLoading} />

          {/* Tax Breakdown Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TaxBreakdownCard
              title="ITC Availed (Purchases & Inward Supplies)"
              data={itcAvailed}
              currency={currency}
              variant="availed"
            />
            <TaxBreakdownCard
              title="ITC Utilized (Against Outward Liabilities)"
              data={itcUtilized}
              currency={currency}
              variant="utilized"
            />
          </div>

          {isZeroState() ? (
            <GstEmptyState
              title="No ITC records found for the selected period"
              description="Please select a different month or year, or ensure inward invoices have been posted."
              onReset={handleClearFilters}
            />
          ) : (
            <>
              {/* Summary Statement Table */}
              <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-border-dark flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      ITC Ledger Summary Statement
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Component-wise credit movement for the period
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10.4px] min-w-[640px]">
                    <thead className="bg-zinc-50 dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                      <tr>
                        <th className="p-3.5 w-[25%] border-r border-zinc-200 dark:border-border-dark">Category</th>
                        <th className="p-3.5 w-[15%] text-right">CGST</th>
                        <th className="p-3.5 w-[15%] text-right">SGST</th>
                        <th className="p-3.5 w-[15%] text-right">IGST</th>
                        <th className="p-3.5 w-[15%] text-right">CESS</th>
                        <th className="p-3.5 w-[15%] text-right text-zinc-900 dark:text-[#E6E8EE] bg-zinc-50/50 dark:bg-surface-dark/40">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-border-dark">
                      {/* Opening Balance */}
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-hover-dark/30 transition-colors">
                        <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-border-dark">
                          Opening Balance
                        </td>
                        <td colSpan={4} className="p-3.5 text-center text-zinc-400 dark:text-zinc-500">-</td>
                        <td className="p-3.5 text-right font-bold text-zinc-900 dark:text-[#E6E8EE] bg-zinc-50/20 dark:bg-surface-dark/20">
                          {currency} {formatCurrency(reportData?.openingBalance || 0)}
                        </td>
                      </tr>

                      {/* ITC Availed */}
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-hover-dark/30 transition-colors">
                        <td className="p-3.5 font-semibold text-emerald-700 dark:text-emerald-400 border-r border-zinc-200 dark:border-border-dark">
                          (+) ITC Availed
                        </td>
                        <td className="p-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {currency} {formatCurrency(itcAvailed?.cgst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {currency} {formatCurrency(itcAvailed?.sgst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {currency} {formatCurrency(itcAvailed?.igst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {currency} {formatCurrency(itcAvailed?.cess || 0)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {currency} {formatCurrency(summary.totalItcAvailed || 0)}
                        </td>
                      </tr>

                      {/* ITC Utilized */}
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-hover-dark/30 transition-colors">
                        <td className="p-3.5 font-semibold text-rose-700 dark:text-rose-400 border-r border-zinc-200 dark:border-border-dark">
                          (-) ITC Utilized
                        </td>
                        <td className="p-3.5 text-right font-medium text-rose-600 dark:text-rose-400">
                          {currency} {formatCurrency(itcUtilized?.cgst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-rose-600 dark:text-rose-400">
                          {currency} {formatCurrency(itcUtilized?.sgst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-rose-600 dark:text-rose-400">
                          {currency} {formatCurrency(itcUtilized?.igst || 0)}
                        </td>
                        <td className="p-3.5 text-right font-medium text-rose-600 dark:text-rose-400">
                          {currency} {formatCurrency(itcUtilized?.cess || 0)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/20">
                          {currency} {formatCurrency(summary.totalItcUtilized || 0)}
                        </td>
                      </tr>

                      {/* Closing Balance */}
                      <tr className="bg-zinc-50/60 dark:bg-surface-dark/40 border-t-2 border-zinc-200 dark:border-border-dark">
                        <td className="p-3.5 font-bold text-zinc-900 dark:text-[#E6E8EE] border-r border-zinc-200 dark:border-border-dark">
                          Closing Balance
                        </td>
                        <td colSpan={4} className="p-3.5 text-center text-zinc-400 dark:text-zinc-500">-</td>
                        <td className="p-3.5 text-right font-bold text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10">
                          {currency} {formatCurrency(summary.closingBalance || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Collapsible Quick Metrics Drawer */}
              <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-hover-dark/30 transition-colors"
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-zinc-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      ITC Summary Snapshot
                    </h3>
                  </div>
                  {isSummaryExpanded ? (
                    <ChevronUp size={16} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={16} className="text-zinc-500" />
                  )}
                </div>

                {isSummaryExpanded && (
                  <div className="p-4 border-t border-zinc-200 dark:border-border-dark bg-zinc-50/50 dark:bg-surface-dark/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="p-3 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Opening
                        </p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                          {currency} {formatCurrency(reportData?.openingBalance || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Availed
                        </p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {currency} {formatCurrency(summary.totalItcAvailed || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Utilized
                        </p>
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {currency} {formatCurrency(summary.totalItcUtilized || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Net Available
                        </p>
                        <p className="text-xs font-bold text-primary dark:text-primary-light">
                          {currency} {formatCurrency(summary.netItcAvailable || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg">
                        <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                          Closing
                        </p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                          {currency} {formatCurrency(summary.closingBalance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination if applicable */}
              {pagination && (pagination.totalPages > 1 || filters.page > 1) && (
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
                  <Pagination
                    currentPage={filters.page}
                    totalPages={pagination.totalPages || 1}
                    onPageChange={(newPage) => {
                      setFilters((prev) => {
                        const next = { ...prev, page: newPage };
                        refetch(buildPayload(next));
                        return next;
                      });
                    }}
                    totalElements={pagination.totalRecords ?? pagination.totalElements}
                    pageSize={filters.size}
                  />
                </div>
              )}

              {/* Bottom Report Info Card */}
              <div className="bg-white dark:bg-card-dark rounded-xl p-4 border border-zinc-200 dark:border-border-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      {reportInfo?.reportName || 'ITC Summary Report'}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Period:{' '}
                      {reportInfo?.reportingPeriod ||
                        `${monthNames[filters.month - 1]} ${filters.year}`}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[8px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    Generated At
                  </p>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
                    {reportInfo?.generatedAt
                      ? new Date(reportInfo.generatedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date().toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="itc-export"
      />
    </div>
  );
}
