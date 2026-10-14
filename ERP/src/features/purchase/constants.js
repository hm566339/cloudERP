/**
 * Purchase domain constants.
 * Mirrors backend enum values exactly. Do NOT change these without a backend change.
 */

// ── Tailwind badge config: { cls, dot } ──────────────────────────────────────
// Used by StatusBadge via the statusConfig prop.

/** Purchase Order statuses */
export const PO_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PARTIALLY_RECEIVED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  RECEIVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** Goods Receipt (GRN) statuses */
export const GRN_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  RECEIVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_RECEIVED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

/** AP Invoice statuses */
export const AP_INVOICE_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_PAID: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** AP Payment statuses */
export const AP_PAYMENT_STATUS_CONFIG = {
  CREATED: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REVERSED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  FAILED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

/** GL Posting statuses (used as isGl badge in AP Payments) */
export const GL_STATUS_CONFIG = {
  POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  FAILED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  NOT_POSTED: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
};

/** RFQ statuses */
export const RFQ_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  RECEIVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  CONVERTED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

/** Supplier Quotation statuses */
export const SQ_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CONVERTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  EXPIRED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
};

/** Purchase Requisition statuses */
export const PR_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  SUBMITTED: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CONVERTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  PARTIALLY_FULFILLED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  FULFILLED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

/** Payment Voucher statuses */
export const PV_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

// ── Default fallback ──────────────────────────────────────────────────────────
export const DEFAULT_STATUS_CONFIG = {
  cls: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  dot: 'bg-zinc-400',
};
