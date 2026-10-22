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
import CustomSelect from '../../../components/common/CustomSelect';

const STEP_TYPES = [
  { id: 'approval', label: 'Approval', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-[#34C38F] dark:bg-[#34C38F]/15 dark:border-[#34C38F]/30' },
  { id: 'review', label: 'Review', icon: Eye, color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-[#4C8DFF] dark:bg-[#4C8DFF]/15 dark:border-[#4C8DFF]/30' },
  { id: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-[#F5B544] dark:bg-[#F5B544]/15 dark:border-[#F5B544]/30' },
  { id: 'notification', label: 'Notification', icon: Bell, color: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-800/40' },
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
    <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3.5 sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-800 dark:text-[#E6E8EE]">Workflow sequence</p>
          <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Step ordering with explicit sequence controls</p>
        </div>
        <button
          type="button"
          className="btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-700 dark:text-[#E6E8EE] font-semibold shadow-sm transition-colors disabled:opacity-40"
          disabled={!canEdit}
          onClick={handleAddStepClick}
        >
          <Plus size={13} />
          <span>Add step</span>
        </button>
      </div>

      <div className="relative space-y-3 pl-1 pr-1 before:absolute before:bottom-6 before:left-[18px] before:top-6 before:w-0.5 before:bg-zinc-200 dark:before:bg-[#2A2F3D]">
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
                className={`z-10 mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-[#161922] text-xs font-bold transition-all ${
                  step.active !== false
                    ? 'border-zinc-900 dark:border-[#E6E8EE] text-zinc-900 dark:text-[#E6E8EE] shadow-sm'
                    : 'border-zinc-300 dark:border-[#2A2F3D] text-zinc-400 dark:text-zinc-500'
                }`}
              >
                {index + 1}
              </div>

              {/* Step Card */}
              <div
                className={`min-w-0 flex-1 rounded-xl border bg-white dark:bg-[#161922] shadow-sm transition-all ${
                  isEditing
                    ? 'border-zinc-900 dark:border-primary ring-1 ring-zinc-900/10 dark:ring-primary/20'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow'
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
                          className="w-full max-w-sm border-0 bg-transparent p-0 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary rounded px-1 -mx-1"
                          placeholder="Step Name (e.g. Initial Approval)"
                        />
                      </div>

                      {/* Summary Badges */}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#A0A6B5] flex-wrap">
                        {/* Role Badge (for Approval & Review) */}
                        {currentStepType !== 'condition' && currentStepType !== 'notification' && (
                          <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] px-2 py-0.5 rounded-md font-medium border border-zinc-200/60 dark:border-[#2A2F3D]">
                            <User size={11} className="text-zinc-500 dark:text-[#A0A6B5]" />
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
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-md font-mono text-[10px]">
                            {step.ruleExpression}
                          </span>
                        )}

                        {/* Notification info badge */}
                        {currentStepType === 'notification' && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 px-2 py-0.5 rounded-md text-[10px] font-medium">
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
                          <span className="text-[10px] text-zinc-400 dark:text-[#A0A6B5] font-medium">
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
                      <div className="h-4 w-px bg-zinc-200 dark:bg-[#2A2F3D] mx-0.5" />
                      <button
                        title="Move up"
                        type="button"
                        disabled={!canEdit || index === 0}
                        onClick={() => onMoveStep(index, -1)}
                        className="p-1 rounded-md text-zinc-400 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] hover:text-zinc-700 dark:hover:text-[#E6E8EE] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        title="Move down"
                        type="button"
                        disabled={!canEdit || index === steps.length - 1}
                        onClick={() => onMoveStep(index, 1)}
                        className="p-1 rounded-md text-zinc-400 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] hover:text-zinc-700 dark:hover:text-[#E6E8EE] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        title="Duplicate step"
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleDuplicateClick(step.id)}
                        className="p-1 rounded-md text-zinc-400 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] hover:text-zinc-700 dark:hover:text-[#E6E8EE] disabled:opacity-30 transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        title={isEditing ? 'Collapse step details' : 'Edit step details'}
                        type="button"
                        onClick={() => setActiveEditingId(isEditing ? null : step.id)}
                        className={`p-1 rounded-md transition-colors ${
                          isEditing
                            ? 'bg-zinc-900 dark:bg-primary text-white hover:bg-zinc-800 dark:hover:bg-primary-600'
                            : 'text-zinc-400 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] hover:text-zinc-700 dark:hover:text-[#E6E8EE]'
                        }`}
                      >
                        {isEditing ? <ChevronUp size={13} /> : <Edit3 size={13} />}
                      </button>
                      <button
                        title="Remove step"
                        type="button"
                        disabled={!canEdit || steps.length <= 1}
                        onClick={() => setStepToDelete(step)}
                        className="p-1 rounded-md text-zinc-400 dark:text-[#A0A6B5] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Step Configuration Drawer / Form */}
                {isEditing && (
                  <div className="border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/70 p-3.5 rounded-b-xl space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-[#2A2F3D] pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-[#E6E8EE]">
                        Step Configuration — Step {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveEditingId(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE]"
                      >
                        <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Done</span>
                      </button>
                    </div>

                    {/* Step Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                        Step Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors"
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
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
                                  ? 'border-zinc-900 dark:border-primary bg-zinc-900 dark:bg-primary text-white shadow-sm'
                                  : 'border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-zinc-600'
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            Assigned Role or Approver <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            id="step-assigned-role"
                            disabled={!canEdit}
                            searchable
                            placeholder="Select assigned role"
                            emptyMessage="No roles available"
                            value={currentRoleId}
                            onChange={(e, val) => {
                              const selectedVal = val !== undefined ? val : e?.target?.value;
                              onUpdateStep(step.id, {
                                role: selectedVal,
                                roleId: selectedVal,
                                roleName: resolveRoleName(selectedVal, roles),
                              });
                            }}
                            options={roles.map((r) => ({ value: r.id, label: r.name }))}
                            size="sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            Approval Rule
                          </label>
                          <CustomSelect
                            id="step-approval-rule"
                            disabled={!canEdit}
                            value={step.approvalRule || 'ANY_ONE'}
                            onChange={(e, val) => {
                              const selectedVal = val !== undefined ? val : e?.target?.value;
                              onUpdateStep(step.id, {
                                approvalRule: selectedVal,
                                executionType: selectedVal === 'ALL_MUST_APPROVE' ? 'PARALLEL' : 'SEQUENTIAL',
                              });
                            }}
                            options={[
                              { value: 'ANY_ONE', label: 'Any single approver can approve' },
                              { value: 'ALL_MUST_APPROVE', label: 'Everyone assigned must approve' },
                              { value: 'MINIMUM_REQUIRED', label: 'Minimum required approvals threshold' },
                            ]}
                            size="sm"
                          />
                        </div>

                        {step.approvalRule === 'MINIMUM_REQUIRED' && (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                              Minimum Approvals Required
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              disabled={!canEdit}
                              className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-[#E6E8EE] focus:outline-none focus:border-zinc-900 dark:focus:border-primary"
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            SLA Turnaround (Hours)
                          </label>
                          <div className="relative">
                            <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                            <input
                              type="number"
                              min="1"
                              disabled={!canEdit}
                              placeholder="24"
                              className="w-full h-8 pl-7 pr-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-[#E6E8EE] focus:outline-none focus:border-zinc-900 dark:focus:border-primary"
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
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            Rule Condition Expression
                          </label>
                          <input
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-[#E6E8EE] font-mono placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary"
                            disabled={!canEdit}
                            placeholder="e.g. amount > 50000 or customer.tier == 'VIP'"
                            value={step.ruleExpression || ''}
                            onChange={(e) => onUpdateStep(step.id, { ruleExpression: e.target.value })}
                          />
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            Transaction proceeds only when this condition evaluates to true.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            If Condition Fails
                          </label>
                          <CustomSelect
                            id="step-if-condition-fails"
                            disabled={!canEdit}
                            value={step.rejectionAction || 'REJECT_DOCUMENT'}
                            onChange={(e, val) => {
                              const selectedVal = val !== undefined ? val : e?.target?.value;
                              onUpdateStep(step.id, { rejectionAction: selectedVal });
                            }}
                            options={[
                              { value: 'REJECT_DOCUMENT', label: 'Reject document' },
                              { value: 'RETURN_TO_INITIATOR', label: 'Return to initiator for correction' },
                              { value: 'SKIP_STEP', label: 'Skip to next approval step' },
                            ]}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields: Notification */}
                    {currentStepType === 'notification' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            Notification Channel
                          </label>
                          <CustomSelect
                            id="step-notification-channel"
                            disabled={!canEdit}
                            value={step.notificationChannel || 'IN_APP'}
                            onChange={(e, val) => {
                              const selectedVal = val !== undefined ? val : e?.target?.value;
                              onUpdateStep(step.id, { notificationChannel: selectedVal });
                            }}
                            options={[
                              { value: 'IN_APP', label: 'In-App Notification' },
                              { value: 'EMAIL', label: 'Email Alert' },
                              { value: 'IN_APP_AND_EMAIL', label: 'Email & In-App Notification' },
                            ]}
                            size="sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
                            Notification Template / Subject
                          </label>
                          <input
                            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary"
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
