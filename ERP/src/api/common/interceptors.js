/**
 * @fileoverview Axios request and response interceptors.
 *
 * Request interceptor:
 *   - Attaches companyId / companyCode from localStorage to every request.
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
import { detectModule, getRefreshEndpoint, isRefreshEndpoint } from './moduleRegistry';
import { isModuleRefreshing, setRefreshing, enqueue, processQueue } from './refreshQueue';
import { dispatchLogout, isAuthPage } from './logout';

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to determine if the user is a System Admin
 */
const isUserSystemAdmin = () => {
  let isSystemAdmin = false;
  if (typeof window !== 'undefined') {
    try {
      const persistedRoot = JSON.parse(localStorage.getItem('persist:root'));
      if (persistedRoot) {
        const authState = persistedRoot.auth ? JSON.parse(persistedRoot.auth) : null;
        const user = authState?.user;
        if (user) {
          const rawRole = user.role || '';
          const stripped = String(rawRole).toLowerCase().replace(/[\s_]/g, '');
          isSystemAdmin = stripped === 'superadmin' || stripped === 'systemadmin';
        }
      }
    } catch (e) { }

    if (!isSystemAdmin) {
      try {
        const authUser = JSON.parse(localStorage.getItem('auth_user'));
        if (authUser) {
          const rawRole = Array.isArray(authUser.roles)
            ? (authUser.roles[0]?.name || authUser.roles[0] || '')
            : (authUser.role || '');
          const stripped = String(rawRole).toLowerCase().replace(/[\s_]/g, '');
          isSystemAdmin =
            authUser.loginType === 'ADMIN' ||
            stripped === 'superadmin' ||
            stripped === 'systemadmin' ||
            String(rawRole).toUpperCase().includes('SYSTEM_ADMIN');
        }
      } catch (e) { }
    }
  }
  return isSystemAdmin;
};

export const attachRequestInterceptor = (instance) => {
  return instance.interceptors.request.use(
    (config) => {
      try {
        // Clean up any legacy companyCode params from all requests to prevent backend confusion
        if (config.params && config.params.companyCode) {
          delete config.params.companyCode;
        }

        // Let Axios and the browser handle multipart/form-data boundary automatically
        if (config.data instanceof FormData) {
          if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
          }
        }

        console.log(
          `[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
          config.data || config.params || '(no data)',
        );
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
      console.log(
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
        const store = require('../../app/store').default;
        const state = store.getState();
        const isMeProbe = requestUrl.includes('/me');

        if (
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
          await enqueue(moduleName);
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

      const isSystemAdmin = isUserSystemAdmin();
      let refreshEndpoint = getRefreshEndpoint(moduleName);
      let requestBody = {};
      let refreshToken = null;

      if (isSystemAdmin && typeof document !== 'undefined') {
        const match = document.cookie.match(/(^| )ACCESS_TOKEN_REFRESH=([^;]+)/);
        if (match) refreshToken = match[2];
      }

      if (isSystemAdmin && refreshToken) {
        refreshEndpoint = '/api/sso/admin/token/refresh';
        requestBody = { data: { refreshToken } };
      }

      try {
        // Use raw axios (NOT apiClient) to avoid interceptor recursion.
        // withCredentials: true lets the browser send the HttpOnly refresh cookie.
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

        if (isSystemAdmin && refreshResponse.data?.data) {
          const { access_token, refresh_token } = refreshResponse.data.data;
          if (access_token) {
            document.cookie = `ACCESS_TOKEN=${access_token}; path=/; max-age=86400; SameSite=Lax`;
          }
          if (refresh_token) {
            document.cookie = `ACCESS_TOKEN_REFRESH=${refresh_token}; path=/; max-age=604800; SameSite=Lax`;
          }
        }

        console.log(`[Auth] Token refreshed successfully for module "${moduleName}".`);

        // Resolve all queued requests for this module
        processQueue(moduleName, null);

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
          if (typeof window !== 'undefined') {
            window.location.href = '/mdoles';
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
