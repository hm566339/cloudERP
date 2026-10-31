/**
 * @fileoverview Organization Settings API Client
 *
 * Dedicated API methods for the Organization Settings module:
 * - Organization Profile (name, primaryEmail, code, uuid)
 * - Dedicated Organization Login Portal (custom URL, preview)
 * - Regional & Fiscal Defaults (currency, timezone, fiscal year start, formats)
 * - Organization Security & Compliance (2FA enforcement, inactivity timeout)
 * - Multi-Company Management (list, create, update, archive)
 * - Subscription & Plan Usage (active companies, storage, limits)
 * - Entitled Modules (organization-level and company-level assignment)
 */

import apiClient from '../common/client.js';

const PRIMARY_PREFIX = '/api/organization';
const FALLBACK_PREFIX = '/api/sso/organization';

/**
 * Execute request with graceful fallback between /api/organization and /api/sso/organization
 */
async function executeWithFallback(endpoint, options = {}) {
  const method = options.method || 'GET';
  const primaryUrl = `${PRIMARY_PREFIX}${endpoint}`;
  const fallbackUrl = `${FALLBACK_PREFIX}${endpoint}`;

  try {
    const res = await apiClient({
      url: primaryUrl,
      method,
      data: options.data,
      params: options.params,
    });
    return res?.data?.data !== undefined ? res.data.data : res.data;
  } catch (primaryErr) {
    // If 404 or method issue on primary, attempt fallback prefix
    if (primaryErr?.response?.status === 404 || primaryErr?.response?.status === 405) {
      const res = await apiClient({
        url: fallbackUrl,
        method,
        data: options.data,
        params: options.params,
      });
      return res?.data?.data !== undefined ? res.data.data : res.data;
    }
    throw primaryErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Organization Profile
// ─────────────────────────────────────────────────────────────────────────────

export const getOrganizationProfile = async () => {
  return executeWithFallback('/profile', { method: 'GET' });
};

export const updateOrganizationProfile = async (payload) => {
  return executeWithFallback('/profile', {
    method: 'PUT',
    data: payload,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dedicated Login Portal
// ─────────────────────────────────────────────────────────────────────────────

export const getLoginPortal = async () => {
  return executeWithFallback('/login-portal', { method: 'GET' });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Regional & Fiscal Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const getRegionalSettings = async () => {
  return executeWithFallback('/regional-settings', { method: 'GET' });
};

export const updateRegionalSettings = async (payload) => {
  return executeWithFallback('/regional-settings', {
    method: 'PUT',
    data: payload,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Security & Compliance
// ─────────────────────────────────────────────────────────────────────────────

export const getSecuritySettings = async () => {
  return executeWithFallback('/security', { method: 'GET' });
};

export const updateSecuritySettings = async (payload) => {
  return executeWithFallback('/security', {
    method: 'PUT',
    data: payload,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Multi-Company Management
// ─────────────────────────────────────────────────────────────────────────────

export const getOrganizationCompanies = async () => {
  return executeWithFallback('/companies', { method: 'GET' });
};

export const createOrganizationCompany = async (payload) => {
  return executeWithFallback('/companies', {
    method: 'POST',
    data: payload,
  });
};

export const getOrganizationCompanyById = async (companyId) => {
  return executeWithFallback(`/companies/${companyId}`, { method: 'GET' });
};

export const updateOrganizationCompany = async (companyId, payload) => {
  return executeWithFallback(`/companies/${companyId}`, {
    method: 'PUT',
    data: payload,
  });
};

export const deleteOrganizationCompany = async (companyId) => {
  return executeWithFallback(`/companies/${companyId}`, {
    method: 'DELETE',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Subscription & Usage
// ─────────────────────────────────────────────────────────────────────────────

export const getOrganizationSubscription = async () => {
  return executeWithFallback('/subscription', { method: 'GET' });
};

export const getOrganizationSubscriptionUsage = async () => {
  return executeWithFallback('/subscription/usage', { method: 'GET' });
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Entitled Modules
// ─────────────────────────────────────────────────────────────────────────────

export const getOrganizationModules = async () => {
  return executeWithFallback('/modules', { method: 'GET' });
};

export const updateOrganizationModules = async (payload) => {
  return executeWithFallback('/modules', {
    method: 'PUT',
    data: payload,
  });
};

export const getCompanyModules = async (companyId) => {
  return executeWithFallback(`/companies/${companyId}/modules`, { method: 'GET' });
};

export const updateCompanyModules = async (companyId, payload) => {
  return executeWithFallback(`/companies/${companyId}/modules`, {
    method: 'PUT',
    data: payload,
  });
};

