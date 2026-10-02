import API from './api'

const cleanAccountPayload = (payload = {}) => {
  const {
    id,
    company,
    group,
    parentAccount,
    groupName,
    parentAccountCode,
    deleted,
    isDeleted,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    companyId,
    ...rest
  } = payload

  const data = { ...rest }

  Object.keys(data).forEach((key) => {
    if (data[key] === '' || data[key] === null || data[key] === undefined) {
      delete data[key]
    }
  })

  if (data.openingBalance !== undefined) {
    data.openingBalance = Number(data.openingBalance) || 0
  }

  return data
}

const companyRequestConfig = (companyId, extra = {}) => ({
  ...extra,
  params: companyId ? { ...(extra.params || {}), companyId } : extra.params,
  headers: companyId ? { ...(extra.headers || {}), 'X-Company-Id': companyId } : extra.headers,
})

const buildParams = ({
  companyId,
  page = 1,
  pageSize = 10,
  search,
  status,
  sortField = 'accountName',
  sortDirection = 'asc',
} = {}) => {
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const params = {
    companyId,
    page: Math.max(0, page - 1),
    size: pageSize,
    sort: `${sortField},${sortDirection}`,
  }

  if (search?.trim()) params.search = search.trim()
  if (status) params.status = status
  return params
}

export const getAccounts = async (options = {}) => {
  const { companyId } = options
  const { data } = await API.get('/api/account/chart-of-accounts', {
    params: buildParams(options),
    headers: companyId ? { 'X-Company-Id': companyId } : undefined,
  })
  return data
}

export const getAccountById = async (id, companyId) => {
  const { data } = await API.get(`/api/account/chart-of-accounts/${id}`, {
    headers: companyId ? { 'X-Company-Id': companyId } : undefined,
  })
  return data
}

export const createAccount = async (payload) => {
  const { companyId } = payload
  const accountData = cleanAccountPayload(payload)
  const { data } = await API.post(
    '/api/account/chart-of-accounts',
    { data: accountData },
    companyRequestConfig(companyId)
  )
  return data
}

export const updateAccount = async (id, payload) => {
  const { companyId } = payload
  const accountData = cleanAccountPayload(payload)
  const { data } = await API.put(
    `/api/account/chart-of-accounts/${id}`,
    { data: accountData },
    companyRequestConfig(companyId)
  )
  return data
}

export const deleteAccount = async (id, companyId) => {
  const { data } = await API.delete(`/api/account/chart-of-accounts/${id}`, {
    headers: companyId ? { 'X-Company-Id': companyId } : undefined,
  })
  return data
}

export const activateAccount = async (id, companyId) => {
  const { data } = await API.patch(`/api/account/chart-of-accounts/${id}/activate`, undefined, {
    headers: companyId ? { 'X-Company-Id': companyId } : undefined,
  })
  return data
}

export const deactivateAccount = async (id, companyId) => {
  const { data } = await API.patch(`/api/account/chart-of-accounts/${id}/deactivate`, undefined, {
    headers: companyId ? { 'X-Company-Id': companyId } : undefined,
  })
  return data
}
