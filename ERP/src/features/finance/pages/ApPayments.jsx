import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Search, Plus, Filter, RefreshCw, 
  Download, FileText, CheckCircle, XCircle, AlertCircle, BookOpen 
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { apPaymentsApi } from '../../../api/account/apPayments';
import { useSimpleFilters } from '../../../hooks/useSimpleFilters';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import ApPaymentForm from '../components/ApPaymentForm';
import VendorLedgerModal from '../components/VendorLedgerModal';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { vendorsApi } from '../../../api/account/vendors';
import CustomSelect from '../../../components/common/CustomSelect';

const STATUS_CONFIG = {
  PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  PARTIAL: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  UNPAID: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const POSTING_STATUS = {
  DRAFT: { color: 'bg-zinc-100 text-zinc-800' },
  POSTED: { color: 'bg-blue-100 text-blue-800' },
  FAILED: { color: 'bg-red-100 text-red-800' },
  REVERSED: { color: 'bg-orange-100 text-orange-800' }
};

export default function ApPayments() {
  const navigate = useNavigate();
  const {filters, setFilters} = useSimpleFilters({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
    searchKeyword: '',
    vendorId: '',
    paymentStatus: '',
    glPostingStatus: '',
    paymentMode: ''
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: apiData, loading, execute: refetch } = useApiQuery(apPaymentsApi.getList, { params: filters });
  const { data: vendorsData } = useApiQuery(vendorsApi.getVendors, { size: 1000 });
  const { execute: createPayment, loading: isCreating } = useApiMutation(apPaymentsApi.create);

  const payments = Array.isArray(apiData) ? apiData : apiData?.content || [];
  const pagination = apiData?.pageable ? {
    totalElements: apiData.totalElements,
    totalPages: apiData.totalPages,
    page: apiData.number,
    size: apiData.size
  } : apiData?.pagination || { totalElements: payments.length, totalPages: 1, page: filters.page, size: filters.size };

  const vendorOptions = useMemo(() => {
    const list = Array.isArray(vendorsData) ? vendorsData : vendorsData?.data?.content || vendorsData?.content || [];
    return list.map(v => ({ value: v.id, label: v.vendorName }));
  }, [vendorsData]);

  // Derived Summaries (For current page)
  const summaries = useMemo(() => {
    return payments.reduce((acc, p) => ({
      totalPayments: acc.totalPayments + 1,
      totalAmount: acc.totalAmount + (p.paymentAmount || 0),
      totalAllocated: acc.totalAllocated + (p.totalAllocatedAmount || 0),
      pending: acc.pending + (p.glPostingStatus === 'DRAFT' ? 1 : 0),
    }), { totalPayments: 0, totalAmount: 0, totalAllocated: 0, pending: 0 });
  }, [payments]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchKeyword: e.target.value, page: 0 });
  };

  const handleCreateSubmit = async (formData) => {
    try {
      await createPayment({ data: formData });
      setIsCreateModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to create AP payment", err);
      throw err;
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 0,
      size: 10,
      sortBy: 'createdAt',
      sortDir: 'desc',
      searchKeyword: '',
      vendorId: '',
      paymentStatus: '',
      glPostingStatus: '',
      paymentMode: ''
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">AP Payments</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage vendor payments and invoice allocations</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refetch}
            className="p-2 bg-white border border-zinc-300 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            New Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Page Total Payments</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{summaries.totalPayments}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <CreditCard size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Page Payment Amount</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(summaries.totalAmount)}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <CreditCard size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Page Total Allocated</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(summaries.totalAllocated)}</p>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
            <FileText size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Draft Payments</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{summaries.pending}</p>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search payments..."
              value={filters.searchKeyword || ''}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || Object.keys(filters).some(k => ['vendorId', 'paymentStatus', 'glPostingStatus', 'paymentMode'].includes(k) && filters[k])
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            <button 
              onClick={() => setIsLedgerModalOpen(true)}
              className="flex items-center px-3 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
            >
              <BookOpen size={16} className="mr-2" />
              Vendor Ledger
            </button>
            <button className="flex items-center px-3 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium">
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Vendor</label>
              <CustomSelect
                value={filters.vendorId || ''}
                onChange={(e) => setFilters({ ...filters, vendorId: e.target.value, page: 0 })}
                className="w-full p-2 border border-zinc-300 rounded text-sm bg-white"
              >
                <option value="">All Vendors</option>
                {vendorOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </CustomSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Payment Status</label>
              <CustomSelect
                value={filters.paymentStatus || ''}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 0 })}
                className="w-full p-2 border border-zinc-300 rounded text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </CustomSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">GL Status</label>
              <CustomSelect
                value={filters.glPostingStatus || ''}
                onChange={(e) => setFilters({ ...filters, glPostingStatus: e.target.value, page: 0 })}
                className="w-full p-2 border border-zinc-300 rounded text-sm bg-white"
              >
                <option value="">All GL Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="FAILED">Failed</option>
                <option value="REVERSED">Reversed</option>
              </CustomSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Mode</label>
              <CustomSelect
                value={filters.paymentMode || ''}
                onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value, page: 0 })}
                className="w-full p-2 border border-zinc-300 rounded text-sm bg-white"
              >
                <option value="">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
              </CustomSelect>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button 
                onClick={clearFilters}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-700 font-semibold">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={() => setFilters({ ...filters, sortBy: 'paymentNo', sortDir: filters.sortBy === 'paymentNo' && filters.sortDir === 'asc' ? 'desc' : 'asc' })}>
                  Payment No {filters.sortBy === 'paymentNo' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => setFilters({ ...filters, sortBy: 'paymentDate', sortDir: filters.sortBy === 'paymentDate' && filters.sortDir === 'asc' ? 'desc' : 'asc' })}>
                  Date {filters.sortBy === 'paymentDate' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right cursor-pointer" onClick={() => setFilters({ ...filters, sortBy: 'paymentAmount', sortDir: filters.sortBy === 'paymentAmount' && filters.sortDir === 'asc' ? 'desc' : 'asc' })}>
                  Amount {filters.sortBy === 'paymentAmount' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right">Allocated</th>
                <th className="px-4 py-3 text-center">GL Status</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="9" className="p-0"><TableSkeleton columns={9} rows={1} /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-12 h-12 text-zinc-300 mb-3" />
                      <p className="text-zinc-500 font-medium">No AP Payments found</p>
                      <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters or create a new payment.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const statusInfo = STATUS_CONFIG[p.paymentStatus] || STATUS_CONFIG.UNPAID;
                  const glInfo = POSTING_STATUS[p.glPostingStatus] || POSTING_STATUS.DRAFT;
                  
                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-zinc-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/accounts/transactions/ap-payments/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-900 block">{p.paymentNo}</span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {p.referenceNo || p.utrNumber || p.chequeNumber || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-zinc-900">{p.vendorName}</span>
                        <span className="text-xs text-zinc-500">{p.vendorCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded bg-zinc-100 text-zinc-700 font-medium uppercase">
                          {p.paymentMode}
                        </span>
                        {p.bankName && <div className="text-xs text-zinc-500 mt-1">{p.bankName}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900">
                        {formatCurrency(p.paymentAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700">
                        {formatCurrency(p.totalAllocatedAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${glInfo.color}`}>
                          {p.glPostingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/accounts/transactions/ap-payments/${p.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <Pagination 
            page={filters.page} 
            pageSize={filters.size} 
            onPageChange={(page) => setFilters({ ...filters, page })}
            onPageSizeChange={(size) => setFilters({ ...filters, size, page: 0 })}
            totalElements={pagination.totalElements} 
            totalPages={pagination.totalPages} 
          />
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create AP Payment"
        size="4xl"
      >
        <ApPaymentForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isCreating}
        />
      </Modal>

      <VendorLedgerModal 
        isOpen={isLedgerModalOpen} 
        onClose={() => setIsLedgerModalOpen(false)} 
      />

    </div>
  );
}
