/**
 * @fileoverview Organization Role & Permission Templates API Client
 *
 * Dedicated client for centralized organization-level role template creation,
 * permission cataloging, multi-company preview & deployment, cross-company comparison,
 * and importing company roles as organization templates.
 */

import apiClient from '../common/client.js';
import { getActiveOrganizationId } from '../common/roleCompanyContext.js';

const PRIMARY_PREFIX = '/api/sso/organization';
const FALLBACK_PREFIX = '/api/organization';

/**
 * Execute request with graceful fallback between /api/sso/organization and /api/organization
 */
async function executeWithFallback(endpoint, options = {}) {
  const method = options.method || 'GET';
  const primaryUrl = `${PRIMARY_PREFIX}${endpoint}`;
  const fallbackUrl = `${FALLBACK_PREFIX}${endpoint}`;

  const orgId = options.params?.organizationId || getActiveOrganizationId();
  const effectiveParams = {
    ...(options.params || {}),
    ...(orgId && !options.params?.organizationId ? { organizationId: orgId } : {}),
  };
  const headers = {
    ...(options.headers || {}),
    ...(orgId ? { 'X-Organization-Id': orgId } : {}),
  };

  try {
    const res = await apiClient({
      url: primaryUrl,
      method,
      data: options.data,
      params: effectiveParams,
      headers,
    });
    return res?.data?.data !== undefined ? res.data.data : res.data;
  } catch (primaryErr) {
    if (primaryErr?.response?.status === 404 || primaryErr?.response?.status === 405) {
      const res = await apiClient({
        url: fallbackUrl,
        method,
        data: options.data,
        params: effectiveParams,
        headers,
      });
      return res?.data?.data !== undefined ? res.data.data : res.data;
    }
    throw primaryErr;
  }
}

/**
 * Fetch all organization role templates.
 */
export const getOrgRoleTemplates = async (params = {}) => {
  return executeWithFallback('/role-templates', { method: 'GET', params });
};

/**
 * Fetch a single role template by ID with its permissions and company usages.
 */
export const getOrgRoleTemplateById = async (templateId, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}`, { method: 'GET', params });
};

/**
 * Create a new organization role template.
 */
export const createOrgRoleTemplate = async (payload, params = {}) => {
  return executeWithFallback('/role-templates', {
    method: 'POST',
    data: payload,
    params,
  });
};

/**
 * Update an existing organization role template.
 */
export const updateOrgRoleTemplate = async (templateId, payload, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}`, {
    method: 'PUT',
    data: payload,
    params,
  });
};

/**
 * Duplicate an existing role template.
 */
export const duplicateOrgRoleTemplate = async (templateId, newName, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}/duplicate`, {
    method: 'POST',
    params: { ...params, ...(newName ? { newName } : {}) },
  });
};

/**
 * Toggle status of a role template.
 */
export const updateOrgRoleTemplateStatus = async (templateId, status, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}/status`, {
    method: 'PATCH',
    params: { ...params, status },
  });
};

/**
 * Delete a custom role template.
 */
export const deleteOrgRoleTemplate = async (templateId, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}`, {
    method: 'DELETE',
    params,
  });
};

/**
 * Preview differences before applying a template to target companies.
 */
export const previewApplyOrgRoleTemplate = async (templateId, payload, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}/preview`, {
    method: 'POST',
    data: payload,
    params,
  });
};

/**
 * Apply a role template to target companies.
 */
export const applyOrgRoleTemplate = async (templateId, payload, params = {}) => {
  return executeWithFallback(`/role-templates/${templateId}/apply`, {
    method: 'POST',
    data: payload,
    params,
  });
};

/**
 * Compare role permissions across all companies in the organization.
 */
export const compareRoleAcrossCompanies = async (roleName, params = {}) => {
  return executeWithFallback('/role-templates/compare', {
    method: 'GET',
    params: { ...params, roleName },
  });
};

/**
 * Import an existing company role as a new organization template.
 */
export const importCompanyRoleAsTemplate = async (payload, params = {}) => {
  return executeWithFallback('/role-templates/import', {
    method: 'POST',
    data: payload,
    params,
  });
};

/**
 * Fetch permission catalog grouped by module and feature with actions.
 */
export const getOrgPermissionCatalog = async (params = {}) => {
  return executeWithFallback('/permissions/catalog', { method: 'GET', params });
};

/**
 * Fetch full organization permission matrix.
 */
export const getOrgPermissionMatrix = async (params = {}) => {
  return executeWithFallback('/permissions/matrix', { method: 'GET', params });
};

