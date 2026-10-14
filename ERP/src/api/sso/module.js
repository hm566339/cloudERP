import apiClient from '../common/client';

let modulesCache = null;
let modulesCacheTime = 0;
const MODULES_TTL = 5 * 60 * 1000;

export const getModules = async (params = {}) => {
  const isDefaultQuery = !params.search && (params.status === undefined || params.status === '' || params.status === 'ALL') && (params.page === undefined || params.page === 0);
  const now = Date.now();
  if (isDefaultQuery && modulesCache && (now - modulesCacheTime < MODULES_TTL)) {
    return modulesCache;
  }

  const page = params?.page ?? 0;
  const pageSize = params?.pageSize ?? 200;
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('pageSize', pageSize);
  if (params?.search) query.append('search', params.search);
  if (params?.status !== undefined && params.status !== '' && params.status !== 'ALL') {
    const isBool = typeof params.status === 'boolean' ? params.status : (params.status === 'active' || params.status === 'ACTIVE' || params.status === 'true');
    query.append('status', isBool);
  }

  const response = await apiClient.get(`/api/sso/module?${query.toString()}`);
  const data = response.data?.data || response.data;
  if (isDefaultQuery) {
    modulesCache = data;
    modulesCacheTime = now;
  }
  return data;
};

export const getModuleById = async (id) => {
  const response = await apiClient.get(`/api/sso/module/${id}`);
  return response.data?.data || response.data;
};

export const createModule = async (moduleData) => {
  modulesCache = null;
  const response = await apiClient.post('/api/sso/module', { data: moduleData });
  return response.data?.data || response.data;
};

export const updateModule = async (id, moduleData) => {
  const response = await apiClient.put(`/api/sso/module/${id}`, { data: moduleData });
  return response.data?.data || response.data;
};

export const updateModuleStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/sso/module/${id}/status`, { data: { moduleStatus: status } });
  return response.data?.data || response.data;
};

export const rotateModuleSecret = async (id) => {
  const response = await apiClient.post(`/api/sso/module/${id}/rotatesecret`);
  return response.data?.data || response.data;
};

export const deleteModule = async (id) => {
  const response = await apiClient.delete(`/api/sso/module/${id}`);
  return response.data?.data || response.data;
};

import { useState, useEffect } from 'react';
export const useGetModulesQuery = (params = {}, options = {}) => {
  const [data, setData] = useState({ modules: [] });
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (options.skip) return;
    setIsLoading(true);
    getModules(params).then(res => {
      setData(Array.isArray(res) ? { modules: res, pagination: {} } : res);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [JSON.stringify(params), options.skip]);
  return { data, isLoading };
};
