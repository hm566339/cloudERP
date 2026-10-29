import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileSpreadsheet, Printer, Download, AlertCircle, FileText } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import ExportModal from '../../../components/common/ExportModal';
import CustomSelect from '../../../components/common/CustomSelect';
import {
  GstPeriodFilter,
  getDefaultPeriod,
  GstKpiCards,
  GstEmptyState,
} from '../components';

const SectionBox = ({ title, children }) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-border-dark">
      <div className="w-1.5 h-3.5 bg-primary rounded-full" />
      <h3 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const TaxMetricsCard = ({ title, fields = [], currency }) => (
  <div className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark shadow-2xs p-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
    <h4 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] pb-2 border-b border-zinc-100 dark:border-border-dark mb-3 truncate">
      {title}
    </h4>
    <div className="grid grid-cols-2 gap-3 mt-auto">
      {fields.map((f, idx) => (
        <div key={idx} className="min-w-0">
          <p className="text-[8px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase truncate mb-0.5">
            {f.label}
          </p>
          <p className={`text-xs sm:text-sm font-bold font-mono truncate ${f.color || 'text-zinc-900 dark:text-[#E6E8EE]'}`}>
            {currency} {formatCurrency(f.value || 0)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default function Gstr3bPage() {
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
    companyId: '',
    branchId: '',
    gstRegistrationId: '',
    financialYearId: '',
    invoiceType: 'ALL',
    stateCode: '',
    gstRate: '',
    customerId: '',
    vendorId: '',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

      if (currentFilters.branchId) payload.branchId = currentFilters.branchId;
      if (currentFilters.gstRegistrationId) payload.gstRegistrationId = currentFilters.gstRegistrationId;
      if (currentFilters.financialYearId) payload.financialYearId = currentFilters.financialYearId;
      if (currentFilters.invoiceType && currentFilters.invoiceType !== 'ALL') payload.invoiceType = currentFilters.invoiceType;
      if (currentFilters.stateCode) payload.stateCode = currentFilters.stateCode;
      if (currentFilters.gstRate) payload.gstRate = Number(currentFilters.gstRate);
      if (currentFilters.customerId) payload.customerId = currentFilters.customerId;
      if (currentFilters.vendorId) payload.vendorId = currentFilters.vendorId;

      if (isSystemAdmin && (currentFilters.companyId || companyId)) {
        payload.companyId = currentFilters.companyId || companyId;
      }

      return payload;
    },
    [companyId, filters, isSystemAdmin]
  );

  const { data, isLoading, error, refetch } = useGstReport({
    fetcher: gstReportsApi.getGstr3b,
  });

  useEffect(() => {
    if (companyId) {
      refetch(buildPayload());
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    refetch(buildPayload());
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

  const reportData = data?.data || data || {};

  const getTaxTotal = (supply) => {
    if (!supply) return 0;
    return (supply.cgst || 0) + (supply.sgst || 0) + (supply.igst || 0) + (supply.cess || 0);
  };

  const totalTaxableValue =
    (reportData?.outwardSupplies?.taxableAmount || 0) +
    (reportData?.zeroRatedSupplies?.taxableAmount || 0) +
    (reportData?.nilRatedExemptSupplies?.taxableAmount || 0) +
    (reportData?.inwardReverseChargeSupplies?.taxableAmount || 0) +
    (reportData?.nonGstOutwardSupplies?.taxableAmount || 0);

  const outputGst = getTaxTotal(reportData?.outwardSupplies) + getTaxTotal(reportData?.zeroRatedSupplies);
  const reverseChargeTax = getTaxTotal(reportData?.inwardReverseChargeSupplies);
  const totalTax = outputGst + reverseChargeTax;
  const itcClaimed = getTaxTotal(reportData?.inputTaxCredit?.totalItc);
  const netPayable = Math.max(0, totalTax - itcClaimed);

  const currency = selectedCompany?.baseCurrency || 'INR';

  const isZeroState = () => {
    return (
      !totalTaxableValue &&
      !outputGst &&
      !itcClaimed &&
      !netPayable &&
      !reverseChargeTax
    );
  };

  const summaryCards = [
    { label: 'Total Taxable Value', value: totalTaxableValue, isCurrency: true },
    { label: 'Output GST', value: outputGst, isCurrency: true, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Input Tax Credit', value: itcClaimed, isCurrency: true, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Net GST Liability', value: netPayable, isCurrency: true, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Reverse Charge', value: reverseChargeTax, isCurrency: true, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total GST', value: totalTax, isCurrency: true },
  ];

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['branchId', 'gstRegistrationId', 'financialYearId', 'invoiceType', 'stateCode', 'gstRate', 'customerId', 'vendorId'];
    return keys.filter((k) => filters[k] !== '' && filters[k] !== 'ALL').length;
  }, [filters]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="GSTR-3B Report"
        description="Monthly summary return of outward supplies, input tax credit claimed, and net tax liability"
        icon={FileSpreadsheet}
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
          showGstin={false}
          onSearch={handleSearch}
          onReset={handleClearFilters}
          isLoading={isLoading}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedCount={activeAdvancedFilterCount}
          searchButtonText="Generate Report"
          advancedContent={
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {isSystemAdmin && (
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Company ID</label>
                  <input
                    type="text"
                    value={filters.companyId}
                    onChange={(e) => handleFilterChange('companyId', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Branch ID</label>
                <input
                  type="text"
                  value={filters.branchId}
                  onChange={(e) => handleFilterChange('branchId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">GST Registration ID</label>
                <input
                  type="text"
                  value={filters.gstRegistrationId}
                  onChange={(e) => handleFilterChange('gstRegistrationId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Financial Year ID</label>
                <input
                  type="text"
                  value={filters.financialYearId}
                  onChange={(e) => handleFilterChange('financialYearId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Invoice Type</label>
                <CustomSelect
                  value={filters.invoiceType}
                  onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                >
                  <option value="ALL">All</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </CustomSelect>
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">State Code</label>
                <input
                  type="text"
                  value={filters.stateCode}
                  onChange={(e) => handleFilterChange('stateCode', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">GST Rate (%)</label>
                <input
                  type="number"
                  value={filters.gstRate}
                  onChange={(e) => handleFilterChange('gstRate', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8.8px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Customer ID</label>
                <input
                  type="text"
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          }
        />

        {error ? (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="text-[10.4px] font-medium text-red-700 dark:text-red-300">{error}</div>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 bg-zinc-200 dark:bg-[#1D212C] rounded-xl" />
              ))}
            </div>
            <div className="h-44 bg-zinc-200 dark:bg-[#1D212C] rounded-xl" />
          </div>
        ) : (
          <>
            {isZeroState() && (
              <GstEmptyState
                title="No GSTR-3B data available"
                description="Please try selecting a different return month or year."
                onReset={handleClearFilters}
              />
            )}

            {/* KPI Summary Cards */}
            <GstKpiCards cards={summaryCards} currency={currency} isLoading={isLoading} />

            {/* Section 1: Outward Taxable Supplies */}
            <SectionBox title="Section 3.1: Details of Outward Supplies & Inward Liable to Reverse Charge">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <TaxMetricsCard
                  title="Outward Taxable Supplies"
                  currency={currency}
                  fields={[
                    { label: 'Taxable', value: reportData?.outwardSupplies?.taxableAmount },
                    { label: 'IGST', value: reportData?.outwardSupplies?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CGST', value: reportData?.outwardSupplies?.cgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'SGST', value: reportData?.outwardSupplies?.sgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.outwardSupplies?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />

                <TaxMetricsCard
                  title="Zero Rated Supplies"
                  currency={currency}
                  fields={[
                    { label: 'Taxable', value: reportData?.zeroRatedSupplies?.taxableAmount },
                    { label: 'IGST', value: reportData?.zeroRatedSupplies?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.zeroRatedSupplies?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />

                <TaxMetricsCard
                  title="Nil Rated / Exempt Supplies"
                  currency={currency}
                  fields={[
                    { label: 'Taxable Amount', value: reportData?.nilRatedExemptSupplies?.taxableAmount },
                  ]}
                />

                <TaxMetricsCard
                  title="Inward Supplies (Reverse Charge)"
                  currency={currency}
                  fields={[
                    { label: 'Taxable', value: reportData?.inwardReverseChargeSupplies?.taxableAmount },
                    { label: 'IGST', value: reportData?.inwardReverseChargeSupplies?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CGST', value: reportData?.inwardReverseChargeSupplies?.cgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'SGST', value: reportData?.inwardReverseChargeSupplies?.sgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.inwardReverseChargeSupplies?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />
              </div>
            </SectionBox>

            {/* Section 2: Input Tax Credit (ITC) */}
            <SectionBox title="Section 4: Eligible Input Tax Credit (ITC)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TaxMetricsCard
                  title="Inward Reverse Charge ITC"
                  currency={currency}
                  fields={[
                    { label: 'IGST', value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CGST', value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.cgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'SGST', value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.sgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />

                <TaxMetricsCard
                  title="All Other ITC"
                  currency={currency}
                  fields={[
                    { label: 'IGST', value: reportData?.inputTaxCredit?.allOtherItc?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CGST', value: reportData?.inputTaxCredit?.allOtherItc?.cgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'SGST', value: reportData?.inputTaxCredit?.allOtherItc?.sgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.inputTaxCredit?.allOtherItc?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />

                <TaxMetricsCard
                  title="Total Eligible ITC"
                  currency={currency}
                  fields={[
                    { label: 'IGST', value: reportData?.inputTaxCredit?.totalItc?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CGST', value: reportData?.inputTaxCredit?.totalItc?.cgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'SGST', value: reportData?.inputTaxCredit?.totalItc?.sgst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.inputTaxCredit?.totalItc?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />
              </div>
            </SectionBox>

            {/* Section 3: Inward Non-GST & Imports */}
            <SectionBox title="Section 5: Inward Non-GST Supplies & Imports">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TaxMetricsCard
                  title="Non-GST Outward Supplies"
                  currency={currency}
                  fields={[
                    { label: 'Taxable Amount', value: reportData?.nonGstOutwardSupplies?.taxableAmount },
                  ]}
                />

                <TaxMetricsCard
                  title="Import of Goods"
                  currency={currency}
                  fields={[
                    { label: 'IGST', value: reportData?.imports?.goods?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.imports?.goods?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />

                <TaxMetricsCard
                  title="Import of Services"
                  currency={currency}
                  fields={[
                    { label: 'IGST', value: reportData?.imports?.services?.igst, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'CESS', value: reportData?.imports?.services?.cess, color: 'text-rose-600 dark:text-rose-400' },
                  ]}
                />
              </div>
            </SectionBox>

            {/* Bottom Summary Bar */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider mb-0.5">
                    Output GST
                  </p>
                  <p className="text-lg font-bold font-mono text-zinc-900 dark:text-[#E6E8EE]">
                    {currency} {formatCurrency(outputGst)}
                  </p>
                </div>

                <div className="text-zinc-300 dark:text-zinc-700 hidden sm:block">−</div>

                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider mb-0.5">
                    Input Tax Credit
                  </p>
                  <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {currency} {formatCurrency(itcClaimed)}
                  </p>
                </div>

                <div className="text-zinc-300 dark:text-zinc-700 hidden sm:block">=</div>

                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 dark:text-[#A0A6B5] uppercase tracking-wider mb-0.5">
                    Net GST Payable
                  </p>
                  <p className="text-xl font-bold font-mono text-primary">
                    {currency} {formatCurrency(netPayable)}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-zinc-200 dark:border-border-dark pt-3 md:pt-0 md:pl-5 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {reportData?.reportInfo?.reportName || 'GSTR-3B Summary'}
                </p>
                <p className="text-[10px] mt-0.5">
                  Filing Period: {reportData?.reportInfo?.reportingPeriod || `${filters.month}/${filters.year}`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gstr3b-export"
      />
    </div>
  );
}
