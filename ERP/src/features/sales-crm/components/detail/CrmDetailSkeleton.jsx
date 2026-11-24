import React from 'react';
import { SkeletonBox } from '../../../../components/common/SkeletonLoader';

/**
 * Full page skeleton loader that mirrors the exact layout, dimensions,
 * and column hierarchy of the detail page.
 */
export default function CrmDetailSkeleton() {
  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      {/* Sticky Header Skeleton */}
      <div className="bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm pt-4 pb-0 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <SkeletonBox className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-7 w-48 rounded-lg" />
                  <SkeletonBox className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-4 w-28 rounded-md" />
                  <SkeletonBox className="h-4 w-32 rounded-md" />
                  <SkeletonBox className="h-4 w-24 rounded-md" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-9 w-24 rounded-lg" />
              <SkeletonBox className="h-9 w-24 rounded-lg" />
              <SkeletonBox className="h-9 w-32 rounded-lg" />
            </div>
          </div>

          {/* KPI Strip Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-xl border border-zinc-200/50 dark:border-[#2A2F3D] space-y-2"
              >
                <SkeletonBox className="h-3 w-16 rounded-full" />
                <SkeletonBox className="h-6 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body Two-Column Grid */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar Skeleton (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
              <SkeletonBox className="h-5 w-32 rounded-lg" />
              <div className="space-y-3">
                <SkeletonBox className="h-4 w-full rounded-md" />
                <SkeletonBox className="h-4 w-3/4 rounded-md" />
                <SkeletonBox className="h-4 w-5/6 rounded-md" />
                <SkeletonBox className="h-4 w-2/3 rounded-md" />
              </div>
            </div>
            <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
              <SkeletonBox className="h-5 w-28 rounded-lg" />
              <SkeletonBox className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Right Content Area Skeleton (70%) */}
          <div className="w-full lg:w-[70%] space-y-5">
            <div className="bg-zinc-50/80 dark:bg-[#161922] p-1.5 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] flex gap-2">
              <SkeletonBox className="h-9 flex-1 rounded-lg" />
              <SkeletonBox className="h-9 flex-1 rounded-lg" />
              <SkeletonBox className="h-9 flex-1 rounded-lg" />
              <SkeletonBox className="h-9 flex-1 rounded-lg" />
            </div>

            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm min-h-[400px] space-y-4">
              <SkeletonBox className="h-6 w-48 rounded-lg" />
              <SkeletonBox className="h-24 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonBox className="h-20 w-full rounded-xl" />
                <SkeletonBox className="h-20 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
