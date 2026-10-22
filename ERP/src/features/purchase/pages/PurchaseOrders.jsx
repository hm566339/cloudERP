import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
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
import DataTable from '../../../components/data-table/DataTable';
import AuditLogHover from '../../../components/common/AuditLogHover';
import ExportModal from '../../../components/common/ExportModal';
import PermissionGuard from '../../../components/common/PermissionGuard';
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
      tooltip: 'View Details',
      icon: <Eye size={16} />,
      onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id))
    });

    if ((po.status === 'DRAFT' || po.status === 'REJECTED') && canEdit()) {
      actions.push({
        tooltip: 'Edit',
        icon: <Edit2 size={16} />,
        onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/' + po.id))
      });
    }

    if (po.status === 'DRAFT') {
      actions.push({
        tooltip: 'Submit for Approval',
        icon: <CheckCircle size={16} />,
        onClick: () => handleAction(null, 'Submit', submitMutation, po.id, 'Are you sure you want to submit this Purchase Order for approval?')
      });
    }

    if (po.status === 'PENDING_APPROVAL' && canApprove()) {
      actions.push({
        tooltip: 'Approve',
        icon: <CheckCircle size={16} className="text-emerald-600" />,
        onClick: () => handleAction(null, 'Approve', approveMutation, po.id, 'Are you sure you want to approve this Purchase Order?')
      });
      actions.push({
        tooltip: 'Reject',
        icon: <Ban size={16} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Reject' })
      });
    }

    if (['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      actions.push({
        tooltip: 'Create GRN',
        icon: <Truck size={16} className="text-emerald-600" />,
        onClick: () => setSelectedPoForGrn(po)
      });
    }

    if (['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      const advanceRequired = po.advanceRequired === true;
      const advanceAmount = Number(po.advanceAmount) || 0;
      const advancePaidAmount = Number(po.advancePaidAmount) || 0;
      const remainingAdvance = Math.max(advanceAmount - advancePaidAmount, 0);

      if (!advanceRequired) {
        actions.push({
          tooltip: 'Require Advance Payment',
          icon: <DollarSign size={16} />,
          onClick: () => setRequireAdvanceModalConfig({ isOpen: true, po })
        });
      } else if (remainingAdvance > 0) {
        actions.push({
          tooltip: 'Create Advance Payment',
          icon: <CreditCard size={16} />,
          onClick: () => setSelectedPoForAdvance(po)
        });
      }
    }

    if (po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED') {
      actions.push({
        tooltip: 'Close Purchase Order',
        icon: <CheckCircle size={16} />,
        onClick: () => handleAction(null, 'Close', closeMutation, po.id, 'Are you sure you want to close this Purchase Order?')
      });
    }

    const hasReceivedItems = po.items?.some(i => (Number(i.receivedQuantity) || 0) > 0) || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED';
    
    if (['DRAFT', 'APPROVED', 'SENT'].includes(po.status) && !hasReceivedItems) {
      actions.push({
        tooltip: 'Cancel Purchase Order',
        icon: <Ban size={16} className="text-rose-600" />,
        onClick: () => setReasonModalConfig({ isOpen: true, poId: po.id, actionType: 'Cancel' })
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      id: 'poNumber',
      header: 'PO NUMBER',
      accessor: 'poNumber',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-zinc-400 shrink-0" />
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
      id: 'vendorName',
      header: 'SUPPLIER',
      accessor: 'vendorName',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-zinc-900">
          {row.vendorName || '-'}
        </span>
      )
    },
    {
      id: 'poDate',
      header: 'PO DATE',
      accessor: 'poDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.poDate)}</span>
      )
    },
    {
      id: 'expectedDeliveryDate',
      header: 'EXPECTED DELIVERY',
      accessor: 'expectedDeliveryDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.expectedDeliveryDate)}</span>
      )
    },
    {
      id: 'referenceNumber',
      header: 'REFERENCE NUMBER',
      accessor: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{row.referenceNumber || '-'}</span>
      )
    },
    {
      id: 'grandTotal',
      header: 'GRAND TOTAL',
      accessor: 'totalAmount',
      sortable: true,
      headerClassName: 'text-right',
      cell: (row) => (
        <div className="text-right font-mono text-xs font-semibold text-zinc-900">
          {row.currency || 'INR'} {(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      headerClassName: 'text-center',
      cell: (row) => (
        <div className="text-center">
          <StatusBadge status={row.status} statusConfig={PO_STATUS_CONFIG} />
        </div>
      )
    }
  ], [navigate, buildPath]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status || '',
      onChange: (val) => setFilter('status', val),
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'SENT', label: 'Sent' },
        { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
        { value: 'RECEIVED', label: 'Received' },
        { value: 'CLOSED', label: 'Closed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'REJECTED', label: 'Rejected' },
      ]
    },
    {
      id: 'poDateFrom',
      label: 'Date From',
      type: 'date',
      value: filters.poDateFrom || '',
      onChange: (val) => setFilter('poDateFrom', val)
    },
    {
      id: 'poDateTo',
      label: 'Date To',
      type: 'date',
      value: filters.poDateTo || '',
      onChange: (val) => setFilter('poDateTo', val)
    }
  ], [filters.status, filters.poDateFrom, filters.poDateTo, setFilter]);

  const advancedFilters = useMemo(() => [
    {
      id: 'vendorId',
      label: 'Supplier',
      type: 'select',
      value: filters.vendorId || '',
      onChange: (val) => setFilter('vendorId', val),
      options: [
        { value: '', label: 'All Suppliers' },
        ...vendorList.map(v => ({ value: String(v.id), label: v.vendorName || v.name }))
      ]
    },
    {
      id: 'poDateFrom',
      label: 'PO Date From',
      type: 'date',
      value: filters.poDateFrom || '',
      onChange: (val) => setFilter('poDateFrom', val)
    },
    {
      id: 'poDateTo',
      label: 'PO Date To',
      type: 'date',
      value: filters.poDateTo || '',
      onChange: (val) => setFilter('poDateTo', val)
    },
    {
      id: 'expectedDeliveryDateFrom',
      label: 'Expected Delivery From',
      type: 'date',
      value: filters.expectedDeliveryDateFrom || '',
      onChange: (val) => setFilter('expectedDeliveryDateFrom', val)
    },
    {
      id: 'expectedDeliveryDateTo',
      label: 'Expected Delivery To',
      type: 'date',
      value: filters.expectedDeliveryDateTo || '',
      onChange: (val) => setFilter('expectedDeliveryDateTo', val)
    }
  ], [filters, setFilter, vendorList]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and track procurement"
        icon={ShoppingCart}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-xs bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-2xs"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <PermissionGuard permission="PURCHASE_ORDERS:CREATE">
              <button
                onClick={() => navigate(buildPath('/accounts/transactions/purchase-orders/new'))}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} />
                <span>New Purchase Order</span>
              </button>
            </PermissionGuard>
          </div>
        }
      />

      <ModuleTabs tabs={purchaseTabs} />

      <div className="p-6">
        <DataTable
          permissionFeature="PURCHASE_ORDERS"
          data={orders}
          columns={columns}
          keyField="id"
          loading={isLoading || isFetching}
          searchable
          searchPlaceholder="Search purchase orders..."
          searchValue={searchTerm || ''}
          onSearchChange={setSearchTerm}
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}
          onReset={handleReset}
          advancedFilters={advancedFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleColumnSort}
          pagination={{
            currentPage: page,
            totalPages,
            totalElements,
            pageSize: currentSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
          columnVisibility
          selectable
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
          exportable
          onExport={() => setIsExportModalOpen(true)}
          refreshable
          onRefresh={refetch}
          getRowActions={getPoActions}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(po) => <PurchaseOrderOverview po={po} navigate={navigate} buildPath={buildPath} />}
          emptyState={{
            icon: ShoppingCart,
            title: 'No Purchase Orders found',
            description: 'Create a purchase order to start managing your procurement.',
            action: canCreate() ? {
              label: 'New Purchase Order',
              icon: Plus,
              onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders/new'))
            } : null
          }}
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="purchase-orders"
      />

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
