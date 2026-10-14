import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, User } from 'lucide-react';
import { resolveRoleName } from '../services/workflowService';
import WorkflowToggle from './WorkflowToggle';

export default function WorkflowDiagram({
  workflow,
  canEdit,
  onUpdateStep,
  onRemoveStep,
  onMoveStep,
  onAddStep,
  roles = [],
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-800">Workflow sequence</p>
          <p className="text-[11px] text-zinc-500">Step ordering with explicit sequence controls</p>
        </div>
        <button
          type="button"
          className="btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold shadow-sm"
          disabled={!canEdit}
          onClick={onAddStep}
        >
          <Plus size={13} />
          <span>Add step</span>
        </button>
      </div>

      <div className="relative space-y-3 pl-1 pr-1 before:absolute before:bottom-6 before:left-[18px] before:top-6 before:w-0.5 before:bg-zinc-200">
        {workflow.steps.map((step, index) => (
          <div key={step.id} className="relative flex items-start gap-3">
            <div
              className={`z-10 mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white text-xs font-bold transition-all ${
                step.active
                  ? 'border-zinc-900 text-zinc-900 shadow-sm'
                  : 'border-zinc-300 text-zinc-400'
              }`}
            >
              {index + 1}
            </div>

            <div className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <input
                    aria-label={`Step ${index + 1} name`}
                    disabled={!canEdit}
                    value={step.title}
                    onChange={(e) => onUpdateStep(step.id, { title: e.target.value })}
                    className="w-full border-0 bg-transparent p-0 text-xs sm:text-sm font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 rounded px-1 -mx-1"
                  />
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                      <User size={11} className="text-zinc-500" />
                      {resolveRoleName(step.role, roles) || 'Role not assigned'}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-600 font-medium capitalize">
                      {step.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <WorkflowToggle
                    label={`Activate ${step.title}`}
                    checked={step.active}
                    disabled={!canEdit}
                    onChange={(value) => onUpdateStep(step.id, { active: value })}
                  />
                  <div className="h-4 w-px bg-zinc-200 mx-0.5" />
                  <button
                    title="Move up"
                    type="button"
                    disabled={!canEdit || index === 0}
                    onClick={() => onMoveStep(index, -1)}
                    className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    title="Move down"
                    type="button"
                    disabled={!canEdit || index === workflow.steps.length - 1}
                    onClick={() => onMoveStep(index, 1)}
                    className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    title="Remove step"
                    type="button"
                    disabled={!canEdit || workflow.steps.length <= 1}
                    onClick={() => onRemoveStep(step.id)}
                    className="p-1 rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
