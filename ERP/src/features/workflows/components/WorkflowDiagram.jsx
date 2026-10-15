import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit3,
  Eye,
  GitBranch,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { resolveRoleId, resolveRoleName } from '../services/workflowService';
import WorkflowToggle from './WorkflowToggle';
import ConfirmModal from '../../../components/common/ConfirmModal';

const STEP_TYPES = [
  { id: 'approval', label: 'Approval', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'review', label: 'Review', icon: Eye, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'notification', label: 'Notification', icon: Bell, color: 'text-purple-700 bg-purple-50 border-purple-200' },
];

export default function WorkflowDiagram({
  workflow,
  canEdit = true,
  onUpdateStep,
  onRemoveStep,
  onMoveStep,
  onAddStep,
  onDuplicateStep,
  roles = [],
  editingStepId = null,
  setEditingStepId,
}) {
  const [internalEditingId, setInternalEditingId] = useState(null);
  const [stepToDelete, setStepToDelete] = useState(null);

  const activeEditingId = editingStepId !== undefined ? editingStepId : internalEditingId;
  const setActiveEditingId = (id) => {
    if (setEditingStepId) {
      setEditingStepId(id);
    } else {
      setInternalEditingId(id);
    }
  };

  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];

  const handleAddStepClick = () => {
    if (!canEdit || !onAddStep) return;
    const newId = onAddStep();
    if (newId) {
      setActiveEditingId(newId);
    }
  };

  const handleDuplicateClick = (stepId) => {
    if (!canEdit) return;
    if (onDuplicateStep) {
      const duplicatedId = onDuplicateStep(stepId);
      if (duplicatedId) {
        setActiveEditingId(duplicatedId);
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (!stepToDelete) return;
    onRemoveStep(stepToDelete.id);
    if (activeEditingId === stepToDelete.id) {
      setActiveEditingId(null);
    }
    setStepToDelete(null);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-800">Workflow sequence</p>
          <p className="text-[11px] text-zinc-500">Step ordering with explicit sequence controls</p>
        </div>
        <button
          type="button"
          className="btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold shadow-sm transition-colors disabled:opacity-40"
          disabled={!canEdit}
          onClick={handleAddStepClick}
        >
          <Plus size={13} />
          <span>Add step</span>
        </button>
      </div>

      <div className="relative space-y-3 pl-1 pr-1 before:absolute before:bottom-6 before:left-[18px] before:top-6 before:w-0.5 before:bg-zinc-200">
        {steps.map((step, index) => {
          const isEditing = activeEditingId === step.id;
          const currentStepType = (step.type || 'approval').toLowerCase();
          const typeConfig = STEP_TYPES.find((t) => t.id === currentStepType) || STEP_TYPES[0];
          const TypeIcon = typeConfig.icon;
          const currentRoleVal = step.role || step.roleId || step.roleName || '';
          const currentRoleId = resolveRoleId(currentRoleVal, roles);
          const currentRoleName = resolveRoleName(currentRoleVal, roles);

          return (
            <div key={step.id || `step-${index}`} className="relative flex items-start gap-3">
              {/* Sequence number badge */}
              <div
                className={`z-10 mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white text-xs font-bold transition-all ${
                  step.active !== false
                    ? 'border-zinc-900 text-zinc-900 shadow-sm'
                    : 'border-zinc-300 text-zinc-400'
                }`}
              >
                {index + 1}
              </div>

              {/* Step Card */}
              <div
                className={`min-w-0 flex-1 rounded-xl border bg-white shadow-sm transition-all ${
                  isEditing
                    ? 'border-zinc-900 ring-1 ring-zinc-900/10'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow'
                }`}
              >
                {/* Header Row */}
                <div className="p-3 sm:p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`Step ${index + 1} name`}
                          disabled={!canEdit}
                          value={step.title || step.stageName || ''}
                          onChange={(e) =>
                            onUpdateStep(step.id, {
                              title: e.target.value,
                              stageName: e.target.value,
                            })
                          }
                          className="w-full max-w-sm border-0 bg-transparent p-0 text-xs sm:text-sm font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 rounded px-1 -mx-1"
                          placeholder="Step Name (e.g. Initial Approval)"
                        />
                      </div>

                      {/* Summary Badges */}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                        {/* Role Badge (for Approval & Review) */}
                        {currentStepType !== 'condition' && currentStepType !== 'notification' && (
                          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium border border-zinc-200/60">
                            <User size={11} className="text-zinc-500" />
                            {currentRoleName || 'Role not assigned'}
                          </span>
                        )}

                        {/* Step Type Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeConfig.color}`}
                        >
                          <TypeIcon size={11} />
                          {typeConfig.label}
                        </span>

                        {/* Condition info badge */}
                        {currentStepType === 'condition' && step.ruleExpression && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[10px]">
                            {step.ruleExpression}
                          </span>
                        )}

                        {/* Notification info badge */}
                        {currentStepType === 'notification' && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            <Mail size={10} />
                            {step.notificationChannel === 'EMAIL'
                              ? 'Email'
                              : step.notificationChannel === 'IN_APP_AND_EMAIL'
                              ? 'In-App & Email'
                              : 'In-App'}
                          </span>
                        )}

                        {/* Approval Rule badge */}
                        {(currentStepType === 'approval' || currentStepType === 'review') && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {step.approvalRule === 'ALL_MUST_APPROVE'
                              ? '• All must approve'
                              : step.approvalRule === 'MINIMUM_REQUIRED'
                              ? `• ${step.minimumApprovalsRequired || 1} approvals required`
                              : '• Any can approve'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <WorkflowToggle
                        label={`Activate ${step.title || 'Step'}`}
                        checked={step.active !== false}
                        disabled={!canEdit}
                        onChange={(value) => onUpdateStep(step.id, { active: value })}
                      />
                      <div className="h-4 w-px bg-zinc-200 mx-0.5" />
                      <button
                        title="Move up"
                        type="button"
                        disabled={!canEdit || index === 0}
                        onClick={() => onMoveStep(index, -1)}
                        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        title="Move down"
                        type="button"
                        disabled={!canEdit || index === steps.length - 1}
                        onClick={() => onMoveStep(index, 1)}
                        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        title="Duplicate step"
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleDuplicateClick(step.id)}
                        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        title={isEditing ? 'Collapse step details' : 'Edit step details'}
                        type="button"
                        onClick={() => setActiveEditingId(isEditing ? null : step.id)}
                        className={`p-1 rounded-md transition-colors ${
                          isEditing
                            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                      >
                        {isEditing ? <ChevronUp size={13} /> : <Edit3 size={13} />}
                      </button>
                      <button
                        title="Remove step"
                        type="button"
                        disabled={!canEdit || steps.length <= 1}
                        onClick={() => setStepToDelete(step)}
                        className="p-1 rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Step Configuration Drawer / Form */}
                {isEditing && (
                  <div className="border-t border-zinc-100 bg-zinc-50/70 p-3.5 rounded-b-xl space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                        Step Configuration — Step {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveEditingId(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900"
                      >
                        <Check size={12} className="text-emerald-600" />
                        <span>Done</span>
                      </button>
                    </div>

                    {/* Step Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Step Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        value={step.title || step.stageName || ''}
                        disabled={!canEdit}
                        onChange={(e) =>
                          onUpdateStep(step.id, {
                            title: e.target.value,
                            stageName: e.target.value,
                          })
                        }
                        placeholder="e.g. Finance Controller Review"
                      />
                      {!step.title && !step.stageName && (
                        <p className="text-[10px] text-red-600 font-medium">Step name is required.</p>
                      )}
                    </div>

                    {/* Step Type Selection Pills */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Step Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STEP_TYPES.map((type) => {
                          const IconComp = type.icon;
                          const isSelected = currentStepType === type.id;
                          return (
                            <button
                              type="button"
                              key={type.id}
                              disabled={!canEdit}
                              onClick={() => onUpdateStep(step.id, { type: type.id })}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                              }`}
                            >
                              <IconComp size={12} />
                              <span>{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional Fields: Approval / Review */}
                    {(currentStepType === 'approval' || currentStepType === 'review') && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Assigned Role or Approver <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50"
                            disabled={!canEdit}
                            value={currentRoleId}
                            onChange={(e) =>
                              onUpdateStep(step.id, {
                                role: e.target.value,
                                roleId: e.target.value,
                                roleName: resolveRoleName(e.target.value, roles),
                              })
                            }
                          >
                            <option value="">Select assigned role</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Approval Rule
                          </label>
                          <select
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50"
                            disabled={!canEdit}
                            value={step.approvalRule || 'ANY_ONE'}
                            onChange={(e) =>
                              onUpdateStep(step.id, {
                                approvalRule: e.target.value,
                                executionType: e.target.value === 'ALL_MUST_APPROVE' ? 'PARALLEL' : 'SEQUENTIAL',
                              })
                            }
                          >
                            <option value="ANY_ONE">Any single approver can approve</option>
                            <option value="ALL_MUST_APPROVE">Everyone assigned must approve</option>
                            <option value="MINIMUM_REQUIRED">Minimum required approvals threshold</option>
                          </select>
                        </div>

                        {step.approvalRule === 'MINIMUM_REQUIRED' && (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Minimum Approvals Required
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              disabled={!canEdit}
                              className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                              value={step.minimumApprovalsRequired || 1}
                              onChange={(e) =>
                                onUpdateStep(step.id, {
                                  minimumApprovalsRequired: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            SLA Turnaround (Hours)
                          </label>
                          <div className="relative">
                            <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="number"
                              min="1"
                              disabled={!canEdit}
                              placeholder="24"
                              className="w-full h-8 pl-7 pr-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                              value={step.sla?.durationHours || ''}
                              onChange={(e) =>
                                onUpdateStep(step.id, {
                                  sla: {
                                    ...(step.sla || {}),
                                    durationHours: parseInt(e.target.value, 10) || undefined,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields: Condition */}
                    {currentStepType === 'condition' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Rule Condition Expression
                          </label>
                          <input
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                            disabled={!canEdit}
                            placeholder="e.g. amount > 50000 or customer.tier == 'VIP'"
                            value={step.ruleExpression || ''}
                            onChange={(e) => onUpdateStep(step.id, { ruleExpression: e.target.value })}
                          />
                          <p className="text-[10px] text-zinc-400">
                            Transaction proceeds only when this condition evaluates to true.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            If Condition Fails
                          </label>
                          <select
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            disabled={!canEdit}
                            value={step.rejectionAction || 'REJECT_DOCUMENT'}
                            onChange={(e) => onUpdateStep(step.id, { rejectionAction: e.target.value })}
                          >
                            <option value="REJECT_DOCUMENT">Reject document</option>
                            <option value="RETURN_TO_INITIATOR">Return to initiator for correction</option>
                            <option value="SKIP_STEP">Skip to next approval step</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields: Notification */}
                    {currentStepType === 'notification' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Notification Channel
                          </label>
                          <select
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                            disabled={!canEdit}
                            value={step.notificationChannel || 'IN_APP'}
                            onChange={(e) => onUpdateStep(step.id, { notificationChannel: e.target.value })}
                          >
                            <option value="IN_APP">In-App Notification</option>
                            <option value="EMAIL">Email Alert</option>
                            <option value="IN_APP_AND_EMAIL">Email &amp; In-App Notification</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Notification Template / Subject
                          </label>
                          <input
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                            disabled={!canEdit}
                            placeholder="e.g. Transaction requires review"
                            value={step.notificationMessage || ''}
                            onChange={(e) => onUpdateStep(step.id, { notificationMessage: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Step Confirmation Modal */}
      <ConfirmModal
        open={Boolean(stepToDelete)}
        isDestructive
        title="Delete Step"
        message={stepToDelete ? `Delete step "${stepToDelete.title || stepToDelete.stageName || 'Step'}"?` : ''}
        details="This will permanently remove this approval step from the workflow sequence. Step ordering will adjust automatically."
        confirmLabel="Delete Step"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setStepToDelete(null)}
        zIndex={10000}
      />
    </div>
  );
}
