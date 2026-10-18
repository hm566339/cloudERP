import React from 'react';
import usePermission from '../../hooks/usePermission';
import Tooltip from './Tooltip';

/**
 * ActionButton — Centralized, permission-aware action button component.
 *
 * Automatically resolves whether the current authenticated user has permission to
 * perform the designated operation, dynamically hiding (or disabling) the button.
 *
 * Usage:
 *   <ActionButton
 *     permission="CUSTOMERS:CREATE"
 *     icon={Plus}
 *     label="New Customer"
 *     onClick={handleCreate}
 *     variant="primary"
 *   />
 *
 *   <ActionButton
 *     feature="CUSTOMERS"
 *     action="DELETE"
 *     icon={Trash2}
 *     variant="danger"
 *     onClick={handleDelete}
 *   />
 *
 *   <ActionButton
 *     permission="CUSTOMERS:UPDATE"
 *     behavior="disable"
 *     tooltip="Edit Customer"
 *     onClick={handleEdit}
 *   >
 *     Edit
 *   </ActionButton>
 *
 * @param {object} props
 * @param {string} [props.permission] - Permission string (e.g. "CUSTOMERS:CREATE", "PRODUCTS:DELETE")
 * @param {string} [props.feature] - Feature code (e.g. "CUSTOMERS")
 * @param {string} [props.module] - Canonical module or feature code
 * @param {string} [props.action] - Action ("CREATE", "READ", "UPDATE", "DELETE", "APPROVE", etc.)
 * @param {'hide' | 'disable'} [props.behavior='hide'] - 'hide' (default) or 'disable'
 * @param {React.ComponentType|React.ReactElement} [props.icon] - Icon component
 * @param {string} [props.label] - Button text label
 * @param {Function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled=false] - Explicitly disabled
 * @param {boolean} [props.loading=false] - Loading spinner state
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'indigo' | 'emerald'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.tooltip] - Optional tooltip text
 * @param {string} [props.type='button'] - Button type
 * @param {React.ReactNode} [props.children] - Children if label not provided
 */
export default function ActionButton({
  permission,
  feature,
  module,
  action,
  behavior = 'hide',
  icon: Icon,
  label,
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  tooltip,
  type = 'button',
  ...rest
}) {
  const targetFeature =
    feature ||
    module ||
    (typeof permission === 'string' && permission.includes(':') ? permission.split(':')[0] : permission);
  const targetAction =
    action ||
    (typeof permission === 'string' && permission.includes(':') ? permission.split(':')[1] : null);

  const isAllowed = usePermission(targetFeature, targetAction);

  if (!isAllowed) {
    if (behavior === 'hide') {
      return null;
    }
    // 'disable' behavior: render button disabled
    disabled = true;
  }

  let variantClass = 'btn-primary';
  if (variant === 'secondary') {
    variantClass = 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs';
  } else if (variant === 'danger') {
    variantClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs focus:ring-rose-500';
  } else if (variant === 'ghost') {
    variantClass = 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent';
  } else if (variant === 'outline') {
    variantClass = 'bg-transparent border border-zinc-300 text-zinc-700 hover:bg-zinc-50';
  } else if (variant === 'indigo') {
    variantClass = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs focus:ring-indigo-500';
  } else if (variant === 'emerald' || variant === 'success') {
    variantClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs focus:ring-emerald-500';
  }

  const sizeClass =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-2.5 text-base'
      : 'px-4 py-2 text-sm';

  const buttonElement = (
    <button
      type={type}
      onClick={disabled || loading ? (e) => e.preventDefault() : onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-micro active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && (React.isValidElement(Icon) ? Icon : <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />)
      )}
      {(label || children) && <span>{label || children}</span>}
    </button>
  );

  const effectiveTooltip = tooltip || (!isAllowed ? 'You do not have permission to perform this action' : null);

  if (effectiveTooltip) {
    return <Tooltip content={effectiveTooltip}>{buttonElement}</Tooltip>;
  }

  return buttonElement;
}
