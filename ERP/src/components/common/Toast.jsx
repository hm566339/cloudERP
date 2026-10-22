import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { removeAlert } from '../../features/notifications/notificationSlice';

/**
 * Standard Toast alert item.
 */
export function ToastItem({
  type = 'info',
  message,
  onClose,
  duration = 5000,
}) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-[#34C38F]" />,
      bg: 'bg-emerald-50/90 dark:bg-[#1D212C] border-emerald-200/80 dark:border-[#34C38F]/30 text-emerald-950 dark:text-[#E6E8EE]',
    },
    error: {
      icon: <AlertCircle size={16} className="text-rose-600 dark:text-[#F0616D]" />,
      bg: 'bg-rose-50/90 dark:bg-[#1D212C] border-rose-200/80 dark:border-[#F0616D]/30 text-rose-950 dark:text-[#E6E8EE]',
    },
    warning: {
      icon: <AlertTriangle size={16} className="text-amber-600 dark:text-[#F5B544]" />,
      bg: 'bg-amber-50/90 dark:bg-[#1D212C] border-amber-200/80 dark:border-[#F5B544]/30 text-amber-950 dark:text-[#E6E8EE]',
    },
    info: {
      icon: <Info size={16} className="text-zinc-600 dark:text-[#38BDF8]" />,
      bg: 'bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE]',
    },
  };

  const current = config[type] || config.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-slide-up text-xs font-medium leading-relaxed ${current.bg}`}
    >
      <div className="shrink-0 mt-0.5">{current.icon}</div>
      <div className="flex-1 pr-2 break-words">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss toast"
          className="shrink-0 p-1 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-700 dark:hover:text-[#E6E8EE] rounded-md transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Global Toast Container that connects to Redux notifications.
 */
export default function ToastContainer() {
  const alerts = useAppSelector((state) => state.notification?.alerts || []);
  const dispatch = useAppDispatch();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <ToastItem
            type={alert.type}
            message={alert.message}
            onClose={() => dispatch(removeAlert(alert.id))}
          />
        </div>
      ))}
    </div>
  );
}
