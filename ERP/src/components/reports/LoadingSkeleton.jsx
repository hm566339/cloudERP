import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="bg-white rounded-2xl p-5 border border-zinc-200">
        <div className="h-4 bg-zinc-200 rounded w-1/3 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-8 bg-zinc-100 rounded w-24"></div>
          <div className="h-8 bg-zinc-100 rounded w-32"></div>
          <div className="h-8 bg-zinc-100 rounded w-20"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-zinc-200 h-[80px] flex flex-col justify-between">
            <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
            <div className="h-8 bg-zinc-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-zinc-200 h-[160px]">
             <div className="h-4 bg-zinc-200 rounded w-1/4 mb-6"></div>
             <div className="space-y-3">
               <div className="h-4 bg-zinc-100 rounded w-full"></div>
               <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
               <div className="h-4 bg-zinc-100 rounded w-4/6"></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
