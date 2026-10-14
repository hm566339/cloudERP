import API from './api'
import { getActiveCompanyId, isOwnerOrSystemAdminUser } from '../api/common/roleCompanyContext.js'

const buildParams = ({
  companyId,
  page = 1,
  pageSize = 10,
  search,
  status,
  city,
  state,
  country,
  sortField = 'vendorName',
  sortDirection = 'asc',
} = {}) => {
  const isPrivileged = isOwnerOrSystemAdminUser();
  const effectiveCompanyId = companyId || getActiveCompanyId();

  // For privileged users (OWNER / SystemAdmin), active companyId is required
  if (isPrivileged && !effectiveCompanyId) {
    throw new Error('companyId is required for Owner / SystemAdmin');
  }

  const params = {
    page: Math.max(0, page - 1),
    size: pageSize,
    sort: `${sortField},${sortDirection}`,
  }

  // Only include companyId query param for OWNER / SystemAdmin
  if (isPrivileged && effectiveCompanyId) {
    params.companyId = effectiveCompanyId;
  }

  if (search?.trim()) params.search = search.trim()
  if (status) params.status = status
  if (city) params.city = city
  if (state) params.state = state
  if (country) params.country = country
  return params
}

export const getVendors = async (options = {}) => {
  const { data } = await API.get('/api/account/v1/vendors', {
    params: buildParams(options),
  })
  return data
}

export const getVendorById = async (id) => {
  const { data } = await API.get(`/api/account/v1/vendors/${id}`)
  return data
}

export const createVendor = async (payload) => {
  const { data } = await API.post('/api/account/v1/vendors', payload)
  return data
}

export const updateVendor = async (id, payload) => {
  const { data } = await API.put(`/api/account/v1/vendors/${id}`, payload)
  return data
}

export const deleteVendor = async (id) => {
  const { data } = await API.delete(`/api/account/v1/vendors/${id}`)
  return data
}

export const activateVendor = async (id) => {
  const { data } = await API.patch(`/api/account/v1/vendors/${id}/activate`)
  return data
}

export const deactivateVendor = async (id) => {
  const { data } = await API.patch(`/api/account/v1/vendors/${id}/deactivate`)
  return data
}
