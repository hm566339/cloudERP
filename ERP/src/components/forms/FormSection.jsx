import React from 'react';

/**
 * Reusable FormSection component.
 * Groups related FormFields under a standardized section header with optional description or actions.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Section title
 * @param {string} [props.description] - Optional subtext/description
 * @param {React.ReactNode} [props.actions] - Optional right-aligned actions/controls
 * @param {string} [props.className] - Wrapper CSS classes
 * @param {React.ReactNode} props.children - Form fields or field grids
 */
export default function FormSection({
  title,
  description,
  actions,
  className = '',
  children,
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
