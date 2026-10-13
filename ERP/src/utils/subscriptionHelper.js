/**
 * @fileoverview Pure utility functions for Phase 11 — Trial Status, Organization Context & Subscription UX.
 *
 * All functions are deterministic and pure, enabling comprehensive automated unit testing.
 * Sources of truth:
 * - Server timestamps (trialEndsAt) are authoritative; timezones are handled via UTC Date parsing.
 * - Access mode ('FULL', 'READ_ONLY', 'BLOCKED') dictates write authorization UX.
 * - Subscription status ('TRIALING', 'ACTIVE', 'EXPIRED', 'BLOCKED').
 */

/**
 * Calculates remaining trial days from an authoritative server timestamp.
 *
 * @param {string|number|Date|null|undefined} trialEndsAt - Authoritative server timestamp (ISO 8601 or epoch ms)
 * @param {Date|number} [now=new Date()] - Reference timestamp (defaults to current time)
 * @returns {number|null} Remaining integer days (0 if expired), or null if no valid trial end date is provided.
 */
export function calculateTrialDaysRemaining(trialEndsAt, now = new Date()) {
  if (!trialEndsAt) return null;

  const endDate = new Date(trialEndsAt);
  if (isNaN(endDate.getTime())) return null;

  const nowDate = now instanceof Date ? now : new Date(now);
  if (isNaN(nowDate.getTime())) return null;

  const diffMs = endDate.getTime() - nowDate.getTime();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Normalizes and derives subscription status from backend accessMode and subscription fields.
 *
 * @param {Object} params
 * @param {string} [params.status] - 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'
 * @param {string} [params.accessMode] - 'FULL' | 'READ_ONLY' | 'BLOCKED'
 * @param {string|number|Date} [params.trialEndsAt] - Authoritative trial end timestamp
 * @param {Date|number} [params.now=new Date()] - Current reference time
 * @returns {'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'}
 */
export function deriveSubscriptionStatus({ status, accessMode, trialEndsAt, now = new Date() } = {}) {
  const normAccess = String(accessMode || '').toUpperCase();
  const normStatus = String(status || '').toUpperCase();

  if (normAccess === 'BLOCKED' || normStatus === 'BLOCKED') {
    return 'BLOCKED';
  }

  if (normAccess === 'READ_ONLY') {
    return 'EXPIRED';
  }

  if (normStatus === 'PENDING') {
    return 'PENDING';
  }

  if (normStatus === 'ACTIVE') {
    return 'ACTIVE';
  }

  if (trialEndsAt) {
    const days = calculateTrialDaysRemaining(trialEndsAt, now);
    if (days !== null) {
      return days > 0 ? 'TRIALING' : 'EXPIRED';
    }
  }

  if (normStatus === 'TRIALING') {
    return 'TRIALING';
  }

  if (normStatus === 'EXPIRED') {
    return 'EXPIRED';
  }

  return 'ACTIVE';
}

/**
 * Generates user-facing label and badge text for header status indicator.
 *
 * @param {Object} params
 * @param {string} params.status - 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'
 * @param {string} params.accessMode - 'FULL' | 'READ_ONLY' | 'BLOCKED'
 * @param {number|null} params.daysRemaining - Integer remaining days
 * @returns {{ full: string, short: string, type: 'trial' | 'active' | 'readonly' | 'blocked' }}
 */
export function formatTrialBadge({ status, accessMode, daysRemaining }) {
  const normStatus = String(status || '').toUpperCase();
  const normAccess = String(accessMode || '').toUpperCase();

  if (normAccess === 'BLOCKED' || normStatus === 'BLOCKED') {
    return {
      show: true,
      text: 'Account Access Restricted',
      shortText: 'Restricted',
      full: 'Access Restricted',
      short: 'Restricted',
      type: 'blocked',
      days: null,
    };
  }

  if (normAccess === 'READ_ONLY' || normStatus === 'EXPIRED') {
    return {
      show: true,
      text: 'Trial Expired • Read-Only',
      shortText: 'Read-Only',
      full: 'Trial Expired • Read-Only',
      short: 'Read-Only',
      type: 'read_only',
      days: 0,
    };
  }

  if (normStatus === 'PENDING') {
    return {
      show: true,
      text: 'Payment Pending',
      shortText: 'Pending',
      full: 'Payment Pending',
      short: 'Pending',
      type: 'pending',
      days: 0,
    };
  }

  if (normStatus === 'TRIALING') {
    const days = daysRemaining !== null && daysRemaining !== undefined ? daysRemaining : null;
    if (days !== null) {
      const dayWord = days === 1 ? 'day' : 'days';
      return {
        show: true,
        text: `Trial • ${days} ${dayWord} remaining`,
        shortText: `Trial • ${days}d`,
        full: `Trial • ${days} ${dayWord} remaining`,
        short: `Trial • ${days}d`,
        type: 'trial',
        days,
      };
    }
    return {
      show: true,
      text: '30-Day Free Trial',
      shortText: 'Trial',
      full: '30-Day Free Trial',
      short: 'Trial',
      type: 'trial',
      days: null,
    };
  }

  return {
    show: false,
    text: 'Subscription Active',
    shortText: 'Active',
    full: 'Subscription Active',
    short: 'Active',
    type: 'active',
    days: null,
  };
}

/**
 * Derives verified organization context from authenticated user and selected company state.
 *
 * @param {Object} user - Redux currentUser state
 * @param {Object} selectedCompany - Redux selectedCompany state
 * @param {Date|number} [now=new Date()] - Reference time for countdown calculation
 * @returns {Object} Normalized organization and subscription context
 */
export function deriveOrganizationContext(user, selectedCompany, now = new Date()) {
  const orgCode = user?.organizationCode || user?.organization?.code || null;
  const orgName = user?.organizationName || user?.organization?.name || orgCode || null;
  const orgId = user?.organizationId || user?.organization?.id || null;

  const compCode = selectedCompany?.code || user?.companyCode || null;
  const compName = selectedCompany?.name || user?.companyName || compCode || null;
  const compId = selectedCompany?.id || user?.companyId || compCode || null;

  const rawAccess = user?.accessMode || user?.subscription?.accessMode || 'FULL';
  const rawStatus = user?.subscription?.status || (rawAccess === 'READ_ONLY' ? 'EXPIRED' : (rawAccess === 'BLOCKED' ? 'BLOCKED' : null));
  const trialEndsAt = user?.trialEndsAt || user?.subscription?.trialEndsAt || null;

  const daysRemaining = calculateTrialDaysRemaining(trialEndsAt, now);
  const status = deriveSubscriptionStatus({
    status: rawStatus,
    accessMode: rawAccess,
    trialEndsAt,
    now,
  });

  const isReadOnly = String(rawAccess).toUpperCase() === 'READ_ONLY' || status === 'EXPIRED';
  const isBlocked = String(rawAccess).toUpperCase() === 'BLOCKED' || status === 'BLOCKED';
  const isTrial = status === 'TRIALING';
  const isPending = status === 'PENDING';
  const isActive = status === 'ACTIVE';

  const badge = formatTrialBadge({
    status,
    accessMode: rawAccess,
    daysRemaining,
  });

  const planName = user?.subscription?.planName || (isTrial ? '30-Day Free Trial' : 'Enterprise');

  return {
    organization: {
      id: orgId,
      code: orgCode,
      name: orgName,
    },
    company: {
      id: compId,
      code: compCode,
      name: compName,
    },
    user: {
      id: user?.id,
      username: user?.username,
      fullName: user?.fullName || user?.name,
      email: user?.email,
      role: user?.role,
    },
    subscription: {
      status,
      accessMode: rawAccess,
      trialEndsAt,
      daysRemaining,
      planName,
    },
    isReadOnly,
    isBlocked,
    isTrial,
    isPending,
    isActive,
    badge,
  };
}

/**
 * Standard user-facing message when write operation is blocked by READ_ONLY access mode.
 */
export const READ_ONLY_BLOCK_MESSAGE =
  'Your free trial has expired. This account is currently read-only. Upgrade your subscription to continue creating or modifying business data.';

/**
 * Standard user-facing message when account access is BLOCKED.
 */
export const BLOCKED_ACCESS_MESSAGE =
  'Account access restricted. Please contact support or your administrator.';

/**
 * Client-side read/write capability policy based on backend access mode.
 * Frontend disabling is strictly for UX; backend enforcement remains authoritative.
 *
 * @param {string} [accessMode='FULL']
 * @returns {Object} Capability flags
 */
export function getReadAccessPolicy(accessMode) {
  const norm = String(accessMode || 'FULL').toUpperCase();
  if (norm === 'BLOCKED') {
    return {
      canReadDashboard: false,
      canReadReports: false,
      canReadRecords: false,
      canReadSubscription: true,
      canWriteBusinessData: false,
      shouldRedirectToLogin: false,
      shouldClearSession: false,
    };
  }
  if (norm === 'READ_ONLY') {
    return {
      canReadDashboard: true,
      canReadReports: true,
      canReadRecords: true,
      canReadSubscription: true,
      canWriteBusinessData: false,
      shouldRedirectToLogin: false,
      shouldClearSession: false,
    };
  }
  return {
    canReadDashboard: true,
    canReadReports: true,
    canReadRecords: true,
    canReadSubscription: true,
    canWriteBusinessData: true,
    shouldRedirectToLogin: false,
    shouldClearSession: false,
  };
}

/**
 * Sanitizes write access errors to provide helpful subscription upgrade messaging.
 *
 * @param {Object} error - Error object or response
 * @returns {string} Safe user-facing error message
 */
export function sanitizeWriteAccessError(error) {
  const status = error?.status || error?.response?.status;
  const msg = error?.data?.message || error?.response?.data?.message || error?.message || '';
  const lower = String(msg).toLowerCase();

  if (status === 403 || lower.includes('read_only') || lower.includes('read-only') || lower.includes('read only')) {
    if (lower.includes('blocked') || lower.includes('restricted')) {
      return BLOCKED_ACCESS_MESSAGE;
    }
    return READ_ONLY_BLOCK_MESSAGE;
  }
  return msg || 'Permission denied.';
}
