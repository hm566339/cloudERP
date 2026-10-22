import React from 'react';
import { resolveRoleId, DOCUMENT_TYPES_BY_MODULE } from '../services/workflowService';
import WorkflowToggle from './WorkflowToggle';
import WorkflowSettingRow from './WorkflowSettingRow';
import CustomSelect from '../../../components/common/CustomSelect';

export { DOCUMENT_TYPES_BY_MODULE };

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function WorkflowConfigurationForm({
  workflow,
  setWorkflow,
  canEdit,
  errors,
  roles = [],
  rolesLoading = false,
  rolesError = null,
  onRetryRoles,
  existingCodes = [],
}) {
  const update = (key, value) => setWorkflow((current) => ({ ...current, [key]: value }));

  const currentInitiatedBy = resolveRoleId(workflow.initiatedBy, roles);
  const currentApproverRole = resolveRoleId(workflow.approverRole, roles);
  const currentCode = (workflow.workflowCode || '').trim().toUpperCase();
  const isCodeDuplicate = Boolean(currentCode && existingCodes.includes(currentCode));
  const currentModule = workflow.module || 'Sales';
  const docTypeOptions = DOCUMENT_TYPES_BY_MODULE[currentModule] || [
    { value: workflow.documentType || 'GENERAL', label: workflow.documentType || 'General' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Workflow name">
          <input
            className={`w-full h-8 px-2.5 rounded-lg border bg-white dark:bg-[#1D212C] text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors disabled:bg-zinc-50 dark:disabled:bg-[#161922] ${
              (errors.name || errors.workflowName) ? 'border-red-400' : 'border-zinc-200 dark:border-[#2A2F3D]'
            }`}
            disabled={!canEdit}
            value={workflow.name || workflow.workflowName || ''}
            onChange={(e) => {
              const val = e.target.value;
              update('name', val);
              update('workflowName', val);
              if (!workflow.codeManuallyEdited) {
                let autoCode = val.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                if (autoCode && existingCodes.includes(autoCode)) {
                  let counter = 2;
                  while (existingCodes.includes(`${autoCode}_${counter}`)) {
                    counter++;
                  }
                  autoCode = `${autoCode}_${counter}`;
                }
                update('workflowCode', autoCode);
              }
            }}
            placeholder="e.g. Sales Quotation Approval"
          />
          {(errors.name || errors.workflowName) && (
            <p className="text-[11px] text-red-600 font-medium mt-1">{errors.name || errors.workflowName}</p>
          )}
        </Field>

        <Field label="Workflow code" hint="Unique code, e.g. SALES_APPROVAL">
          <input
            className={`w-full h-8 px-2.5 rounded-lg border bg-white dark:bg-[#1D212C] text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors disabled:bg-zinc-50 dark:disabled:bg-[#161922] font-mono text-[11px] ${
              errors.workflowCode || isCodeDuplicate ? 'border-red-400' : 'border-zinc-200 dark:border-[#2A2F3D]'
            }`}
            disabled={!canEdit}
            value={workflow.workflowCode || ''}
            onChange={(e) => {
              update('workflowCode', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
              update('codeManuallyEdited', true);
            }}
            placeholder="e.g. SALES_APPROVAL"
          />
          {errors.workflowCode && (
            <p className="text-[11px] text-red-600 font-medium mt-1">{errors.workflowCode}</p>
          )}
          {!errors.workflowCode && isCodeDuplicate && (
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Workflow code already exists for this company. Please specify a unique code.
            </p>
          )}
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Document Type" hint="Canonical ERP document target">
          <CustomSelect
            id="wf-doc-type"
            disabled={!canEdit}
            value={workflow.documentType || docTypeOptions[0]?.value || 'GENERAL'}
            onChange={(e, val) => update('documentType', val !== undefined ? val : e.target.value)}
            options={docTypeOptions}
            size="sm"
          />
        </Field>

        <Field label="Initiated by role">
          <CustomSelect
            id="wf-initiated-by-role"
            disabled={!canEdit || rolesLoading}
            isLoading={rolesLoading}
            searchable
            placeholder={rolesLoading ? 'Loading roles...' : rolesError ? 'Failed to load roles' : 'Select role'}
            emptyMessage={rolesError ? 'Could not load roles from server' : 'No roles available'}
            emptyStateAction={rolesError && onRetryRoles ? (
              <button
                type="button"
                onClick={onRetryRoles}
                className="text-[11px] text-zinc-900 dark:text-[#E6E8EE] underline font-semibold hover:text-zinc-700 dark:hover:text-white"
              >
                Retry loading roles
              </button>
            ) : null}
            error={errors.initiatedBy}
            value={currentInitiatedBy}
            onChange={(e, val) => update('initiatedBy', val !== undefined ? val : e.target.value)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            size="sm"
          />
          {rolesError && (
            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center justify-between">
              <span>Could not load roles.</span>
              {onRetryRoles && (
                <button
                  type="button"
                  onClick={onRetryRoles}
                  className="text-zinc-800 dark:text-[#E6E8EE] underline hover:text-zinc-950 dark:hover:text-white font-semibold"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          {!rolesLoading && !rolesError && roles.length === 0 && (
            <p className="text-[10px] text-amber-600 mt-1">No roles found for this company.</p>
          )}
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={2}
          className="w-full rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] px-2.5 py-2 text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors disabled:bg-zinc-50 dark:disabled:bg-[#161922] resize-none"
          disabled={!canEdit}
          value={workflow.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Workflow purpose and overview"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Applicable customers">
          <CustomSelect
            id="wf-applicable-customers"
            disabled={!canEdit}
            value={workflow.customerScope || 'all'}
            onChange={(e, val) => update('customerScope', val !== undefined ? val : e.target.value)}
            options={[
              { value: 'all', label: 'All customers' },
              { value: 'specific', label: 'Specific customers' },
            ]}
            size="sm"
          />
        </Field>

        <Field label="Approval threshold" hint="Amount in company base currency">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">₹</span>
            <input
              className="w-full h-8 pl-6 pr-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-xs text-zinc-900 dark:text-[#E6E8EE] focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors disabled:bg-zinc-50 dark:disabled:bg-[#161922]"
              disabled={!canEdit}
              value={workflow.threshold || ''}
              onChange={(e) => update('threshold', e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="0.00"
            />
          </div>
        </Field>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-sm overflow-hidden">
        <WorkflowSettingRow label="Workflow status" description="Allow this workflow to run for new transactions">
          <WorkflowToggle
            label="Workflow status"
            checked={Boolean(workflow.active ?? workflow.isActive ?? false)}
            disabled={!canEdit}
            onChange={(value) => {
              setWorkflow((current) => ({
                ...current,
                active: value,
                isActive: value,
              }));
            }}
          />
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Approval required" description="Require a role to approve before continuing">
          <WorkflowToggle label="Approval required" checked={workflow.approvalRequired} disabled={!canEdit} onChange={(value) => update('approvalRequired', value)} />
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Approver role" description="Default role responsible for approval">
          <div className="flex flex-col items-end gap-1">
            <CustomSelect
              id="wf-approver-role"
              disabled={!canEdit || !workflow.approvalRequired || rolesLoading}
              isLoading={rolesLoading}
              searchable
              placeholder={rolesLoading ? 'Loading roles...' : rolesError ? 'Failed to load roles' : 'Select role'}
              emptyMessage={rolesError ? 'Could not load roles' : 'No roles available'}
              emptyStateAction={rolesError && onRetryRoles ? (
                <button
                  type="button"
                  onClick={onRetryRoles}
                  className="text-[10px] text-zinc-900 dark:text-[#E6E8EE] underline font-semibold hover:text-zinc-700 dark:hover:text-white"
                >
                  Retry loading roles
                </button>
              ) : null}
              value={currentApproverRole}
              onChange={(e, val) => update('approverRole', val !== undefined ? val : e.target.value)}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              size="sm"
              className="w-40 sm:w-52"
            />
            {rolesError && onRetryRoles && (
              <button
                type="button"
                onClick={onRetryRoles}
                className="text-[10px] text-red-600 underline hover:text-red-700"
              >
                Retry loading roles
              </button>
            )}
          </div>
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Allow customer acceptance" description="Expose acceptance action on customer portal">
          <WorkflowToggle label="Customer acceptance" checked={workflow.customerAcceptance} disabled={!canEdit} onChange={(value) => update('customerAcceptance', value)} />
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Auto-create sales order" description="Create an order after customer acceptance or direct approval">
          <WorkflowToggle label="Auto-create sales order" checked={workflow.autoCreateOrder} disabled={!canEdit} onChange={(value) => update('autoCreateOrder', value)} />
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Email notifications" description="Notify participants when a step changes">
          <WorkflowToggle label="Email notifications" checked={workflow.emailNotifications} disabled={!canEdit} onChange={(value) => update('emailNotifications', value)} />
        </WorkflowSettingRow>
      </div>

      <Field label="Notes">
        <textarea
          rows={2}
          className="w-full rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] px-2.5 py-2 text-xs text-zinc-900 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900 dark:focus:ring-primary transition-colors disabled:bg-zinc-50 dark:disabled:bg-[#161922] resize-none"
          disabled={!canEdit}
          value={workflow.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Add internal notes for administrators"
        />
      </Field>
    </div>
  );
}
