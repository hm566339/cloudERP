import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Lock, ChevronRight, Search, SearchX, Building2 } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { useDispatch } from 'react-redux';
import usePermission from '../../../hooks/usePermission';
import { useGstReport } from '../hooks/useGstReport';
import { useApiQuery } from '../../../hooks/useApi';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { accountHttpClient } from '../../../api/common/client';
import { fiscalYearsApi, hsnSacMasterApi, customersApi, vendorsApi } from '../../../api/account';
import CustomSelect from '../../../components/common/CustomSelect';
import EmptyState from '../../../components/common/EmptyState';
import ErrorState from '../../../components/common/ErrorState';
import FilterCard from '../../../components/reports/FilterCard';
import SummaryCard from '../../../components/reports/SummaryCard';
import StatisticCard from '../../../components/reports/StatisticCard';
import SectionCard from '../../../components/reports/SectionCard';
import ChartCard from '../../../components/reports/ChartCard';
import ExportToolbar from '../../../components/reports/ExportToolbar';
import LoadingSkeleton from '../../../components/reports/LoadingSkeleton';
import AmountFormatter from '../../../components/reports/AmountFormatter';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { addAlert } from '../../notifications/notificationSlice';
import {
  GST_INVOICE_TYPES,
  GST_RATES,
  GST_STATES,
  SUMMARY_CARD_META,
  STATISTICS_CARD_META,
  SUMMARY_SECTIONS,
  CHART_DEFINITIONS,
  pick,
  num,
} from '../gstSummaryConfig';

const MODULE = 'GST_REPORTS';
const STORAGE_KEY = 'gstSummaryDashboardFilters';

const DEFAULT_FILTERS = {
  companyId: '',
  branchId: '',
  gstRegistrationId: '',
  financialYearId: '',
  fromDate: '',
  toDate: '',
  invoiceType: 'ALL',
  stateCode: '',
  gstRate: '',
  hsn: '',
  customerId: '',
  vendorId: '',
  sortBy: 'invoiceDate',
  sortDirection: 'DESC',
  pageSize: '20',
};

const SORT_OPTIONS = [
  { value: 'invoiceDate', label: 'Invoice Date' },
  { value: 'invoiceNumber', label: 'Invoice Number' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'vendorName', label: 'Vendor Name' },
  { value: 'taxableAmount', label: 'Taxable Amount' },
  { value: 'totalTax', label: 'Total Tax' },
  { value: 'status', label: 'Status' },
];

const SORT_DIRECTION_OPTIONS = [
  { value: 'DESC', label: 'Descending (Newest first)' },
  { value: 'ASC', label: 'Ascending (Oldest first)' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '20', label: '20 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

function loadSavedFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function extractList(response) {
  if (!response) return [];
  const body = response.data ?? response;
  const items = body?.content ?? body?.data ?? body;
  return Array.isArray(items) ? items : [];
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ─── Small presentational helpers ────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function TextField({ ...rest }) {
  return (
    <input
      type="text"
      {...rest}
      className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none"
    />
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="min-w-[120px]">
      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="text-[10.4px] font-semibold text-zinc-800 mt-0.5">{value}</p>
    </div>
  );
}

export default function GstSummaryDashboardPage() {
  const dispatch = useDispatch();
  const canRead = usePermission(MODULE, 'READ');
  const canExport = usePermission(MODULE, 'EXPORT');
  const canPrint = usePermission(MODULE, 'PRINT');

  const selectedCompany = useAppSelector((s) => s.company.selectedCompany);
  const accountCompanies = useAppSelector((s) => s.accountCompany.companies);
  const companyId = selectedCompany?.id || selectedCompany?.code || '';

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

  const [filters, setFilters] = useState(() => loadSavedFilters() ?? DEFAULT_FILTERS);
  const [exporting, setExporting] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const lastRequestKeyRef = useRef(null);

  // Remember the last selected filters across reloads.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore storage write failures
    }
  }, [filters]);

  // ── Master data for filter dropdowns ───────────────────────────────────────
  const fetchBranches = useCallback(
    () => accountHttpClient.get('/api/account/branches', { params: { companyId, size: 1000 } }).then((r) => r.data).catch(() => ({ content: [] })),
    [companyId]
  );
  const fetchGstRegistrations = useCallback(
    () => accountHttpClient.get('/api/account/gst-registrations', { params: { companyId, size: 1000 } }).then((r) => r.data).catch(() => ({ content: [] })),
    [companyId]
  );
  const fetchFiscalYears = useCallback(
    () => fiscalYearsApi.getFiscalYears({ companyId, size: 200 }).then((r) => r.data),
    [companyId]
  );
  const fetchCustomers = useCallback(() => customersApi.getList({}, { page: 0, size: 1000 }), [companyId]);
  const fetchVendors = useCallback(() => vendorsApi.getVendors({}, { page: 0, size: 1000 }), [companyId]);
  const fetchHsn = useCallback(
    () => hsnSacMasterApi.getHsnSacList({ companyId, size: 1000 }).then((r) => r.data),
    [companyId]
  );

  const skip = !companyId;
  const { data: branchesResponse } = useApiQuery(fetchBranches, null, { skip });
  const { data: registrationsResponse } = useApiQuery(fetchGstRegistrations, null, { skip });
  const { data: fiscalYearsResponse } = useApiQuery(fetchFiscalYears, null, { skip });
  const { data: customersResponse } = useApiQuery(fetchCustomers, null, { skip });
  const { data: vendorsResponse } = useApiQuery(fetchVendors, null, { skip });
  const { data: hsnResponse } = useApiQuery(fetchHsn, null, { skip });

  const branches = useMemo(() => extractList(branchesResponse), [branchesResponse]);
  const registrations = useMemo(() => extractList(registrationsResponse), [registrationsResponse]);
  const fiscalYears = useMemo(() => extractList(fiscalYearsResponse), [fiscalYearsResponse]);
  const customers = useMemo(() => extractList(customersResponse), [customersResponse]);
  const vendors = useMemo(() => extractList(vendorsResponse), [vendorsResponse]);
  const hsnList = useMemo(() => extractList(hsnResponse), [hsnResponse]);

  const activeFiscalYear = useMemo(() => fiscalYears.find((fy) => fy.isActive || fy.status === 'ACTIVE'), [fiscalYears]);

  // Default the period to the active financial year (once).
  useEffect(() => {
    if (!activeFiscalYear) return;
    setFilters((prev) => {
      if (prev.financialYearId || prev.fromDate || prev.toDate) return prev;
      return {
        ...prev,
        financialYearId: activeFiscalYear.id || '',
        fromDate: String(activeFiscalYear.startDate || '').slice(0, 10),
        toDate: String(activeFiscalYear.endDate || '').slice(0, 10),
      };
    });
  }, [activeFiscalYear]);

  useEffect(() => {
    if (selectedCompany?.id) {
      setFilters((prev) => (prev.companyId === selectedCompany.id ? prev : { ...prev, companyId: selectedCompany.id }));
    }
  }, [selectedCompany]);

  // companyId is only sent for SYSTEM_ADMIN users.
  // The backend resolves it from the JWT for all other roles.
  const buildPayload = useCallback(
    (f) => {
      const payload = {
        branchId: f.branchId || null,
        gstRegistrationId: f.gstRegistrationId || null,
        financialYearId: f.financialYearId || null,
        fromDate: f.fromDate || null,
        toDate: f.toDate || null,
        invoiceType: f.invoiceType || 'ALL',
        stateCode: f.stateCode || '',
        gstRate: f.gstRate === '' || f.gstRate === null ? null : Number(f.gstRate),
        hsn: f.hsn || '',
        customerId: f.customerId || null,
        vendorId: f.vendorId || null,
        page: 0,
        size: Number(f.pageSize) || 20,
        sortBy: f.sortBy || 'invoiceDate',
        sortDirection: f.sortDirection || 'DESC',
      };
      if (isSystemAdmin) {
        payload.companyId = f.companyId || companyId;
      }
      return payload;
    },
    [companyId, isSystemAdmin]
  );

  const { data, isLoading, error, refetch } = useGstReport({
    fetcher: gstReportsApi.getSummaryDashboard,
    autoFetch: false,
  });

  // Auto-load: call the API as soon as the page opens (no click needed)
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (hasAutoLoaded.current) return;
    hasAutoLoaded.current = true;
    console.log('[GST] Auto-loading dashboard...');
    const payload = buildPayload(filters);
    console.log('[GST] Auto-load payload:', payload);
    setHasSearched(true);
    refetch(payload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(() => {
    console.log('[GST] handleSearch() called');
    if (isLoading) return;
    const payload = buildPayload(filters);
    console.log('[GST] Search payload:', payload);
    setHasSearched(true);
    refetch(payload);
  }, [buildPayload, filters, isLoading, refetch]);

  const handleReset = () => {
    const defaults = {
      ...DEFAULT_FILTERS,
      companyId: companyId || '',
      financialYearId: activeFiscalYear?.id || '',
      fromDate: String(activeFiscalYear?.startDate || '').slice(0, 10),
      toDate: String(activeFiscalYear?.endDate || '').slice(0, 10),
    };
    setFilters(defaults);
    lastRequestKeyRef.current = null;
    setHasSearched(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async (format) => {
    if (!canExport || exporting) return;
    setExporting(format);
    try {
      const blob = await gstReportsApi.exportDashboard(format, buildPayload(filters));
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      downloadBlob(blob, `gst-summary-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`);
      dispatch(addAlert({ type: 'success', message: `GST Summary exported as ${format.toUpperCase()}` }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to export report' }));
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    if (canPrint) window.print();
  };

  // ── Response unwrapping (uses only the backend response) ───────────────────
  const dto = data?.data ?? data ?? null;
  const summary = dto?.summary ?? {};
  const audit = dto?.audit ?? {};
  const exportOptions = dto?.exportOptions ?? {};
  const charts = dto?.charts ?? {};

  const generatedAt = audit?.generatedAt ?? summary?.reportGeneratedAt ?? null;
  const generatedAtDisplay = generatedAt
    ? `${formatDate(generatedAt)} ${new Date(generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const generatedBy = audit?.generatedBy ?? summary?.generatedBy ?? null;
  const companyName = summary?.companyName || '';
  const gstin = summary?.gstin || '';
  const fyLabel = summary?.financialYearName || summary?.financialYear || '';
  const dateRange = `${summary?.fromDate ? formatDate(summary.fromDate) : filters.fromDate ? formatDate(filters.fromDate) : '—'} – ${summary?.toDate ? formatDate(summary.toDate) : filters.toDate ? formatDate(filters.toDate) : '—'
    }`;

  const isAllZero = useMemo(() => {
    if (!dto) return false;
    const values = [];
    SUMMARY_CARD_META.forEach((card) => {
      const v = pick(dto, card.paths);
      if (v !== undefined && v !== null && v !== '') values.push(num(v));
    });
    STATISTICS_CARD_META.forEach((card) => {
      const v = pick(dto, card.paths);
      if (v !== undefined && v !== null && v !== '') values.push(num(v));
    });
    return values.length > 0 && values.every((v) => v === 0);
  }, [dto]);

  const sectionValue = (sectionObj, field) => {
    const raw = pick(sectionObj, field.paths);
    const n = num(raw);
    return field.count ? n.toLocaleString('en-IN') : formatCurrency(n, 'INR');
  };

  // ── Dropdown options ───────────────────────────────────────────────────────
  const companyOptions = useMemo(() => {
    const list = accountCompanies.length ? accountCompanies : selectedCompany ? [selectedCompany] : [];
    return [
      { value: '', label: 'Select Company' },
      ...list.map((c) => ({ value: c.id ?? c.companyId, label: c.name || c.code || c.id })),
    ];
  }, [accountCompanies, selectedCompany]);

  const branchOptions = useMemo(
    () => [
      { value: '', label: 'All Branches' },
      ...branches.map((b) => ({ value: b.id, label: b.name || b.branchName || b.code || b.id })),
    ],
    [branches]
  );

  const registrationOptions = useMemo(
    () => [
      { value: '', label: 'All Registrations' },
      ...registrations.map((r) => ({
        value: r.id ?? r.gstin,
        label: r.registrationName || r.gstin || r.name || r.id,
        subLabel: r.gstin,
      })),
    ],
    [registrations]
  );

  const fiscalYearOptions = useMemo(
    () => [
      { value: '', label: 'All Financial Years' },
      ...fiscalYears.map((fy) => ({ value: fy.id, label: fy.name || fy.fiscalYear || fy.year || fy.id })),
    ],
    [fiscalYears]
  );

  const hsnOptions = useMemo(
    () => [
      { value: '', label: 'All HSN Codes' },
      ...hsnList.map((h) => ({
        value: h.hsnCode ?? h.hsn ?? h.code,
        label: `${h.hsnCode ?? h.hsn ?? h.code}${h.description ? ` — ${h.description}` : ''}`,
      })),
    ],
    [hsnList]
  );

  const customerOptions = useMemo(
    () => [
      { value: '', label: 'All Customers' },
      ...customers.map((c) => ({ value: c.id, label: c.customerName || c.name || c.id })),
    ],
    [customers]
  );

  const vendorOptions = useMemo(
    () => [
      { value: '', label: 'All Vendors' },
      ...vendors.map((v) => ({ value: v.id, label: v.vendorName || v.name || v.id })),
    ],
    [vendors]
  );

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Lock size={22} className="text-zinc-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-800">No access to GST Reports</h3>
        <p className="text-sm text-zinc-500 mt-1">You need the READ permission on GST_REPORTS to view this dashboard.</p>
      </div>
    );
  }

  const selectControl = { searchable: false };
  const selectProps = {
    onChange: handleFilterChange,
    buttonClassName:
      'w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none cursor-pointer',
    ...selectControl,
  };

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-[9.6px] font-medium text-zinc-400 flex-wrap mb-2">
                <span>Accounts</span>
                <ChevronRight size={12} />
                <span>Reports</span>
                <ChevronRight size={12} />
                <span>GST Reports</span>
                <ChevronRight size={12} />
                <span className="text-zinc-700">GST Summary</span>
              </nav>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                GST Summary Dashboard
              </h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Period-wise tax liability, input tax credit and compliance overview.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
               <ExportToolbar
                 options={exportOptions}
                 exporting={exporting}
                 canExport={canExport}
                 canPrint={canPrint}
                 onExport={handleExport}
                 onPrint={handlePrint}
               />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-6">

      {/* Filter panel */}
      <FilterCard
        subtitle="Select filters and click Search to generate the GST Summary dashboard."
        isLoading={isLoading}
        onSearch={handleSearch}
        onReset={handleReset}
        defaultOpen={false}
      >
        <Field label="Company">
          <CustomSelect name="companyId" value={filters.companyId} options={companyOptions} placeholder="Select Company" {...selectProps} />
        </Field>
        <Field label="Branch">
          <CustomSelect name="branchId" value={filters.branchId} options={branchOptions} placeholder="All Branches" {...selectProps} />
        </Field>
        <Field label="GST Registration">
          <CustomSelect
            name="gstRegistrationId"
            value={filters.gstRegistrationId}
            options={registrationOptions}
            placeholder="All Registrations"
            {...selectProps}
          />
        </Field>
        <Field label="Financial Year">
          <CustomSelect name="financialYearId" value={filters.financialYearId} options={fiscalYearOptions} placeholder="All Financial Years" {...selectProps} />
        </Field>
        <Field label="From Date">
          <TextField type="date" value={filters.fromDate} onChange={handleFilterChange} name="fromDate" />
        </Field>
        <Field label="To Date">
          <TextField type="date" value={filters.toDate} onChange={handleFilterChange} name="toDate" />
        </Field>
        <Field label="Invoice Type">
          <CustomSelect name="invoiceType" value={filters.invoiceType} options={GST_INVOICE_TYPES} placeholder="All Invoice Types" {...selectProps} />
        </Field>
        <Field label="State">
          <CustomSelect
            name="stateCode"
            value={filters.stateCode}
            options={[{ value: '', label: 'All States' }, ...GST_STATES]}
            placeholder="All States"
            {...selectProps}
          />
        </Field>
        <Field label="GST Rate">
          <CustomSelect name="gstRate" value={filters.gstRate} options={[{ value: '', label: 'All GST Rates' }, ...GST_RATES]} placeholder="All GST Rates" {...selectProps} />
        </Field>
        <Field label="HSN/SAC">
          <CustomSelect name="hsn" value={filters.hsn} options={hsnOptions} placeholder="All HSN Codes" searchable emptyMessage="No HSN codes available" buttonClassName={selectProps.buttonClassName} onChange={handleFilterChange} />
        </Field>
        <Field label="Customer">
          <CustomSelect name="customerId" value={filters.customerId} options={customerOptions} placeholder="All Customers" searchable emptyMessage="No customers available" buttonClassName={selectProps.buttonClassName} onChange={handleFilterChange} />
        </Field>
        <Field label="Vendor">
          <CustomSelect name="vendorId" value={filters.vendorId} options={vendorOptions} placeholder="All Vendors" searchable emptyMessage="No vendors available" buttonClassName={selectProps.buttonClassName} onChange={handleFilterChange} />
        </Field>
        <Field label="Sort By">
          <CustomSelect name="sortBy" value={filters.sortBy} options={SORT_OPTIONS} placeholder="Sort By" {...selectProps} />
        </Field>
        <Field label="Sort Direction">
          <CustomSelect name="sortDirection" value={filters.sortDirection} options={SORT_DIRECTION_OPTIONS} placeholder="Sort Direction" {...selectProps} />
        </Field>
        <Field label="Page Size">
          <CustomSelect name="pageSize" value={filters.pageSize} options={PAGE_SIZE_OPTIONS} placeholder="Page Size" {...selectProps} />
        </Field>
      </FilterCard>

      {!companyId ? (
        <EmptyState
          icon={Building2}
          title="Select a company to continue"
          description="Choose a company to load the GST Summary dashboard."
        />
      ) : !hasSearched ? (
        <EmptyState
          icon={Search}
          title="Click Search to generate the dashboard"
          description="Configure the filters above and press Search to load the GST Summary dashboard."
        />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState title="Unable to load GST Summary." message={error} onRetry={handleSearch} />
      ) : dto ? (
        <>
          {isAllZero && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-amber-800">
              <SearchX size={18} className="text-amber-500 shrink-0" />
              <p className="text-[10.4px] font-semibold">No GST transactions found for the selected filters.</p>
            </div>
          )}

          {/* Report header block */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 animate-slide-up">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <MetaItem label="Company" value={companyName || '—'} />
              <MetaItem label="GSTIN" value={gstin || '—'} />
              <MetaItem label="Financial Year" value={fyLabel || '—'} />
              <MetaItem label="Date Range" value={dateRange} />
              <MetaItem label="Generated At" value={generatedAtDisplay} />
              <MetaItem label="Generated By" value={generatedBy || '—'} />
            </div>
          </div>

          {/* KPI summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {SUMMARY_CARD_META.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                icon={card.icon}
                variant={card.variant}
                value={<AmountFormatter value={pick(dto, card.paths)} />}
              />
            ))}
          </div>

          {/* Sections 1–4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SUMMARY_SECTIONS.map((section) => {
              const sectionObj = dto?.[section.key] ?? {};
              return (
                <SectionCard
                  key={section.key}
                  title={section.title}
                  description={section.description}
                  icon={section.icon}
                  fields={section.fields.map((f) => ({ label: f.label, value: sectionValue(sectionObj, f) }))}
                />
              );
            })}
          </div>

          {/* Statistics */}
          <div>
            <h2 className="text-[12px] font-bold text-zinc-800 mb-3">Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {STATISTICS_CARD_META.map((card) => (
                <StatisticCard
                  key={card.label}
                  label={card.label}
                  icon={card.icon}
                  variant={card.variant}
                  value={num(pick(dto, card.paths)).toLocaleString('en-IN')}
                />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div>
            <h2 className="text-[12px] font-bold text-zinc-800 mb-3">Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {CHART_DEFINITIONS.map((def) => (
                <ChartCard
                  key={def.key}
                  title={def.title}
                  type={def.type}
                  xKey={def.xKey}
                  series={def.series}
                  rows={charts?.[def.key]}
                  emptyMessage="No chart data available."
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
      </div>
    </div>
  );
}
