import axios from 'axios'
import { removeCookie } from '../utils/cookieHelper'
import store from '../app/store'
import { addAlert } from '../features/notifications/notificationSlice'
import { attachInterceptors } from '../api/common/interceptors'

// Normalize: if VITE_API_BASE_URL is '/api' or ends with '/api', strip trailing '/api' because endpoints in the codebase already include '/api' prefix (e.g. '/api/companies', '/api/sso')
const rawBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';
const BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach robust modular interceptors (handles 401 refresh queue, 502 retries, company headers)
attachInterceptors(API)

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
 const { data } = await API.get('/api/companies', { params })
 return data
}

/**
 * Fetch a single company by UUID
 */
export const getCompanyById = async (id) => {
 const { data } = await API.get(`/api/companies/${id}`)
 return data
}

/**
 * Fetch finance dashboard for a company
 */
export const getFinanceDashboard = async (companyId) => {
 const { data } = await API.get('/api/dashboard/finance', {
 params: { companyId },
 })
 return data
}

export default API
