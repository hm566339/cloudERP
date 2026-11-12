import { clearLegacyAuthCookies } from '../../../utils/cookieHelper.js';
import apiClient from '../../../api/common/client.js';

/**
 * Persists rotated access & refresh tokens after a company switch or selection
 * and updates default Authorization headers on the central HTTP client.
 */
export function applySwitchedAuthTokens(payload, client = apiClient) {
  const newToken = payload?.accessToken || payload?.access_token || payload?.token;
  const newRefreshToken = payload?.refreshToken || payload?.refresh_token;
  const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const secureAttr = isHttps ? '; Secure' : '';

  if (newToken) {
    if (typeof document !== 'undefined') {
      document.cookie = `ACCESS_TOKEN=${newToken}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
      clearLegacyAuthCookies();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ACCESS_TOKEN', newToken);
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      } catch (_) {}
    }
    if (client?.defaults?.headers?.common) {
      client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      client.defaults.headers.common['authorization'] = `Bearer ${newToken}`;
    }
  }

  if (newRefreshToken) {
    if (typeof document !== 'undefined') {
      document.cookie = `ACCESS_TOKEN_REFRESH=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ACCESS_TOKEN_REFRESH', newRefreshToken);
      try {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refresh_token');
      } catch (_) {}
    }
  }

  return { newToken, newRefreshToken };
}

