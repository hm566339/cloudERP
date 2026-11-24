import React from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import EmptyState from '../../../../../components/common/EmptyState';

const getPriorityClass = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
    case 'URGENT':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'LOW':
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  }
};

/**
 * Tasks Section for Lead Details.
 */
export default function LeadTasksSection({ tasks = [], onNewTask, onToggleTask }) {
  const count = tasks.length;

  return (
    <CrmTabCard
      title="Associated Action Items & Tasks"
      count={count}
      action={
        <button
          onClick={onNewTask}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} /> New Task
        </button>
      }
    >
      {count === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No pending tasks"
          description="Schedule a follow-up call, send a quote, or assign an action item for this lead."
          actionText="Create First Task"
          onAction={onNewTask}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isDone = task.status === 'COMPLETED' || task.isCompleted;
            const dueDateStr = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No due date';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-zinc-50/50 dark:bg-[#1D212C]/50 border-zinc-200/50 dark:border-[#2A2F3D]/50 opacity-70'
                    : 'bg-white dark:bg-[#1D212C] border-zinc-200/80 dark:border-[#2A2F3D] shadow-xs hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => onToggleTask && onToggleTask(task)}
                    className="mt-0.5 text-zinc-400 hover:text-primary transition-colors shrink-0"
                    title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] ${
                        isDone ? 'line-through text-zinc-400 dark:text-[#6B7184]' : ''
                      }`}
                    >
                      {task.title || 'Untitled Task'}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityClass(
                      task.priority
                    )}`}
                  >
                    {task.priority || 'MEDIUM'}
                  </span>

                  <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={13} className="text-zinc-400" /> {dueDateStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CrmTabCard>
  );
}
