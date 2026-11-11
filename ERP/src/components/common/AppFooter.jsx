import React from 'react';

/**
 * Shared Application Footer component.
 * Displays standard Mark2 branding and copyright notice.
 * Positioned cleanly with mt-auto for full-height flex layouts.
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional custom CSS classes
 * @param {string} [props.id] - Optional HTML id
 */
export default function AppFooter({ className = '', id = 'app-footer' }) {
  return (
    <footer
      id={id}
      data-testid="app-footer"
      className={`w-full py-4 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-auto bg-transparent ${className}`}
    >
      &copy; 2026 Mark2
    </footer>
  );
}

