/**
 * @fileoverview Module registry for multi-module auth refresh.
 *
 * Detects which backend module a request belongs to from its URL and provides
 * the corresponding refresh endpoint. New modules following the convention
 * `/api/{name}/auth/refresh` work automatically — no code changes needed.
 *
 * @see {import('./types').ModuleConfig}
 */

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Known module configurations.
 * Key = module name, Value = ModuleConfig.
 * @type {Map<string, import('./types').ModuleConfig>}
 */
const registry = new Map();

/**
 * Builds a default ModuleConfig from a module name.
 * All ERP modules share SSO authentication and refresh via /api/sso/token/refresh.
 * @param {string} name
 * @returns {import('./types').ModuleConfig}
 */
const buildDefaultConfig = (name) => ({
  name,
  pathPrefix: `/api/${name}`,
  refreshEndpoint: '/api/sso/token/refresh',
});

// Pre-register known modules
const KNOWN_MODULES = [
  'account',
  'communication',
  'finance',
  'inventory',
  'hr',
  'purchase',
  'sales-crm',
  'sso',
  'workflow',
];

KNOWN_MODULES.forEach((name) => {
  registry.set(name, {
    name,
    pathPrefix: name === 'workflow' ? '/api/v1/workflow' : `/api/${name}`,
    refreshEndpoint: '/api/sso/token/refresh',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect the module name from a request URL.
 *
 * Extracts the first path segment after `/api/` (accounting for optional `/v1/`, etc.)
 * and matches it against the registry. If the module is not pre-registered, it is
 * auto-registered with default conventions so the system scales without code changes.
 *
 * @param {string} url - The request URL (absolute or relative).
 * @returns {string} Module name, or 'sso' as fallback if the URL doesn't match `/api/{module}/...`.
 *
 * @example
 * detectModule('/api/inventory/stocks/company/abc')  // → 'inventory'
 * detectModule('http://localhost:3001/api/purchase/orders') // → 'purchase'
 */
export const detectModule = (url) => {
  if (!url || typeof url !== 'string') return 'sso';

  let path = url;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      path = parsed.pathname;
    }
  } catch (e) {
    path = url.replace(/^https?:\/\/[^\/]+/, '');
  }

  // Match /api/{module-name}/ or /api/v{N}/{module-name}/ — supports hyphenated names like "sales-crm"
  const match = path.match(/^\/api\/(?:v\d+\/)?([a-zA-Z0-9_-]+)/);
  if (!match) return 'sso';

  const moduleName = match[1].toLowerCase();

  // Auto-register unknown modules so new backends work without frontend changes
  if (!registry.has(moduleName)) {
    registry.set(moduleName, buildDefaultConfig(moduleName));
  }

  return moduleName;
};

/**
 * Get the refresh endpoint for a module.
 *
 * @param {string} moduleName - Module name (e.g., 'account', 'hr').
 * @returns {string} Refresh endpoint path.
 *
 * @example
 * getRefreshEndpoint('inventory')  // → '/api/inventory/auth/refresh'
 */
export const getRefreshEndpoint = (moduleName) => {
  const config = registry.get(moduleName);
  if (config) return config.refreshEndpoint;

  // Fallback: build on the fly for unknown modules
  const defaultConfig = buildDefaultConfig(moduleName);
  registry.set(moduleName, defaultConfig);
  return defaultConfig.refreshEndpoint;
};

/**
 * Register a new module with optional custom configuration.
 * Use this to override the default refresh endpoint convention for a specific module.
 *
 * @param {string} name - Module name.
 * @param {import('./types').RegisterModuleOptions} [options] - Custom options.
 *
 * @example
 * // Module with non-standard refresh path
 * registerModule('legacy', {
 *   refreshEndpoint: '/api/legacy/token/renew',
 * });
 */
export const registerModule = (name, options = {}) => {
  const defaultConfig = buildDefaultConfig(name);
  registry.set(name, {
    ...defaultConfig,
    ...(options.pathPrefix && { pathPrefix: options.pathPrefix }),
    ...(options.refreshEndpoint && { refreshEndpoint: options.refreshEndpoint }),
  });
};

/**
 * Check if a URL is a refresh endpoint (to avoid infinite refresh loops).
 *
 * @param {string} url - The request URL.
 * @returns {boolean} True if the URL is a known refresh endpoint.
 */
export const isRefreshEndpoint = (url) => {
  if (!url) return false;
  if (url.includes('/api/sso/token/refresh') || url.includes('/api/sso/admin/token/refresh')) return true;
  // Check against all registered modules
  for (const config of registry.values()) {
    if (url.includes(config.refreshEndpoint)) return true;
  }
  // Fallback: generic pattern match
  return /\/api\/[a-zA-Z0-9_-]+\/auth\/refresh/.test(url);
};

/**
 * Get all registered module names.
 * @returns {string[]}
 */
export const getRegisteredModules = () => Array.from(registry.keys());
