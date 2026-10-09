import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDown, ArrowUp, Bell, Building2, ChevronDown, Clock3, Copy,
  GitBranch, HelpCircle, Mail, Plus, Save, Search, ShieldCheck, Trash2, User,
  Users
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { setSelectedCompany } from '../../company-management/companySlice';
import usePermission from '../../../hooks/usePermission';
import { useRBAC } from '../../../utils/rbac';
import ExistingEmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import ErrorState from '../../../components/common/ErrorState';
import { ListSkeleton } from '../../../components/common/SkeletonLoader';
import { getRoles } from '../../../api/sso/role';
import {
  WORKFLOW_DATA_SOURCES,
  deleteWorkflowDefinition,
  extractRoles,
  loadWorkflowDefinitions,
  resolveRoleId,
  resolveRoleName,
  saveWorkflowDefinitions,
  workflowAuditApi,
} from '../services/workflowService';

export { extractRoles, resolveRoleId, resolveRoleName };

const MODULES = ['Sales', 'Purchase', 'Expenses', 'Invoices', 'Reimbursements', 'Inventory', 'Others'];

const moduleToDocumentType = (value) => {
  switch ((value || '').toLowerCase()) {
    case 'sales':
      return 'SALES';
    case 'purchase':
      return 'PURCHASE';
    case 'expenses':
      return 'EXPENSE';
    case 'invoices':
      return 'INVOICE';
    case 'reimbursements':
      return 'REIMBURSEMENT';
    case 'inventory':
      return 'INVENTORY';
    default:
      return 'GENERAL';
  }
};

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
        checked ? 'bg-zinc-900' : 'bg-zinc-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

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

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-zinc-200 bg-zinc-100 text-zinc-500'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function WorkflowDiagram({ workflow, canEdit, onUpdateStep, onRemoveStep, onMoveStep, onAddStep, roles = [] }) {
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
                  <Toggle
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

function ConfigurationForm({
  workflow,
  setWorkflow,
  canEdit,
  errors,
  roles = [],
  rolesLoading = false,
  rolesError = null,
  onRetryRoles,
}) {
  const update = (key, value) => setWorkflow((current) => ({ ...current, [key]: value }));

  const currentInitiatedBy = resolveRoleId(workflow.initiatedBy, roles);
  const currentApproverRole = resolveRoleId(workflow.approverRole, roles);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Workflow name">
          <input
            className={`w-full h-8 px-2.5 rounded-lg border bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors disabled:bg-zinc-50 ${
              errors.name ? 'border-red-400' : 'border-zinc-200'
            }`}
            disabled={!canEdit}
            value={workflow.name}
            onChange={(e) => update('name', e.target.value)}
          />
          {errors.name && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.name}</p>}
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
            value={workflow.customerScope}
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
              value={workflow.threshold}
              onChange={(e) => update('threshold', e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="0.00"
            />
          </div>
        </Field>
      </div>

      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <SettingRow label="Workflow status" description="Allow this workflow to run for new transactions">
          <Toggle label="Workflow status" checked={workflow.active} disabled={!canEdit} onChange={(value) => update('active', value)} />
        </SettingRow>

        <SettingRow label="Approval required" description="Require a role to approve before continuing">
          <Toggle label="Approval required" checked={workflow.approvalRequired} disabled={!canEdit} onChange={(value) => update('approvalRequired', value)} />
        </SettingRow>

        <SettingRow label="Approver role" description="Default role responsible for approval">
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
        </SettingRow>

        <SettingRow label="Allow customer acceptance" description="Expose acceptance action on customer portal">
          <Toggle label="Customer acceptance" checked={workflow.customerAcceptance} disabled={!canEdit} onChange={(value) => update('customerAcceptance', value)} />
        </SettingRow>

        <SettingRow label="Auto-create sales order" description="Create an order after customer acceptance">
          <Toggle label="Auto-create sales order" checked={workflow.autoCreateOrder} disabled={!canEdit || !workflow.customerAcceptance} onChange={(value) => update('autoCreateOrder', value)} />
        </SettingRow>

        <SettingRow label="Email notifications" description="Notify participants when a step changes">
          <Toggle label="Email notifications" checked={workflow.emailNotifications} disabled={!canEdit} onChange={(value) => update('emailNotifications', value)} />
        </SettingRow>
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

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-zinc-50/50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-800 leading-tight">{label}</p>
        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5 truncate">{description}</p>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

export default function WorkflowManagementPage() {
  const { companyId: routeCompanyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const companies = useAppSelector((state) => state.accountCompany?.companies || []);
  const currentUser = useAppSelector((state) => state.auth?.user);
  const { isAdmin, isOwner } = useRBAC();
  const isOwnerOrAdmin = isAdmin || isOwner || currentUser?.role === 'owner' || currentUser?.role === 'super_admin' || currentUser?.role === 'company_admin';
  const companyId = routeCompanyId || selectedCompany?.id || currentUser?.companyId || currentUser?.companyCode || null;
  const canView = usePermission('WORKFLOW', 'VIEW') || isOwnerOrAdmin;
  const canCreate = usePermission('WORKFLOW', 'CREATE') || isOwnerOrAdmin;
  const canEdit = usePermission('WORKFLOW', 'EDIT') || isOwnerOrAdmin;
  const canDelete = usePermission('WORKFLOW', 'DELETE') || isOwnerOrAdmin;
  const canActivate = usePermission('WORKFLOW', 'ACTIVATE') || isOwnerOrAdmin;
  const canAuditView = usePermission('WORKFLOW', 'AUDIT_VIEW') || isOwnerOrAdmin;
  const canApprove = usePermission('WORKFLOW', 'APPROVE') || isOwnerOrAdmin;
  const [workflows, setWorkflows] = useState([]);
  const [definitionsStatus, setDefinitionsStatus] = useState('loading');
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [module, setModule] = useState('Sales');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState('diagram');
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRoles = useCallback(async (targetCompanyId) => {
    if (!targetCompanyId) {
      setRoles([]);
      setRolesLoading(false);
      setRolesError(null);
      return [];
    }

    setRolesLoading(true);
    setRolesError(null);

    try {
      const response = await getRoles({ companyId: targetCompanyId, page: 0, pageSize: 200 });
      const extracted = extractRoles(response);
      setRoles(extracted);
      setRolesError(null);
      return extracted;
    } catch (err) {
      console.error('Failed to fetch roles for company', err);
      setRoles([]);
      setRolesError(err?.response?.data?.message || err?.message || 'Failed to load roles');
      return [];
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    setRoles([]);
    setRolesError(null);
    if (companyId) {
      fetchRoles(companyId);
    } else {
      setRolesLoading(false);
    }
  }, [companyId, fetchRoles]);

  useEffect(() => {
    let active = true;
    setWorkflows([]);
    setSelectedId('');
    setErrors({});
    setQuery('');
    setActiveTab('diagram');
    setDeleteTarget(null);

    if (!companyId) {
      setDefinitionsStatus('error');
      return () => { active = false; };
    }

    setDefinitionsStatus('loading');
    loadWorkflowDefinitions(companyId, moduleToDocumentType(module))
      .then((result) => {
        if (!active) return;
        setWorkflows(result.definitions || []);
        setDefinitionsStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to load workflow definitions', error);
        setDefinitionsStatus('error');
        dispatch(addAlert({ type: 'error', message: error?.message || 'Workflow definitions could not be loaded from the backend.' }));
      });

    return () => { active = false; };
  }, [companyId, module, dispatch]);

  const reloadDefinitions = () => {
    if (!companyId) {
      setDefinitionsStatus('error');
      return;
    }
    setDefinitionsStatus('loading');
    loadWorkflowDefinitions(companyId, moduleToDocumentType(module))
      .then((result) => {
        setWorkflows(result.definitions || []);
        setDefinitionsStatus('ready');
      })
      .catch((error) => {
        console.error('Failed to reload workflow definitions', error);
        setDefinitionsStatus('error');
        dispatch(addAlert({ type: 'error', message: error?.message || 'Workflow definitions could not be reloaded from the backend.' }));
      });
  };

  const visibleWorkflows = useMemo(() => workflows.filter((item) => item.module === module && item.name.toLowerCase().includes(query.toLowerCase())), [workflows, module, query]);
  const selected = workflows.find((item) => item.id === selectedId) || visibleWorkflows[0];
  const setSelected = (updater) => setWorkflows((items) => items.map((item) => item.id === selected?.id ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater }) : item));

  useEffect(() => { if (visibleWorkflows.length && !visibleWorkflows.some((item) => item.id === selectedId)) setSelectedId(visibleWorkflows[0].id); }, [visibleWorkflows, selectedId]);
  useEffect(() => { if (!canAuditView && activeTab === 'audit') setActiveTab('diagram'); }, [activeTab, canAuditView]);
  useEffect(() => {
    if (!selected) return;
    setErrors({});
  }, [selected?.id]);

  if (!canView) return <div className="card mx-auto mt-10 max-w-lg p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-zinc-400" size={34} /><h1 className="text-lg font-semibold text-zinc-900">Workflow access restricted</h1><p className="mt-2 text-sm text-zinc-500">You do not have permission to view workflow configurations for this company.</p></div>;

  const save = async () => {
    if (!selected) return;
    const nextErrors = {};
    if (!selected.name.trim()) nextErrors.name = 'Workflow name is required.';
    if (!selected.initiatedBy) nextErrors.initiatedBy = 'Select the initiating role.';
    if (selected.approvalRequired && (!selected.approverRole || selected.steps.filter((step) => step.type === 'approval' && step.active).length === 0)) nextErrors.steps = 'Add an active approval step and approver role.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { dispatch(addAlert({ type: 'error', message: 'Please fix the workflow validation errors.' })); return; }
    setIsSaving(true);
    try {
      const initiatedByRoleId = resolveRoleId(selected.initiatedBy, roles);
      const initiatedByRoleName = resolveRoleName(selected.initiatedBy, roles);
      const approverRoleId = resolveRoleId(selected.approverRole, roles);
      const approverRoleName = resolveRoleName(selected.approverRole, roles);

      const payloadToSave = {
        ...selected,
        initiatedBy: initiatedByRoleId,
        initiatedByRoleId,
        initiatedByRoleName,
        approverRole: approverRoleId,
        approverRoleId,
        approverRoleName,
        steps: selected.steps.map((step) => ({
          ...step,
          role: resolveRoleId(step.role || approverRoleId, roles),
          roleId: resolveRoleId(step.role || approverRoleId, roles),
          roleName: resolveRoleName(step.role || approverRoleName, roles),
        })),
      };

      const isNewDraft = !selected.id || String(selected.id).startsWith('workflow-');
      const mode = isNewDraft ? 'create' : 'update';
      const result = await saveWorkflowDefinitions(companyId, payloadToSave, { mode });
      dispatch(addAlert({ type: 'success', message: `${selected.name} saved for ${selectedCompany?.name || 'this company'}.` }));

      if (isNewDraft && result?.definitions?.length) {
        const createdDef = result.definitions[0];
        setWorkflows((items) => items.map((w) => (w.id === selected.id ? createdDef : w)));
        setSelectedId(createdDef.id);
      }
    } catch (error) {
      console.error('Failed to save workflow definitions', error);
      dispatch(addAlert({ type: 'error', message: error?.message || `Could not save ${selected.name}.` }));
    } finally {
      setIsSaving(false);
    }
  };

  const create = async () => {
    const id = `workflow-${Date.now()}`;
    const defaultRole = roles[0]?.id || '';
    const item = {
      id,
      module,
      name: 'New workflow',
      description: '',
      active: false,
      customerScope: 'all',
      initiatedBy: defaultRole,
      approvalRequired: true,
      approverRole: defaultRole,
      threshold: '',
      customerAcceptance: false,
      autoCreateOrder: false,
      emailNotifications: true,
      notes: '',
      steps: [{ id: `${id}-1`, title: 'New approval step', role: defaultRole, type: 'approval', active: true }],
    };
    const next = [item, ...workflows];
    setWorkflows(next);
    setSelectedId(id);
    setErrors({});
    setIsSaving(true);
    try {
      const created = await saveWorkflowDefinitions(companyId, item, { mode: 'create' });
      dispatch(addAlert({ type: 'success', message: `Workflow created for ${selectedCompany?.name || 'this company'}.` }));
      setWorkflows((items) => (created?.definitions?.length ? [created.definitions[0], ...items.filter((entry) => entry.id !== item.id)] : next));
    } catch (error) {
      console.error('Failed to create workflow', error);
      dispatch(addAlert({ type: 'error', message: error?.message || `Could not create workflow.` }));
    } finally {
      setIsSaving(false);
    }
  };

  const updateStep = (stepId, changes) => setSelected((item) => ({ ...item, steps: item.steps.map((step) => step.id === stepId ? { ...step, ...changes } : step) }));
  const addStep = () => setSelected((item) => {
    const defaultRole = item.approverRole || (roles[0]?.id || '');
    return {
      ...item,
      steps: [
        ...item.steps,
        {
          id: `${item.id}-${Date.now()}`,
          title: 'New approval step',
          role: defaultRole,
          type: 'approval',
          active: true,
        },
      ],
    };
  });
  const removeStep = (stepId) => setSelected((item) => ({ ...item, steps: item.steps.filter((step) => step.id !== stepId) }));
  const moveStep = (index, offset) => setSelected((item) => { const steps = [...item.steps];[steps[index], steps[index + offset]] = [steps[index + offset], steps[index]]; return { ...item, steps }; });
  const deleteWorkflow = () => { if (!selected) return; setDeleteTarget(selected); };

  const confirmDeleteWorkflow = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteWorkflowDefinition(companyId, workflows, deleteTarget.id);
      const next = result.definitions;
      setWorkflows(next);
      setSelectedId(next.find((item) => item.module === module)?.id || '');
      setDeleteTarget(null);
      dispatch(addAlert({ type: 'info', message: `${deleteTarget.name} was removed from local state. ${result?.source === WORKFLOW_DATA_SOURCES.API ? 'Backend delete confirmed.' : 'Missing backend endpoint: DELETE /api/v1/workflow/definitions/{definitionId}.'}` }));
    } catch (error) {
      console.error('Failed to delete workflow', error);
      dispatch(addAlert({ type: 'error', message: `Could not delete ${deleteTarget.name}. ${error?.message || 'Unexpected error.'}` }));
    } finally {
      setIsDeleting(false);
    }
  };

  const selectCompany = (id) => { const company = companies.find((item) => String(item.id || item.companyId || item.code) === id); if (!company) return; dispatch(setSelectedCompany(company)); if (routeCompanyId) navigate(`/company/${id}/workflows`); };

  return (
    <div className="animate-fade-in flex flex-col h-full min-h-0 p-3 sm:p-5 lg:p-6 overflow-y-auto lg:overflow-hidden">
      {/* ── Top Header and Title ── */}
      <div className="flex-none flex flex-col gap-3 pb-3 border-b border-zinc-200/80 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
            <span>Administration</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-800 font-semibold">Workflow &amp; Approvals</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 leading-none">
            Workflow &amp; Approvals
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Configure transaction approvals and automation for each company.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <BuildingSelector
            companies={companies}
            selectedCompany={selectedCompany}
            companyId={companyId}
            onChange={selectCompany}
          />
          <button
            className="btn-icon h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 shadow-sm transition-colors"
            title="Notifications"
            type="button"
          >
            <Bell size={15} />
          </button>
          <button
            type="button"
            className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-sm"
            onClick={() => dispatch(addAlert({ type: 'info', message: `Signed in as ${currentUser?.name || currentUser?.email || 'administrator'}.` }))}
            title="Profile"
          >
            <User size={13} className="text-zinc-500" />
            <span>Profile</span>
          </button>
          {canCreate && (
            <button
              type="button"
              className="btn-primary h-8 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition-all shadow-sm active:scale-[0.98]"
              disabled={isSaving || isDeleting || definitionsStatus !== 'ready'}
              onClick={create}
            >
              <Plus size={14} />
              <span>Create workflow</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Configuration Scope Notice ── */}
      <div className="flex-none my-2.5 flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 text-xs text-blue-900 shadow-sm">
        <Building2Icon />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-blue-700">Configuration scope:</span>
          <strong className="font-semibold text-blue-950">{selectedCompany?.name || 'Selected company'}</strong>
          <span className="text-blue-500 font-mono text-[11px]">({companyId})</span>
        </div>
        <span className="ml-auto hidden text-[11px] font-medium text-blue-600 sm:block">
          Changes apply only to this company
        </span>
      </div>

      {/* ── Module Tabs Bar ── */}
      <div className="flex-none flex items-center gap-1 overflow-x-auto border-b border-zinc-200 mb-3 no-scrollbar">
        {MODULES.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setModule(item)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
              module === item
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* ── Main Content Responsive 3-Column Studio ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[250px_minmax(340px,1fr)_340px] xl:grid-cols-[270px_minmax(380px,1fr)_370px] gap-3.5 sm:gap-4 overflow-y-auto lg:overflow-hidden">
        {/* ── Left Column: Workflow List ── */}
        <section className="card flex flex-col min-h-0 h-full overflow-hidden bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex-none border-b border-zinc-100 p-3 bg-zinc-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Workflows</h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200/70 text-zinc-700">
                  {visibleWorkflows.length}
                </span>
              </div>
              <GitBranch size={16} className="text-zinc-400" />
            </div>
            <div className="relative mt-2.5">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                placeholder="Search workflows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {definitionsStatus === 'loading' ? (
              <div className="space-y-2 p-2"><ListSkeleton items={3} /></div>
            ) : definitionsStatus === 'error' ? (
              <ErrorState title="Could not load workflows" message={`Workflow definitions could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} />
            ) : (
              <>
                {visibleWorkflows.map((item) => {
                  const isSelected = item.id === selected?.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => { setSelectedId(item.id); setErrors({}); }}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900/[0.04] shadow-sm ring-1 ring-zinc-900/10'
                          : 'border-zinc-100 bg-white hover:border-zinc-300 hover:bg-zinc-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-800'}`}>
                          {item.name}
                        </span>
                        <StatusBadge active={item.active} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </button>
                  );
                })}
                {!visibleWorkflows.length && (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    No workflows in {module}.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Center Column: Workflow Editor & Diagram ── */}
        <section className="card flex flex-col min-h-0 h-full overflow-hidden bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex-none border-b border-zinc-100 p-4 bg-zinc-50/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                    {selected?.name || 'No workflow selected'}
                  </h2>
                  {selected && <StatusBadge active={selected.active} />}
                </div>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {selected?.description || 'Create a workflow to begin configuring approvals.'}
                </p>
              </div>
              {selected && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Duplicate workflow"
                    disabled={!canCreate || isSaving || isDeleting}
                    onClick={create}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300 transition-colors disabled:opacity-40"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete workflow"
                    disabled={!canDelete || isSaving || isDeleting}
                    onClick={deleteWorkflow}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex items-center gap-1 overflow-x-auto border-t border-zinc-100 pt-2.5 no-scrollbar">
              {[
                ['diagram', 'Workflow diagram', GitBranch],
                ['rules', 'Approval rules', ShieldCheck],
                ['email', 'Email notifications', Mail],
                ['audit', 'Audit trail', Activity],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeTab === id
                      ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {definitionsStatus === 'loading' ? (
              <div className="space-y-2"><ListSkeleton items={3} /></div>
            ) : definitionsStatus === 'error' ? (
              <ErrorState title="Workflow configuration unavailable" message={`Workflow definitions could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} />
            ) : (
              <>
                {selected && activeTab === 'diagram' && (
                  <WorkflowDiagram
                    workflow={selected}
                    canEdit={canEdit}
                    onUpdateStep={updateStep}
                    onRemoveStep={removeStep}
                    onMoveStep={moveStep}
                    onAddStep={addStep}
                    roles={roles}
                  />
                )}
                {selected && activeTab === 'rules' && (
                  <div className="space-y-3">
                    <InfoRow icon={ShieldCheck} label="Approval threshold" value={`₹ ${selected.threshold || 'Not set'}`} />
                    <InfoRow icon={Users} label="Approver" value={resolveRoleName(selected.approverRole, roles) || 'Not configured'} />
                    <InfoRow icon={Clock3} label="Active approval steps" value={`${selected.steps.filter((step) => step.type === 'approval' && step.active).length} step(s)`} />
                    {errors.steps && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">{errors.steps}</p>}
                  </div>
                )}
                {selected && activeTab === 'email' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="mt-0.5 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">Email notification policy</p>
                          <p className="mt-1 text-xs text-zinc-500">Notifications are sent to the initiator and the assigned approver when a workflow step changes.</p>
                        </div>
                      </div>
                    </div>
                    <InfoRow icon={Bell} label="Status" value={selected.emailNotifications ? 'Enabled' : 'Disabled'} />
                  </div>
                )}
                {selected && activeTab === 'audit' && (
                  <AuditTrailPanel
                    companyId={companyId}
                    module={selected.module}
                    selectedId={selected.id}
                    currentUser={currentUser}
                  />
                )}
                {!selected && <EmptyState onCreate={canCreate ? create : undefined} />}
              </>
            )}
          </div>
        </section>

        {/* ── Right Column: Configuration Panel ── */}
        <section className="card flex flex-col min-h-0 h-full overflow-hidden bg-white border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex-none border-b border-zinc-100 p-4 bg-zinc-50/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Configuration</h2>
                <p className="text-[11px] text-zinc-400">Company-specific settings</p>
              </div>
              <HelpCircle size={15} className="text-zinc-400" />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
            {definitionsStatus === 'loading' ? (
              <div className="space-y-3"><ListSkeleton items={4} /></div>
            ) : definitionsStatus === 'error' ? (
              <ErrorState title="Configuration unavailable" message={`Settings could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} />
            ) : (
              <>
                {selected ? (
                  <ConfigurationForm
                    workflow={selected}
                    setWorkflow={setSelected}
                    canEdit={canEdit}
                    errors={errors}
                    roles={roles}
                    rolesLoading={rolesLoading}
                    rolesError={rolesError}
                    onRetryRoles={() => fetchRoles(companyId)}
                  />
                ) : (
                  <EmptyState onCreate={canCreate ? create : undefined} />
                )}
              </>
            )}
          </div>

          {selected && definitionsStatus === 'ready' && (
            <div className="flex-none border-t border-zinc-100 p-3.5 bg-zinc-50/60 flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn-secondary h-8 px-3 text-xs inline-flex items-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition-all shadow-sm"
                disabled={isSaving}
                onClick={() => { reloadDefinitions(); setErrors({}); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary h-8 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition-all shadow-sm active:scale-[0.98]"
                disabled={!canEdit || isSaving}
                onClick={save}
              >
                <Save size={13} />
                <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        isDestructive
        title="Delete workflow"
        message={deleteTarget ? `Delete "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        details="This removes the approval configuration for the selected company. The workflow definition API is not documented yet, so only the local draft is affected."
        loading={isDeleting}
        loadingText="Deleting..."
        onConfirm={confirmDeleteWorkflow}
        onCancel={() => setDeleteTarget(null)}
        zIndex={10000}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <span className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        <Icon size={14} className="text-zinc-700" />
        {label}
      </span>
      <span className="text-xs font-bold text-zinc-900">{value}</span>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <ExistingEmptyState
      title="No workflow selected"
      description="Create a workflow to configure approval routing."
      icon={GitBranch}
      action={onCreate ? (
        <button type="button" className="btn-primary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold" onClick={onCreate}>
          <Plus size={13} /> Create workflow
        </button>
      ) : null}
    />
  );
}

function Building2Icon() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600 shrink-0">
      <Building2 size={13} />
    </div>
  );
}

function BuildingSelector({ companies, selectedCompany, companyId, onChange }) {
  const options = companies.length ? companies : [{ id: companyId, name: selectedCompany?.name || 'Current company' }];
  return (
    <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all shadow-sm cursor-pointer">
      <Building2 size={13} className="text-zinc-500 shrink-0" />
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:inline">Company:</span>
      <select
        aria-label="Selected company"
        value={companyId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[140px] sm:max-w-[180px] border-0 bg-transparent p-0 text-xs font-semibold text-zinc-800 outline-none truncate cursor-pointer"
      >
        {options.map((company) => (
          <option key={company.id || company.companyId || company.code} value={company.id || company.companyId || company.code}>
            {company.name || company.companyName || company.code || company.id}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="text-zinc-400 shrink-0" />
    </label>
  );
}

const formatDateTime = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function AuditTrailPanel({ companyId, module, selectedId, currentUser }) {
  const [status, setStatus] = useState('loading');
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setEntries([]);
    workflowAuditApi.getAuditTrail({ companyId, moduleName: module, entityId: selectedId, page: 0, size: 30 })
      .then((result) => {
        if (!active) return;
        setEntries(result.entries || []);
        setPagination(result.pagination || null);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to load workflow audit trail', error);
        setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to load the audit trail.');
        setStatus('error');
      });
    return () => { active = false; };
  }, [companyId, module, selectedId, fetchKey]);

  const latest = entries[entries.length - 1] || entries[0];

  if (status === 'loading') return <div className="space-y-2"><ListSkeleton items={3} /></div>;
  if (status === 'error') return <ErrorState title="Audit trail unavailable" message={errorMessage} onRetry={() => setFetchKey((key) => key + 1)} />;

  return (
    <div className="space-y-3">
      <InfoRow icon={Activity} label="Last updated" value={latest ? formatDateTime(latest.performedAt) : 'No changes recorded yet'} />
      <InfoRow icon={User} label="Updated by" value={latest?.performedBy || currentUser?.name || currentUser?.email || 'No changes recorded yet'} />
      {entries.length === 0 && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-xs text-zinc-500 leading-relaxed">
          No audit entries found for this workflow. Entries appear here via <span className="font-mono text-zinc-700">GET /api/account/audit-logs</span> once a step is approved, rejected, or changed under this company.
        </p>
      )}
      {entries.length > 0 && (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id || `${entry.performedAt}-${entry.actionType}`} className="flex items-start gap-3 p-3 hover:bg-zinc-50/50 transition-colors">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900">{entry.performedBy || 'System'}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{(entry.entityName || module)} · {String(entry.actionType || 'ACTION').toUpperCase()}</p>
                <p className="mt-0.5 text-[10px] text-zinc-400">{formatDateTime(entry.performedAt)}{entry.ipAddress ? ` · ${entry.ipAddress}` : ''}</p>
                {entry.description && <p className="mt-1 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-md">{entry.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <p className="pt-1 text-right text-[10px] text-zinc-400">
          Page {pagination.page + 1} of {pagination.totalPages} · {pagination.totalElements} record(s)
        </p>
      )}
    </div>
  );
}
