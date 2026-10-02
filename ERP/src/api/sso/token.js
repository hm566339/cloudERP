import apiClient from '../common/client';

// ──────────────────────────────────────────────────────────────────────────────
// SSO Token Controller (/api/sso/token/*)
// ──────────────────────────────────────────────────────────────────────────────

/** POST /api/sso/token/verify — Verify SSO token (Authorization header) */
export const verifyToken = async () => {
  const response = await apiClient.post('/api/sso/token/verify');
  return response.data;
};

/** POST /api/sso/token/refresh — Refresh access token using refresh token */
export const refreshToken = async (data) => {
  const response = await apiClient.post('/api/sso/token/refresh', { data });
  return response.data;
};

/** POST /api/sso/admin/token/refresh — Refresh admin access token */
export const refreshAdminToken = async (data) => {
  const response = await apiClient.post('/api/sso/admin/token/refresh', { data });
  return response.data;
};

/** POST /api/sso/token/exchange — Exchange auth code for access + refresh tokens */
export const exchangeToken = async (data) => {
  const response = await apiClient.post('/api/sso/token/exchange', { data });
  return response.data;
};

/** POST /api/sso/token/revoke — Revoke an issued token */
export const revokeToken = async (data) => {
  const response = await apiClient.post('/api/sso/token/revoke', { data });
  return response.data;
};
