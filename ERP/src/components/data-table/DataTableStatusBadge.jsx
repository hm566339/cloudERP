import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

/**
 * Reusable StatusBadge for DataTable cells.
 * Supports boolean flags (isActive) as well as status strings (ACTIVE, INACTIVE, DRAFT, PENDING, COMPLETED, etc.)
 */
export default function DataTableStatusBadge({
  status,
  isActive,
  isDeleted,
  label,
  variant,
  className = '',
  showIcon = true,
  showDot = false
}) {
  // If explicitly provided boolean isActive
  if (isActive !== undefined && !status) {
    status = isActive ? 'ACTIVE' : 'INACTIVE';
  }
  if (isDeleted) {
    status = 'DELETED';
  }

  const normalizedStatus = String(status || '').toUpperCase().trim();

  // Status style dictionary
  const statusStyles = {
    ACTIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Active'
    },
    ENABLED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Enabled'
    },
    COMPLETED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Completed'
    },
    PAID: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Paid'
    },
    POSTED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Posted'
    },
    APPROVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Approved'
    },
    REVERSED: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: AlertCircle,
      defaultLabel: 'Reversed'
    },
    REJECTED: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      defaultLabel: 'Rejected'
    },
    INACTIVE: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: AlertCircle,
      defaultLabel: 'Inactive'
    },
    DISABLED: {
      bg: 'bg-zinc-100',
      text: 'text-zinc-600',
      border: 'border-zinc-200',
      dot: 'bg-zinc-400',
      icon: AlertCircle,
      defaultLabel: 'Disabled'
    },
    DELETED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      icon: XCircle,
      defaultLabel: 'Deleted'
    },
    PENDING: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
      defaultLabel: 'Pending'
    },
    DRAFT: {
      bg: 'bg-zinc-100',
      text: 'text-zinc-700',
      border: 'border-zinc-200',
      dot: 'bg-zinc-400',
      icon: Clock,
      defaultLabel: 'Draft'
    },
    ISSUED: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: CheckCircle,
      defaultLabel: 'Issued'
    },
    PARTIALLY_PAID: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
      defaultLabel: 'Partially Paid'
    },
    PARTIALLY_CONVERTED: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
      defaultLabel: 'Partially Converted'
    },
    FULLY_CONVERTED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Fully Converted'
    },
    CONFIRMED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      defaultLabel: 'Confirmed'
    },
    EXPIRED: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
      defaultLabel: 'Expired'
    },
    CANCELLED: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      defaultLabel: 'Cancelled'
    }
  };

  const style = statusStyles[normalizedStatus] || {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
    icon: null,
    defaultLabel: status || 'Unknown'
  };

  const displayText = label || style.defaultLabel;
  const IconComponent = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {showIcon && IconComponent && <IconComponent size={12} className="shrink-0" />}
      <span>{displayText}</span>
    </span>
  );
}
