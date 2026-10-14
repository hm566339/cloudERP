import React from 'react';

/**
 * StatGrid provides an equal-height responsive grid for KPI & Metric Cards.
 *
 * Spacing Specs:
 * - Desktop Gutter: gap-5 (20px)
 * - Mobile Gutter: gap-4 (16px)
 * - Bottom Margin: mb-6 (24px)
 */
export default function StatGrid({
  children,
  cols = 4, // 2 | 3 | 4
  className = '',
  ...props
}) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div
      className={`grid ${colClass} gap-4 sm:gap-5 mb-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
