/**
 * @fileoverview Canonical Subscription, Billing, and Access Mode Constants.
 * Mirrored directly from backend ERP_System entities, enums, and controllers.
 */

export const SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  PAST_DUE: 'PAST_DUE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
});

export const COMPANY_SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
});

export const ACCESS_MODE = Object.freeze({
  FULL: 'FULL',
  READ_ONLY: 'READ_ONLY',
  BLOCKED: 'BLOCKED',
});

export const SUBSCRIPTION_ENDPOINTS = Object.freeze({
  PLANS: '/api/sso/subscription-plans',
  PLAN_BY_ID: (id) => `/api/sso/subscription-plans/${id}`,
  PLAN_BY_CODE: (code) => `/api/sso/subscription-plans/code/${encodeURIComponent(code)}`,
  PLAN_STATUS: (id) => `/api/sso/subscription-plans/${id}/status`,
  PLAN_MODULES: (id) => `/api/sso/subscription-plans/${id}/modules`,
  PLAN_MODULE_ITEM: (id, moduleId) => `/api/sso/subscription-plans/${id}/modules/${moduleId}`,
  CHECKOUT: (orgId) => `/api/sso/subscriptions/${orgId}/checkout`,
  CANCEL_CHECKOUT: (orgId) => `/api/sso/subscriptions/${orgId}/checkout/cancel`,
  VERIFY_PAYMENT: (orgId) => `/api/sso/subscriptions/${orgId}/verify-payment`,
  CANCEL_SUBSCRIPTION: (id) => `/api/sso/subscriptions/${id}/cancel`,
  ACTIVATE_TRIAL: (orgId) => `/api/sso/subscriptions/${orgId}/activate-trial`,
  ORG_SUBSCRIPTION: (orgId) => `/api/sso/subscriptions/${orgId}/current`,
  COMPANY_SUBSCRIPTION_CURRENT: '/api/sso/company-subscriptions/current',
  COMPANY_SUBSCRIPTION: (companyId) => `/api/sso/company-subscriptions/company/${companyId}`,
  ADMIN_ORG_SUBSCRIPTION: (orgId) => `/api/sso/admin/organizations/${orgId}/subscription`,
  ADMIN_ORG_PAYMENTS: (orgId) => `/api/sso/admin/organizations/${orgId}/payments`,
  ADMIN_ORG_INVOICES: (orgId) => `/api/sso/admin/organizations/${orgId}/invoices`,
  ME: '/api/sso/auth/me',
  MODULES: '/api/sso/module',
});

/**
 * Standard Indian Rupee (INR) formatter for display.
 * @param {number|string|null|undefined} amount - Amount in standard currency units (Rupees)
 * @param {string} [currency='INR']
 * @returns {string} e.g. "₹4,999" or "$100"
 */
export function formatCurrencyAmount(amount, currency = 'INR') {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return '₹0';

  const curr = String(currency || 'INR').trim().toUpperCase();
  if (curr === 'INR') {
    return `₹${num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    })}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${curr} ${num.toLocaleString()}`;
  }
}

/**
 * Format an amount in INR with optional paise conversion.
 * @param {number|string|null|undefined} amount
 * @param {boolean} [isPaise=false]
 * @returns {string} e.g. "₹4,999"
 */
export function formatINR(amount, isPaise = false) {
  const num = Number(amount ?? 0);
  const rupees = isPaise ? num / 100 : num;
  return formatCurrencyAmount(rupees, 'INR');
}

/**
 * Formats duration in days to a user-friendly cycle string.
 * @param {number} days
 * @returns {string} e.g. "month", "year", "30 days"
 */
export function formatDurationCycle(days) {
  const d = Number(days);
  if (d === 30) return 'month';
  if (d === 365 || d === 366) return 'year';
  if (d === 90) return 'quarter';
  if (d > 0) return `${d} days`;
  return 'cycle';
}

/**
 * Convert standard currency rupees to integer paise for Razorpay.
 * @param {number|string} rupees
 * @returns {number} integer paise
 */
export function rupeesToPaise(rupees) {
  const r = Number(rupees ?? 0);
  return Math.round(r * 100);
}

/**
 * Convert integer paise to standard rupees.
 * @param {number|string} paise
 * @returns {number} rupees
 */
export function paiseToRupees(paise) {
  const p = Number(paise ?? 0);
  return p / 100;
}

/**
 * Renders status with robust unknown value fallback.
 * @param {string} status
 * @returns {string}
 */
export function formatSubscriptionStatusText(status) {
  if (!status) return 'Inactive';
  const upper = String(status).trim().toUpperCase();
  switch (upper) {
    case 'ACTIVE':
      return 'Active';
    case 'TRIALING':
      return 'Free Trial';
    case 'PENDING':
      return 'Payment Pending';
    case 'EXPIRED':
      return 'Expired';
    case 'CANCELLED':
      return 'Cancelled';
    case 'PAST_DUE':
      return 'Past Due';
    case 'PAUSED':
      return 'Paused';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return status; // Render raw text for unknown values
  }
}
