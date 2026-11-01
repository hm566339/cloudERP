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
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Active'
    },
    ENABLED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Enabled'
    },
    COMPLETED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Completed'
    },
    PAID: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Paid'
    },
    POSTED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Posted'
    },
    APPROVED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Approved'
    },
    PENDING_APPROVAL: {
      bg: 'bg-amber-50 dark:bg-[#F5B544]/15',
      text: 'text-amber-700 dark:text-[#F5B544]',
      border: 'border-amber-200 dark:border-[#F5B544]/30',
      dot: 'bg-amber-500 dark:bg-[#F5B544]',
      icon: Clock,
      defaultLabel: 'Pending Approval'
    },
    CHANGES_REQUESTED: {
      bg: 'bg-orange-50 dark:bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-500/30',
      dot: 'bg-orange-500 dark:bg-orange-400',
      icon: AlertCircle,
      defaultLabel: 'Changes Requested'
    },
    CUSTOMER_ACCEPTED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Customer Accepted'
    },
    ACCEPTED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Accepted'
    },
    SENT: {
      bg: 'bg-blue-50 dark:bg-[#38BDF8]/15',
      text: 'text-blue-700 dark:text-[#38BDF8]',
      border: 'border-blue-200 dark:border-[#38BDF8]/30',
      dot: 'bg-blue-500 dark:bg-[#38BDF8]',
      icon: CheckCircle,
      defaultLabel: 'Sent'
    },
    CONVERTED: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-500/30',
      dot: 'bg-indigo-500 dark:bg-indigo-400',
      icon: CheckCircle,
      defaultLabel: 'Converted'
    },
    REVERSED: {
      bg: 'bg-rose-50 dark:bg-[#F0616D]/15',
      text: 'text-rose-700 dark:text-[#F0616D]',
      border: 'border-rose-200 dark:border-[#F0616D]/30',
      dot: 'bg-rose-500 dark:bg-[#F0616D]',
      icon: AlertCircle,
      defaultLabel: 'Reversed'
    },
    REJECTED: {
      bg: 'bg-rose-50 dark:bg-[#F0616D]/15',
      text: 'text-rose-700 dark:text-[#F0616D]',
      border: 'border-rose-200 dark:border-[#F0616D]/30',
      dot: 'bg-rose-500 dark:bg-[#F0616D]',
      icon: XCircle,
      defaultLabel: 'Rejected'
    },
    INACTIVE: {
      bg: 'bg-rose-50 dark:bg-[#F0616D]/15',
      text: 'text-rose-700 dark:text-[#F0616D]',
      border: 'border-rose-200 dark:border-[#F0616D]/30',
      dot: 'bg-rose-500 dark:bg-[#F0616D]',
      icon: AlertCircle,
      defaultLabel: 'Inactive'
    },
    DISABLED: {
      bg: 'bg-zinc-100 dark:bg-[#222736]',
      text: 'text-zinc-600 dark:text-[#A0A6B5]',
      border: 'border-zinc-200 dark:border-[#2A2F3D]',
      dot: 'bg-zinc-400 dark:bg-[#6B7184]',
      icon: AlertCircle,
      defaultLabel: 'Disabled'
    },
    DELETED: {
      bg: 'bg-red-50 dark:bg-[#F0616D]/15',
      text: 'text-red-700 dark:text-[#F0616D]',
      border: 'border-red-200 dark:border-[#F0616D]/30',
      dot: 'bg-red-500 dark:bg-[#F0616D]',
      icon: XCircle,
      defaultLabel: 'Deleted'
    },
    PENDING: {
      bg: 'bg-amber-50 dark:bg-[#F5B544]/15',
      text: 'text-amber-700 dark:text-[#F5B544]',
      border: 'border-amber-200 dark:border-[#F5B544]/30',
      dot: 'bg-amber-500 dark:bg-[#F5B544]',
      icon: Clock,
      defaultLabel: 'Pending'
    },
    DRAFT: {
      bg: 'bg-zinc-100 dark:bg-[#222736]',
      text: 'text-zinc-700 dark:text-[#A0A6B5]',
      border: 'border-zinc-200 dark:border-[#2A2F3D]',
      dot: 'bg-zinc-400 dark:bg-[#6B7184]',
      icon: Clock,
      defaultLabel: 'Draft'
    },
    ISSUED: {
      bg: 'bg-blue-50 dark:bg-[#38BDF8]/15',
      text: 'text-blue-700 dark:text-[#38BDF8]',
      border: 'border-blue-200 dark:border-[#38BDF8]/30',
      dot: 'bg-blue-500 dark:bg-[#38BDF8]',
      icon: CheckCircle,
      defaultLabel: 'Issued'
    },
    PARTIALLY_PAID: {
      bg: 'bg-amber-50 dark:bg-[#F5B544]/15',
      text: 'text-amber-700 dark:text-[#F5B544]',
      border: 'border-amber-200 dark:border-[#F5B544]/30',
      dot: 'bg-amber-500 dark:bg-[#F5B544]',
      icon: Clock,
      defaultLabel: 'Partially Paid'
    },
    PARTIALLY_CONVERTED: {
      bg: 'bg-amber-50 dark:bg-[#F5B544]/15',
      text: 'text-amber-700 dark:text-[#F5B544]',
      border: 'border-amber-200 dark:border-[#F5B544]/30',
      dot: 'bg-amber-500 dark:bg-[#F5B544]',
      icon: Clock,
      defaultLabel: 'Partially Converted'
    },
    FULLY_CONVERTED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Fully Converted'
    },
    CONFIRMED: {
      bg: 'bg-emerald-50 dark:bg-[#34C38F]/15',
      text: 'text-emerald-700 dark:text-[#34C38F]',
      border: 'border-emerald-200 dark:border-[#34C38F]/30',
      dot: 'bg-emerald-500 dark:bg-[#34C38F]',
      icon: CheckCircle,
      defaultLabel: 'Confirmed'
    },
    EXPIRED: {
      bg: 'bg-amber-50 dark:bg-[#F5B544]/15',
      text: 'text-amber-700 dark:text-[#F5B544]',
      border: 'border-amber-200 dark:border-[#F5B544]/30',
      dot: 'bg-amber-500 dark:bg-[#F5B544]',
      icon: Clock,
      defaultLabel: 'Expired'
    },
    CANCELLED: {
      bg: 'bg-rose-50 dark:bg-[#F0616D]/15',
      text: 'text-rose-700 dark:text-[#F0616D]',
      border: 'border-rose-200 dark:border-[#F0616D]/30',
      dot: 'bg-rose-500 dark:bg-[#F0616D]',
      icon: XCircle,
      defaultLabel: 'Cancelled'
    }
  };

  const style = statusStyles[normalizedStatus] || {
    bg: 'bg-zinc-100 dark:bg-[#222736]',
    text: 'text-zinc-700 dark:text-[#A0A6B5]',
    border: 'border-zinc-200 dark:border-[#2A2F3D]',
    dot: 'bg-zinc-400 dark:bg-[#6B7184]',
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
