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
  isDeleted,
  isClosed,
  className = ''
}) => {
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
      OPEN: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
      LOCKED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
      ACTIVE: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      INACTIVE: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
      ENABLED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      DISABLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
      DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
      POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      CANCELLED: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
      PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    };

    const effectiveConfig = statusConfig || builtInConfig;
    const cfg = effectiveConfig[s] || { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };
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
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Deleted
      </span>
    );
  }

  if (isClosed) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Closed
      </span>
    );
  }

  if (isActive === false) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 inline-flex items-center gap-1.5">
        <AlertCircle size={14} /> Inactive
      </span>
    );
  }

  // Default to Active / Open if isActive is true or undefined
  return (
    <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1.5">
      <CheckCircle size={14} /> {isClosed === false ? 'Open' : 'Active'}
    </span>
  );
};

export default StatusBadge;
