import { useState, useEffect, useCallback } from 'react';
import { getSubscriptionPlans } from '../api/sso/subscriptionPlan.api';

/**
 * Custom hook to load available subscription plans dynamically from the SSO backend API.
 * Fetches exclusively from the backend with zero hardcoded dummy plans.
 * Supports `options.enabled` to prevent unprivileged roles from dispatching unauthorized network requests.
 *
 * @param {Object} params - Query params (e.g. { active: true })
 * @param {Object} options - Hook options (e.g. { enabled: true })
 */
export function useSubscriptionPlans(params = { active: true }, options = { enabled: true }) {
  const isEnabled = options?.enabled !== false;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(isEnabled);
  const [error, setError] = useState(null);

  const activeParam = params?.active;
  const searchParam = params?.search;

  const fetchPlans = useCallback(async () => {
    if (!isEnabled) {
      setLoading(false);
      setPlans([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptionPlans({ active: activeParam, search: searchParam });
      const plansList = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.content) ? data.content : []));
      setPlans(plansList);
    } catch (err) {
      const status = err?.response?.status;
      const isForbidden = status === 403;
      if (!isForbidden) {
        console.error('[useSubscriptionPlans] Failed to fetch plans from backend:', err);
      } else {
        // Backend authorization restriction (e.g., role lacks SUBSCRIPTION_PLAN:READ)
        console.warn('[useSubscriptionPlans] Access to subscription plans catalog denied by backend authorization (403 Forbidden).');
      }
      setError({
        status: status || 500,
        message: isForbidden
          ? 'Access denied: Viewing the subscription plans catalog requires elevated administrative authorization (SUBSCRIPTION_PLAN:READ).'
          : (err?.response?.data?.message || err?.message || 'Failed to fetch subscription plans'),
        rawError: err,
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [isEnabled, activeParam, searchParam]);

  useEffect(() => {
    if (isEnabled) {
      fetchPlans();
    } else {
      setLoading(false);
      setPlans([]);
      setError(null);
    }
  }, [fetchPlans, isEnabled]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}

