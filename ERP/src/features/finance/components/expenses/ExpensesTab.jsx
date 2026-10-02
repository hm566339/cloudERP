import React, { useState, useMemo } from 'react';
import {
  Receipt, Eye, Edit, Send, CheckCircle, X, Ban, Trash2, Loader2,
  Download, FileText, User, IndianRupee, Clock, ExternalLink, ArrowRight,
  ShieldCheck, AlertCircle, Layers
} from 'lucide-react';
import DataTable from '../../../../components/data-table';
import AuditLogHover from '../../../../components/common/AuditLogHover';
import ExportModal from '../../../../components/common/ExportModal';

const STATUS_BADGE = {
  DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  SUBMITTED: 'bg-amber-100 text-amber-700 border-amber-200',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
  FINANCE_APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PAID: 'bg-teal-100 text-teal-700 border-teal-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  CANCELLED: 'bg-zinc-100 text-zinc-400 border-zinc-200',
};

const DEFAULT_COLUMNS = [
  'claimNo',
  'claimDate',
  'employee',
  'category',
  'paymentType',
  'expenseRequestNumber',
  'itemsCount',
  'claimAmount',
  'accountingStatus',
  'status'
];

/**
 * Expandable Inline Overview Drawer for Expenses (RFQ-Style 3 Cards)
 */
const ExpenseOverview = ({
  exp,
  onViewDetails,
  onEditExpense,
  onSubmitForApproval,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  onPostToAccounting,
  onViewAccounting,
  actionProcessingId
}) => {
  if (!exp) return null;

  const status = (exp.status || 'DRAFT').toUpperCase();
  const isDraft = status === 'DRAFT';
  const isSubmitted = status === 'SUBMITTED' || status === 'PENDING_APPROVAL';
  const isApproved = status === 'FINANCE_APPROVED' || status === 'APPROVED';
  const isPosted = exp.postedToGl || exp.glPosted || exp.isPosted || (status === 'PAID');
  const isProcessing = actionProcessingId === exp.id;

  const staffName =
    exp.employeeDriverName ||
    exp.employeeName ||
    exp.requesterName ||
    (exp.roleType === 'DRIVER' ? 'Driver' : 'Employee');

  const mainCategory =
    exp.items && exp.items.length > 0 && exp.items[0].categoryName
      ? exp.items[0].categoryName
      : exp.categoryName || 'General';

  const mainPaymentType =
    exp.items && exp.items.length > 0 && exp.items[0].paymentType
      ? exp.items[0].paymentType
      : exp.paymentType || 'CASH';

  return (
    <div
      className="p-5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs m-2 mb-3 animate-in fade-in slide-in-from-top-2 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {exp.claimNo || 'Draft'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900">
                {exp.purposeDescription || exp.title || `Expense Claim ${exp.claimNo || ''}`}
              </h3>
              {exp.expenseRequestNumber && (
                <span className="font-mono text-xs text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200">
                  Ref: {exp.expenseRequestNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
              <span>Date: <span className="font-medium text-zinc-700">{exp.claimDate || exp.createdAt?.split('T')[0] || '—'}</span></span>
              <span>•</span>
              <span>Staff: <span className="font-semibold text-zinc-800">{staffName}</span></span>
              <span>•</span>
              <span>Payment: <span className="font-medium text-zinc-700">{mainPaymentType}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${STATUS_BADGE[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
            {status.replace(/_/g, ' ')}
          </span>

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide border ${
            isPosted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
          }`}>
            {isPosted ? 'GL Posted' : 'Not Posted'}
          </span>

          {/* Inline Action Buttons */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200">
            {isDraft && onEditExpense && (
              <button
                type="button"
                onClick={() => onEditExpense(exp)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Edit size={13} /> Edit
              </button>
            )}

            {isDraft && onSubmitForApproval && (
              <button
                type="button"
                onClick={() => onSubmitForApproval(exp)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Submit
              </button>
            )}

            {isSubmitted && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(exp)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve
              </button>
            )}

            {isSubmitted && onReject && (
              <button
                type="button"
                onClick={() => onReject(exp)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                Reject
              </button>
            )}

            {isApproved && !isPosted && onPostToAccounting && (
              <button
                type="button"
                onClick={() => onPostToAccounting(exp)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck size={13} /> Post to GL
              </button>
            )}

            {isPosted && onViewAccounting && (
              <button
                type="button"
                onClick={() => onViewAccounting(exp)}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Layers size={13} /> GL Journal
              </button>
            )}

            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(exp)}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                title="Open Complete Details Modal"
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column RFQ-Style Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Staff & Expense Details */}
        <div className="space-y-2 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 flex items-center gap-1.5">
            <User size={13} /> Staff & Expense Details
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Staff / Driver:</span>
            <span className="font-semibold text-zinc-900">{staffName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Role Type:</span>
            <span className="font-medium text-zinc-800">{exp.roleType || 'EMPLOYEE'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Primary Category:</span>
            <span className="font-medium text-zinc-800">{mainCategory}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Payment Type:</span>
            <span className="font-medium text-zinc-800 uppercase">{mainPaymentType}</span>
          </div>
          {exp.vehicleNumber && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Vehicle:</span>
              <span className="font-mono font-semibold text-zinc-800">{exp.vehicleNumber}</span>
            </div>
          )}
          {exp.salesOrderId && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Linked Sales Order:</span>
              <span className="font-mono text-zinc-800">{exp.salesOrderId}</span>
            </div>
          )}
          {exp.deliveryChallanId && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Linked Delivery Challan:</span>
              <span className="font-mono text-zinc-800">{exp.deliveryChallanId}</span>
            </div>
          )}
        </div>

        {/* Card 2: Financials & Items Breakdown */}
        <div className="space-y-2 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 flex items-center gap-1.5">
            <IndianRupee size={13} /> Financials & Items Breakdown
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Total Claim Amount:</span>
            <span className="font-bold text-zinc-900 font-mono text-sm">
              ₹{Number(exp.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">Line Items Count:</span>
            <span className="font-semibold text-zinc-800">{exp.items?.length || 0} items</span>
          </div>

          <div className="pt-1.5">
            <span className="text-[11px] text-zinc-500 block mb-1">Items List:</span>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {exp.items && exp.items.length > 0 ? (
                exp.items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white p-2 rounded border border-zinc-200 text-[11px] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">{item.description || item.categoryName || `Item #${idx + 1}`}</div>
                      <div className="text-zinc-400 text-[10px]">{item.categoryName || 'General'} • {item.paymentType || 'CASH'}</div>
                    </div>
                    <span className="font-mono font-bold text-zinc-800">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic bg-white p-2 rounded border border-zinc-200 text-center">
                  No line items detailed
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Accounting & Workflow */}
        <div className="space-y-2 bg-zinc-50/60 p-4 rounded-xl border border-zinc-200/70 text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 flex items-center gap-1.5">
            <Clock size={13} /> Accounting & Workflow
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50">
            <span className="text-zinc-500">GL Posting:</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide border ${
              isPosted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}>
              {isPosted ? 'Posted' : 'Not Posted'}
            </span>
          </div>
          {exp.approvedBy && (
            <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-800">
              <div className="font-semibold text-[11px]">Approved By: {exp.approvedBy}</div>
              {exp.approvedAt && <div className="text-[10px] text-emerald-600 mt-0.5">{new Date(exp.approvedAt).toLocaleString()}</div>}
            </div>
          )}
          {exp.rejectedBy && (
            <div className="bg-rose-50/70 p-2 rounded border border-rose-200 text-rose-800">
              <div className="font-semibold text-[11px]">Rejected By: {exp.rejectedBy}</div>
              {exp.rejectionReason && <div className="text-[10px] italic text-rose-700 mt-0.5">Reason: {exp.rejectionReason}</div>}
            </div>
          )}
          {exp.createdAt && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Created At:</span>
              <span className="font-medium text-zinc-700">{new Date(exp.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {exp.createdBy && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50">
              <span className="text-zinc-500">Created By:</span>
              <span className="font-medium text-zinc-700">{exp.createdBy}</span>
            </div>
          )}
          {exp.audit && (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Audit Trail:</span>
              <AuditLogHover audit={exp.audit} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ExpensesTab({
  expenses = [],
  pagination,
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
  categoryFilter = 'ALL',
  onCategoryFilterChange = () => {},
  onResetFilters,
  onRecordExpense,
  onEditExpense,
  onViewDetails,
  onSubmitForApproval,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  onPostToAccounting,
  onViewAccounting,
  actionProcessingId,
}) {
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('exp_expenses_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const columns = useMemo(() => [
    {
      id: 'claimNo',
      key: 'claimNo',
      header: 'EXPENSE NO.',
      label: 'EXPENSE NO.',
      accessor: 'claimNo',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails(row);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
            title="Click to view details modal"
          >
            {row.claimNo || 'Draft'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      ),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails(row);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
            title="Click to view details modal"
          >
            {row.claimNo || 'Draft'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'claimDate',
      key: 'claimDate',
      header: 'DATE',
      label: 'DATE',
      accessor: 'claimDate',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600 font-medium">{row.claimDate || row.createdAt?.split('T')[0] || '—'}</span>
      ),
      cell: (row) => (
        <span className="text-xs text-zinc-600 font-medium">{row.claimDate || row.createdAt?.split('T')[0] || '—'}</span>
      )
    },
    {
      id: 'employee',
      key: 'employee',
      header: 'STAFF / DRIVER',
      label: 'STAFF / DRIVER',
      accessor: 'employeeDriverName',
      render: (val, row) => {
        const name = row.employeeDriverName || row.employeeName || row.requesterName || (row.roleType === 'DRIVER' ? 'Driver' : 'Employee');
        return <span className="text-xs font-medium text-zinc-900">{name}</span>;
      },
      cell: (row) => {
        const name = row.employeeDriverName || row.employeeName || row.requesterName || (row.roleType === 'DRIVER' ? 'Driver' : 'Employee');
        return <span className="text-xs font-medium text-zinc-900">{name}</span>;
      }
    },
    {
      id: 'category',
      key: 'category',
      header: 'CATEGORY',
      label: 'CATEGORY',
      accessor: 'category',
      render: (val, row) => {
        const cat = row.items && row.items.length > 0 && row.items[0].categoryName 
          ? row.items[0].categoryName 
          : (row.categoryName || 'General');
        return (
          <span className="px-2 py-0.5 text-[9px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 rounded">
            {cat}
          </span>
        );
      },
      cell: (row) => {
        const cat = row.items && row.items.length > 0 && row.items[0].categoryName 
          ? row.items[0].categoryName 
          : (row.categoryName || 'General');
        return (
          <span className="px-2 py-0.5 text-[9px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 rounded">
            {cat}
          </span>
        );
      }
    },
    {
      id: 'paymentType',
      key: 'paymentType',
      header: 'PAYMENT TYPE',
      label: 'PAYMENT TYPE',
      accessor: 'paymentType',
      render: (val, row) => {
        const type = row.items && row.items.length > 0 && row.items[0].paymentType 
          ? row.items[0].paymentType 
          : (row.paymentType || '—');
        return <span className="text-xs text-zinc-600 font-medium">{type}</span>;
      },
      cell: (row) => {
        const type = row.items && row.items.length > 0 && row.items[0].paymentType 
          ? row.items[0].paymentType 
          : (row.paymentType || '—');
        return <span className="text-xs text-zinc-600 font-medium">{type}</span>;
      }
    },
    {
      id: 'expenseRequestNumber',
      key: 'expenseRequestNumber',
      header: 'REQUEST REF',
      label: 'REQUEST REF',
      accessor: 'expenseRequestNumber',
      render: (val, row) => (
        row.expenseRequestNumber ? (
          <span className="font-mono text-[9px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-600">
            {row.expenseRequestNumber}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )
      ),
      cell: (row) => (
        row.expenseRequestNumber ? (
          <span className="font-mono text-[9px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-600">
            {row.expenseRequestNumber}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )
      )
    },
    {
      id: 'itemsCount',
      key: 'itemsCount',
      header: 'ITEMS',
      label: 'ITEMS',
      headerClassName: 'text-center',
      align: 'center',
      render: (val, row) => (
        <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[9px]">
          {row.items?.length || 0}
        </span>
      ),
      cell: (row) => (
        <div className="text-center">
          <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[9px]">
            {row.items?.length || 0}
          </span>
        </div>
      )
    },
    {
      id: 'claimAmount',
      key: 'claimAmount',
      header: 'AMOUNT (₹)',
      label: 'AMOUNT (₹)',
      headerClassName: 'text-right',
      align: 'right',
      accessor: 'claimAmount',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 text-xs font-mono">
          ₹{Number(row.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
      cell: (row) => (
        <div className="text-right font-medium text-zinc-900 text-xs font-mono">
          ₹{Number(row.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    },
    {
      id: 'accountingStatus',
      key: 'accountingStatus',
      header: 'ACCOUNTING',
      label: 'ACCOUNTING',
      headerClassName: 'text-center',
      align: 'center',
      render: (val, row) => {
        const isPosted = row.postedToGl || row.glPosted || row.isPosted || (row.status === 'PAID');
        return isPosted ? (
          <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            Posted
          </span>
        ) : (
          <span className="text-[9px] uppercase tracking-wider font-medium text-zinc-400">
            Not Posted
          </span>
        );
      },
      cell: (row) => {
        const isPosted = row.postedToGl || row.glPosted || row.isPosted || (row.status === 'PAID');
        return (
          <div className="text-center">
            {isPosted ? (
              <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                Posted
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-wider font-medium text-zinc-400">
                Not Posted
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'status',
      key: 'status',
      header: 'STATUS',
      label: 'STATUS',
      headerClassName: 'text-center',
      align: 'center',
      accessor: 'status',
      render: (val, row) => {
        const s = (row.status || 'DRAFT').toUpperCase();
        return (
          <span
            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide border ${
              STATUS_BADGE[s] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </span>
        );
      },
      cell: (row) => {
        const s = (row.status || 'DRAFT').toUpperCase();
        return (
          <div className="text-center">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide border ${
                STATUS_BADGE[s] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </span>
          </div>
        );
      }
    }
  ], [onViewDetails]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Finance Approved', value: 'FINANCE_APPROVED' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      id: 'dateFrom',
      key: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      id: 'dateTo',
      key: 'dateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Status & Accounting',
      fields: [
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'All Statuses', value: '' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'Finance Approved', value: 'FINANCE_APPROVED' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ]
        },
        {
          key: 'paymentType',
          label: 'Payment Method',
          type: 'select',
          options: [
            { label: 'All Methods', value: '' },
            { label: 'Cash', value: 'CASH' },
            { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
            { label: 'Company Credit Card', value: 'CREDIT_CARD' },
            { label: 'Self Paid (Reimbursable)', value: 'SELF_PAID' }
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
    dateTo: dateTo || ''
  }), [statusFilter, dateFrom, dateTo]);

  const handleFilterChange = (key, val) => {
    if (key === 'status') {
      onStatusFilterChange && onStatusFilterChange(val || 'ALL');
    } else if (key === 'dateFrom') {
      onDateFromChange && onDateFromChange(val || '');
    } else if (key === 'dateTo') {
      onDateToChange && onDateToChange(val || '');
    }
  };

  const handleReset = () => {
    setSelectedExpenses([]);
    onResetFilters && onResetFilters();
  };

  // Export custom fallback for instant & safe CSV export
  const handleExportCustom = async ({ format, selectedIds }) => {
    const toExport = selectedIds && selectedIds.length > 0
      ? expenses.filter(e => selectedIds.includes(e.id))
      : expenses;

    const headers = ['Expense No', 'Date', 'Staff/Driver', 'Category', 'Payment Type', 'Request Ref', 'Items Count', 'Amount', 'Status'];
    const csvRows = [
      headers.join(','),
      ...toExport.map(e => {
        const staff = e.employeeDriverName || e.employeeName || e.requesterName || '';
        const cat = e.items && e.items.length > 0 ? e.items[0].categoryName : (e.categoryName || 'General');
        const pType = e.items && e.items.length > 0 ? e.items[0].paymentType : (e.paymentType || 'CASH');
        return [
          `"${e.claimNo || ''}"`,
          `"${e.claimDate || ''}"`,
          `"${staff}"`,
          `"${cat}"`,
          `"${pType}"`,
          `"${e.expenseRequestNumber || ''}"`,
          e.items?.length || 0,
          e.claimAmount || 0,
          `"${e.status || 'DRAFT'}"`
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRowActions = (exp) => {
    const status = (exp.status || 'DRAFT').toUpperCase();
    const isDraft = status === 'DRAFT';
    const isSubmitted = status === 'SUBMITTED' || status === 'PENDING_APPROVAL';
    const isApproved = status === 'FINANCE_APPROVED' || status === 'APPROVED';
    const isPosted = exp.postedToGl || exp.glPosted || exp.isPosted || (status === 'PAID');
    const isProcessing = actionProcessingId === exp.id;
    const isExpanded = expandedRowId === exp.id;

    return [
      {
        key: 'view',
        label: isExpanded ? 'Collapse' : 'View',
        tooltip: isExpanded ? 'Collapse Details' : 'View Details',
        'aria-label': isExpanded ? 'Collapse Details' : 'View Details',
        icon: <Eye size={14} className={isExpanded ? 'text-indigo-600' : ''} />,
        onClick: () => {
          setExpandedRowId(prev => prev === exp.id ? null : exp.id);
        },
        className: isExpanded ? 'text-indigo-600 bg-indigo-50/80 rounded' : 'text-zinc-600 hover:text-indigo-600',
      },
      ...(exp.audit ? [
        {
          key: 'audit',
          component: ({ row }) => <AuditLogHover audit={row.audit} />
        }
      ] : []),
      // Edit: Only when DRAFT
      ...(isDraft && onEditExpense ? [
        {
          key: 'edit',
          label: 'Edit',
          tooltip: 'Edit Expense',
          'aria-label': 'Edit Expense',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />,
          disabled: isProcessing,
          onClick: () => onEditExpense(exp),
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
          onClick: () => onSubmitForApproval(exp),
          className: 'text-zinc-600 hover:text-blue-600',
        }
      ] : []),
      // Approve: Only when SUBMITTED
      ...(isSubmitted && onApprove ? [
        {
          key: 'approve',
          label: 'Approve',
          tooltip: isProcessing ? 'Approving...' : 'Approve Claim',
          'aria-label': 'Approve Claim',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <CheckCircle size={14} />,
          disabled: isProcessing,
          onClick: () => onApprove(exp),
          className: 'text-emerald-600 hover:text-emerald-700',
        }
      ] : []),
      // Reject: Only when SUBMITTED
      ...(isSubmitted && onReject ? [
        {
          key: 'reject',
          label: 'Reject',
          tooltip: isProcessing ? 'Rejecting...' : 'Reject Claim',
          'aria-label': 'Reject Claim',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600" /> : <X size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onReject(exp),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : []),
      // Post to GL: When approved and not posted
      ...(isApproved && !isPosted && onPostToAccounting ? [
        {
          key: 'post-to-gl',
          label: 'Post to GL',
          tooltip: 'Post to General Ledger',
          'aria-label': 'Post to General Ledger',
          icon: <ShieldCheck size={14} className="text-indigo-600" />,
          disabled: isProcessing,
          onClick: () => onPostToAccounting(exp),
          className: 'text-indigo-600 hover:text-indigo-700',
        }
      ] : []),
      // Cancel: Only when DRAFT or SUBMITTED
      ...((isDraft || isSubmitted) && onCancel ? [
        {
          key: 'cancel',
          label: 'Cancel',
          tooltip: isProcessing ? 'Cancelling...' : 'Cancel Claim',
          'aria-label': 'Cancel Claim',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600" /> : <Ban size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onCancel(exp),
          className: 'text-red-600 hover:text-red-700',
        }
      ] : []),
      // Delete: Only when DRAFT
      ...(isDraft && onDelete ? [
        {
          key: 'delete',
          label: 'Delete',
          tooltip: isProcessing ? 'Deleting...' : 'Delete Expense',
          'aria-label': 'Delete Expense',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600" /> : <Trash2 size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onDelete(exp),
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
        selectedRows={selectedExpenses}
        onSelectionChange={setSelectedExpenses}
        bulkActions={[
          {
            key: 'export',
            label: 'Export Selected',
            icon: <Download size={14} />,
            onClick: () => setIsExportModalOpen(true)
          }
        ]}
        columns={columns}
        data={expenses}
        loading={isLoading}
        isRefreshing={isLoading}

        // Search
        searchable
        searchValue={searchTerm || ''}
        searchPlaceholder="Search expense claim no..."
        onSearchChange={onSearchChange}

        // Basic Filters
        filters={basicFilters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}

        // Advanced Filters
        advancedFilters={advancedFilters}

        // Toolbar Actions
        onReset={handleReset}
        onRefresh={onRefresh}
        onExport={() => setIsExportModalOpen(true)}

        // Column Visibility
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={(cols) => {
          setVisibleColumns(cols);
          localStorage.setItem('exp_expenses_visible_columns_v2', JSON.stringify(cols));
        }}

        // Row Click & Inline Expandable Details
        onRowClick={(row) => setExpandedRowId(prev => prev === row.id ? null : row.id)}
        rowActions={getRowActions}
        expandedRowId={expandedRowId}
        onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
        renderExpandedRow={(exp) => (
          <ExpenseOverview
            exp={exp}
            onViewDetails={onViewDetails}
            onEditExpense={onEditExpense}
            onSubmitForApproval={onSubmitForApproval}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
            onDelete={onDelete}
            onPostToAccounting={onPostToAccounting}
            onViewAccounting={onViewAccounting}
            actionProcessingId={actionProcessingId}
          />
        )}

        // Pagination
        pagination={pagination ? {
          page: page,
          pageSize: pageSize,
          totalPages: pagination.totalPages || 1,
          totalElements: pagination.totalElements || expenses.length
        } : undefined}
        pageIndexBase={0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}

        // Empty state
        emptyMessage="No expenses found matching the criteria."
        emptyDescription="Try adjusting your filters or record a new expense voucher."
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="expenses"
          defaultFilters={{
            search: searchTerm,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            dateFrom,
            dateTo
          }}
          selectedIds={selectedExpenses}
          selectedCount={selectedExpenses.length}
          onExportCustom={handleExportCustom}
        />
      )}
    </div>
  );
}
