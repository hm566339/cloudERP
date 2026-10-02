import React from 'react';

// ── Base shimmer box ────────────────────────────────────────────────────────
// Uses a pseudo-element sweep powered by Tailwind's animate-shimmer keyframe.
// Works by layering a translating gradient over a zinc-100 base.
export function SkeletonBox({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-100 rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" />
    </div>
  );
}

// ── Stat Card Skeleton ──────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-28 rounded-full" />
        <SkeletonBox className="h-9 w-9 rounded-xl" />
      </div>
      <SkeletonBox className="h-8 w-36 rounded-lg" />
      <SkeletonBox className="h-3 w-20 rounded-full" />
    </div>
  );
}

// ── Table Skeleton ──────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 flex-1 rounded-full" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div key={rIndex} className="px-4 py-3.5 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, cIndex) => (
              <SkeletonBox
                key={cIndex}
                className={`h-3.5 rounded-full ${cIndex === 0 ? 'w-28' : cIndex === columns - 1 ? 'w-16' : 'flex-1'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Table Row Skeleton (for use inside <tbody>) ─────────────────────────────
export function TableRowSkeleton({ rows = 3, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <tr key={rIndex} className="border-b border-zinc-100">
          {Array.from({ length: columns }).map((_, cIndex) => (
            <td key={cIndex} className="px-4 py-3.5">
              <SkeletonBox className={`h-3.5 rounded-full ${cIndex === 0 ? 'w-28' : 'w-3/4'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Card Grid Skeleton ──────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-10 w-10 rounded-xl" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2 mt-2">
        <SkeletonBox className="h-6 w-1/2 rounded-lg" />
        <SkeletonBox className="h-3.5 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

// ── List Skeleton ───────────────────────────────────────────────────────────
export function ListSkeleton({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-xl">
          <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-3.5 w-1/3 rounded-full" />
            <SkeletonBox className="h-3 w-1/2 rounded-full" />
          </div>
          <SkeletonBox className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Dashboard Header Skeleton ───────────────────────────────────────────────
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBox className="h-7 w-48 rounded-lg" />
        <SkeletonBox className="h-4 w-64 rounded-full" />
      </div>
      <SkeletonBox className="h-9 w-28 rounded-xl shrink-0" />
    </div>
  );
}

// ── Full Finance Dashboard Skeleton ─────────────────────────────────────────
export function FinanceDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardHeaderSkeleton />
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="space-y-1.5">
                <SkeletonBox className="h-4 w-36 rounded-full" />
                <SkeletonBox className="h-3 w-24 rounded-full" />
              </div>
              <SkeletonBox className="h-8 w-8 rounded-xl" />
            </div>
            <TableSkeleton rows={4} columns={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page-level loader (Suspense / route transitions) ────────────────────────
export function PageLoader({ message = 'Loading…' }) {
  // Strip trailing dots for custom bounce animation
  const cleanMessage = message.replace(/\.+$/, '').replace(/…$/, '');

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[288px] gap-6 py-20 relative overflow-hidden">
      {/* Subtle Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-zinc-200/50 rounded-full blur-[64px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex items-center justify-center mt-8">
        {/* Pulsing rings */}
        <div className="absolute w-24 h-24 rounded-full border border-zinc-900/10 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-24 h-24 rounded-full border border-zinc-900/5 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '0.5s' }} />

        {/* Orbiting dots */}
        <div className="absolute w-20 h-20 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 rounded-full shadow-[0_0_8px_rgba(24,24,27,0.4)]" />
        </div>
        <div className="absolute w-16 h-16 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -translate-x-1/2 translate-y-1/2 bg-zinc-600 rounded-full shadow-[0_0_8px_rgba(82,82,91,0.4)]" />
        </div>

        {/* Center Logo/Icon */}
        <div className="relative z-10 w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10 animate-pulse">
            <path d="M5 4v16M5 12l9-8M5 12l9 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 relative z-10 mt-4">
        {/* Fancy loading text */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10.4px] font-semibold text-zinc-600 tracking-widest uppercase">
            {cleanMessage}
          </span>
          <span className="flex gap-1">
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </span>
        </div>

        {/* Dynamic progress bar */}
        <div className="w-48 h-[2.4px] bg-zinc-200 rounded-full overflow-hidden relative">
          <div
            className="h-full w-1/3 rounded-full bg-zinc-800 relative"
            style={{ animation: 'sweep-infinite 2s ease-in-out infinite' }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 blur-[1.6px]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sweep-infinite {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

// ── Inline Button Spinner ───────────────────────────────────────────────────
export function ButtonSpinner({ size = 16, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export const DetailsSkeleton = () => <div className='animate-pulse h-4 bg-gray-200 rounded w-full'></div>;

export default function SkeletonLoader() {
  return <PageLoader />;
}
