import apiClient from '../common/client';

/**
 * Fetch SSO Dashboard metrics for a specific company
 * @param {string} companyId - The UUID of the company
 * @returns {Promise<Object>} Dashboard data mapped exactly from backend
 */
export const getDashboard = async (companyId) => {
  if (!companyId) throw new Error('Company ID is required to fetch dashboard');
  const response = await apiClient.get(`/api/sso/dashboard/${companyId}`);
  return response.data?.data || response.data;
};

import { useState, useEffect } from 'react';
export const useGetDashboardMetricsQuery = (companyId, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (options.skip || !companyId) return;
    setIsLoading(true);
    getDashboard(companyId).then(res => {
      setData(res);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [companyId, options.skip]);
  return { data, isLoading };
};
