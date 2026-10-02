import { useState, useCallback } from 'react';
import * as accountApi from '../../services/accountService';

export const useAccount = (companyId) => {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0
  });

  const fetchAccounts = useCallback(async (filters = {}) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.getAccounts({ companyId, ...filters });
      let list = response?.data?.data || response?.data?.content || response?.data || response || [];
      if (!Array.isArray(list) && Array.isArray(response?.data?.accounts)) {
        list = response.data.accounts;
      }
      if (!Array.isArray(list)) list = [];
      const hasPagination = response?.data?.paginationResponse || response?.pagination || response?.totalElements;
      
      const pagInfo = response?.data?.paginationResponse || response?.pagination || response;
      const page = pagInfo?.currentPage !== undefined ? pagInfo.currentPage + 1 : (pagInfo?.page || filters.page || 1);
      const pageSize = pagInfo?.size || pagInfo?.pageSize || filters.pageSize || 10;
      
      if (!hasPagination && list.length > 0) {
        setAccounts(list.slice((page - 1) * pageSize, page * pageSize));
      } else {
        setAccounts(list);
      }
      
      setPageInfo({
        page,
        pageSize,
        totalElements: pagInfo?.totalElements || pagInfo?.totalCount || list.length,
        totalPages: pagInfo?.totalPages || Math.ceil(list.length / pageSize)
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchAccountById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.getAccountById(id, companyId);
      setAccount(response.data || response);
      return response.data || response;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch account details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const createAccount = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.createAccount(payload);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to create account';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const editAccount = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.updateAccount(id, payload);
      setAccount(response.data || response);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to update account';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeAccount = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await accountApi.deleteAccount(id, companyId);
      return { success: true };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to delete account';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const toggleAccountStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    setError(null);
    try {
      if (isActive) {
        await accountApi.deactivateAccount(id, companyId);
      } else {
        await accountApi.activateAccount(id, companyId);
      }
      return { success: true };
    } catch (err) {
      const action = isActive ? 'deactivate' : 'activate';
      const errMsg = err?.response?.data?.message || err.message || `Failed to ${action} account`;
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  return {
    accounts,
    account,
    loading,
    error,
    pageInfo,
    fetchAccounts,
    fetchAccountById,
    createAccount,
    editAccount,
    removeAccount,
    toggleAccountStatus,
    setAccount
  };
};
