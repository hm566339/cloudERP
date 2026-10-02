import React, { useState , useMemo} from 'react';
import { Plus, Eye, RefreshCw, Trash2, Edit2, Download, FileText, CheckCircle, AlertCircle, Ban, XCircle, Search, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, Filter, X, ArrowRightCircle, BookOpen, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentVouchersApi, vendorsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import Pagination from '../../../components/common/Pagination';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import SortableHeader from '../../../components/common/SortableHeader';
import RequirePermission from '../../../components/common/RequirePermission';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import usePermission from '../../../hooks/usePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import ColumnVisibilityToggle from '../../../components/common/ColumnVisibilityToggle';
import PaymentVoucherFormModal from '../components/PaymentVoucherFormModal';
import VendorFormModal from '../../account/components/VendorFormModal';
import TableRowActions from '../../../components/common/TableRowActions';
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomSelect from '../../../components/common/CustomSelect';
import ExportModal from '../../../components/common/ExportModal';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';

const VoucherOverview = ({ voucher }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const allocPct = voucher.paymentAmount > 0 
    ? Math.round(((voucher.totalAllocatedAmount || 0) / voucher.paymentAmount) * 100) 
    : 0;
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {voucher.voucherNo}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{voucher.vendorName || '-'}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {voucher.voucherDate} | Mode: {voucher.paymentMode} {voucher.referenceNo ? `| Ref: ${voucher.referenceNo}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
            voucher.paymentStatus === 'POSTED' || voucher.paymentStatus === 'APPROVED' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : voucher.paymentStatus === 'DRAFT' 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : voucher.paymentStatus === 'CANCELLED' || voucher.paymentStatus === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {voucher.paymentStatus}
          </span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
            voucher.glPostingStatus === 'POSTED' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : voucher.glPostingStatus === 'REVERSED'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200'
          }`}>
            {voucher.glPostingStatus || 'UNPOSTED'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment Amount</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">INR {fmt(voucher.paymentAmount)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Allocated</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">INR {fmt(voucher.totalAllocatedAmount)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Remaining</p>
          <p className="text-sm font-bold text-red-600 mt-1">INR {fmt(voucher.remainingBalance)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Allocation %</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">{allocPct}%</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Bank</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{voucher.bankName || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Account</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{voucher.bankAccountNumber || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Remarks</p>
          <p className="text-sm font-medium text-zinc-900 mt-1 truncate" title={voucher.remarks}>{voucher.remarks || '-'}</p>
        </div>
      </div>
    </div>
  );
};

const ALL_COLUMNS = [
  { id: 'voucherNo', label: 'Voucher No' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'bank', label: 'Bank Info' },
  { id: 'voucherDate', label: 'Date' },
  { id: 'paymentMode', label: 'Payment Mode' },
  { id: 'paymentAmount', label: 'Amount' },
  { id: 'allocatedAmount', label: 'Allocated' },
  { id: 'remainingBalance', label: 'Remaining' },
  { id: 'paymentStatus', label: 'Status' },
  { id: 'glPostingStatus', label: 'Posting' },
  { id: 'createdAt', label: 'Created Date' }
];

const DEFAULT_COLUMNS = ['voucherNo', 'vendor', 'voucherDate', 'paymentAmount', 'allocatedAmount', 'remainingBalance', 'paymentStatus', 'glPostingStatus'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'DRAFT': return <span className="badge badge-neutral">DRAFT</span>;
    case 'SUBMITTED': return <span className="badge badge-info">SUBMITTED</span>;
    case 'APPROVED': return <span className="badge badge-success"><CheckCircle size={12} className="mr-1"/> APPROVED</span>;
    case 'REJECTED': return <span className="badge badge-error"><XCircle size={12} className="mr-1"/> REJECTED</span>;
    case 'POSTED': return <span className="badge badge-success">POSTED</span>;
    case 'REVERSED': return <span className="badge badge-warning">REVERSED</span>;
    case 'CANCELLED': return <span className="badge badge-error"><Ban size={12} className="mr-1"/> CANCELLED</span>;
    default: return <span className="badge badge-neutral">{status}</span>;
  }
};

const getPostingBadge = (status) => {
  switch (status) {
    case 'POSTED': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium shadow-sm border border-emerald-200">POSTED</span>;
    case 'REVERSED': return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium shadow-sm border border-amber-200">REVERSED</span>;
    default: return <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full font-medium border border-zinc-200">{status || 'UNPOSTED'}</span>;
  }
};

export default function PaymentVouchers() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const canUpdate = usePermission('PAYMENT_VOUCHERS', 'UPDATE');
  const canDelete = usePermission('PAYMENT_VOUCHERS', 'DELETE');
  const canApprove = usePermission('PAYMENT_VOUCHERS', 'APPROVE');
  const canPrint = usePermission('PAYMENT_VOUCHERS', 'PRINT');
  const canExport = usePermission('PAYMENT_VOUCHERS', 'EXPORT');
  const canReadGL = usePermission('GENERAL_LEDGER', 'READ');
  const canReadBankRecon = usePermission('BANK_RECONCILIATION', 'READ');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [prefillVendorName, setPrefillVendorName] = useState('');

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter
  } = useUrlFilters({ size: 10 });

  const handleClearFilters = () => {
    setSearch('');
    setFilter('paymentStatuses', '');
    setFilter('voucherDateFrom', '');
    setFilter('voucherDateTo', '');
    
    // Clear advanced filters
    const keys = [
      'voucherNo', 'referenceNo', 'vendorId', 'paymentMode',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    keys.forEach(k => setFilter(k, ''));
  };

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = [
      'voucherNo', 'referenceNo', 'vendorId', 'paymentMode',
      'minAmount', 'maxAmount', 'glPostingStatuses'
    ];
    return keys.filter(k => filters[k]).length;
  }, [filters]);

  const queryFilters = {
    searchKey: debouncedSearch || undefined,
    voucherNo: filters.voucherNo || undefined,
    referenceNo: filters.referenceNo || undefined,
    vendorId: filters.vendorId || undefined,
    paymentMode: filters.paymentMode || undefined,
    paymentStatuses: filters.paymentStatuses ? [filters.paymentStatuses] : undefined,
    glPostingStatuses: filters.glPostingStatuses ? [filters.glPostingStatuses] : undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
    voucherDateFrom: filters.voucherDateFrom || undefined,
    voucherDateTo: filters.voucherDateTo || undefined
  };

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    paymentVouchersApi.getPaymentVouchers,
    { ...queryFilters, ...apiParams }
  );

  const { data: vendorsData } = useApiQuery(
    vendorsApi.getVendors,
    [{ isActive: true }, { page: 0, size: 500, sort: 'vendorName,asc' }]
  );

  const vouchers = Array.isArray(responseData?.data) ? responseData.data : (responseData?.content || []);
  const pageInfo = responseData?.pagination || responseData || null;
  const vendors = vendorsData?.content || [];

  const deleteMutation = useApiMutation(paymentVouchersApi.deletePaymentVoucher);

  const submitMutation = useApiMutation(paymentVouchersApi.submitPaymentVoucher);
  const approveMutation = useApiMutation(paymentVouchersApi.approvePaymentVoucher);
  const rejectMutation = useApiMutation(paymentVouchersApi.rejectPaymentVoucher);
  const postMutation = useApiMutation(paymentVouchersApi.postPaymentVoucher);
  const cancelMutation = useApiMutation(paymentVouchersApi.cancelPaymentVoucher);

  const handleAction = async (actionName, mutation, voucherId, confirmMsg, successMessage) => {
    if (!await confirmDialog({ 
      title: `${actionName} Payment Voucher?`, 
      message: confirmMsg,
      confirmText: actionName
    })) return;
    try {
      await mutation.mutateAsync([voucherId]);
      dispatch(addAlert({ type: 'success', message: successMessage || `${actionName} completed successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}` }));
    }
  };

  const handleDelete = (id) => {
    confirmDialog({
      title: 'Delete Payment Voucher',
      message: 'Are you sure you want to delete this payment voucher? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true
    }).then(async (confirmed) => {
      if (confirmed) {
        try {
          await deleteMutation.mutateAsync([id]);
          dispatch(addAlert({ type: 'success', message: 'Voucher deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete voucher' }));
        }
      }
    });
  };

  const handleEdit = (voucher) => {
    if (voucher.paymentStatus !== 'DRAFT') {
      dispatch(addAlert({ type: 'warning', message: 'Only draft vouchers can be edited.' }));
      return;
    }
    setSelectedVoucher(voucher);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedVoucher(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Payment Vouchers</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage outgoing payments and allocations</p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnVisibilityToggle 
            allColumns={ALL_COLUMNS} 
            visibleColumns={visibleColumns} 
            onToggle={setVisibleColumns} 
          />
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center gap-2 text-[10.4px] h-9 px-3 bg-white border-zinc-200 hover:bg-zinc-50">
            <Download size={15} /> Export
          </button>
          <RequirePermission module="PAYMENT_VOUCHERS" action="CREATE">
            <button onClick={handleCreate} className="btn-primary">
              <Plus size={16} className="mr-2" />
              New Voucher
            </button>
          </RequirePermission>
        </div>
      </div>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={purchaseTabs} />

      <div className="p-6 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          {/* Filter Bar Section */}
          <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); refetch(); }}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                  
                  {/* Quick Search */}
                  <div className="flex-1">
                    <ActionableSearchInput 
                      value={search || ''}
                      onChange={(val) => setSearch(val)}
                      placeholder="Search Vouchers..."
                      createSubtext="Add as new vendor"
                      onCreateClick={(val) => {
                        setPrefillVendorName(val);
                        setIsVendorFormOpen(true);
                      }}
                    />
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={filters.voucherDateFrom || ''}
                      onChange={(e) => setFilter('voucherDateFrom', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                    />
                  </div>
                  
                  {/* Date To */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={filters.voucherDateTo || ''}
                      onChange={(e) => setFilter('voucherDateTo', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                      Status
                    </label>
                    <CustomSelect
                      value={filters.paymentStatuses || ''}
                      onChange={(e) => setFilter('paymentStatuses', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="POSTED">POSTED</option>
                      <option value="REVERSED">REVERSED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </CustomSelect>
                  </div>
                </div>

                {/* Filter Control Buttons */}
                <div className="flex items-center gap-2">

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
                    <SlidersHorizontal size={14} />
                    <span>Advanced Filters</span>
                    {activeAdvancedFilterCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[8.8px] flex items-center justify-center font-bold ml-0.5">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                    {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="h-9 w-9 text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center justify-center transition-all active:scale-95"
                    title="Refresh List"
                  >
                    <RefreshCw size={14} className={isLoading || isFetching ? 'animate-spin' : ''} />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Vendor</label>
                        <CustomSelect
                          value={filters.vendorId || ''}
                          onChange={(e) => setFilter('vendorId', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer"
                        >
                          <option value="">All Vendors</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.vendorName}</option>
                          ))}
                        </CustomSelect>
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Payment Mode</label>
                        <CustomSelect
                          value={filters.paymentMode || ''}
                          onChange={(e) => setFilter('paymentMode', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer"
                        >
                          <option value="">All Modes</option>
                          <option value="CASH">CASH</option>
                          <option value="BANK_TRANSFER">BANK TRANSFER</option>
                          <option value="CHEQUE">CHEQUE</option>
                          <option value="CREDIT_CARD">CREDIT CARD</option>
                          <option value="UPI">UPI</option>
                        </CustomSelect>
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Voucher No</label>
                        <input type="text"
                          value={filters.voucherNo || ''}
                          onChange={(e) => setFilter('voucherNo', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Reference No</label>
                        <input type="text"
                          value={filters.referenceNo || ''}
                          onChange={(e) => setFilter('referenceNo', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Min Amount</label>
                        <input type="number" step="0.01"
                          value={filters.minAmount || ''}
                          onChange={(e) => setFilter('minAmount', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Max Amount</label>
                        <input type="number" step="0.01"
                          value={filters.maxAmount || ''}
                          onChange={(e) => setFilter('maxAmount', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8.8px] font-semibold text-zinc-600 mb-1 block">Posting Status</label>
                        <CustomSelect
                          value={filters.glPostingStatuses || ''}
                          onChange={(e) => setFilter('glPostingStatuses', e.target.value)}
                          className="w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[10.4px] text-zinc-800 focus:border-zinc-400 outline-none cursor-pointer"
                        >
                          <option value="">All Statuses</option>
                          <option value="UNPOSTED">UNPOSTED</option>
                          <option value="POSTED">POSTED</option>
                          <option value="REVERSED">REVERSED</option>
                        </CustomSelect>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 sticky top-0 z-10 backdrop-blur-xs border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  {visibleColumns.includes('voucherNo') && (
                    <SortableHeader field="voucherNo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Voucher No</SortableHeader>
                  )}
                  {visibleColumns.includes('vendor') && (
                    <SortableHeader field="vendorName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Vendor</SortableHeader>
                  )}
                  {visibleColumns.includes('bank') && <th className="p-4">Bank Account</th>}
                  {visibleColumns.includes('voucherDate') && (
                    <SortableHeader field="voucherDate" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Date</SortableHeader>
                  )}
                  {visibleColumns.includes('paymentMode') && (
                    <SortableHeader field="paymentMode" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Mode</SortableHeader>
                  )}
                  {visibleColumns.includes('paymentAmount') && (
                    <SortableHeader field="paymentAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">Amount</SortableHeader>
                  )}
                  {visibleColumns.includes('allocatedAmount') && <th className="p-4 text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Allocated</th>}
                  {visibleColumns.includes('remainingBalance') && <th className="p-4 text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Remaining</th>}
                  {visibleColumns.includes('paymentStatus') && (
                    <SortableHeader field="paymentStatus" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-center">Status</SortableHeader>
                  )}
                  {visibleColumns.includes('glPostingStatus') && (
                    <SortableHeader field="glPostingStatus" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-center">Posting</SortableHeader>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <SortableHeader field="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Created Date</SortableHeader>
                  )}
                  <th className="p-4 text-[8.8px] font-semibold text-zinc-500 uppercase tracking-wider text-right sticky right-0 bg-white z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableRowSkeleton columns={visibleColumns.length + 2} rows={10} />
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="p-12 text-center text-zinc-500">
                      No payment vouchers found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher, index) => {
                    const rowId = voucher.id || index;
                    const isExpanded = expandedRowId === rowId;
                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          onClick={() => toggleRow(rowId)}
                          className={`hover:bg-zinc-50/80 transition-colors group cursor-pointer ${isExpanded ? 'bg-zinc-50/80' : ''}`}
                        >
                      <td className="p-4 text-center text-zinc-400">{(page * apiParams.size) + index + 1}</td>
                      
                      {visibleColumns.includes('voucherNo') && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-zinc-400" />
                            <span className="font-mono text-xs font-semibold text-primary">{voucher.voucherNo}</span>
                          </div>
                          {voucher.referenceNo && <div className="text-[8px] text-zinc-400 mt-1">Ref: {voucher.referenceNo}</div>}
                        </td>
                      )}
                      
                      {visibleColumns.includes('vendor') && (
                        <td className="p-4 font-semibold text-zinc-900">{voucher.vendorName || '-'}</td>
                      )}
                      
                      {visibleColumns.includes('bank') && (
                        <td className="p-4 text-zinc-600">
                          {voucher.bankAccountName ? `${voucher.bankName} - ${voucher.bankAccountNumber}` : '-'}
                        </td>
                      )}

                      {visibleColumns.includes('voucherDate') && (
                        <td className="p-4 text-zinc-700 font-medium">{voucher.voucherDate}</td>
                      )}

                      {visibleColumns.includes('paymentMode') && (
                        <td className="p-4 text-zinc-700 font-medium">{voucher.paymentMode}</td>
                      )}

                      {visibleColumns.includes('paymentAmount') && (
                        <td className="p-4 text-right font-black text-emerald-600">
                          {voucher.paymentAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}

                      {visibleColumns.includes('allocatedAmount') && (
                        <td className="p-4 text-right font-medium text-zinc-900">
                          {voucher.totalAllocatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                      )}

                      {visibleColumns.includes('remainingBalance') && (
                        <td className="p-4 text-right font-medium text-amber-600">
                          {voucher.remainingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                      )}
                      
                      {visibleColumns.includes('paymentStatus') && (
                        <td className="p-4 text-center">
                          {getStatusBadge(voucher.paymentStatus)}
                        </td>
                      )}

                      {visibleColumns.includes('glPostingStatus') && (
                        <td className="p-4 text-center">
                          {getPostingBadge(voucher.glPostingStatus)}
                        </td>
                      )}

                      {visibleColumns.includes('createdAt') && (
                        <td className="p-4 text-zinc-600">{new Date(voucher.createdAt || voucher.voucherDate).toLocaleDateString()}</td>
                      )}

                      <td className="p-4 text-right sticky right-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-zinc-50/80 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <TableRowActions
                          onView={() => navigate(buildPath(`/accounts/transactions/payments/${voucher.id}`))}
                          onEdit={voucher.paymentStatus === 'DRAFT' && canUpdate ? (e) => { e.stopPropagation(); handleEdit(voucher); } : undefined}
                          onDelete={voucher.paymentStatus === 'DRAFT' && canDelete ? (e) => { e.stopPropagation(); handleDelete(voucher.id); } : undefined}
                          extraActions={[
                            ...(voucher.paymentStatus === 'DRAFT' && canUpdate ? [
                              {
                                icon: <CheckCircle size={16} />,
                                tooltip: "Submit for Approval",
                                onClick: () => handleAction('Submit', submitMutation, voucher.id, 'Are you sure you want to submit this voucher for approval?'),
                                className: "text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                              }
                            ] : []),
                            ...(voucher.paymentStatus === 'PENDING_APPROVAL' && canApprove ? [
                              {
                                icon: <CheckCircle size={16} />,
                                tooltip: "Approve",
                                onClick: () => handleAction('Approve', approveMutation, voucher.id, 'Are you sure you want to approve this voucher?'),
                                className: "text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50"
                              },
                              {
                                icon: <XCircle size={16} />,
                                tooltip: "Reject",
                                onClick: () => handleAction('Reject', rejectMutation, voucher.id, 'Are you sure you want to reject this voucher?'),
                                className: "text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
                              }
                            ] : []),
                            ...(voucher.paymentStatus === 'APPROVED' && (canUpdate || canApprove) ? [
                              {
                                icon: <ArrowRightCircle size={16} />,
                                tooltip: "Post to GL",
                                onClick: () => handleAction('Post', postMutation, voucher.id, 'Are you sure you want to post this voucher to the General Ledger?'),
                                className: "text-zinc-500 hover:text-purple-600 hover:bg-purple-50"
                              }
                            ] : []),
                            ...((voucher.paymentStatus === 'DRAFT' || voucher.paymentStatus === 'PENDING_APPROVAL' || voucher.paymentStatus === 'APPROVED') && (canUpdate || canDelete) ? [
                              {
                                icon: <Ban size={16} />,
                                tooltip: "Cancel Voucher",
                                onClick: () => handleAction('Cancel', cancelMutation, voucher.id, 'Are you sure you want to cancel this voucher?'),
                                className: "text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
                              }
                            ] : []),
                            ...(voucher.paymentStatus !== 'DRAFT' && voucher.paymentStatus !== 'PENDING_APPROVAL' && canReadGL ? [
                              {
                                icon: <BookOpen size={16} />,
                                tooltip: "View Vendor Ledger",
                                onClick: () => navigate(buildPath(`/accounts/ledger/vendor/${voucher.vendorId}`)),
                                className: "text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 border-t border-zinc-100"
                              }
                            ] : []),
                            ...(voucher.paymentStatus !== 'DRAFT' && voucher.paymentStatus !== 'PENDING_APPROVAL' && canReadBankRecon ? [
                              {
                                icon: <Landmark size={16} />,
                                tooltip: "Bank Reconciliation",
                                onClick: () => navigate(buildPath(`/accounts/banking/reconciliation?accountId=${voucher.bankAccountId}`)),
                                className: "text-zinc-500 hover:text-teal-600 hover:bg-teal-50"
                              }
                            ] : []),
                            ...(canPrint ? [
                              {
                                icon: <FileText size={16} />,
                                tooltip: "Print Voucher",
                                onClick: () => { window.open(buildPath(`/accounts/transactions/payments/${voucher.id}/print`), '_blank'); },
                                className: "text-zinc-500 hover:text-blue-600 hover:bg-blue-50 border-t border-zinc-100"
                              }
                            ] : [])
                          ]}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={visibleColumns.length + 2} className="p-0 bg-zinc-50/50 border-b border-zinc-200/50">
                          <VoucherOverview voucher={voucher} />
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
          
          {pageInfo && vouchers.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={pageInfo.totalPages || 1}
              onPageChange={setPage}
              totalElements={pageInfo.totalElements}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>

      <PaymentVoucherFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedVoucher}
        onSuccess={() => refetch()}
      />

      <VendorFormModal
        isOpen={isVendorFormOpen}
        onClose={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); }}
        initialData={prefillVendorName ? { vendorName: prefillVendorName } : null}
        onSuccess={() => { setIsVendorFormOpen(false); setPrefillVendorName(''); dispatch(addAlert({ type: 'success', message: 'Vendor created successfully' })); }}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="payment-vouchers"
      />
    </div>
  );
}
