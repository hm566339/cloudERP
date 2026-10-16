import React from 'react';
import { Activity } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

function ActivityList({ activities = [], loading = false, emptyMessage = 'No recent activity.' }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-zinc-200 shadow-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-zinc-200 mt-2 shrink-0" />
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
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <Activity className="mx-auto text-zinc-300 mb-3" size={32} />
        <p className="text-sm text-zinc-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {activities.map((activity, idx) => {
        const Icon = activity.icon || Activity;
        return (
          <li key={activity.id || idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-blue-300 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-900 font-medium">{activity.title}</p>
              {activity.description && <p className="text-xs text-zinc-500 mt-0.5">{activity.description}</p>}
              {activity.timestamp && (
                <p className="text-xs text-zinc-400 mt-1">
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
