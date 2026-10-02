import React, { useState, useMemo } from 'react';
import {
  Plus, FileSearch, RefreshCw, Send, XCircle, RotateCcw, FileText,
  Eye, Edit2, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  X, Filter, Package, Users, Mail, Loader2, ArrowLeftRight, Trophy, ShoppingCart, Download
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { supplierQuotationsApi, vendorsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';

const ALL_COLUMNS = [
  { id: 'quotationNumber', label: 'QUOTE NO.' },
  { id: 'rfqNumber', label: 'RFQ NO.' },
  { id: 'vendorName', label: 'SUPPLIER' },
  { id: 'quotationDate', label: 'DATE' },
  { id: 'validUntil', label: 'VALID UNTIL' },
  { id: 'grandTotal', label: 'GRAND TOTAL' },
  { id: 'status', label: 'STATUS' }
];

const DEFAULT_COLUMNS = ['quotationNumber', 'rfqNumber', 'vendorName', 'quotationDate', 'validUntil', 'grandTotal', 'status'];

const renderStatusBadge = (status) => {
  if (!status) return <span className="text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  if (s === 'ACCEPTED' || s === 'AWARDED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{s}</span>;
  if (s === 'SUBMITTED' || s === 'SENT') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">{s}</span>;
  if (s === 'SHORTLISTED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-violet-50 text-violet-700 border-violet-200">SHORTLISTED</span>;
  if (s === 'REJECTED' || s === 'CANCELLED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200">{s}</span>;
  if (s === 'CLOSED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-100 text-zinc-600 border-zinc-200">CLOSED</span>;
  if (s === 'DRAFT') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200">DRAFT</span>;
  return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">{s}</span>;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SupplierQuotationOverview = ({ quote: q }) => {
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {q.quotationNumber || '—'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{q.vendorName || q.vendor?.name || '—'}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              RFQ: {q.rfqNumber || '—'} | Date: {formatDate(q.quotationDate)} | Valid Until: {formatDate(q.validUntil)}
            </p>
          </div>
        </div>
        <div>
          {renderStatusBadge(q.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <FileText size={13} /> Quotation Details
          </h4>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Created:</span> <span className="font-medium text-zinc-800">{formatDateTime(q.createdAt)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Terms:</span> <span className="font-medium text-zinc-800">{q.paymentTerms || q.deliveryTerms || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Taxable Amount:</span> <span className="font-medium text-zinc-800">{fmt(q.taxableAmount)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Tax Amount:</span> <span className="font-medium text-zinc-800">{fmt(q.taxAmount)}</span></div>
          <div className="flex justify-between text-xs pt-2 border-t border-zinc-200 font-bold"><span className="text-zinc-900">Grand Total:</span> <span className="text-primary">{fmt(q.grandTotal)}</span></div>
          {q.remarks && (
            <div className="pt-2 border-t border-zinc-200/60">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Remarks:</span>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap">{q.remarks}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Package size={13} /> Quoted Items ({q.items?.length || 0})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {q.items && q.items.length > 0 ? (
              q.items.map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-2.5 rounded border border-zinc-200 text-xs">
                  <div className="flex justify-between font-semibold text-zinc-900">
                    <span>{item.itemName || '—'}</span>
                    <span className="text-primary font-mono">{fmt((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</span>
                  </div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    Qty: <span className="font-medium text-zinc-800">{Number(item.quantity || 0).toLocaleString()} {item.unit || ''}</span>
                    {' × '}
                    <span className="font-medium text-zinc-800">{fmt(item.unitPrice)}</span>
                    {item.discount > 0 && <span className="text-emerald-600 ml-1">({item.discount}% off)</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">No items quoted</p>
            )}
          </div>
        </div>

        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Users size={13} /> Supplier Details
          </h4>
          <div className="bg-white p-3 rounded-lg border border-zinc-200/60 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Supplier:</span> <span className="font-semibold text-zinc-900">{q.vendorName || q.vendor?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Contact:</span> <span className="font-medium text-zinc-700">{q.vendor?.primaryContactName || q.vendor?.contactName || q.vendor?.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Phone:</span> <span className="font-medium text-zinc-700">{q.vendor?.phone || q.vendor?.phoneNumber || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SupplierQuotations() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const { canCreate, canEdit, canApprove } = useRBAC();

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('sq_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [awardingId, setAwardingId] = useState(null);
  const [selectedQuotations, setSelectedQuotations] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    page, setPage, setPageSize, apiParams,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: vendorsResp } = useApiQuery(vendorsApi.getActiveVendors, undefined, { enabled: true });
  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : vendorsResp?.data || vendorsResp?.content || [];
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);

  const listFilters = useMemo(() => {
    const q = {};
    if (debouncedSearch && debouncedSearch.trim()) q.search = debouncedSearch.trim();
    if (filters.status) q.status = filters.status;
    if (filters.quotationDateFrom) q.quotationDateFrom = filters.quotationDateFrom;
    if (filters.quotationDateTo) q.quotationDateTo = filters.quotationDateTo;
    if (filters.vendorId) q.vendorId = filters.vendorId;
    return q;
  }, [debouncedSearch, filters]);

  const payload = {
    ...apiParams,
    ...listFilters,
    search: undefined
  };

  const convertMutation = useApiMutation(supplierQuotationsApi.convertToPurchaseOrder);
  const awardMutation = useApiMutation(supplierQuotationsApi.award);

  const handleAward = async (e, q) => {
    e.stopPropagation();
    if (awardingId) return;

    const ok = await confirmDialog({
      title: 'Award Supplier Quotation',
      message: 'You are awarding this supplier quotation. The awarded supplier will be used to create the purchase order.',
      confirmText: 'Award Quotation',
      cancelText: 'Cancel',
      details: 'Only submissions that are still eligible can be awarded. This action cannot be reversed.'
    });

    if (!ok) return;

    setAwardingId(q.id);
    try {
      await awardMutation.mutateAsync([q.id, companyId]);
      dispatch(addAlert({ type: 'success', message: 'Supplier quotation awarded successfully.' }));
      refetch();
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You do not have permission to award this supplier quotation.'
        : (err?.response?.data?.message || err?.message || 'Failed to award supplier quotation');
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setAwardingId(null);
    }
  };

  const handleCreatePO = async (e, q) => {
    e.stopPropagation();
    if (convertingId) return;

    if (q.purchaseOrderId) {
      dispatch(addAlert({ type: 'info', message: 'Purchase Order already created' }));
      return;
    }

    const ok = await confirmDialog({
      title: 'Create Purchase Order',
      message: 'Are you sure you want to create a Purchase Order from this Supplier Quotation?',
      confirmText: 'Create Purchase Order',
      cancelText: 'Cancel',
      details: `Quotation: ${q.quotationNumber || '-'}\nSupplier: ${q.vendorName || q.vendor?.name || '-'}\nGrand Total: ${fmt(q.grandTotal)}`
    });

    if (!ok) return;

    setConvertingId(q.id);
    try {
      const result = await convertMutation.mutateAsync([q.id, companyId]);
      const poNumber = result?.poNumber || result?.data?.poNumber;
      
      const msg = poNumber ? `Purchase Order ${poNumber} created successfully.` : 'Purchase Order created successfully.';
      dispatch(addAlert({ type: 'success', message: msg }));
      
      await refetch();
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You do not have permission to create a purchase order.'
        : (err?.response?.data?.message || err?.message || 'Failed to create purchase order');
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setConvertingId(null);
    }
  };

  const { data: apiData = {}, isLoading, isFetching, refetch } = useApiQuery(supplierQuotationsApi.getList, {
    ...payload, companyId
  });

  let allQuotations = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  if (debouncedSearch) {
    const s = debouncedSearch.toLowerCase();
    allQuotations = allQuotations.filter(
      q =>
        q.quotationNumber?.toLowerCase().includes(s) ||
        q.vendorName?.toLowerCase().includes(s) ||
        q.rfqNumber?.toLowerCase().includes(s)
    );
  }
  if (filters.status) {
    allQuotations = allQuotations.filter(q => q.status === filters.status);
  }

  const sortedQuotations = useMemo(() => {
    if (!sortBy) return allQuotations;
    return [...allQuotations].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [allQuotations, sortBy, sortOrder]);

  const extractedTotalElements = apiData?.data?.pagination?.totalElements || apiData?.pagination?.totalElements || sortedQuotations.length;
  const actualTotalElements = sortedQuotations.length < extractedTotalElements ? sortedQuotations.length : extractedTotalElements;
  const currentSize = apiParams.size || 10;
  
  const totalElements = actualTotalElements;
  const totalPages = Math.ceil(totalElements / currentSize) || 1;

  const quotations = sortedQuotations.slice(page * currentSize, (page + 1) * currentSize);

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedQuotations([]);
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    refetch();
  };

  const activeAdvancedFilterCount = useMemo(() => {
    const keys = ['quotationDateFrom', 'quotationDateTo', 'vendorId'];
    return keys.filter(k => filters[k] !== undefined && filters[k] !== null && String(filters[k]).trim() !== '').length;
  }, [filters]);

  const isTerminal = (status) => ['AWARDED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(String(status || '').toUpperCase());
  const canEditRow = (q) => !isTerminal(q.status) && canEdit();
  const canAwardRow = (q) => !isTerminal(q.status) && canApprove();
  const canCreatePORow = (q) => ['AWARDED', 'ACCEPTED', 'SUBMITTED'].includes(String(q.status || '').toUpperCase()) && canCreate();

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Shortlisted', value: 'SHORTLISTED' },
        { label: 'Accepted', value: 'ACCEPTED' },
        { label: 'Awarded', value: 'AWARDED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Closed', value: 'CLOSED' }
      ]
    },
    {
      key: 'quotationDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'quotationDateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Supplier Filters',
      fields: [
        {
          key: 'vendorId',
          label: 'Supplier',
          type: 'select',
          options: [
            { label: 'All Suppliers', value: '' },
            ...vendorList.map(v => ({ label: v.name || v.vendorName, value: String(v.id) }))
          ]
        }
      ]
    }
  ], [vendorList]);

  const filterValues = useMemo(() => ({
    status: filters.status || '',
    quotationDateFrom: filters.quotationDateFrom || '',
    quotationDateTo: filters.quotationDateTo || '',
    vendorId: filters.vendorId || ''
  }), [filters]);

  const columns = useMemo(() => [
    {
      key: 'quotationNumber',
      label: 'QUOTE NO.',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-primary">{row.quotationNumber || '—'}</span>
        </div>
      )
    },
    {
      key: 'rfqNumber',
      label: 'RFQ NO.',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 font-medium">{row.rfqNumber || '—'}</span>
      )
    },
    {
      key: 'vendorName',
      label: 'SUPPLIER',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.vendorName || row.vendor?.name || '—'}</span>
      )
    },
    {
      key: 'quotationDate',
      label: 'DATE',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'validUntil',
      label: 'VALID UNTIL',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'grandTotal',
      label: 'GRAND TOTAL',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900">{fmt(row.grandTotal)}</span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val) => renderStatusBadge(val)
    }
  ], []);

  const getRowActions = (q) => [
    {
      key: 'view',
      label: 'View Details',
      tooltip: 'View Details',
      'aria-label': 'View Details',
      icon: <Eye size={14} />,
      onClick: () => navigate(buildPath(`/accounts/transactions/supplier-quotations/${q.id}`)),
      className: 'text-zinc-600 hover:text-indigo-600'
    },
    ...(canEditRow(q) ? [
      {
        key: 'edit',
        label: 'Edit Quotation',
        tooltip: 'Edit Quotation',
        'aria-label': 'Edit Quotation',
        icon: <Edit2 size={14} />,
        onClick: () => navigate(buildPath(`/accounts/transactions/supplier-quotations/${q.id}/edit`)),
        className: 'text-zinc-600 hover:text-blue-600'
      }
    ] : []),
    ...(q.rfqId ? [
      {
        key: 'compare',
        label: 'Compare Quotes',
        tooltip: 'Compare Quotations',
        'aria-label': 'Compare Quotations',
        icon: <ArrowLeftRight size={14} />,
        onClick: () => navigate(buildPath(`/accounts/transactions/supplier-quotations/compare/${q.rfqId}`)),
        className: 'text-zinc-600 hover:text-indigo-600'
      }
    ] : []),
    ...(canAwardRow(q) ? [
      {
        key: 'award',
        label: 'Award Quotation',
        tooltip: 'Award Quotation',
        'aria-label': 'Award Quotation',
        icon: awardingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />,
        disabled: awardingId === q.id,
        onClick: (e) => handleAward(e, q),
        className: 'text-emerald-600 hover:text-emerald-700'
      }
    ] : []),
    ...(canCreatePORow(q) && !q.purchaseOrderId ? [
      {
        key: 'create-po',
        label: 'Create PO',
        tooltip: 'Create Purchase Order',
        'aria-label': 'Create Purchase Order',
        icon: convertingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />,
        disabled: convertingId === q.id,
        onClick: (e) => handleCreatePO(e, q),
        className: 'text-blue-600 hover:text-blue-700'
      }
    ] : [])
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Top Header */}
      <PageHeader
        title="Supplier Quotes"
        description="Supplier bids submitted against your RFQs for comparison and award"
        icon={FileText}
      >
        {canCreate() && (
          <button
            onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations/new'))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Supplier Quotation</span>
          </button>
        )}
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={purchaseTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedQuotations}
          onSelectionChange={setSelectedQuotations}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={quotations}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search quotations..."
          onSearchChange={(val) => { setSearchTerm(val); setPage(0); }}

          // Filters
          filters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => { setFilter(key, val); setPage(0); }}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset, Refresh, Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('sq_visible_columns_v2', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(q) => <SupplierQuotationOverview quote={q} />}

          // Pagination
          pagination={{
            page,
            pageSize: currentSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="quotes"

          // Empty State
          emptyMessage="No supplier quotations found"
          emptyDescription="Try adjusting your filters or create a new quotation."
        />
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="supplier-quotations"
          defaultFilters={listFilters}
          selectedIds={selectedQuotations}
          selectedCount={selectedQuotations.length}
        />
      )}
    </div>
  );
}