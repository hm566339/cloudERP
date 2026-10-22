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
    default: 'bg-zinc-900 dark:bg-[#4C8DFF] text-white dark:text-zinc-950 border-zinc-900 dark:border-[#4C8DFF]',
    secondary: 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE] border-zinc-200 dark:border-[#2A2F3D]',
    success: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30',
    warning: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544] border-amber-200 dark:border-[#F5B544]/30',
    danger: 'bg-rose-50 dark:bg-[#F0616D]/15 text-rose-700 dark:text-[#F0616D] border-rose-200 dark:border-[#F0616D]/30',
    info: 'bg-teal-50 dark:bg-[#38BDF8]/15 text-teal-700 dark:text-[#38BDF8] border-teal-200 dark:border-[#38BDF8]/30',
    outline: 'bg-transparent text-zinc-700 dark:text-[#E6E8EE] border-zinc-300 dark:border-[#2A2F3D]',
  };

  const dotClasses = {
    default: 'bg-white dark:bg-[#4C8DFF]',
    secondary: 'bg-zinc-400 dark:bg-[#6B7184]',
    success: 'bg-emerald-500 dark:bg-[#34C38F]',
    warning: 'bg-amber-500 dark:bg-[#F5B544]',
    danger: 'bg-rose-500 dark:bg-[#F0616D]',
    info: 'bg-teal-500 dark:bg-[#38BDF8]',
    outline: 'bg-zinc-400 dark:bg-[#6B7184]',
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
