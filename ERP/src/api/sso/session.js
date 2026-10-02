import apiClient from '../common/client';
import { useState, useEffect } from 'react';

export const getMySessions = async () => {
  const response = await apiClient.get('/api/sso/session/my');
  return response.data?.data || response.data;
};

export const getCompanySessions = async (companyId, params = {}) => {
  if (!companyId || companyId === 'all') {
    throw new Error('companyId is required to fetch all sessions');
  }

  const { page = 1, pageSize = 10 } = params;
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);

  const response = await apiClient.get(`/api/sso/session/all/${companyId}?${query.toString()}`);
  return response.data?.data || response.data;
};

export const deleteSession = async (id) => {
  const response = await apiClient.delete(`/api/sso/session/${id}`);
  return response.data?.data || response.data;
};

export const deleteAdminSession = async (id) => {
  const response = await apiClient.delete(`/api/sso/session/admin/${id}`);
  return response.data?.data || response.data;
};

export const deleteAllSessions = async (force = false) => {
  const response = await apiClient.delete(`/api/sso/session/all?force=${force}`);
  return response.data?.data || response.data;
};

export const refreshSession = async () => {
  const response = await apiClient.get('/api/sso/session/sso/refresh');
  return response.data?.data || response.data;
};

export const handleSSOCallback = async (code, goto) => {
  const response = await apiClient.get(`/api/sso/session/sso/callback?code=${code}&goto=${goto}`);
  return response.data?.data || response.data;
};

export const logoutSSO = async () => {
  const response = await apiClient.post('/api/sso/session/sso/logout');
  return response.data?.data || response.data;
};

// Fallback RTK Query hook for legacy components
export const useGetAllSessionsQuery = (params = {}, options = {}) => {
  const [data, setData] = useState({ sessions: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (options.skip || !params.companyId) return;
    setIsLoading(true);
    getCompanySessions(params.companyId, params)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [JSON.stringify(params), options.skip]);

  return { data, isLoading };
};
