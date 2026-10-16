import React from 'react';
import { resolveRoleId } from '../services/workflowService';
import WorkflowToggle from './WorkflowToggle';
import WorkflowSettingRow from './WorkflowSettingRow';

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-zinc-400">{hint}</p>}
    </div>
  );
}

export const DOCUMENT_TYPES_BY_MODULE = {
  Sales: [
    { value: 'QUOTATION', label: 'Sales Quotation (QUOTATION)' },
    { value: 'SALES_ORDER', label: 'Sales Order (SALES_ORDER)' },
    { value: 'SALES_INVOICE', label: 'Sales Invoice (SALES_INVOICE)' },
    { value: 'SALES', label: 'General Sales (SALES)' },
  ],
  Purchase: [
    { value: 'PURCHASE_ORDER', label: 'Purchase Order (PURCHASE_ORDER)' },
    { value: 'AP_INVOICE', label: 'Vendor Bill / AP Invoice (AP_INVOICE)' },
    { value: 'PURCHASE', label: 'General Purchase (PURCHASE)' },
  ],
  Expenses: [
    { value: 'EXPENSE_REQUEST', label: 'Expense Request (EXPENSE_REQUEST)' },
    { value: 'EXPENSE', label: 'General Expense (EXPENSE)' },
  ],
  Invoices: [
    { value: 'SALES_INVOICE', label: 'Sales Invoice (SALES_INVOICE)' },
    { value: 'AP_INVOICE', label: 'AP Invoice (AP_INVOICE)' },
    { value: 'INVOICE', label: 'General Invoice (INVOICE)' },
  ],
  Reimbursements: [
    { value: 'REIMBURSEMENT', label: 'Reimbursement Request (REIMBURSEMENT)' },
  ],
  Inventory: [
    { value: 'STOCK_TRANSFER', label: 'Stock Transfer (STOCK_TRANSFER)' },
    { value: 'STOCK_ADJUSTMENT', label: 'Stock Adjustment (STOCK_ADJUSTMENT)' },
    { value: 'INVENTORY', label: 'General Inventory (INVENTORY)' },
  ],
  Others: [
    { value: 'RECEIPT_VOUCHER', label: 'Receipt Voucher (RECEIPT_VOUCHER)' },
    { value: 'PAYMENT_VOUCHER', label: 'Payment Voucher (PAYMENT_VOUCHER)' },
    { value: 'GENERAL', label: 'General Document (GENERAL)' },
  ],
};

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
            className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 ${
              (errors.name || errors.workflowName) ? 'border-red-400' : 'border-zinc-200'
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
            className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 font-mono text-[11px] ${
              errors.workflowCode || isCodeDuplicate ? 'border-red-400' : 'border-zinc-200'
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
          <select
            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50"
            disabled={!canEdit}
            value={workflow.documentType || docTypeOptions[0]?.value || 'GENERAL'}
            onChange={(e) => {
              const val = e.target.value;
              update('documentType', val);
            }}
          >
            {docTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Initiated by role">
          <select
            className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 ${
              errors.initiatedBy ? 'border-red-400' : 'border-zinc-200'
            }`}
            disabled={!canEdit || rolesLoading}
            value={currentInitiatedBy}
            onChange={(e) => update('initiatedBy', e.target.value)}
          >
            {rolesLoading ? (
              <option value="" disabled>Loading roles...</option>
            ) : rolesError ? (
              <option value="" disabled>Failed to load roles</option>
            ) : roles.length === 0 ? (
              <option value="" disabled>No roles available</option>
            ) : (
              <>
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.initiatedBy && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.initiatedBy}</p>}
          {rolesError && (
            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center justify-between">
              <span>Could not load roles.</span>
              {onRetryRoles && (
                <button
                  type="button"
                  onClick={onRetryRoles}
                  className="text-zinc-800 underline hover:text-zinc-950 font-semibold"
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
          className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 resize-none"
          disabled={!canEdit}
          value={workflow.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Workflow purpose and overview"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Applicable customers">
          <select
            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50"
            disabled={!canEdit}
            value={workflow.customerScope || 'all'}
            onChange={(e) => update('customerScope', e.target.value)}
          >
            <option value="all">All customers</option>
            <option value="specific">Specific customers</option>
          </select>
        </Field>

        <Field label="Approval threshold" hint="Amount in company base currency">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-semibold">₹</span>
            <input
              className="w-full h-8 pl-6 pr-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50"
              disabled={!canEdit}
              value={workflow.threshold || ''}
              onChange={(e) => update('threshold', e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="0.00"
            />
          </div>
        </Field>
      </div>

      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
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
            <select
              className="w-36 sm:w-44 h-7.5 px-2 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400 shrink-0"
              disabled={!canEdit || !workflow.approvalRequired || rolesLoading}
              value={currentApproverRole}
              onChange={(e) => update('approverRole', e.target.value)}
            >
              {rolesLoading ? (
                <option value="" disabled>Loading roles...</option>
              ) : rolesError ? (
                <option value="" disabled>Failed to load roles</option>
              ) : roles.length === 0 ? (
                <option value="" disabled>No roles available</option>
              ) : (
                <>
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </>
              )}
            </select>
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

        <WorkflowSettingRow label="Auto-create sales order" description="Create an order after customer acceptance">
          <WorkflowToggle label="Auto-create sales order" checked={workflow.autoCreateOrder} disabled={!canEdit || !workflow.customerAcceptance} onChange={(value) => update('autoCreateOrder', value)} />
        </WorkflowSettingRow>

        <WorkflowSettingRow label="Email notifications" description="Notify participants when a step changes">
          <WorkflowToggle label="Email notifications" checked={workflow.emailNotifications} disabled={!canEdit} onChange={(value) => update('emailNotifications', value)} />
        </WorkflowSettingRow>
      </div>

      <Field label="Notes">
        <textarea
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 resize-none"
          disabled={!canEdit}
          value={workflow.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Add internal notes for administrators"
        />
      </Field>
    </div>
  );
}
