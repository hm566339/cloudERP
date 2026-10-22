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
    'inline-flex items-center justify-center font-medium select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:focus-visible:ring-[#4C8DFF]/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0F1117] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variantClasses = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 dark:bg-[#4C8DFF] dark:text-white dark:hover:bg-[#6AA1FF] dark:active:bg-[#3A78E6] border border-transparent shadow-xs',
    secondary:
      'bg-white text-zinc-800 hover:text-zinc-950 hover:bg-zinc-50 dark:bg-[#1D212C] dark:text-[#E6E8EE] dark:hover:bg-[#222736] dark:hover:text-white border border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] shadow-2xs',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-[#F0616D] dark:text-white dark:hover:bg-[#f27782] dark:active:bg-[#d94f5b] border border-transparent shadow-xs',
    ghost:
      'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 active:bg-zinc-200/60 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] dark:hover:bg-[#222736] dark:active:bg-[#1D212C] border border-transparent',
    outline:
      'bg-transparent text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 dark:text-[#E6E8EE] dark:hover:text-white dark:hover:bg-[#222736] border border-zinc-300 dark:border-[#2A2F3D]',
    link:
      'bg-transparent text-zinc-900 hover:underline dark:text-[#4C8DFF] dark:hover:text-[#6AA1FF] p-0 h-auto border-none shadow-none',
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
