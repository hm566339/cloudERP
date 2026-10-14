import { useState, useCallback } from 'react';
import * as vendorApi from '../../services/vendorService';

export const useVendor = (companyId) => {
  const [vendors, setVendors] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0
  });

  const fetchVendors = useCallback(async (filters = {}) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await vendorApi.getVendors({ companyId, ...filters });
      let list = response.data?.content || response.data || response || [];
      if (!Array.isArray(list)) list = [];
      const hasPagination = response.pagination || response.totalElements;
      
      const page = response.pagination?.currentPage || response.page || filters.page || 1;
      const pageSize = response.pagination?.pageSize || response.size || filters.pageSize || 10;
      
      if (!hasPagination && list.length > 0) {
        setVendors(list.slice((page - 1) * pageSize, page * pageSize));
      } else {
        setVendors(list);
      }
      
      setPageInfo({
        page,
        pageSize,
        totalElements: response.pagination?.totalElements || response.totalElements || list.length,
        totalPages: response.pagination?.totalPages || response.totalPages || Math.ceil(list.length / pageSize)
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchVendorById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendorApi.getVendorById(id);
      setVendor(response.data || response);
      return response.data || response;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch vendor details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVendor = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendorApi.createVendor(payload);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to create vendor';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const editVendor = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendorApi.updateVendor(id, payload);
      setVendor(response.data || response);
      return { success: true, data: response.data || response };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to update vendor';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeVendor = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await vendorApi.deleteVendor(id);
      return { success: true };
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to delete vendor';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVendorStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    setError(null);
    try {
      if (isActive) {
        await vendorApi.deactivateVendor(id);
      } else {
        await vendorApi.activateVendor(id);
      }
      return { success: true };
    } catch (err) {
      const action = isActive ? 'deactivate' : 'activate';
      const errMsg = err?.response?.data?.message || err.message || `Failed to ${action} vendor`;
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vendors,
    vendor,
    loading,
    error,
    pageInfo,
    fetchVendors,
    fetchVendorById,
    createVendor,
    editVendor,
    removeVendor,
    toggleVendorStatus,
    setVendor // To allow clearing selected vendor
  };
};
