import React from 'react';

// ── Base shimmer box ────────────────────────────────────────────────────────
// Uses a pseudo-element sweep powered by Tailwind's animate-shimmer keyframe.
// Works by layering a translating gradient over a zinc-100 base.
export function SkeletonBox({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-100 dark:bg-[#1D212C] rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent animate-shimmer" />
    </div>
  );
}

// ── Stat Card Skeleton ──────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
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
      <div className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 flex-1 rounded-full" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
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
        <tr key={rIndex} className="border-b border-zinc-100 dark:border-[#2A2F3D]">
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
    <div className="bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-2xl p-5 flex flex-col gap-4">
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
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-100 dark:border-[#2A2F3D] rounded-xl">
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
          <div key={i} className="bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
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
export function PageLoader({ message = 'Loading…', className = '' }) {
  // Strip trailing dots for custom bounce animation
  const cleanMessage = message.replace(/\.+$/, '').replace(/…$/, '');

  return (
    <div
      className={`flex flex-col items-center justify-center w-full flex-1 min-h-[75vh] sm:min-h-[80vh] py-12 gap-5 select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Center Spinner + Mark2 Logo */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Glow */}
        <div className="absolute w-24 h-24 rounded-full bg-sky-500/15 blur-xl pointer-events-none animate-pulse" />

        {/* Smooth Circular Gradient Spinner Ring */}
        <div
          className="w-18 h-18 rounded-full border-[2.5px] border-zinc-200/70 dark:border-zinc-700/70 border-t-sky-500 border-r-blue-600 animate-spin"
          style={{ animationDuration: '1s', animationTimingFunction: 'cubic-bezier(0.55, 0.15, 0.45, 0.85)' }}
        />

        {/* Center Logo Badge */}
        <div className="absolute w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-md">
          <svg
            className="w-6 h-6"
            viewBox="180 80 840 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pageLoaderM2Blue" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#071D4A" />
                <stop offset="48%" stopColor="#0866D8" />
                <stop offset="100%" stopColor="#16D7F0" />
              </linearGradient>
              <linearGradient id="pageLoaderM2DarkBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#102B62" />
                <stop offset="100%" stopColor="#06152F" />
              </linearGradient>
            </defs>
            <g>
              <path d="M245 300 L455 465 L365 555 L245 462 Z" fill="url(#pageLoaderM2DarkBlue)" />
              <path d="M245 300 L365 392 L365 555 L245 640 Z" fill="url(#pageLoaderM2Blue)" />
              <path
                d="M365 392 L455 465 L690 250 Q735 210 800 205 L800 300 Q750 310 710 350 L500 555 Q470 585 440 560 L365 500 Z"
                fill="url(#pageLoaderM2Blue)"
              />
              <path
                d="M800 300 Q850 250 915 275 Q965 295 965 350 Q965 405 915 435 L760 525 L965 525 L965 620 L675 620 Q645 620 645 590 Q645 565 675 545 L875 425 Q900 410 900 380 Q900 355 870 350 L800 350 Z"
                fill="url(#pageLoaderM2Blue)"
              />
              <path d="M365 500 L455 570 L455 660 L365 600 Z" fill="url(#pageLoaderM2DarkBlue)" />
              <rect x="810" y="165" width="30" height="30" rx="5" fill="#075ED1" />
              <rect x="850" y="125" width="22" height="22" rx="4" fill="#0A83E8" />
              <rect x="890" y="95" width="42" height="42" rx="7" fill="#12CDEB" />
              <rect x="855" y="175" width="18" height="18" rx="4" fill="#14BDEB" />
              <rect x="900" y="155" width="24" height="24" rx="4" fill="#0876DF" />
            </g>
          </svg>
        </div>
      </div>

      {/* Clean Modern Message & Progress */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-zinc-700 dark:text-[#E6E8EE] tracking-wider uppercase font-sans">
          <span>{cleanMessage}</span>
          <span className="flex gap-1" aria-hidden="true">
            <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>

        {/* Minimal gradient sweep progress */}
        <div className="w-36 h-[2.5px] bg-zinc-100 dark:bg-[#222736] rounded-full overflow-hidden relative">
          <div
            className="h-full w-2/5 rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
            style={{ animation: 'loader-sweep 1.5s ease-in-out infinite' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loader-sweep {
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

export const DetailsSkeleton = () => <div className='animate-pulse h-4 bg-zinc-200 dark:bg-[#1D212C] rounded w-full'></div>;

export default function SkeletonLoader() {
  return <PageLoader />;
}
