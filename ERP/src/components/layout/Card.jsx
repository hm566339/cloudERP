import React from 'react';

/**
 * Card primitive providing standardized padding, border, and background.
 *
 * Spacing Specs:
 * - Standard Padding: p-5 (20px)
 * - Compact Padding: p-4 (16px)
 * - Header: pb-3 mb-4 border-b border-zinc-100
 * - Footer: pt-3 mt-4 border-t border-zinc-100
 */
export default function Card({
  title,
  subtitle,
  actions,
  children,
  footer,
  compact = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`bg-white border border-zinc-200 rounded-lg ${
        compact ? 'p-4' : 'p-5'
      } ${className}`}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 gap-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
      {footer && (
        <div className="pt-3 mt-4 border-t border-zinc-100 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
