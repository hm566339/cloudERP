import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList, Eye, Edit, Send, CheckCircle, X, Ban, ArrowRight, Loader2,
  Download, SlidersHorizontal, User, IndianRupee, Clock, ExternalLink, FileText, RotateCcw, RefreshCw
} from 'lucide-react';
import DataTable from '../../../../components/data-table';
import AuditLogHover from '../../../../components/common/AuditLogHover';
import ExportModal from '../../../../components/common/ExportModal';
import { employeeDriverService } from '../../services/employeeDriverService';

const STATUS_BADGE = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  DRAFT: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  CONVERTED_TO_EXPENSE: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
};

/**
 * Expandable Row Overview for Expense Requests (matching RFQs and Purchase Requisitions layout)
 */
const ExpenseRequestOverview = ({ req, personNames = {}, onOpenModal }) => {
  if (!req) return null;

  const displayName =
    req.employeeDriverName ||
    req.requesterName ||
    personNames[req.employeeDriverId] ||
    personNames[req.requesterId] ||
    (req.roleType === 'DRIVER' ? 'Driver' : 'Employee');

  const status = (req.status || 'DRAFT').toUpperCase();

  return (
    <div className="p-5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs m-2 mb-3 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {req.requestNumber || '—'}
          </span>
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              {req.purposeDescription || `Expense Request ${req.requestNumber || ''}`}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
              <span>Date: {req.date || '—'}</span>
              <span>•</span>
              <span>Type: {req.requestType === 'ADVANCE_REQUEST' ? 'Advance Request' : 'Expense Request'}</span>
              <span>•</span>
              <span>Role: {req.roleType === 'DRIVER' ? 'Driver' : 'Employee'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${STATUS_BADGE[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
            {status.replace(/_/g, ' ')}
          </span>
          {onOpenModal && (
            <button
              type="button"
              onClick={() => onOpenModal(req)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
              title="Open Complete Details Modal"
              aria-label="Open Complete Details Modal"
            >
              <ExternalLink size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Card Layout (matching RFQs & Purchase Requisitions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
        {/* Card 1: Request & Requester Details */}
        <div className="space-y-2.5 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <User size={13} /> Staff & Request Info
          </h4>
          <div className="flex justify-between">
            <span className="text-zinc-500">Staff / Driver:</span>
            <span className="font-semibold text-zinc-800">{displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Role:</span>
            <span className="font-medium text-zinc-800">{req.roleType || 'EMPLOYEE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Category:</span>
            <span className="font-medium text-zinc-800">{req.categoryName || 'General'}</span>
          </div>
          {req.vehicleNumber && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Vehicle No:</span>
              <span className="font-mono text-zinc-800 font-semibold">{req.vehicleNumber}</span>
            </div>
          )}
          {req.salesOrderId && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Linked SO:</span>
              <span className="font-mono text-zinc-700">{req.salesOrderId}</span>
            </div>
          )}
          {req.deliveryChallanId && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Linked DC:</span>
              <span className="font-mono text-zinc-700">{req.deliveryChallanId}</span>
            </div>
          )}
        </div>

        {/* Card 2: Financials & Purpose */}
        <div className="space-y-2.5 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <IndianRupee size={13} /> Financials & Purpose
          </h4>
          <div className="flex justify-between">
            <span className="text-zinc-500">Requested Amount:</span>
            <span className="font-bold text-zinc-900 font-mono text-sm">
              ₹{Number(req.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Approved Amount:</span>
            <span className="font-bold font-mono text-sm text-emerald-600">
              {req.approvedAmount != null ? `₹${Number(req.approvedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>
          {req.requiresAdvance && (
            <div className="flex justify-between text-amber-700">
              <span>Advance Needed:</span>
              <span className="font-mono font-semibold">₹{Number(req.advanceAmount || req.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200/60">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Purpose</span>
            <p className="text-xs text-zinc-700 whitespace-pre-wrap">{req.purposeDescription || 'No purpose description provided.'}</p>
          </div>
          {req.additionalNotes && (
            <div className="pt-1.5 border-t border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">Notes</span>
              <p className="text-xs text-zinc-600 whitespace-pre-wrap">{req.additionalNotes}</p>
            </div>
          )}
        </div>

        {/* Card 3: Workflow & Audit */}
        <div className="space-y-2.5 bg-zinc-50/50 p-4 rounded-lg border border-zinc-200/60 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Clock size={13} /> Workflow & Audit
          </h4>
          {req.approvedBy && (
            <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-800">
              <div className="font-semibold text-[11px]">Approved By: {req.approvedBy}</div>
              {req.approvedAt && <div className="text-[10px] text-emerald-600 mt-0.5">{new Date(req.approvedAt).toLocaleString()}</div>}
            </div>
          )}
          {req.rejectedBy && (
            <div className="bg-rose-50/70 p-2 rounded border border-rose-200 text-rose-800">
              <div className="font-semibold text-[11px]">Rejected By: {req.rejectedBy}</div>
              {req.rejectedAt && <div className="text-[10px] text-rose-600 mt-0.5">{new Date(req.rejectedAt).toLocaleString()}</div>}
              {req.rejectionReason && <div className="text-[10px] italic text-rose-700 mt-1">Reason: {req.rejectionReason}</div>}
            </div>
          )}
          {req.cancelledBy && (
            <div className="bg-zinc-100 p-2 rounded border border-zinc-200 text-zinc-700">
              <div className="font-semibold text-[11px]">Cancelled By: {req.cancelledBy}</div>
              {req.cancelledReason && <div className="text-[10px] italic text-zinc-600 mt-0.5">Reason: {req.cancelledReason}</div>}
            </div>
          )}
          {!req.approvedBy && !req.rejectedBy && !req.cancelledBy && (
            <div className="bg-white p-2.5 rounded border border-zinc-200 text-zinc-600">
              Current status: <span className="font-semibold text-zinc-800">{status.replace(/_/g, ' ')}</span>
            </div>
          )}
          {req.createdAt && (
            <div className="flex justify-between text-zinc-500 pt-1 border-t border-zinc-200/60 text-[11px]">
              <span>Created At:</span>
              <span>{new Date(req.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {req.createdBy && (
            <div className="flex justify-between text-zinc-500 text-[11px]">
              <span>Created By:</span>
              <span className="font-medium text-zinc-700">{req.createdBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ExpenseRequestsTab({
  requests = [],
  pagination = null,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  error = null,
  onRefresh,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  roleType = '',
  onRoleTypeChange,
  category = '',
  onCategoryChange,
  onResetFilters,
  onNewRequest,
  onViewDetails,
  onEditRequest,
  onSubmitForApproval,
  onApprove,
  onReject,
  onCancel,
  onConvertToExpense,
  actionProcessingId = null,
}) {
  const [personNames, setPersonNames] = useState({});
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const DEFAULT_COLUMNS = ['requestNumber', 'date', 'employeeDriver', 'roleType', 'category', 'requestedAmount', 'approvedAmount', 'purpose', 'status'];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('exp_req_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  useEffect(() => {
    if (requests && requests.length > 0) {
      requests.forEach((req) => {
        const id = req.employeeDriverId || req.requesterId;
        if (id && !req.employeeDriverName && !req.requesterName) {
          const cached = employeeDriverService.getCachedPersonName(id);
          if (cached) {
            setPersonNames((prev) => ({ ...prev, [id]: cached }));
          } else {
            employeeDriverService.resolvePersonName(id).then((name) => {
              if (name) {
                setPersonNames((prev) => ({ ...prev, [id]: name }));
              }
            });
          }
        }
      });
    }
  }, [requests]);

  const columns = useMemo(() => [
    {
      id: 'requestNumber',
      key: 'requestNumber',
      label: 'REQUEST NO.',
      header: 'REQUEST NO.',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails(row);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
            title="Click to view complete details"
          >
            {row.requestNumber || '—'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      ),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails(row);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
            title="Click to view complete details"
          >
            {row.requestNumber || '—'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'date',
      key: 'date',
      label: 'DATE',
      header: 'DATE',
      sortable: true,
      render: (val, row) => <span className="text-xs text-zinc-600">{row.date || '—'}</span>,
      cell: (row) => <span className="text-xs text-zinc-600">{row.date || '—'}</span>
    },
    {
      id: 'employeeDriver',
      key: 'employeeDriver',
      label: 'STAFF / DRIVER',
      header: 'STAFF / DRIVER',
      render: (val, row) => {
        const displayName =
          row.employeeDriverName ||
          row.requesterName ||
          personNames[row.employeeDriverId] ||
          personNames[row.requesterId] ||
          (row.roleType === 'DRIVER' ? 'Driver' : 'Employee');
        return <span className="text-xs font-medium text-zinc-900">{displayName}</span>;
      },
      cell: (row) => {
        const displayName =
          row.employeeDriverName ||
          row.requesterName ||
          personNames[row.employeeDriverId] ||
          personNames[row.requesterId] ||
          (row.roleType === 'DRIVER' ? 'Driver' : 'Employee');
        return <span className="text-xs font-medium text-zinc-900">{displayName}</span>;
      }
    },
    {
      id: 'roleType',
      key: 'roleType',
      label: 'ROLE',
      header: 'ROLE',
      render: (val, row) => (
        <span
          className={`px-2 py-0.5 rounded text-[8.8px] font-semibold border inline-block ${
            row.roleType === 'DRIVER'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {row.roleType === 'DRIVER' ? 'Driver' : 'Employee'}
        </span>
      ),
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[8.8px] font-semibold border inline-block ${
            row.roleType === 'DRIVER'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {row.roleType === 'DRIVER' ? 'Driver' : 'Employee'}
        </span>
      )
    },
    {
      id: 'category',
      key: 'category',
      label: 'CATEGORY',
      header: 'CATEGORY',
      render: (val, row) => (
        <span className="px-2 py-0.5 text-[8.8px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 rounded">
          {row.categoryName || 'General'}
        </span>
      ),
      cell: (row) => (
        <span className="px-2 py-0.5 text-[8.8px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 rounded">
          {row.categoryName || 'General'}
        </span>
      )
    },
    {
      id: 'requestedAmount',
      key: 'requestedAmount',
      label: 'REQUESTED (₹)',
      header: 'REQUESTED (₹)',
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <div className="text-right font-medium text-zinc-900 text-xs">
          ₹{Number(row.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
      cell: (row) => (
        <div className="text-right font-medium text-zinc-900 text-xs">
          ₹{Number(row.requestedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'approvedAmount',
      key: 'approvedAmount',
      label: 'APPROVED (₹)',
      header: 'APPROVED (₹)',
      align: 'right',
      headerClassName: 'text-right',
      render: (val, row) => (
        <div className="text-right font-medium text-xs">
          {row.approvedAmount != null ? (
            <span className="text-emerald-600">
              ₹{Number(row.approvedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </div>
      ),
      cell: (row) => (
        <div className="text-right font-medium text-xs">
          {row.approvedAmount != null ? (
            <span className="text-emerald-600">
              ₹{Number(row.approvedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </div>
      )
    },
    {
      id: 'purpose',
      key: 'purpose',
      label: 'PURPOSE',
      header: 'PURPOSE',
      render: (val, row) => (
        <span className="text-xs text-zinc-600 truncate max-w-xs block" title={row.purposeDescription || ''}>
          {row.purposeDescription || '—'}
        </span>
      ),
      cell: (row) => (
        <span className="text-xs text-zinc-600 truncate max-w-xs block" title={row.purposeDescription || ''}>
          {row.purposeDescription || '—'}
        </span>
      )
    },
    {
      id: 'status',
      key: 'status',
      label: 'STATUS',
      header: 'STATUS',
      align: 'center',
      headerClassName: 'text-center',
      render: (val, row) => {
        const status = (row.status || 'DRAFT').toUpperCase();
        return (
          <div className="text-center">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-block ${
                STATUS_BADGE[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        );
      },
      cell: (row) => {
        const status = (row.status || 'DRAFT').toUpperCase();
        return (
          <div className="text-center">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border inline-block ${
                STATUS_BADGE[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        );
      }
    }
  ], [personNames, onViewDetails]);

  // Basic Filter definitions (Quick toolbar filters matching Quotations: Status, Date From, Date To)
  const basicFilters = useMemo(() => [
    {
      key: 'status',
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Converted to Expense', value: 'CONVERTED_TO_EXPENSE' }
      ]
    },
    {
      key: 'dateFrom',
      id: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'dateTo',
      id: 'dateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  // Advanced Filters definition
  const advancedFilters = useMemo(() => [
    {
      title: 'Classification & Role',
      fields: [
        {
          key: 'roleType',
          label: 'Role',
          type: 'select',
          options: [
            { label: 'All Roles', value: '' },
            { label: 'Employee', value: 'EMPLOYEE' },
            { label: 'Driver', value: 'DRIVER' }
          ]
        },
        {
          key: 'requestType',
          label: 'Request Type',
          type: 'select',
          options: [
            { label: 'All Types', value: '' },
            { label: 'Expense Request', value: 'EXPENSE_REQUEST' },
            { label: 'Advance Request', value: 'ADVANCE_REQUEST' }
          ]
        }
      ]
    },
    {
      title: 'Amount Range',
      fields: [
        {
          key: 'minAmount',
          label: 'Min Amount (₹)',
          type: 'number',
          placeholder: '0.00'
        },
        {
          key: 'maxAmount',
          label: 'Max Amount (₹)',
          type: 'number',
          placeholder: '0.00'
        }
      ]
    }
  ], []);

  const filterValues = useMemo(() => ({
    status: statusFilter === 'ALL' ? '' : (statusFilter || ''),
    dateFrom: dateFrom || '',
    dateTo: dateTo || '',
    roleType: roleType || '',
    category: category || ''
  }), [statusFilter, dateFrom, dateTo, roleType, category]);

  const handleFilterChange = (key, val) => {
    if (key === 'status') {
      onStatusFilterChange && onStatusFilterChange(val || 'ALL');
    } else if (key === 'dateFrom') {
      onDateFromChange && onDateFromChange(val || '');
    } else if (key === 'dateTo') {
      onDateToChange && onDateToChange(val || '');
    } else if (key === 'roleType') {
      onRoleTypeChange && onRoleTypeChange(val || '');
    } else if (key === 'category' || key === 'categoryId') {
      onCategoryChange && onCategoryChange(val || '');
    }
  };

  const handleReset = () => {
    setSelectedRequests([]);
    onResetFilters && onResetFilters();
  };

  // Client-side filtering fallback to guarantee instantaneous responsiveness
  const displayRequests = useMemo(() => {
    let list = Array.isArray(requests) ? requests : [];

    if (searchTerm && searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      list = list.filter(r =>
        r.requestNumber?.toLowerCase().includes(s) ||
        r.purposeDescription?.toLowerCase().includes(s) ||
        r.employeeDriverName?.toLowerCase().includes(s) ||
        r.requesterName?.toLowerCase().includes(s) ||
        r.categoryName?.toLowerCase().includes(s)
      );
    }

    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter(r => (r.status || '').toUpperCase() === statusFilter.toUpperCase());
    }

    if (dateFrom) {
      list = list.filter(r => r.date && r.date >= dateFrom);
    }

    if (dateTo) {
      list = list.filter(r => r.date && r.date <= dateTo);
    }

    if (roleType) {
      list = list.filter(r => (r.roleType || '').toUpperCase() === roleType.toUpperCase());
    }

    return list;
  }, [requests, searchTerm, statusFilter, dateFrom, dateTo, roleType]);

  const handleExportCustom = async ({ format, selectedIds }) => {
    const toExport = selectedIds && selectedIds.length > 0
      ? displayRequests.filter(r => selectedIds.includes(r.id))
      : displayRequests;

    const headers = ['Request Number', 'Date', 'Staff/Driver', 'Role', 'Category', 'Requested Amount', 'Approved Amount', 'Purpose', 'Status'];
    const csvRows = [
      headers.join(','),
      ...toExport.map(r => {
        const staff = r.employeeDriverName || r.requesterName || personNames[r.employeeDriverId] || personNames[r.requesterId] || '';
        return [
          `"${r.requestNumber || ''}"`,
          `"${r.date || ''}"`,
          `"${staff}"`,
          `"${r.roleType || 'EMPLOYEE'}"`,
          `"${r.categoryName || 'General'}"`,
          r.requestedAmount || 0,
          r.approvedAmount != null ? r.approvedAmount : '',
          `"${(r.purposeDescription || '').replace(/"/g, '""')}"`,
          `"${r.status || 'DRAFT'}"`
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRowActions = (req) => {
    const status = (req.status || 'DRAFT').toUpperCase();
    const isDraft = status === 'DRAFT';
    const isPending = status === 'PENDING_APPROVAL' || status === 'PENDING';
    const isApproved = status === 'APPROVED';
    const isRejected = status === 'REJECTED';
    const isProcessing = actionProcessingId === req.id;
    const isExpanded = expandedRowId === req.id;

    return [
      {
        key: 'view',
        label: isExpanded ? 'Collapse' : 'View',
        tooltip: isExpanded ? 'Collapse Details' : 'View Details',
        'aria-label': isExpanded ? 'Collapse Details' : 'View Details',
        icon: <Eye size={14} className={isExpanded ? 'text-indigo-600' : ''} />,
        onClick: () => {
          setExpandedRowId(prev => prev === req.id ? null : req.id);
        },
        className: isExpanded ? 'text-indigo-600 bg-indigo-50/80 rounded' : 'text-zinc-600 hover:text-indigo-600',
      },
      ...(req.audit ? [
        {
          key: 'audit',
          component: ({ row }) => <AuditLogHover audit={row.audit} />
        }
      ] : []),
      // Edit: Only when DRAFT or REJECTED
      ...((isDraft || isRejected) && onEditRequest ? [
        {
          key: 'edit',
          label: 'Edit',
          tooltip: 'Edit Request',
          'aria-label': 'Edit Request',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />,
          disabled: isProcessing,
          onClick: () => onEditRequest(req),
          className: 'text-zinc-600 hover:text-blue-600',
        }
      ] : []),
      // Submit: Only when DRAFT
      ...(isDraft && onSubmitForApproval ? [
        {
          key: 'submit',
          label: 'Submit',
          tooltip: isProcessing ? 'Submitting...' : 'Submit for Approval',
          'aria-label': 'Submit for Approval',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />,
          disabled: isProcessing,
          onClick: () => onSubmitForApproval(req),
          className: 'text-zinc-600 hover:text-blue-600',
        }
      ] : []),
      // Approve: Only when PENDING_APPROVAL
      ...(isPending && onApprove ? [
        {
          key: 'approve',
          label: 'Approve',
          tooltip: isProcessing ? 'Approving...' : 'Approve Request',
          'aria-label': 'Approve Request',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <CheckCircle size={14} />,
          disabled: isProcessing,
          onClick: () => onApprove(req),
          className: 'text-emerald-600 hover:text-emerald-700',
        }
      ] : []),
      // Reject: Only when PENDING_APPROVAL
      ...(isPending && onReject ? [
        {
          key: 'reject',
          label: 'Reject',
          tooltip: isProcessing ? 'Rejecting...' : 'Reject Request',
          'aria-label': 'Reject Request',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600" /> : <X size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onReject(req),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : []),
      // Convert to Expense: Only when APPROVED
      ...(isApproved && onConvertToExpense ? [
        {
          key: 'convert-to-expense',
          label: 'Convert to Expense',
          tooltip: 'Record Expense against Request',
          'aria-label': 'Record Expense against Request',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <ArrowRight size={14} />,
          disabled: isProcessing,
          onClick: () => onConvertToExpense(req),
          className: 'text-emerald-600 hover:text-emerald-700',
        }
      ] : []),
      // Cancel: Only when DRAFT or PENDING_APPROVAL
      ...((isDraft || isPending) && onCancel ? [
        {
          key: 'cancel',
          label: 'Cancel',
          tooltip: isProcessing ? 'Cancelling...' : 'Cancel Request',
          'aria-label': 'Cancel Request',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600" /> : <Ban size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onCancel(req),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : []),
    ];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTable
        selectable
        rowKey="id"
        selectedRows={selectedRequests}
        onSelectionChange={setSelectedRequests}
        bulkActions={[
          {
            key: 'export',
            label: 'Export Selected',
            icon: <Download size={14} />,
            onClick: () => setIsExportModalOpen(true)
          }
        ]}
        columns={columns}
        data={displayRequests}
        loading={isLoading}
        isRefreshing={isLoading}

        // Search
        searchable
        searchValue={searchTerm || ''}
        searchPlaceholder="Search Expense Requests..."
        onSearchChange={onSearchChange}

        // Filters
        filters={basicFilters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}

        // Advanced Filters
        advancedFilters={advancedFilters}

        // Reset, Refresh, Export
        onReset={handleReset}
        onRefresh={onRefresh}
        onExport={() => setIsExportModalOpen(true)}

        // Column Visibility
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={(cols) => {
          setVisibleColumns(cols);
          localStorage.setItem('exp_req_visible_columns_v2', JSON.stringify(cols));
        }}

        // Row Actions & Inline Expandable Details
        onRowClick={(row) => setExpandedRowId(prev => prev === row.id ? null : row.id)}
        rowActions={getRowActions}
        expandedRowId={expandedRowId}
        onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
        renderExpandedRow={(req) => (
          <ExpenseRequestOverview
            req={req}
            personNames={personNames}
            onOpenModal={(r) => onViewDetails && onViewDetails(r)}
          />
        )}

        // Pagination
        pagination={pagination ? {
          page: page,
          pageSize: pageSize,
          totalPages: pagination.totalPages || 1,
          totalElements: pagination.totalElements || displayRequests.length
        } : undefined}
        pageIndexBase={0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}

        // Empty state
        emptyMessage="No expense requests found matching the criteria."
        emptyDescription="Try adjusting your filters or create a new expense request."
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="expense-requests"
          defaultFilters={{
            search: searchTerm,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            dateFrom,
            dateTo,
            roleType
          }}
          selectedIds={selectedRequests}
          selectedCount={selectedRequests.length}
          onExportCustom={handleExportCustom}
        />
      )}
    </div>
  );
}
