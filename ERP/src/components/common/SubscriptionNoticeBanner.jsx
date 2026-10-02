import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAccessMode } from '../../hooks/useAccessMode';

export default function SubscriptionNoticeBanner() {
  const {
    isBlocked,
    isReadOnly,
    isTrial,
    isActive,
    daysRemaining,
  } = useAccessMode();

  // 1. BLOCKED State: Account Access Restricted
  if (isBlocked) {
    return (
      <div
        role="alert"
        className="w-full bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-rose-900 transition-all flex items-center justify-between text-xs font-medium z-40"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-rose-100 text-rose-700 shrink-0">
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
        className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-amber-900 transition-all flex items-center justify-between gap-3 text-xs font-medium z-40"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 shrink-0">
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

  // 3. TRIALING State: Subtle trial banner with countdown and View Subscription action
  if (isTrial) {
    const daysText =
      daysRemaining !== null
        ? `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining.`
        : 'Your 30-day free trial is currently active.';

    return (
      <div className="w-full bg-zinc-900 text-white px-4 py-1.5 text-[11px] font-medium transition-all flex items-center justify-between border-b border-zinc-800 z-40">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] tracking-wide uppercase">
              <Sparkles size={11} /> Free Trial
            </span>
            <span className="text-zinc-300 hidden sm:inline">{daysText}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-zinc-400 text-[10px] flex items-center gap-1">
              <Clock size={12} />
              {daysRemaining !== null ? `${daysRemaining} days left` : 'Trial Active'}
            </span>
            <Link
              to="/subscription"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white text-[10px] font-semibold transition-colors"
            >
              <span>View Subscription</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. ACTIVE State: Do NOT show a trial countdown after organization becomes ACTIVE
  return null;
}
