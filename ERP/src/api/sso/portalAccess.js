import apiClient from '../common/client';

// ──────────────────────────────────────────────────────────────────────────────
// SSO Portal Access Controller (/api/sso/portal-access/*)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/sso/portal-access/{companyId}
 * Paginated list of portal access entries for a company.
 * @param {string} companyId - UUID of the company
 * @param {Object} params - { page, pageSize, search, status }
 */
export const getPortalAccess = async (companyId, params = {}) => {
  const { page = 1, pageSize = 5, search, status } = params;
  const query = { page, pageSize };
  if (search) query.search = search;
  if (status !== undefined) query.status = status;

  const response = await apiClient.get(`/api/sso/portal-access/${companyId}`, {
    params: query,
  });
  return response.data;
};
