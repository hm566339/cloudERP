import React from 'react';
import {
  CheckCircle2, Clock, User, AlertCircle, ShieldCheck,
} from 'lucide-react';
import WorkflowStatusBadge from './WorkflowStatusBadge';

export default function WorkflowTaskPanel({
  tasks = [],
  currentTaskId = null,
}) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center text-xs text-zinc-500">
        No approval tasks generated yet for this transaction.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Assigned Tasks & Approvers</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Authoritative list of approval assignments</p>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
          {tasks.length} task{tasks.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {tasks.map((task) => {
          const isCurrent = task.id === currentTaskId;
          const isPending = task.taskStatus === 'PENDING';

          return (
            <div
              key={task.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isCurrent ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    task.taskStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : task.taskStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}
                >
                  <User size={15} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">
                      {task.stageName || `Stage ${task.stageSequence || 1}`}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        Your Active Task
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 mt-0.5">
                    Assigned to: <strong className="font-semibold text-zinc-800">{task.assignedRoleName || task.assignedUserId || 'Unassigned'}</strong>
                    {task.delegatedFromUserId && (
                      <span className="text-[11px] text-zinc-400 ml-1.5">
                        (Delegated from {task.delegatedFromUserId})
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1">
                    {task.assignedAt && (
                      <span>Assigned: {new Date(task.assignedAt).toLocaleString()}</span>
                    )}
                    {task.dueAt && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock size={11} />
                        Due: {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {task.comments && (
                    <div className="mt-2 text-xs bg-zinc-50 border border-zinc-200/60 rounded-md p-2 text-zinc-700 italic">
                      &ldquo;{task.comments}&rdquo;
                      {task.completedByName && (
                        <span className="not-italic font-semibold text-zinc-500 ml-1">
                          — {task.completedByName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <WorkflowStatusBadge status={task.taskStatus} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
