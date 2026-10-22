import React, { useState, useEffect, useCallback , useMemo} from 'react';
import ExportModal from '../../../components/common/ExportModal';
import { Search, RotateCcw, RefreshCw, Printer, Download, ChevronDown, ChevronUp, Filter, AlertCircle, FileText, ChevronRight, X } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
import Pagination from '../../../components/common/Pagination';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDefaultPeriod() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  return { month, year };
}

// Reusable Components
const AmountFormatter = ({ value, currency, showCurrency = true }) => {
  return (
    <span>{showCurrency ? `${currency} ` : ''}{formatCurrency(value || 0)}</span>
  );
};

const SummaryCard = ({ title, value, currency, highlightClass = "text-zinc-900 dark:text-[#E6E8EE]", isCurrency = true }) => (
  <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{title}</p>
    <p className={`text-xl font-bold ${highlightClass}`}>
      {isCurrency ? <AmountFormatter value={value} currency={currency} /> : (value || 0)}
    </p>
  </div>
);

const TaxBreakdownCard = ({ title, data, currency }) => (
  <div className="bg-white dark:bg-[#161922] rounded-lg border border-zinc-100 dark:border-[#2A2F3D] shadow-sm p-4 h-full flex flex-col">
    <h4 className="text-[10.4px] font-bold text-zinc-900 dark:text-[#E6E8EE] mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">{title}</h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
      <div>
        <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CGST</p>
        <p className="text-sm font-semibold text-emerald-600">
          <AmountFormatter value={data?.cgst} currency={currency} />
        </p>
      </div>
      <div>
        <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">SGST</p>
        <p className="text-sm font-semibold text-emerald-600">
          <AmountFormatter value={data?.sgst} currency={currency} />
        </p>
      </div>
      <div>
        <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">IGST</p>
        <p className="text-sm font-semibold text-emerald-600">
          <AmountFormatter value={data?.igst} currency={currency} />
        </p>
      </div>
      <div>
        <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CESS</p>
        <p className="text-sm font-semibold text-rose-600">
          <AmountFormatter value={data?.cess} currency={currency} />
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-12 m-4 flex flex-col items-center justify-center text-center">
    <FileText size={32} className="text-zinc-300 mb-3" />
    <h3 className="text-[11.2px] font-bold text-zinc-900 dark:text-[#E6E8EE]">No ITC Report data found for the selected period.</h3>
    <p className="text-sm text-zinc-500 mt-1">Please try selecting a different month or year.</p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-zinc-200/60 rounded-xl"></div>)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1,2].map(i => <div key={i} className="h-28 bg-zinc-200/60 rounded-xl"></div>)}
    </div>
    <div className="h-64 bg-zinc-200/60 rounded-xl"></div>
  </div>
);

export default function ItcPage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const dispatch = useDispatch();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const fallbackCompanyId = (() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
    } catch { return null; }
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
    page: 1, // Fixed 1-based index
    size: 20,
    sortBy: 'invoiceDate',
    sortDirection: 'DESC'
  };

  const [filters, setFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  const buildPayload = useCallback((currentFilters) => {
    const start = new Date(currentFilters.year, currentFilters.month - 1, 1);
    const end = new Date(currentFilters.year, currentFilters.month, 0); 

    const pad = (n) => String(n).padStart(2, '0');
    const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

    const payloadFilters = {
      fromDate,
      toDate,
      invoiceType: currentFilters.invoiceType || 'ALL'
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
        size: currentFilters.size || 20
      },
      sort: {
        field: currentFilters.sortBy || 'invoiceDate',
        direction: currentFilters.sortDirection || 'DESC'
      }
    };
  }, [isSystemAdmin]);

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getItc });

  useEffect(() => {
    if (companyId && !hasSearched) {
      refetch(buildPayload(filters));
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFilters(prev => {
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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = async (format) => {
    setExportingType(format);
    
    try {
      const payload = buildPayload(filters).filters; // Export takes filters in data envelope
      const blob = await gstReportsApi.exportReport('itc', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ITC-Report-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      dispatch(addAlert({ type: 'success', message: 'Report exported successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to export report' }));
    } finally {
      setExportingType(null);
    }
  };

  // Data Extraction
  const reportData = data?.data || data;
  const summary = reportData?.summary || {};
  const itcAvailed = reportData?.itcAvailed || {};
  const itcUtilized = reportData?.itcUtilized || {};
  const pagination = reportData?.pagination || null;
  const reportInfo = reportData?.reportInfo || {};
  
  const isZeroState = () => {
    if (!reportData) return true;
    const isZero = (obj) => !obj || Object.values(obj).every(v => v === 0 || v === null || typeof v === 'object');
    return isZero(itcAvailed) && isZero(itcUtilized) && !summary.closingBalance && !reportData.openingBalance;
  };

  const summaryCards = [
    { label: 'Opening Balance', value: reportData?.openingBalance || 0, color: 'text-zinc-900' },
    { label: 'Total ITC Availed', value: summary.totalItcAvailed || 0, color: 'text-emerald-600' },
    { label: 'Total ITC Utilized', value: summary.totalItcUtilized || 0, color: 'text-rose-600' },
    { label: 'Net ITC Available', value: summary.netItcAvailable || 0, color: 'text-blue-600' },
    { label: 'Closing Balance', value: summary.closingBalance || 0, color: 'text-zinc-900' },
  ];

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = ['branchId', 'gstRegistrationId', 'financialYearId', 'invoiceType', 'stateCode', 'gstRate', 'hsn', 'customerId', 'vendorId'];
    return keys.filter(k => filters[k] !== '' && filters[k] !== 'ALL').length;
  }, [filters]);

  const currency = selectedCompany?.baseCurrency || 'INR';

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight">ITC Report</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Input Tax Credit Report</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => window.print()} className="h-9 px-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                <Printer size={16} />
                Print
              </button>
              <button onClick={() => handleExport('pdf')} disabled={exportingType === 'pdf' || isLoading} className="h-9 px-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                {exportingType === 'pdf' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={exportingType === 'excel' || isLoading} className="h-9 px-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                {exportingType === 'excel' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                Excel
              </button>
              <button onClick={() => handleExport('csv')} disabled={exportingType === 'csv' || isLoading} className="h-9 px-4 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-900 outline-none flex items-center gap-2">
                {exportingType === 'csv' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-6">
        {/* Filter Card */}
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-zinc-200 dark:border-border-dark mb-6 overflow-hidden shrink-0">
          <div className="p-4 bg-white dark:bg-card-dark space-y-3">
            <form onSubmit={handleSearch}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Return Month</label>
                    <CustomSelect
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                      className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none cursor-pointer"
                    >
                      {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Return Year</label>
                    <CustomSelect
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                      className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => <option key={y} value={y}>{y}</option>)}
                    </CustomSelect>
                  </div>
                </div>

                {/* Filter Control Buttons */}
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={isLoading} className="h-9 px-4 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50">
                    {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Generate Report</span>
                  </button>

                  <button type="button" onClick={handleClearFilters} className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95">
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  
                  <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                      showAdvancedFilters || activeAdvancedFilterCount > 0
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                        : 'bg-white dark:bg-surface-dark border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-hover-dark/40'
                    }`}>
                    <Filter size={14} />
                    <span>Advanced Filters</span>
                    {activeAdvancedFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">{activeAdvancedFilterCount}</span>}
                    {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Advanced Filter Panel */}
              {showAdvancedFilters && (
                <div className="pt-3 mt-3 border-t border-zinc-100 animate-in fade-in duration-200">
                  <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter size={13} className="text-zinc-500" /> Advanced Filters
                      </span>
                      <button type="button" onClick={() => setShowAdvancedFilters(false)} className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
                        <X size={14} /> Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      {isSystemAdmin && (
                        <div>
                          <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Company ID</label>
                          <input type="text" value={filters.companyId} onChange={(e) => handleFilterChange('companyId', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                        </div>
                      )}
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Branch ID</label>
                        <input type="text" value={filters.branchId} onChange={(e) => handleFilterChange('branchId', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Registration ID</label>
                        <input type="text" value={filters.gstRegistrationId} onChange={(e) => handleFilterChange('gstRegistrationId', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Financial Year ID</label>
                        <input type="text" value={filters.financialYearId} onChange={(e) => handleFilterChange('financialYearId', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Invoice Type</label>
                        <CustomSelect value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer">
                          <option value="ALL">All Types</option>
                          <option value="B2B">B2B (Business to Business)</option>
                          <option value="B2C">B2C (Business to Consumer)</option>
                        </CustomSelect>
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">State Code</label>
                        <input type="text" value={filters.stateCode} onChange={(e) => handleFilterChange('stateCode', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Rate (%)</label>
                        <input type="number" value={filters.gstRate} onChange={(e) => handleFilterChange('gstRate', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Vendor ID</label>
                        <input type="text" value={filters.vendorId} onChange={(e) => handleFilterChange('vendorId', e.target.value)} className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {error ? (
          <div className="bg-white dark:bg-card-dark border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 p-8 rounded-xl mb-6 flex flex-col items-center text-center shadow-sm">
            <AlertCircle size={32} className="shrink-0 mb-3 text-rose-500" />
            <h3 className="text-[11.2px] font-bold">Unable to generate ITC Report.</h3>
            <p className="text-sm text-rose-600/80 mt-1 mb-4">{error}</p>
            <button onClick={() => refetch(buildPayload(filters))} className="btn-primary flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Summary Cards */}
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
                {summaryCards.map((card, idx) => (
                  <SummaryCard key={idx} title={card.label} value={card.value} currency={currency} highlightClass={card.color} />
                ))}
              </div>
            )}
            
            {/* Tax Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
              <TaxBreakdownCard title="ITC Availed" data={itcAvailed} currency={currency} />
              <TaxBreakdownCard title="ITC Utilized" data={itcUtilized} currency={currency} />
            </div>

            {isZeroState() ? (
              <div className="mb-6">
                <EmptyState />
              </div>
            ) : (
              <>
                {/* Summary Table */}
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-zinc-200 dark:border-border-dark flex flex-col overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.4px] min-w-[640px]">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[8.8px] whitespace-nowrap">
                        <tr>
                          <th className="p-4 w-[25%] border-r border-zinc-100">Category</th>
                          <th className="p-4 w-[15%] text-right">CGST</th>
                          <th className="p-4 w-[15%] text-right">SGST</th>
                          <th className="p-4 w-[15%] text-right">IGST</th>
                          <th className="p-4 w-[15%] text-right">CESS</th>
                          <th className="p-4 w-[15%] text-right text-zinc-900 bg-zinc-50/50">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {/* Opening Balance */}
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-4 font-semibold text-zinc-700 border-r border-zinc-100">Opening Balance</td>
                          <td colSpan={4} className="p-4 text-center text-zinc-400">-</td>
                          <td className="p-4 text-right font-bold text-zinc-900 bg-zinc-50/20">
                            <AmountFormatter value={reportData?.openingBalance} currency={currency} />
                          </td>
                        </tr>
                        
                        {/* ITC Availed */}
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-4 font-semibold text-emerald-700 border-r border-zinc-100">ITC Availed</td>
                          <td className="p-4 text-right font-medium text-emerald-600"><AmountFormatter value={itcAvailed?.cgst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-emerald-600"><AmountFormatter value={itcAvailed?.sgst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-emerald-600"><AmountFormatter value={itcAvailed?.igst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-emerald-600"><AmountFormatter value={itcAvailed?.cess} currency={currency} /></td>
                          <td className="p-4 text-right font-bold text-emerald-700 bg-emerald-50/30">
                            <AmountFormatter value={summary.totalItcAvailed} currency={currency} />
                          </td>
                        </tr>
                        
                        {/* ITC Utilized */}
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-4 font-semibold text-rose-700 border-r border-zinc-100">ITC Utilized</td>
                          <td className="p-4 text-right font-medium text-rose-600"><AmountFormatter value={itcUtilized?.cgst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-rose-600"><AmountFormatter value={itcUtilized?.sgst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-rose-600"><AmountFormatter value={itcUtilized?.igst} currency={currency} /></td>
                          <td className="p-4 text-right font-medium text-rose-600"><AmountFormatter value={itcUtilized?.cess} currency={currency} /></td>
                          <td className="p-4 text-right font-bold text-rose-700 bg-rose-50/30">
                            <AmountFormatter value={summary.totalItcUtilized} currency={currency} />
                          </td>
                        </tr>
                        
                        {/* Closing Balance */}
                        <tr className="bg-zinc-50/60 border-t-2 border-zinc-200">
                          <td className="p-4 font-bold text-zinc-900 border-r border-zinc-100">Closing Balance</td>
                          <td colSpan={4} className="p-4 text-center text-zinc-400">-</td>
                          <td className="p-4 text-right font-bold text-blue-700 bg-blue-50/40">
                            <AmountFormatter value={summary.closingBalance} currency={currency} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expandable Section */}
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-zinc-200 dark:border-border-dark mb-6 overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  >
                    <h3 className="text-[11.2px] font-bold text-zinc-900 dark:text-[#E6E8EE]">ITC Summary</h3>
                    {isSummaryExpanded ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                  </div>
                  
                  {isSummaryExpanded && (
                    <div className="p-4 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-sm">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Opening Balance</p>
                          <p className="text-sm font-bold text-zinc-900"><AmountFormatter value={reportData?.openingBalance} currency={currency} /></p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-sm">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Total Availed</p>
                          <p className="text-sm font-bold text-emerald-600"><AmountFormatter value={summary.totalItcAvailed} currency={currency} /></p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-sm">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Total Utilized</p>
                          <p className="text-sm font-bold text-rose-600"><AmountFormatter value={summary.totalItcUtilized} currency={currency} /></p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-sm">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Net Available</p>
                          <p className="text-sm font-bold text-blue-600"><AmountFormatter value={summary.netItcAvailable} currency={currency} /></p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-sm ring-1 ring-zinc-900/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Closing Balance</p>
                          <p className="text-sm font-bold text-zinc-900"><AmountFormatter value={summary.closingBalance} currency={currency} /></p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {pagination && (pagination.totalPages > 1 || filters.page > 1) && (
                  <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-zinc-200 dark:border-border-dark mb-6 overflow-hidden">
                    <Pagination
                      currentPage={filters.page} // 1-indexed in our state
                      totalPages={pagination.totalPages || 1}
                      onPageChange={(newPage) => {
                        setFilters(prev => {
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
              </>
            )}

            {/* Bottom Report Info */}
            <div className="bg-zinc-900 rounded-xl p-6 mt-2 flex flex-col md:flex-row items-center justify-between shadow-lg text-white">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <FileText size={24} className="text-zinc-400" />
                <div>
                  <p className="text-[11.2px] font-bold text-white">{reportInfo?.reportName || 'ITC Report'}</p>
                  <p className="text-xs text-zinc-400 font-medium mt-1">Period: {reportInfo?.reportingPeriod || `${MONTHS[filters.month-1]} ${filters.year}`}</p>
                </div>
              </div>
              <div className="text-right border-t md:border-t-0 md:border-l border-zinc-700 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Generated At</p>
                <p className="text-sm text-zinc-300 font-medium">
                  {reportInfo?.generatedAt ? new Date(reportInfo.generatedAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : new Date().toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
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
