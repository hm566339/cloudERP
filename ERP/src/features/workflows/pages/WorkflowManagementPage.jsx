import React, { useEffect, useMemo, useState } from 'react';
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
import {
  WORKFLOW_DATA_SOURCES,
  deleteWorkflowDefinition,
  loadWorkflowDefinitions,
  saveWorkflowDefinitions,
  workflowAuditApi,
} from '../services/workflowService';

const MODULES = ['Sales', 'Purchase', 'Expenses', 'Invoices', 'Reimbursements', 'Inventory', 'Others'];
const ROLES = ['Sales Executive', 'Sales Manager', 'Finance Manager', 'Accountant', 'Purchase Manager', 'Authorized Sales Role', 'System Admin'];

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
  return <button type="button" aria-label={label} aria-pressed={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-300'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>;
}

function Field({ label, children, hint }) { return <div className="space-y-1.5"><label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</label>{children}{hint && <p className="text-[11px] text-zinc-400">{hint}</p>}</div>; }
function StatusBadge({ active }) { return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-100 text-zinc-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />{active ? 'Active' : 'Inactive'}</span>; }

function WorkflowDiagram({ workflow, canEdit, onUpdateStep, onRemoveStep, onMoveStep, onAddStep }) {
  return <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold text-zinc-800">Workflow sequence</p><p className="text-[11px] text-zinc-500">Drag-free ordering with explicit controls</p></div><button type="button" className="btn-secondary h-7 px-2.5 text-xs" disabled={!canEdit} onClick={onAddStep}><Plus size={13} /> Add step</button></div><div className="relative max-h-[550px] space-y-2 overflow-y-auto pr-1 before:absolute before:bottom-5 before:left-[17px] before:top-5 before:w-px before:bg-blue-200">{workflow.steps.map((step, index) => <div key={step.id} className="relative flex gap-3"><div className={`z-10 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold ${step.active ? 'border-blue-500 text-blue-600' : 'border-zinc-300 text-zinc-400'}`}>{index + 1}</div><div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm sm:p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><input aria-label={`Step ${index + 1} name`} disabled={!canEdit} value={step.title} onChange={(e) => onUpdateStep(step.id, { title: e.target.value })} className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-zinc-800 outline-none disabled:cursor-default" /><div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500"><User size={12} />{step.role || 'Role not assigned'}<span className="mx-1 text-zinc-300">•</span><span className="capitalize">{step.type}</span></div></div><div className="flex items-center gap-1"><Toggle label={`Activate ${step.title}`} checked={step.active} disabled={!canEdit} onChange={(value) => onUpdateStep(step.id, { active: value })} /><button title="Move up" type="button" disabled={!canEdit || index === 0} onClick={() => onMoveStep(index, -1)} className="btn-icon text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"><ArrowUp size={14} /></button><button title="Move down" type="button" disabled={!canEdit || index === workflow.steps.length - 1} onClick={() => onMoveStep(index, 1)} className="btn-icon text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"><ArrowDown size={14} /></button><button title="Remove step" type="button" disabled={!canEdit || workflow.steps.length <= 1} onClick={() => onRemoveStep(step.id)} className="btn-icon text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button></div></div></div></div>)}</div></div>;
}

function ConfigurationForm({ workflow, setWorkflow, canEdit, errors }) {
  const update = (key, value) => setWorkflow((current) => ({ ...current, [key]: value }));
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Workflow name"><input className={`input-field ${errors.name ? 'border-red-400' : ''}`} disabled={!canEdit} value={workflow.name} onChange={(e) => update('name', e.target.value)} />{errors.name && <p className="text-xs text-red-600">{errors.name}</p>}</Field><Field label="Initiated by role"><select className={`input-field ${errors.initiatedBy ? 'border-red-400' : ''}`} disabled={!canEdit} value={workflow.initiatedBy} onChange={(e) => update('initiatedBy', e.target.value)}><option value="">Select role</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>{errors.initiatedBy && <p className="text-xs text-red-600">{errors.initiatedBy}</p>}</Field></div><Field label="Description"><textarea className="min-h-[64px] w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-zinc-50" disabled={!canEdit} value={workflow.description} onChange={(e) => update('description', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Applicable customers"><select className="input-field" disabled={!canEdit} value={workflow.customerScope} onChange={(e) => update('customerScope', e.target.value)}><option value="all">All customers</option><option value="specific">Specific customers</option></select></Field><Field label="Approval threshold" hint="Amount in company base currency"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">₹</span><input className="input-field pl-7" disabled={!canEdit} value={workflow.threshold} onChange={(e) => update('threshold', e.target.value.replace(/[^0-9,]/g, ''))} /></div></Field></div><div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200"><SettingRow label="Workflow status" description="Allow this workflow to run for new transactions"><Toggle label="Workflow status" checked={workflow.active} disabled={!canEdit} onChange={(value) => update('active', value)} /></SettingRow><SettingRow label="Approval required" description="Require a role to approve before continuing"><Toggle label="Approval required" checked={workflow.approvalRequired} disabled={!canEdit} onChange={(value) => update('approvalRequired', value)} /></SettingRow><SettingRow label="Approver role" description="Default role responsible for approval"><select className="input-field max-w-[190px]" disabled={!canEdit || !workflow.approvalRequired} value={workflow.approverRole} onChange={(e) => update('approverRole', e.target.value)}><option value="">Select role</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></SettingRow><SettingRow label="Allow customer acceptance" description="Expose acceptance action on customer portal"><Toggle label="Customer acceptance" checked={workflow.customerAcceptance} disabled={!canEdit} onChange={(value) => update('customerAcceptance', value)} /></SettingRow><SettingRow label="Auto-create sales order" description="Create an order after customer acceptance"><Toggle label="Auto-create sales order" checked={workflow.autoCreateOrder} disabled={!canEdit || !workflow.customerAcceptance} onChange={(value) => update('autoCreateOrder', value)} /></SettingRow><SettingRow label="Email notifications" description="Notify participants when a step changes"><Toggle label="Email notifications" checked={workflow.emailNotifications} disabled={!canEdit} onChange={(value) => update('emailNotifications', value)} /></SettingRow></div><Field label="Notes"><textarea className="min-h-[72px] w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-zinc-50" disabled={!canEdit} value={workflow.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Add internal notes for administrators" /></Field></div>;
}
function SettingRow({ label, description, children }) { return <div className="flex items-center justify-between gap-3 px-3 py-3"><div><p className="text-xs font-semibold text-zinc-700">{label}</p><p className="text-[11px] text-zinc-400">{description}</p></div>{children}</div>; }

export default function WorkflowManagementPage() {
  const { companyId: routeCompanyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const companies = useAppSelector((state) => state.accountCompany?.companies || []);
  const currentUser = useAppSelector((state) => state.auth?.user);
  const { isAdmin } = useRBAC();
  const companyId = routeCompanyId || selectedCompany?.id || currentUser?.companyId || currentUser?.companyCode || null;
  const canView = usePermission('WORKFLOW', 'VIEW') || isAdmin;
  const canCreate = usePermission('WORKFLOW', 'CREATE') || isAdmin;
  const canEdit = usePermission('WORKFLOW', 'EDIT') || isAdmin;
  const canDelete = usePermission('WORKFLOW', 'DELETE') || isAdmin;
  const canActivate = usePermission('WORKFLOW', 'ACTIVATE') || isAdmin;
  const canAuditView = usePermission('WORKFLOW', 'AUDIT_VIEW') || isAdmin;
  const canApprove = usePermission('WORKFLOW', 'APPROVE') || isAdmin;
  const [workflows, setWorkflows] = useState([]);
  const [definitionsStatus, setDefinitionsStatus] = useState('loading');
  const [module, setModule] = useState('Sales');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState('diagram');
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      await saveWorkflowDefinitions(companyId, selected, { mode: 'update' });
      dispatch(addAlert({ type: 'success', message: `${selected.name} saved for ${selectedCompany?.name || 'this company'}.` }));
    } catch (error) {
      console.error('Failed to save workflow definitions', error);
      dispatch(addAlert({ type: 'error', message: error?.message || `Could not save ${selected.name}.` }));
    } finally {
      setIsSaving(false);
    }
  };
  const create = async () => {
    const id = `workflow-${Date.now()}`;
    const item = { id, module, name: 'New workflow', description: '', active: false, customerScope: 'all', initiatedBy: '', approvalRequired: true, approverRole: '', threshold: '', customerAcceptance: false, autoCreateOrder: false, emailNotifications: true, notes: '', steps: [{ id: `${id}-1`, title: 'New approval step', role: '', type: 'approval', active: true }] };
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
  const addStep = () => setSelected((item) => ({ ...item, steps: [...item.steps, { id: `${item.id}-${Date.now()}`, title: 'New approval step', role: 'Sales Manager', type: 'approval', active: true }] }));
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
      dispatch(addAlert({ type: 'info', message: `${deleteTarget.name} was removed from local state. ${result?.source === WORKFLOW_DATA_SOURCES.API ? 'Backend delete confirmed.' : 'Missing backend endpoint: DELETE /api/account/workflow/definitions/{definitionId}.'}` }));
    } catch (error) {
      console.error('Failed to delete workflow', error);
      dispatch(addAlert({ type: 'error', message: `Could not delete ${deleteTarget.name}. ${error?.message || 'Unexpected error.'}` }));
    } finally {
      setIsDeleting(false);
    }
  };
  const selectCompany = (id) => { const company = companies.find((item) => String(item.id || item.companyId || item.code) === id); if (!company) return; dispatch(setSelectedCompany(company)); if (routeCompanyId) navigate(`/company/${id}/workflows`); };

  return <div className="animate-fade-in space-y-4 pb-8"><div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 xl:flex-row xl:items-start xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[11px] text-zinc-400"><span>Administration</span><span>/</span><span className="text-zinc-600">Workflow &amp; Approvals</span></div><h1 className="page-title">Workflow &amp; Approvals</h1><p className="page-subtitle">Configure transaction approvals and automation for each company.</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative"><BuildingSelector companies={companies} selectedCompany={selectedCompany} companyId={companyId} onChange={selectCompany} /></div><button className="btn-icon border border-zinc-200 text-zinc-500 hover:bg-zinc-50" title="Notifications"><Bell size={16} /></button><button className="btn-secondary" type="button" onClick={() => dispatch(addAlert({ type: 'info', message: `Signed in as ${currentUser?.name || currentUser?.email || 'administrator'}.` }))}><User size={14} /> Profile</button>{canCreate && <button type="button" className="btn-primary" disabled={isSaving || isDeleting || definitionsStatus !== 'ready'} onClick={create}><Plus size={15} /> Create workflow</button>}</div></div><div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-800"><Building2Icon /><span>Configuration scope:</span><strong>{selectedCompany?.name || 'Selected company'}</strong><span className="text-blue-500">({companyId})</span><span className="ml-auto hidden text-[11px] text-blue-600 sm:block">Changes apply only to this company</span></div><div className="flex gap-1 overflow-x-auto border-b border-zinc-200">{MODULES.map((item) => <button type="button" key={item} onClick={() => setModule(item)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${module === item ? 'border-blue-600 text-blue-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}>{item}</button>)}</div><div className="grid min-w-0 gap-4 xl:grid-cols-[250px_minmax(360px,1fr)_360px]"><section className="card min-w-0 overflow-hidden"><div className="border-b border-zinc-100 p-3"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Workflows</h2><p className="text-[11px] text-zinc-400">{visibleWorkflows.length} configured</p></div><GitBranch size={17} className="text-blue-500" /></div><div className="relative mt-3"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" /><input className="input-field h-8 pl-8 text-xs" placeholder="Search workflows" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><div className="max-h-[650px] overflow-y-auto p-2">{definitionsStatus === 'loading' ? <div className="space-y-2 p-2"><ListSkeleton items={3} /></div> : definitionsStatus === 'error' ? <ErrorState title="Could not load workflows" message={`Workflow definitions could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} /> : <>{visibleWorkflows.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setErrors({}); }} className={`mb-1 w-full rounded-lg border p-3 text-left transition-colors ${item.id === selected?.id ? 'border-blue-200 bg-blue-50/70' : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50'}`}><div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-zinc-800">{item.name}</span><StatusBadge active={item.active} /></div><p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{item.description}</p></button>)}{!visibleWorkflows.length && <div className="p-5 text-center text-xs text-zinc-400">No workflows in {module}.</div>}</>}</div></section><section className="card min-w-0 overflow-hidden"><div className="border-b border-zinc-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="mb-1 flex items-center gap-2"><h2 className="text-base font-semibold text-zinc-900">{selected?.name || 'No workflow selected'}</h2>{selected && <StatusBadge active={selected.active} />}</div><p className="max-w-2xl text-xs text-zinc-500">{selected?.description || 'Create a workflow to begin configuring approvals.'}</p></div>{selected && <div className="flex items-center gap-1"><button type="button" title="Duplicate workflow" disabled={!canCreate || isSaving || isDeleting} onClick={create} className="btn-icon text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"><Copy size={15} /></button><button type="button" title="Delete workflow" disabled={!canDelete || isSaving || isDeleting} onClick={deleteWorkflow} className="btn-icon text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={15} /></button></div>}</div><div className="mt-4 flex gap-1 overflow-x-auto">{[['diagram', 'Workflow diagram', GitBranch], ['rules', 'Approval rules', ShieldCheck], ['email', 'Email notifications', Mail], ['audit', 'Audit trail', Activity]].map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2 text-[11px] font-semibold ${activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}><Icon size={13} />{label}</button>)}</div></div><div className="p-4">{definitionsStatus === 'loading' ? <div className="space-y-2"><ListSkeleton items={3} /></div> : definitionsStatus === 'error' ? <ErrorState title="Workflow configuration unavailable" message={`Workflow definitions could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} /> : <>{selected && activeTab === 'diagram' && <WorkflowDiagram workflow={selected} canEdit={canEdit} onUpdateStep={updateStep} onRemoveStep={removeStep} onMoveStep={moveStep} onAddStep={addStep} />}{selected && activeTab === 'rules' && <div className="space-y-3"><InfoRow icon={ShieldCheck} label="Approval threshold" value={`₹ ${selected.threshold || 'Not set'}`} /><InfoRow icon={Users} label="Approver" value={selected.approverRole || 'Not configured'} /><InfoRow icon={Clock3} label="Active approval steps" value={`${selected.steps.filter((step) => step.type === 'approval' && step.active).length} step(s)`} />{errors.steps && <p className="rounded-md bg-red-50 p-3 text-xs text-red-700">{errors.steps}</p>}</div>}{selected && activeTab === 'email' && <div className="space-y-4"><div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4"><div className="flex items-start gap-3"><Mail size={18} className="mt-0.5 text-blue-600" /><div><p className="text-sm font-semibold text-zinc-800">Email notification policy</p><p className="mt-1 text-xs text-zinc-500">Notifications are sent to the initiator and the assigned approver when a workflow step changes.</p></div></div></div><InfoRow icon={Bell} label="Status" value={selected.emailNotifications ? 'Enabled' : 'Disabled'} /></div>}{selected && activeTab === 'audit' && <AuditTrailPanel companyId={companyId} module={selected.module} selectedId={selected.id} currentUser={currentUser} />}{!selected && <EmptyState onCreate={canCreate ? create : undefined} />}</>}</div></section><section className="card min-w-0"><div className="border-b border-zinc-100 p-4"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Configuration</h2><p className="text-[11px] text-zinc-400">Company-specific settings</p></div><HelpCircle size={16} className="text-zinc-400" /></div></div><div className="p-4">{definitionsStatus === 'loading' ? <div className="space-y-2"><ListSkeleton items={4} /></div> : definitionsStatus === 'error' ? <ErrorState title="Configuration unavailable" message={`Settings could not be loaded for ${selectedCompany?.name || companyId}.`} onRetry={reloadDefinitions} /> : <>{selected ? <><ConfigurationForm workflow={selected} setWorkflow={setSelected} canEdit={canEdit} errors={errors} /><div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4"><button type="button" className="btn-secondary" disabled={isSaving} onClick={() => { reloadDefinitions(); setErrors({}); }}>Cancel</button><button type="button" className="btn-primary" disabled={!canEdit || isSaving} onClick={save}><Save size={14} /> Save changes</button></div></> : <EmptyState onCreate={canCreate ? create : undefined} />}</>}</div></section></div><ConfirmModal open={!!deleteTarget} isDestructive title="Delete workflow" message={deleteTarget ? `Delete "${deleteTarget.name}"?` : ''} confirmLabel="Delete" cancelLabel="Cancel" details="This removes the approval configuration for the selected company. The workflow definition API is not documented yet, so only the local draft is affected." loading={isDeleting} loadingText="Deleting..." onConfirm={confirmDeleteWorkflow} onCancel={() => setDeleteTarget(null)} zIndex={10000} /></div>;
}

function InfoRow({ icon: Icon, label, value }) { return <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><Icon size={15} className="text-blue-500" />{label}</span><span className="text-xs font-semibold text-zinc-900">{value}</span></div>; }
function EmptyState({ onCreate }) { return <ExistingEmptyState title="No workflow selected" description="Create a workflow to configure approval routing." icon={GitBranch} action={onCreate ? <button type="button" className="btn-primary" onClick={onCreate}><Plus size={14} /> Create workflow</button> : null} />; }
function Building2Icon() { return <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600"><Building2 size={14} /></div>; }
function BuildingSelector({ companies, selectedCompany, companyId, onChange }) { const options = companies.length ? companies : [{ id: companyId, name: selectedCompany?.name || 'Current company' }]; return <label className="flex h-8 items-center gap-2 rounded-md border border-blue-200 bg-white px-2.5 text-xs font-semibold text-zinc-700"><span className="hidden text-[10px] font-semibold uppercase tracking-wide text-zinc-400 sm:inline">Company</span><select aria-label="Selected company" value={companyId} onChange={(e) => onChange(e.target.value)} className="max-w-[155px] border-0 bg-transparent p-0 text-xs font-semibold outline-none">{options.map((company) => <option key={company.id || company.companyId || company.code} value={company.id || company.companyId || company.code}>{company.name || company.companyName || company.code || company.id}</option>)}</select><ChevronDown size={13} className="text-zinc-400" /></label>; }

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
        setEntries(result.entries);
        setPagination(result.pagination);
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

  return <div className="space-y-3">
    <InfoRow icon={Activity} label="Last updated" value={latest ? formatDateTime(latest.performedAt) : 'No changes recorded yet'} />
    <InfoRow icon={User} label="Updated by" value={latest?.performedBy || currentUser?.name || currentUser?.email || 'No changes recorded yet'} />
    {entries.length === 0 && <p className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 text-xs text-zinc-400">No audit entries found for this workflow. Entries appear here via <span className="font-mono">GET /api/account/audit-logs</span> once a step is approved, rejected, or changed under this company.</p>}
    {entries.length > 0 && <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">{entries.map((entry) => <div key={entry.id || `${entry.performedAt}-${entry.actionType}`} className="flex items-start gap-3 px-3 py-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-zinc-800">{entry.performedBy || 'System'}</p><p className="mt-0.5 text-[11px] text-zinc-500">{(entry.entityName || module)} · {String(entry.actionType || 'ACTION').toUpperCase()}</p><p className="mt-0.5 text-[11px] text-zinc-400">{formatDateTime(entry.performedAt)}{entry.ipAddress ? ` · ${entry.ipAddress}` : ''}</p>{entry.description && <p className="mt-1 text-[11px] text-zinc-600">{entry.description}</p>}</div></div>)}</div>}
    {pagination && pagination.totalPages > 1 && <p className="pt-1 text-right text-[10px] text-zinc-400">Page {pagination.page + 1} of {pagination.totalPages} · {pagination.totalElements} record(s)</p>}
  </div>;
}
