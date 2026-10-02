import apiClient from '../common/client';

// ──────────────────────────────────────────────────────────────────────────────
// SSO Auth Controller (/api/sso/auth/*)
// ──────────────────────────────────────────────────────────────────────────────

/** POST /api/sso/auth/login */
export const login = async (data) => {
  const response = await apiClient.post('/api/sso/auth/login', { data });
  return response.data;
};

/** POST /api/sso/auth/admin-login */
export const adminLogin = async (data) => {
  const response = await apiClient.post('/api/sso/auth/admin-login', { data });
  return response.data;
};

/** POST /api/sso/auth/logout (Authorization header attached by interceptor) */
export const logout = async () => {
  const response = await apiClient.post('/api/sso/auth/logout');
  return response.data;
};

/** POST /api/sso/auth/register */
export const register = async (data) => {
  const response = await apiClient.post('/api/sso/auth/register', { data });
  return response.data;
};

/** POST /api/sso/signup — Organization 30-day free trial signup */
export const organizationSignup = async (data) => {
  const response = await apiClient.post('/api/sso/signup', data);
  return response.data;
};

export const signup = organizationSignup;

/** GET /api/sso/organization/:organizationCode — Lookup organization for login */
export const getOrganizationByCode = async (organizationCode) => {
  const response = await apiClient.get(`/api/sso/organization/${encodeURIComponent(organizationCode)}`);
  return response.data;
};

/** GET /api/sso/auth/me (Authorization header attached by interceptor) */
export const getSsoCurrentUser = async () => {
  const response = await apiClient.get('/api/sso/auth/me');
  return response.data;
};

// ──────────────────────────────────────────────────────────────────────────────
// Account Auth Controller (/api/account/auth/*)
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/account/auth/me — Get user from cookie session */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/account/auth/me');
  return response.data;
};

/** GET /api/account/auth/verify — Verify ACCESS_TOKEN cookie */
export const verifyAccountSession = async () => {
  const response = await apiClient.get('/api/account/auth/verify');
  return response.data;
};

/** POST /api/account/auth/logout — Logout from cookie session */
export const accountLogout = async () => {
  const response = await apiClient.post('/api/account/auth/logout');
  return response.data;
};

/**
 * GET /api/account/auth/login?companyCode=...
 * Initiates OAuth redirect. The browser navigates to this URL directly;
 * calling via AJAX may not work due to 302 redirects / CORS.
 * Use `window.location.href` for browser-native redirect instead.
 */
export const getAccountOAuthLoginUrl = (companyCode) => {
  return `/api/account/auth/login?companyCode=${encodeURIComponent(companyCode)}`;
};

/** GET /api/account/auth/callback?code=... — Process OAuth callback */
export const accountCallback = async (code) => {
  const response = await apiClient.get('/api/account/auth/callback', {
    params: { code },
  });
  return response.data;
};

// ──────────────────────────────────────────────────────────────────────────────
// Legacy aliases (backward-compatible)
// ──────────────────────────────────────────────────────────────────────────────

export const forgotPassword = async (data) => {
  const response = await apiClient.post('/api/sso/auth/forgot-password', { data });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await apiClient.post('/api/sso/auth/reset-password', { data });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await apiClient.get(`/api/sso/auth/verify-email?token=${token}`);
  return response.data;
};
