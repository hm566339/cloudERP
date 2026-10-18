import React from 'react';
import usePermission from '../../hooks/usePermission';

/**
 * Conditionally renders children or disables them based on the user's permissions.
 * @param {object} props
 * @param {string} props.module - Name of the module from rbacConfig (e.g. 'CUSTOMERS')
 * @param {string} [props.action] - The action to check (e.g. 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE').
 *                                  If omitted, just checks for module access.
 * @param {string} [props.behavior='hide'] - What to do if permission is denied.
 *                                           'hide' (default) -> Renders nothing.
 *                                           'disable' -> Renders the children but passes a `disabled` prop and adds a tooltip wrapper.
 * @param {React.ReactNode} props.children
 */
export default function RequirePermission({
  permission,
  module,
  feature,
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
      <span className="inline-block cursor-not-allowed group relative" title="You don't have permission to perform this action">
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
