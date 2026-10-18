/**
 * @fileoverview Type definitions for the multi-module auth refresh system.
 * Uses JSDoc for IntelliSense support without requiring TypeScript.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Module Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for a single backend module.
 * @typedef {Object} ModuleConfig
 * @property {string} name - Module identifier (e.g., 'account', 'hr', 'inventory').
 * @property {string} pathPrefix - URL path prefix used to detect this module (e.g., '/api/account').
 * @property {string} refreshEndpoint - Full path to the module's token refresh endpoint.
 */

/**
 * Options for registering a new module.
 * @typedef {Object} RegisterModuleOptions
 * @property {string} [refreshEndpoint] - Custom refresh endpoint. Defaults to `/api/{name}/auth/refresh`.
 * @property {string} [pathPrefix] - Custom path prefix. Defaults to `/api/{name}`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Queue
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A pending request waiting for a token refresh to complete.
 * @typedef {Object} QueuedRequest
 * @property {function(): void} resolve - Resolves the queued request's promise (refresh succeeded).
 * @property {function(Error): void} reject - Rejects the queued request's promise (refresh failed).
 */

/**
 * Per-module refresh state.
 * @typedef {Object} RefreshState
 * @property {boolean} isRefreshing - Whether a refresh request is currently in-flight for this module.
 * @property {QueuedRequest[]} queue - Pending requests waiting for the refresh to complete.
 */

// ─────────────────────────────────────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Axios instance configuration options.
 * @typedef {Object} ApiClientConfig
 * @property {string} [baseURL=''] - Base URL for all requests.
 * @property {boolean} [withCredentials=true] - Whether to send cookies with cross-origin requests.
 * @property {number} [timeout=60000] - Request timeout in milliseconds.
 * @property {Object<string, string>} [headers] - Default request headers.
 */

/**
 * Interceptor attachment result.
 * @typedef {Object} InterceptorIds
 * @property {number} requestInterceptorId - ID of the attached request interceptor.
 * @property {number} responseInterceptorId - ID of the attached response interceptor.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for the logout handler.
 * @typedef {Object} LogoutOptions
 * @property {string} [redirectTo='/erp/'] - URL to redirect to after logout.
 * @property {boolean} [clearQueues=true] - Whether to clear all module refresh queues.
 * @property {boolean} [dispatchAction=true] - Whether to dispatch the Redux logout action.
 */

export {};
