import React from 'react';

/**
 * Standard Badge / StatusChip component.
 * Follows ERP design tokens: zinc palette and semantic status colors.
 *
 * @param {Object} props
 * @param {'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'} [props.variant='secondary']
 * @param {'sm' | 'md'} [props.size='md']
 * @param {boolean} [props.dot=false]
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Badge({
  variant = 'secondary',
  size = 'md',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}) {
  const variantClasses = {
    default: 'bg-zinc-900 text-white border-zinc-900',
    secondary: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-700 border-teal-200',
    outline: 'bg-transparent text-zinc-700 border-zinc-300',
  };

  const dotClasses = {
    default: 'bg-white',
    secondary: 'bg-zinc-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-teal-500',
    outline: 'bg-zinc-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium tracking-wide rounded-md border select-none ${
        variantClasses[variant] || variantClasses.secondary
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotClasses[variant] || dotClasses.secondary
          }`}
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </span>
  );
}
