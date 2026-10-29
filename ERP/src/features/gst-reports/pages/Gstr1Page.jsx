import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
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
  GstInvoiceDrawer,
  GstEmptyState,
} from '../components';

const getStatusBadge = (status) => {
  switch (status) {
    case 'POSTED':
    case 'APPROVED':
    case 'REGULAR':
      return (
        <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          {status}
        </span>
      );
    case 'CANCELLED':
    case 'REJECTED':
      return (
        <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
          {status}
        </span>
      );
    case 'DRAFT':
    case 'REVERSED':
      return (
        <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border bg-zinc-100 dark:bg-surface-dark text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-border-dark">
          {status}
        </span>
      );
    case 'SUBMITTED':
    default:
      return (
        <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          {status || '-'}
        </span>
      );
  }
};

export default function Gstr1Page() {
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
    gstin: '',
    invoiceType: '',
    stateCode: '',
    gstRate: '',
    hsn: '',
    customerId: '',
    page: 1,
    size: 10,
    sortBy: 'invoiceDate',
    sortDirection: 'DESC',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const buildPayload = useCallback(
    (currentFilters = filters) => {
      const start = new Date(currentFilters.year, currentFilters.month - 1, 1);
      const end = new Date(currentFilters.year, currentFilters.month, 0);

      const pad = (n) => String(n).padStart(2, '0');
      const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
      const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

      const payload = {
        fromDate,
        toDate,
      };

      if (currentFilters.gstin && currentFilters.gstin.trim()) {
        payload.gstin = currentFilters.gstin.trim();
      }
      if (currentFilters.invoiceType) payload.invoiceType = currentFilters.invoiceType;
      if (currentFilters.stateCode) payload.stateCode = currentFilters.stateCode;
      if (currentFilters.gstRate) payload.gstRate = Number(currentFilters.gstRate);
      if (currentFilters.hsn) payload.hsn = currentFilters.hsn;
      if (currentFilters.customerId) payload.customerId = currentFilters.customerId;

      if (isSystemAdmin && companyId) {
        payload.companyId = companyId;
      }

      return payload;
    },
    [companyId, filters, isSystemAdmin]
  );

  const { data, isLoading, error, refetch } = useGstReport({
    fetcher: gstReportsApi.getGstr1,
  });

  useEffect(() => {
    if (companyId) {
      refetch(buildPayload());
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      refetch(buildPayload(next));
      return next;
    });
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

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  // Data Extraction
  const records = data?.data?.records || data?.records || [];
  const summary = data?.data?.summary || data?.summary || {};
  const pagination = data?.data?.pagination || data?.pagination || null;

  const currency = selectedCompany?.baseCurrency || 'INR';

  const summaryCards = [
    { label: 'Total Invoices', value: summary.totalInvoices || 0, isCurrency: false },
    { label: 'Taxable Value', value: summary.totalTaxableAmount || summary.totalTaxableValue || 0, isCurrency: true, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'CGST', value: summary.totalCgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'SGST', value: summary.totalSgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'IGST', value: summary.totalIgst || 0, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Total Tax', value: summary.totalTax || (summary.totalCgst + summary.totalSgst + summary.totalIgst + (summary.totalCess || 0)) || 0, isCurrency: true, color: 'text-rose-600 dark:text-rose-400' },
  ];

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['invoiceType', 'stateCode', 'gstRate', 'hsn', 'customerId'];
    return keys.filter((k) => filters[k] !== '').length;
  }, [filters]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="GSTR-1 Report"
        description="Monthly outward supplies return for GST compliance and audit reconciliation"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary h-9 px-3 text-xs bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg hover:bg-zinc-50 dark:hover:bg-hover-dark/40 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary h-9 px-3 text-xs bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-lg hover:bg-zinc-50 dark:hover:bg-hover-dark/40 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        }
      />

      <ModuleTabs tabs={gstTabs} />

      <div className="p-6 space-y-6 flex-1">
        {/* Period & Parameter Filters */}
        <GstPeriodFilter
          period={{ month: filters.month, year: filters.year }}
          onPeriodChange={(p) => setFilters((prev) => ({ ...prev, month: p.month, year: p.year }))}
          gstin={filters.gstin}
          onGstinChange={(v) => handleFilterChange('gstin', v)}
          onSearch={handleSearch}
          onReset={handleClearFilters}
          isLoading={isLoading}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedCount={activeAdvancedFilterCount}
          advancedContent={
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Invoice Type
                </label>
                <CustomSelect
                  value={filters.invoiceType}
                  onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="B2B">B2B (Business to Business)</option>
                  <option value="B2C">B2C (Business to Consumer)</option>
                  <option value="EXPORT">Export</option>
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
                  placeholder="Search customer ID"
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          }
        />

        {/* KPI Cards */}
        <GstKpiCards cards={summaryCards} currency={currency} isLoading={isLoading} />

        {/* Main Data Table */}
        <div className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark shadow-xs flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap" aria-label="GSTR-1 Records">
              <thead className="bg-zinc-50 dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] font-semibold text-xs sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-3 w-10 text-center text-xs font-semibold uppercase tracking-wider">#</th>
                  <SortableHeader
                    field="customerName"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider"
                  >
                    Party
                  </SortableHeader>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">GSTIN</th>
                  <SortableHeader
                    field="invoiceNumber"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider"
                  >
                    Invoice No
                  </SortableHeader>
                  <SortableHeader
                    field="invoiceDate"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider"
                  >
                    Date
                  </SortableHeader>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <SortableHeader
                    field="taxableAmount"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider text-right"
                  >
                    Taxable
                  </SortableHeader>
                  <SortableHeader
                    field="cgst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider text-right"
                  >
                    CGST
                  </SortableHeader>
                  <SortableHeader
                    field="sgst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider text-right"
                  >
                    SGST
                  </SortableHeader>
                  <SortableHeader
                    field="igst"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider text-right"
                  >
                    IGST
                  </SortableHeader>
                  <SortableHeader
                    field="totalInvoiceValue"
                    currentSortBy={filters.sortBy}
                    currentSortOrder={filters.sortDirection}
                    onSort={handleColumnSort}
                    className="p-4 text-xs font-semibold uppercase tracking-wider text-right"
                  >
                    Total Tax
                  </SortableHeader>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]/60">
                {isLoading ? (
                  <TableRowSkeleton columns={13} rows={8} />
                ) : !records || records.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-12 text-center">
                      <GstEmptyState
                        title="No GSTR-1 records found"
                        description="Try adjusting your month, year, or search parameters."
                        onReset={handleClearFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => {
                    const rowId = record.id || record.invoiceNumber || index;
                    const isExpanded = expandedRowId === rowId;
                    const taxTotal =
                      (record.cgst || 0) +
                      (record.sgst || 0) +
                      (record.igst || 0) +
                      (record.cess || 0);

                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          className={`hover:bg-zinc-50/70 dark:hover:bg-[#222736]/70 transition-colors cursor-pointer group ${
                            isExpanded ? 'bg-zinc-50/80 dark:bg-surface-dark' : ''
                          }`}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td className="px-4 py-3 text-center text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                            {(filters.page - 1) * filters.size + index + 1}
                          </td>
                          <td className="px-4 py-3 truncate max-w-[200px]">
                            <span
                              className="font-semibold text-zinc-900 dark:text-[#E6E8EE] group-hover:text-primary transition-colors text-xs"
                              title={record.customerName || record.partyName}
                            >
                              {record.customerName || record.partyName || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                            {record.gstin || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                            {record.invoiceNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                            {record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                            {record.invoiceType || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-medium text-zinc-900 dark:text-[#E6E8EE]">
                            {formatCurrency(record.taxableAmount ?? record.taxableValue)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(record.cgst)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(record.sgst)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(record.igst)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(taxTotal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(record.status || 'REGULAR')}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
                            {record.reference || '-'}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={13} className="p-0 border-b border-zinc-200 dark:border-border-dark">
                              <GstInvoiceDrawer
                                invoice={record}
                                currency={currency}
                                partyLabel="Customer"
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
            <div className="border-t border-zinc-200 dark:border-border-dark">
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
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gstr1-export"
      />
    </div>
  );
}
