import React from 'react';
import { Activity } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

function ActivityList({ activities = [], loading = false, emptyMessage = 'No recent activity.' }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-[#2A2F3D] mt-2 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-3/4 rounded" />
              <SkeletonBox className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <Activity className="mx-auto text-zinc-300 dark:text-[#2A2F3D] mb-3" size={32} />
        <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {activities.map((activity, idx) => {
        const Icon = activity.icon || Activity;
        return (
          <li key={activity.id || idx} className="flex items-start gap-3 p-3 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-900 dark:text-[#E6E8EE] font-medium">{activity.title}</p>
              {activity.description && <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">{activity.description}</p>}
              {activity.timestamp && (
                <p className="text-xs text-zinc-400 dark:text-[#6B7184] mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default React.memo(ActivityList);
