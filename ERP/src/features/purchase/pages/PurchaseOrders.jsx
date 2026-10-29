
import React, { useState, useMemo } from 'react';
import {
  Plus, FileSearch, RefreshCw, X, RotateCcw, FileText,
  Eye, Edit2, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  Filter, Package, Users, ShoppingCart, CheckCircle, Ban, ArrowRightCircle, Download, Loader2, CreditCard, DollarSign, Truck
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import ExportModal from '../../../components/common/ExportModal';
import CreateAdvancePaymentModal from '../components/CreateAdvancePaymentModal';
import RequireAdvanceModal from '../components/RequireAdvanceModal';
import CreateGrnModal from '../components/CreateGrnModal';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useRBAC } from '../../../utils/rbac';

import {
  useGetPurchaseOrdersQuery,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation
} from '../../../api/purchase';
import { useApiQuery } from '../../../hooks/useApi';
import { vendorsApi } from '../../../api/account';
import StatusBadge from '../../../components/common/StatusBadge';
import { PO_STATUS_CONFIG } from '../constants';
import ActionReasonModal from '../components/ActionReasonModal';
import PurchaseOrderOverview from '../components/PurchaseOrderOverview';

const ALL_COLUMNS = [
  { id: 'poNumber', label: 'PO NUMBER' },
  { id: 'vendorName', label: 'SUPPLIER' },
  { id: 'poDate', label: 'PO DATE' },
  { id: 'expectedDeliveryDate', label: 'EXPECTED DELIVERY' },
  { id: 'referenceNumber', label: 'REFERENCE NUMBER' },
  { id: 'grandTotal', label: 'GRAND TOTAL' },
  { id: 'status', label: 'STATUS' }
];

const DEFAULT_COLUMNS = ['poNumber', 'vendorName', 'poDate', 'expectedDeliveryDate', 'referenceNumber', 'grandTotal', 'status'];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

export default function PurchaseOrders() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const { canCreate, canEdit, canApprove } = useRBAC();

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('po_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedPoForAdvance, setSelectedPoForAdvance] = useState(null);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState(null);
  const [requireAdvanceModalConfig, setRequireAdvanceModalConfig] = useState({ isOpen: false, po: null });
  const [processingId, setProcessingId] = useState(null);
  const [reasonModalConfig, setReasonModalConfig] = useState({ isOpen: false, poId: null, actionType: null });

  const {
    page, setPage, pageSize, setPageSize, apiParams,
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
    if (filters.poDateFrom) q.fromDate = filters.poDateFrom;
    if (filters.poDateTo) q.toDate = filters.poDateTo;
    if (filters.expectedDeliveryDateFrom) q.expectedDeliveryDateFrom = filters.expectedDeliveryDateFrom;
    if (filters.expectedDeliveryDateTo) q.expectedDeliveryDateTo = filters.expectedDeliveryDateTo;
    if (filters.vendorId) q.vendorId = filters.vendorId;
    q.companyId = companyId;
    return q;
  }, [debouncedSearch, filters, companyId]);

  const payload = {
    ...apiParams,
    ...listFilters
  };

  const { data: apiData = {}, isLoading, isFetching, refetch } = useGetPurchaseOrdersQuery(payload);

  let allOrders = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  if (debouncedSearch) {
    const s = debouncedSearch.toLowerCase();
    allOrders = allOrders.filter(
      po =>
        po.poNumber?.toLowerCase().includes(s) ||
        po.vendorName?.toLowerCase().includes(s) ||
        po.referenceNumber?.toLowerCase().includes(s)
    );
  }
  if (filters.status) {
    allOrders = allOrders.filter(po => po.status === filters.status);
  }

  const sortedOrders = useMemo(() => {
    if (!sortBy) return allOrders;
    return [...allOrders].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'grandTotal' || sortBy === 'totalAmount') {
        aVal = a.totalAmount ?? a.grandTotal ?? 0;
        bVal = b.totalAmount ?? b.grandTotal ?? 0;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [allOrders, sortBy, sortOrder]);

  const extractedTotalElements = apiData?.data?.pagination?.totalElements || apiData?.pagination?.totalElements || apiData?.data?.totalElements || sortedOrders.length;
  const actualTotalElements = sortedOrders.length < extractedTotalElements ? sortedOrders.length : extractedTotalElements;
  const currentSize = apiParams.size || 10;

  const totalElements = actualTotalElements;
  const totalPages = Math.ceil(totalElements / currentSize) || 1;

  const orders = sortedOrders.slice(page * currentSize, (page + 1) * currentSize);

  const [submitMutation] = useSubmitPurchaseOrderMutation();
  const [approveMutation] = useApprovePurchaseOrderMutation();
  const [rejectMutation] = useRejectPurchaseOrderMutation();
  const [sendMutation] = useSendPurchaseOrderMutation();
  const [cancelMutation] = useCancelPurchaseOrderMutation();
  const [closeMutation] = useClosePurchaseOrderMutation();

  const handleAction = async (e, actionName, mutationFn, poId, confirmMsg, successMessage, extraArgs = {}) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (processingId) return;

    if (!await confirmDialog({
      title: `${actionName} Purchase Order`,
      message: confirmMsg,
      confirmText: actionName,
      cancelText: 'Cancel'
    })) return;

    setProcessingId(poId + actionName);
    try {
      await mutationFn({ id: poId, companyId, ...extraArgs }).unwrap();
      dispatch(addAlert({ type: 'success', message: successMessage || `Purchase Order ${actionName.toLowerCase()}d successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()} Purchase Order` }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedOrders([]);
    setPage(0);
  };

  const getPoActions = (po) => {
    const actions = [];

    actions.push({
      key: 'view',
      label: 'View Details',
      tooltip: 'View Details',
      'aria-label': 'View Details',
      icon: <Eye size={14} />,
      onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id)),
      className: 'text-zinc-600 hover:text-indigo-600'
    });

    if ((po.status === 'DRAFT' || po.status === 'REJECTED') && canEdit()) {
      actions.push({
        key: 'edit',
        label: 'Edit',
        tooltip: 'Edit',
        'aria-label': 'Edit',
        icon: <Edit2 size={14} />,
        onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id)),
        className: 'text-zinc-600 hover:text-blue-600'
      });
    }

    if (po.status === 'DRAFT') {
      actions.push({
        key: 'submit',
        label: 'Submit for Approval',
        tooltip: 'Submit for Approval',
        'aria-label': 'Submit for Approval',
        icon: <CheckCircle size={14} />,
        onClick: () => handleAction(null, 'Submit', submitMutation, po.id, 'Are you sure you want to submit this Purchase Order for approval?'),
        className: 'text-zinc-600 hover:text-emerald-600'
      });
    }

    if (po.status === 'PENDING_APPROVAL' && canApprove()) {
      actions.push({
        key: 'approve',
        label: 'Approve',
        tooltip: 'Approve',
        'aria-label': 'Approve',
        icon: <CheckCircle size={14} className="text-emerald-600" />,
        onClick: () => handleAction(null, 'Approve', approveMutation, po.id, 'Are you sure you want to approve this Purchase Order?'),
        className: 'text-emerald-600 hover:text-emerald-700'
      });
      actions.push({
        key: 'reject',
        label: 'Reject',
        tooltip: 'Reject',
        'aria-label': 'Reject',
        icon: <Ban size={14} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Reject' }),
        className: 'text-rose-600 hover:text-rose-700'
      });
    }

    if (['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      actions.push({
        key: 'grn',
        label: 'Create GRN',
        tooltip: 'Create GRN',
        'aria-label': 'Create GRN',
        icon: <Truck size={14} className="text-emerald-600" />,
        onClick: () => setSelectedPoForGrn(po),
        className: 'text-emerald-600 hover:text-emerald-700'
      });
    }

    if (['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      const advanceRequired = po.advanceRequired === true;
      const advanceAmount = Number(po.advanceAmount) || 0;
      const advancePaidAmount = Number(po.advancePaidAmount) || 0;
      const remainingAdvance = Math.max(advanceAmount - advancePaidAmount, 0);

      if (!advanceRequired) {
        actions.push({
          key: 'require-advance',
          label: 'Require Advance Payment',
          tooltip: 'Require Advance Payment',
          'aria-label': 'Require Advance Payment',
          icon: <DollarSign size={14} />,
          onClick: () => setRequireAdvanceModalConfig({ isOpen: true, po }),
          className: 'text-zinc-600 hover:text-indigo-600'
        });
      } else if (remainingAdvance > 0) {
        actions.push({
          key: 'advance',
          label: 'Create Advance Payment',
          tooltip: 'Create Advance Payment',
          'aria-label': 'Create Advance Payment',
          icon: <CreditCard size={14} />,
          onClick: () => setSelectedPoForAdvance(po),
          className: 'text-zinc-600 hover:text-indigo-600'
        });
      }
    }

    if (po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED') {
      actions.push({
        key: 'close',
        label: 'Close Purchase Order',
        tooltip: 'Close Purchase Order',
        'aria-label': 'Close Purchase Order',
        icon: <CheckCircle size={14} />,
        onClick: () => handleAction(null, 'Close', closeMutation, po.id, 'Are you sure you want to close this Purchase Order?'),
        className: 'text-zinc-600 hover:text-emerald-600'
      });
    }

    const hasReceivedItems = po.items?.some(i => (Number(i.receivedQuantity) || 0) > 0) || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED';

    if (['DRAFT', 'APPROVED', 'SENT'].includes(po.status) && !hasReceivedItems) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Purchase Order',
        tooltip: 'Cancel Purchase Order',
        'aria-label': 'Cancel Purchase Order',
        icon: <Ban size={14} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Cancel' }),
        className: 'text-rose-600 hover:text-rose-700'
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      key: 'poNumber',
      id: 'poNumber',
      label: 'PO NUMBER',
      header: 'PO NUMBER',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(buildPath('/accounts/transactions/purchase-orders/' + row.id));
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.poNumber || '-'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      key: 'vendorName',
      id: 'vendorName',
      label: 'SUPPLIER',
      header: 'SUPPLIER',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">
          {row.vendorName || '-'}
        </span>
      )
    },
    {
      key: 'poDate',
      id: 'poDate',
      label: 'PO DATE',
      header: 'PO DATE',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.poDate)}</span>
      )
    },
    {
      key: 'expectedDeliveryDate',
      id: 'expectedDeliveryDate',
      label: 'EXPECTED DELIVERY',
      header: 'EXPECTED DELIVERY',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.expectedDeliveryDate)}</span>
      )
    },
    {
      key: 'referenceNumber',
      id: 'referenceNumber',
      label: 'REFERENCE NUMBER',
      header: 'REFERENCE NUMBER',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600">{row.referenceNumber || '-'}</span>
      )
    },
    {
      key: 'grandTotal',
      id: 'grandTotal',
      label: 'GRAND TOTAL',
      header: 'GRAND TOTAL',
      sortable: true,
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900">
          {row.currency || 'INR'} {(row.totalAmount ?? row.grandTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      id: 'status',
      label: 'STATUS',
      header: 'STATUS',
      sortable: true,
      align: 'center',
      headerClassName: 'text-center',
      render: (val, row) => (
        <div className="text-center">
          <StatusBadge status={row.status} statusConfig={PO_STATUS_CONFIG} />
        </div>
      )
    }
  ], [navigate, buildPath]);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
        { label: 'Received', value: 'RECEIVED' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Rejected', value: 'REJECTED' }
      ]
    },
    {
      key: 'poDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'poDateTo',
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
            ...vendorList.map(v => ({ label: v.vendorName || v.name, value: String(v.id) }))
          ]
        }
      ]
    },
    {
      title: 'Delivery Schedule',
      fields: [
        {
          key: 'expectedDeliveryDateFrom',
          label: 'Expected Delivery From',
          type: 'date'
        },
        {
          key: 'expectedDeliveryDateTo',
          label: 'Expected Delivery To',
          type: 'date'
        }
      ]
    }
  ], [vendorList]);

  const filterValues = useMemo(() => ({
    status: filters.status || '',
    poDateFrom: filters.poDateFrom || '',
    poDateTo: filters.poDateTo || '',
    vendorId: filters.vendorId || '',
    expectedDeliveryDateFrom: filters.expectedDeliveryDateFrom || '',
    expectedDeliveryDateTo: filters.expectedDeliveryDateTo || ''
  }), [filters]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Top Header */}
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and track procurement"
        icon={ShoppingCart}
      >
        {canCreate() && (
          <button
            onClick={() => navigate(buildPath('/accounts/transactions/purchase-orders/new'))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
        )}
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={purchaseTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedOrders}
          onSelectionChange={setSelectedOrders}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={orders}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search purchase orders..."
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
            localStorage.setItem('po_visible_columns_v2', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getPoActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(po) => <PurchaseOrderOverview po={po} navigate={navigate} buildPath={buildPath} />}

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
          itemName="orders"

          // Empty State
          emptyMessage="No purchase orders found"
          emptyDescription="Create a purchase order to start managing your procurement."
        />
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="purchase-orders"
          defaultFilters={listFilters}
          selectedIds={selectedOrders}
          selectedCount={selectedOrders.length}
        />
      )}

      <CreateAdvancePaymentModal
        isOpen={!!selectedPoForAdvance}
        onClose={() => setSelectedPoForAdvance(null)}
        purchaseOrder={selectedPoForAdvance}
      />

      {selectedPoForGrn && (
        <CreateGrnModal
          isOpen={!!selectedPoForGrn}
          onClose={() => setSelectedPoForGrn(null)}
          purchaseOrder={selectedPoForGrn}
          companyId={companyId}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <RequireAdvanceModal
        isOpen={requireAdvanceModalConfig.isOpen}
        onClose={() => setRequireAdvanceModalConfig({ isOpen: false, po: null })}
        purchaseOrder={requireAdvanceModalConfig.po}
        refetch={refetch}
      />

      <ActionReasonModal
        isOpen={reasonModalConfig.isOpen}
        onClose={() => setReasonModalConfig({ isOpen: false, poId: null, actionType: null })}
        onSubmit={async (reason) => {
          const { poId, actionType } = reasonModalConfig;
          if (processingId) return;

          setProcessingId(poId + actionType);
          try {
            const extraArgs = { reason };
            if (actionType === 'Reject') {
              await rejectMutation({ id: poId, companyId, ...extraArgs }).unwrap();
            } else if (actionType === 'Cancel') {
              await cancelMutation({ id: poId, companyId, ...extraArgs }).unwrap();
            }
            dispatch(addAlert({ type: 'success', message: `Purchase Order ${actionType.toLowerCase()}ed successfully.` }));
            refetch();
            setReasonModalConfig({ isOpen: false, poId: null, actionType: null });
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || `Failed to ${actionType.toLowerCase()} Purchase Order` }));
          } finally {
            setProcessingId(null);
          }
        }}
        actionType={reasonModalConfig.actionType}
        loading={processingId === reasonModalConfig.poId + reasonModalConfig.actionType}
      />
    </div>
  );
}
