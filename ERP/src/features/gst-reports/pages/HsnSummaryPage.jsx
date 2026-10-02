import React, { useState, useEffect, useCallback , useMemo} from 'react';
import ExportModal from '../../../components/common/ExportModal';
import { Search, RotateCcw, RefreshCw, Printer, Download, ChevronDown, ChevronUp, Filter, AlertCircle, X, FileText } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { gstReportsApi } from '../../../api/account/reports/gst';
import { useGstReport } from '../hooks/useGstReport';
import { formatCurrency } from '../../../utils/formatters';
import SortableHeader from '../../../components/common/SortableHeader';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
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

const SummaryCard = ({ title, value, currency, highlightClass = "text-zinc-900", isCurrency = true }) => (
  <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{title}</p>
    <p className={`text-xl font-bold ${highlightClass}`}>
      {isCurrency ? <AmountFormatter value={value} currency={currency} /> : (value || 0)}
    </p>
  </div>
);

const EmptyState = () => (
  <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-12 m-4 flex flex-col items-center justify-center text-center">
    <FileText size={32} className="text-zinc-300 mb-3" />
    <h3 className="text-[11.2px] font-bold text-zinc-900">No HSN Summary records found.</h3>
    <p className="text-sm text-zinc-500 mt-1">Please try selecting a different month or year.</p>
  </div>
);

const ExpandableRow = ({ record, selectedCompany, generatedAt, reportingPeriod }) => {
  const currency = selectedCompany?.baseCurrency || 'INR';
  return (
    <div className="p-5 flex flex-col bg-white rounded-lg shadow-sm m-4 border border-zinc-100">
      <div className="flex justify-between items-start mb-4 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">{record.hsnCode || '-'}</h3>
          <p className="text-[8.8px] text-zinc-500 font-medium tracking-wide mt-1">
            Description: <span className="font-semibold text-zinc-700">{record.description || '-'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-zinc-400 font-medium uppercase">Generated Period</p>
          <p className="text-xs font-bold text-zinc-700">{reportingPeriod || '-'}</p>
          <p className="text-[8px] text-zinc-400 mt-1">{generatedAt || '-'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Unit (UQC)</p>
          <p className="font-bold text-zinc-900 text-sm">{record.uqc || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Total Quantity</p>
          <p className="font-bold text-zinc-900 text-sm">{Number(record.quantity || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Taxable Value</p>
          <p className="font-bold text-zinc-900 text-sm">{currency} {formatCurrency(record.taxableValue || record.taxableAmount)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Total Tax</p>
          <p className="font-bold text-rose-600 text-sm">{currency} {formatCurrency((record.cgst || 0) + (record.sgst || 0) + (record.igst || 0) + (record.cess || 0))}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-zinc-100">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(record.cgst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">SGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(record.sgst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">IGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(record.igst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CESS</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(record.cess)}</p>
        </div>
      </div>
    </div>
  );
};

export default function HsnSummaryPage() {
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
    size: 10,
    sortBy: 'hsnCode', // Default sort
    sortDirection: 'ASC'
  };

  const [filters, setFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
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
    if (currentFilters.hsn) payloadFilters.hsn = currentFilters.hsn;
    if (currentFilters.customerId) payloadFilters.customerId = currentFilters.customerId;
    if (currentFilters.vendorId) payloadFilters.vendorId = currentFilters.vendorId;

    return {
      filters: payloadFilters,
      pagination: {
        page: currentFilters.page || 1,
        size: currentFilters.size || 10
      },
      sort: {
        field: currentFilters.sortBy || 'hsnCode',
        direction: currentFilters.sortDirection || 'ASC'
      }
    };
  }, [isSystemAdmin]);

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getHsnSummary });

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

  const handleColumnSort = (field) => {
    const direction = filters.sortBy === field && filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    setFilters(prev => {
      const next = { ...prev, sortBy: field, sortDirection: direction, page: 1 };
      refetch(buildPayload(next));
      return next;
    });
  };

  const handleExport = async (format) => {
    setExportingType(format);
    
    try {
      const payload = buildPayload(filters).filters; // Export takes filters in data envelope
      const blob = await gstReportsApi.exportReport('hsn-summary', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HSN-Summary-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`);
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

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  // Data Extraction
  const reportData = data?.data || data;
  const records = reportData?.records || reportData?.rows || [];
  const summary = reportData?.summary || reportData?.totals || {};
  const pagination = reportData?.pagination || null;
  const reportInfo = reportData?.reportInfo || {};

  const summaryCards = [
    { label: 'Total HSN Codes', value: summary.totalHsnCodes || 0, isCurrency: false, color: 'text-zinc-900' },
    { label: 'Total Quantity', value: summary.totalQuantity || 0, isCurrency: false, color: 'text-zinc-900' },
    { label: 'Total Taxable Value', value: summary.totalTaxableValue || 0, isCurrency: true, color: 'text-zinc-900' },
    { label: 'Total CGST', value: summary.totalCgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'Total SGST', value: summary.totalSgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'Total IGST', value: summary.totalIgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'Total CESS', value: summary.totalCess || 0, isCurrency: true, color: 'text-rose-600' },
  ];

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = ['branchId', 'gstRegistrationId', 'financialYearId', 'invoiceType', 'stateCode', 'gstRate', 'hsn', 'customerId', 'vendorId'];
    return keys.filter(k => filters[k] !== '' && filters[k] !== 'ALL').length;
  }, [filters]);

  const currency = selectedCompany?.baseCurrency || 'INR';

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">HSN Summary Report</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">HSN-wise summary of outward supplies</p>
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
        {error && (
          <div className="bg-white border border-rose-200 text-rose-700 p-8 rounded-xl mb-6 flex flex-col items-center text-center shadow-sm">
            <AlertCircle size={32} className="shrink-0 mb-3 text-rose-500" />
            <h3 className="text-[11.2px] font-bold">Unable to generate HSN Summary Report.</h3>
            <p className="text-sm text-rose-600/80 mt-1 mb-4">{error}</p>
            <button onClick={() => refetch(buildPayload(filters))} className="btn-primary flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 mb-6 overflow-hidden shrink-0">
          <div className="p-4 bg-white space-y-3">
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

                {/* Filter Control Buttons */}
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={isLoading} className="h-9 px-4 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50">
                    {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Generate Report</span>
                  </button>

                  <button type="button" onClick={handleClearFilters} className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95">
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  
                  <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                      showAdvancedFilters || activeAdvancedFilterCount > 0
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
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
                          <input type="text" value={filters.companyId} onChange={(e) => handleFilterChange('companyId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                        </div>
                      )}
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Branch ID</label>
                        <input type="text" value={filters.branchId} onChange={(e) => handleFilterChange('branchId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Registration ID</label>
                        <input type="text" value={filters.gstRegistrationId} onChange={(e) => handleFilterChange('gstRegistrationId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Financial Year ID</label>
                        <input type="text" value={filters.financialYearId} onChange={(e) => handleFilterChange('financialYearId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Invoice Type</label>
                        <CustomSelect value={filters.invoiceType} onChange={(e) => handleFilterChange('invoiceType', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer">
                          <option value="ALL">All Types</option>
                          <option value="B2B">B2B (Business to Business)</option>
                          <option value="B2C">B2C (Business to Consumer)</option>
                        </CustomSelect>
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">State Code</label>
                        <input type="text" value={filters.stateCode} onChange={(e) => handleFilterChange('stateCode', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Rate (%)</label>
                        <input type="number" value={filters.gstRate} onChange={(e) => handleFilterChange('gstRate', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">HSN/SAC Code</label>
                        <input type="text" value={filters.hsn} onChange={(e) => handleFilterChange('hsn', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Customer ID</label>
                        <input type="text" value={filters.customerId} onChange={(e) => handleFilterChange('customerId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Vendor ID</label>
                        <input type="text" value={filters.vendorId} onChange={(e) => handleFilterChange('vendorId', e.target.value)} className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryCards.length > 0 && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6 shrink-0">
            {summaryCards.map((card, idx) => (
              <SummaryCard key={idx} {...card} currency={currency} />
            ))}
          </div>
        )}

        {!error && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
            {/* Table */}
            <div className="overflow-auto bg-white">
              <table className="w-full table-fixed text-left text-[10.4px] min-w-[800px]">
                <thead className="bg-zinc-50/80 sticky top-0 z-10 backdrop-blur-xs border-b border-zinc-200 text-zinc-500 font-medium whitespace-nowrap">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <SortableHeader field="hsnCode" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[12%]">HSN Code</SortableHeader>
                    <SortableHeader field="description" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[20%]">Description</SortableHeader>
                    <SortableHeader field="uqc" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%]">UQC</SortableHeader>
                    <SortableHeader field="quantity" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">Quantity</SortableHeader>
                    <SortableHeader field="taxableValue" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[12%] text-right">Taxable Value</SortableHeader>
                    <SortableHeader field="cgst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">CGST</SortableHeader>
                    <SortableHeader field="sgst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">SGST</SortableHeader>
                    <SortableHeader field="igst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">IGST</SortableHeader>
                    <SortableHeader field="cess" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">CESS</SortableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <TableRowSkeleton columns={10} rows={10} />
                  ) : !records || records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    records.map((record, index) => {
                      const rowId = record.hsnCode || index;
                      const isExpanded = expandedRowId === rowId;
                      
                      return (
                        <React.Fragment key={rowId}>
                          <tr 
                            className={`hover:bg-zinc-50/80 transition-colors cursor-pointer group ${isExpanded ? 'bg-zinc-50/80' : ''}`}
                            onClick={() => toggleRow(rowId)}
                          >
                            <td className="p-4 text-center text-zinc-400 align-middle">
                              {((filters.page - 1) * filters.size) + index + 1}
                            </td>
                            <td className="p-4 align-middle font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors truncate whitespace-nowrap">
                              {record.hsnCode || '-'}
                            </td>
                            <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                              {record.description || '-'}
                            </td>
                            <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                              {record.uqc || '-'}
                            </td>
                            <td className="p-4 align-middle text-[10.4px] text-zinc-700 text-right font-medium whitespace-nowrap">
                              {Number(record.quantity || 0).toLocaleString()}
                            </td>
                            <td className="p-4 align-middle text-right whitespace-nowrap">
                              <span className="font-medium text-zinc-900">
                                {formatCurrency(record.taxableValue ?? record.taxableAmount)}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-right whitespace-nowrap">
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(record.cgst)}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-right whitespace-nowrap">
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(record.sgst)}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-right whitespace-nowrap">
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(record.igst)}
                              </span>
                            </td>
                            <td className="p-4 align-middle text-right whitespace-nowrap">
                              <span className="font-medium text-rose-600">
                                {formatCurrency(record.cess)}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="p-0 bg-zinc-50/50 border-b border-zinc-200/50">
                                <ExpandableRow 
                                  record={record} 
                                  selectedCompany={selectedCompany} 
                                  reportingPeriod={reportInfo.reportingPeriod || `${MONTHS[filters.month-1]} ${filters.year}`}
                                  generatedAt={reportInfo.generatedAt ? new Date(reportInfo.generatedAt).toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  }) : new Date().toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
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
                onPageSizeChange={(newSize) => {
                  setFilters(prev => {
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
