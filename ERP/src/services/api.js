import apiClient from '../api/common/client'
import store from '../app/store'
import { addAlert } from '../features/notifications/notificationSlice'
import { getActiveCompanyId, isOwnerOrSystemAdminUser } from '../api/common/roleCompanyContext'

export const API = apiClient
export default apiClient

// Keep legacy global error alerts for 500s
API.interceptors.response.use(
 (response) => response,
 (error) => {
 const status = error?.response?.status

 if (status >= 500) {
 console.error('Server error. Please try again later.')
 store.dispatch(addAlert({ type: 'error', message: 'Server error. Please try again later.' }))
 }

 return Promise.reject(error)
 }
)

export const getCompanies = async (page = 0, pageSize = 10, search = '') => {
 const params = { page, pageSize }
 if (search?.trim()) params.search = search.trim()
 const { data } = await API.get('/api/sso/company', { params })
 return data
}

/**
 * Fetch a single company by UUID
 */
export const getCompanyById = async (id) => {
 const { data } = await API.get(`/api/sso/company/${id}`)
 return data
}

/**
 * Fetch finance dashboard for a company
 */
export const getFinanceDashboard = async (companyId) => {
  const isPrivileged = isOwnerOrSystemAdminUser();
  const effectiveCompanyId = companyId || getActiveCompanyId();
  const params = {};
  if (isPrivileged && effectiveCompanyId) {
    params.companyId = effectiveCompanyId;
  }
  const { data } = await API.get('/api/dashboard/finance', {
    params,
  });
  return data;
};
