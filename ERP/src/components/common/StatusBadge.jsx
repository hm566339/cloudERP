import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getEnumMeta } from '../../metadata/enumsRegistry';

/**
 * Enhanced Canonical StatusBadge component.
 * Supports dynamic backend enum metadata, custom configs, and legacy boolean flags.
 *
 * Props:
 *  - enum {string}         — The enum key (e.g. "invoiceStatus", "documentStatus", "accountStatus")
 *  - value {string}        — The enum value (e.g. "DRAFT", "POSTED", "PAID")
 *  - status {string}       — Alias for value or raw status string
 *  - statusConfig {object} — Optional custom map of status -> { cls, dot } Tailwind classes
 *  - labelPrefix {string}  — Optional prefix text before the label (e.g. "PO: ")
 *  - isActive {boolean}    — Boolean active/inactive toggle
 *  - isDeleted {boolean}   — Show "Deleted" badge
 *  - isClosed {boolean}    — Show "Closed" badge
 *  - className {string}    — Additional CSS classes
 */
const StatusBadge = ({
  enum: enumName,
  value,
  status,
  statusConfig,
  labelPrefix = '',
  isActive,
  active,
  isDeleted,
  isClosed,
  className = ''
}) => {
  const effectiveActive = isActive !== undefined ? isActive : active;
  const targetValue = value !== undefined ? value : status;

  // 1. Dynamic Enum Registry evaluation
  if (enumName && targetValue !== undefined && targetValue !== null) {
    const meta = getEnumMeta(enumName, targetValue);
    const label = `${labelPrefix}${meta ? meta.label : String(targetValue)}`;
    const cls = meta ? meta.className : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';

    return (
      <span
        data-testid="status-badge"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full border ${cls} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {label}
      </span>
    );
  }

  // 2. Status string evaluation (with custom config or fallback)
  if (targetValue !== undefined && targetValue !== null && targetValue !== '') {
    const s = targetValue.toString().toUpperCase();

    // Use caller-provided statusConfig first, then fallback to built-in basics
    const builtInConfig = {
      OPEN: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      CLOSED: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      LOCKED: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      ACTIVE: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      INACTIVE: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      ENABLED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      DISABLED: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      CREATED: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      NOT_POSTED: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      ACCEPTED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      AWARDED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      EXPIRED: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      DRAFT: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      POSTED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      APPROVED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      SUBMITTED: { cls: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30', dot: 'bg-teal-500 dark:bg-[#38BDF8]' },
      CANCELLED: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      REJECTED: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      REVERSED: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      PAID: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      PARTIAL: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      PARTIALLY_PAID: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      PARTIALLY_RECEIVED: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      PENDING: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      PENDING_APPROVAL: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      CHANGES_REQUESTED: { cls: 'bg-orange-50 dark:bg-[#F97316]/15 text-orange-700 dark:text-[#FB923C] border-orange-200 dark:border-[#F97316]/30', dot: 'bg-orange-500 dark:bg-[#FB923C]' },
      CUSTOMER_ACCEPTED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      CONVERTED: { cls: 'bg-indigo-50 dark:bg-[#6366F1]/15 text-indigo-700 dark:text-[#818CF8] border-indigo-200 dark:border-[#6366F1]/30', dot: 'bg-indigo-500 dark:bg-[#818CF8]' },
      OVERDUE: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      UNPAID: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      FAILED: { cls: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30', dot: 'bg-red-500 dark:bg-[#F0616D]' },
      VOIDED: { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' },
      SUCCESS: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      SENT: { cls: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30', dot: 'bg-teal-500 dark:bg-[#38BDF8]' },
      SHORTLISTED: { cls: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30', dot: 'bg-teal-500 dark:bg-[#38BDF8]' },
      ORDERED: { cls: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30', dot: 'bg-teal-500 dark:bg-[#38BDF8]' },
      RECEIVED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      COMPLETED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      IN_PROGRESS: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      UNDER_REVIEW: { cls: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30', dot: 'bg-amber-500 dark:bg-[#F5B544]' },
      CONFIRMED: { cls: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30', dot: 'bg-emerald-500 dark:bg-[#34C38F]' },
      VERIFIED: { cls: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30', dot: 'bg-teal-500 dark:bg-[#38BDF8]' },
    };

    const effectiveConfig = statusConfig || builtInConfig;
    const cfg = effectiveConfig[s] || { cls: 'bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]', dot: 'bg-zinc-400 dark:bg-[#6B7184]' };
    const label = `${labelPrefix}${s.replace(/_/g, ' ')}`;

    return (
      <span
        data-testid="status-badge"
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase rounded-full border ${cfg.cls} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {label}
      </span>
    );
  }

  // 3. Boolean flags
  if (isDeleted) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Deleted
      </span>
    );
  }

  if (isClosed) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Closed
      </span>
    );
  }

  if (effectiveActive === false) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 dark:bg-[#F0616D]/15 text-red-700 dark:text-[#F0616D] border-red-200 dark:border-[#F0616D]/30 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Inactive
      </span>
    );
  }

  // Default to Active / Open if isActive/active is true or undefined
  return (
    <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30 inline-flex items-center gap-1.5">
      <CheckCircle size={14} /> {isClosed === false ? 'Open' : 'Active'}
    </span>
  );
};

export default StatusBadge;
