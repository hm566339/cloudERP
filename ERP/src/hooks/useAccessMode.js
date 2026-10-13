import { useMemo } from 'react';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser, selectSubscription, selectAccessMode } from '../features/auth/authSlice';
import { selectSelectedCompany } from '../features/company-management/companySlice';
import { deriveOrganizationContext, READ_ONLY_BLOCK_MESSAGE, BLOCKED_ACCESS_MESSAGE } from '../utils/subscriptionHelper';

/**
 * useAccessMode — returns the effective access mode for the current session.
 *
 * Primarily sourced from the SSO /me subscription context (state.auth.subscription
 * and state.auth.accessMode), which is the backend-authoritative source.
 *
 * Falls back to deriveOrganizationContext (legacy user field parsing) when the
 * rich SSO context is not available.
 */
export function useAccessMode() {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  // SSO /me enriched contexts (primary source of truth)
  const ssoSubscription = useAppSelector(selectSubscription);
  const ssoAccessMode = useAppSelector(selectAccessMode);

  return useMemo(() => {
    // If we have the SSO-enriched subscription context, prefer it.
    if (ssoSubscription || ssoAccessMode !== 'FULL') {
      const accessMode = ssoAccessMode || ssoSubscription?.accessMode || 'FULL';
      const status = ssoSubscription?.status || 'ACTIVE';
      const trialEndsAt = ssoSubscription?.trialEndsAt || null;
      const daysRemaining = ssoSubscription?.daysRemaining ?? null;
      const planCode = ssoSubscription?.planCode || null;

      const isReadOnly = String(accessMode).toUpperCase() === 'READ_ONLY';
      const isBlocked = String(accessMode).toUpperCase() === 'BLOCKED' || String(status).toUpperCase() === 'BLOCKED';
      const isTrial = ssoSubscription?.trialing === true || String(status).toUpperCase() === 'TRIALING';
      const isPending = String(status).toUpperCase() === 'PENDING';
      const isActive = !isReadOnly && !isBlocked && !isTrial && !isPending && String(status).toUpperCase() === 'ACTIVE';

      // Organization context from SSO
      const orgCode = currentUser?.organizationCode || null;
      const orgName = currentUser?.organization?.name || null;

      return {
        accessMode,
        status,
        isReadOnly,
        isBlocked,
        isTrial,
        isPending,
        isActive,
        trialEndsAt,
        daysRemaining,
        planName: planCode || (isTrial ? '30-Day Free Trial' : 'Enterprise'),
        organization: { code: orgCode, name: orgName },
        company: selectedCompany || null,
        user: currentUser,
        badge: buildBadge(accessMode, status, daysRemaining),
        readOnlyMessage: READ_ONLY_BLOCK_MESSAGE,
        blockedMessage: BLOCKED_ACCESS_MESSAGE,
      };
    }

    // Fallback: derive from user fields (pre-SSO-enrichment or admin context)
    const ctx = deriveOrganizationContext(currentUser, selectedCompany);

    return {
      accessMode: ctx.subscription.accessMode,
      status: ctx.subscription.status,
      isReadOnly: ctx.isReadOnly,
      isBlocked: ctx.isBlocked,
      isTrial: ctx.isTrial,
      isPending: ctx.isPending || false,
      isActive: ctx.isActive,
      trialEndsAt: ctx.subscription.trialEndsAt,
      daysRemaining: ctx.subscription.daysRemaining,
      planName: ctx.subscription.planName,
      organization: ctx.organization,
      company: ctx.company,
      user: ctx.user,
      badge: ctx.badge,
      readOnlyMessage: READ_ONLY_BLOCK_MESSAGE,
      blockedMessage: BLOCKED_ACCESS_MESSAGE,
    };
  }, [currentUser, selectedCompany, ssoSubscription, ssoAccessMode]);
}

function buildBadge(accessMode, status, daysRemaining) {
  const normAccess = String(accessMode || '').toUpperCase();
  const normStatus = String(status || '').toUpperCase();

  if (normAccess === 'BLOCKED') {
    return { show: true, text: 'Access Restricted', shortText: 'Restricted', type: 'blocked', days: null };
  }
  if (normAccess === 'READ_ONLY' || normStatus === 'EXPIRED') {
    return { show: true, text: 'Trial Expired • Read-Only', shortText: 'Read-Only', type: 'read_only', days: 0 };
  }
  if (normStatus === 'PENDING') {
    return { show: true, text: 'Payment Pending', shortText: 'Pending', type: 'pending', days: 0 };
  }
  if (normStatus === 'TRIALING') {
    const days = daysRemaining != null ? daysRemaining : null;
    const label = days != null ? `Trial • ${days} ${days === 1 ? 'day' : 'days'} remaining` : '30-Day Free Trial';
    return { show: true, text: label, shortText: days != null ? `Trial • ${days}d` : 'Trial', type: 'trial', days };
  }
  return { show: false, text: 'Subscription Active', shortText: 'Active', type: 'active', days: null };
}

export default useAccessMode;
