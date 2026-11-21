import React from 'react';

/**
 * Compact, modern, reusable PageHeader component for ERP/SaaS applications.
 *
 * Provides a clean single horizontal header layout:
 * - Left: dynamic title with optional icon, optional description/subtitle
 * - Right: primary action button, secondary actions, or custom children
 *
 * Visual Specs:
 * - Compact height: ~64-76px with description, ~52-60px title-only
 * - Prominent but compact title font
 * - Clean muted subtitle directly underneath
 * - Responsive: horizontal on desktop, neatly stacked on mobile
 * - Follows ERP tokens (Inter font, zinc palette, neutral borders)
 */
function PageHeader({
  title,
  description,
  subtitle,
  icon: Icon,
  action,
  actions,
  actionButtons,
  children,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  actionsClassName = '',
  border = true,
}) {
  // Normalize actions: supports single `action` object, `actions` array, or `actionButtons` array
  const actionList = React.useMemo(() => {
    const raw = actions || actionButtons;
    if (raw && Array.isArray(raw)) return raw;
    if (raw && React.isValidElement(raw)) return [raw];
    if (action) return [action];
    return [];
  }, [action, actions, actionButtons]);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-white dark:bg-[#161922] ${border ? 'border-b border-zinc-200 dark:border-[#2A2F3D]' : ''
        } ${className}`}
    >
      {/* Left side: Title + optional icon + optional description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="text-[#2E3D28] dark:text-[#E6E8EE] shrink-0 flex items-center justify-center">
              {React.isValidElement(Icon) ? Icon : <Icon size={20} className="text-zinc-800 dark:text-[#E6E8EE]" />}
            </span>
          )}
          {title && (
            <h1
              className={`text-lg sm:text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] tracking-tight truncate ${titleClassName}`}
            >
              {title}
            </h1>
          )}
        </div>
        {(description || subtitle) && (
          <p
            className={`text-xs sm:text-sm text-[#485942] dark:text-[#A0A6B5] mt-0.5 leading-snug line-clamp-2 ${descriptionClassName}`}
          >
            {(description || subtitle)}
          </p>
        )}
      </div>

      {/* Right side: Actions & buttons */}
      {(actionList.length > 0 || children) && (
        <div
          className={`flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap ${actionsClassName}`}
        >
          {actionList.map((act, index) => {
            if (!act) return null;
            if (React.isValidElement(act)) {
              return <React.Fragment key={index}>{act}</React.Fragment>;
            }

            const {
              label,
              icon: ActionIcon,
              onClick,
              variant = 'primary', // 'primary' | 'secondary' | 'danger'
              disabled = false,
              loading = false,
              className: btnCustomClass = '',
              title: btnTitle,
              type = 'button',
              key: actKey,
              ...restProps
            } = act;

            const baseStyle =
              variant === 'secondary'
                ? 'btn-secondary text-xs h-8 px-3.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#222736]'
                : variant === 'danger'
                  ? 'btn-danger text-xs h-8 px-3.5'
                  : 'btn-primary text-xs h-8 px-3.5';

            return (
              <button
                key={actKey || act.label || index}
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                title={btnTitle || label}
                aria-label={btnTitle || label}
                className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${baseStyle} ${btnCustomClass}`}
                {...restProps}
              >
                {ActionIcon && (
                  <span className="shrink-0 flex items-center">
                    {React.isValidElement(ActionIcon) ? (
                      ActionIcon
                    ) : (
                      <ActionIcon size={15} />
                    )}
                  </span>
                )}
                {label && <span>{label}</span>}
              </button>
            );
          })}

          {/* Optional extra components or custom buttons passed as children */}
          {children}
        </div>
      )}
    </div>
  );
}

export default React.memo(PageHeader);
