import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component-level permission and role gating wrapper.
 * Conditionally renders children if the authenticated user has the required permission/role.
 *
 * @example
 * <Can permission="CUSTOMERS" action="CREATE">
 *   <button>Add Customer</button>
 * </Can>
 *
 * <Can roles={['owner', 'company_admin']}>
 *   <AdminSettings />
 * </Can>
 */
export default function Can({
  permission = null,
  action = null,
  roles = null,
  module = null,
  fallback = null,
  children,
}) {
  const { can, hasRole, canAccessModule, isSuperAdmin, isOwner } = useAuth();

  // 1. If explicit roles are specified, enforce role restriction
  if (roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(...roleList)) {
      return fallback;
    }
  }

  // 2. Check permission/action if specified to enforce READ_ONLY & specific permissions
  if (permission) {
    let perm = permission;
    let act = action;

    // Handle "MODULE:ACTION" format like "CUSTOMERS:CREATE"
    if (typeof permission === 'string' && permission.includes(':') && !act) {
      const [m, a] = permission.split(':');
      perm = m;
      act = a;
    }

    if (!can(perm, act)) {
      return fallback;
    }
  }

  // 3. Super admin and Owner bypass subsequent generic checks for non-blocked/non-readonly actions
  if (isSuperAdmin || isOwner) {
    return <>{children}</>;
  }

  // 4. Check module access if specified
  if (module && !canAccessModule(module)) {
    return fallback;
  }

  return <>{children}</>;
}

Can.propTypes = {
  permission: PropTypes.string,
  action: PropTypes.string,
  roles: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  module: PropTypes.string,
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired,
};
