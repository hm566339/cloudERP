import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Copy,
  Trash2,
  Edit2,
  Send,
  Upload,
  Check,
  X,
  Layers,
  GitCompare,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
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
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import Modal from '../../../../components/common/Modal';
import ExportModal from '../../../../components/common/ExportModal';
import { confirmDialog } from '../../../../utils/confirmDialog';

const DEFAULT_COLUMNS = [
  'roleName',
  'roleCode',
  'description',
  'usersCount',
  'permissionsCount',
  'status',
];

export default function OrgRolesView({ organization, companies = [] }) {
  const dispatch = useAppDispatch();

  // Data states
  const [templates, setTemplates] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Table Configuration & Filter States
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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

  // Filtered & Sorted Templates
  const filteredTemplates = useMemo(() => {
    return templates
      .filter((t) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesName = (t.name || '').toLowerCase().includes(term);
          const matchesCode = (t.code || '').toLowerCase().includes(term);
          const matchesDesc = (t.description || '').toLowerCase().includes(term);
          if (!matchesName && !matchesCode && !matchesDesc) return false;
        }

        if (typeFilter === 'System' && !t.isSystem) return false;
        if (typeFilter === 'Custom' && t.isSystem) return false;

        if (statusFilter === 'Active' && !t.status) return false;
        if (statusFilter === 'Inactive' && t.status) return false;

        return true;
      })
      .map((t) => ({
        ...t,
        roleName: t.name,
        roleCode: t.code || (t.name || '').toUpperCase().replace(/\s+/g, '_'),
        permissionsCount: (t.permissions || []).length,
        usersCount: t.assignedUsersCount ?? 0,
      }))
      .sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [templates, searchTerm, typeFilter, statusFilter, sortBy, sortOrder]);

  const totalElements = filteredTemplates.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedTemplates = useMemo(() => {
    const start = page * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, page, pageSize]);

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
    const newName = window.prompt('Enter a name for the duplicated template:', `${template.name} (Copy)`);
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

    const confirmed = await confirmDialog({
      title: 'Delete Role Template',
      message: `Are you sure you want to delete custom template "${template.name}"? This action cannot be undone.`,
      confirmText: 'Delete Template',
      isDestructive: true,
    });
    if (!confirmed) return;

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
    const targetName = roleName || (templates[0]?.name ?? 'Admin');
    setCompareRoleName(targetName);
    setIsCompareOpen(true);
    setIsComparing(true);
    setCompareData(null);

    try {
      const res = await compareRoleAcrossCompanies(targetName);
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
      .catch(() => {
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
    moduleGroup.features?.forEach((feat) => {
      feat.permissions?.forEach((perm) => {
        if (selectAll) {
          next.add(perm.permissionCode.toUpperCase());
        } else {
          next.delete(perm.permissionCode.toUpperCase());
        }
      });
    });
    setFormSelectedPerms(next);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
    setPage(0);
  };

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        header: 'ROLE NAME',
        accessorKey: 'roleName',
        sortable: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Shield size={16} />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                {row.name}
                {row.isSystem && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    System
                  </span>
                )}
              </div>
              {row.code && (
                <div className="text-[11px] text-zinc-400 font-mono">{row.code}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        header: 'ROLE CODE',
        accessorKey: 'roleCode',
        sortable: true,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {row.roleCode}
          </span>
        ),
      },
      {
        header: 'DESCRIPTION',
        accessorKey: 'description',
        cell: ({ row }) => (
          <span className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-1 max-w-xs">
            {row.description || 'No description provided'}
          </span>
        ),
      },
      {
        header: 'USERS',
        accessorKey: 'usersCount',
        sortable: true,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {row.usersCount} users
          </span>
        ),
      },
      {
        header: 'PERMISSIONS',
        accessorKey: 'permissionsCount',
        sortable: true,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
            {row.permissionsCount} perms
          </span>
        ),
      },
      {
        header: 'STATUS',
        accessorKey: 'status',
        sortable: true,
        cell: ({ row }) => (
          <DataTableStatusBadge status={row.status ? 'ACTIVE' : 'INACTIVE'} />
        ),
      },
      {
        header: 'ACTIONS',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenApply(row);
              }}
              className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Deploy to Companies"
            >
              <Send size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Edit Template"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate(row);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Duplicate Template"
            >
              <Copy size={15} />
            </button>
            {!row.isSystem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
                className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Delete Template"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies]
  );

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      {/* ── Page Header matching Customer Management ── */}
      <PageHeader
        title="Role Management"
        description="Centrally configure organization role templates and deploy them across operating companies"
        primaryAction={{
          label: 'New Role',
          icon: Plus,
          onClick: handleOpenCreate,
        }}
        secondaryActions={[
          {
            label: 'Import Role',
            icon: Upload,
            onClick: handleOpenImport,
          },
          {
            label: 'Compare Roles',
            icon: GitCompare,
            onClick: () => handleOpenCompare(null),
          },
        ]}
      />

      {/* ── Data Table Card matching Customer Management ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedTemplates}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          isLoading={isLoading}
          totalElements={totalElements}
          totalPages={totalPages}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          rowSelectionKey="id"
          expandedRowId={expandedRowId}
          onExpandedRowChange={setExpandedRowId}
          renderExpandedRow={(row) => (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl space-y-3 text-xs border border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Template Permissions:
                  </span>{' '}
                  <span className="text-zinc-500">
                    {(row.permissions || []).length} assigned permissions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(row)}
                    className="px-2.5 py-1 font-medium text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                  >
                    {row.status ? 'Deactivate Template' : 'Activate Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenApply(row)}
                    className="px-2.5 py-1 font-medium text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Send size={12} />
                    <span>Deploy to Companies</span>
                  </button>
                </div>
              </div>

              {/* Badges of granted permissions */}
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                {(row.permissions || []).length === 0 ? (
                  <span className="text-zinc-400 italic">No permissions configured for this template.</span>
                ) : (
                  (row.permissions || []).map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]"
                    >
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
          filterComponents={
            <div className="flex flex-wrap items-center gap-3 w-full">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Role name, code, description..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-36">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Role Type Filter */}
              <div className="w-36">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Role Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Types</option>
                  <option value="System">System</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Actions Button Bar */}
              <div className="flex items-end gap-2 ml-auto pt-4">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <Upload size={13} className="rotate-180" />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <RefreshCw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922]"
                  title="Refresh Data"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          }
          emptyState={
            <div className="py-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Shield size={24} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No role templates found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Try adjusting your search keywords or filter criteria to find role templates.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
              >
                <RefreshCw size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          }
        />
      </div>

      {/* ── MODAL: Create Role Template ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Role Template"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Role Template Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Sales Manager, Senior Accountant"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Define the scope and responsibilities for this role..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Grant Permissions ({formSelectedPerms.size} selected)
              </label>
              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={formSearchPerm}
                  onChange={(e) => setFormSearchPerm(e.target.value)}
                  placeholder="Filter permissions..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Permission Catalog Tree */}
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              {!catalog?.modules || catalog.modules.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No permission catalog loaded.
                </div>
              ) : (
                catalog.modules.map((mod) => (
                  <div key={mod.moduleCode} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-white dark:bg-zinc-900">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {mod.displayName || mod.moduleName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod, true)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod, false)}
                          className="text-[11px] text-zinc-500 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {mod.features?.map((feat) => (
                        <div key={feat.featureCode} className="pl-1">
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                            {feat.featureName || feat.featureCode}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {feat.permissions
                              ?.filter(
                                (perm) =>
                                  !formSearchPerm.trim() ||
                                  perm.permissionCode.toLowerCase().includes(formSearchPerm.toLowerCase()) ||
                                  (perm.description || '').toLowerCase().includes(formSearchPerm.toLowerCase())
                              )
                              .map((perm) => {
                                const isChecked = formSelectedPerms.has(perm.permissionCode.toUpperCase());
                                return (
                                  <label
                                    key={perm.permissionCode}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border cursor-pointer select-none transition-colors ${
                                      isChecked
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={isChecked}
                                      onChange={() => togglePermission(perm.permissionCode)}
                                    />
                                    <span>{perm.action}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isSubmitting ? 'Creating...' : 'Create Role Template'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Edit Role Template ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Role Template"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Role Template Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Grant Permissions ({formSelectedPerms.size} selected)
              </label>
              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={formSearchPerm}
                  onChange={(e) => setFormSearchPerm(e.target.value)}
                  placeholder="Filter permissions..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Permission Catalog Tree */}
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              {catalog?.modules?.map((mod) => (
                <div key={mod.moduleCode} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      {mod.displayName || mod.moduleName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(mod, true)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(mod, false)}
                        className="text-[11px] text-zinc-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {mod.features?.map((feat) => (
                      <div key={feat.featureCode} className="pl-1">
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                          {feat.featureName || feat.featureCode}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {feat.permissions
                            ?.filter(
                              (perm) =>
                                !formSearchPerm.trim() ||
                                perm.permissionCode.toLowerCase().includes(formSearchPerm.toLowerCase()) ||
                                (perm.description || '').toLowerCase().includes(formSearchPerm.toLowerCase())
                            )
                            .map((perm) => {
                              const isChecked = formSelectedPerms.has(perm.permissionCode.toUpperCase());
                              return (
                                <label
                                  key={perm.permissionCode}
                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border cursor-pointer select-none transition-colors ${
                                    isChecked
                                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium'
                                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isChecked}
                                    onChange={() => togglePermission(perm.permissionCode)}
                                  />
                                  <span>{perm.action}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Deploy / Apply to Companies ── */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title={`Deploy "${applyTargetTemplate?.name}" to Companies`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">
            Select one or more operating companies to provision or synchronize this role template.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Target Companies
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              {companies.map((c) => {
                const isSelected = applySelectedCompanies.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApplySelectedCompanies([...applySelectedCompanies, c.id]);
                        } else {
                          setApplySelectedCompanies(applySelectedCompanies.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Building2 size={14} className="text-zinc-400" />
                    <span className="font-medium truncate">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="applyOverwriteCheckbox"
              checked={applyOverwrite}
              onChange={(e) => setApplyOverwrite(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="applyOverwriteCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Overwrite existing company role customizations
            </label>
          </div>

          {/* Diff Preview Button & Results */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Change Preview
              </span>
              <button
                type="button"
                onClick={handleRunPreview}
                disabled={isPreviewing || applySelectedCompanies.length === 0}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
              >
                {isPreviewing ? 'Calculating...' : 'Preview Differences'}
              </button>
            </div>

            {applyPreview && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{applyPreview.toCreate?.length || 0} New Roles
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    ~{applyPreview.toUpdate?.length || 0} Updated Roles
                  </span>
                  <span className="text-zinc-500 font-semibold">
                    ={applyPreview.toSkip?.length || 0} Unchanged
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmApply}
              disabled={isApplying || applySelectedCompanies.length === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isApplying ? 'Deploying...' : 'Deploy to Selected Companies'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Compare Across Companies ── */}
      <Modal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        title={`Compare Role Matrix: ${compareRoleName}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Select Role Template:
            </label>
            <select
              value={compareRoleName}
              onChange={(e) => handleOpenCompare(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {isComparing ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              <RefreshCw size={24} className="mx-auto animate-spin mb-2 text-blue-600" />
              <span>Comparing permissions across operating companies...</span>
            </div>
          ) : !compareData ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No comparison data available for this role.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Company Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {compareData.companies?.map((cu) => (
                  <div
                    key={cu.companyId}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                      {cu.companyName}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                      <span>Users: {cu.userCount}</span>
                      <span
                        className={`font-semibold ${
                          cu.isCustomized ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {cu.isCustomized ? 'Customized' : 'Standard'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Permission Matrix Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto text-xs">
                <table className="w-full text-left divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">Feature & Code</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5 text-center">Template</th>
                      {compareData.companies?.map((cu) => (
                        <th key={cu.companyId} className="p-2.5 text-center">
                          {cu.companyName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900/40">
                    {compareData.permissionMatrix?.map((row) => (
                      <tr key={row.permissionCode}>
                        <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{row.featureName || row.featureCode}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{row.permissionCode}</div>
                        </td>
                        <td className="p-2.5 text-zinc-500 font-semibold">{row.action}</td>
                        <td className="p-2.5 text-center">
                          {row.templateHas ? (
                            <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                              <Check size={12} />
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        {compareData.companies?.map((cu) => {
                          const has = row.companyHas?.[cu.companyId];
                          return (
                            <td key={cu.companyId} className="p-2.5 text-center">
                              {has ? (
                                <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                                  <Check size={12} />
                                </span>
                              ) : (
                                <span className="text-zinc-300">—</span>
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

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
            <button
              type="button"
              onClick={() => setIsCompareOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Import Company Role ── */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Company Role as Template"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Source Company <span className="text-rose-500">*</span>
            </label>
            <select
              value={importCompanyId}
              onChange={(e) => setImportCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Source Role <span className="text-rose-500">*</span>
            </label>
            {isLoadingCompanyRoles ? (
              <div className="py-2 text-xs text-zinc-400">Loading company roles...</div>
            ) : (
              <select
                value={importRoleId}
                onChange={(e) => {
                  setImportRoleId(e.target.value);
                  const selected = importCompanyRoles.find((r) => r.id === e.target.value);
                  if (selected) {
                    setImportTemplateName(selected.name);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
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
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              New Template Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={importTemplateName}
              onChange={(e) => setImportTemplateName(e.target.value)}
              placeholder="e.g. Finance Controller (Template)"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={importDescription}
              onChange={(e) => setImportDescription(e.target.value)}
              placeholder="Description for this imported template..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !importRoleId}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isImporting ? 'Importing...' : 'Import as Template'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Export ── */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="role-templates-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
