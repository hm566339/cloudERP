/**
 * @fileoverview Axios request and response interceptors.
 *
 * Request interceptor:
 *   - For OWNER / SystemAdmin: attaches companyId query param to company-specific APIs.
 *   - For all other roles: does NOT attach companyId query param (backend uses JWT session).
 *   - Attaches X-Company-Id header for all users (gateway tenant validation).
 *   - Logs outgoing requests in development.
 *
 * Response interceptor:
 *   - Retries 502-504 gateway errors up to 2 times with linear backoff.
 *   - On 401: detects the module, triggers a per-module refresh, queues concurrent
 *     requests, and retries them all after a successful refresh.
 *   - On refresh failure: dispatches logout and rejects all queued requests.
 *
 * IMPORTANT: The refresh call uses a raw `axios.post()` — NOT `apiClient` — to
 * avoid triggering the interceptors recursively.
 */

import axios from 'axios';
import { detectModule, getRefreshEndpoint, isRefreshEndpoint } from './moduleRegistry.js';
import { isModuleRefreshing, setRefreshing, enqueue, processQueue } from './refreshQueue.js';
import { dispatchLogout, isAuthPage } from './logout.js';

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to get the most up-to-date access token from cookies or localStorage
 */
const getFreshAccessToken = () => {
  if (typeof document !== 'undefined') {
    const match =
      document.cookie.match(/(^| )ACCESS_TOKEN=([^;]+)/) ||
      document.cookie.match(/(^| )auth_token=([^;]+)/) ||
      document.cookie.match(/(^| )access_token=([^;]+)/);
    if (match) return match[2];
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('auth_token') || localStorage.getItem('token');
  }
  return null;
};

import {
  isOwnerOrSystemAdminUser,
  isOwnerOrSystemAdminRole,
  getActiveCompanyId,
  buildRoleBasedCompanyParams,
  cleanUrlRoleBasedCompany
} from './roleCompanyContext.js';

export {
  isOwnerOrSystemAdminUser,
  isOwnerOrSystemAdminRole,
  getActiveCompanyId,
  buildRoleBasedCompanyParams,
  cleanUrlRoleBasedCompany
};

export const isOwnerOrAdminUser = isOwnerOrSystemAdminUser;

/**
 * Determines whether a given pathname is a truly global/system endpoint.
 * Global endpoints must NEVER have companyId attached.
 */
export const isGlobalEndpoint = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return true;

  // 1. Authentication, Sessions & SSO microservice (/api/sso/*)
  if (
    pathname.startsWith('/api/sso/') ||
    pathname === '/api/sso' ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('/auth/') ||
    pathname.startsWith('/api/legacy/token/')
  ) {
    return true;
  }

  // 2. Platform Administration & Health
  if (
    pathname.startsWith('/api/sso/platform') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/health/')
  ) {
    return true;
  }

  // 3. Subscriptions & Billing
  if (
    pathname.startsWith('/api/sso/subscription-plans') ||
    pathname.startsWith('/api/sso/company-subscriptions') ||
    pathname.startsWith('/api/sso/subscriptions') ||
    pathname.startsWith('/api/subscription') ||
    pathname.startsWith('/api/billing') ||
    pathname.startsWith('/api/sso/billing')
  ) {
    return true;
  }

  // 4. System-level Feature & Route Catalog
  if (
    pathname.startsWith('/api/sso/features') ||
    pathname.startsWith('/api/sso/module') ||
    pathname.startsWith('/api/sso/module-routes') ||
    pathname.startsWith('/api/sso/company-modules') ||
    pathname.startsWith('/api/sso/permissions') ||
    pathname.startsWith('/api/sso/role')
  ) {
    return true;
  }

  // 5. Multi-Tenant Organization & Global Company Management / Selection
  if (
    pathname === '/api/companies' ||
    pathname.startsWith('/api/companies/') ||
    pathname === '/api/account/companies' ||
    pathname.startsWith('/api/account/companies/') ||
    pathname === '/api/sso/company' ||
    pathname.startsWith('/api/sso/company/') ||
    pathname.startsWith('/api/sso/organization') ||
    pathname.startsWith('/api/organization')
  ) {
    return true;
  }

  return false;
};

/**
 * Determines whether an endpoint URL is company-scoped across the ENTIRE ERP.
 * Matches all business modules (account, inventory, sales, crm, purchase, hr, workflows, etc.)
 * and any non-global /api/ endpoint.
 */
export const isCompanySpecificEndpoint = (url) => {
  if (!url || typeof url !== 'string') return false;
  let path = url;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      path = parsed.pathname;
    }
  } catch (e) { }

  const cleanUrl = path.split('?')[0].split('#')[0];
  const pathname = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;

  // If it's a known global/system endpoint, it is NOT company-specific
  if (isGlobalEndpoint(pathname)) {
    return false;
  }

  // Explicit known business module prefixes across the entire ERP
  const businessModulePrefixes = [
    '/api/account',
    '/api/finance',
    '/api/inventory',
    '/api/purchase',
    '/api/sales',
    '/api/sales-crm',
    '/api/crm',
    '/api/leads',
    '/api/hr',
    '/api/payroll',
    '/api/workflows',
    '/api/workflow',
    '/api/v1/workflow',
    '/api/dashboard',
    '/api/reports',
    '/api/fleet',
    '/api/manufacturing',
    '/api/boms',
    '/api/expenses',
    '/api/gst',
    '/api/settings',
    // Relative endpoints (without leading /api)
    '/account',
    '/finance',
    '/inventory',
    '/purchase',
    '/sales',
    '/crm',
    '/leads',
    '/hr',
    '/payroll',
    '/workflows',
    '/dashboard',
    '/reports'
  ];

  if (businessModulePrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Centralized fallback: any endpoint under /api/ that is not an excluded global endpoint
  // is company-scoped business data in this multi-tenant ERP.
  if (pathname.startsWith('/api/')) {
    return true;
  }

  return false;
};

export const attachRequestInterceptor = (instance) => {
  return instance.interceptors.request.use(
    (config) => {
      try {
        // Clean up any legacy companyCode params from all requests to prevent backend confusion
        if (config.params) {
          if (typeof URLSearchParams !== 'undefined' && config.params instanceof URLSearchParams) {
            config.params.delete('companyCode');
          } else {
            delete config.params.companyCode;
          }
        }

        // Global ERP Company Data Isolation:
        // Automatically attach selected companyId to all company-specific APIs across all modules.
        //
        // ROLE-BASED RULE:
        //   - OWNER / SystemAdmin: Include companyId query param (they operate across companies).
        //   - All other roles (ACCOUNTANT, MEMBER, etc.): Do NOT include companyId query param.
        //     The backend resolves their company from the JWT session via TenantUtils.
        //   - X-Company-Id header is always sent for gateway-level tenant isolation.
        if (isCompanySpecificEndpoint(config.url)) {
          const isPrivileged = isOwnerOrSystemAdminUser();
          const activeCompanyId = getActiveCompanyId();

          // 1. Clean query parameter from config.url itself if present
          if (config.url && typeof config.url === 'string' && config.url.includes('?')) {
            config.url = cleanUrlRoleBasedCompany(config.url, isPrivileged, activeCompanyId);
          }

          // 2. Query parameter injection / stripping on config.params
          if (config.params) {
            config.params = buildRoleBasedCompanyParams(config.params, {
              isPrivileged,
              companyId: activeCompanyId,
            });
          } else if (isPrivileged && activeCompanyId) {
            config.params = { companyId: activeCompanyId };
          }

          // 3. Request header injection (X-Company-Id) — for ALL users
          if (activeCompanyId) {
            if (!config.headers) config.headers = {};
            config.headers['X-Company-Id'] = activeCompanyId;
          }

          // 4. For Owner / SystemAdmin: synchronize path parameters if URL contains /company/:id or /settings/:id
          if (isPrivileged && activeCompanyId && config.url && typeof config.url === 'string') {
            if (config.url.includes('/company/')) {
              config.url = config.url.replace(/\/company\/[^/?#]+/g, `/company/${activeCompanyId}`);
            } else if (config.url.startsWith('/api/settings/') || config.url.includes('/settings/')) {
              config.url = config.url.replace(/\/settings\/[^/?#]+/g, `/settings/${activeCompanyId}`);
            }
          }
        }

        // Let Axios and the browser handle multipart/form-data boundary automatically
        if (config.data instanceof FormData) {
          if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
          }
        }

        // Attach Authorization header from cookie/storage if not already explicitly present
        if (config.headers && !config.headers['Authorization'] && !config.headers['authorization']) {
          const token = getFreshAccessToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }

        if (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) {
          console.log(
            `[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
            config.data || config.params || '(no data)',
          );
        }
      } catch (e) {
        console.warn('[API REQUEST ERROR] Failed processing request config', e);
      }
      return config;
    },
    (error) => {
      console.error('[API REQUEST ERROR]', error);
      return Promise.reject(error);
    },
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach the response interceptor to an Axios instance.
 * Handles gateway retries, per-module 401 refresh, and logout.
 *
 * @param {import('axios').AxiosInstance} instance
 * @returns {number} Interceptor ID (for potential ejection).
 */
export const attachResponseInterceptor = (instance) => {
  return instance.interceptors.response.use(
    // ── Success handler ──────────────────────────────────────────────────
    (response) => {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) console.log(
        `[API RESPONSE] ${response.config.method.toUpperCase()} ${response.config.url} -> ${response.status}`,
        response.data,
      );
      return response;
    },

    // ── Error handler ────────────────────────────────────────────────────
    async (error) => {
      const originalRequest = error.config;

      // Log the error
      if (error.response) {
        console.error(
          `[API RESPONSE ERROR] ${error.response.config.method.toUpperCase()} ${error.response.config.url} -> ${error.response.status}`,
          error.response.data,
        );
      } else {
        console.error('[API RESPONSE ERROR] Network/Unknown Error:', error.message);
      }

      // ── Gateway retries (502-504) ──────────────────────────────────────
      if (
        originalRequest &&
        error.response?.status >= 502 &&
        error.response?.status <= 504
      ) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        if (originalRequest._retryCount <= 2) {
          const delay = originalRequest._retryCount * 1000;
          console.warn(
            `[API] ${error.response.status} error, retrying in ${delay}ms (${originalRequest._retryCount}/2)...`,
          );
          return new Promise((resolve) => {
            setTimeout(() => resolve(instance(originalRequest)), delay);
          });
        }
      }

      // ── Non-401 errors (including 403 Forbidden): pass through ──────
      // 403 means "you don't have permission" — NOT "your token expired".
      // Only 401 should trigger token refresh.
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // ── 401/403 handling starts here ──────────────────────────────────

      // Prevent infinite retry loops
      if (originalRequest._retry) {
        console.error('[Auth] Retry loop detected. Tokens are irrecoverably expired.');
        dispatchLogout();
        return Promise.reject(error);
      }

      // Skip refresh if the failed request was an explicit login, register, or password reset attempt
      const requestUrl = originalRequest?.url || '';
      const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register') || requestUrl.includes('/verify-email') || requestUrl.includes('/reset-password') || requestUrl.includes('/forgot-password') || requestUrl.includes('/signup');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Skip refresh if the user is already known to be unauthenticated,
      // EXCEPT when the request is a '/me' probe. We want '/me' to attempt a refresh
      // so the user can be automatically logged back in if they have a valid refresh cookie.
      try {
        const store = typeof window !== 'undefined' ? window.__REDUX_STORE__ : null;
        const state = store?.getState?.();
        const isMeProbe = requestUrl.includes('/me');

        if (
          state &&
          !isMeProbe &&
          (state.auth?.sessionStatus === 'unauthenticated' || !state.auth?.user)
        ) {
          return Promise.reject(error);
        }
      } catch (e) {
        // Store not available — continue with refresh attempt
      }

      // Detect which module this request belongs to
      const moduleName = detectModule(requestUrl);

      // If we can't detect a module, we can't refresh — logout
      if (!moduleName) {
        console.error('[Auth] Cannot detect module from URL:', requestUrl);
        dispatchLogout();
        return Promise.reject(error);
      }

      // If the REFRESH endpoint itself returned 401, token is irrecoverably expired — logout
      if (isRefreshEndpoint(requestUrl)) {
        console.error(`[Auth] Refresh endpoint returned 401 for module "${moduleName}" — logging out.`);
        dispatchLogout();
        return Promise.reject(error);
      }

      // ── Refresh queue logic ────────────────────────────────────────────

      // If a refresh is already in-flight for this module, queue this request
      if (isModuleRefreshing(moduleName)) {
        try {
          const newToken = await enqueue(moduleName);
          const freshToken = newToken || getFreshAccessToken();
          if (freshToken && originalRequest?.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
          }
          // Refresh succeeded — retry the original request
          return instance(originalRequest);
        } catch (queueError) {
          // Refresh failed — reject this request too
          return Promise.reject(queueError);
        }
      }

      // No refresh in progress — initiate one
      setRefreshing(moduleName, true);
      originalRequest._retry = true;

      const isSystemAdmin = isOwnerOrSystemAdminUser();
      let refreshEndpoint = isSystemAdmin
        ? '/api/sso/admin/token/refresh'
        : getRefreshEndpoint(moduleName);
      let requestBody = {};
      let refreshToken = null;

      // Extract refresh token from cookies first
      if (typeof document !== 'undefined') {
        const match =
          document.cookie.match(/(^| )ACCESS_TOKEN_REFRESH=([^;]+)/) ||
          document.cookie.match(/(^| )refresh_token=([^;]+)/) ||
          document.cookie.match(/(^| )refreshToken=([^;]+)/);
        if (match) refreshToken = match[2];
      }

      // Fallback to localStorage
      if (!refreshToken && typeof localStorage !== 'undefined') {
        refreshToken =
          localStorage.getItem('ACCESS_TOKEN_REFRESH') ||
          localStorage.getItem('refreshToken') ||
          localStorage.getItem('refresh_token');
      }

      if (refreshToken) {
        requestBody = { data: { refreshToken } };
      }

      try {
        // Use raw axios (NOT apiClient) to avoid interceptor recursion.
        // withCredentials: true lets the browser send the refresh cookie.
        const refreshResponse = await axios.post(
          refreshEndpoint,
          requestBody,
          {
            baseURL: instance.defaults.baseURL,
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          },
        );

        let newAccessToken = null;
        let newRefreshToken = null;

        if (refreshResponse.data?.data) {
          const data = refreshResponse.data.data;
          newAccessToken = data.access_token || data.accessToken;
          newRefreshToken = data.refresh_token || data.refreshToken;
        }

        if (typeof document !== 'undefined') {
          if (newAccessToken) {
            document.cookie = `ACCESS_TOKEN=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `auth_token=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
          }
          if (newRefreshToken) {
            document.cookie = `ACCESS_TOKEN_REFRESH=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
          }
        }

        const freshToken = newAccessToken || getFreshAccessToken();
        if (freshToken && originalRequest?.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
        }

        if (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) console.log(`[Auth] Token refreshed successfully for module "${moduleName}".`);

        // Resolve all queued requests for this module with the new token
        processQueue(moduleName, null, freshToken);

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        console.error(
          `[Auth] Token refresh failed for module "${moduleName}":`,
          refreshError?.response?.status || refreshError.message,
        );

        const status = refreshError?.response?.status;

        // 500 or 502 -> Server error during refresh, NOT a session expiry.
        // DO NOT delete cookies, DO NOT call logout, DO NOT clear Redux.
        if (status === 500 || status === 502) {
          processQueue(moduleName, refreshError);
          // Server error during refresh — preserve current path and redirect to login
          if (typeof window !== 'undefined' && !isAuthPage(window.location.pathname)) {
            sessionStorage.setItem('auth_return_to', window.location.pathname + window.location.search + window.location.hash);
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }

        // 401, 403 or other -> genuine refresh failure (session expired).
        // Reject all queued requests for this module
        processQueue(moduleName, refreshError);

        // Logout
        dispatchLogout();

        return Promise.reject(refreshError);
      } finally {
        setRefreshing(moduleName, false);
      }
    },
  );
};

/**
 * Attach both request and response interceptors to an Axios instance.
 *
 * @param {import('axios').AxiosInstance} instance
 * @returns {import('./types').InterceptorIds}
 */
export const attachInterceptors = (instance) => {
  const requestInterceptorId = attachRequestInterceptor(instance);
  const responseInterceptorId = attachResponseInterceptor(instance);
  return { requestInterceptorId, responseInterceptorId };
};
