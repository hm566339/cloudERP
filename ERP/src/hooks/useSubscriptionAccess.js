import { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import {
  selectCurrentUser,
  selectSubscription,
  selectAccessMode,
  selectAuthContext,
} from '../features/auth/authSlice';
import { authApi } from '../features/auth/services/authApi';
import {
  canManagePlans,
  canBuySubscription,
  getBuyDisabledReason,
  isSystemAdmin,
  isOrganizationOwner,
  isOrganizationAdmin,
} from '../utils/subscriptionPermissions';
import { formatSubscriptionStatusText } from '../constants/subscriptionConstants';

export const READ_ONLY_MESSAGE =
  'Read-Only Mode: Your subscription or trial has expired. Modifications and posting are restricted until a subscription is activated.';
export const BLOCKED_MESSAGE =
  'Account Access Restricted: Your organization access is currently blocked. Please contact support or upgrade your subscription.';

/**
 * useSubscriptionAccess — Authoritative hook reading subscription state and access mode
 * directly from /api/sso/auth/me via Redux authSlice.
 */
export function useSubscriptionAccess() {
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);
  const ssoSubscription = useAppSelector(selectSubscription);
  const ssoAccessMode = useAppSelector(selectAccessMode);
  const currentUser = useAppSelector(selectCurrentUser);

  const refreshMe = useCallback(() => {
    return dispatch(authApi.endpoints.ssoGetMe.initiate(undefined, { forceRefetch: true }));
  }, [dispatch]);

  return useMemo(() => {
    const rawAccessMode = ssoAccessMode || ssoSubscription?.accessMode || authContext?.organization?.accessMode || 'FULL';
    const accessMode = String(rawAccessMode).toUpperCase();

    const rawStatus = ssoSubscription?.status || 'ACTIVE';
    const status = String(rawStatus).toUpperCase();

    const isReadOnly = accessMode === 'READ_ONLY' || status === 'EXPIRED';
    const isBlocked = accessMode === 'BLOCKED' || status === 'BLOCKED' || status === 'SUSPENDED';
    const isTrial = ssoSubscription?.trialing === true || status === 'TRIALING';
    const isPending = status === 'PENDING';
    const isActive = !isReadOnly && !isBlocked && !isPending && status === 'ACTIVE';

    const daysRemaining = typeof ssoSubscription?.daysRemaining === 'number'
      ? Math.max(0, ssoSubscription.daysRemaining)
      : (ssoSubscription?.trialEndsAt
          ? Math.max(0, Math.ceil((new Date(ssoSubscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0);

    const trialEndsAt = ssoSubscription?.trialEndsAt || null;
    const currentPeriodEnd = ssoSubscription?.currentPeriodEnd || null;
    const currentPeriodStart = ssoSubscription?.currentPeriodStart || ssoSubscription?.trialStartedAt || null;
    const planCode = ssoSubscription?.planCode || null;

    const planName = planCode
      ? planCode.replace(/_/g, ' ')
      : (isTrial ? '30-Day Free Trial' : 'Standard Enterprise');

    const canAdminPlans = canManagePlans(authContext);
    const canPurchase = canBuySubscription(authContext);
    const buyDisabledReason = getBuyDisabledReason(authContext);
    const isOwner = isOrganizationOwner(authContext);
    const isAdmin = isOrganizationAdmin(authContext);
    const isSysAdmin = isSystemAdmin(authContext);

    return {
      accessMode,
      status,
      statusText: formatSubscriptionStatusText(status),
      isReadOnly,
      isBlocked,
      isTrial,
      isPending,
      isActive,
      daysRemaining,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      planCode,
      planName,
      subscription: ssoSubscription,
      organization: authContext?.organization,
      user: currentUser,
      canManagePlans: canAdminPlans,
      canBuy: canPurchase,
      buyDisabledReason,
      isOwner,
      isAdmin,
      isSystemAdmin: isSysAdmin,
      readOnlyMessage: READ_ONLY_MESSAGE,
      blockedMessage: BLOCKED_MESSAGE,
      refreshMe,
    };
  }, [ssoAccessMode, ssoSubscription, authContext, currentUser, refreshMe]);
}

export default useSubscriptionAccess;
