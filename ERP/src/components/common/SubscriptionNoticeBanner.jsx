import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAccessMode } from '../../hooks/useAccessMode';

export default function SubscriptionNoticeBanner() {
  const {
    isBlocked,
    isReadOnly,
  } = useAccessMode();

  // 1. BLOCKED State: Account Access Restricted
  if (isBlocked) {
    return (
      <div
        role="alert"
        className="w-full bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 px-4 py-2.5 text-rose-900 dark:text-rose-300 transition-all flex items-center justify-between text-xs font-medium z-40"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 shrink-0">
              <ShieldAlert size={15} />
            </span>
            <span className="leading-snug">
              <strong>Account Access Restricted:</strong> Please contact support or your administrator.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. EXPIRED + READ_ONLY State: Trial Expired, Read-only Notice
  if (isReadOnly) {
    return (
      <div
        role="alert"
        className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-amber-900 dark:text-amber-300 transition-all flex items-center justify-between gap-3 text-xs font-medium z-40"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle size={15} />
            </span>
            <span className="leading-snug">
              <strong>Trial Expired:</strong> Your account is currently in read-only mode. You can still view your existing data and reports.
            </span>
          </div>
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors"
          >
            <span>Upgrade Plan</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  // Free trial subscription banner removed from UI. ACTIVE / TRIALING render null.
  return null;
}

