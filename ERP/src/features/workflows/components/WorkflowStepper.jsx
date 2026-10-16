import React from 'react';
import {
  Check, Clock, ShieldCheck, Users, AlertCircle, ChevronRight,
} from 'lucide-react';

export default function WorkflowStepper({
  stages = [],
  currentStageId = null,
  currentStageSequence = 1,
  status = 'PENDING',
}) {
  if (!stages || stages.length === 0) {
    return null;
  }

  // Sort stages by sequenceNo / stageOrder
  const sortedStages = [...stages].sort((a, b) => (a.sequenceNo ?? a.stageOrder ?? 0) - (b.sequenceNo ?? b.stageOrder ?? 0));
  const isWorkflowCompleted = status === 'APPROVED' || status === 'COMPLETED';
  const isWorkflowRejected = status === 'REJECTED';

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Workflow Approval Stages</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {sortedStages.length} stage{sortedStages.length > 1 ? 's' : ''} configured &bull; Authoritative state machine
          </p>
        </div>
        <div className="text-xs font-semibold text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200">
          Sequence: {currentStageSequence || 1} of {sortedStages.length}
        </div>
      </div>

      <div className="relative">
        {/* Horizontal connector line on medium+ screens */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-zinc-200 -z-0" />

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
          {sortedStages.map((stage, idx) => {
            const seq = stage.sequenceNo ?? stage.stageOrder ?? (idx + 1);
            const isCurrent = stage.id === currentStageId || (!currentStageId && seq === currentStageSequence);
            const isCompleted = isWorkflowCompleted || seq < currentStageSequence;
            const isFailed = isCurrent && isWorkflowRejected;

            let stepColor = 'bg-zinc-100 text-zinc-400 border-zinc-300';
            let badgeText = 'Upcoming';
            let badgeColor = 'bg-zinc-100 text-zinc-500';

            if (isCompleted) {
              stepColor = 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200';
              badgeText = 'Completed';
              badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (isFailed) {
              stepColor = 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200';
              badgeText = 'Rejected';
              badgeColor = 'bg-red-50 text-red-700 border-red-200';
            } else if (isCurrent) {
              stepColor = 'bg-zinc-900 text-white border-zinc-900 ring-4 ring-blue-50 shadow-sm shadow-blue-200';
              badgeText = 'In Review';
              badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
            }

            const approvers = stage.approvers || [];
            const primaryApprover = approvers[0];
            const approverLabel = primaryApprover?.roleName || primaryApprover?.userName || 'Assigned Approver';

            return (
              <div
                key={stage.id || `stage-${seq}`}
                className={`flex flex-col p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-blue-300 bg-blue-50/40 shadow-sm'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${stepColor} ${
                      isCurrent ? 'scale-110' : ''
                    }`}
                  >
                    {isCompleted ? <Check size={16} strokeWidth={2.5} /> : seq}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-800 truncate" title={stage.stageName}>
                    {stage.stageName || `Stage ${seq}`}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1 truncate">
                    <Users size={12} className="shrink-0 text-zinc-400" />
                    <span className="truncate">{approverLabel}</span>
                  </div>

                  {stage.sla && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1.5 pt-1.5 border-t border-zinc-100">
                      <Clock size={11} className="shrink-0 text-amber-500" />
                      <span>{stage.sla.durationHours ? `${stage.sla.durationHours}h SLA` : 'Standard SLA'}</span>
                    </div>
                  )}

                  {stage.isMandatory && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                      <ShieldCheck size={11} className="shrink-0" />
                      <span>Mandatory Stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
