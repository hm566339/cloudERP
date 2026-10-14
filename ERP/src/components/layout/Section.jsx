import React from 'react';

/**
 * Section manages vertical separation between major layout zones.
 *
 * Spacing Specs:
 * - Gap: space-y-6 (24px) for major sections, space-y-4 (16px) for compact
 * - Optional title with mb-3
 */
export default function Section({
  title,
  subtitle,
  actions,
  children,
  compact = false,
  className = '',
  ...props
}) {
  return (
    <section
      className={`w-full ${compact ? 'space-y-4' : 'space-y-6'} ${className}`}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
