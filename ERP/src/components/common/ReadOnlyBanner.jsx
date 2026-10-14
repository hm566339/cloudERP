import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Explanatory banner displayed when the organization/session is in READ_ONLY mode.
 */
export const ReadOnlyBanner = ({ message, className = '' }) => {
  const { accessMode } = useAuth();

  if (accessMode !== 'READ_ONLY') {
    return null;
  }

  return (
    <div
      role="status"
      data-testid="read-only-banner"
      className={`bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-2 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 font-medium">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          {message || 'Read-Only Mode Active: Subscription or organization access is currently restricted to viewing only. Mutations and posting actions are disabled.'}
        </span>
      </div>
      <a
        href="/subscription"
        className="text-amber-700 dark:text-amber-300 font-semibold underline hover:text-amber-800 dark:hover:text-amber-100 shrink-0"
      >
        Manage Subscription &rarr;
      </a>
    </div>
  );
};

export default ReadOnlyBanner;
