import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component-level permission and role gating wrapper.
 * Conditionally renders or disables children if the authenticated user has the required permission/role.
 *
 * @example
 * <Can permission="CUSTOMERS:CREATE">
 *   <button>Add Customer</button>
 * </Can>
 *
 * <Can feature="CUSTOMERS" action="UPDATE">
 *   <button>Edit Customer</button>
 * </Can>
 *
 * <Can roles={['owner', 'company_admin']}>
 *   <AdminSettings />
 * </Can>
 */
export default function Can({
  permission = null,
  feature = null,
  module = null,
  do: doAction = null,
  on: onSubject = null,
  action = null,
  roles = null,
  behavior = 'hide', // 'hide' | 'disable'
  fallback = null,
  children
}) {
  const { can, hasRole, canAccessModule, isSuperAdmin, isOwner } = useAuth();

  // 1. If explicit roles are specified, enforce role restriction
  if (roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(...roleList)) {
      return fallback;
    }
  }

  // 2. Resolve target subject and action
  const targetSubject = onSubject || feature || module || permission;
  const targetAction = doAction || action;

  let perm = targetSubject;
  let act = targetAction;

  if (typeof perm === 'string' && perm.includes(':') && !act) {
    const [pSub, pAct] = perm.split(':');
    perm = pSub;
    act = pAct;
  }

  let allowed = true;

  if (perm || act) {
    allowed = can(perm, act);
  } else if (module && !canAccessModule(module) && !isSuperAdmin && !isOwner) {
    allowed = false;
  }

  if (!allowed) {
    if (behavior === 'disable') {
      return (
        <span
          className="inline-flex cursor-not-allowed opacity-50 pointer-events-none"
          aria-disabled="true"
          title="Permission required"
        >
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                disabled: true,
                'aria-disabled': true,
                tabIndex: -1,
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }
              })
            : children}
        </span>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}
