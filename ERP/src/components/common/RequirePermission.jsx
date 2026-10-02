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
export default function RequirePermission({ module, action, behavior = 'hide', children }) {
  const isAllowed = usePermission(module, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (behavior === 'hide') {
    return null;
  }

  if (behavior === 'disable') {
    // We wrap the child in a span with a not-allowed cursor and tooltip,
    // and attempt to clone the child to pass `disabled={true}` if it's a valid React element.
    return (
      <span className="inline-block cursor-not-allowed group relative" title="You don't have permission to perform this action">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Merge existing class names with disabled styles
            const existingClass = child.props.className || '';
            return React.cloneElement(child, {
              disabled: true,
              className: `${existingClass} opacity-50 pointer-events-none`.trim(),
              onClick: (e) => e.preventDefault(),
            });
          }
          return child;
        })}
      </span>
    );
  }

  return null;
}
