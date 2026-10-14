/**
 * Sales domain constants.
 * Mirrors backend enum values exactly. Do NOT change these without a backend change.
 */

// ── Tailwind badge config: { cls, dot } ──────────────────────────────────────

/** Sales Quotation statuses */
export const QUOTATION_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ACCEPTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CONVERTED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  EXPIRED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** Sales Invoice statuses */
export const INVOICE_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_PAID: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  OVERDUE: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** Proforma Invoice statuses */
export const PROFORMA_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CONVERTED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

/** Sales Order statuses */
export const SALES_ORDER_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  CONFIRMED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_DELIVERED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  DELIVERED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** Delivery Challan statuses */
export const DC_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DISPATCHED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

// ── Default fallback ──────────────────────────────────────────────────────────
export const DEFAULT_STATUS_CONFIG = {
  cls: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  dot: 'bg-zinc-400',
};
