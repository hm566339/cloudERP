import React from 'react';
import {
  CheckCircle2, Clock, XCircle, RotateCcw, Ban, FileText, HelpCircle,
} from 'lucide-react';

const STATUS_CONFIGS = {
  PENDING: {
    label: 'Pending Approval',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Returned to Initiator',
    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60',
    dot: 'bg-orange-500',
    icon: RotateCcw,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-zinc-100 dark:bg-hover-dark text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-border-dark',
    dot: 'bg-zinc-400',
    icon: Ban,
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    dot: 'bg-blue-500',
    icon: FileText,
  },
};

export default function WorkflowStatusBadge({ status, className = '' }) {
  const normStatus = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIGS[normStatus] || {
    label: status || 'Unknown',
    bg: 'bg-zinc-100 dark:bg-hover-dark text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-border-dark',
    dot: 'bg-zinc-400',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
      data-status={normStatus}
    >
      <Icon size={13} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
