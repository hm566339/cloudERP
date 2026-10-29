import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookMarked, Printer, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
import { addAlert } from '../../notifications/notificationSlice';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import SortableHeader from '../../../components/common/SortableHeader';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import Pagination from '../../../components/common/Pagination';
import CustomSelect from '../../../components/common/CustomSelect';
import {
  GstPeriodFilter,
  getDefaultPeriod,
  GstKpiCards,
  GstEmptyState,
} from '../components';

const HsnExpandableRow = ({ record, selectedCompany, generatedAt, reportingPeriod }) => {
  const currency = selectedCompany?.baseCurrency || 'INR';
  const totalTax = (record.cgst || 0) + (record.sgst || 0) + (record.igst || 0) + (record.cess || 0);

  return (
    <div className="p-4 m-3 bg-zinc-50/70 dark:bg-surface-dark/50 rounded-xl border border-zinc-200 dark:border-border-dark space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-200 dark:border-border-dark pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              HSN {record.hsnCode || '-'}
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {record.description || 'No description provided'}
            </h3>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[8px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            Period: {reportingPeriod || '-'}
          </p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Generated: {generatedAt || '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200 dark:border-border-dark">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            Unit (UQC)
          </p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{record.uqc || '-'}</p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200 dark:border-border-dark">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            Total Quantity
          </p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">
            {Number(record.quantity || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200 dark:border-border-dark">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            Taxable Value
          </p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">
            {currency} {formatCurrency(record.taxableValue ?? record.taxableAmount)}
          </p>
        </div>
        <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200 dark:border-border-dark">
          <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            Total Tax
          </p>
          <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">
            {currency} {formatCurrency(totalTax)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-card-dark p-3 rounded-lg border border-zinc-200 dark:border-border-dark">
        <p className="text-[8.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Tax Component Breakdown
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">CGST</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {currency} {formatCurrency(record.cgst)}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">SGST</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {currency} {formatCurrency(record.sgst)}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">IGST</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {currency} {formatCurrency(record.igst)}
            </span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-semibold block uppercase">CESS</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {currency} {formatCurrency(record.cess)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HsnSummaryPage() {
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
    size: 10,
    sortBy: 'hsnCode',
    sortDirection: 'ASC',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [exportingType, setExportingType] = useState(null);

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
          size: currentFilters.size || 10,
        },
        sort: {
          field: currentFilters.sortBy || 'hsnCode',
          direction: currentFilters.sortDirection || 'ASC',
        },
      };
    },
    [filters, isSystemAdmin]
  );

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getHsnSummary });

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

  const handleColumnSort = (field) => {
    const direction = filters.sortBy === field && filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    setFilters((prev) => {
      const next = { ...prev, sortBy: field, sortDirection: direction, page: 1 };
      refetch(buildPayload(next));
      return next;
    });
  };

  const handleExport = async (format) => {
    setExportingType(format);

    try {
      const payload = buildPayload(filters).filters;
      const blob = await gstReportsApi.exportReport('hsn-summary', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `HSN-Summary-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`
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

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const reportData = data?.data || data;
  const records = reportData?.records || reportData?.rows || [];
  const summary = reportData?.summary || reportData?.totals || {};
  const pagination = reportData?.pagination || null;
  const reportInfo = reportData?.reportInfo || {};
  const currency = selectedCompany?.baseCurrency || 'INR';

  const summaryCards = useMemo(
    () => [
      { label: 'Total HSN Codes', value: summary.totalHsnCodes || 0, isCurrency: false },
      { label: 'Total Quantity', value: summary.totalQuantity || 0, isCurrency: false },
      { label: 'Taxable Value', value: summary.totalTaxableValue || 0, isCurrency: true },
      { label: 'CGST', value: summary.totalCgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'SGST', value: summary.totalSgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'IGST', value: summary.totalIgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'CESS', value: summary.totalCess || 0, isCurrency: true, color: 'text-rose-600 dark:text-rose-400' },
    ],
    [summary]
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
        title="HSN Summary Report"
        description="HSN-wise summary of outward supplies and tax liability"
        icon={BookMarked}
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
          <h3 className="text-sm font-bold">Unable to generate HSN Summary Report</h3>
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
                Customer ID
              </label>
              <input
                type="text"
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
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

      {/* Summary KPI Cards */}
      {!error && <GstKpiCards cards={summaryCards} currency={currency} isLoading={isLoading} />}

      {/* Table Section */}
      {!error && (
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-xs border border-zinc-200 dark:border-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-[10.4px] min-w-[900px]">
              <thead className="bg-zinc-50 dark:bg-[#161922] sticky top-0 z-10 border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <SortableHeader
                    field="hsnCode"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[12%]"
                  >
                    HSN Code
                  </SortableHeader>
                  <SortableHeader
                    field="description"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[22%]"
                  >
                    Description
                  </SortableHeader>
                  <SortableHeader
                    field="uqc"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[8%]"
                  >
                    UQC
                  </SortableHeader>
                  <SortableHeader
                    field="quantity"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[10%] text-right"
                  >
                    Quantity
                  </SortableHeader>
                  <SortableHeader
                    field="taxableValue"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[12%] text-right"
                  >
                    Taxable Value
                  </SortableHeader>
                  <SortableHeader
                    field="cgst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[9%] text-right"
                  >
                    CGST
                  </SortableHeader>
                  <SortableHeader
                    field="sgst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[9%] text-right"
                  >
                    SGST
                  </SortableHeader>
                  <SortableHeader
                    field="igst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[9%] text-right"
                  >
                    IGST
                  </SortableHeader>
                  <SortableHeader
                    field="cess"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-3.5 w-[9%] text-right"
                  >
                    CESS
                  </SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-border-dark">
                {isLoading ? (
                  <TableRowSkeleton columns={10} rows={10} />
                ) : !records || records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-0">
                      <GstEmptyState
                        title="No HSN Summary records found"
                        description="Try selecting a different month, year, or adjust your filter parameters."
                        onReset={handleClearFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => {
                    const rowId = record.hsnCode || index;
                    const isExpanded = expandedRowId === rowId;

                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          className={`hover:bg-zinc-50/80 dark:hover:bg-hover-dark/40 transition-colors cursor-pointer group ${
                            isExpanded ? 'bg-primary/5 dark:bg-primary/10' : ''
                          }`}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td className="p-3.5 text-center text-zinc-400 dark:text-zinc-500 align-middle">
                            {(filters.page - 1) * filters.size + index + 1}
                          </td>
                          <td className="p-3.5 align-middle font-semibold text-zinc-900 dark:text-[#E6E8EE] group-hover:text-primary transition-colors truncate whitespace-nowrap">
                            {record.hsnCode || '-'}
                          </td>
                          <td className="p-3.5 align-middle text-[10.4px] text-zinc-700 dark:text-zinc-300 truncate whitespace-nowrap">
                            {record.description || '-'}
                          </td>
                          <td className="p-3.5 align-middle text-[10.4px] text-zinc-600 dark:text-zinc-400 truncate whitespace-nowrap">
                            {record.uqc || '-'}
                          </td>
                          <td className="p-3.5 align-middle text-[10.4px] text-zinc-700 dark:text-zinc-300 text-right font-medium whitespace-nowrap">
                            {Number(record.quantity || 0).toLocaleString()}
                          </td>
                          <td className="p-3.5 align-middle text-right whitespace-nowrap">
                            <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                              {formatCurrency(record.taxableValue ?? record.taxableAmount)}
                            </span>
                          </td>
                          <td className="p-3.5 align-middle text-right whitespace-nowrap">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(record.cgst)}
                            </span>
                          </td>
                          <td className="p-3.5 align-middle text-right whitespace-nowrap">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(record.sgst)}
                            </span>
                          </td>
                          <td className="p-3.5 align-middle text-right whitespace-nowrap">
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(record.igst)}
                            </span>
                          </td>
                          <td className="p-3.5 align-middle text-right whitespace-nowrap">
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              {formatCurrency(record.cess)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="p-0 bg-zinc-50/40 dark:bg-card-dark border-y border-zinc-200/60 dark:border-border-dark">
                              <HsnExpandableRow
                                record={record}
                                selectedCompany={selectedCompany}
                                reportingPeriod={
                                  reportInfo.reportingPeriod ||
                                  `${monthNames[filters.month - 1]} ${filters.year}`
                                }
                                generatedAt={
                                  reportInfo.generatedAt
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
                                      })
                                }
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && records.length > 0 && (
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
              onPageSizeChange={(newSize) => {
                setFilters((prev) => {
                  const next = { ...prev, size: newSize, page: 1 };
                  refetch(buildPayload(next));
                  return next;
                });
              }}
            />
          )}
        </div>
      )}

      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="hsnsummary-export"
      />
    </div>
  );
}
