import React, { useState, useMemo } from 'react';
import { 
  Plus, CheckCircle, RefreshCw, FileText, RotateCcw, Search, 
  Calendar, X, Eye, Edit, Trash2, Send, Ban, FileSearch, ClipboardList,
  Package, Users, ExternalLink, Loader2, Download, SlidersHorizontal
} from 'lucide-react';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import ExportModal from '../../../components/common/ExportModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { purchaseRequisitionsApi } from '../../../api/account';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import usePermission from '../../../hooks/usePermission';
import { useRBAC } from '../../../utils/rbac';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ColumnVisibilityToggle from '../../../components/common/ColumnVisibilityToggle';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useRoutePath } from '../../../hooks/useRoutePath';
import CreateRfqModal from '../components/CreateRfqModal';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  } catch {
    return '—';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch {
    return '—';
  }
};

const PurchaseRequisitionOverview = ({ pr, renderStatusBadge, navigate, buildPath }) => {
  const prId = pr?.id;
  const needsFetch = !pr?.items || !Array.isArray(pr.items) || pr.items.length === 0;

  const { data: detailResponse, isLoading } = useApiQuery(
    purchaseRequisitionsApi.getById,
    prId,
    { enabled: Boolean(prId && needsFetch) }
  );

  const detail = detailResponse?.data?.data || detailResponse?.data || detailResponse;
  const fullPr = (detail && typeof detail === 'object' && ('requisitionNumber' in detail || 'items' in detail))
    ? { ...pr, ...detail }
    : pr;

  const items = Array.isArray(fullPr.items) ? fullPr.items : [];

  if (isLoading && needsFetch) {
    return (
      <div 
        className="p-6 bg-white dark:bg-card-dark border border-zinc-100 dark:border-border-dark rounded-xl shadow-sm m-4 mb-2 flex items-center justify-center gap-2 text-zinc-500 text-xs cursor-default" 
        onClick={(e) => e.stopPropagation()}
      >
        <Loader2 size={16} className="animate-spin text-zinc-600" />
        <span>Loading requisition details...</span>
      </div>
    );
  }

  return (
    <div 
      className="p-5 bg-white dark:bg-card-dark border border-zinc-100 dark:border-border-dark rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2 cursor-default" 
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {fullPr.requisitionNumber || '—'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              {fullPr.requisitionName || fullPr.purpose || `Requisition ${fullPr.requisitionNumber || ''}`}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Required Date: {formatDate(fullPr.requiredDate)}
              {fullPr.createdAt && ` | Created: ${formatDateTime(fullPr.createdAt)}`}
              {fullPr.priority && ` | Priority: `}
              {fullPr.priority && <span className="font-semibold text-zinc-700">{fullPr.priority}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge(fullPr.status)}
          <button
            onClick={() => navigate(buildPath(`/accounts/transactions/purchase-requisitions/${fullPr.id}`))}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
            title="Open Full Details Page"
            aria-label="Open Full Details Page"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* 3-Column Card Layout (matching RFQs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
        {/* Card 1: Requisition Details */}
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <FileText size={13} /> Requisition Details
          </h4>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Requester:</span>
            <span className="font-medium text-zinc-800">{fullPr.requesterName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Department:</span>
            <span className="font-medium text-zinc-800">{fullPr.departmentName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Cost Center:</span>
            <span className="font-medium text-zinc-800">{fullPr.costCenterName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Priority:</span>
            <span className="font-medium text-zinc-800">{fullPr.priority || '—'}</span>
          </div>
          {fullPr.purpose && (
            <div className="pt-2 border-t border-zinc-200/60">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Purpose:</span>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap">{fullPr.purpose}</p>
            </div>
          )}
          {fullPr.remarks && (
            <div className="pt-2 border-t border-zinc-200/60">
              <span className="text-[10px] text-zinc-500 block mb-0.5">Remarks:</span>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap">{fullPr.remarks}</p>
            </div>
          )}
        </div>

        {/* Card 2: Requested Items */}
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Package size={13} /> Requested Items ({items.length})
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const qty = item.quantity ?? item.requestedQuantity;
                return (
                  <div key={item.id || idx} className="bg-white dark:bg-surface-dark p-2.5 rounded border border-zinc-200 dark:border-border-dark text-xs text-zinc-800 dark:text-zinc-200">
                    <div className="font-semibold text-zinc-900">{item.itemName || item.productName || '—'}</div>
                    <div className="text-zinc-500 text-[11px] mt-0.5">
                      Qty: <span className="font-medium text-zinc-800">{qty != null ? Number(qty).toLocaleString() : '—'} {item.unit || ''}</span>
                      {item.requiredDate && ` | Req: ${formatDate(item.requiredDate)}`}
                    </div>
                    {(item.description || item.specifications || item.remarks) && (
                      <div className="text-zinc-500 text-[10px] mt-0.5 truncate">
                        {item.description || item.specifications || item.remarks}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 italic">No items attached</p>
            )}
          </div>
        </div>

        {/* Card 3: Workflow & Audit */}
        <div className="space-y-3 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Users size={13} /> Workflow & Audit
          </h4>
          <div className="space-y-2 text-xs">
            {fullPr.requesterName && (
              <div className="bg-white dark:bg-surface-dark p-2 rounded border border-zinc-200 dark:border-border-dark flex items-center justify-between text-zinc-800 dark:text-zinc-200">
                <div>
                  <span className="text-zinc-400 text-[10px] block">Created By</span>
                  <span className="font-medium text-zinc-800">{fullPr.requesterName}</span>
                </div>
                {fullPr.createdAt && (
                  <span className="text-[10px] text-zinc-500">{formatDate(fullPr.createdAt)}</span>
                )}
              </div>
            )}
            {fullPr.submittedBy ? (
              <div className="bg-white dark:bg-surface-dark p-2 rounded border border-zinc-200 dark:border-border-dark flex items-center justify-between text-zinc-800 dark:text-zinc-200">
                <div>
                  <span className="text-blue-500 text-[10px] font-semibold block">Submitted By</span>
                  <span className="font-medium text-zinc-800">{fullPr.submittedBy}</span>
                </div>
                {fullPr.submittedAt && (
                  <span className="text-[10px] text-zinc-500">{formatDate(fullPr.submittedAt)}</span>
                )}
              </div>
            ) : (
              fullPr.status === 'SUBMITTED' && (
                <div className="bg-amber-50/60 p-2 rounded border border-amber-200 text-amber-700 text-[11px] font-medium">
                  Pending approval
                </div>
              )
            )}
            {fullPr.approvedBy && (
              <div className="bg-white dark:bg-surface-dark p-2 rounded border border-zinc-200 dark:border-border-dark flex items-center justify-between text-zinc-800 dark:text-zinc-200">
                <div>
                  <span className="text-emerald-600 text-[10px] font-semibold block">Approved By</span>
                  <span className="font-medium text-zinc-800">{fullPr.approvedBy}</span>
                </div>
                {fullPr.approvedAt && (
                  <span className="text-[10px] text-zinc-500">{formatDate(fullPr.approvedAt)}</span>
                )}
              </div>
            )}
            {fullPr.rejectedBy && (
              <div className="bg-rose-50/60 p-2 rounded border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-rose-600 text-[10px] font-semibold block">Rejected By</span>
                  {fullPr.rejectedAt && (
                    <span className="text-[10px] text-zinc-500">{formatDate(fullPr.rejectedAt)}</span>
                  )}
                </div>
                <span className="font-medium text-zinc-800 block text-xs mt-0.5">{fullPr.rejectedBy}</span>
                {fullPr.rejectionReason && (
                  <p className="text-[10px] text-rose-700 mt-1 italic">Reason: {fullPr.rejectionReason}</p>
                )}
              </div>
            )}
            {fullPr.cancelledBy && (
              <div className="bg-zinc-100 p-2 rounded border border-zinc-200">
                <span className="text-zinc-500 text-[10px] font-semibold block">Cancelled By</span>
                <span className="font-medium text-zinc-700 block text-xs mt-0.5">{fullPr.cancelledBy}</span>
                {fullPr.cancelledReason && (
                  <p className="text-[10px] text-zinc-600 mt-1 italic">Reason: {fullPr.cancelledReason}</p>
                )}
              </div>
            )}
            {!fullPr.submittedBy && !fullPr.approvedBy && !fullPr.rejectedBy && !fullPr.cancelledBy && (
              <div className="bg-white dark:bg-surface-dark p-2.5 rounded border border-zinc-200 dark:border-border-dark text-xs text-zinc-800 dark:text-zinc-200 text-zinc-500">
                Current status: <span className="font-semibold text-zinc-700">{fullPr.status || 'DRAFT'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PurchaseRequests() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const userPermissions = useAppSelector(state => state.auth?.permissions || []);
  const safePerms = userPermissions.map(p => typeof p === 'string' ? p.toUpperCase() : '');
  const { canCreate, canEdit: rbacCanEdit, canApprove: rbacCanApprove } = useRBAC();
  const permissionUpdate = usePermission('PURCHASE_REQUISITIONS', 'UPDATE');
  const permissionApprove = usePermission('PURCHASE_REQUISITIONS', 'APPROVE');
  const canUpdate = rbacCanEdit() || safePerms.includes('PURCHASE_REQUISITION_EDIT') || safePerms.includes('UPDATE') || permissionUpdate;
  const canApprove = rbacCanApprove() || permissionApprove;

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters();

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPrForRfq, setSelectedPrForRfq] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRequisitions, setSelectedRequisitions] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const ALL_COLUMNS = [
    { id: 'requisitionNumber', label: 'PR NUMBER' },
    { id: 'item', label: 'ITEM' },
    { id: 'quantity', label: 'QTY' },
    { id: 'requesterName', label: 'REQUESTER' },
    { id: 'departmentName', label: 'DEPARTMENT' },
    { id: 'costCenterName', label: 'COST CENTER' },
    { id: 'requiredDate', label: 'REQUIRED DATE' },
    { id: 'priority', label: 'PRIORITY' },
    { id: 'purpose', label: 'PURPOSE' },
    { id: 'status', label: 'STATUS' },
    { id: 'createdAt', label: 'CREATED DATE' }
  ];

  const DEFAULT_COLUMNS = ['requisitionNumber', 'item', 'quantity', 'requesterName', 'departmentName', 'requiredDate', 'priority', 'status'];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const listFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    requiredDateFrom: filters.requiredDateFrom || undefined,
    requiredDateTo: filters.requiredDateTo || undefined,
    createdDateFrom: filters.createdDateFrom || undefined,
    createdDateTo: filters.createdDateTo || undefined,
    departmentName: filters.departmentName || undefined,
    departmentId: filters.departmentId || undefined,
    companyId,
  }), [debouncedSearch, filters, companyId]);

  const payload = {
    ...apiParams,
    ...listFilters,
    search: undefined
  };

  const { data: apiData = {}, isLoading, isFetching, refetch } = useApiQuery(purchaseRequisitionsApi.getList, { ...payload });

  let allRequisitions = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];

  if (debouncedSearch) {
    const s = debouncedSearch.toLowerCase();
    allRequisitions = allRequisitions.filter(pr =>
      pr.requisitionNumber?.toLowerCase().includes(s) ||
      pr.requesterName?.toLowerCase().includes(s) ||
      pr.departmentName?.toLowerCase().includes(s) ||
      pr.purpose?.toLowerCase().includes(s)
    );
  }
  if (filters.status) {
    allRequisitions = allRequisitions.filter(pr => pr.status === filters.status);
  }
  if (filters.priority) {
    allRequisitions = allRequisitions.filter(pr => pr.priority === filters.priority);
  }
  if (filters.requiredDateFrom) {
    const from = new Date(filters.requiredDateFrom).getTime();
    allRequisitions = allRequisitions.filter(pr => {
      const d = pr.requiredDate ? new Date(pr.requiredDate).getTime() : 0;
      return d >= from;
    });
  }
  if (filters.requiredDateTo) {
    const to = new Date(filters.requiredDateTo).setHours(23, 59, 59, 999);
    allRequisitions = allRequisitions.filter(pr => {
      const d = pr.requiredDate ? new Date(pr.requiredDate).getTime() : 0;
      return d <= to;
    });
  }
  if (filters.createdDateFrom) {
    const from = new Date(filters.createdDateFrom).getTime();
    allRequisitions = allRequisitions.filter(pr => {
      const d = pr.createdAt ? new Date(pr.createdAt).getTime() : 0;
      return d >= from;
    });
  }
  if (filters.createdDateTo) {
    const to = new Date(filters.createdDateTo).setHours(23, 59, 59, 999);
    allRequisitions = allRequisitions.filter(pr => {
      const d = pr.createdAt ? new Date(pr.createdAt).getTime() : 0;
      return d <= to;
    });
  }
  if (filters.departmentName) {
    const dep = filters.departmentName.toLowerCase();
    allRequisitions = allRequisitions.filter(pr => pr.departmentName?.toLowerCase().includes(dep));
  }

  const extractedTotalElements = apiData?.data?.pagination?.totalElements || apiData?.pagination?.totalElements || allRequisitions.length;
  const actualTotalElements = allRequisitions.length < extractedTotalElements ? allRequisitions.length : extractedTotalElements;

  const currentSize = pageSize || 10;

  const pageInfo = {
    totalPages: Math.ceil(actualTotalElements / currentSize) || 1,
    totalElements: actualTotalElements
  };

  const isFullyLoaded = (Array.isArray(apiData) || allRequisitions.length === extractedTotalElements) && allRequisitions.length > 0;
  const shouldSlice = isFullyLoaded || debouncedSearch || filters.status || filters.priority || filters.requiredDateFrom || filters.requiredDateTo || filters.departmentName || filters.createdDateFrom || filters.createdDateTo;

  const requisitions = shouldSlice
    ? allRequisitions.slice(page * currentSize, (page + 1) * currentSize)
    : allRequisitions;

  const submitMutation = useApiMutation(purchaseRequisitionsApi.submit);
  const approveMutation = useApiMutation(purchaseRequisitionsApi.approve);
  const rejectMutation = useApiMutation(purchaseRequisitionsApi.reject);
  const cancelMutation = useApiMutation(purchaseRequisitionsApi.cancel);

  const handleReset = () => {
    resetFilters();
    setSearch('');
    setSelectedRequisitions([]);
    setPage(0);
  };

  const handleAction = async (actionName, mutation, prId, confirmMsg, successMessage, extraPayload, confirmLabels = {}) => {
    if (!await confirmDialog({
      title: `${actionName} Requisition?`,
      message: confirmMsg,
      ...confirmLabels
    })) return;
    try {
      const args = extraPayload ? [prId, extraPayload, companyId] : [prId, companyId];
      await mutation.mutateAsync(args);
      dispatch(addAlert({ type: 'success', message: successMessage || `${actionName} completed successfully.` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}` }));
    }
  };

  const handleRejectWithReason = async (prId) => {
    setRejectReason('');
    setRejectTarget(prId);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync([rejectTarget, rejectReason ? { rejectionReason: rejectReason } : {}, companyId]);
      dispatch(addAlert({ type: 'success', message: 'Requisition rejected successfully.' }));
      refetch();
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to reject' }));
    }
  };

  const getRowActions = (pr) => {
    const status = String(pr.status || '').toUpperCase();
    const prId = pr.id;
    const isTerminal = status === 'APPROVED' || status === 'CANCELLED';
    const isExpanded = expandedRowId === pr.id;

    return [
      {
        key: 'view',
        label: isExpanded ? 'Collapse' : 'View',
        tooltip: isExpanded ? 'Collapse Details' : 'View Details',
        'aria-label': isExpanded ? 'Collapse Details' : 'View Details',
        icon: <Eye size={14} className={isExpanded ? 'text-indigo-600' : ''} />,
        onClick: () => setExpandedRowId(prev => prev === pr.id ? null : pr.id),
        className: isExpanded ? 'text-indigo-600 bg-indigo-50/80 rounded' : 'text-zinc-600 hover:text-indigo-600',
      },
      ...(pr.audit ? [
        {
          key: 'audit',
          component: ({ row }) => <AuditLogHover audit={row.audit} />
        }
      ] : []),
      ...(canCreate() && status === 'APPROVED' ? [
        {
          key: 'create-rfq',
          label: 'Create RFQ',
          tooltip: 'Create RFQ',
          'aria-label': 'Create RFQ',
          icon: <FileSearch size={14} />,
          onClick: () => setSelectedPrForRfq(pr),
          className: 'text-zinc-600 hover:text-purple-600',
        }
      ] : []),
      ...(canUpdate && (status === 'DRAFT' || status === 'REJECTED') ? [
        {
          key: 'edit',
          label: 'Edit',
          tooltip: 'Edit Requisition',
          'aria-label': 'Edit Requisition',
          icon: <Edit size={14} />,
          onClick: () => navigate(buildPath(`/accounts/transactions/purchase-requisitions/${prId}/edit`)),
          className: 'text-zinc-600 hover:text-blue-600',
        }
      ] : []),
      ...(canUpdate && status === 'DRAFT' ? [
        {
          key: 'submit',
          label: 'Submit',
          tooltip: submitMutation.isLoading ? 'Submitting...' : 'Submit for Approval',
          'aria-label': 'Submit for Approval',
          icon: <Send size={14} />,
          disabled: submitMutation.isLoading,
          onClick: () => handleAction('Submit', submitMutation, prId, 'Are you sure you want to submit this requisition for approval?'),
          className: 'text-zinc-600 hover:text-blue-600',
        }
      ] : []),
      ...(canApprove && status === 'SUBMITTED' ? [
        {
          key: 'approve',
          label: 'Approve',
          tooltip: approveMutation.isLoading ? 'Approving...' : 'Approve Requisition',
          'aria-label': 'Approve Requisition',
          icon: <CheckCircle size={14} />,
          disabled: approveMutation.isLoading,
          onClick: () => handleAction('Approve', approveMutation, prId, 'Are you sure you want to approve this requisition?'),
          className: 'text-emerald-600 hover:text-emerald-700',
        },
        {
          key: 'reject',
          label: 'Reject',
          tooltip: (rejectMutation.isLoading || !!rejectTarget) ? 'Processing...' : 'Reject Requisition',
          'aria-label': 'Reject Requisition',
          icon: <X size={14} />,
          danger: true,
          disabled: rejectMutation.isLoading || !!rejectTarget,
          onClick: () => handleRejectWithReason(prId),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : []),
      ...(canUpdate && !isTerminal ? [
        {
          key: 'cancel',
          label: 'Cancel',
          tooltip: cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Requisition',
          'aria-label': 'Cancel Requisition',
          icon: <Ban size={14} />,
          danger: true,
          disabled: cancelMutation.isLoading,
          onClick: () => handleAction('Cancel', cancelMutation, prId, 'Are you sure you want to cancel this purchase requisition?', undefined, undefined, { cancelLabel: 'No', confirmLabel: 'Yes, Cancel' }),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : [])
    ];
  };

  const renderStatusBadge = (status) => {
    if (!status) return <span className="text-zinc-400">-</span>;
    const s = String(status).toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
          APPROVED
        </span>
      );
    }
    if (s === 'SUBMITTED') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200">
          SUBMITTED
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">
          DRAFT
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200">
          REJECTED
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-100 text-zinc-600 border-zinc-200">
          CANCELLED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return 'text-zinc-500';
    const p = priority.toString().toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') return 'text-red-600 font-bold';
    if (p === 'MEDIUM') return 'text-orange-600 font-semibold';
    if (p === 'LOW') return 'text-emerald-600 font-medium';
    return 'text-zinc-600';
  };

  const getPrimaryItem = (pr) => {
    if (pr && Array.isArray(pr.items) && pr.items.length > 0) {
      const item = pr.items[0];
      return {
        name: item.itemName || item.productName || '-',
        description: item.description || item.specifications || item.remarks || '',
        quantity: item.quantity ?? item.requestedQuantity
      };
    }
    return null;
  };

  const columns = useMemo(() => [
    {
      key: 'requisitionNumber',
      label: 'PR NUMBER',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-zinc-800 tracking-tight">{row.requisitionNumber}</span>
        </div>
      )
    },
    {
      key: 'item',
      label: 'ITEM',
      render: (val, row) => {
        const primaryItem = getPrimaryItem(row);
        return primaryItem ? (
          <div className="flex flex-col min-w-0 max-w-[220px]">
            <span className="font-medium text-zinc-800 truncate">{primaryItem.name}</span>
            {primaryItem.description && (
              <span className="text-zinc-500 text-xs truncate">{primaryItem.description}</span>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      }
    },
    {
      key: 'quantity',
      label: 'QTY',
      align: 'right',
      render: (val, row) => {
        const primaryItem = getPrimaryItem(row);
        return primaryItem && primaryItem.quantity != null ? (
          <span className="font-medium text-zinc-800 font-mono">{Number(primaryItem.quantity).toLocaleString()}</span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      }
    },
    {
      key: 'requesterName',
      label: 'REQUESTER',
      sortable: true,
      render: (val) => <span className="font-medium text-zinc-900">{val || '-'}</span>
    },
    {
      key: 'departmentName',
      label: 'DEPARTMENT',
      sortable: true,
      render: (val) => <span className="text-zinc-600">{val || '-'}</span>
    },
    {
      key: 'costCenterName',
      label: 'COST CENTER',
      sortable: true,
      render: (val) => <span className="text-zinc-600">{val || '-'}</span>
    },
    {
      key: 'requiredDate',
      label: 'REQUIRED DATE',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      sortable: true,
      render: (val) => (
        <span className={`text-[11px] uppercase tracking-wide ${getPriorityBadge(val)}`}>{val || '-'}</span>
      )
    },
    {
      key: 'purpose',
      label: 'PURPOSE',
      sortable: true,
      render: (val) => <span className="text-zinc-600 max-w-[200px] truncate">{val || '-'}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val) => renderStatusBadge(val)
    },
    {
      key: 'createdAt',
      label: 'CREATED DATE',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      key: 'requiredDateFrom',
      label: 'Date From',
      type: 'date',
    },
    {
      key: 'requiredDateTo',
      label: 'Date To',
      type: 'date',
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Classification & Department',
      fields: [
        {
          key: 'priority',
          label: 'Priority',
          type: 'select',
          options: [
            { label: 'All Priorities', value: '' },
            { label: 'Low', value: 'LOW' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'High', value: 'HIGH' },
            { label: 'Urgent', value: 'URGENT' }
          ]
        },
        {
          key: 'departmentName',
          label: 'Department',
          type: 'text',
          placeholder: 'Filter by department...'
        }
      ]
    },
    {
      title: 'Created Date Range',
      fields: [
        { key: 'createdDateFrom', label: 'Created Date From', type: 'date' },
        { key: 'createdDateTo', label: 'Created Date To', type: 'date' }
      ]
    }
  ], []);

  const filterValues = useMemo(() => ({
    status: filters.status || '',
    requiredDateFrom: filters.requiredDateFrom || '',
    requiredDateTo: filters.requiredDateTo || '',
    priority: filters.priority || '',
    departmentName: filters.departmentName || '',
    createdDateFrom: filters.createdDateFrom || '',
    createdDateTo: filters.createdDateTo || ''
  }), [filters]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] animate-in fade-in">
      {/* Top Header */}
      <PageHeader
        title="Purchase Requisitions"
        description="Manage internal requests for equipment and services"
        icon={ClipboardList}
      >
        {canCreate() && (
          <button
            onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions/new'))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>New Purchase Requisition</span>
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
          selectedRows={selectedRequisitions}
          onSelectionChange={setSelectedRequisitions}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          columns={columns}
          data={requisitions}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={search || ''}
          searchPlaceholder="Search Requisitions..."
          onSearchChange={(val) => { setSearch(val); setPage(0); }}

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
            localStorage.setItem('pr_visible_columns_v2', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
          renderExpandedRow={(pr) => (
            <PurchaseRequisitionOverview
              pr={pr}
              renderStatusBadge={renderStatusBadge}
              navigate={navigate}
              buildPath={buildPath}
            />
          )}

          // Pagination
          pagination={{
            page: page,
            pageSize: currentSize,
            totalPages: pageInfo.totalPages,
            totalElements: pageInfo.totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="requisitions"

          // Empty State
          emptyMessage="No requisitions found matching the criteria."
          emptyDescription="Try adjusting your filters or create a new purchase requisition."
        />
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title="Reject Purchase Requisition"
        maxWidth="max-w-md"
      >
        <label className="block text-[10.4px] font-bold text-zinc-700 mb-1">
          Rejection Reason <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="w-full px-3 py-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all resize-none"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => { setRejectTarget(null); setRejectReason(''); }}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white dark:bg-surface-dark border border-zinc-300 dark:border-border-dark rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRejectConfirm}
            disabled={rejectMutation.isLoading || !rejectReason.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rejectMutation.isLoading && <RefreshCw size={14} className="animate-spin" />}
            Reject
          </button>
        </div>
      </Modal>

      {/* Create RFQ Modal */}
      <CreateRfqModal
        isOpen={!!selectedPrForRfq}
        onClose={() => setSelectedPrForRfq(null)}
        purchaseRequisition={selectedPrForRfq}
        companyId={companyId}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="purchase-requisitions"
          defaultFilters={listFilters}
          selectedIds={selectedRequisitions}
          selectedCount={selectedRequisitions.length}
        />
      )}
    </div>
  );
}