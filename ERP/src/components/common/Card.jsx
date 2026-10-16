import React from 'react';

/**
 * Enterprise standard Card component.
 * Follows ERP design tokens: zinc border, rounded-xl, crisp flat surface with optional header & footer.
 */
export function Card({
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
  children,
  className = '',
  hover = false,
  ...props
}) {
  const hasStructuredHeader = title || subtitle || action;

  return (
    <div
      className={`bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden transition-all duration-150 ${
        hover ? 'hover:border-zinc-300 hover:shadow-xs' : ''
      } ${className}`}
      {...props}
    >
      {hasStructuredHeader && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 border-b border-zinc-100 bg-white ${headerClassName}`}
        >
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}

      {children && (
        <div className={`p-5 ${bodyClassName}`}>
          {children}
        </div>
      )}

      {footer && (
        <div
          className={`px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2 ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`px-5 py-3.5 border-b border-zinc-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-sm sm:text-base font-bold text-zinc-900 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-zinc-500 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
