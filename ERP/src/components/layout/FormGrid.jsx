import React from 'react';

/**
 * FormGrid enforces a strict two-column / multi-column responsive grid
 * with fixed gutters between form elements.
 *
 * Spacing Specs:
 * - Column Gutter: gap-x-5 (20px)
 * - Row Gutter: gap-y-4 (16px)
 * - Columns: cols={1} | cols={2} (default) | cols={3} | cols={4}
 */
export default function FormGrid({
  children,
  cols = 2,
  className = '',
  ...props
}) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      className={`grid ${colClass} gap-x-5 gap-y-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
