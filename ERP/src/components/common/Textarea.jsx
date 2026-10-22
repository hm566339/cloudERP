import React from 'react';

/**
 * Standard Textarea component.
 * Follows ERP design tokens: zinc palette, crisp focus ring, consistent padding.
 *
 * @param {Object} props
 * @param {boolean} [props.error=false]
 * @param {number} [props.rows=3]
 * @param {string} [props.className]
 */
const Textarea = React.forwardRef(function Textarea(
  {
    error = false,
    rows = 3,
    className = '',
    disabled = false,
    ...props
  },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={`w-full bg-white dark:bg-[#1D212C] rounded-lg border p-2.5 text-xs font-medium text-zinc-900 dark:text-[#E6E8EE] placeholder:text-zinc-400 dark:placeholder-[#6B7184] transition-all duration-150 outline-none resize-y disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184] disabled:cursor-not-allowed ${
        error
          ? 'border-rose-400 dark:border-[#F0616D] focus:border-rose-500 dark:focus:border-[#F0616D] focus:ring-2 focus:ring-rose-500/10 dark:focus:ring-[#F0616D]/20'
          : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-[#4C8DFF]/20'
      } ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
