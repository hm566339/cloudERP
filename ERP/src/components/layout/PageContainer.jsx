import React from 'react';

/**
 * PageContainer enforces standardized horizontal and vertical page gutters
 * across all breakpoints.
 *
 * Spacing Specs:
 * - Desktop: px-6 py-5
 * - Mobile: px-4 py-4
 * - Max Width: 'max-w-7xl' for focused forms/dashboards, 'w-full' for wide tables
 */
export default function PageContainer({
  children,
  maxWidth = 'w-full', // 'max-w-7xl' | 'w-full' | 'max-w-5xl' | 'max-w-6xl'
  className = '',
  fullHeight = false,
  ...props
}) {
  return (
    <div
      className={`w-full ${maxWidth} mx-auto px-4 py-4 sm:px-6 sm:py-5 flex flex-col ${
        fullHeight ? 'h-full min-h-0' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
