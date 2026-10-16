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
      className={`w-full bg-white rounded-lg border p-2.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 outline-none resize-y disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed ${
        error
          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
          : 'border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5'
      } ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
