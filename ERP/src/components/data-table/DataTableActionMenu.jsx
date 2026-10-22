import React from 'react';
import RequirePermission from '../common/RequirePermission';
import Tooltip from '../common/Tooltip';

/**
 * Renders row action icons for DataTable rows.
 * Supports tooltips, permissions, danger states, dynamic disable/hide, and custom handlers.
 */
export default function DataTableActionMenu({ actions = [], row, index, module, feature, permissionFeature }) {
  const tableFeature = permissionFeature || feature || module;
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
        let colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736]';
        if (isActive) {
          colorClass = isDanger 
            ? 'text-red-700 dark:text-[#F0616D] bg-red-50 dark:bg-[#F0616D]/15 border border-red-200 dark:border-[#F0616D]/30 hover:bg-red-100 dark:hover:bg-[#F0616D]/25 shadow-sm'
            : 'text-indigo-700 dark:text-[#4C8DFF] bg-indigo-50 dark:bg-[#4C8DFF]/15 border border-indigo-200 dark:border-[#4C8DFF]/30 hover:bg-indigo-100 dark:hover:bg-[#4C8DFF]/25 shadow-sm';
        } else if (isDanger) {
          colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-red-600 dark:hover:text-[#F0616D] hover:bg-red-50 dark:hover:bg-[#F0616D]/15';
        } else if (action.variant === 'primary' || action.variant === 'indigo') {
          colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-indigo-600 dark:hover:text-[#4C8DFF] hover:bg-indigo-50 dark:hover:bg-[#4C8DFF]/15';
        } else if (action.variant === 'blue') {
          colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-blue-600 dark:hover:text-[#38BDF8] hover:bg-blue-50 dark:hover:bg-[#38BDF8]/15';
        } else if (action.variant === 'emerald' || action.variant === 'success') {
          colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-emerald-600 dark:hover:text-[#34C38F] hover:bg-emerald-50 dark:hover:bg-[#34C38F]/15';
        } else if (action.variant === 'amber' || action.variant === 'warning') {
          colorClass = 'text-zinc-400 dark:text-[#A0A6B5] hover:text-amber-600 dark:hover:text-[#F5B544] hover:bg-amber-50 dark:hover:bg-[#F5B544]/15';
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
            className={`w-8 h-8 sm:w-7 sm:h-7 min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center shrink-0 rounded-lg transition-colors duration-micro ease-enter active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#161922] ${colorClass} ${customClass}`}
          >
            {RawIcon ? (
              React.isValidElement(RawIcon) ? (
                RawIcon
              ) : (
                <RawIcon size={16} />
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

        // Resolve permission for this action
        let targetFeature =
          action.permission?.feature ||
          action.permission?.module ||
          (typeof action.permission === 'string' && action.permission.includes(':')
            ? action.permission.split(':')[0]
            : action.feature || action.module || tableFeature);

        let targetAction =
          action.permission?.action ||
          (typeof action.permission === 'string' && action.permission.includes(':')
            ? action.permission.split(':')[1]
            : typeof action.permission === 'string'
            ? action.permission
            : action.action || null);

        // Auto-infer action from standard keys if not explicitly defined
        if (!targetAction && targetFeature) {
          if (action.key === 'view' || action.key === 'preview') targetAction = 'READ';
          else if (action.key === 'edit' || action.key === 'update') targetAction = 'UPDATE';
          else if (action.key === 'delete' || action.key === 'remove') targetAction = 'DELETE';
        }

        const behavior = action.permission?.behavior || action.behavior || 'hide';

        // Dynamic permission check wrapper
        if (targetFeature && targetAction) {
          if (behavior === 'disable') {
            return (
              <Tooltip key={action.key || actionIdx} content={tooltip}>
                <RequirePermission
                  module={targetFeature}
                  action={targetAction}
                  behavior="disable"
                >
                  {buttonElement}
                </RequirePermission>
              </Tooltip>
            );
          }
          return (
            <RequirePermission
              key={action.key || actionIdx}
              module={targetFeature}
              action={targetAction}
              behavior="hide"
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