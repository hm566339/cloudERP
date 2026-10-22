import React from 'react';
import { AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

function AlertList({ alerts = [], loading = false, emptyMessage = 'No alerts at this time.' }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm animate-pulse">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-[#1D212C] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-4 w-3/4 rounded" />
              <SkeletonBox className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <Bell className="mx-auto text-zinc-300 dark:text-[#2A2F3D] mb-3" size={32} />
        <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const getSeverityStyles = (severity) => {
    switch ((severity || 'INFO').toUpperCase()) {
      case 'HIGH':
        return { text: 'text-red-500', icon: AlertTriangle };
      case 'MEDIUM':
        return { text: 'text-amber-500', icon: AlertCircle };
      case 'LOW':
        return { text: 'text-blue-500', icon: Info };
      case 'INFO':
      default:
        return { text: 'text-zinc-500 dark:text-[#A0A6B5]', icon: Info };
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const { text, icon: Icon } = getSeverityStyles(alert.severity);
        return (
          <div key={alert.id || idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
            <Icon size={16} className={`${text} shrink-0`} />
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">{alert.title}</p>
              {alert.message && <p className="text-xs mt-0.5 text-zinc-500 dark:text-[#A0A6B5]">{alert.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(AlertList);
