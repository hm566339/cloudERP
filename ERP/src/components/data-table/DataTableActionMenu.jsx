import React from 'react';
import RequirePermission from '../common/RequirePermission';
import Tooltip from '../common/Tooltip';

/**
 * Renders row action icons for DataTable rows.
 * Supports tooltips, permissions, danger states, dynamic disable/hide, and custom handlers.
 */
export default function DataTableActionMenu({ actions = [], row, index }) {
  const resolvedActions = typeof actions === 'function' ? actions(row, index) : (Array.isArray(actions) ? actions : []);
  if (!resolvedActions || resolvedActions.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {resolvedActions.map((action, actionIdx) => {
        // Evaluate dynamic conditions
        const isHidden = typeof action.hidden === 'function' ? action.hidden(row) : !!action.hidden;
        if (isHidden) return null;

        if (action.component) {
          const CustomComponent = action.component;
          return <CustomComponent key={action.key || actionIdx} row={row} action={action} />;
        }

        const isActive = typeof action.active === 'function' ? action.active(row) : !!action.active;
        const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : !!action.disabled;
        const isDanger = typeof action.danger === 'function' ? action.danger(row) : !!action.danger;
        const isLoading = typeof action.loading === 'function' ? action.loading(row) : !!action.loading;

        let RawIcon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
        if (action.activeIcon && isActive) {
          RawIcon = typeof action.activeIcon === 'function' ? action.activeIcon(row) : action.activeIcon;
        } else if (action.inactiveIcon && !isActive) {
          RawIcon = typeof action.inactiveIcon === 'function' ? action.inactiveIcon(row) : action.inactiveIcon;
        }

        const label = typeof action.label === 'function' ? action.label(row) : action.label;
        const customClass = typeof action.className === 'function' ? action.className(row) : (action.className || '');
        const tooltip = typeof action.tooltip === 'function' 
          ? action.tooltip(row) 
          : (isDisabled && action.disabledHint ? action.disabledHint : (action.tooltip || label || 'Action'));
        const ariaLabel = action['aria-label'] || label || tooltip || 'Action';

        // Visual styling default
        let colorClass = 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100';
        if (isActive) {
          colorClass = isDanger 
            ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 shadow-2xs'
            : 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-2xs';
        } else if (isDanger) {
          colorClass = 'text-zinc-400 hover:text-red-600 hover:bg-red-50';
        } else if (action.variant === 'primary' || action.variant === 'indigo') {
          colorClass = 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50';
        } else if (action.variant === 'blue') {
          colorClass = 'text-zinc-400 hover:text-blue-600 hover:bg-blue-50';
        } else if (action.variant === 'emerald' || action.variant === 'success') {
          colorClass = 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50';
        } else if (action.variant === 'amber' || action.variant === 'warning') {
          colorClass = 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50';
        }

        const buttonElement = (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled && !isLoading && action.onClick) {
                action.onClick(row, e);
              }
            }}
            disabled={isDisabled || isLoading}
            aria-label={ariaLabel}
            aria-disabled={isDisabled || isLoading ? true : undefined}
            aria-pressed={action.active !== undefined ? isActive : undefined}
            className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${colorClass} ${customClass}`}
          >
            {RawIcon ? (
              React.isValidElement(RawIcon) ? (
                RawIcon
              ) : (
                <RawIcon size={15} />
              )
            ) : (
              <span className="text-xs font-semibold">{label}</span>
            )}
          </button>
        );

        const tooltipElement = (
          <Tooltip key={action.key || actionIdx} content={tooltip} className={isDisabled ? 'cursor-not-allowed' : ''}>
            {buttonElement}
          </Tooltip>
        );

        // Optional permission wrapper
        if (action.permission) {
          if ((action.permission.behavior || 'hide') === 'disable') {
            return (
              <Tooltip
                key={action.key || actionIdx}
                content={tooltip}
              >
                <RequirePermission
                  module={action.permission.module}
                  action={action.permission.action}
                  behavior={action.permission.behavior}
                >
                  {buttonElement}
                </RequirePermission>
              </Tooltip>
            );
          }
          return (
            <RequirePermission
              key={action.key || actionIdx}
              module={action.permission.module}
              action={action.permission.action}
            >
              {tooltipElement}
            </RequirePermission>
          );
        }

        return tooltipElement;
      })}
    </div>
  );
}