import apiClient from '../common/client';

// ──────────────────────────────────────────────────────────────────────────────
// SSO Authorization Controller (/api/sso/authorize)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/sso/authorize
 * Authorize a user for a specific module. Requires Authorization header (injected by interceptor).
 * @param {string} userId - UUID of the user
 * @param {string} moduleId - UUID of the module
 */
export const authorizeModule = async (userId, moduleId) => {
  const response = await apiClient.get('/api/sso/authorize', {
    params: { user_id: userId, module_id: moduleId },
  });
  return response.data;
};
