import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  X, GitFork, AlertCircle, Plus, Trash2, Layers, Clock, Users,
  ArrowRight, Shield, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { platformWorkflowTemplatesApi } from '../../../api/account/workflowDefinitions';
import CustomSelect from '../../../components/common/CustomSelect';

const MODULE_OPTIONS = [
  { value: 'ACCOUNT', label: 'Accounting / Finance' },
  { value: 'SALES', label: 'Sales & Invoicing' },
  { value: 'PURCHASE', label: 'Purchase & Procurement' },
  { value: 'INVENTORY', label: 'Inventory Management' },
  { value: 'HRMS', label: 'HRMS & Payroll' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'FISCAL_YEAR', label: 'Fiscal Year Closing' },
  { value: 'JOURNAL_ENTRY', label: 'Journal Entry' },
  { value: 'PAYMENT_VOUCHER', label: 'Payment Voucher' },
  { value: 'QUOTATION', label: 'Sales Quotation' },
  { value: 'SALES_ORDER', label: 'Sales Order' },
  { value: 'INVOICE', label: 'Sales Invoice' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'PURCHASE_BILL', label: 'Purchase Bill' },
  { value: 'EXPENSE_CLAIM', label: 'Expense Claim' },
];

const ROLE_OPTIONS = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'PURCHASE_MANAGER', label: 'Purchase Manager' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'MANAGER', label: 'General Manager' },
];

const EXECUTION_TYPES = [
  { value: 'SEQUENTIAL', label: 'Sequential (In Order)' },
  { value: 'PARALLEL', label: 'Parallel (Simultaneous)' },
];

const REJECTION_ACTIONS = [
  { value: 'REJECT_DOCUMENT', label: 'Reject Document (End Workflow)' },
  { value: 'SEND_BACK', label: 'Send Back to Previous Stage' },
];

const ACTION_TYPES = [
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'SUBMIT', label: 'Submit' },
  { value: 'RETURN', label: 'Return / Send Back' },
];

const DEFAULT_STAGES = [
  {
    stageCode: 'REVIEW',
    stageName: 'Initial Review',
    sequenceNo: 1,
    executionType: 'SEQUENTIAL',
    minimumApprovalsRequired: 1,
    rejectionAction: 'REJECT_DOCUMENT',
    isMandatory: true,
    isActive: true,
    approvers: [
      {
        approverType: 'ROLE',
        roleName: 'ACCOUNTANT',
        approvalOrder: 1,
        isRequired: true,
        canDelegate: true,
      }
    ],
    sla: {
      durationHours: 24,
      reminderHours: 12,
      escalationAction: 'NOTIFY_MANAGER',
      escalateToRoleName: 'FINANCE_MANAGER',
    }
  },
  {
    stageCode: 'FINAL_APPROVAL',
    stageName: 'Final Approval',
    sequenceNo: 2,
    executionType: 'SEQUENTIAL',
    minimumApprovalsRequired: 1,
    rejectionAction: 'REJECT_DOCUMENT',
    isMandatory: true,
    isActive: true,
    approvers: [
      {
        approverType: 'ROLE',
        roleName: 'FINANCE_MANAGER',
        approvalOrder: 1,
        isRequired: true,
        canDelegate: true,
      }
    ],
    sla: {
      durationHours: 48,
      reminderHours: 24,
      escalationAction: 'NOTIFY_MANAGER',
      escalateToRoleName: 'OWNER',
    }
  }
];

const DEFAULT_TRANSITIONS = [
  { actionType: 'SUBMIT', sourceStageCode: '', targetStageCode: 'REVIEW', allowedRoles: 'OWNER,ACCOUNTANT' },
  { actionType: 'APPROVE', sourceStageCode: 'REVIEW', targetStageCode: 'FINAL_APPROVAL', allowedRoles: 'ACCOUNTANT' },
  { actionType: 'APPROVE', sourceStageCode: 'FINAL_APPROVAL', targetStageCode: '', allowedRoles: 'FINANCE_MANAGER' },
  { actionType: 'REJECT', sourceStageCode: 'REVIEW', targetStageCode: '', allowedRoles: 'ACCOUNTANT' },
  { actionType: 'REJECT', sourceStageCode: 'FINAL_APPROVAL', targetStageCode: '', allowedRoles: 'FINANCE_MANAGER' }
];

export default function PlatformWorkflowTemplateFormModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const isEdit = !!initialData;
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      templateCode: '',
      templateName: '',
      moduleName: 'ACCOUNT',
      documentType: 'FISCAL_YEAR',
      description: '',
      initiatedByRoleName: 'OWNER',
      customerScope: 'all',
      approvalThreshold: '',
      isApprovalRequired: true,
      isActive: true,
      isDefault: true,
      customerAcceptance: false,
      autoCreateOrder: false,
      emailNotifications: true,
      internalNotes: '',
      createNewVersion: false,
      stages: DEFAULT_STAGES,
      transitions: DEFAULT_TRANSITIONS,
    }
  });

  const { fields: stageFields, append: appendStage, remove: removeStage } = useFieldArray({
    control,
    name: 'stages'
  });

  const { fields: transitionFields, append: appendTransition, remove: removeTransition } = useFieldArray({
    control,
    name: 'transitions'
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          templateCode: initialData.templateCode || '',
          templateName: initialData.templateName || '',
          moduleName: initialData.moduleName || 'ACCOUNT',
          documentType: initialData.documentType || 'FISCAL_YEAR',
          description: initialData.description || '',
          initiatedByRoleName: initialData.initiatedByRoleName || 'OWNER',
          customerScope: initialData.customerScope || 'all',
          approvalThreshold: initialData.approvalThreshold ?? '',
          isApprovalRequired: initialData.isApprovalRequired ?? true,
          isActive: initialData.isActive ?? true,
          isDefault: initialData.isDefault ?? true,
          customerAcceptance: initialData.customerAcceptance ?? false,
          autoCreateOrder: initialData.autoCreateOrder ?? false,
          emailNotifications: initialData.emailNotifications ?? true,
          internalNotes: initialData.internalNotes || '',
          createNewVersion: false,
          stages: initialData.stages && initialData.stages.length > 0 ? initialData.stages.map((s, idx) => ({
            stageCode: s.stageCode || `STAGE_${idx + 1}`,
            stageName: s.stageName || `Stage ${idx + 1}`,
            sequenceNo: s.sequenceNo || idx + 1,
            executionType: s.executionType || 'SEQUENTIAL',
            minimumApprovalsRequired: s.minimumApprovalsRequired || 1,
            rejectionAction: s.rejectionAction || 'REJECT_DOCUMENT',
            isMandatory: s.isMandatory ?? true,
            isActive: s.isActive ?? true,
            approvers: s.approvers && s.approvers.length > 0 ? s.approvers.map((a, aIdx) => ({
              approverType: a.approverType || 'ROLE',
              roleName: a.roleName || 'MANAGER',
              approvalOrder: a.approvalOrder || aIdx + 1,
              isRequired: a.isRequired ?? true,
              canDelegate: a.canDelegate ?? true,
            })) : [
              { approverType: 'ROLE', roleName: 'MANAGER', approvalOrder: 1, isRequired: true, canDelegate: true }
            ],
            sla: s.sla ? {
              durationHours: s.sla.durationHours || 24,
              reminderHours: s.sla.reminderHours || 12,
              escalationAction: s.sla.escalationAction || 'NOTIFY_MANAGER',
              escalateToRoleName: s.sla.escalateToRoleName || 'ADMIN',
            } : {
              durationHours: 24,
              reminderHours: 12,
              escalationAction: 'NOTIFY_MANAGER',
              escalateToRoleName: 'ADMIN',
            }
          })) : DEFAULT_STAGES,
          transitions: initialData.transitions && initialData.transitions.length > 0 ? initialData.transitions.map(tr => ({
            actionType: tr.actionType || 'APPROVE',
            sourceStageCode: tr.sourceStageCode || '',
            targetStageCode: tr.targetStageCode || '',
            allowedRoles: tr.allowedRoles || '',
          })) : DEFAULT_TRANSITIONS
        });
      } else {
        reset({
          templateCode: '',
          templateName: '',
          moduleName: 'ACCOUNT',
          documentType: 'FISCAL_YEAR',
          description: '',
          initiatedByRoleName: 'OWNER',
          customerScope: 'all',
          approvalThreshold: '',
          isApprovalRequired: true,
          isActive: true,
          isDefault: true,
          customerAcceptance: false,
          autoCreateOrder: false,
          emailNotifications: true,
          internalNotes: '',
          createNewVersion: false,
          stages: DEFAULT_STAGES,
          transitions: DEFAULT_TRANSITIONS,
        });
      }
      setActiveTab('general');
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        stages: (formData.stages || []).map((stg, i) => ({
          ...stg,
          sequenceNo: i + 1,
          minimumApprovalsRequired: Number(stg.minimumApprovalsRequired) || 1,
          approvers: (stg.approvers || []).map((app, j) => ({
            ...app,
            approvalOrder: j + 1
          }))
        })),
        transitions: formData.transitions || []
      };

      if (isEdit) {
        await platformWorkflowTemplatesApi.update(initialData.id, payload);
        dispatch(addAlert({ type: 'success', message: 'Platform template updated successfully' }));
      } else {
        await platformWorkflowTemplatesApi.create(payload);
        dispatch(addAlert({ type: 'success', message: 'Platform template created successfully' }));
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || `Failed to ${isEdit ? 'update' : 'create'} template`
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStage = () => {
    const nextSeq = stageFields.length + 1;
    appendStage({
      stageCode: `STAGE_${nextSeq}`,
      stageName: `Stage ${nextSeq}`,
      sequenceNo: nextSeq,
      executionType: 'SEQUENTIAL',
      minimumApprovalsRequired: 1,
      rejectionAction: 'REJECT_DOCUMENT',
      isMandatory: true,
      isActive: true,
      approvers: [
        { approverType: 'ROLE', roleName: 'MANAGER', approvalOrder: 1, isRequired: true, canDelegate: true }
      ],
      sla: {
        durationHours: 24,
        reminderHours: 12,
        escalationAction: 'NOTIFY_MANAGER',
        escalateToRoleName: 'ADMIN',
      }
    });
  };

  const handleAddTransition = () => {
    appendTransition({
      actionType: 'APPROVE',
      sourceStageCode: '',
      targetStageCode: '',
      allowedRoles: 'OWNER,ADMIN'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-scale-up border border-zinc-200 dark:border-[#2A2F3D] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GitFork size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                {isEdit ? 'Edit Platform Template' : 'Create Platform Template'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                {isEdit ? 'Update platform global default workflow and propagate versions' : 'Configure a new global workflow template for organizations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-[#2A2F3D] px-6 bg-white dark:bg-[#161922] gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3.5 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Shield size={16} />
            <span>General Config</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            className={`py-3.5 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'stages'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers size={16} />
            <span>Stages & Approvers ({stageFields.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transitions')}
            className={`py-3.5 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'transitions'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowRight size={16} />
            <span>Transitions ({transitionFields.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Template Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('templateCode', { required: 'Template code is required' })}
                    placeholder="e.g. DEF_FY_CLOSE"
                    disabled={isEdit}
                    className="input-field uppercase font-mono text-xs"
                  />
                  {errors.templateCode && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.templateCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('templateName', { required: 'Template name is required' })}
                    placeholder="e.g. Standard Fiscal Year Approval"
                    className="input-field"
                  />
                  {errors.templateName && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.templateName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Module <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="moduleName"
                    rules={{ required: 'Module is required' }}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                        options={MODULE_OPTIONS}
                        placeholder="Select Module"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Document Type <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="documentType"
                    rules={{ required: 'Document type is required' }}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                        options={DOCUMENT_TYPE_OPTIONS}
                        placeholder="Select Document Type"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Initiated By Role
                  </label>
                  <Controller
                    control={control}
                    name="initiatedByRoleName"
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                        options={ROLE_OPTIONS}
                        placeholder="Select Initiator Role"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                    Approval Threshold (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('approvalThreshold')}
                    placeholder="e.g. 50000"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Describe the purpose of this default workflow..."
                  className="input-field resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#11131a] border border-zinc-200/60 dark:border-[#2A2F3D]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('isDefault')} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                  <div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] block">Platform Default</span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Auto-assigned to new orgs</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                  <div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] block">Active Status</span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Template available for use</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('emailNotifications')} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                  <div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE] block">Email Alerts</span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Notify approvers upon stage entry</span>
                  </div>
                </label>
              </div>

              {isEdit && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                        Create New Version (v{(initialData.version || 1) + 1})
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Check this box to increment the version number, enabling clean rollouts to organizations.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    {...register('createNewVersion')}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAGES & APPROVERS */}
          {activeTab === 'stages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE]">Workflow Stages</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Configure sequential or parallel approval levels</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus size={14} /> Add Stage
                </button>
              </div>

              {stageFields.map((stageItem, stageIdx) => (
                <div
                  key={stageItem.id}
                  className="p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#11131a] space-y-4"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-200/60 dark:border-[#2A2F3D]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {stageIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">
                        Stage {stageIdx + 1}
                      </h4>
                    </div>
                    {stageFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(stageIdx)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1"
                      >
                        <Trash2 size={14} /> Remove Stage
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A0A6B5] mb-1 uppercase">
                        Stage Code
                      </label>
                      <input
                        type="text"
                        {...register(`stages.${stageIdx}.stageCode`, { required: true })}
                        className="input-field text-xs uppercase font-mono"
                        placeholder="e.g. REVIEW"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A0A6B5] mb-1 uppercase">
                        Stage Name
                      </label>
                      <input
                        type="text"
                        {...register(`stages.${stageIdx}.stageName`, { required: true })}
                        className="input-field text-xs"
                        placeholder="e.g. Initial Review"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A0A6B5] mb-1 uppercase">
                        Execution Type
                      </label>
                      <Controller
                        control={control}
                        name={`stages.${stageIdx}.executionType`}
                        render={({ field }) => (
                          <CustomSelect
                            value={field.value}
                            onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                            options={EXECUTION_TYPES}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Approver role */}
                  <div className="p-3 rounded-lg bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-[#E6E8EE]">
                      <Users size={14} className="text-indigo-500" />
                      <span>Stage Approver Role</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                          Role Required
                        </label>
                        <Controller
                          control={control}
                          name={`stages.${stageIdx}.approvers.0.roleName`}
                          render={({ field }) => (
                            <CustomSelect
                              value={field.value}
                              onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                              options={ROLE_OPTIONS}
                              placeholder="Select Approver Role"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                          Min Approvals Required
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register(`stages.${stageIdx}.minimumApprovalsRequired`)}
                          className="input-field text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SLA Settings */}
                  <div className="p-3 rounded-lg bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-[#E6E8EE]">
                      <Clock size={14} className="text-amber-500" />
                      <span>Stage SLA & Escalation</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                          Max Duration (Hours)
                        </label>
                        <input
                          type="number"
                          {...register(`stages.${stageIdx}.sla.durationHours`)}
                          className="input-field text-xs"
                          placeholder="24"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                          Escalate To Role
                        </label>
                        <Controller
                          control={control}
                          name={`stages.${stageIdx}.sla.escalateToRoleName`}
                          render={({ field }) => (
                            <CustomSelect
                              value={field.value}
                              onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                              options={ROLE_OPTIONS}
                              placeholder="Select Escalation Role"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TRANSITIONS */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE]">Workflow Transitions</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Define paths between stages upon approve, reject, or submit actions</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTransition}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus size={14} /> Add Transition
                </button>
              </div>

              <div className="space-y-3">
                {transitionFields.map((transItem, trIdx) => (
                  <div
                    key={transItem.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#11131a] flex flex-col md:flex-row gap-3 items-center"
                  >
                    <div className="w-full md:w-36">
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                        Action
                      </label>
                      <Controller
                        control={control}
                        name={`transitions.${trIdx}.actionType`}
                        render={({ field }) => (
                          <CustomSelect
                            value={field.value}
                            onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                            options={ACTION_TYPES}
                          />
                        )}
                      />
                    </div>

                    <div className="w-full md:w-44">
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                        From Stage
                      </label>
                      <input
                        type="text"
                        {...register(`transitions.${trIdx}.sourceStageCode`)}
                        placeholder="(Draft / Start)"
                        className="input-field text-xs uppercase font-mono"
                      />
                    </div>

                    <ArrowRight size={16} className="text-zinc-400 hidden md:block shrink-0 mt-5" />

                    <div className="w-full md:w-44">
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                        To Stage
                      </label>
                      <input
                        type="text"
                        {...register(`transitions.${trIdx}.targetStageCode`)}
                        placeholder="(Completed / End)"
                        className="input-field text-xs uppercase font-mono"
                      />
                    </div>

                    <div className="w-full md:flex-1">
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] mb-1 uppercase">
                        Allowed Roles
                      </label>
                      <input
                        type="text"
                        {...register(`transitions.${trIdx}.allowedRoles`)}
                        placeholder="e.g. OWNER,ACCOUNTANT"
                        className="input-field text-xs uppercase font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTransition(trIdx)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors mt-4 md:mt-5"
                      title="Delete Transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#161922]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary"
            >
              {isProcessing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Template')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

