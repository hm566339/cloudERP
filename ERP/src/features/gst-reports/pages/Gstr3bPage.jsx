import React, { useState, useEffect, useCallback , useMemo} from 'react';
import ExportModal from '../../../components/common/ExportModal';
import { Search, RotateCcw, RefreshCw, Printer, Download, ChevronDown, ChevronUp, Filter, AlertCircle, FileText } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
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
const AmountFormatter = ({ value, currency }) => {
  return (
    <span>{currency} {formatCurrency(value || 0)}</span>
  );
};

const SummaryCard = ({ title, value, currency, highlightClass = "text-zinc-900" }) => (
  <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{title}</p>
    <p className={`text-xl font-bold ${highlightClass}`}>
      <AmountFormatter value={value} currency={currency} />
    </p>
  </div>
);

const InfoCard = ({ title, fields, currency }) => (
  <div className="bg-white rounded-lg border border-zinc-100 shadow-sm p-4 h-full flex flex-col">
    <h4 className="text-[10.4px] font-bold text-zinc-900 mb-3 pb-2 border-b border-zinc-100">{title}</h4>
    <div className="grid grid-cols-2 gap-4 mt-auto">
      {fields.map((f, idx) => (
        <div key={idx}>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">{f.label}</p>
          <p className={`text-sm font-semibold ${f.color || 'text-zinc-800'}`}>
            <AmountFormatter value={f.value} currency={currency} />
          </p>
        </div>
      ))}
    </div>
  </div>
);

const ReportSection = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-[11.2px] font-bold text-zinc-800 mb-3 pl-1 border-l-4 border-zinc-300">{title}</h3>
    {children}
  </div>
);

const EmptyState = () => (
  <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
    <FileText size={32} className="text-zinc-300 mb-3" />
    <h3 className="text-[11.2px] font-bold text-zinc-900">No GSTR-3B data available for the selected period.</h3>
    <p className="text-sm text-zinc-500 mt-1">Please try selecting a different month or year.</p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-200/60 rounded-xl"></div>)}
    </div>
    <div className="h-40 bg-zinc-200/60 rounded-xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-200/60 rounded-xl"></div>)}
    </div>
  </div>
);

export default function Gstr3bPage() {
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
    companyId: companyId,
    branchId: '',
    gstRegistrationId: '',
    financialYearId: '',
    month: defaultPeriod.month,
    year: defaultPeriod.year,
    invoiceType: 'ALL',
    stateCode: '',
    gstRate: '',
    customerId: '',
    vendorId: ''
  };

  const [filters, setFilters] = useState(initialFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  
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
    if (currentFilters.customerId) payloadFilters.customerId = currentFilters.customerId;
    if (currentFilters.vendorId) payloadFilters.vendorId = currentFilters.vendorId;

    return {
      filters: payloadFilters,
      pagination: { page: 1, size: 20 },
      sort: { field: 'invoiceDate', direction: 'DESC' }
    };
  }, [isSystemAdmin]);

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getGstr3b });
  // Disable automatic fetch on mount to "Remember the last selected filters" and "Call only when Generate Report is clicked" as requested,
  // but we should fetch once if company is present. 
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (companyId && !hasSearched) {
      refetch(buildPayload(filters));
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    refetch(buildPayload(filters));
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
      const payload = buildPayload(filters).filters;
      const blob = await gstReportsApi.exportReport('gstr3b', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GSTR-3B-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`);
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
  
  const isZeroState = () => {
    if (!reportData) return true;
    const isZero = (obj) => !obj || Object.values(obj).every(v => v === 0 || v === null || typeof v === 'object');
    return isZero(reportData.outwardSupplies) && 
           isZero(reportData.zeroRatedSupplies) && 
           isZero(reportData.inwardReverseChargeSupplies) && 
           isZero(reportData.inputTaxCredit?.totalItc);
  };

  const getTaxTotal = (obj) => {
    if (!obj) return 0;
    return (obj.igst || 0) + (obj.cgst || 0) + (obj.sgst || 0) + (obj.cess || 0);
  };
  
  const totalTaxableValue = (reportData?.outwardSupplies?.taxableAmount || 0) + 
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

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = ['branchId', 'gstRegistrationId', 'financialYearId', 'invoiceType', 'stateCode', 'gstRate', 'customerId', 'vendorId'];
    return keys.filter(k => filters[k] !== '' && filters[k] !== 'ALL').length;
  }, [filters]);

  const renderFilterCard = () => (
    <div className="bg-white p-4 border-b border-zinc-200 space-y-3">
      <form onSubmit={handleSearch}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Return Month</label>
              <CustomSelect
                value={filters.month}
                onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
              </CustomSelect>
            </div>
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Return Year</label>
              <CustomSelect
                value={filters.year}
                onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none cursor-pointer"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => <option key={y} value={y}>{y}</option>)}
              </CustomSelect>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button type="submit" disabled={isLoading} className="h-9 px-4 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50">
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Generate Report</span>
            </button>
            <button type="button" onClick={handleClearFilters} className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${showAdvancedFilters || activeAdvancedFilterCount > 0 ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
              <Filter size={14} />
              <span>Advanced Filters</span>
              {activeAdvancedFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">{activeAdvancedFilterCount}</span>}
              {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="pt-3 mt-3 border-t border-zinc-100 animate-in fade-in duration-200">
            <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {isSystemAdmin && (
                  <div>
                    <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Company ID</label>
                    <input type="text" value={filters.companyId} onChange={(e) => handleFilterChange('companyId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                  </div>
                )}
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Branch ID</label>
                  <input type="text" value={filters.branchId} onChange={(e) => handleFilterChange('branchId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Registration ID</label>
                  <input type="text" value={filters.gstRegistrationId} onChange={(e) => handleFilterChange('gstRegistrationId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Financial Year ID</label>
                  <input type="text" value={filters.financialYearId} onChange={(e) => handleFilterChange('financialYearId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Invoice Type</label>
                  <CustomSelect value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none">
                    <option value="ALL">All</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </CustomSelect>
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">State Code</label>
                  <input type="text" value={filters.stateCode} onChange={(e) => handleFilterChange('stateCode', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Rate (%)</label>
                  <input type="number" value={filters.gstRate} onChange={(e) => handleFilterChange('gstRate', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Customer ID</label>
                  <input type="text" value={filters.customerId} onChange={(e) => handleFilterChange('customerId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
                <div>
                  <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Vendor ID</label>
                  <input type="text" value={filters.vendorId} onChange={(e) => handleFilterChange('vendorId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 outline-none" />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">GSTR-3B Report</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Monthly GST Summary Return</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => window.print()} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                <Printer size={16} />
                Print
              </button>
              <button onClick={() => handleExport('pdf')} disabled={exportingType === 'pdf' || isLoading} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                {exportingType === 'pdf' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={exportingType === 'excel' || isLoading} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
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
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 mb-6 overflow-hidden">
          {renderFilterCard()}
        </div>

        {error ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <AlertCircle size={32} className="text-rose-500 mb-3" />
            <h3 className="text-[11.2px] font-bold text-zinc-900">Unable to generate GSTR-3B report.</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-4">{error}</p>
            <button onClick={() => refetch(buildPayload(filters))} className="btn-primary flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {isZeroState() && (
              <div className="mb-6">
                <EmptyState />
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard title="Total Taxable Value" value={totalTaxableValue} currency={currency} highlightClass="text-zinc-900" />
              <SummaryCard title="Output GST" value={outputGst} currency={currency} highlightClass="text-rose-600" />
              <SummaryCard title="Input Tax Credit" value={itcClaimed} currency={currency} highlightClass="text-emerald-600" />
              <SummaryCard title="Net GST Liability" value={netPayable} currency={currency} highlightClass="text-blue-600" />
              <SummaryCard title="Reverse Charge" value={reverseChargeTax} currency={currency} highlightClass="text-amber-600" />
              <SummaryCard title="Total GST" value={totalTax} currency={currency} highlightClass="text-zinc-900" />
            </div>

            <ReportSection title="Section 1: Outward Supplies">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title="Outward Taxable Supplies" currency={currency} fields={[
                  { label: "Taxable Amount", value: reportData?.outwardSupplies?.taxableAmount },
                  { label: "IGST", value: reportData?.outwardSupplies?.igst, color: 'text-emerald-600' },
                  { label: "CGST", value: reportData?.outwardSupplies?.cgst, color: 'text-emerald-600' },
                  { label: "SGST", value: reportData?.outwardSupplies?.sgst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.outwardSupplies?.cess, color: 'text-rose-600' }
                ]} />
              </div>
            </ReportSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <ReportSection title="Section 2: Zero Rated Supplies">
                <InfoCard title="Zero Rated" currency={currency} fields={[
                  { label: "Taxable Amount", value: reportData?.zeroRatedSupplies?.taxableAmount },
                  { label: "IGST", value: reportData?.zeroRatedSupplies?.igst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.zeroRatedSupplies?.cess, color: 'text-rose-600' }
                ]} />
              </ReportSection>

              <ReportSection title="Section 3: Nil Rated / Exempt">
                <InfoCard title="Nil Rated / Exempt Supplies" currency={currency} fields={[
                  { label: "Taxable Amount", value: reportData?.nilRatedExemptSupplies?.taxableAmount }
                ]} />
              </ReportSection>
            </div>

            <ReportSection title="Section 4: Reverse Charge">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title="Inward Supplies liable to Reverse Charge" currency={currency} fields={[
                  { label: "Taxable Amount", value: reportData?.inwardReverseChargeSupplies?.taxableAmount },
                  { label: "IGST", value: reportData?.inwardReverseChargeSupplies?.igst, color: 'text-emerald-600' },
                  { label: "CGST", value: reportData?.inwardReverseChargeSupplies?.cgst, color: 'text-emerald-600' },
                  { label: "SGST", value: reportData?.inwardReverseChargeSupplies?.sgst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.inwardReverseChargeSupplies?.cess, color: 'text-rose-600' }
                ]} />
              </div>
            </ReportSection>

            <ReportSection title="Section 5: Non GST Outward Supplies">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title="Non GST Supplies" currency={currency} fields={[
                  { label: "Taxable Amount", value: reportData?.nonGstOutwardSupplies?.taxableAmount }
                ]} />
              </div>
            </ReportSection>

            <ReportSection title="Section 6: Imports">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title="Goods" currency={currency} fields={[
                  { label: "IGST", value: reportData?.imports?.goods?.igst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.imports?.goods?.cess, color: 'text-rose-600' }
                ]} />
                <InfoCard title="Services" currency={currency} fields={[
                  { label: "IGST", value: reportData?.imports?.services?.igst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.imports?.services?.cess, color: 'text-rose-600' }
                ]} />
              </div>
            </ReportSection>

            <ReportSection title="Section 7: Input Tax Credit (ITC)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard title="Inward Reverse Charge ITC" currency={currency} fields={[
                  { label: "IGST", value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.igst, color: 'text-emerald-600' },
                  { label: "CGST", value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.cgst, color: 'text-emerald-600' },
                  { label: "SGST", value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.sgst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.inputTaxCredit?.inwardReverseChargeItc?.cess, color: 'text-rose-600' }
                ]} />
                <InfoCard title="All Other ITC" currency={currency} fields={[
                  { label: "IGST", value: reportData?.inputTaxCredit?.allOtherItc?.igst, color: 'text-emerald-600' },
                  { label: "CGST", value: reportData?.inputTaxCredit?.allOtherItc?.cgst, color: 'text-emerald-600' },
                  { label: "SGST", value: reportData?.inputTaxCredit?.allOtherItc?.sgst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.inputTaxCredit?.allOtherItc?.cess, color: 'text-rose-600' }
                ]} />
                <InfoCard title="Total ITC" currency={currency} fields={[
                  { label: "IGST", value: reportData?.inputTaxCredit?.totalItc?.igst, color: 'text-emerald-600' },
                  { label: "CGST", value: reportData?.inputTaxCredit?.totalItc?.cgst, color: 'text-emerald-600' },
                  { label: "SGST", value: reportData?.inputTaxCredit?.totalItc?.sgst, color: 'text-emerald-600' },
                  { label: "CESS", value: reportData?.inputTaxCredit?.totalItc?.cess, color: 'text-rose-600' }
                ]} />
              </div>
            </ReportSection>

            {/* Bottom Summary & Report Info */}
            <div className="bg-zinc-900 rounded-xl p-6 mt-8 flex flex-col md:flex-row items-center justify-between shadow-lg text-white">
              <div className="flex items-center gap-8 mb-4 md:mb-0">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Output GST</p>
                  <p className="text-xl font-bold"><AmountFormatter value={outputGst} currency={currency} /></p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Input GST</p>
                  <p className="text-xl font-bold text-emerald-400"><AmountFormatter value={itcClaimed} currency={currency} /></p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Net GST Payable</p>
                  <p className="text-2xl font-bold text-blue-400"><AmountFormatter value={netPayable} currency={currency} /></p>
                </div>
              </div>
              <div className="text-right border-t md:border-t-0 md:border-l border-zinc-700 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                <p className="text-xs text-zinc-400 font-medium">{reportData?.reportInfo?.reportName || 'GSTR-3B Report'}</p>
                <p className="text-xs text-zinc-400 font-medium">Period: {reportData?.reportInfo?.reportingPeriod || `${MONTHS[filters.month-1]} ${filters.year}`}</p>
                <p className="text-[8px] text-zinc-500 mt-1">
                  Generated At: {reportData?.reportInfo?.generatedAt ? new Date(reportData.reportInfo.generatedAt).toLocaleString('en-IN', {
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
        reportName="gstr3b-export"
      />
    </div>
  );
}
