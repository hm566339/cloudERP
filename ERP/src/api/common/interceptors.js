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
import {
  isModuleRefreshing,
  setRefreshing,
  setModuleRefreshPromise,
  getModuleRefreshPromise,
  enqueue,
  processQueue,
} from './refreshQueue.js';
import { dispatchLogout, isAuthPage } from './logout.js';

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to get the most up-to-date access token from cookies or localStorage
 */
const getFreshAccessToken = () => {
  if (typeof document !== 'undefined') {
    // 1. Check canonical ACCESS_TOKEN cookie first
    const canonicalMatch = document.cookie.match(/(^| )ACCESS_TOKEN=([^;]+)/);
    if (canonicalMatch) {
      // Clean up legacy duplicate cookies so they do not linger
      try {
        if (document.cookie.includes('auth_token=')) {
          document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        if (document.cookie.includes('access_token=')) {
          document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
      } catch (_) {}
      return canonicalMatch[2];
    }
    // 2. Fallback to legacy cookies only if canonical ACCESS_TOKEN is missing
    const fallbackMatch =
      document.cookie.match(/(^| )auth_token=([^;]+)/) ||
      document.cookie.match(/(^| )access_token=([^;]+)/);
    if (fallbackMatch) return fallbackMatch[2];
  }
  if (typeof localStorage !== 'undefined') {
    const canonicalStorage = localStorage.getItem('ACCESS_TOKEN');
    if (canonicalStorage) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      } catch (_) {}
      return canonicalStorage;
    }
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }
  return null;
};

import {
  isOwnerOrSystemAdminUser,
  isOwnerOrSystemAdminRole,
  getActiveCompanyId,
  getActiveOrganizationId,
  isValidCompanyId,
  buildRoleBasedCompanyParams,
  cleanUrlRoleBasedCompany
} from './roleCompanyContext.js';

export {
  isOwnerOrSystemAdminUser,
  isOwnerOrSystemAdminRole,
  getActiveCompanyId,
  getActiveOrganizationId,
  isValidCompanyId,
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
    pathname.startsWith('/api/health/') ||
    pathname.startsWith('/actuator')
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

  // 6. Global Platform CRM Integration Providers (Layer 1 SystemAdmin)
  if (
    pathname.startsWith('/api/crm/integrations/providers') ||
    pathname.startsWith('/api/admin/integrations/providers') ||
    pathname.startsWith('/api/admin/integrations') ||
    pathname.startsWith('/api/admin/providers')
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
  if (instance._requestInterceptorAttached) return null;
  instance._requestInterceptorAttached = true;

  return instance.interceptors.request.use(
    (config) => {
      try {
        config._startTime = Date.now();

        // Parameter Sanitizer: drop non-primitive values (functions, undefined, NaN)
        if (config.params && typeof config.params === 'object') {
          if (typeof URLSearchParams !== 'undefined' && config.params instanceof URLSearchParams) {
            const cleanParams = new URLSearchParams();
            for (const [key, val] of config.params.entries()) {
              if (typeof val === 'function') {
                console.warn(`[API PARAM GUARD] Dropping function parameter '${key}':`, val);
                continue;
              }
              if (val === 'undefined' || val === 'null' || val === undefined || val === null || val === '') {
                continue;
              }
              cleanParams.append(key, val);
            }
            config.params = cleanParams;
          } else {
            Object.keys(config.params).forEach((key) => {
              const val = config.params[key];
              if (typeof val === 'function') {
                console.warn(`[API PARAM GUARD] Dropping function parameter '${key}':`, val);
                delete config.params[key];
              } else if (val === undefined || Number.isNaN(val) || val === 'undefined' || val === 'null') {
                delete config.params[key];
              } else if (typeof val === 'string' && val.endsWith(',undefined')) {
                config.params[key] = val.replace(',undefined', ',asc');
              }
            });
          }
        }

        // Clean query parameters directly on config.url if present
        if (config.url && typeof config.url === 'string' && config.url.includes('?')) {
          try {
            const [base, query] = config.url.split('?');
            const searchParams = new URLSearchParams(query);
            let modified = false;
            for (const [key, val] of Array.from(searchParams.entries())) {
              if (typeof val === 'string' && (val.includes('[native code]') || val.includes('function '))) {
                console.warn(`[API URL GUARD] Dropping function value in URL query '${key}':`, val);
                searchParams.delete(key);
                modified = true;
              } else if (val === 'undefined' && (key.endsWith('direction') || key.endsWith('sort') || key === 'sort')) {
                searchParams.delete(key);
                modified = true;
              }
            }
            if (modified) {
              const cleanQuery = searchParams.toString();
              config.url = cleanQuery ? `${base}?${cleanQuery}` : base;
            }
          } catch { }
        }

        // Clean up any legacy companyCode params from all requests to prevent backend confusion
        if (config.params) {
          if (typeof URLSearchParams !== 'undefined' && config.params instanceof URLSearchParams) {
            config.params.delete('companyCode');
            const pCompId = config.params.get('companyId');
            if (pCompId && !isValidCompanyId(pCompId)) {
              config.params.delete('companyId');
            }
          } else {
            delete config.params.companyCode;
            if (config.params.companyId !== undefined && !isValidCompanyId(config.params.companyId)) {
              delete config.params.companyId;
            }
          }
        }

        // If this is a global endpoint, ensure companyId is stripped from query params
        if (isGlobalEndpoint(config.url)) {
          if (config.params) {
            if (typeof URLSearchParams !== 'undefined' && config.params instanceof URLSearchParams) {
              config.params.delete('companyId');
              config.params.delete('companyCode');
            } else {
              delete config.params.companyId;
              delete config.params.companyCode;
            }
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
          } else if (isPrivileged && isValidCompanyId(activeCompanyId)) {
            config.params = { companyId: activeCompanyId };
          }

          // 3. Request header injection (X-Company-Id) — for ALL users
          if (isValidCompanyId(activeCompanyId)) {
            if (config.headers && typeof config.headers.set === 'function') {
              config.headers.set('X-Company-Id', activeCompanyId);
            } else {
              if (!config.headers) config.headers = {};
              config.headers['X-Company-Id'] = activeCompanyId;
            }
          } else if (config.headers) {
            if (typeof config.headers.delete === 'function') {
              config.headers.delete('X-Company-Id');
              config.headers.delete('x-company-id');
            } else {
              delete config.headers['X-Company-Id'];
              delete config.headers['x-company-id'];
            }
          }

          // 4. For Owner / SystemAdmin: synchronize path parameters if URL contains /company/:id or /api/settings/:id
          if (isPrivileged && isValidCompanyId(activeCompanyId) && config.url && typeof config.url === 'string') {
            if (config.url.includes('/company/')) {
              config.url = config.url.replace(/\/company\/[^/?#]+/g, `/company/${activeCompanyId}`);
            } else if (
              (config.url.startsWith('/api/settings/') || config.url.includes('/api/settings/')) &&
              !config.url.includes('/api/account/') &&
              !config.url.includes('/api/settings/organization') &&
              !config.url.includes('/api/settings/localization') &&
              !config.url.includes('/api/settings/general')
            ) {
              config.url = config.url.replace(/\/api\/settings\/[^/?#]+/g, `/api/settings/${activeCompanyId}`);
            }
          }
        }

        // Let Axios and the browser handle multipart/form-data boundary automatically
        if (config.data instanceof FormData) {
          if (config.headers) {
            if (typeof config.headers.delete === 'function') {
              config.headers.delete('Content-Type');
              config.headers.delete('content-type');
            } else {
              delete config.headers['Content-Type'];
              delete config.headers['content-type'];
            }
          }
        }

        // Axios merges common defaults into config.headers before interceptors
        // run. Reapply the current stored token so rotated credentials cannot be
        // shadowed by a stale inherited Authorization value.
        const currentAccessToken = getFreshAccessToken();
        if (currentAccessToken) {
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${currentAccessToken}`);
            config.headers.set('authorization', `Bearer ${currentAccessToken}`);
          }
          if (config.headers && typeof config.headers === 'object') {
            config.headers['Authorization'] = `Bearer ${currentAccessToken}`;
            config.headers['authorization'] = `Bearer ${currentAccessToken}`;
          }
        }

        // Keep the organization header aligned with an explicitly requested
        // target organization rather than a potentially stale active selection.
        let requestedOrganizationId = config.params?.organizationId
          ? String(config.params.organizationId).trim()
          : null;
        if (!requestedOrganizationId && config.url?.includes('organizationId=')) {
          try {
            requestedOrganizationId = new URL(config.url, 'http://localhost')
              .searchParams.get('organizationId')?.trim() || null;
          } catch (e) { }
        }
        const isOrganizationScopedRequest = config.url?.includes('/organization')
          || config.url?.includes('/role-templates')
          || Boolean(requestedOrganizationId);
        const organizationId = isOrganizationScopedRequest
          ? (requestedOrganizationId || getActiveOrganizationId())
          : null;
        if (organizationId) {
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('X-Organization-Id', organizationId);
          } else {
            if (!config.headers) config.headers = {};
            config.headers['X-Organization-Id'] = organizationId;
          }
        }

        // Attach organizationId query parameter for organization-level APIs if not already set
        if (config.url?.includes('/role-templates') || config.url?.includes('/organization')) {
          const activeOrgId = requestedOrganizationId || getActiveOrganizationId();
          if (activeOrgId) {
            config.params = config.params || {};
            if (!config.params.organizationId) {
              config.params.organizationId = activeOrgId;
            }
          }
        }

        // Request logging omitted in production; no sensitive payload or credentials printed
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
  if (instance._responseInterceptorAttached) return null;
  instance._responseInterceptorAttached = true;

  return instance.interceptors.response.use(
    // ── Success handler ──────────────────────────────────────────────────
    (response) => {
      return response;
    },

    // ── Error handler ────────────────────────────────────────────────────
    async (error) => {
      const originalRequest = error.config;
      const duration = originalRequest?._startTime ? ` [${Date.now() - originalRequest._startTime}ms]` : '';

      // Log the error with method, URL and elapsed duration
      if (error.response) {
        console.error(
          `[API RESPONSE ERROR] ${error.response.config.method?.toUpperCase()} ${error.response.config.url}${duration} -> ${error.response.status}`,
          error.response.data,
        );
      } else {
        const method = originalRequest?.method?.toUpperCase() || '';
        const url = originalRequest?.url || '';
        console.error(`[API RESPONSE ERROR] ${method} ${url}${duration} Network/Unknown Error:`, error.message);
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

      // If we are already on an auth page and have no access or refresh tokens, skip refresh
      if (typeof window !== 'undefined' && isAuthPage(window.location.pathname)) {
        const hasAccessToken = getFreshAccessToken();
        const hasRefreshCookie = typeof document !== 'undefined' && document.cookie.match(/(^| )(ACCESS_TOKEN_REFRESH|refresh_token|refreshToken)=([^;]+)/);
        const hasRefreshStorage = typeof localStorage !== 'undefined' && (localStorage.getItem('ACCESS_TOKEN_REFRESH') || localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token'));
        if (!hasAccessToken && !hasRefreshCookie && !hasRefreshStorage) {
          return Promise.reject(error);
        }
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
      const moduleName = detectModule(requestUrl) || 'sso';

      // If the REFRESH endpoint itself returned 401, token is irrecoverably expired — logout
      if (originalRequest?._isRefreshRequest || isRefreshEndpoint(requestUrl)) {
        console.error(`[Auth] Refresh endpoint returned 401 for module "${moduleName}" — logging out.`);
        dispatchLogout();
        return Promise.reject(error);
      }

      // Only platform super/system admin (loginType === 'ADMIN') uses /admin/token/refresh.
      // Organization owners and regular members use the canonical SSO /api/sso/token/refresh.
      const isPlatformSuperAdmin = () => {
        try {
          if (typeof window !== 'undefined' && window.__REDUX_STORE__?.getState) {
            const state = window.__REDUX_STORE__.getState();
            const user = state.auth?.user;
            if (user?.loginType === 'ADMIN') return true;
            const role = String(user?.role || '').toLowerCase().replace(/[\s_]/g, '');
            if (role === 'superadmin' || role === 'systemadmin' || role === 'rolesuperadmin' || role === 'rolesystemadmin') {
              return true;
            }
          }
        } catch (e) { }

        if (typeof localStorage !== 'undefined') {
          try {
            const userStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
            if (userStr) {
              const u = JSON.parse(userStr);
              if (u?.loginType === 'ADMIN') return true;
              const role = String(u?.role || '').toLowerCase().replace(/[\s_]/g, '');
              if (role === 'superadmin' || role === 'systemadmin') return true;
            }
          } catch (e) { }
        }
        return false;
      };

      const isSystemAdmin = isPlatformSuperAdmin();
      const refreshEndpoint = isSystemAdmin
        ? '/api/sso/admin/token/refresh'
        : (getRefreshEndpoint(moduleName) || '/api/sso/token/refresh');
      // Deduplicate concurrent 401s across all SSO-backed modules onto one shared single-flight key
      const refreshKey = refreshEndpoint === '/api/sso/token/refresh'
        ? 'sso'
        : refreshEndpoint === '/api/sso/admin/token/refresh'
          ? 'sso_admin'
          : moduleName;

      const applyAuthHeaderToConfig = (reqConfig, freshToken) => {
        if (!reqConfig?.headers) return;
        if (freshToken) {
          if (typeof reqConfig.headers.set === 'function') {
            reqConfig.headers.set('Authorization', `Bearer ${freshToken}`);
            reqConfig.headers.set('authorization', `Bearer ${freshToken}`);
          }
          if (typeof reqConfig.headers === 'object') {
            reqConfig.headers['Authorization'] = `Bearer ${freshToken}`;
            reqConfig.headers['authorization'] = `Bearer ${freshToken}`;
          }
        } else if (refreshEndpoint.includes('/admin/')) {
          if (typeof reqConfig.headers.delete === 'function') {
            reqConfig.headers.delete('Authorization');
            reqConfig.headers.delete('authorization');
          }
          if (typeof reqConfig.headers === 'object') {
            delete reqConfig.headers['Authorization'];
            delete reqConfig.headers['authorization'];
          }
        }
      };

      // ── Refresh queue logic ────────────────────────────────────────────

      // If a refresh is already in-flight for this refresh endpoint, queue this request
      if (isModuleRefreshing(refreshKey)) {
        originalRequest._retry = true;
        try {
          const freshToken = await enqueue(refreshKey);
          applyAuthHeaderToConfig(originalRequest, freshToken);
          // Refresh succeeded — retry the original request
          return instance(originalRequest);
        } catch (queueError) {
          // Refresh failed — reject this request too
          return Promise.reject(queueError);
        }
      }

      // No refresh in progress — initiate single-flight refresh
      originalRequest._retry = true;

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
        requestBody = {
          refreshToken,
          data: { refreshToken },
        };
      }

      const performRefresh = async () => {
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
            _isRefreshRequest: true,
          },
        );

        let newAccessToken = null;
        let newRefreshToken = null;

        if (refreshResponse.data?.data) {
          const data = refreshResponse.data.data;
          newAccessToken = data.access_token || data.accessToken;
          newRefreshToken = data.refresh_token || data.refreshToken;
        } else if (refreshResponse.data) {
          const data = refreshResponse.data;
          newAccessToken = data.access_token || data.accessToken;
          newRefreshToken = data.refresh_token || data.refreshToken;
        }

        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const secureAttr = isHttps ? '; Secure' : '';

        if (typeof document !== 'undefined') {
          if (newAccessToken) {
            document.cookie = `ACCESS_TOKEN=${newAccessToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
            // Clean up legacy cookies
            document.cookie = `auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
            document.cookie = `access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
            if (typeof window !== 'undefined' && window.location.hostname) {
              document.cookie = `auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; SameSite=Lax`;
              document.cookie = `access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; SameSite=Lax`;
            }
          }
          if (newRefreshToken) {
            document.cookie = `ACCESS_TOKEN_REFRESH=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
          }
        }

        if (typeof localStorage !== 'undefined') {
          if (newAccessToken) {
            localStorage.setItem('ACCESS_TOKEN', newAccessToken);
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('access_token');
            } catch (_) {}
          }
          if (newRefreshToken) {
            localStorage.setItem('ACCESS_TOKEN_REFRESH', newRefreshToken);
          } else {
            // Do not leave a pre-rotation refresh token in localStorage when the backend
            // relies on an HttpOnly refresh cookie; otherwise future refreshes may replay it.
            try {
              localStorage.removeItem('ACCESS_TOKEN_REFRESH');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('refresh_token');
            } catch (_) {}
          }
        }

        if (!newAccessToken && !refreshEndpoint.includes('/admin/')) {
          throw new Error('Refresh response did not include a new access token');
        }

        return newAccessToken || null;
      };

      const refreshPromise = performRefresh();
      setModuleRefreshPromise(refreshKey, refreshPromise);

      try {
        const freshToken = await refreshPromise;

        // Atomically update default common headers first so any newly triggered request inherits the fresh token
        if (instance.defaults?.headers?.common) {
          if (freshToken) {
            instance.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;
            instance.defaults.headers.common['authorization'] = `Bearer ${freshToken}`;
          } else if (refreshEndpoint.includes('/admin/')) {
            delete instance.defaults.headers.common['Authorization'];
            delete instance.defaults.headers.common['authorization'];
          }
        }

        // Release refreshing lock and drain all queued requests IMMEDIATELY with the fresh token
        setRefreshing(refreshKey, false);
        processQueue(refreshKey, null, freshToken);

        applyAuthHeaderToConfig(originalRequest, freshToken);

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        setRefreshing(refreshKey, false);
        processQueue(refreshKey, refreshError);

        console.error(
          `[Auth] Token refresh failed for module "${moduleName}" (key="${refreshKey}"):`,
          refreshError?.response?.status || refreshError.message,
        );

        const status = refreshError?.response?.status;

        // Server error (5xx) or network offline / timeout during refresh: NOT a confirmed session expiry.
        // DO NOT delete cookies, DO NOT call logout, DO NOT clear Redux.
        if (!status || status >= 500) {
          return Promise.reject(refreshError);
        }

        // 401, 403 or genuine client rejection -> session is expired or revoked.
        dispatchLogout();
        return Promise.reject(refreshError);
      } finally {
        setRefreshing(refreshKey, false);
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
