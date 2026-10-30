import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Enterprise standard Button component.
 * Follows ERP design tokens: zinc monochrome theme, 6px/8px radius, 32px standard height.
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg' | 'icon'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode | React.ElementType} [props.icon]
 * @param {React.ReactNode | React.ElementType} [props.iconRight]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0F1117] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variantClasses = {
    primary:
      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] dark:bg-[var(--color-primary)] dark:text-white dark:hover:bg-[var(--color-primary-hover)] dark:active:bg-[var(--color-primary-active)] border border-transparent shadow-xs',
    secondary:
      'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] dark:bg-[var(--color-surface)] dark:text-[var(--color-text-primary)] dark:hover:bg-[var(--color-surface-2)] dark:hover:text-white border border-[var(--color-border)] dark:border-[var(--color-border)] hover:border-[var(--color-border-hover)] dark:hover:border-[var(--color-border-hover)] shadow-2xs',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-[#F0616D] dark:text-white dark:hover:bg-[#f27782] dark:active:bg-[#d94f5b] border border-transparent shadow-xs',
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-border)]/60 dark:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-text-primary)] dark:hover:bg-[var(--color-surface-2)] border border-transparent',
    outline:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] dark:text-[var(--color-text-primary)] dark:hover:text-white dark:hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] dark:border-[var(--color-border)]',
    link:
      'bg-transparent text-[var(--color-primary)] hover:underline dark:text-[var(--color-primary)] dark:hover:underline p-0 h-auto border-none shadow-none',
  };

  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
    md: 'h-8 px-3.5 text-xs gap-2 rounded-lg',
    lg: 'h-9 px-4 text-sm gap-2 rounded-lg',
    icon: 'w-8 h-8 p-0 rounded-lg justify-center shrink-0',
  };

  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  const renderIcon = (TargetIcon) => {
    if (!TargetIcon) return null;
    if (React.isValidElement(TargetIcon)) return TargetIcon;
    const Component = TargetIcon;
    return <Component size={iconSize} className="shrink-0" />;
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin shrink-0" />
      ) : (
        renderIcon(Icon)
      )}
      {children && <span>{children}</span>}
      {!loading && renderIcon(IconRight)}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
