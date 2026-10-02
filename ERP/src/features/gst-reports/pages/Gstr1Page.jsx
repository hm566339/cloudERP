import React, { useState, useEffect, useCallback , useMemo} from 'react';
import ExportModal from '../../../components/common/ExportModal';
import { Search, RotateCcw, RefreshCw, Printer, Download, ChevronDown, ChevronUp, Filter, AlertCircle, X } from 'lucide-react';
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

const getStatusBadge = (status) => {
  switch (status) {
    case 'POSTED': 
    case 'APPROVED': 
    case 'REGULAR':
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{status}</span>;
    case 'CANCELLED': 
    case 'REJECTED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-rose-50 text-rose-700 border-rose-200">{status}</span>;
    case 'DRAFT': 
    case 'REVERSED': 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">{status}</span>;
    case 'SUBMITTED': 
    default: 
      return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">{status || '-'}</span>;
  }
};

const InvoiceOverview = ({ invoice, selectedCompany }) => {
  const currency = selectedCompany?.baseCurrency || 'INR';
  return (
    <div className="p-5 flex flex-col bg-white rounded-lg shadow-sm m-4 border border-zinc-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">{invoice.invoiceNumber || '-'}</h3>
          <p className="text-[8.8px] text-zinc-500 font-medium tracking-wide mt-1">
            Date: <span className="font-semibold text-zinc-700">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</span> | 
            Type: <span className="font-semibold text-zinc-700">{invoice.invoiceType ? invoice.invoiceType.replace(/_/g, ' ') : '-'}</span> | 
            GSTIN: <span className="font-semibold text-zinc-700">{invoice.gstin || '-'}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Customer</p>
          <p className="font-bold text-zinc-900 text-sm">{invoice.customerName || invoice.partyName || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Taxable Value</p>
          <p className="font-bold text-zinc-900 text-sm">{currency} {formatCurrency(invoice.taxableAmount ?? invoice.taxableValue)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Total Tax</p>
          <p className="font-bold text-zinc-900 text-sm">{currency} {formatCurrency((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0) + (invoice.cess || 0))}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Total Value</p>
          <p className="font-bold text-emerald-600 text-sm">{currency} {formatCurrency(invoice.totalInvoiceValue)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">Place of Supply</p>
          <p className="font-bold text-zinc-900 text-sm">{invoice.placeOfSupply || invoice.stateCode || '-'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-100">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(invoice.cgst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">SGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(invoice.sgst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">IGST</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(invoice.igst)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-0.5">CESS</p>
          <p className="text-sm text-zinc-700">{currency} {formatCurrency(invoice.cess)}</p>
        </div>
      </div>
    </div>
  );
};

export default function Gstr1Page() {
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
    gstin: '',
    invoiceType: '',
    stateCode: '',
    gstRate: '',
    hsn: '',
    customerId: '',
    page: 1, // Fixed 1-based index
    size: 10,
    sortBy: 'invoiceDate',
    sortDirection: 'DESC'
  };

  const [filters, setFilters] = useState(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  
  const buildPayload = useCallback((currentFilters) => {
    const start = new Date(currentFilters.year, currentFilters.month - 1, 1);
    const end = new Date(currentFilters.year, currentFilters.month, 0); 

    const pad = (n) => String(n).padStart(2, '0');
    const fromDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const toDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

    const payload = {
      filters: {
        fromDate,
        toDate,
      },
      pagination: {
        page: currentFilters.page || 1,
        size: currentFilters.size || 10
      },
      sort: {
        field: currentFilters.sortBy || 'invoiceDate',
        direction: currentFilters.sortDirection || 'DESC'
      }
    };
    
    if (isSystemAdmin && companyId) {
      payload.filters.companyId = companyId;
    }
    
    // Add advanced filters if present
    if (currentFilters.invoiceType) payload.filters.invoiceType = currentFilters.invoiceType;
    if (currentFilters.stateCode) payload.filters.stateCode = currentFilters.stateCode;
    if (currentFilters.gstRate) payload.filters.gstRate = Number(currentFilters.gstRate);
    if (currentFilters.hsn) payload.filters.hsn = currentFilters.hsn;
    if (currentFilters.customerId) payload.filters.customerId = currentFilters.customerId;
    // Add Gstin if present, backend doesn't officially support 'gstin' in GstReportFilterDto but let's pass to generic
    // payload if needed. Actually it uses gstRegistrationId for UUIDs. We will skip passing invalid UUID to avoid 400.
    
    return payload;
  }, [companyId, isSystemAdmin]);

  const { data, isLoading, error, refetch } = useGstReport({ fetcher: gstReportsApi.getGstr1 });

  useEffect(() => {
    if (companyId) {
      refetch(buildPayload(filters));
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
    setHasSearched(false);
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
    if (format === 'pdf') setExportingPdf(true);
    else setExportingExcel(true);
    
    try {
      const payload = buildPayload(filters).filters; // Export takes filters in data envelope
      const blob = await gstReportsApi.exportReport('gstr1', payload, format);
      if (!blob || blob.size === 0) {
        dispatch(addAlert({ type: 'error', message: 'Export returned an empty file' }));
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GSTR-1-${filters.year}-${String(filters.month).padStart(2, '0')}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      dispatch(addAlert({ type: 'success', message: 'Report exported successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to export report' }));
    } finally {
      if (format === 'pdf') setExportingPdf(false);
      else setExportingExcel(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  // Data Extraction
  const records = data?.data?.records || data?.records || [];
  const summary = data?.data?.summary || data?.summary || {};
  const pagination = data?.data?.pagination || data?.pagination || null;

  const summaryCards = [
    { label: 'Total Invoices', value: summary.totalInvoices || 0, isCurrency: false, color: 'text-zinc-900' },
    { label: 'Taxable Value', value: summary.totalTaxableAmount || summary.totalTaxableValue || 0, isCurrency: true, color: 'text-blue-600' },
    { label: 'CGST', value: summary.totalCgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'SGST', value: summary.totalSgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'IGST', value: summary.totalIgst || 0, isCurrency: true, color: 'text-emerald-600' },
    { label: 'Total Tax', value: summary.totalTax || (summary.totalCgst + summary.totalSgst + summary.totalIgst + (summary.totalCess||0)) || 0, isCurrency: true, color: 'text-rose-600' },
  ];

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = ['invoiceType', 'stateCode', 'gstRate', 'hsn', 'customerId'];
    return keys.filter(k => filters[k] !== '').length;
  }, [filters]);

  const currency = selectedCompany?.baseCurrency || 'INR';

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">GSTR-1 Report</h1>
              <p className="text-sm font-medium text-zinc-500 mt-1">Monthly outward GST return</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => window.print()} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                <Printer size={16} />
                Print
              </button>
              <button onClick={() => handleExport('pdf')} disabled={exportingPdf || isLoading} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 outline-none flex items-center gap-2">
                {exportingPdf ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                Export PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={exportingExcel || isLoading} className="h-9 px-4 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-900 outline-none flex items-center gap-2">
                {exportingExcel ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summaryCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            {summaryCards.map((card, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
                <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`}>
                  {card.isCurrency ? `${currency} ` : ''}{card.isCurrency ? formatCurrency(card.value) : card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 flex flex-col h-full overflow-hidden">
          {/* Filter Bar Section */}
          <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
            <form onSubmit={handleSearch}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  {/* Return Month */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      Return Month
                    </label>
                    <CustomSelect
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all cursor-pointer"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </CustomSelect>
                  </div>

                  {/* Return Year */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      Return Year
                    </label>
                    <CustomSelect
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all cursor-pointer"
                    >
                      {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </CustomSelect>
                  </div>
                  
                  {/* GSTIN */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={filters.gstin}
                      onChange={(e) => handleFilterChange('gstin', e.target.value)}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      maxLength={15}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Filter Control Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-9 px-4 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Search</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95"
                    title="Reset All Filters"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`h-9 px-3 text-[10.4px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 active:scale-95 ${
                      showAdvancedFilters || activeAdvancedFilterCount > 0
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-900 shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <Filter size={14} />
                    <span>Advanced Filters</span>
                    {activeAdvancedFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                    {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Advanced Filter Panel */}
              {showAdvancedFilters && (
                <div className="pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.6px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter size={13} className="text-zinc-500" />
                        Advanced Filters
                      </span>
                      <button
                         type="button"
                         onClick={() => setShowAdvancedFilters(false)}
                         className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                      >
                        <X size={14} />
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Invoice Type</label>
                        <CustomSelect
                          value={filters.invoiceType}
                          onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer"
                        >
                          <option value="">All Types</option>
                          <option value="B2B">B2B (Business to Business)</option>
                          <option value="B2C">B2C (Business to Consumer)</option>
                          <option value="EXPORT">Export</option>
                        </CustomSelect>
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">State Code</label>
                        <input
                          type="text"
                          value={filters.stateCode}
                          onChange={(e) => handleFilterChange('stateCode', e.target.value)}
                          placeholder="e.g. 27"
                          maxLength={2}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">GST Rate (%)</label>
                        <input
                          type="number"
                          value={filters.gstRate}
                          onChange={(e) => handleFilterChange('gstRate', e.target.value)}
                          placeholder="e.g. 18"
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">HSN/SAC Code</label>
                        <input
                          type="text"
                          value={filters.hsn}
                          onChange={(e) => handleFilterChange('hsn', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Customer ID</label>
                        <input
                          type="text"
                          value={filters.customerId}
                          onChange={(e) => handleFilterChange('customerId', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full table-fixed text-left text-[10.4px] min-w-[960px]">
              <thead className="bg-zinc-50/80 sticky top-0 z-10 backdrop-blur-xs border-b border-zinc-200 text-zinc-500 font-medium whitespace-nowrap">
                <tr>
                  <th className="p-4 w-10 text-center">#</th>
                  <SortableHeader field="customerName" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[12%]">Party</SortableHeader>
                  <th className="p-4 w-[10%]">GSTIN</th>
                  <SortableHeader field="invoiceNumber" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%]">Invoice No</SortableHeader>
                  <SortableHeader field="invoiceDate" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%]">Date</SortableHeader>
                  <th className="p-4 w-[8%]">Type</th>
                  <SortableHeader field="taxableAmount" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%] text-right">Taxable</SortableHeader>
                  <SortableHeader field="cgst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%] text-right">CGST</SortableHeader>
                  <SortableHeader field="sgst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%] text-right">SGST</SortableHeader>
                  <SortableHeader field="igst" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[8%] text-right">IGST</SortableHeader>
                  <SortableHeader field="totalInvoiceValue" currentSortBy={filters.sortBy} currentSortOrder={filters.sortDirection} onSort={handleColumnSort} className="p-4 w-[10%] text-right">Total Tax</SortableHeader>
                  <th className="p-4 w-[6%] text-center">Status</th>
                  <th className="p-4 w-[6%]">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableRowSkeleton columns={13} rows={10} />
                ) : !records || records.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-12 text-center text-zinc-500 font-medium">
                      No GSTR-1 records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => {
                    const rowId = record.id || record.invoiceNumber || index;
                    const isExpanded = expandedRowId === rowId;
                    const taxTotal = (record.cgst || 0) + (record.sgst || 0) + (record.igst || 0) + (record.cess || 0);
                    
                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          className={`hover:bg-zinc-50/80 transition-colors cursor-pointer group ${isExpanded ? 'bg-zinc-50/80' : ''}`}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td className="p-4 text-center text-zinc-400 align-middle">
                            {((filters.page - 1) * filters.size) + index + 1}
                          </td>
                          <td className="p-4 align-middle truncate whitespace-nowrap">
                            <span className="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors" title={record.customerName || record.partyName}>
                              {record.customerName || record.partyName || '-'}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-[10.4px] text-zinc-700 font-medium whitespace-nowrap">
                            {record.gstin || '-'}
                          </td>
                          <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                            {record.invoiceNumber || '-'}
                          </td>
                          <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                            {record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                            {record.invoiceType || '-'}
                          </td>
                          <td className="p-4 align-middle text-right whitespace-nowrap">
                            <span className="font-medium text-zinc-900">
                              {formatCurrency(record.taxableAmount ?? record.taxableValue)}
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
                            <span className="font-bold text-rose-600">
                              {formatCurrency(taxTotal)}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-center whitespace-nowrap">
                             {getStatusBadge(record.status || 'REGULAR')}
                          </td>
                          <td className="p-4 align-middle text-[10.4px] text-zinc-700 truncate whitespace-nowrap">
                            {record.reference || '-'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={13} className="p-0 bg-zinc-50/50 border-b border-zinc-200/50">
                              <InvoiceOverview invoice={record} selectedCompany={selectedCompany} />
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
              currentPage={filters.page} // Already 1-indexed in our state
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
      </div>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gstr1-export"
      />
    </div>
  );
}
