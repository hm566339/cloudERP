import React, { useState, useMemo } from 'react';
import {
  CreditCard, Eye, Edit, Send, CheckCircle, X, Ban, Trash2, Loader2,
  Download, FileText, User, IndianRupee, Clock, ExternalLink, ArrowRight,
  ShieldCheck, AlertCircle, Layers
} from 'lucide-react';
import DataTable from '../../../../components/data-table';
import AuditLogHover from '../../../../components/common/AuditLogHover';
import ExportModal from '../../../../components/common/ExportModal';

const STATUS_BADGE = {
  DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-[#1D212C] dark:text-zinc-300 dark:border-[#2A2F3D]',
  SUBMITTED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  APPROVED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  CANCELLED: 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-[#1D212C] dark:text-zinc-500 dark:border-[#2A2F3D]',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
  CANCELLED: 'Cancelled'
};

const DEFAULT_COLUMNS = [
  'claimNo',
  'title',
  'employee',
  'amount',
  'paymentMethod',
  'paymentDate',
  'status'
];

/**
 * Expandable Inline Overview Drawer for Reimbursements (RFQ-Style 3 Cards)
 */
const ReimbursementOverview = ({
  reimbursement,
  onViewDetails,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onPay,
  onCancel,
  onDelete,
  actionProcessingId
}) => {
  if (!reimbursement) return null;

  const status = (reimbursement.status || 'DRAFT').toUpperCase();
  const isDraft = status === 'DRAFT';
  const isSubmitted = status === 'SUBMITTED';
  const isApproved = status === 'APPROVED';
  const isProcessing = actionProcessingId === reimbursement.id;

  const staffName =
    reimbursement.staffName ||
    reimbursement.employeeName ||
    reimbursement.employeeDriverName ||
    'Staff / Driver';

  return (
    <div
      className="p-5 bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-xl shadow-2xs m-2 mb-3 animate-in fade-in slide-in-from-top-2 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] rounded border border-zinc-200 dark:border-[#2A2F3D]">
            {reimbursement.reimbursementNo || reimbursement.reimbursementNumber || reimbursement.expenseClaimNo || reimbursement.claimNo || 'Draft'}
          </span>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {reimbursement.title || reimbursement.purpose || reimbursement.notes || `Reimbursement ${reimbursement.reimbursementNo || reimbursement.reimbursementNumber || ''}`}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Payment Date: <span className="font-medium text-zinc-700 dark:text-zinc-300">{reimbursement.paymentDate || 'Pending Settlement'}</span></span>
              <span>•</span>
              <span>Beneficiary: <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{staffName}</span></span>
              <span>•</span>
              <span>Method: <span className="font-medium text-zinc-700 dark:text-zinc-300">{reimbursement.paymentMethod?.replace(/_/g, ' ') || 'Pending'}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${STATUS_BADGE[status] || STATUS_BADGE.DRAFT}`}>
            {STATUS_LABELS[status] || status}
          </span>

          {/* Inline Action Buttons */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-200 dark:border-[#2A2F3D]">
            {isDraft && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(reimbursement)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] hover:bg-zinc-50 dark:hover:bg-[#222736] border border-zinc-200 dark:border-[#2A2F3D] rounded-md transition-colors flex items-center gap-1.5"
              >
                <Edit size={13} /> Edit
              </button>
            )}

            {isDraft && onSubmit && (
              <button
                type="button"
                onClick={() => onSubmit(reimbursement)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-[#4C8DFF] bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/50 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Submit
              </button>
            )}

            {isSubmitted && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(reimbursement)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve
              </button>
            )}

            {isSubmitted && onReject && (
              <button
                type="button"
                onClick={() => onReject(reimbursement)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 rounded-md transition-colors flex items-center gap-1.5"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                Reject
              </button>
            )}

            {isApproved && onPay && (
              <button
                type="button"
                onClick={() => onPay(reimbursement)}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <CreditCard size={13} /> Process Payment
              </button>
            )}

            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(reimbursement)}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded transition-colors"
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
        {/* Card 1: Staff & Claim Info */}
        <div className="space-y-2 bg-zinc-50/60 dark:bg-[#1D212C]/60 p-4 rounded-xl border border-zinc-200/70 dark:border-[#2A2F3D] text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <User size={13} /> Staff & Beneficiary Info
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Staff / Beneficiary:</span>
            <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{staffName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Reimbursement No:</span>
            <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">{reimbursement.reimbursementNo || reimbursement.reimbursementNumber || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Expense Claim Ref:</span>
            <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">{reimbursement.expenseClaimNo || reimbursement.claimNo || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Title / Notes:</span>
            <span className="font-medium text-zinc-800 dark:text-[#E6E8EE] truncate max-w-[200px]" title={reimbursement.notes || reimbursement.title || reimbursement.purpose || 'General Reimbursement'}>
              {reimbursement.notes || reimbursement.title || reimbursement.purpose || 'General Reimbursement'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Payment Method:</span>
            <span className="font-medium text-zinc-800 dark:text-[#E6E8EE] uppercase">{reimbursement.paymentMethod?.replace(/_/g, ' ') || 'Pending'}</span>
          </div>
        </div>

        {/* Card 2: Settlement & Financials */}
        <div className="space-y-2 bg-zinc-50/60 dark:bg-[#1D212C]/60 p-4 rounded-xl border border-zinc-200/70 dark:border-[#2A2F3D] text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <IndianRupee size={13} /> Settlement & Financials
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Reimbursement Amount:</span>
            <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] font-mono text-sm">
              ₹{Number(reimbursement.reimbursementAmount ?? reimbursement.totalAmount ?? reimbursement.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Expense Claim Amount:</span>
            <span className="font-mono text-zinc-800 dark:text-[#E6E8EE] font-medium">
              ₹{Number(reimbursement.expenseClaimAmount ?? reimbursement.totalAmount ?? reimbursement.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Balance Due:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
              ₹{Number(reimbursement.balanceDue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Payment Date:</span>
            <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{reimbursement.paymentDate || 'Not yet paid'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Reference / UTR:</span>
            <span className="font-mono text-zinc-800 dark:text-[#E6E8EE] font-medium">{reimbursement.paymentReference || reimbursement.referenceNo || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Disbursed Account:</span>
            <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{reimbursement.bankAccountName || reimbursement.accountName || 'Company Operating Account'}</span>
          </div>
        </div>

        {/* Card 3: Workflow & Audit */}
        <div className="space-y-2 bg-zinc-50/60 dark:bg-[#1D212C]/60 p-4 rounded-xl border border-zinc-200/70 dark:border-[#2A2F3D] text-xs">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <Clock size={13} /> Workflow & Audit
          </h4>
          <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
            <span className="text-zinc-500 dark:text-zinc-400">Current Status:</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide border ${STATUS_BADGE[status] || STATUS_BADGE.DRAFT}`}>
              {STATUS_LABELS[status] || status}
            </span>
          </div>
          {reimbursement.approvedBy && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <div className="font-semibold text-[11px]">Approved By: {reimbursement.approvedBy}</div>
              {reimbursement.approvedAt && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{new Date(reimbursement.approvedAt).toLocaleString()}</div>}
            </div>
          )}
          {reimbursement.rejectedBy && (
            <div className="bg-rose-50/70 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
              <div className="font-semibold text-[11px]">Rejected By: {reimbursement.rejectedBy}</div>
              {reimbursement.rejectionReason && <div className="text-[10px] italic text-rose-700 dark:text-rose-400 mt-0.5">Reason: {reimbursement.rejectionReason}</div>}
            </div>
          )}
          {reimbursement.createdAt && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
              <span className="text-zinc-500 dark:text-zinc-400">Created At:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{new Date(reimbursement.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {reimbursement.createdBy && (
            <div className="flex justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50">
              <span className="text-zinc-500 dark:text-zinc-400">Created By:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{reimbursement.createdBy}</span>
            </div>
          )}
          {reimbursement.audit && (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Audit Trail:</span>
              <AuditLogHover audit={reimbursement.audit} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReimbursementsTab({
  reimbursements = [],
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
  onResetFilters,
  onViewDetails,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onPay,
  onCancel,
  onDelete,
  actionProcessingId
}) {
  const [selectedReimbursements, setSelectedReimbursements] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('exp_reimbursements_visible_columns_v2');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  const columns = useMemo(() => [
    {
      id: 'claimNo',
      key: 'claimNo',
      header: 'CLAIM NO.',
      label: 'CLAIM NO.',
      accessor: 'reimbursementNo',
      sortable: true,
      render: (val, row) => {
        const rmbNo = row.reimbursementNo || row.reimbursementNumber || 'Draft';
        const claimNo = row.expenseClaimNo || row.claimNo;
        return (
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <div className="flex flex-col">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails && onViewDetails(row);
                }}
                className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
                title="Click to view details modal"
              >
                {rmbNo}
              </span>
              {claimNo && claimNo !== rmbNo && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono" title={`Expense Claim: ${claimNo}`}>
                  {claimNo}
                </span>
              )}
            </div>
            {row.audit && <AuditLogHover audit={row.audit} />}
          </div>
        );
      },
      cell: (row) => {
        const rmbNo = row.reimbursementNo || row.reimbursementNumber || 'Draft';
        const claimNo = row.expenseClaimNo || row.claimNo;
        return (
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <div className="flex flex-col">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails && onViewDetails(row);
                }}
                className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
                title="Click to view details modal"
              >
                {rmbNo}
              </span>
              {claimNo && claimNo !== rmbNo && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono" title={`Expense Claim: ${claimNo}`}>
                  {claimNo}
                </span>
              )}
            </div>
            {row.audit && <AuditLogHover audit={row.audit} />}
          </div>
        );
      }
    },
    {
      id: 'title',
      key: 'title',
      header: 'TITLE / PURPOSE',
      label: 'TITLE / PURPOSE',
      accessor: 'title',
      render: (val, row) => {
        const text = row.title || row.purpose || row.notes || '—';
        return (
          <span className="text-xs text-zinc-800 dark:text-[#E6E8EE] font-medium truncate max-w-xs block" title={text}>
            {text}
          </span>
        );
      },
      cell: (row) => {
        const text = row.title || row.purpose || row.notes || '—';
        return (
          <span className="text-xs text-zinc-800 dark:text-[#E6E8EE] font-medium truncate max-w-xs block" title={text}>
            {text}
          </span>
        );
      }
    },
    {
      id: 'employee',
      key: 'employee',
      header: 'STAFF / DRIVER',
      label: 'STAFF / DRIVER',
      accessor: 'employeeName',
      render: (val, row) => {
        const name = row.staffName || row.employeeName || row.employeeDriverName || '—';
        const role = row.employeeRole ? row.employeeRole.replace(/_/g, ' ').toLowerCase() : null;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-900 dark:text-[#E6E8EE]">{name}</span>
            {role && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{role}</span>}
          </div>
        );
      },
      cell: (row) => {
        const name = row.staffName || row.employeeName || row.employeeDriverName || '—';
        const role = row.employeeRole ? row.employeeRole.replace(/_/g, ' ').toLowerCase() : null;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-900 dark:text-[#E6E8EE]">{name}</span>
            {role && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{role}</span>}
          </div>
        );
      }
    },
    {
      id: 'amount',
      key: 'amount',
      header: 'AMOUNT (₹)',
      label: 'AMOUNT (₹)',
      headerClassName: 'text-right',
      align: 'right',
      accessor: 'reimbursementAmount',
      render: (val, row) => {
        const amt = Number(row.reimbursementAmount ?? row.expenseClaimAmount ?? row.totalAmount ?? row.amount ?? 0);
        return (
          <span className="font-medium text-zinc-900 dark:text-[#E6E8EE] text-xs font-mono">
            ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
      cell: (row) => {
        const amt = Number(row.reimbursementAmount ?? row.expenseClaimAmount ?? row.totalAmount ?? row.amount ?? 0);
        return (
          <div className="text-right font-medium text-zinc-900 dark:text-[#E6E8EE] text-xs font-mono">
            ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        );
      }
    },
    {
      id: 'paymentMethod',
      key: 'paymentMethod',
      header: 'PAYMENT METHOD',
      label: 'PAYMENT METHOD',
      accessor: 'paymentMethod',
      render: (val, row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          {row.paymentMethod ? row.paymentMethod.replace(/_/g, ' ') : 'Pending'}
        </span>
      ),
      cell: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          {row.paymentMethod ? row.paymentMethod.replace(/_/g, ' ') : 'Pending'}
        </span>
      )
    },
    {
      id: 'paymentDate',
      key: 'paymentDate',
      header: 'PAYMENT DATE',
      label: 'PAYMENT DATE',
      accessor: 'paymentDate',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{row.paymentDate || '—'}</span>
      ),
      cell: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{row.paymentDate || '—'}</span>
      )
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
              STATUS_BADGE[s] || STATUS_BADGE.DRAFT
            }`}
          >
            {STATUS_LABELS[s] || s}
          </span>
        );
      },
      cell: (row) => {
        const s = (row.status || 'DRAFT').toUpperCase();
        return (
          <div className="text-center">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide border ${
                STATUS_BADGE[s] || STATUS_BADGE.DRAFT
              }`}
            >
              {STATUS_LABELS[s] || s}
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
        { label: 'Pending Approval', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Paid', value: 'PAID' },
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
      title: 'Status & Method',
      fields: [
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'All Statuses', value: '' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Pending Approval', value: 'SUBMITTED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Cancelled', value: 'CANCELLED' }
          ]
        },
        {
          key: 'paymentMethod',
          label: 'Payment Method',
          type: 'select',
          options: [
            { label: 'All Methods', value: '' },
            { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
            { label: 'Cash', value: 'CASH' },
            { label: 'Cheque', value: 'CHEQUE' },
            { label: 'UPI / Online', value: 'UPI' }
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
    setSelectedReimbursements([]);
    onResetFilters && onResetFilters();
  };

  // Export custom fallback for instant & safe CSV export
  const handleExportCustom = async ({ format, selectedIds }) => {
    const toExport = selectedIds && selectedIds.length > 0
      ? reimbursements.filter(r => selectedIds.includes(r.id))
      : reimbursements;

    const headers = ['Reimbursement No', 'Expense Claim No', 'Title/Notes', 'Staff/Driver', 'Amount (₹)', 'Payment Method', 'Payment Date', 'Status'];
    const csvRows = [
      headers.join(','),
      ...toExport.map(r => {
        const staff = r.employeeName || r.staffName || r.employeeDriverName || '';
        const amt = Number(r.reimbursementAmount ?? r.expenseClaimAmount ?? r.totalAmount ?? r.amount ?? 0);
        const notes = (r.notes || r.title || r.purpose || '').replace(/"/g, '""');
        return [
          `"${r.reimbursementNo || r.reimbursementNumber || ''}"`,
          `"${r.expenseClaimNo || r.claimNo || ''}"`,
          `"${notes}"`,
          `"${staff}"`,
          amt,
          `"${r.paymentMethod ? r.paymentMethod.replace(/_/g, ' ') : 'Pending'}"`,
          `"${r.paymentDate || ''}"`,
          `"${r.status || 'DRAFT'}"`
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reimbursements_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRowActions = (row) => {
    const status = (row.status || 'DRAFT').toUpperCase();
    const isDraft = status === 'DRAFT';
    const isSubmitted = status === 'SUBMITTED';
    const isApproved = status === 'APPROVED';
    const isProcessing = actionProcessingId === row.id;
    const isExpanded = expandedRowId === row.id;

    return [
      {
        key: 'view',
        label: isExpanded ? 'Collapse' : 'View',
        tooltip: isExpanded ? 'Collapse Details' : 'View Details',
        'aria-label': isExpanded ? 'Collapse Details' : 'View Details',
        icon: <Eye size={14} className={isExpanded ? 'text-indigo-600' : ''} />,
        onClick: () => {
          setExpandedRowId(prev => prev === row.id ? null : row.id);
        },
        className: isExpanded ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 rounded' : 'text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400',
      },
      ...(row.audit ? [
        {
          key: 'audit',
          component: ({ row: r }) => <AuditLogHover audit={r.audit} />
        }
      ] : []),
      // Edit: Only when DRAFT
      ...(isDraft && onEdit ? [
        {
          key: 'edit',
          label: 'Edit',
          tooltip: 'Edit Reimbursement',
          'aria-label': 'Edit Reimbursement',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />,
          disabled: isProcessing,
          onClick: () => onEdit(row),
          className: 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-[#4C8DFF]',
        }
      ] : []),
      // Submit: Only when DRAFT
      ...(isDraft && onSubmit ? [
        {
          key: 'submit',
          label: 'Submit',
          tooltip: isProcessing ? 'Submitting...' : 'Submit for Approval',
          'aria-label': 'Submit for Approval',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />,
          disabled: isProcessing,
          onClick: () => onSubmit(row),
          className: 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-[#4C8DFF]',
        }
      ] : []),
      // Approve: Only when SUBMITTED
      ...(isSubmitted && onApprove ? [
        {
          key: 'approve',
          label: 'Approve',
          tooltip: isProcessing ? 'Approving...' : 'Approve Reimbursement',
          'aria-label': 'Approve Reimbursement',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-emerald-600 dark:text-emerald-400" /> : <CheckCircle size={14} />,
          disabled: isProcessing,
          onClick: () => onApprove(row),
          className: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
        }
      ] : []),
      // Reject: Only when SUBMITTED
      ...(isSubmitted && onReject ? [
        {
          key: 'reject',
          label: 'Reject',
          tooltip: isProcessing ? 'Rejecting...' : 'Reject Reimbursement',
          'aria-label': 'Reject Reimbursement',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600 dark:text-red-400" /> : <X size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onReject(row),
          className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
        }
      ] : []),
      // Pay: Only when APPROVED
      ...(isApproved && onPay ? [
        {
          key: 'pay',
          label: 'Process Payment',
          tooltip: isProcessing ? 'Processing...' : 'Process Payment',
          'aria-label': 'Process Payment',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-emerald-600 dark:text-emerald-400" /> : <CreditCard size={14} />,
          disabled: isProcessing,
          onClick: () => onPay(row),
          className: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
        }
      ] : []),
      // Cancel: Only when DRAFT or SUBMITTED
      ...((isDraft || isSubmitted) && onCancel ? [
        {
          key: 'cancel',
          label: 'Cancel',
          tooltip: isProcessing ? 'Cancelling...' : 'Cancel Reimbursement',
          'aria-label': 'Cancel Reimbursement',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600 dark:text-red-400" /> : <Ban size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onCancel(row),
          className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
        }
      ] : []),
      // Delete: Only when DRAFT
      ...(isDraft && onDelete ? [
        {
          key: 'delete',
          label: 'Delete',
          tooltip: isProcessing ? 'Deleting...' : 'Delete Reimbursement',
          'aria-label': 'Delete Reimbursement',
          icon: isProcessing ? <Loader2 size={14} className="animate-spin text-red-600 dark:text-red-400" /> : <Trash2 size={14} />,
          danger: true,
          disabled: isProcessing,
          onClick: () => onDelete(row),
          className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
        }
      ] : []),
    ];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTable
        selectable
        rowKey="id"
        selectedRows={selectedReimbursements}
        onSelectionChange={setSelectedReimbursements}
        bulkActions={[
          {
            key: 'export',
            label: 'Export Selected',
            icon: <Download size={14} />,
            onClick: () => setIsExportModalOpen(true)
          }
        ]}
        columns={columns}
        data={reimbursements}
        loading={isLoading}
        isRefreshing={isLoading}

        // Search
        searchable
        searchValue={searchTerm || ''}
        searchPlaceholder="Search claim no, staff, purpose..."
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
          localStorage.setItem('exp_reimbursements_visible_columns_v2', JSON.stringify(cols));
        }}

        // Row Click & Inline Expandable Details
        onRowClick={(row) => setExpandedRowId(prev => prev === row.id ? null : row.id)}
        rowActions={getRowActions}
        expandedRowId={expandedRowId}
        onToggleExpand={(id) => setExpandedRowId(prev => prev === id ? null : id)}
        renderExpandedRow={(r) => (
          <ReimbursementOverview
            reimbursement={r}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onSubmit={onSubmit}
            onApprove={onApprove}
            onReject={onReject}
            onPay={onPay}
            onCancel={onCancel}
            onDelete={onDelete}
            actionProcessingId={actionProcessingId}
          />
        )}

        // Pagination
        pagination={pagination ? {
          page: page,
          pageSize: pageSize,
          totalPages: pagination.totalPages || 1,
          totalElements: pagination.totalElements || reimbursements.length
        } : undefined}
        pageIndexBase={0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}

        // Empty state
        emptyMessage="No reimbursements found matching the criteria."
        emptyDescription="Try adjusting your filters or submit a new reimbursement claim."
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="reimbursements"
          defaultFilters={{
            search: searchTerm,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            dateFrom,
            dateTo
          }}
          selectedIds={selectedReimbursements}
          selectedCount={selectedReimbursements.length}
          onExportCustom={handleExportCustom}
        />
      )}
    </div>
  );
}
