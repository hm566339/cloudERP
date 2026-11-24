import React from 'react';
import {
  Phone,
  Mail,
  Users,
  FileText,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import EmptyState from '../../../../../components/common/EmptyState';

const getActivityIcon = (type) => {
  switch (type?.toUpperCase()) {
    case 'CALL':
      return Phone;
    case 'EMAIL':
      return Mail;
    case 'MEETING':
      return Users;
    case 'TASK':
      return CheckCircle;
    case 'MESSAGE':
    case 'WHATSAPP':
      return MessageSquare;
    default:
      return FileText;
  }
};

const getOutcomeBadgeClass = (outcome) => {
  switch (outcome?.toUpperCase()) {
    case 'CONNECTED':
    case 'COMPLETED':
    case 'WON':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    case 'NO_ANSWER':
    case 'BUSY':
    case 'RESCHEDULED':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    case 'CANCELLED':
    case 'WRONG_NUMBER':
    case 'LOST':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-[#A0A6B5]';
  }
};

/**
 * Activity Timeline Section for Lead Details.
 */
export default function LeadActivitiesSection({ activities = [], onLogActivity }) {
  const count = activities.length;

  return (
    <CrmTabCard
      title="Activity & Interaction Trail"
      count={count}
      action={
        <button
          onClick={onLogActivity}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} /> Log Activity
        </button>
      }
    >
      {count === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No activities recorded yet"
          description="Log phone calls, client meetings, email updates, or notes to track interactions with this lead."
          actionText="Log First Activity"
          onAction={onLogActivity}
        />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-[#2A2F3D]">
          {activities.map((act, index) => {
            const Icon = getActivityIcon(act.activityType);
            const dateStr = act.createdAt
              ? new Date(act.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Recently';

            return (
              <div key={act.id || index} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-[#161922] border-2 border-primary flex items-center justify-center text-primary shadow-xs">
                  <Icon size={10} />
                </div>

                {/* Activity Box */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3D4457] transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {act.activityType || 'NOTE'}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                        {act.subject || 'Activity Note'}
                      </h4>
                      {act.outcome && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getOutcomeBadgeClass(
                            act.outcome
                          )}`}
                        >
                          {act.outcome}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-[#6B7184] flex items-center gap-1">
                      <Clock size={12} /> {dateStr}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] leading-relaxed whitespace-pre-wrap">
                      {act.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400 dark:text-[#6B7184]">
                    {act.durationMinutes > 0 && (
                      <span>Duration: {act.durationMinutes} min</span>
                    )}
                    {act.createdByName && (
                      <span>Logged by: {act.createdByName}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CrmTabCard>
  );
}
