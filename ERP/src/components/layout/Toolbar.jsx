import React from 'react';

/**
 * Toolbar provides an aligned horizontal container for search inputs,
 * filters, view selectors, and table actions.
 *
 * Spacing Specs:
 * - Gap: gap-3 (12px)
 * - Alignment: items-center flex-wrap
 * - Bottom Margin: mb-4 (16px)
 * - Control Height Standard: h-8 (32px)
 */
export default function Toolbar({
  children,
  className = '',
  justify = 'justify-between',
  ...props
}) {
  return (
    <div
      className={`w-full flex items-center ${justify} gap-3 mb-4 flex-wrap sm:flex-nowrap ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
