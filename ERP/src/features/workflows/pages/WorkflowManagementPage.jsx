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
import StatusBadge from '../../../components/common/StatusBadge';
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
  validateWorkflowDefinition,
  workflowAuditApi,
  workflowDefinitionApi,
} from '../services/workflowService';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import WorkflowDiagram from '../components/WorkflowDiagram';
import WorkflowConfigurationForm from '../components/WorkflowConfigurationForm';
import WorkflowAuditTrailPanel from '../components/WorkflowAuditTrailPanel';
import WorkflowBuildingSelector from '../components/WorkflowBuildingSelector';

export { extractRoles, resolveRoleId, resolveRoleName };

const MODULES = ['Sales', 'Purchase', 'Manufacturing', 'Inventory', 'Expenses', 'Invoices', 'Reimbursements', 'Others'];

const moduleToDocumentType = (value) => {
  switch ((value || '').toLowerCase()) {
    case 'sales':
      return 'SALES';
    case 'purchase':
      return 'PURCHASE';
    case 'manufacturing':
      return 'PRODUCTION_ORDER';
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
  const [draftWorkflow, setDraftWorkflow] = useState(null);
  const [previousSelectedId, setPreviousSelectedId] = useState('');
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [module, setModule] = useState('Sales');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState('diagram');
  const workflowListQuery = useListQuery(null, { searchParam: 'search' });
  const query = workflowListQuery.searchTerm;
  const setQuery = workflowListQuery.setSearch;
  const [errors, setErrors] = useState({});
  const [editingStepId, setEditingStepId] = useState(null);
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

  const reloadDefinitions = useCallback(async () => {
    if (!companyId) {
      setDefinitionsStatus('error');
      return [];
    }
    setDefinitionsStatus('loading');
    try {
      const result = await loadWorkflowDefinitions(companyId, undefined, { moduleName: module.toUpperCase() });
      const defs = result?.definitions || [];
      setWorkflows(defs);
      setDefinitionsStatus('ready');
      return defs;
    } catch (error) {
      console.error('Failed to reload workflow definitions', error);
      setDefinitionsStatus('error');
      dispatch(addAlert({ type: 'error', message: error?.message || 'Workflow definitions could not be reloaded from the backend.' }));
      return [];
    }
  }, [companyId, module, dispatch]);

  useEffect(() => {
    let active = true;
    setWorkflows([]);
    setSelectedId('');
    setDraftWorkflow(null);
    setErrors({});
    setQuery('');
    setActiveTab('diagram');
    setDeleteTarget(null);

    if (!companyId) {
      setDefinitionsStatus('error');
      return () => { active = false; };
    }

    setDefinitionsStatus('loading');
    loadWorkflowDefinitions(companyId, undefined, { moduleName: module.toUpperCase() })
      .then((result) => {
        if (!active) return;
        setWorkflows(result?.definitions || []);
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

  const visibleWorkflows = useMemo(
    () => workflows.filter((item) => (item.module === module || (item.moduleName && item.moduleName.toUpperCase() === module.toUpperCase())) && item.name.toLowerCase().includes(query.toLowerCase())),
    [workflows, module, query]
  );

  const existingCodes = useMemo(() => {
    return workflows
      .filter((w) => w.id !== selectedId && (!draftWorkflow || w.id !== draftWorkflow.id))
      .map((w) => String(w.workflowCode || w.code || '').trim().toUpperCase())
      .filter(Boolean);
  }, [workflows, selectedId, draftWorkflow]);

  const isEditingDraft = Boolean(draftWorkflow && selectedId === draftWorkflow.id);
  const selected = isEditingDraft
    ? draftWorkflow
    : (workflows.find((item) => item.id === selectedId) || visibleWorkflows[0] || (draftWorkflow && draftWorkflow.module === module ? draftWorkflow : null));

  const setSelected = (updater) => {
    if (isEditingDraft) {
      setDraftWorkflow((prev) => {
        if (!prev) return prev;
        return typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      });
    } else {
      setWorkflows((items) =>
        items.map((item) =>
          item.id === selected?.id ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater }) : item
        )
      );
    }
  };

  useEffect(() => {
    if (draftWorkflow && selectedId === draftWorkflow.id) return;
    if (visibleWorkflows.length && !visibleWorkflows.some((item) => item.id === selectedId)) {
      setSelectedId(visibleWorkflows[0].id);
    }
  }, [visibleWorkflows, selectedId, draftWorkflow]);

  useEffect(() => {
    if (!canAuditView && activeTab === 'audit') setActiveTab('diagram');
  }, [activeTab, canAuditView]);

  useEffect(() => {
    if (!selected) return;
    setErrors({});
  }, [selected?.id]);

  if (!canView) return <div className="card mx-auto mt-10 max-w-lg p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-zinc-400" size={34} /><h1 className="text-lg font-semibold text-zinc-900">Workflow access restricted</h1><p className="mt-2 text-sm text-zinc-500">You do not have permission to view workflow configurations for this company.</p></div>;

  const create = () => {
    const draftId = `draft-${Date.now()}`;
    const defaultRole = roles[0]?.id || '';
    const docType = module === 'Sales' ? 'QUOTATION' : moduleToDocumentType(module);
    const newDraft = {
      id: draftId,
      workflowCode: `${docType}_APPROVAL_${Date.now().toString().slice(-4)}`,
      name: 'New workflow',
      workflowName: 'New workflow',
      description: '',
      module,
      moduleName: (module || 'GENERAL').toUpperCase(),
      documentType: docType,
      active: false,
      isActive: false,
      customerScope: 'all',
      initiatedBy: defaultRole,
      approvalRequired: true,
      approverRole: defaultRole,
      threshold: '',
      customerAcceptance: false,
      autoCreateOrder: false,
      emailNotifications: true,
      notes: '',
      isDraft: true,
      steps: [
        {
          id: `${draftId}-1`,
          stageCode: 'STAGE_1',
          stageName: 'Initial Approval',
          title: 'Initial Approval',
          role: defaultRole,
          type: 'approval',
          active: true,
        },
      ],
    };

    if (selectedId && !draftWorkflow) {
      setPreviousSelectedId(selectedId);
    }
    setDraftWorkflow(newDraft);
    setSelectedId(draftId);
    setErrors({});
  };

  const duplicateWorkflow = () => {
    if (!selected) return;
    if (selectedId && !draftWorkflow) {
      setPreviousSelectedId(selectedId);
    }
    const draftId = `draft-${Date.now()}`;
    const copyName = `${selected.name || 'Workflow'} (Copy)`;
    const rawCode = selected.workflowCode || selected.code || '';
    const copyCode = rawCode ? `${rawCode}_COPY_${Date.now().toString().slice(-4)}` : `${moduleToDocumentType(module)}_COPY_${Date.now().toString().slice(-4)}`;

    const newDraft = {
      ...JSON.parse(JSON.stringify(selected)),
      id: draftId,
      name: copyName,
      workflowName: copyName,
      workflowCode: copyCode,
      active: false,
      isActive: false,
      isDraft: true,
    };
    setDraftWorkflow(newDraft);
    setSelectedId(draftId);
    setErrors({});
  };

  const cancel = () => {
    if (isEditingDraft) {
      setDraftWorkflow(null);
      setErrors({});
      if (previousSelectedId && visibleWorkflows.some((w) => w.id === previousSelectedId)) {
        setSelectedId(previousSelectedId);
      } else if (visibleWorkflows.length > 0) {
        setSelectedId(visibleWorkflows[0].id);
      } else {
        setSelectedId('');
      }
    } else {
      reloadDefinitions();
      setErrors({});
    }
  };

  const save = async () => {
    if (isSaving || !selected) return;

    // Validate Initiated By Role
    if (!selected.initiatedBy) {
      const err = { initiatedBy: 'Initiated by role is required.' };
      setErrors((prev) => ({ ...prev, ...err }));
      dispatch(addAlert({ type: 'error', message: 'Initiated by role is required.' }));
      return;
    }

    // Validate Steps
    const currentSteps = Array.isArray(selected.steps) ? selected.steps : [];
    if (currentSteps.length === 0) {
      setErrors((prev) => ({ ...prev, steps: 'At least one step is required.' }));
      dispatch(addAlert({ type: 'error', message: 'At least one step is required in the workflow sequence.' }));
      return;
    }

    for (let i = 0; i < currentSteps.length; i++) {
      const st = currentSteps[i];
      if (!st.title?.trim() && !st.stageName?.trim()) {
        const msg = `Step ${i + 1} name is required.`;
        setErrors((prev) => ({ ...prev, [`step_${i}_name`]: msg }));
        dispatch(addAlert({ type: 'error', message: msg }));
        setEditingStepId(st.id);
        return;
      }
    }

    const initiatedByRoleId = resolveRoleId(selected.initiatedBy, roles);
    const initiatedByRoleName = resolveRoleName(selected.initiatedBy, roles);
    const approverRoleId = resolveRoleId(selected.approverRole, roles);
    const approverRoleName = resolveRoleName(selected.approverRole, roles);

    const docType = selected.documentType || moduleToDocumentType(selected.module || module);
    const moduleName = (selected.moduleName || selected.module || module).toUpperCase();

    const desiredActive = Boolean(selected.active ?? selected.isActive ?? false);
    const isNewWorkflow = Boolean(isEditingDraft || !selected.id || String(selected.id).startsWith('draft-') || String(selected.id).startsWith('workflow-'));

    const payloadToSave = {
      ...selected,
      companyId,
      moduleName,
      documentType: docType,
      workflowName: selected.workflowName || selected.name,
      name: selected.workflowName || selected.name,
      workflowCode: selected.workflowCode || selected.code,
      initiatedBy: initiatedByRoleId,
      initiatedByRoleId,
      initiatedByRoleName,
      approverRole: approverRoleId,
      approverRoleId,
      approverRoleName,
      isActive: desiredActive,
      active: desiredActive,
      customerScope: selected.customerScope || 'all',
      threshold: selected.threshold || '',
      approvalThreshold: selected.threshold ? Number(String(selected.threshold).replace(/,/g, '')) : undefined,
      isApprovalRequired: selected.approvalRequired !== undefined ? Boolean(selected.approvalRequired) : true,
      approvalRequired: selected.approvalRequired !== undefined ? Boolean(selected.approvalRequired) : true,
      customerAcceptance: Boolean(selected.customerAcceptance),
      autoCreateOrder: Boolean(selected.autoCreateOrder),
      emailNotifications: selected.emailNotifications !== undefined ? Boolean(selected.emailNotifications) : true,
      notes: selected.notes || '',
      internalNotes: selected.notes || '',
      steps: currentSteps.map((step, idx) => ({
        ...step,
        sequenceNo: idx + 1,
        stageOrder: idx + 1,
        stageCode: step.stageCode || `STAGE_${idx + 1}`,
        stageName: step.stageName || step.title || `Stage ${idx + 1}`,
        title: step.title || step.stageName || `Stage ${idx + 1}`,
        role: resolveRoleId(step.role || approverRoleId, roles),
        roleId: resolveRoleId(step.role || approverRoleId, roles),
        roleName: resolveRoleName(step.role || approverRoleName, roles),
      })),
    };

    const validation = validateWorkflowDefinition(payloadToSave, { companyId });
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0] || 'Please fix the workflow validation errors.';
      dispatch(addAlert({ type: 'error', message: firstError }));
      return;
    }

    if (isNewWorkflow) {
      const codeCandidate = String(payloadToSave.workflowCode || '').trim().toUpperCase();
      if (existingCodes.includes(codeCandidate)) {
        const errorMsg = `Workflow code "${payloadToSave.workflowCode}" already exists for this company. Please specify a unique code.`;
        setErrors((prev) => ({ ...prev, workflowCode: errorMsg }));
        dispatch(addAlert({ type: 'error', message: errorMsg }));
        return;
      }
    }

    setErrors({});
    setIsSaving(true);

    try {
      if (isNewWorkflow) {
        const result = await saveWorkflowDefinitions(companyId, payloadToSave, { mode: 'create' });
        const createdDef = result?.definitions?.[0];
        const targetId = createdDef?.id;

        if (targetId) {
          if (desiredActive) {
            await workflowDefinitionApi.setActive(targetId, companyId);
          } else {
            await workflowDefinitionApi.deactivate(targetId, companyId);
          }
          await workflowDefinitionApi.get(targetId, companyId);
        }

        dispatch(addAlert({
          type: 'success',
          message: `${createdDef?.name || payloadToSave.name} created successfully for ${selectedCompany?.name || 'this company'}.`,
        }));

        setDraftWorkflow(null);
        const defs = await reloadDefinitions();
        if (targetId) {
          setSelectedId(targetId);
        } else if (defs && defs.length) {
          setSelectedId(defs[0].id);
        }
      } else {
        const targetId = selected.id;
        const result = await saveWorkflowDefinitions(companyId, payloadToSave, { mode: 'update' });
        const updatedDef = result?.definitions?.[0];

        if (targetId) {
          if (desiredActive) {
            await workflowDefinitionApi.setActive(targetId, companyId);
          } else {
            await workflowDefinitionApi.deactivate(targetId, companyId);
          }
          await workflowDefinitionApi.get(targetId, companyId);
        }

        dispatch(addAlert({
          type: 'success',
          message: `Workflow "${updatedDef?.name || payloadToSave.name}" updated successfully.`,
        }));

        const defs = await reloadDefinitions();
        if (targetId) {
          setSelectedId(targetId);
        } else if (defs && defs.length) {
          const match = defs.find((d) => d.id === selected.id);
          if (match) setSelectedId(match.id);
        }
      }
    } catch (error) {
      console.error('Failed to save workflow definition', error);
      const errorMsg = error?.response?.data?.message || error?.message || `Could not save ${selected.name}.`;
      if (error?.validationErrors) {
        setErrors(error.validationErrors);
      } else if (errorMsg.toLowerCase().includes('already exists') || error?.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          workflowCode: errorMsg,
        }));
      }
      dispatch(addAlert({
        type: 'error',
        message: errorMsg,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const updateStep = (stepId, changes) =>
    setSelected((item) => ({
      ...item,
      steps: (item.steps || []).map((step) =>
        step.id === stepId ? { ...step, ...changes } : step
      ),
    }));

  const addStep = () => {
    let newStepId = null;
    setSelected((item) => {
      const defaultRole = item.approverRole || (roles[0]?.id || '');
      const currentSteps = Array.isArray(item.steps) ? item.steps : [];
      const nextSeq = currentSteps.length + 1;
      newStepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newStep = {
        id: newStepId,
        stageCode: `STAGE_${nextSeq}`,
        stageName: `Step ${nextSeq}`,
        title: `Step ${nextSeq}`,
        role: defaultRole,
        roleId: resolveRoleId(defaultRole, roles),
        roleName: resolveRoleName(defaultRole, roles),
        type: 'approval',
        approvalRule: 'ANY_ONE',
        minimumApprovalsRequired: 1,
        active: true,
      };
      return {
        ...item,
        steps: [...currentSteps, newStep],
      };
    });
    if (newStepId) {
      setEditingStepId(newStepId);
    }
    return newStepId;
  };

  const duplicateStep = (stepId) => {
    let copyId = null;
    setSelected((item) => {
      const currentSteps = Array.isArray(item.steps) ? item.steps : [];
      const stepToCopy = currentSteps.find((s) => s.id === stepId);
      if (!stepToCopy) return item;
      const copyIndex = currentSteps.findIndex((s) => s.id === stepId);
      copyId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newStep = {
        ...JSON.parse(JSON.stringify(stepToCopy)),
        id: copyId,
        title: `${stepToCopy.title || stepToCopy.stageName || 'Step'} (Copy)`,
        stageName: `${stepToCopy.stageName || stepToCopy.title || 'Step'} (Copy)`,
        stageCode: `STAGE_${currentSteps.length + 1}`,
        sequenceNo: currentSteps.length + 1,
        stageOrder: currentSteps.length + 1,
      };
      const nextSteps = [...currentSteps];
      nextSteps.splice(copyIndex + 1, 0, newStep);
      const resequenced = nextSteps.map((step, idx) => ({
        ...step,
        sequenceNo: idx + 1,
        stageOrder: idx + 1,
        stageCode: step.stageCode || `STAGE_${idx + 1}`,
      }));
      return { ...item, steps: resequenced };
    });
    if (copyId) {
      setEditingStepId(copyId);
    }
    return copyId;
  };

  const removeStep = (stepId) =>
    setSelected((item) => {
      const filtered = (item.steps || []).filter((step) => step.id !== stepId);
      const resequenced = filtered.map((step, idx) => ({
        ...step,
        sequenceNo: idx + 1,
        stageOrder: idx + 1,
        stageCode: step.stageCode || `STAGE_${idx + 1}`,
      }));
      return { ...item, steps: resequenced };
    });

  const moveStep = (index, offset) =>
    setSelected((item) => {
      const targetIdx = index + offset;
      const currentSteps = Array.isArray(item.steps) ? item.steps : [];
      if (targetIdx < 0 || targetIdx >= currentSteps.length) return item;
      const newSteps = [...currentSteps];
      const [moved] = newSteps.splice(index, 1);
      newSteps.splice(targetIdx, 0, moved);
      const resequenced = newSteps.map((step, idx) => ({
        ...step,
        sequenceNo: idx + 1,
        stageOrder: idx + 1,
        stageCode: step.stageCode || `STAGE_${idx + 1}`,
      }));
      return { ...item, steps: resequenced };
    });

  const deleteWorkflow = () => {
    if (!selected) return;
    if (isEditingDraft) {
      setDraftWorkflow(null);
      setErrors({});
      if (previousSelectedId && visibleWorkflows.some((w) => w.id === previousSelectedId)) {
        setSelectedId(previousSelectedId);
      } else if (visibleWorkflows.length > 0) {
        setSelectedId(visibleWorkflows[0].id);
      } else {
        setSelectedId('');
      }
      dispatch(addAlert({ type: 'info', message: 'Unsaved draft discarded.' }));
      return;
    }
    setDeleteTarget(selected);
  };

  const confirmDeleteWorkflow = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteWorkflowDefinition(companyId, workflows, deleteTarget.id);
      const next = result.definitions;
      setWorkflows(next);
      setSelectedId(next.find((item) => item.module === module)?.id || '');
      setDeleteTarget(null);
      const isApi = result?.source === WORKFLOW_DATA_SOURCES.API;
      dispatch(addAlert({
        type: 'success',
        message: `${deleteTarget.name} was ${isApi ? 'deleted' : 'removed'} successfully.`,
      }));
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
          <WorkflowBuildingSelector
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
            <div className="mt-2.5">
              <SearchInput
                placeholder="Search workflows..."
                value={query}
                onChange={setQuery}
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
                {draftWorkflow && draftWorkflow.module === module && (
                  <button
                    type="button"
                    key={draftWorkflow.id}
                    onClick={() => { setSelectedId(draftWorkflow.id); setErrors({}); }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selected?.id === draftWorkflow.id
                        ? 'border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-400/30'
                        : 'border-dashed border-amber-300 bg-amber-50/20 hover:border-amber-400 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold truncate ${selected?.id === draftWorkflow.id ? 'text-zinc-950 font-bold' : 'text-zinc-800'}`}>
                        {draftWorkflow.name || 'Untitled draft'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border border-amber-300 bg-amber-50 text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        UNSAVED
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 leading-relaxed">
                      {draftWorkflow.description || 'Local draft — click Save changes to persist.'}
                    </p>
                  </button>
                )}
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
                {!visibleWorkflows.length && !(draftWorkflow && draftWorkflow.module === module) && (
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
                  {isEditingDraft ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border border-amber-300 bg-amber-50 text-amber-800 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      UNSAVED
                    </span>
                  ) : (
                    selected && <StatusBadge active={selected.active} />
                  )}
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
                    onClick={duplicateWorkflow}
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
                    onDuplicateStep={duplicateStep}
                    roles={roles}
                    editingStepId={editingStepId}
                    setEditingStepId={setEditingStepId}
                  />
                )}
                {selected && activeTab === 'rules' && (
                  <div className="space-y-3.5">
                    <InfoRow icon={ShieldCheck} label="Approval threshold" value={`₹ ${selected.threshold || '0.00'}`} />
                    <InfoRow icon={Users} label="Initiated by Role" value={resolveRoleName(selected.initiatedBy, roles) || 'Not selected'} />
                    <InfoRow icon={Users} label="Default Approver" value={resolveRoleName(selected.approverRole, roles) || 'Not configured'} />
                    <InfoRow icon={Clock3} label="Active approval steps" value={`${(selected.steps || []).filter((step) => step.active !== false).length} step(s)`} />

                    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Configured Step Rules</h3>
                      <div className="divide-y divide-zinc-100">
                        {(selected.steps || []).map((step, idx) => (
                          <div key={step.id || idx} className="py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-500">#{idx + 1}</span>
                              <span className="font-semibold text-zinc-900">{step.title || step.stageName}</span>
                              <span className="capitalize text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 font-medium text-zinc-600">
                                {step.type || 'approval'}
                              </span>
                            </div>
                            <div className="text-zinc-500 text-[11px] font-mono">
                              {step.type === 'condition'
                                ? `Condition: ${step.ruleExpression || 'None'}`
                                : step.type === 'notification'
                                ? `Channel: ${step.notificationChannel || 'IN_APP'}`
                                : `Role: ${resolveRoleName(step.role, roles) || 'Unassigned'} (${step.approvalRule === 'ALL_MUST_APPROVE' ? 'All must approve' : step.approvalRule === 'MINIMUM_REQUIRED' ? `${step.minimumApprovalsRequired || 1} required` : 'Any can approve'})`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                          <p className="mt-1 text-xs text-zinc-500">Notifications are sent to the initiator and assigned approvers when a workflow step changes or requires action.</p>
                        </div>
                      </div>
                    </div>
                    <InfoRow icon={Bell} label="Email notifications status" value={selected.emailNotifications ? 'Enabled' : 'Disabled'} />
                    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Notification Channels &amp; Steps</h3>
                      {(selected.steps || []).filter((s) => s.type === 'notification' || s.notificationChannel).length === 0 ? (
                        <p className="text-xs text-zinc-400">No dedicated notification steps configured.</p>
                      ) : (
                        (selected.steps || []).filter((s) => s.type === 'notification' || s.notificationChannel).map((s, idx) => (
                          <div key={s.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-800">{s.title || s.stageName}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">{s.notificationChannel || 'IN_APP'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {selected && activeTab === 'audit' && (
                  <WorkflowAuditTrailPanel
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
                  <WorkflowConfigurationForm
                    workflow={selected}
                    setWorkflow={setSelected}
                    canEdit={canEdit}
                    errors={errors}
                    roles={roles}
                    rolesLoading={rolesLoading}
                    rolesError={rolesError}
                    onRetryRoles={() => fetchRoles(companyId)}
                    existingCodes={existingCodes}
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
                onClick={cancel}
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
        details="This permanently removes the approval configuration for the selected company from the central workflow service."
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

