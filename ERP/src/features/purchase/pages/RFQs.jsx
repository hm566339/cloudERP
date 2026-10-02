import React, { useState, useMemo } from 'react';
import {
  Plus, FileSearch, RefreshCw, Send, XCircle, RotateCcw, FileText,
  Eye, Edit2, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  X, Filter, Package, Users, Mail, Loader2, Receipt, Download
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { rfqsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import CreateSupplierQuotationModal from '../components/CreateSupplierQuotationModal';

const ALL_COLUMNS = [
  { id: 'rfqNumber', label: 'RFQ NUMBER' },
  { id: 'purchaseRequisitionNumber', label: 'PR NUMBER' },
  { id: 'issueDate', label: 'ISSUE DATE' },
  { id: 'quotationDeadline', label: 'DEADLINE' },
  { id: 'expectedDeliveryDate', label: 'EXPECTED DELIVERY' },
  { id: 'vendors', label: 'VENDORS' },
  { id: 'status', label: 'STATUS' }
];

const DEFAULT_COLUMNS = ['rfqNumber', 'purchaseRequisitionNumber', 'issueDate', 'quotationDeadline', 'expectedDeliveryDate', 'vendors', 'status'];

const renderStatusBadge = (status) => {
  if (!status) return <span className="text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  if (s === 'AWARDED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">AWARDED</span>;
  if (s === 'SENT' || s === 'OPEN') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">{s}</span>;
  if (s === 'CANCELLED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200">CANCELLED</span>;
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

const getRfqBasePath = (pathname) => {
  if (pathname.includes('/accounts/transactions')) return '/accounts/transactions/rfqs';
  if (pathname.includes('/purchases/')) return '/purchases/rfqs';
  return '/rfqs';
};

const RfqOverview = ({ rfq }) => {
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {rfq.rfqNumber || '—'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">
              PR Ref: {rfq.purchaseRequisitionNumber || rfq.requisitionNumber || '—'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Issue Date: {formatDate(rfq.issueDate)} | Deadline: {formatDate(rfq.quotationDeadline)}
            </p>
          </div>
        </div>
        <div>
          {renderStatusBadge(rfq.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <FileText size={13} /> RFQ Details
          </h4>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Expected Delivery:</span> <span className="font-medium text-zinc-800">{formatDate(rfq.expectedDeliveryDate)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Created:</span> <span className="font-medium text-zinc-800">{formatDateTime(rfq.createdAt)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Terms:</span> <span className="font-medium text-zinc-800">{rfq.terms || '—'}</span></div>
          {rfq.notes && (
            <div className="pt-2 border-t border-zinc-200/60">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Notes:</span>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap">{rfq.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Package size={13} /> Requested Items ({rfq.items?.length || 0})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {rfq.items && rfq.items.length > 0 ? (
              rfq.items.map((item, idx) => (
                <div key={item.id || idx} className="bg-white p-2.5 rounded border border-zinc-200 text-xs">
                  <div className="font-semibold text-zinc-900">{item.itemName || '—'}</div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    Qty: <span className="font-medium text-zinc-800">{item.quantity != null ? Number(item.quantity).toLocaleString() : '—'} {item.unit || ''}</span>
                    {item.requiredDate && ` | Req: ${formatDate(item.requiredDate)}`}
                  </div>
                  {item.description && <div className="text-zinc-500 text-[10px] mt-0.5 truncate">{item.description}</div>}
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">No items attached</p>
            )}
          </div>
        </div>

        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Users size={13} /> Invited Vendors ({rfq.vendors?.length || 0})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {rfq.vendors && rfq.vendors.length > 0 ? (
              rfq.vendors.map((v, idx) => (
                <div key={v.id || idx} className="bg-white p-2.5 rounded border border-zinc-200 text-xs flex items-center justify-between">
                  <div className="font-medium text-zinc-900 truncate mr-2">{v.vendorName || v.vendorId || '—'}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    v.status === 'RESPONDED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    v.status === 'DECLINED' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {v.status || 'INVITED'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">No vendors invited</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RFQs() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const { canCreate, canEdit } = useRBAC();
  const rfqBasePath = getRfqBasePath(location.pathname);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('rfq_visible_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [selectedRfqForQuotation, setSelectedRfqForQuotation] = useState(null);
  const [selectedRfqs, setSelectedRfqs] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    page, setPage, setPageSize, apiParams,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const queryFilters = useMemo(() => {
    const q = {};
    if (debouncedSearch && debouncedSearch.trim()) q.search = debouncedSearch.trim();
    if (filters.status) q.status = filters.status;
    if (filters.issueDateFrom) q.issueDateFrom = filters.issueDateFrom;
    if (filters.issueDateTo) q.issueDateTo = filters.issueDateTo;
    if (filters.quotationDeadlineFrom) q.quotationDeadlineFrom = filters.quotationDeadlineFrom;
    if (filters.quotationDeadlineTo) q.quotationDeadlineTo = filters.quotationDeadlineTo;
    return q;
  }, [debouncedSearch, filters]);

  const { data: apiData = {}, isLoading, isFetching, refetch } = useApiQuery(
    rfqsApi.getList,
    [
      { ...queryFilters, companyId },
      { page, size: apiParams.size, ...(sortBy ? { sort: [`${sortBy},${sortOrder || 'asc'}`] } : {}) }
    ]
  );

  let allRfqs = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  const backendPage = apiData?.data?.page || apiData?.page || null;
  const totalElements = backendPage?.totalElements ?? allRfqs.length;
  const totalPages = backendPage?.totalPages ?? (Math.ceil(totalElements / (apiParams.size || 10)) || 1);
  const currentPageSize = backendPage?.size || apiParams.size || 10;

  const rfqs = allRfqs;

  const sendMutation = useApiMutation(rfqsApi.send);
  const sendEmailMutation = useApiMutation(rfqsApi.sendEmail);
  const closeMutation = useApiMutation(rfqsApi.close);
  const cancelMutation = useApiMutation(rfqsApi.cancel);

  const handleWorkflow = async (actionName, mutation, rfqId) => {
    if (!await confirmDialog({
      title: `${actionName} RFQ?`,
      message: `Are you sure you want to ${actionName.toLowerCase()} this RFQ?`,
      confirmText: actionName
    })) return;
    try {
      await mutation.mutateAsync([rfqId, companyId]);
      dispatch(addAlert({ type: 'success', message: `RFQ ${actionName.toLowerCase()} successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()} RFQ` }));
    }
  };

  const handleSendEmail = async (rfq, e) => {
    e.stopPropagation();
    const isResend = rfq.status === 'SENT';
    if (!await confirmDialog({
      title: isResend ? 'Resend RFQ Email?' : 'Send RFQ Email?',
      message: `This will ${isResend ? 'resend' : 'send'} the quotation request\nto all associated vendors.\n\nRFQ: ${rfq.rfqNumber}`,
      confirmText: 'Send Email'
    })) return;

    try {
      setSendingEmailId(rfq.id);
      const res = await sendEmailMutation.mutateAsync([rfq.id, companyId]);
      
      const data = res?.data || res;
      if (data?.emailsSentCount === 0 && data?.emailsFailedCount > 0) {
         dispatch(addAlert({ type: 'error', message: 'RFQ email could not be sent. Please check the vendor email or email service configuration.' }));
      } else if (data?.emailsFailedCount > 0) {
         dispatch(addAlert({ type: 'warning', message: `RFQ email dispatch completed with some failures. Sent: ${data.emailsSentCount}, Failed: ${data.emailsFailedCount}` }));
      } else if (data?.vendorsWithoutEmail > 0) {
         dispatch(addAlert({ type: 'info', message: `RFQ email dispatch completed. Sent: ${data.emailsSentCount}, Failed: 0, Vendors without email: ${data.vendorsWithoutEmail}` }));
      } else {
         dispatch(addAlert({ type: 'success', message: `RFQ email sent successfully. ${data?.emailsSentCount || 1} email(s) sent.` }));
      }
      refetch();
    } catch (err) {
      let msg = 'Email service is currently unavailable. Please try again later.';
      if (err?.response?.status === 400) msg = 'Unable to send email for this RFQ. The RFQ may be closed, cancelled, or have no vendors.';
      if (err?.response?.status === 404) msg = 'RFQ or vendor not found.';
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedRfqs([]);
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    refetch();
  };

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Open', value: 'OPEN' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Awarded', value: 'AWARDED' }
      ]
    },
    {
      key: 'issueDateFrom',
      label: 'Issue Date From',
      type: 'date'
    },
    {
      key: 'issueDateTo',
      label: 'Issue Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Quotation Deadline Range',
      fields: [
        {
          key: 'quotationDeadlineFrom',
          label: 'Quotation Deadline From',
          type: 'date'
        },
        {
          key: 'quotationDeadlineTo',
          label: 'Quotation Deadline To',
          type: 'date'
        }
      ]
    }
  ], []);

  const filterValues = useMemo(() => ({
    status: filters.status || '',
    issueDateFrom: filters.issueDateFrom || '',
    issueDateTo: filters.issueDateTo || '',
    quotationDeadlineFrom: filters.quotationDeadlineFrom || '',
    quotationDeadlineTo: filters.quotationDeadlineTo || ''
  }), [filters]);

  const vendorCount = (rfq) => {
    if (rfq?.vendors && Array.isArray(rfq.vendors)) return rfq.vendors.length;
    if (rfq?.vendorIds && Array.isArray(rfq.vendorIds)) return rfq.vendorIds.length;
    return rfq?.vendorCount || 0;
  };

  const columns = useMemo(() => [
    {
      key: 'rfqNumber',
      label: 'RFQ NO.',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-primary">{row.rfqNumber || '—'}</span>
        </div>
      )
    },
    {
      key: 'purchaseRequisitionNumber',
      label: 'PR NUMBER',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 font-medium">
          {row.purchaseRequisitionNumber || row.requisitionNumber || '—'}
        </span>
      )
    },
    {
      key: 'issueDate',
      label: 'ISSUE DATE',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'quotationDeadline',
      label: 'DEADLINE',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'expectedDeliveryDate',
      label: 'EXPECTED DELIVERY',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'vendors',
      label: 'VENDORS',
      align: 'center',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
          <Users size={12} className="text-zinc-400" />
          {vendorCount(row)}
        </span>
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

  const getRowActions = (rfq) => [
    {
      key: 'view',
      label: 'View RFQ',
      tooltip: 'View Details',
      'aria-label': 'View Details',
      icon: <Eye size={14} />,
      onClick: () => navigate(buildPath(`${rfqBasePath}/${rfq.id}`)),
      className: 'text-zinc-600 hover:text-indigo-600'
    },
    ...(rfq.status === 'SENT' || rfq.status === 'OPEN' ? [
      {
        key: 'create-quote',
        label: 'Create Supplier Quote',
        tooltip: 'Create Supplier Quotation',
        'aria-label': 'Create Supplier Quotation',
        icon: <Receipt size={14} />,
        onClick: () => setSelectedRfqForQuotation(rfq),
        className: 'text-emerald-600 hover:text-emerald-700'
      }
    ] : []),
    ...(rfq.status === 'DRAFT' && canEdit() ? [
      {
        key: 'edit',
        label: 'Edit RFQ',
        tooltip: 'Edit RFQ',
        'aria-label': 'Edit RFQ',
        icon: <Edit2 size={14} />,
        onClick: () => navigate(buildPath(`${rfqBasePath}/${rfq.id}/edit`)),
        className: 'text-zinc-600 hover:text-blue-600'
      },
      {
        key: 'send',
        label: 'Send RFQ',
        tooltip: 'Mark RFQ as Sent',
        'aria-label': 'Mark RFQ as Sent',
        icon: <Send size={14} />,
        onClick: () => handleWorkflow('Send', sendMutation, rfq.id),
        className: 'text-blue-600 hover:text-blue-700'
      }
    ] : []),
    ...(rfq.status === 'SENT' ? [
      {
        key: 'send-email',
        label: 'Send RFQ Email',
        tooltip: 'Send RFQ Email to Vendors',
        'aria-label': 'Send RFQ Email to Vendors',
        icon: sendingEmailId === rfq.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />,
        disabled: sendingEmailId === rfq.id,
        onClick: (e) => handleSendEmail(rfq, e),
        className: 'text-indigo-600 hover:text-indigo-700'
      }
    ] : []),
    ...(rfq.status === 'SENT' || rfq.status === 'OPEN' ? [
      {
        key: 'close',
        label: 'Close RFQ',
        tooltip: 'Close RFQ',
        'aria-label': 'Close RFQ',
        icon: <FileText size={14} />,
        onClick: () => handleWorkflow('Close', closeMutation, rfq.id),
        className: 'text-zinc-600 hover:text-zinc-800'
      }
    ] : []),
    ...(rfq.status !== 'CANCELLED' && rfq.status !== 'CLOSED' && rfq.status !== 'AWARDED' ? [
      {
        key: 'cancel',
        label: 'Cancel RFQ',
        tooltip: 'Cancel RFQ',
        'aria-label': 'Cancel RFQ',
        icon: <XCircle size={14} />,
        danger: true,
        onClick: () => handleWorkflow('Cancel', cancelMutation, rfq.id),
        className: 'text-red-600 hover:text-red-700'
      }
    ] : [])
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Top Header */}
      <PageHeader
        title="RFQs"
        description="Manage requests for supplier quotations"
        icon={FileSearch}
      >
        {canCreate() && (
          <button
            onClick={() => navigate(buildPath(`${rfqBasePath}/new`))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New RFQ</span>
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
          selectedRows={selectedRfqs}
          onSelectionChange={setSelectedRfqs}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={rfqs}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search RFQs..."
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
            localStorage.setItem('rfq_visible_columns', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(rfq) => <RfqOverview rfq={rfq} />}

          // Pagination
          pagination={{
            page,
            pageSize: currentPageSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="RFQs"

          // Empty State
          emptyMessage="No RFQs found"
          emptyDescription="Try adjusting your filters or create a new RFQ."
        />
      </div>

      {selectedRfqForQuotation && (
        <CreateSupplierQuotationModal
          isOpen={!!selectedRfqForQuotation}
          onClose={() => setSelectedRfqForQuotation(null)}
          rfq={selectedRfqForQuotation}
          companyId={companyId}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="rfqs"
          defaultFilters={queryFilters}
          selectedIds={selectedRfqs}
          selectedCount={selectedRfqs.length}
        />
      )}
    </div>
  );
}
