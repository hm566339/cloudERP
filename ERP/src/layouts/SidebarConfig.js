import React from 'react';
import {
  TrendingUp, ScanLine, Package, AlertTriangle, MessageSquare
} from 'lucide-react';

import {
  buildDynamicSidebar,
  getAuthorizedNavigation,
  hasPermission,
  MODULE_UI_METADATA,
} from './dynamicSidebarConfig.js';
import { normalizeModuleName } from '../utils/moduleNormalization.js';

// Custom Icons
export const ArrowUpRight = TrendingUp;
export const ArrowDownRight = TrendingUp;
export const CustomScanLine = ScanLine;
export const CustomPackagePlus = Package;
export const CustomAlertTriangle = AlertTriangle;
export const CustomMessageSquare = MessageSquare;

export {
  buildDynamicSidebar,
  getAuthorizedNavigation,
  hasPermission,
  MODULE_UI_METADATA,
};

/**
 * Builds ERP sidebar links dynamically from authContext and user permissions.
 * Fully role-agnostic and API-driven.
 */
export function buildSidebarLinks(userRoleOrOptions, companyId, permissions, isSuperAdminGlobal, accessibleModuleKeys = [], canViewModule, isOwner = false) {
  // If called with an options object
  if (userRoleOrOptions && typeof userRoleOrOptions === 'object' && ('authContext' in userRoleOrOptions || 'userRole' in userRoleOrOptions)) {
    return buildDynamicSidebar(userRoleOrOptions);
  }

  const userRole = userRoleOrOptions;
  const isOwnerUser = isOwner || String(userRole).toLowerCase() === 'owner';
  const isCompAdmin = userRole === 'company_admin';

  const modKeys = new Set(accessibleModuleKeys || []);
  if (modKeys.has('workflow') && (isOwnerUser || isCompAdmin)) {
    modKeys.add('admin');
    modKeys.add('sso');
  }

  // Backwards compatibility for callers passing positional arguments
  const resolvedPermissions = Array.isArray(permissions) ? [...permissions] : [];
  if (resolvedPermissions.length === 0 && typeof canViewModule === 'function') {
    if (canViewModule('workflow') || canViewModule('workflows') || canViewModule('WORKFLOW_DEFINITIONS')) {
      resolvedPermissions.push('WORKFLOW:READ', 'WORKFLOW_DEFINITIONS:READ', 'WORKFLOW_VIEW');
    }
    if (canViewModule('APPROVAL_REQUESTS') || canViewModule('WORKFLOW_TASKS') || canViewModule('approvals')) {
      resolvedPermissions.push('WORKFLOW_TASKS:READ', 'APPROVAL_REQUESTS:READ', 'WORKFLOW_APPROVE');
    }
    if (isOwnerUser || isCompAdmin || canViewModule('sso') || canViewModule('admin')) {
      resolvedPermissions.push('USER:READ', 'ROLE:READ', 'PORTAL_ACCESS:READ', 'SESSION:READ', 'AUDIT_LOGS:READ', 'DASHBOARD:READ');
    }
  }

  const authContext = {
    user: { role: userRole },
    membership: isOwnerUser ? { memberType: 'OWNER' } : null,
    accessMode: 'FULL',
    modules: Array.from(modKeys).map((k) => ({
      code: k,
      name: k,
      canonical: normalizeModuleName(k),
      active: true,
    })),
    permissions: resolvedPermissions,
  };

  return buildDynamicSidebar({
    authContext,
    userRole,
    companyId,
    isSuperAdminGlobal,
    canAccess: canViewModule,
    permissions: resolvedPermissions,
  });
}
