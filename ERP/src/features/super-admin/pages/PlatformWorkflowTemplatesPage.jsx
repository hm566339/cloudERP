import React, { useState, useEffect, useMemo } from 'react';
import {
  GitFork, Plus, Search, RefreshCw, Eye, Edit, Trash2, CheckCircle,
  XCircle, ArrowRight, ShieldAlert, AlertTriangle, Layers, Users,
  Clock, Check, Play, History, Send, Settings, ChevronDown, ChevronRight,
  Filter, Building2, HelpCircle
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { platformWorkflowTemplatesApi } from '../../../api/account/workflowDefinitions';

export default function PlatformWorkflowTemplatesPage() {
  const dispatch = useAppDispatch();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isRolloutOpen, setIsRolloutOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rolloutLogs, setRolloutLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Rollout modal state
  const [rolloutMode, setRolloutMode] = useState('NON_CUSTOMIZED');
  const [propagateToCompanies, setPropagateToCompanies] = useState(true);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [rolloutSubmitting, setRolloutSubmitting] = useState(false);
  const [rolloutResult, setRolloutResult] = useState(null);

  // Editor form state
  const [editingId, setEditingId] = useState(null);
  const [editorTab, setEditorTab] = useState('general');
  const [formData, setFormData] = useState(getInitialFormData());

  function getInitialFormData() {
    return {
      templateCode: '',
      templateName: '',
      moduleName: 'ACCOUNT',
      documentType: 'FISCAL_YEAR',
      description: '',
      version: 1,
      isActive: true,
      isDefault: true,
      initiatedByRoleName: 'OWNER',
      customerScope: 'all',
      approvalThreshold: '',
      isApprovalRequired: true,
      customerAcceptance: false,
      autoCreateOrder: false,
      emailNotifications: true,
      internalNotes: '',
      createNewVersion: false,
      stages: [
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
      ],
      transitions: [
        { actionType: 'SUBMIT', sourceStageCode: '', targetStageCode: 'REVIEW', allowedRoles: 'OWNER,ACCOUNTANT' },
        { actionType: 'APPROVE', sourceStageCode: 'REVIEW', targetStageCode: 'FINAL_APPROVAL', allowedRoles: 'ACCOUNTANT' },
        { actionType: 'APPROVE', sourceStageCode: 'FINAL_APPROVAL', targetStageCode: '', allowedRoles: 'FINANCE_MANAGER' },
        { actionType: 'REJECT', sourceStageCode: 'REVIEW', targetStageCode: '', allowedRoles: 'ACCOUNTANT' },
        { actionType: 'REJECT', sourceStageCode: 'FINAL_APPROVAL', targetStageCode: '', allowedRoles: 'FINANCE_MANAGER' }
      ]
    };
  }

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await platformWorkflowTemplatesApi.getList();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.message || 'Failed to load platform templates' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (search) {
        const s = search.toLowerCase();
        const code = (t.templateCode || '').toLowerCase();
        const name = (t.templateName || '').toLowerCase();
        const doc = (t.documentType || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !doc.includes(s)) return false;
      }
      if (moduleFilter !== 'ALL' && t.moduleName !== moduleFilter) return false;
      if (statusFilter === 'ACTIVE' && !t.isActive) return false;
      if (statusFilter === 'INACTIVE' && t.isActive) return false;
      if (statusFilter === 'DEFAULT' && !t.isDefault) return false;
      return true;
    });
  }, [templates, search, moduleFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
    setEditorTab('general');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template) => {
    setEditingId(template.id);
    setFormData({
      templateCode: template.templateCode || '',
      templateName: template.templateName || '',
      moduleName: template.moduleName || 'ACCOUNT',
      documentType: template.documentType || 'FISCAL_YEAR',
      description: template.description || '',
      version: template.version || 1,
      isActive: template.isActive ?? true,
      isDefault: template.isDefault ?? true,
      initiatedByRoleName: template.initiatedByRoleName || '',
      customerScope: template.customerScope || 'all',
      approvalThreshold: template.approvalThreshold || '',
      isApprovalRequired: template.isApprovalRequired ?? true,
      customerAcceptance: template.customerAcceptance ?? false,
      autoCreateOrder: template.autoCreateOrder ?? false,
      emailNotifications: template.emailNotifications ?? true,
      internalNotes: template.internalNotes || '',
      createNewVersion: false,
      stages: template.stages && template.stages.length > 0 ? template.stages.map(s => ({
        stageCode: s.stageCode || '',
        stageName: s.stageName || '',
        sequenceNo: s.sequenceNo || 1,
        executionType: s.executionType || 'SEQUENTIAL',
        minimumApprovalsRequired: s.minimumApprovalsRequired || 1,
        rejectionAction: s.rejectionAction || 'REJECT_DOCUMENT',
        isMandatory: s.isMandatory ?? true,
        isActive: s.isActive ?? true,
        approvers: s.approvers ? s.approvers.map(a => ({
          approverType: a.approverType || 'ROLE',
          roleName: a.roleName || '',
          departmentName: a.departmentName || '',
          ruleExpression: a.ruleExpression || '',
          approvalOrder: a.approvalOrder || 1,
          isRequired: a.isRequired ?? true,
          canDelegate: a.canDelegate ?? true,
        })) : [],
        sla: s.sla ? {
          durationHours: s.sla.durationHours || 24,
          reminderHours: s.sla.reminderHours || 12,
          escalationAction: s.sla.escalationAction || 'NOTIFY_MANAGER',
          escalateToRoleName: s.sla.escalateToRoleName || '',
        } : null
      })) : getInitialFormData().stages,
      transitions: template.transitions && template.transitions.length > 0 ? template.transitions.map(tr => ({
        actionType: tr.actionType || 'APPROVE',
        sourceStageCode: tr.sourceStageCode || '',
        targetStageCode: tr.targetStageCode || '',
        transitionCondition: tr.transitionCondition || '',
        allowedRoles: tr.allowedRoles || '',
      })) : getInitialFormData().transitions
    });
    setEditorTab('general');
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await platformWorkflowTemplatesApi.update(editingId, formData);
        dispatch(addAlert({ type: 'success', message: 'Platform template updated successfully' }));
      } else {
        await platformWorkflowTemplatesApi.create(formData);
        dispatch(addAlert({ type: 'success', message: 'Platform template created successfully' }));
      }
      setIsEditorOpen(false);
      loadTemplates();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to save template' }));
    }
  };

  const handleToggleActive = async (template) => {
    try {
      if (template.isActive) {
        await platformWorkflowTemplatesApi.deactivate(template.id);
        dispatch(addAlert({ type: 'success', message: `Template ${template.templateCode} deactivated` }));
      } else {
        await platformWorkflowTemplatesApi.activate(template.id);
        dispatch(addAlert({ type: 'success', message: `Template ${template.templateCode} activated` }));
      }
      loadTemplates();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.message || 'Status toggle failed' }));
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Are you sure you want to delete platform template "${template.templateName}" (${template.templateCode})?`)) {
      return;
    }
    try {
      await platformWorkflowTemplatesApi.delete(template.id);
      dispatch(addAlert({ type: 'success', message: 'Platform template deleted' }));
      loadTemplates();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.message || 'Delete failed' }));
    }
  };

  const handleOpenRollout = (template) => {
    setSelectedTemplate(template);
    setRolloutMode('NON_CUSTOMIZED');
    setPropagateToCompanies(true);
    setForceConfirmed(false);
    setRolloutResult(null);
    setIsRolloutOpen(true);
  };

  const handleExecuteRollout = async () => {
    if (rolloutMode === 'FORCE_ALL' && !forceConfirmed) {
      dispatch(addAlert({ type: 'error', message: 'Please confirm force update checkbox' }));
      return;
    }
    setRolloutSubmitting(true);
    setRolloutResult(null);
    try {
      const res = await platformWorkflowTemplatesApi.rollout(selectedTemplate.id, {
        rolloutMode,
        propagateToCompanies,
        comment: `Rollout executed from platform console by system admin`
      });
      setRolloutResult(res);
      dispatch(addAlert({ type: 'success', message: 'Rollout completed successfully!' }));
      loadTemplates();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Rollout failed' }));
    } finally {
      setRolloutSubmitting(false);
    }
  };

  const handleOpenLogs = async (template) => {
    setSelectedTemplate(template);
    setLogsLoading(true);
    setIsLogsOpen(true);
    try {
      const logs = await platformWorkflowTemplatesApi.getRolloutLogs(template.id);
      setRolloutLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.message || 'Failed to load rollout logs' }));
    } finally {
      setLogsLoading(false);
    }
  };

  // Helper to add/remove stages in editor
  const addStage = () => {
    const seq = formData.stages.length + 1;
    const newStage = {
      stageCode: `STAGE_${seq}`,
      stageName: `Stage ${seq}`,
      sequenceNo: seq,
      executionType: 'SEQUENTIAL',
      minimumApprovalsRequired: 1,
      rejectionAction: 'REJECT_DOCUMENT',
      isMandatory: true,
      isActive: true,
      approvers: [
        { approverType: 'ROLE', roleName: 'MANAGER', approvalOrder: 1, isRequired: true, canDelegate: true }
      ],
      sla: { durationHours: 24, reminderHours: 12, escalationAction: 'NOTIFY_MANAGER', escalateToRoleName: 'ADMIN' }
    };
    setFormData({ ...formData, stages: [...formData.stages, newStage] });
  };

  const removeStage = (idx) => {
    if (formData.stages.length <= 1) {
      dispatch(addAlert({ type: 'error', message: 'At least one stage is required' }));
      return;
    }
    const updated = formData.stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequenceNo: i + 1 }));
    setFormData({ ...formData, stages: updated });
  };

  const updateStageField = (idx, field, value) => {
    const updated = [...formData.stages];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, stages: updated });
  };

  const updateApproverField = (stageIdx, appIdx, field, value) => {
    const updatedStages = [...formData.stages];
    const approvers = [...updatedStages[stageIdx].approvers];
    approvers[appIdx] = { ...approvers[appIdx], [field]: value };
    updatedStages[stageIdx].approvers = approvers;
    setFormData({ ...formData, stages: updatedStages });
  };

  const addApproverToStage = (stageIdx) => {
    const updatedStages = [...formData.stages];
    const approvers = updatedStages[stageIdx].approvers || [];
    approvers.push({
      approverType: 'ROLE',
      roleName: 'APPROVER',
      approvalOrder: approvers.length + 1,
      isRequired: true,
      canDelegate: true,
    });
    updatedStages[stageIdx].approvers = approvers;
    setFormData({ ...formData, stages: updatedStages });
  };

  const removeApproverFromStage = (stageIdx, appIdx) => {
    const updatedStages = [...formData.stages];
    const approvers = updatedStages[stageIdx].approvers.filter((_, i) => i !== appIdx);
    updatedStages[stageIdx].approvers = approvers;
    setFormData({ ...formData, stages: updatedStages });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <GitFork size={20} />
            </span>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Platform Workflow Templates
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              Level 1: SystemAdmin
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Global default workflows automatically cloned to new organizations and rolled out centrally across companies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTemplates}
            disabled={loading}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Refresh templates"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={15} />
            <span>Create Global Template</span>
          </button>
        </div>
      </div>

      {/* ── Three-Level Architecture Architecture Legend ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 text-xs">
          <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Level 1: Platform Template
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Centrally governed by SystemAdmin. Versioned with global rollout capabilities.
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs">
          <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Level 2: Organization Template
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Auto-cloned on signup. Organizations can customize without affecting other orgs.
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs">
          <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Level 3: Company Workflows
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Provisioned to each company with localized role mapping and customization guards.
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search code, name, document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-zinc-800 dark:text-zinc-200"
          >
            <option value="ALL">All Modules</option>
            <option value="ACCOUNT">Account</option>
            <option value="SALES">Sales</option>
            <option value="INVENTORY">Inventory</option>
            <option value="PURCHASE">Purchase</option>
            <option value="HR">HR</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-zinc-800 dark:text-zinc-200"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
            <option value="DEFAULT">Default for New Orgs</option>
          </select>
        </div>
      </div>

      {/* ── Templates Table ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Template Code & Name</th>
                <th className="py-3 px-4">Module / Doc Type</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Stages</th>
                <th className="py-3 px-4">Rollout Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading && templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading platform workflow templates...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400">
                    No platform workflow templates found. Click "Create Global Template" to configure one.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>{t.templateName}</span>
                        {t.isDefault && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                        {t.templateCode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                        {t.documentType}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {t.moduleName || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px]">
                        v{t.version}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Layers size={13} />
                        <span>{t.stages?.length || 0} stages</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{t.linkedOrganizationCount || 0}</span> orgs adopted
                      </div>
                      {t.customizedOrganizationCount > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400">
                          {t.customizedOrganizationCount} customized
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(t)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {t.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        <span>{t.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRollout(t)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                          title="Roll out to organizations"
                        >
                          <Send size={12} />
                          <span>Rollout</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenLogs(t)}
                          className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="View Rollout Logs"
                        >
                          <History size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="Edit Template"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Rollout Modal ── */}
      {isRolloutOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Send size={18} className="text-blue-600" />
                  Rollout Platform Template
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Propagate <strong>{selectedTemplate.templateName}</strong> (v{selectedTemplate.version}) to tenant organizations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRolloutOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Rollout mode selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Select Rollout Mode:
              </label>

              {/* Mode 1 */}
              <label className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                rolloutMode === 'NEW_ORGS_ONLY'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rolloutMode"
                    value="NEW_ORGS_ONLY"
                    checked={rolloutMode === 'NEW_ORGS_ONLY'}
                    onChange={() => setRolloutMode('NEW_ORGS_ONLY')}
                    className="text-blue-600"
                  />
                  <span className="font-semibold">Mode 1: Apply to New Organizations Only</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-5 mt-1">
                  Marks this version as active default. Only newly registered organizations will receive this template. Existing organizations remain untouched.
                </p>
              </label>

              {/* Mode 2 */}
              <label className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                rolloutMode === 'NON_CUSTOMIZED'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rolloutMode"
                    value="NON_CUSTOMIZED"
                    checked={rolloutMode === 'NON_CUSTOMIZED'}
                    onChange={() => setRolloutMode('NON_CUSTOMIZED')}
                    className="text-blue-600"
                  />
                  <span className="font-semibold">Mode 2: Update Non-Customized Organizations (Recommended)</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-5 mt-1">
                  Updates all organizations that have <strong>not</strong> customized their template (<code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">is_customized = false</code>). Preserves tenant modifications.
                </p>
              </label>

              {/* Mode 3 */}
              <label className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                rolloutMode === 'FORCE_ALL'
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-950 dark:text-red-200'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rolloutMode"
                    value="FORCE_ALL"
                    checked={rolloutMode === 'FORCE_ALL'}
                    onChange={() => setRolloutMode('FORCE_ALL')}
                    className="text-red-600"
                  />
                  <span className="font-semibold text-red-600 dark:text-red-400">Mode 3: Force Update All Organizations</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-5 mt-1">
                  Overwrites all organization templates with the platform version, even if customized. Requires explicit confirmation below.
                </p>
              </label>
            </div>

            {/* Force update warning */}
            {rolloutMode === 'FORCE_ALL' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-xs">
                  <AlertTriangle size={15} />
                  <span>Warning: This will overwrite organization-level customizations!</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-red-900 dark:text-red-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceConfirmed}
                    onChange={(e) => setForceConfirmed(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>I understand that custom organization templates will be overwritten.</span>
                </label>
              </div>
            )}

            {/* Propagate to companies checkbox */}
            <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                id="propComp"
                checked={propagateToCompanies}
                onChange={(e) => setPropagateToCompanies(e.target.checked)}
                className="rounded text-blue-600"
              />
              <label htmlFor="propComp" className="cursor-pointer">
                Propagate changes down to all child companies under affected organizations
              </label>
            </div>

            {/* Rollout result display */}
            {rolloutResult && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" />
                  Rollout Execution Summary:
                </div>
                <div>Targeted: {rolloutResult.totalOrganizationsTargeted} | Updated: {rolloutResult.organizationsUpdated} | Skipped: {rolloutResult.organizationsSkippedCustomized}</div>
                <div>Companies Propagated: {rolloutResult.totalCompaniesPropagated}</div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setIsRolloutOpen(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteRollout}
                disabled={rolloutSubmitting || (rolloutMode === 'FORCE_ALL' && !forceConfirmed)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                {rolloutSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                <span>Execute Rollout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rollout Logs Modal ── */}
      {isLogsOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <History size={18} className="text-blue-600" />
                  Rollout Audit History
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Audit log for platform template <strong>{selectedTemplate.templateName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {logsLoading ? (
                <div className="text-center py-8 text-zinc-400">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2" />
                  Loading logs...
                </div>
              ) : rolloutLogs.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No rollout history found for this template yet.
                </div>
              ) : (
                rolloutLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          log.status === 'SKIPPED_CUSTOMIZED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">Mode: {log.rolloutMode}</span>
                        <span className="text-zinc-400">v{log.platformTemplateVersion}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-1">{log.message}</p>
                      {log.targetOrganizationId && (
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Org: {log.targetOrganizationId}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsLogsOpen(false)}
                className="px-4 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Template Drawer/Modal ── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 flex-none">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <GitFork size={18} className="text-blue-600" />
                  {editingId ? 'Edit Platform Template' : 'Create Global Platform Template'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure default stages, approver role names, and SLA rules for all organizations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Editor tab navigation */}
            <div className="flex items-center gap-1 px-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex-none">
              <button
                type="button"
                onClick={() => setEditorTab('general')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editorTab === 'general'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                1. General & Document
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('stages')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editorTab === 'stages'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                2. Approval Stages & Roles ({formData.stages.length})
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('transitions')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editorTab === 'transitions'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                3. State Machine Transitions ({formData.transitions?.length || 0})
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="p-6 overflow-y-auto flex-1">
              {editorTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Template Code *
                    </label>
                    <input
                      type="text"
                      disabled={!!editingId}
                      value={formData.templateCode}
                      onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
                      placeholder="e.g. FISCAL_YEAR_DEFAULT"
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 uppercase font-mono disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                      placeholder="e.g. Standard Fiscal Year Workflow"
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Module *
                    </label>
                    <select
                      value={formData.moduleName}
                      onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="ACCOUNT">Account</option>
                      <option value="SALES">Sales</option>
                      <option value="INVENTORY">Inventory</option>
                      <option value="PURCHASE">Purchase</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Document Type *
                    </label>
                    <input
                      type="text"
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      placeholder="e.g. FISCAL_YEAR, QUOTATION, STOCK_ADJUSTMENT"
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 uppercase font-mono"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the purpose and conditions of this workflow template..."
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-6 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">Is Active</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">Default for New Organizations</span>
                    </label>

                    {editingId && (
                      <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 font-semibold">
                        <input
                          type="checkbox"
                          checked={formData.createNewVersion}
                          onChange={(e) => setFormData({ ...formData, createNewVersion: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span>Bump to Next Version (v{(formData.version || 1) + 1})</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {editorTab === 'stages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      Configure stages and universal role names (e.g. ACCOUNTANT, FINANCE_MANAGER, OWNER).
                    </span>
                    <button
                      type="button"
                      onClick={addStage}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add Stage</span>
                    </button>
                  </div>

                  {formData.stages.map((stage, sIdx) => (
                    <div key={sIdx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                            {stage.sequenceNo}
                          </span>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {stage.stageName || `Stage ${sIdx + 1}`}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">({stage.stageCode})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStage(sIdx)}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                          title="Remove stage"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-0.5">Stage Code</label>
                          <input
                            type="text"
                            value={stage.stageCode}
                            onChange={(e) => updateStageField(sIdx, 'stageCode', e.target.value.toUpperCase())}
                            className="w-full px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-0.5">Stage Name</label>
                          <input
                            type="text"
                            value={stage.stageName}
                            onChange={(e) => updateStageField(sIdx, 'stageName', e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-0.5">Execution Type</label>
                          <select
                            value={stage.executionType}
                            onChange={(e) => updateStageField(sIdx, 'executionType', e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs"
                          >
                            <option value="SEQUENTIAL">Sequential</option>
                            <option value="PARALLEL">Parallel</option>
                          </select>
                        </div>
                      </div>

                      {/* Approvers inside stage */}
                      <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                            Approver Role Names
                          </span>
                          <button
                            type="button"
                            onClick={() => addApproverToStage(sIdx)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5"
                          >
                            <Plus size={11} /> Add Approver Role
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {stage.approvers.map((app, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
                              <span className="text-zinc-400 text-[10px] w-4">#{app.approvalOrder}</span>
                              <select
                                value={app.approverType}
                                onChange={(e) => updateApproverField(sIdx, aIdx, 'approverType', e.target.value)}
                                className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-[11px]"
                              >
                                <option value="ROLE">Role</option>
                                <option value="USER">User</option>
                                <option value="DEPARTMENT">Department</option>
                                <option value="RULE">Rule</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Role name e.g. ACCOUNTANT"
                                value={app.roleName || ''}
                                onChange={(e) => updateApproverField(sIdx, aIdx, 'roleName', e.target.value.toUpperCase())}
                                className="flex-1 px-2 py-0.5 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-[11px] font-mono"
                              />
                              <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={app.isRequired}
                                  onChange={(e) => updateApproverField(sIdx, aIdx, 'isRequired', e.target.checked)}
                                  className="rounded text-blue-600 scale-90"
                                />
                                <span>Required</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeApproverFromStage(sIdx, aIdx)}
                                className="text-zinc-400 hover:text-red-500 p-0.5"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editorTab === 'transitions' && (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500">
                    Define state machine transitions (SUBMIT, APPROVE, REJECT, RETURN).
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-2 px-3">Action</th>
                          <th className="py-2 px-3">Source Stage</th>
                          <th className="py-2 px-3">Target Stage</th>
                          <th className="py-2 px-3">Allowed Roles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {formData.transitions?.map((tr, tIdx) => (
                          <tr key={tIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                            <td className="py-2 px-3 font-semibold text-blue-600">{tr.actionType}</td>
                            <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400">{tr.sourceStageCode || '(Initial)'}</td>
                            <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400">{tr.targetStageCode || '(Completed)'}</td>
                            <td className="py-2 px-3 text-zinc-500 font-mono text-[11px]">{tr.allowedRoles || 'ANY'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex-none">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                {editingId ? 'Save Changes' : 'Create Global Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

