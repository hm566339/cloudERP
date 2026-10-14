/**
 * Finance domain constants.
 * Mirrors backend enum values exactly. Do NOT change these without a backend change.
 */

// ── Tailwind badge config: { cls, dot } ──────────────────────────────────────

/** Credit Note statuses */
export const CREDIT_NOTE_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  APPLIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_APPLIED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

/** Debit Note statuses */
export const DEBIT_NOTE_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  APPLIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_APPLIED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

/** Journal Entry statuses */
export const JOURNAL_ENTRY_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  POSTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  REVERSED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

/** Receipt Voucher statuses */
export const RECEIPT_VOUCHER_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

/** AP Payment (finance module) statuses */
export const FINANCE_AP_PAYMENT_STATUS_CONFIG = {
  PAID: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIAL: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  UNPAID: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

/** GL Posting statuses */
export const GL_POSTING_STATUS_CONFIG = {
  DRAFT: { cls: 'bg-zinc-100 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400' },
  POSTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  FAILED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  REVERSED: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

// ── Default fallback ──────────────────────────────────────────────────────────
export const DEFAULT_STATUS_CONFIG = {
  cls: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  dot: 'bg-zinc-400',
};
