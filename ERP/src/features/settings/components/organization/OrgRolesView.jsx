import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Send,
  GitCompare,
  Upload,
  Check,
  X,
  Layers,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import {
  getOrgRoleTemplates,
  createOrgRoleTemplate,
  updateOrgRoleTemplate,
  duplicateOrgRoleTemplate,
  updateOrgRoleTemplateStatus,
  deleteOrgRoleTemplate,
  previewApplyOrgRoleTemplate,
  applyOrgRoleTemplate,
  compareRoleAcrossCompanies,
  importCompanyRoleAsTemplate,
  getOrgPermissionCatalog,
} from '../../../../api/sso/roleTemplate.api';
import { getRoles } from '../../../../api/sso/role';

export default function OrgRolesView({ organization, companies = [] }) {
  const dispatch = useAppDispatch();

  // Data states
  const [templates, setTemplates] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, SYSTEM, CUSTOM
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form State for Create/Edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSelectedPerms, setFormSelectedPerms] = useState(new Set());
  const [formSearchPerm, setFormSearchPerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply to Companies Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyTargetTemplate, setApplyTargetTemplate] = useState(null);
  const [applySelectedCompanies, setApplySelectedCompanies] = useState([]);
  const [applyOverwrite, setApplyOverwrite] = useState(false);
  const [applyPreview, setApplyPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Compare Across Companies Modal State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareRoleName, setCompareRoleName] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Import Company Role Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCompanyId, setImportCompanyId] = useState('');
  const [importCompanyRoles, setImportCompanyRoles] = useState([]);
  const [importRoleId, setImportRoleId] = useState('');
  const [importTemplateName, setImportTemplateName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [isLoadingCompanyRoles, setIsLoadingCompanyRoles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load Templates & Catalog
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesRes, catalogRes] = await Promise.all([
        getOrgRoleTemplates(),
        getOrgPermissionCatalog(),
      ]);
      setTemplates(Array.isArray(templatesRes) ? templatesRes : []);
      setCatalog(catalogRes || null);
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to load role templates',
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'SYSTEM' && t.isSystem) ||
        (typeFilter === 'CUSTOM' && !t.isSystem);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && t.status) ||
        (statusFilter === 'INACTIVE' && !t.status);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [templates, searchTerm, typeFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormSelectedPerms(new Set());
    setFormSearchPerm('');
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (template) => {
    setSelectedTemplate(template);
    setFormName(template.name || '');
    setFormDescription(template.description || '');
    setFormSelectedPerms(new Set((template.permissions || []).map((p) => p.toUpperCase())));
    setFormSearchPerm('');
    setIsEditOpen(true);
  };

  // Save Create Template
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'Template name is required' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrgRoleTemplate({
        name: formName.trim(),
        description: formDescription.trim(),
        permissionCodes: Array.from(formSelectedPerms),
      });
      dispatch(addAlert({ type: 'success', message: 'Role template created successfully' }));
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to create template',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Template
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'Template name is required' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateOrgRoleTemplate(selectedTemplate.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        permissionCodes: Array.from(formSelectedPerms),
      });
      dispatch(addAlert({ type: 'success', message: 'Role template updated successfully' }));
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to update template',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate Template
  const handleDuplicate = async (template) => {
    const newName = window.prompt(`Enter a name for the duplicated template:`, `${template.name} (Copy)`);
    if (!newName || !newName.trim()) return;

    try {
      await duplicateOrgRoleTemplate(template.id, newName.trim());
      dispatch(addAlert({ type: 'success', message: `Template duplicated as "${newName.trim()}"` }));
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to duplicate template',
        })
      );
    }
  };

  // Toggle Status
  const handleToggleStatus = async (template) => {
    try {
      await updateOrgRoleTemplateStatus(template.id, !template.status);
      dispatch(
        addAlert({
          type: 'success',
          message: `Template "${template.name}" ${!template.status ? 'activated' : 'deactivated'}`,
        })
      );
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to toggle status',
        })
      );
    }
  };

  // Delete Template
  const handleDelete = async (template) => {
    if (template.isSystem) {
      dispatch(
        addAlert({
          type: 'warning',
          message: 'System templates cannot be deleted. You can deactivate them instead.',
        })
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete custom template "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteOrgRoleTemplate(template.id);
      dispatch(addAlert({ type: 'success', message: `Template "${template.name}" deleted` }));
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to delete template',
        })
      );
    }
  };

  // Open Apply to Companies Modal
  const handleOpenApply = (template) => {
    setApplyTargetTemplate(template);
    // Pre-select companies that don't have this role or all companies
    setApplySelectedCompanies(companies.map((c) => c.id));
    setApplyOverwrite(false);
    setApplyPreview(null);
    setIsApplyOpen(true);
  };

  // Generate Apply Preview
  const handleRunPreview = async () => {
    if (!applySelectedCompanies.length) {
      dispatch(addAlert({ type: 'warning', message: 'Select at least one company' }));
      return;
    }

    setIsPreviewing(true);
    try {
      const res = await previewApplyOrgRoleTemplate(applyTargetTemplate.id, {
        companyIds: applySelectedCompanies,
        overwriteExisting: applyOverwrite,
      });
      setApplyPreview(res);
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to generate preview',
        })
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  // Confirm and Deploy Template
  const handleConfirmApply = async () => {
    if (!applySelectedCompanies.length) return;

    setIsApplying(true);
    try {
      const res = await applyOrgRoleTemplate(applyTargetTemplate.id, {
        companyIds: applySelectedCompanies,
        overwriteExisting: applyOverwrite,
      });

      const parts = [];
      if (res.createdCount > 0) parts.push(`${res.createdCount} created`);
      if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
      if (res.skippedCount > 0) parts.push(`${res.skippedCount} skipped`);

      dispatch(
        addAlert({
          type: 'success',
          message: `Template applied: ${parts.join(', ')}`,
        })
      );
      setIsApplyOpen(false);
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to apply template',
        })
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Open Compare Modal
  const handleOpenCompare = async (roleName) => {
    setCompareRoleName(roleName);
    setIsCompareOpen(true);
    setIsComparing(true);
    setCompareData(null);

    try {
      const res = await compareRoleAcrossCompanies(roleName);
      setCompareData(res);
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to compare roles across companies',
        })
      );
    } finally {
      setIsComparing(false);
    }
  };

  // Open Import Modal
  const handleOpenImport = () => {
    setImportCompanyId(companies[0]?.id || '');
    setImportCompanyRoles([]);
    setImportRoleId('');
    setImportTemplateName('');
    setImportDescription('');
    setIsImportOpen(true);
  };

  // Load roles when import company changes
  useEffect(() => {
    if (!importCompanyId || !isImportOpen) return;

    let isMounted = true;
    setIsLoadingCompanyRoles(true);
    getRoles({ companyId: importCompanyId })
      .then((res) => {
        if (!isMounted) return;
        const list = res?.content || res?.roles || (Array.isArray(res) ? res : []);
        setImportCompanyRoles(list);
        if (list.length > 0) {
          setImportRoleId(list[0].id);
          setImportTemplateName(list[0].name);
        } else {
          setImportRoleId('');
          setImportTemplateName('');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        dispatch(addAlert({ type: 'error', message: 'Failed to load company roles' }));
      })
      .finally(() => {
        if (isMounted) setIsLoadingCompanyRoles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [importCompanyId, isImportOpen, dispatch]);

  // Handle Import Submit
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importCompanyId || !importRoleId) {
      dispatch(addAlert({ type: 'warning', message: 'Select a company and a role' }));
      return;
    }

    setIsImporting(true);
    try {
      await importCompanyRoleAsTemplate({
        companyId: importCompanyId,
        roleId: importRoleId,
        templateName: importTemplateName.trim(),
        description: importDescription.trim(),
      });
      dispatch(addAlert({ type: 'success', message: 'Company role successfully imported as template' }));
      setIsImportOpen(false);
      loadData();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to import role as template',
        })
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle permission in form
  const togglePermission = (code) => {
    const next = new Set(formSelectedPerms);
    if (next.has(code.toUpperCase())) {
      next.delete(code.toUpperCase());
    } else {
      next.add(code.toUpperCase());
    }
    setFormSelectedPerms(next);
  };

  // Toggle module permissions in form
  const toggleModulePermissions = (moduleGroup, selectAll) => {
    const next = new Set(formSelectedPerms);
    moduleGroup.features.forEach((feat) => {
      feat.permissions.forEach((perm) => {
        if (selectAll) {
          next.add(perm.permissionCode.toUpperCase());
        } else {
          next.delete(perm.permissionCode.toUpperCase());
        }
      });
    });
    setFormSelectedPerms(next);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Shield size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Organization Role Management
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Centrally create and manage standard role templates, preview differences, and deploy them across operating companies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenImport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
            title="Convert an existing company role into an organization role template"
          >
            <Upload size={14} />
            <span>Import Role</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>New Role Template</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161922] p-3 rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9382] dark:text-[#6B7184]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates by role name or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] focus:outline-none focus:border-[#485942]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#F7F7F0] dark:bg-[#1D212C] p-1 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] text-xs">
            <span className="text-[11px] font-semibold text-[#8B9382] dark:text-[#6B7184] px-1.5">Type:</span>
            {['ALL', 'SYSTEM', 'CUSTOM'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-white dark:bg-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] shadow-2xs'
                    : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7F7F0] dark:bg-[#1D212C] p-1 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] text-xs">
            <span className="text-[11px] font-semibold text-[#8B9382] dark:text-[#6B7184] px-1.5">Status:</span>
            {['ALL', 'ACTIVE', 'INACTIVE'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white dark:bg-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] shadow-2xs'
                    : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D] bg-[#F7F7F0] dark:bg-[#1D212C]"
            title="Refresh Templates"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Templates Grid ── */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#8B9382] dark:text-[#6B7184]">
          <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-[#485942]" />
          <span>Loading organization role templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#161922] rounded-2xl border border-dashed border-[#D5D8CA] dark:border-[#2A2F3D] p-8">
          <Shield size={36} className="mx-auto text-[#8B9382] dark:text-[#6B7184] mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">No role templates found</h3>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1 max-w-md mx-auto">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or filters to find what you are looking for.'
              : 'Create your first standardized role template or import one from an existing company.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary rounded-xl"
          >
            <Plus size={13} />
            <span>Create Role Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const hasCustomized = (template.appliedCompanies || []).some((c) => c.isCustomized);

            return (
              <div
                key={template.id}
                className="flex flex-col justify-between bg-white dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] hover:border-[#485942] dark:hover:border-[#4A5568] transition-all p-5 shadow-2xs"
              >
                <div>
                  {/* Top Badges & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {template.isSystem ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EDE4] dark:bg-[#252E22] text-[#2E3D28] dark:text-[#B6C9B0] border border-[#D5D8CA] dark:border-[#384634]">
                          System Template
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          Custom Template
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          template.status
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {template.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(template)}
                        className="p-1 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
                        title="Duplicate template"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(template)}
                        className="p-1 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
                        title="Edit template"
                      >
                        <Edit size={13} />
                      </button>
                      {!template.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDelete(template)}
                          className="p-1 text-[#8B9382] hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete template"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-1.5">
                    {template.name}
                  </h3>
                  <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1 line-clamp-2 min-h-[2rem]">
                    {template.description || 'No description provided.'}
                  </p>

                  {/* Metadata & Permissions Count */}
                  <div className="mt-4 pt-3 border-t border-[#EDEEE4] dark:border-[#222736] flex items-center justify-between text-xs">
                    <span className="text-[#8B9382] dark:text-[#6B7184] font-medium">Permissions:</span>
                    <span className="font-bold text-[#2E3D28] dark:text-[#E6E8EE] bg-[#F7F7F0] dark:bg-[#1D212C] px-2 py-0.5 rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D]">
                      {template.permissionCount || (template.permissions || []).length} assigned
                    </span>
                  </div>

                  {/* Companies Deployment Summary */}
                  <div className="mt-2.5 text-xs">
                    <div className="flex items-center justify-between text-[#8B9382] dark:text-[#6B7184]">
                      <span className="font-medium">Company Deployment:</span>
                      <span className="font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">
                        {template.appliedCompaniesCount || 0} of {companies.length} companies
                      </span>
                    </div>

                    {/* Company chips */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(template.appliedCompanies || []).length > 0 ? (
                        template.appliedCompanies.map((c) => (
                          <span
                            key={c.companyId}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              c.isCustomized
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                : 'bg-[#F7F7F0] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border-[#D5D8CA] dark:border-[#2A2F3D]'
                            }`}
                            title={`${c.companyName} (${c.userCount} users)${c.isCustomized ? ' - Has customized permissions' : ' - Matching template'}`}
                          >
                            <Building2 size={10} />
                            <span>{c.companyName || c.companyCode}</span>
                            {c.isCustomized && <span className="text-[9px] text-amber-600 font-bold">*</span>}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#8B9382] dark:text-[#6B7184] italic">Not applied to any company yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-[#EDEEE4] dark:border-[#222736] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenApply(template)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl transition-all shadow-2xs"
                  >
                    <Send size={12} />
                    <span>Apply to Companies</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenCompare(template.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
                    title="Compare this role across all companies"
                  >
                    <GitCompare size={13} />
                    <span>Compare</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Create / Edit Role Template ── */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161922] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
              <div>
                <h2 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <Shield size={18} className="text-[#485942]" />
                  {isEditOpen ? `Edit Role Template: ${selectedTemplate?.name}` : 'Create Organization Role Template'}
                </h2>
                <p className="text-xs text-[#8B9382] dark:text-[#6B7184] mt-0.5">
                  Define template details and default permissions that will be propagated to companies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="p-1.5 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                    Role Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Senior Accountant, Sales Manager"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] focus:outline-none focus:border-[#485942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Role responsibilities and operational scope"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] focus:outline-none focus:border-[#485942]"
                  />
                </div>
              </div>

              {/* Permission Matrix Selector */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-[#EDEEE4] dark:border-[#222736] gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE] block">
                      Default Permissions ({formSelectedPerms.size} selected)
                    </span>
                    <span className="text-[11px] text-[#8B9382] dark:text-[#6B7184]">
                      Select actions allowed for this role across all business modules.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formSearchPerm}
                      onChange={(e) => setFormSearchPerm(e.target.value)}
                      placeholder="Filter permissions..."
                      className="px-2.5 py-1 text-xs rounded-lg bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const allCodes = new Set();
                        catalog?.modules?.forEach((m) =>
                          m.features?.forEach((f) =>
                            f.permissions?.forEach((p) => allCodes.add(p.permissionCode.toUpperCase()))
                          )
                        );
                        setFormSelectedPerms(allCodes);
                      }}
                      className="text-[11px] font-semibold text-[#485942] hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSelectedPerms(new Set())}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Modules list */}
                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {catalog?.modules?.map((mod) => {
                    // Filter features by search term
                    const filteredFeatures = mod.features?.filter((feat) => {
                      if (!formSearchPerm.trim()) return true;
                      const term = formSearchPerm.toLowerCase();
                      return (
                        feat.featureName.toLowerCase().includes(term) ||
                        feat.featureCode.toLowerCase().includes(term) ||
                        feat.permissions?.some((p) => p.permissionCode.toLowerCase().includes(term))
                      );
                    });

                    if (!filteredFeatures || filteredFeatures.length === 0) return null;

                    const allModuleCodes = [];
                    mod.features?.forEach((f) => f.permissions?.forEach((p) => allModuleCodes.push(p.permissionCode.toUpperCase())));
                    const allSelectedInMod = allModuleCodes.length > 0 && allModuleCodes.every((c) => formSelectedPerms.has(c));

                    return (
                      <div
                        key={mod.moduleName}
                        className="p-3.5 rounded-2xl bg-[#F7F7F0]/60 dark:bg-[#1D212C]/60 border border-[#D5D8CA] dark:border-[#2A2F3D]"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E3E6D8] dark:border-[#2A2F3D]">
                          <span className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                            {mod.displayName || mod.moduleName}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(mod, !allSelectedInMod)}
                            className="text-[10px] font-semibold text-[#485942] dark:text-[#A0A6B5] hover:underline"
                          >
                            {allSelectedInMod ? 'Deselect Module' : 'Select All in Module'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {filteredFeatures.map((feat) => (
                            <div
                              key={feat.featureCode}
                              className="p-2.5 bg-white dark:bg-[#161922] rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D]"
                            >
                              <div className="text-[11px] font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center justify-between">
                                <span>{feat.featureName || feat.featureCode}</span>
                                <span className="text-[9px] text-[#8B9382] font-mono">{feat.featureCode}</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {feat.permissions?.map((perm) => {
                                  const code = perm.permissionCode.toUpperCase();
                                  const isSelected = formSelectedPerms.has(code);

                                  return (
                                    <button
                                      key={perm.id || perm.permissionCode}
                                      type="button"
                                      onClick={() => togglePermission(code)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                                        isSelected
                                          ? 'bg-[#2E3D28] dark:bg-primary text-white border-[#2E3D28]'
                                          : 'bg-[#F7F7F0] dark:bg-[#1D212C] text-[#485942] dark:text-[#A0A6B5] border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4]'
                                      }`}
                                      title={perm.description || perm.permissionCode}
                                    >
                                      {perm.action}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] rounded-xl shadow-xs"
                >
                  {isSubmitting && <RefreshCw size={12} className="animate-spin" />}
                  <span>{isEditOpen ? 'Save Changes' : 'Create Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Apply to Companies ── */}
      {isApplyOpen && applyTargetTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161922] w-full max-w-2xl max-h-[90vh] rounded-3xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
              <div>
                <h2 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <Send size={18} className="text-[#485942]" />
                  Apply "{applyTargetTemplate.name}" to Companies
                </h2>
                <p className="text-xs text-[#8B9382] dark:text-[#6B7184] mt-0.5">
                  Deploy this template to single or multiple companies with safety preview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="p-1.5 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Target Companies Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                    Select Target Companies ({applySelectedCompanies.length} of {companies.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (applySelectedCompanies.length === companies.length) {
                        setApplySelectedCompanies([]);
                      } else {
                        setApplySelectedCompanies(companies.map((c) => c.id));
                      }
                      setApplyPreview(null);
                    }}
                    className="text-[11px] font-semibold text-[#485942] hover:underline"
                  >
                    {applySelectedCompanies.length === companies.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {companies.map((comp) => {
                    const isChecked = applySelectedCompanies.includes(comp.id);
                    const alreadyHas = (applyTargetTemplate.appliedCompanies || []).some(
                      (ac) => ac.companyId === comp.id
                    );

                    return (
                      <label
                        key={comp.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#F7F7F0] dark:bg-[#1D212C] border-[#485942]'
                            : 'bg-white dark:bg-[#161922] border-[#D5D8CA] dark:border-[#2A2F3D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setApplyPreview(null);
                              if (e.target.checked) {
                                setApplySelectedCompanies([...applySelectedCompanies, comp.id]);
                              } else {
                                setApplySelectedCompanies(applySelectedCompanies.filter((id) => id !== comp.id));
                              }
                            }}
                            className="rounded border-[#D5D8CA] text-[#485942] focus:ring-[#485942]"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE] truncate block">
                              {comp.companyName || comp.name}
                            </span>
                            <span className="text-[10px] text-[#8B9382] font-mono block">
                              Code: {comp.companyCode || comp.code}
                            </span>
                          </div>
                        </div>

                        {alreadyHas && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 shrink-0">
                            Has Role
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Overwrite Checkbox */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyOverwrite}
                    onChange={(e) => {
                      setApplyOverwrite(e.target.checked);
                      setApplyPreview(null);
                    }}
                    className="mt-0.5 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                      Update existing company roles with template permissions
                    </span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-0.5">
                      If checked, permissions of existing roles in selected companies will be aligned with this template.
                      <strong> Existing user assignments are strictly preserved.</strong> If unchecked, existing company roles are safely skipped.
                    </span>
                  </div>
                </label>
              </div>

              {/* Preview Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleRunPreview}
                  disabled={isPreviewing || !applySelectedCompanies.length}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl shadow-2xs"
                >
                  {isPreviewing ? <RefreshCw size={13} className="animate-spin" /> : <GitCompare size={13} />}
                  <span>Generate Differences Preview</span>
                </button>
              </div>

              {/* Differences Preview Table */}
              {applyPreview && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                    Preview Differences ({applyPreview.companies?.length || 0} companies analyzed)
                  </h3>

                  <div className="border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left divide-y divide-[#D5D8CA] dark:divide-[#2A2F3D]">
                      <thead className="bg-[#F7F7F0] dark:bg-[#1D212C] text-[#8B9382] dark:text-[#6B7184] font-semibold">
                        <tr>
                          <th className="p-2.5">Company</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Assigned Users</th>
                          <th className="p-2.5">Permission Changes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEEE4] dark:divide-[#222736]">
                        {applyPreview.companies?.map((item) => (
                          <tr key={item.companyId} className="bg-white dark:bg-[#161922]">
                            <td className="p-2.5 font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                              {item.companyName}
                            </td>
                            <td className="p-2.5">
                              {item.hasRole ? (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                  Exists {applyOverwrite ? '(will update)' : '(will skip)'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                  Will Create New
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-[#485942] dark:text-[#A0A6B5]">
                              {item.existingUserCount} user{item.existingUserCount === 1 ? '' : 's'} preserved
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                {item.addedPermissions?.length > 0 && (
                                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                                    +{item.addedPermissions.length} added
                                  </span>
                                )}
                                {item.removedPermissions?.length > 0 && (
                                  <span className="text-rose-700 dark:text-rose-300 font-bold">
                                    -{item.removedPermissions.length} removed
                                  </span>
                                )}
                                {item.unchangedPermissions?.length > 0 && (
                                  <span className="text-[#8B9382] font-medium">
                                    {item.unchangedPermissions.length} unchanged
                                  </span>
                                )}
                                {!item.addedPermissions?.length &&
                                  !item.removedPermissions?.length &&
                                  !item.unchangedPermissions?.length && (
                                    <span className="text-[#8B9382] italic">No changes</span>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 px-6 pb-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={isApplying || !applySelectedCompanies.length}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] rounded-xl shadow-xs"
              >
                {isApplying && <RefreshCw size={12} className="animate-spin" />}
                <span>Confirm & Deploy Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Compare Across Companies ── */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161922] w-full max-w-5xl max-h-[90vh] rounded-3xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
              <div>
                <h2 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <GitCompare size={18} className="text-[#485942]" />
                  Cross-Company Role Comparison: {compareRoleName}
                </h2>
                <p className="text-xs text-[#8B9382] dark:text-[#6B7184] mt-0.5">
                  Inspect permission divergence, custom modifications, and user counts across all operating companies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isComparing ? (
                <div className="py-16 text-center text-xs text-[#8B9382] dark:text-[#6B7184]">
                  <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-[#485942]" />
                  <span>Comparing role permissions across companies...</span>
                </div>
              ) : !compareData ? (
                <div className="py-12 text-center text-xs text-[#8B9382]">No comparison data available.</div>
              ) : (
                <div className="space-y-4">
                  {/* Company Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {compareData.companies?.map((cu) => (
                      <div
                        key={cu.companyId}
                        className={`p-3 rounded-xl border text-xs ${
                          cu.isCustomized
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                            : 'bg-[#F7F7F0] dark:bg-[#1D212C] border-[#D5D8CA] dark:border-[#2A2F3D]'
                        }`}
                      >
                        <span className="font-bold text-[#2E3D28] dark:text-[#E6E8EE] block truncate">
                          {cu.companyName}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
                          <span>Users: {cu.userCount}</span>
                          <span
                            className={`font-semibold ${
                              cu.isCustomized ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {cu.isCustomized ? 'Customized' : 'Standard'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Matrix Table */}
                  <div className="border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-2xl overflow-hidden text-xs max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-left divide-y divide-[#D5D8CA] dark:divide-[#2A2F3D]">
                      <thead className="bg-[#F7F7F0] dark:bg-[#1D212C] text-[#8B9382] dark:text-[#6B7184] font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5">Module & Feature</th>
                          <th className="p-2.5">Action</th>
                          <th className="p-2.5 text-center">Template Default</th>
                          {compareData.companies?.map((cu) => (
                            <th key={cu.companyId} className="p-2.5 text-center">
                              {cu.companyName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEEE4] dark:divide-[#222736]">
                        {compareData.permissionMatrix?.map((row) => (
                          <tr key={row.permissionCode} className="bg-white dark:bg-[#161922] hover:bg-[#F7F7F0]/40">
                            <td className="p-2.5">
                              <span className="font-bold text-[#2E3D28] dark:text-[#E6E8EE] block">
                                {row.featureName || row.featureCode}
                              </span>
                              <span className="text-[10px] text-[#8B9382] font-mono block">
                                {row.module} • {row.permissionCode}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-[#485942] dark:text-[#A0A6B5]">
                              {row.action}
                            </td>
                            <td className="p-2.5 text-center">
                              {row.templateHas ? (
                                <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                                  <Check size={12} />
                                </span>
                              ) : (
                                <span className="text-[#8B9382]">—</span>
                              )}
                            </td>
                            {compareData.companies?.map((cu) => {
                              const has = row.companyHas?.[cu.companyId];
                              const isDiverged = row.templateHas !== Boolean(has);

                              return (
                                <td key={cu.companyId} className="p-2.5 text-center">
                                  {has ? (
                                    <span
                                      className={`inline-flex p-1 rounded-full ${
                                        isDiverged
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                      title={isDiverged ? 'Customized: Granted in company but not in template' : 'Granted'}
                                    >
                                      <Check size={12} />
                                    </span>
                                  ) : isDiverged ? (
                                    <span
                                      className="inline-flex p-1 rounded-full bg-rose-100 text-rose-800"
                                      title="Customized: Missing in company though present in template"
                                    >
                                      <X size={12} />
                                    </span>
                                  ) : (
                                    <span className="text-[#8B9382]">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 px-6 pb-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex justify-end">
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Import Company Role ── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161922] w-full max-w-lg rounded-3xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
              <div>
                <h2 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <Upload size={18} className="text-[#485942]" />
                  Import Existing Company Role
                </h2>
                <p className="text-xs text-[#8B9382] dark:text-[#6B7184] mt-0.5">
                  Convert a customized company role into a reusable organization template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1.5 text-[#8B9382] hover:text-[#2E3D28] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Source Company <span className="text-rose-500">*</span>
                </label>
                <select
                  value={importCompanyId}
                  onChange={(e) => setImportCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name} ({c.companyCode || c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Source Role <span className="text-rose-500">*</span>
                </label>
                {isLoadingCompanyRoles ? (
                  <div className="text-[#8B9382] py-2 flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Loading company roles...</span>
                  </div>
                ) : importCompanyRoles.length === 0 ? (
                  <div className="text-rose-600 py-2">No roles found in this company.</div>
                ) : (
                  <select
                    value={importRoleId}
                    onChange={(e) => {
                      setImportRoleId(e.target.value);
                      const r = importCompanyRoles.find((item) => item.id === e.target.value);
                      if (r) setImportTemplateName(r.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                  >
                    {importCompanyRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  New Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={importTemplateName}
                  onChange={(e) => setImportTemplateName(e.target.value)}
                  placeholder="Template Name"
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  placeholder="e.g. Standard template imported from Company A"
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                />
              </div>

              <div className="pt-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importRoleId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] rounded-xl shadow-xs"
                >
                  {isImporting && <RefreshCw size={12} className="animate-spin" />}
                  <span>Import as Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

