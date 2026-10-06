import { useState, useEffect, useCallback } from 'react';
import { getSubscriptionPlans } from '../api/sso/subscriptionPlan.api';

/**
 * Custom hook to load available subscription plans dynamically from the SSO API.
 * Handles loading, error, and refetch states.
 */
export function useSubscriptionPlans(params = { active: true }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptionPlans(params);
      const plansList = Array.isArray(data) ? data : (data?.data || []);
      setPlans(plansList);
    } catch (err) {
      console.error('[useSubscriptionPlans] Error fetching subscription plans:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load subscription plans.');
    } finally {
      setLoading(false);
    }
  }, [params.active, params.search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}
