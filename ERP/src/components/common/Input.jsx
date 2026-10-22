import React from 'react';

/**
 * Standard Input component.
 * Follows ERP design tokens: zinc palette, 32px standard height (h-8), crisp focus ring.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.error=false]
 * @param {React.ReactNode | React.ElementType} [props.leftIcon]
 * @param {React.ReactNode | React.ElementType} [props.rightIcon]
 * @param {string} [props.className]
 */
const Input = React.forwardRef(function Input(
  {
    size = 'md',
    error = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    disabled = false,
    type = 'text',
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-xs',
    lg: 'h-9 px-3.5 text-sm',
  };

  const iconSizes = {
    sm: 13,
    md: 14,
    lg: 16,
  };

  const renderIcon = (TargetIcon) => {
    if (!TargetIcon) return null;
    if (React.isValidElement(TargetIcon)) return TargetIcon;
    const Component = TargetIcon;
    return <Component size={iconSizes[size] || 14} className="shrink-0" />;
  };

  const hasLeft = Boolean(LeftIcon);
  const hasRight = Boolean(RightIcon);

  return (
    <div className="relative flex items-center w-full">
      {hasLeft && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none flex items-center">
          {renderIcon(LeftIcon)}
        </div>
      )}

      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={`w-full bg-white dark:bg-[#1D212C] rounded-lg border text-zinc-900 dark:text-[#E6E8EE] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184] font-medium transition-all duration-150 outline-none disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184] disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 dark:border-[#F0616D] focus:border-rose-500 dark:focus:border-[#F0616D] focus:ring-2 focus:ring-rose-500/10 dark:focus:ring-[#F0616D]/20'
            : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-[#4C8DFF]/20'
        } ${sizeClasses[size] || sizeClasses.md} ${
          hasLeft ? 'pl-8' : ''
        } ${hasRight ? 'pr-8' : ''} ${className}`}
        {...props}
      />

      {hasRight && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none flex items-center">
          {renderIcon(RightIcon)}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
