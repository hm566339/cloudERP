import React from 'react';
import usePermission from '../../hooks/usePermission';

/**
 * PermissionGuard — Conditionally renders children or disables them based on the authenticated user's permissions.
 *
 * Usage examples:
 *   <PermissionGuard permission="CUSTOMERS:READ">
 *     <ViewButton />
 *   </PermissionGuard>
 *
 *   <PermissionGuard permission="CUSTOMERS:WRITE">
 *     <EditButton />
 *   </PermissionGuard>
 *
 *   <PermissionGuard permission="CUSTOMERS:DELETE">
 *     <DeleteButton />
 *   </PermissionGuard>
 *
 *   <PermissionGuard feature="CUSTOMERS" action="CREATE">
 *     <CreateButton />
 *   </PermissionGuard>
 *
 *   <PermissionGuard permission="CUSTOMERS:DELETE" behavior="disable" fallback={<FallbackUI />}>
 *     <DeleteButton />
 *   </PermissionGuard>
 *
 * @param {object} props
 * @param {string} [props.permission] - Permission string (e.g. "CUSTOMERS:READ", "CUSTOMERS:WRITE", "CUSTOMERS:DELETE")
 * @param {string} [props.feature] - Feature/Module code (e.g. "CUSTOMERS")
 * @param {string} [props.module] - Alias for feature or canonical module
 * @param {string} [props.action] - Action (e.g. "READ", "CREATE", "UPDATE", "DELETE", "APPROVE")
 * @param {'hide' | 'disable'} [props.behavior='hide'] - 'hide' (default) or 'disable'
 * @param {React.ReactNode} [props.fallback=null] - Optional fallback when permission is denied (in 'hide' mode)
 * @param {React.ReactNode} props.children
 */
export default function PermissionGuard({
  permission,
  feature,
  module,
  action,
  behavior = 'hide',
  fallback = null,
  children,
}) {
  const targetFeature =
    feature ||
    module ||
    (typeof permission === 'string' && permission.includes(':') ? permission.split(':')[0] : permission);
  const targetAction =
    action ||
    (typeof permission === 'string' && permission.includes(':') ? permission.split(':')[1] : null);

  const isAllowed = usePermission(targetFeature, targetAction);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (behavior === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (behavior === 'disable') {
    return (
      <span
        className="inline-flex cursor-not-allowed group relative"
        title="You do not have permission to perform this action"
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const existingClass = child.props.className || '';
            return React.cloneElement(child, {
              disabled: true,
              'aria-disabled': true,
              className: `${existingClass} opacity-50 pointer-events-none`.trim(),
              onClick: (e) => e.preventDefault(),
            });
          }
          return child;
        })}
      </span>
    );
  }

  return fallback ? <>{fallback}</> : null;
}
