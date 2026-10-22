import React from 'react';
import {
  CheckCircle2, XCircle, RotateCcw, Clock, ArrowRight, User, ShieldCheck,
} from 'lucide-react';

const ACTION_ICONS = {
  SUBMIT: { icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  APPROVE: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  REJECT: { icon: XCircle, color: 'text-red-500 bg-red-50 border-red-200' },
  RETURN: { icon: RotateCcw, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  DELEGATE: { icon: User, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  CANCEL: { icon: XCircle, color: 'text-zinc-500 bg-zinc-50 border-zinc-200' },
};

export default function WorkflowTimeline({ auditTrail = [] }) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-6 text-center text-xs text-zinc-400">
        No workflow actions recorded in audit trail yet.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-4 sm:p-5 shadow-sm">
      <div className="mb-4 pb-3 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Immutable Audit Trail</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Chronological history of all executed transitions</p>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
          {auditTrail.length} action{auditTrail.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
        {auditTrail.map((action, idx) => {
          const actionConfig = ACTION_ICONS[action.actionType] || {
            icon: Clock,
            color: 'text-zinc-500 bg-zinc-50 border-zinc-200',
          };
          const Icon = actionConfig.icon;

          return (
            <div key={action.id || `action-${idx}`} className="relative flex items-start gap-3 text-xs">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${actionConfig.color}`}
              >
                <Icon size={11} strokeWidth={2.5} />
              </div>

              <div className="min-w-0 flex-1 bg-zinc-50/70 border border-zinc-200/80 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-800 uppercase tracking-wide text-[11px]">
                      {action.actionType}
                    </span>
                    <span className="text-zinc-400">&bull;</span>
                    <span className="text-zinc-600 font-medium">
                      {action.performedByName || 'System'}
                    </span>
                  </div>

                  <span className="text-[11px] text-zinc-400">
                    {action.createdAt ? new Date(action.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                {action.previousStatus && action.newStatus && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 my-1">
                    <span className="font-medium text-zinc-600">{action.previousStatus}</span>
                    <ArrowRight size={10} className="text-zinc-400" />
                    <span className="font-bold text-zinc-800">{action.newStatus}</span>
                  </div>
                )}

                {action.comments && (
                  <p className="mt-1 text-zinc-700 italic bg-white p-2 rounded border border-zinc-100">
                    &ldquo;{action.comments}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
