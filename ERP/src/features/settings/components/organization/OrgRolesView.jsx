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
    export default function OrgRolesView({ organization, companies = [] }) {
      const dispatch = useAppDispatch();

      // Data states
      // State
      const [templates, setTemplates] = useState([]);
      const [catalog, setCatalog] = useState(null);
      const [isLoading, setIsLoading] = useState(true);
      // Data states
      const [templates, setTemplates] = useState([]);
      const [catalog, setCatalog] = useState(null);
      const [isLoading, setIsLoading] = useState(true);
      // Data states
      const [templates, setTemplates] = useState([]);
      const [catalog, setCatalog] = useState(null);
      const [isLoading, setIsLoading] = useState(true);

      const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
      const [selectedRows, setSelectedRows] = useState([]);
      const [expandedRowId, setExpandedRowId] = useState(null);
      const [isExportModalOpen, setIsExportModalOpen] = useState(false);
      // Table Configuration & Filter States
      const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
      const [selectedRows, setSelectedRows] = useState([]);
      const [expandedRowId, setExpandedRowId] = useState(null);
      const [isExportModalOpen, setIsExportModalOpen] = useState(false);
      // Table Configuration & Filter States
      const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
      const [selectedRows, setSelectedRows] = useState([]);
      const [expandedRowId, setExpandedRowId] = useState(null);
      const [isExportModalOpen, setIsExportModalOpen] = useState(false);

      // Filters & Pagination
      const [searchTerm, setSearchTerm] = useState('');
      const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, SYSTEM, CUSTOM
      const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
      const [statusFilter, setStatusFilter] = useState('All');
      const [typeFilter, setTypeFilter] = useState('All');
      const [page, setPage] = useState(0);
      const [pageSize, setPageSize] = useState(10);
      const [sortBy, setSortBy] = useState('name');
      const [sortOrder, setSortOrder] = useState('asc');
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('All');
      const [typeFilter, setTypeFilter] = useState('All');
      const [page, setPage] = useState(0);
      const [pageSize, setPageSize] = useState(10);
      const [sortBy, setSortBy] = useState('name');
      const [sortOrder, setSortOrder] = useState('asc');
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
      const [isApplyOpen, setIsApplyOpen] = useState(false);
      const [applyTargetTemplate, setApplyTargetTemplate] = useState(null);
      // Modals
      const [isCreateOpen, setIsCreateOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [selectedTemplate, setSelectedTemplate] = useState(null);
      // Modals
      const [isCreateOpen, setIsCreateOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [selectedTemplate, setSelectedTemplate] = useState(null);

      // Form State for Create/Edit
      // Form State
      const [formName, setFormName] = useState('');
      const [formDescription, setFormDescription] = useState('');
      const [formSelectedPerms, setFormSelectedPerms] = useState(new Set());
      const [formSearchPerm, setFormSearchPerm] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);
      // Form State for Create/Edit
      const [formName, setFormName] = useState('');
      const [formDescription, setFormDescription] = useState('');
      const [formSelectedPerms, setFormSelectedPerms] = useState(new Set());
      const [formSearchPerm, setFormSearchPerm] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);
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
      const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
      const [preserveCustomizations, setPreserveCustomizations] = useState(true);
      const [previewDiff, setPreviewDiff] = useState(null);
      const [isPreviewLoading, setIsPreviewLoading] = useState(false);
      const [isApplying, setIsApplying] = useState(false);
      // Apply to Companies Modal State
      const [isApplyOpen, setIsApplyOpen] = useState(false);
      const [applyTargetTemplate, setApplyTargetTemplate] = useState(null);
      const [applySelectedCompanies, setApplySelectedCompanies] = useState([]);
      const [applyOverwrite, setApplyOverwrite] = useState(false);
      const [applyPreview, setApplyPreview] = useState(null);
      const [isPreviewing, setIsPreviewing] = useState(false);
      const [isApplying, setIsApplying] = useState(false);
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
      // Compare Across Companies Modal State
      const [isCompareOpen, setIsCompareOpen] = useState(false);
      const [compareRoleName, setCompareRoleName] = useState('');
      const [compareData, setCompareData] = useState(null);
      const [isComparing, setIsComparing] = useState(false);
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
      // Import Company Role Modal State
      const [isImportOpen, setIsImportOpen] = useState(false);
      const [importCompanyId, setImportCompanyId] = useState('');
      const [importCompanyRoles, setImportCompanyRoles] = useState([]);
      const [importRoleId, setImportRoleId] = useState('');
      const [importTemplateName, setImportTemplateName] = useState('');
      const [importDescription, setImportDescription] = useState('');
      const [isLoadingCompanyRoles, setIsLoadingCompanyRoles] = useState(false);
      const [isImporting, setIsImporting] = useState(false);
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
      // Load Data
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
              message: err?.response?.data?.message || 'Failed to load role templates',
            })
          );
        } finally {
          setIsLoading(false);
        }
      }, [dispatch]);
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
      useEffect(() => {
        loadData();
      }, [loadData]);
      useEffect(() => {
        loadData();
      }, [loadData]);

      // Flattened permissions from catalog
      const catalogPermissions = useMemo(() => {
        if (!catalog?.modules) return [];
        const list = [];
        catalog.modules.forEach((mod) => {
          mod.features?.forEach((feat) => {
            feat.permissions?.forEach((perm) => {
              list.push({
                code: perm.permissionCode.toUpperCase(),
                action: perm.action,
                module: mod.displayName || mod.moduleName,
                feature: feat.featureName || feat.featureCode,
                description: perm.description,
              });
            });
          });
        });
        return list;
      }, [catalog]);
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

                  // Filtered Templates
                  const filteredTemplates = useMemo(() => {
                    return templates.filter((t) => {
                      const matchesSearch =
                        !searchTerm.trim() ||
                        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                          if (typeFilter === 'System' && !t.isSystem) return false;
                          if (typeFilter === 'Custom' && t.isSystem) return false;

                          const matchesType =
                            typeFilter === 'ALL' ||
                            (typeFilter === 'SYSTEM' && t.isSystem) ||
                            (typeFilter === 'CUSTOM' && !t.isSystem);
                          if (statusFilter === 'Active' && !t.status) return false;
                          if (statusFilter === 'Inactive' && t.status) return false;
                          if (statusFilter === 'Active' && !t.status) return false;
                          if (statusFilter === 'Inactive' && t.status) return false;
                          if (statusFilter === 'Active' && !t.status) return false;
                          if (statusFilter === 'Inactive' && t.status) return false;

                          const matchesStatus =
                            statusFilter === 'ALL' ||
                            (statusFilter === 'ACTIVE' && t.status) ||
                            (statusFilter === 'INACTIVE' && !t.status);
                          if (typeFilter === 'System' && !t.isSystem) return false;
                          if (typeFilter === 'Custom' && t.isSystem) return false;

                          return matchesSearch && matchesType && matchesStatus;
                        });
                    }, [templates, searchTerm, typeFilter, statusFilter]);
                    return true;
                  })
                  return true;
                })
                .map((t) => ({
                  ...t,
                  roleName: t.name,
                  roleCode: t.code || t.name.toUpperCase().replace(/\s+/g, '_'),
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
            }, [templates, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);
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

      // Open Create Modal
      const totalElements = filteredTemplates.length;
      const totalPages = Math.ceil(totalElements / pageSize) || 1;
      const paginatedTemplates = useMemo(() => {
        const start = page * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
      }, [filteredTemplates, page, pageSize]);

      // Modal Handlers
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
          dispatch(addAlert({ type: 'warning', message: 'Role template name is required' }));
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
              message: err?.response?.data?.message || 'Failed to create role template',
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
          dispatch(addAlert({ type: 'warning', message: 'Role template name is required' }));
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
              message: err?.response?.data?.message || 'Failed to update role template',
            })
          );
        } finally {
          setIsSubmitting(false);
        }
      };

      // Duplicate Template
      const handleDuplicate = async (template) => {
        const newName = window.prompt(`Enter a name for the duplicated template:`, `${template.name} (Copy)`);
        const newName = window.prompt('Enter a name for the duplicated template:', `${template.name} (Copy)`);
        if (!newName || !newName.trim()) return;

        try {
          await duplicateOrgRoleTemplate(template.id, newName.trim());
          dispatch(addAlert({ type: 'success', message: `Template duplicated as "${newName.trim()}"` }));
          await duplicateOrgRoleTemplate(template.id);
          dispatch(addAlert({ type: 'success', message: `Duplicated "${template.name}" successfully` }));
          loadData();
        } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: err?.response?.data?.message || err?.message || 'Failed to duplicate template',
              message: err?.response?.data?.message || 'Failed to duplicate template',
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
        const handleToggleStatus = (template) => {
          const newStatus = !template.status;
          confirmDialog(
            `${newStatus ? 'Activate' : 'Deactivate'} Role Template`,
            `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} "${template.name}"?`,
            async () => {
              try {
                await updateOrgRoleTemplateStatus(template.id, newStatus);
                dispatch(
                  addAlert({
                    type: 'success',
                    message: `Template ${newStatus ? 'activated' : 'deactivated'} successfully`,
                  })
                );
                loadData();
              } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || 'Failed to update template status',
                  })
                );
              }
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
              const confirmed = await confirmDialog({
                title: 'Delete Role Template',
                message: `Are you sure you want to delete custom template "${template.name}"? This action cannot be undone.`,
                confirmText: 'Delete Template',
                isDestructive: true,
              });
              if (!confirmed) return;

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
            const handleDelete = (template) => {
              confirmDialog(
                'Delete Role Template',
                `Are you sure you want to delete template "${template.name}"? This cannot be undone.`,
                async () => {
                  try {
                    await deleteOrgRoleTemplate(template.id);
                    dispatch(addAlert({ type: 'success', message: 'Template deleted successfully' }));
                    loadData();
                  } catch (err) {
                    dispatch(
                      addAlert({
                        type: 'error',
                        message: err?.response?.data?.message || 'Failed to delete template',
                      })
                    );
                  }
                }
              );
            };
            // Open Apply to Companies Modal
            const handleOpenApply = (template) => {
              setApplyTargetTemplate(template);
              setApplySelectedCompanies(companies.map((c) => c.id));
              setApplyOverwrite(false);
              setApplyPreview(null);
              setIsApplyOpen(true);
            };
          };

          // Open Apply to Companies Modal
          const handleOpenApply = (template) => {
            setApplyTargetTemplate(template);
            // Pre-select companies that don't have this role or all companies
            setApplySelectedCompanies(companies.map((c) => c.id));
            setApplyOverwrite(false);
            setApplyPreview(null);
            setSelectedCompanyIds(companies.map((c) => c.id));
            setPreserveCustomizations(true);
            setPreviewDiff(null);
            setIsApplyOpen(true);
          };
          // Generate Apply Preview
          const handleRunPreview = async () => {
            if (!applySelectedCompanies.length) {
              dispatch(addAlert({ type: 'warning', message: 'Select at least one company' }));
              return;
            }
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
                // Preview Diff
                const handleFetchPreview = async () => {
                  if (selectedCompanyIds.length === 0) {
                    dispatch(addAlert({ type: 'warning', message: 'Please select at least one company' }));
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
                // Generate Apply Preview
                const handleRunPreview = async () => {
                  if (!applySelectedCompanies.length) {
                    dispatch(addAlert({ type: 'warning', message: 'Select at least one company' }));
                    return;
                  }

                  setIsPreviewing(true);
                  setIsPreviewLoading(true);
                  try {
                    const res = await previewApplyOrgRoleTemplate(applyTargetTemplate.id, {
                      companyIds: applySelectedCompanies,
                      overwriteExisting: applyOverwrite,
                      companyIds: selectedCompanyIds,
                      preserveCustomizations,
                    });
                    setApplyPreview(res);
                    setPreviewDiff(res);
                  } catch (err) {
                    dispatch(
                      addAlert({
                        type: 'error',
                        message: err?.response?.data?.message || err?.message || 'Failed to generate preview',
                        message: err?.response?.data?.message || 'Failed to calculate diff preview',
                      })
                    );
                  } finally {
                    setIsPreviewing(false);
                    setIsPreviewLoading(false);
                  }
                };
                // Confirm and Deploy Template
                const handleConfirmApply = async () => {
                  if (!applySelectedCompanies.length) return;
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
                    // Confirm and Deploy Template
                    const handleConfirmApply = async () => {
                      if (!applySelectedCompanies.length) return;

                      // Submit Apply
                      const handleApplySubmit = async () => {
                        if (selectedCompanyIds.length === 0) {
                          dispatch(addAlert({ type: 'warning', message: 'Select at least one company' }));
                          return;
                        }
                        setIsApplying(true);
                        try {
                          const res = await applyOrgRoleTemplate(applyTargetTemplate.id, {
                            companyIds: applySelectedCompanies,
                            overwriteExisting: applyOverwrite,
                            companyIds: selectedCompanyIds,
                            preserveCustomizations,
                          });
                          const parts = [];
                          if (res.createdCount > 0) parts.push(`${res.createdCount} created`);
                          if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
                          if (res.skippedCount > 0) parts.push(`${res.skippedCount} skipped`);
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
                        const parts = [];
                        if (res.createdCount > 0) parts.push(`${res.createdCount} created`);
                        if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
                        if (res.skippedCount > 0) parts.push(`${res.skippedCount} skipped`);

                        dispatch(
                          addAlert({
                            type: 'success',
                            message: `Template applied: ${parts.join(', ')}`,
                            message: `Role deployed to ${res.companiesUpdated || selectedCompanyIds.length} companies successfully`,
                          })
                        );
                        setIsApplyOpen(false);
                        loadData();
                      } catch (err) {
                        dispatch(
                          addAlert({
                            type: 'error',
                            message: err?.response?.data?.message || err?.message || 'Failed to apply template',
                            message: err?.response?.data?.message || 'Failed to apply role template',
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
                    // Column definitions matching Customer Management
                    const columns = useMemo(() => [
                      {
                        id: 'roleName',
                        label: 'Role Name',
                        sortable: true,
                        render: (val, row) => (
                          <div className="flex items-center gap-2">
                            <Shield size={16} className={row.isSystem ? 'text-amber-500' : 'text-blue-500'} />
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name || '-'}</span>
                            {row.isSystem && (
                              <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                                System
                              </span>
                            )}
                          </div>
                        ),
                      },
                      {
                        id: 'roleCode',
                        label: 'Role Code',
                        sortable: true,
                        render: (val, row) => (
                          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded font-medium">
                            {row.roleCode || '-'}
                          </span>
                        ),
                      },
                      {
                        id: 'description',
                        label: 'Description',
                        sortable: false,
                        render: (val, row) => (
                          <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-xs block">
                            {row.description || '—'}
                          </span>
                        ),
                      },
                      {
                        id: 'usersCount',
                        label: 'Users Count',
                        sortable: true,
                        align: 'center',
                        render: (val, row) => (
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                            {row.usersCount}
                          </span>
                        ),
                      },
                      {
                        id: 'permissionsCount',
                        label: 'Permissions Count',
                        sortable: true,
                        align: 'center',
                        render: (val, row) => (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                            <Key size={11} />
                            <span>{row.permissionsCount} perms</span>
                          </span>
                        ),
                      },
                      {
                        id: 'status',
                        label: 'Status',
                        sortable: true,
                        align: 'center',
                        render: (val, row) => <DataTableStatusBadge status={row.status} />,
                      },
                    ], []);
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
                  // Open Compare Modal
                  const handleOpenCompare = async (roleName) => {
                    const targetName = roleName || (templates[0]?.name ?? 'Admin');
                    setCompareRoleName(targetName);
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
                  // Basic Filters
                  const basicFilters = useMemo(() => [
                    {
                      id: 'status',
                      label: 'Status',
                      type: 'select',
                      value: statusFilter,
                      options: [
                        { label: 'All Statuses', value: 'All' },
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' },
                      ],
                    },
                    {
                      id: 'type',
                      label: 'Role Type',
                      type: 'select',
                      value: typeFilter,
                      options: [
                        { label: 'All Types', value: 'All' },
                        { label: 'Custom Templates', value: 'Custom' },
                        { label: 'System Defaults', value: 'System' },
                      ],
                    },
                  ], [statusFilter, typeFilter]);
                  // Open Import Modal
                  const handleOpenImport = () => {
                    setImportCompanyId(companies[0]?.id || '');
                    setImportCompanyRoles([]);
                    setImportRoleId('');
                    setImportTemplateName('');
                    setImportDescription('');
                    setIsImportOpen(true);
                  };
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
                // Row Actions
                const rowActions = useMemo(() => [
                  {
                    key: 'view',
                    label: 'View Details',
                    icon: Eye,
                    onClick: (row) => setExpandedRowId((prev) => (prev === row.id ? null : row.id)),
                    tooltip: 'View Template Details',
                    className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
                  },
                  {
                    key: 'apply',
                    label: 'Apply to Companies',
                    icon: Send,
                    onClick: (row) => handleOpenApply(row),
                    tooltip: 'Deploy Template to Companies',
                    className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
                  },
                  {
                    key: 'duplicate',
                    label: 'Duplicate',
                    icon: Copy,
                    onClick: (row) => handleDuplicate(row),
                    tooltip: 'Duplicate Template',
                    className: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40',
                  },
                  {
                    key: 'edit',
                    label: 'Edit',
                    icon: Edit2,
                    onClick: (row) => handleOpenEdit(row),
                    tooltip: 'Edit Permissions',
                    className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
                  },
                  {
                    key: 'toggle-status',
                    label: (row) => (row.status ? 'Deactivate' : 'Activate'),
                    icon: (row) => (row.status ? AlertCircle : CheckCircle),
                    onClick: (row) => handleToggleStatus(row),
                    tooltip: (row) => (row.status ? 'Deactivate' : 'Activate'),
                    className: (row) =>
                      row.status
                        ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    danger: true,
                    disabled: (row) => row.isSystem,
                    onClick: (row) => handleDelete(row),
                    tooltip: 'Delete Role',
                  },
                ], [companies]);
                // Load roles when import company changes
                useEffect(() => {
                  if (!importCompanyId || !isImportOpen) return;
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
                    // Sub-row expanded drawer
                    const renderExpandedRow = (template) => (
                      <div className="space-y-3 p-3 text-xs bg-zinc-50 dark:bg-zinc-900/60 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">
                            Configured Permissions Matrix ({template.permissions?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenApply(template)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <Send size={12} />
                            <span>Deploy to Companies</span>
                          </button>
                        </div>
  // Load roles when import company changes
  useEffect(() => {
    if (!importCompanyId || !isImportOpen) return;

                        let isMounted = true;
                        setIsLoadingCompanyRoles(true);
                        getRoles({companyId: importCompanyId })
                        let isMounted = true;
                        setIsLoadingCompanyRoles(true);
                        getRoles({companyId: importCompanyId })
                        let isMounted = true;
                        setIsLoadingCompanyRoles(true);
                        getRoles({companyId: importCompanyId })
      .then((res) => {
        if (!isMounted) return;
                        const list = res?.content || res?.roles || (Array.isArray(res) ? res : []);
                        setImportCompanyRoles(list);
                        const list = res?.content || res?.roles || (Array.isArray(res) ? res : []);
                        setImportCompanyRoles(list);
                        const list = res?.content || res?.roles || (Array.isArray(res) ? res : []);
                        setImportCompanyRoles(list);
        if (list.length > 0) {
                          setImportRoleId(list[0].id);
                        setImportTemplateName(list[0].name);
                        setImportRoleId(list[0].id);
                        setImportTemplateName(list[0].name);
                        setImportRoleId(list[0].id);
                        setImportTemplateName(list[0].name);
        } else {
                          setImportRoleId('');
                        setImportTemplateName('');
                        setImportRoleId('');
                        setImportTemplateName('');
                        setImportRoleId('');
                        setImportTemplateName('');
        }
      })
      .catch((err) => {
      .catch(() => {
                          if (!isMounted) return;
                          dispatch(addAlert({ type: 'error', message: 'Failed to load company roles' }));
                          dispatch(addAlert({ type: 'error', message: 'Failed to load company roles' }));
                        })
                            .finally(() => {
                              if (isMounted) setIsLoadingCompanyRoles(false);
                            });
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                          {template.permissions?.length === 0 ? (
                            <p className="text-zinc-400 italic">No permissions assigned to this template.</p>
                          ) : (
                            template.permissions.map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px]"
                              >
                                {p}
                              </span>
                            ))
                          )}
                        </div>
                        if (!isMounted) return;
                        dispatch(addAlert({type: 'error', message: 'Failed to load company roles' }));
      })
      .finally(() => {
        if (isMounted) setIsLoadingCompanyRoles(false);
      });

    return () => {
                          isMounted = false;
                        isMounted = false;
    };
  }, [importCompanyId, isImportOpen, dispatch]);

  // Handle Import Submit
  const handleImportSubmit = async (e) => {
                          e.preventDefault();
                        if (!importCompanyId || !importRoleId) {
                          dispatch(addAlert({ type: 'warning', message: 'Select a company and a role' }));
                        return;
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
                        dispatch(addAlert({type: 'success', message: 'Company role successfully imported as template' }));
                        setIsImportOpen(false);
                        loadData();
                        setIsImporting(true);
                        try {
                          await importCompanyRoleAsTemplate({
                            companyId: importCompanyId,
                            roleId: importRoleId,
                            templateName: importTemplateName.trim(),
                            description: importDescription.trim(),
                          });
                        dispatch(addAlert({type: 'success', message: 'Company role successfully imported as template' }));
                        setIsImportOpen(false);
                        loadData();
    } catch (err) {
                          dispatch(
                            addAlert({
                              type: 'error',
                              message: err?.response?.data?.message || err?.message || 'Failed to import role as template',
                            })
                          );
                        dispatch(
                        addAlert({
                          type: 'error',
                        message: err?.response?.data?.message || err?.message || 'Failed to import role as template',
        })
                        );
    } finally {
                          setIsImporting(false);
                        setIsImporting(false);
    }
  };

  // Toggle permission in form
  const togglePermission = (code) => {
    const next = new Set(formSelectedPerms);
                        if (next.has(code.toUpperCase())) {
                          next.delete(code.toUpperCase());
                        if (next.has(code.toUpperCase())) {
                          next.delete(code.toUpperCase());
    } else {
                          next.add(code.toUpperCase());
                        next.add(code.toUpperCase());
    }
                        setFormSelectedPerms(next);
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
      feat.permissions?.forEach((perm) => {
        if (selectAll) {
                          next.add(perm.permissionCode.toUpperCase());
        } else {
                          next.delete(perm.permissionCode.toUpperCase());
        }
      });
    });
                        setFormSelectedPerms(next);
                        setFormSelectedPerms(next);
  };

  // Reset Filters
  const handleResetFilters = () => {
                          setSearchTerm('');
                        setStatusFilter('All');
                        setTypeFilter('All');
                        setPage(0);
                        setSearchTerm('');
                        setStatusFilter('All');
                        setTypeFilter('All');
                        setPage(0);
  };

                        // Table Columns Definition
                        const columns = useMemo(
                        // Table Columns Definition
                        const columns = useMemo(
    () => [
                        {
                          header: 'ROLE NAME',
                        accessorKey: 'roleName',
                        sortable: true,
                        cell: ({row}) => (
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
                        cell: ({row}) => (
                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                          {row.roleCode}
                          {
                            header: 'ROLE NAME',
                          accessorKey: 'roleName',
                          sortable: true,
                          cell: ({row}) => (
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
                                ),
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
                            header: 'DESCRIPTION',
                          accessorKey: 'description',
                          cell: ({row}) => (
                          <span className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-1 max-w-xs">
                            {row.description || 'No description provided'}
                          </span>
                          ),
                          {
                            header: 'ROLE CODE',
                          accessorKey: 'roleCode',
                          sortable: true,
                          cell: ({row}) => (
                          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                            {row.roleCode}
                          </span>
                          ),
      },
                          {
                            header: 'USERS',
                          accessorKey: 'usersCount',
                          sortable: true,
                          cell: ({row}) => (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {row.usersCount} users
                          </span>
                          ),
                          {
                            header: 'DESCRIPTION',
                          accessorKey: 'description',
                          cell: ({row}) => (
                          <span className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-1 max-w-xs">
                            {row.description || 'No description provided'}
                          </span>
                          ),
      },
                          {
                            header: 'PERMISSIONS',
                          accessorKey: 'permissionsCount',
                          sortable: true,
                          cell: ({row}) => (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            {row.permissionsCount} perms
                          </span>
                          ),
                          {
                            header: 'USERS',
                          accessorKey: 'usersCount',
                          sortable: true,
                          cell: ({row}) => (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {row.usersCount} users
                          </span>
                          ),
      },
                          {
                            header: 'STATUS',
                          accessorKey: 'status',
                          sortable: true,
                          cell: ({row}) => (
                          <DataTableStatusBadge status={row.status ? 'ACTIVE' : 'INACTIVE'} />
                          ),
                          {
                            header: 'PERMISSIONS',
                          accessorKey: 'permissionsCount',
                          sortable: true,
                          cell: ({row}) => (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            {row.permissionsCount} perms
                          </span>
                          ),
      },
                          {
                            header: 'ACTIONS',
                          accessorKey: 'actions',
                          cell: ({row}) => (
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
                          {
                            header: 'STATUS',
                          accessorKey: 'status',
                          sortable: true,
                          cell: ({row}) => (
                          <DataTableStatusBadge status={row.status ? 'ACTIVE' : 'INACTIVE'} />
                          ),
      },
                          ],
                          // eslint-disable-next-line react-hooks/exhaustive-deps
                          [companies]
                          );
                          {
                            header: 'ACTIONS',
                          accessorKey: 'actions',
                          cell: ({row}) => (
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
                                        );
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

              return () => {
                                                isMounted = false;
              };
            }, [importCompanyId, isImportOpen, dispatch]);
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

            // Handle Import Submit
            const handleImportSubmit = async (e) => {
                                              e.preventDefault();
                                            if (!importCompanyId || !importRoleId) {
                                              dispatch(addAlert({ type: 'warning', message: 'Select a company and a role' }));
                                            return;
              }
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

                                            setIsImporting(true);
                                            try {
                                              await importCompanyRoleAsTemplate({
                                                companyId: importCompanyId,
                                                roleId: importRoleId,
                                                templateName: importTemplateName.trim(),
                                                description: importDescription.trim(),
                                              });
                                            dispatch(addAlert({type: 'success', message: 'Company role successfully imported as template' }));
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
              const handleResetFilters = () => {
                                              setSearchTerm('');
                                            setStatusFilter('All');
                                            setTypeFilter('All');
                                            setPage(0);
                                            setSelectedRows([]);
              };
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
                                          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
                                            <PageHeader
                                              title="Role Management"
                                              description="Manage organization role templates, permissions, and company deployment"
                                            >
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
                                                        {/* Permission Catalog Tree */ }
                                                        < div className = "max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50" >
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
                          onClick={handleOpenCreate}
                          className="btn-primary flex items-center gap-2"
                          onClick={() => toggleModulePermissions(mod, true)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Plus size={16} />
                          <span>New Role</span>
                          Select All
                        </button>
                      </PageHeader>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <button
                          type="button"
                          onClick={handleOpenImport}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
                          title="Convert an existing company role into an organization role template"
                          onClick={() => toggleModulePermissions(mod, false)}
                          className="text-[11px] text-zinc-500 hover:underline"
                        >
                          <Upload size={14} />
                          <span>Import Role</span>
                          Clear
                        </button>
                        {/* Main Content Area */}
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                          <DataTable
                            permissionFeature="ROLE"
                            selectable
                            selectedRows={selectedRows}
                            onSelectionChange={setSelectedRows}
                            columns={columns}
                            data={paginatedTemplates}
                            rowKey="id"
                            loading={isLoading}

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
          // Search
                      searchable
                      searchValue={searchTerm}
                      searchPlaceholder="Role Name, Code..."
                      onSearchChange={(val) => {
                        setSearchTerm(val);
                        setPage(0);
                      }}
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
          // Filters
                        filters={basicFilters}
                        filterValues={{ status: statusFilter, type: typeFilter }}
                        onFilterChange={(key, val) => {
                          if (key === 'status') setStatusFilter(val);
                          if (key === 'type') setTypeFilter(val);
                          setPage(0);
                        }}
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-[#F7F7F0] dark:bg-[#1D212C] p-1 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] text-xs">
                            <span className="text-[11px] font-semibold text-[#8B9382] dark:text-[#6B7184] px-1.5">Type:</span>
                            {['ALL', 'SYSTEM', 'CUSTOM'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTypeFilter(t)}
                                className={`px-2 py-1 rounded-lg font-medium transition-colors ${typeFilter === t
                                    ? 'bg-white dark:bg-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] shadow-2xs'
                                    : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28]'
                                  }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
          // Reset & Refresh & Export
                          onReset={handleResetFilters}
                          onRefresh={loadData}
                          onExport={() => setIsExportModalOpen(true)}
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

                                                  <div className="flex items-center gap-1.5 bg-[#F7F7F0] dark:bg-[#1D212C] p-1 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] text-xs">
                                                    <span className="text-[11px] font-semibold text-[#8B9382] dark:text-[#6B7184] px-1.5">Status:</span>
                                                    {['ALL', 'ACTIVE', 'INACTIVE'].map((s) => (
                                                      <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setStatusFilter(s)}
                                                        className={`px-2 py-1 rounded-lg font-medium transition-colors ${statusFilter === s
                                                          ? 'bg-white dark:bg-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] shadow-2xs'
                                                          : 'text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28]'
                                                          }`}
                                                      >
                                                        {s}
                                                      </button>
                                                    ))}
                                                  </div>
          // Columns
                                                  visibleColumns={visibleColumns}
                                                  onVisibleColumnsChange={setVisibleColumns}
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
          // Sorting
                                                      sort={{ key: sortBy, direction: sortOrder }}
                                                      onSortChange={({ key }) => {
                                                        if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                        else { setSortBy(key); setSortOrder('asc'); }
                                                        setPage(0);
                                                      }}
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
                                                            // Row Actions & Expansion
                                                            rowActions = { rowActions }
                                                            expandedRowId = { expandedRowId }
                                                            onToggleExpand = {(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
                                                          renderExpandedRow={renderExpandedRow}
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
          // Pagination
                                                                      pagination={{
                                                                        page,
                                                                        pageSize,
                                                                        totalPages,
                                                                        totalElements,
                                                                      }}
                                                                      pageIndexBase={0}
                                                                      onPageChange={setPage}
                                                                      onPageSizeChange={(newSize) => {
                                                                        setPageSize(newSize);
                                                                        setPage(0);
                                                                      }}
                                                                      itemName="roles"
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

                                                                                  <span
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${template.status
                                                                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                                                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                                                                      }`}
                                                                                  >
                                                                                    {template.status ? 'Active' : 'Inactive'}
                                                                                  </span>
                                                                                </div>
          // Empty State matching Customer Management
                                emptyMessage = "No roles found"
                                emptyDescription = "Try adjusting your search keywords or filter criteria to find role templates."
                                                                                />
                              </div>

                                                                            <div className="flex items-center gap-1">
                                                                              <button
                                                                                type="button"
                                                                                onClick={() => handleDuplicate(template)}
                                                                                className="p-1 text-[#8B9382] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
                                                                                title="Duplicate template"
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
                                                                                            {
                                                                                              mod.features?.map((feat) => (
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
                                {
                                                                                                          !template.isSystem && (
                                                                                                            <button
                                                                                                              type="button"
                                                                                                              onClick={() => handleDelete(template)}
                                                                                                              className="p-1 text-[#8B9382] hover:text-rose-600 rounded-lg transition-colors"
                                                                                                              title="Delete template"
                                                                                                            >
                                                                                                              <Trash2 size={13} />
                                                                                                            </button>
                                                                                                          )
                                                                                                        }
                              </div>
                                                                                                </div>
                            {/* Create / Edit Role Template Modal */ }
                                                                                                < Modal
                              isOpen = { isCreateOpen || isEditOpen}
                                                  onClose = {() => {
                                                                                        setIsCreateOpen(false);
                                                                                      setIsEditOpen(false);
                                                  }}
                                                                                      title={isEditOpen ? `Edit Role Template: ${selectedTemplate?.name}` : 'New Role Template'}
                                                                                      size="lg"
                            >
                                                                                      <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
                                                                                        <div>
                                                                                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                                                                            Role Template Name <span className="text-red-500">*</span>
                                                                                          </label>
                                                                                          <input
                                                                                            type="text"
                                                                                            required
                                                                                            value={formName}
                                                                                            onChange={(e) => setFormName(e.target.value)}
                                                                                            placeholder="e.g. Finance Manager"
                                                                                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                                                                            type="checkbox"
                                                                                            className="sr-only"
                                                                                            checked={isChecked}
                                                                                            onChange={() => togglePermission(perm.permissionCode)}
                                                                                          />
                                                                                        </div>

                                                                                        {/* Title & Description */}
                                                                                        <h3 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-1.5">
                                                                                          {template.name}
                                                                                        </h3>
                                                                                        <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1 line-clamp-2 min-h-[2rem]">
                                                                                          {template.description || 'No description provided.'}
                                                                                        </p>
                                                                                        <div>
                                                                                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                                                                            Description
                                                                                          </label>
                                                                                          <textarea
                                                                                            rows={2}
                                                                                            value={formDescription}
                                                                                            onChange={(e) => setFormDescription(e.target.value)}
                                                                                            placeholder="Template scope and responsibilities..."
                                                                                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                                                                          />
                                                                                        </div>

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
                                                                                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${c.isCustomized
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
                                                                                <span>{perm.action}</span>
                                                                              </label>
                                                                              );
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
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  </div>
                    ))}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
              ))}
                                                        </div>
            </div>
                                                </div>

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
                                                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${isSelected
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
                                                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${isSelected
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
                                                                {
                                                                  applyPreview && (
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
                                                                  )
                                                                }
                                                                {
                                                                  applyPreview && (
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
                                                                  )
                                                                }
          </div>

                                                            if (!filteredFeatures || filteredFeatures.length === 0) return null;
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

                                                    const allModuleCodes = [];
                                    mod.features?.forEach((f) => f.permissions?.forEach((p) => allModuleCodes.push(p.permissionCode.toUpperCase())));
                                    const allSelectedInMod = allModuleCodes.length > 0 && allModuleCodes.every((c) => formSelectedPerms.has(c));
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
                                                                            className={`font-semibold ${cu.isCustomized ? 'text-amber-600' : 'text-emerald-600'
                                                                              }`}
                                                                          >
                                                                            {cu.isCustomized ? 'Customized' : 'Standard'}
                                                                          </span>
                                                                        </div>
                                                                      </div>
                                                                    ))}
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
                                                                                className={`font-semibold ${cu.isCustomized ? 'text-amber-600' : 'text-emerald-600'
                                                                                  }`}
                                                                              >
                                                                                {cu.isCustomized ? 'Customized' : 'Standard'}
                                                                              </span>
                                                                            </div>
                                                                          </div>
                                                                        ))}
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

                                                                      <div className="flex flex-wrap gap-1.5">
                                                                        {feat.permissions?.map((perm) => {
                                                                          const code = perm.permissionCode.toUpperCase();
                                                                          const isSelected = formSelectedPerms.has(code);
                                                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
                                                  <button
                                                    type="button"
                                                    onClick={() => setIsCompareOpen(false)}
                                                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                                                  >
                                                    Close
                                                  </button>
                                                </div>
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
      </Modal>

                                          return (
                                                              <button
                                                                key={perm.id || perm.permissionCode}
                                                                type="button"
                                                                onClick={() => togglePermission(code)}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${isSelected
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

                                                  {/* Modal Footer */}
                                                  <div className="pt-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex items-center justify-end gap-2.5">
                                                    <div>
                                                      <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                                          Assign Permissions ({formSelectedPerms.size} selected)
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setIsCreateOpen(false);
                                                              setIsEditOpen(false);
                                                            }}
                                                            className="px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
                                                            onClick={() => setFormSelectedPerms(new Set(catalogPermissions.map((p) => p.code)))}
                                                            className="text-xs font-semibold text-primary hover:underline"
                                                          >
                                                            Cancel
                                                            Select All
                                                          </button>
                                                          <span className="text-zinc-300">|</span>
                                                          <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] rounded-xl shadow-xs"
                                                            type="button"
                                                            onClick={() => setFormSelectedPerms(new Set())}
                                                            className="text-xs font-semibold text-zinc-500 hover:underline"
                                                          >
                                                            {isSubmitting && <RefreshCw size={12} className="animate-spin" />}
                                                            <span>{isEditOpen ? 'Save Changes' : 'Create Template'}</span>
                                                            Clear All
                                                          </button>
                                                        </div>
                                                      </form>
                                                    </div>
                                                  </div>
      )}
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
                                                            <input
                                                              type="text"
                                                              value={formSearchPerm}
                                                              onChange={(e) => setFormSearchPerm(e.target.value)}
                                                              placeholder="Filter permissions..."
                                                              className="w-full px-3 py-1.5 text-xs mb-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                                            />
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

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                              {companies.map((comp) => {
                                                                const isChecked = applySelectedCompanies.includes(comp.id);
                                                                const alreadyHas = (applyTargetTemplate.appliedCompanies || []).some(
                                                                  (ac) => ac.companyId === comp.id
                                                                );
                                            <div className="max-h-56 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 space-y-1 custom-scrollbar">
                                              {catalogPermissions
                                                .filter(
                                                  (p) =>
                                                    !formSearchPerm.trim() ||
                                                    p.code.toLowerCase().includes(formSearchPerm.toLowerCase()) ||
                                                    p.module.toLowerCase().includes(formSearchPerm.toLowerCase())
                                                )
                                                .map((perm) => {
                                                  const isChecked = formSelectedPerms.has(perm.code);
                                                  return (
                                                    <label
                                                      key={perm.code}
                                                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-xs"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                          const next = new Set(formSelectedPerms);
                                                          if (e.target.checked) next.add(perm.code);
                                                          else next.delete(perm.code);
                                                          setFormSelectedPerms(next);
                                                        }}
                                                        className="rounded border-zinc-300 text-primary focus:ring-primary/20"
                                                      />
                                                      <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {perm.code}
                                                      </span>
                                                      <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                                                        ({perm.module} &bull; {perm.action})
                                                      </span>
                                                    </label>
                                                  );
                                                })}
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
                                                        </Modal>

                                                        return (
                                                        <label
                                                          key={comp.id}
                                                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isChecked
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
                                                          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                setIsCreateOpen(false);
                                                                setIsEditOpen(false);
                                                              }}
                                                              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                            >
                                                              Cancel
                                                            </button>
                                                            <button
                                                              type="submit"
                                                              disabled={isSubmitting}
                                                              className="btn-primary"
                                                            >
                                                              {isSubmitting ? 'Saving...' : 'Save Template'}
                                                            </button>
                                                          </div>
                                                        </form>
                                                      </Modal>

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
                                              {/* Apply to Companies Modal */}
                                              <Modal
                                                isOpen={isApplyOpen}
                                                onClose={() => setIsApplyOpen(false)}
                                                title={`Deploy "${applyTargetTemplate?.name}" to Companies`}
                                                size="lg"
                                              >
                                                <div className="space-y-4">
                                                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                                    Select operating companies to apply this organization role template to. Existing user role assignments will be strictly preserved.
                                                  </p>

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
                                                  <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                                                      Target Operating Companies
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                      {companies.map((comp) => {
                                                        const isSelected = selectedCompanyIds.includes(comp.id);
                                                        return (
                                                          <label
                                                            key={comp.id}
                                                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${isSelected
                                                              ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                              : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                                              }`}
                                                          >
                                                            <input
                                                              type="checkbox"
                                                              checked={isSelected}
                                                              onChange={(e) => {
                                                                if (e.target.checked) setSelectedCompanyIds([...selectedCompanyIds, comp.id]);
                                                                else setSelectedCompanyIds(selectedCompanyIds.filter((id) => id !== comp.id));
                                                              }}
                                                              className="rounded border-zinc-300 text-primary"
                                                            />
                                                            <Building2 size={14} />
                                                            <span className="truncate">{comp.name || comp.legalName}</span>
                                                          </label>
                                                        );
                                                      })}
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
                                                      <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                                        <input
                                                          type="checkbox"
                                                          checked={preserveCustomizations}
                                                          onChange={(e) => setPreserveCustomizations(e.target.checked)}
                                                          className="rounded border-zinc-300 text-primary"
                                                        />
                                                        <span>Preserve customized company permissions (do not overwrite drifted roles)</span>
                                                      </label>

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
                                                                  className={`p-3 rounded-xl border text-xs ${cu.isCustomized
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
                                                                      className={`font-semibold ${cu.isCustomized ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                                                                        }`}
                                                                    >
                                                                      {cu.isCustomized ? 'Customized' : 'Standard'}
                                                                    </span>
                                                                  </div>
                                                                </div>
                                                              ))}
                                                            </div>
                                                            <div className="flex items-center justify-between pt-2">
                                                              <button
                                                                type="button"
                                                                onClick={handleFetchPreview}
                                                                disabled={isPreviewLoading}
                                                                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors"
                                                              >
                                                                {isPreviewLoading ? 'Calculating Diff...' : 'Preview Differences'}
                                                              </button>
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
                                                                                className={`inline-flex p-1 rounded-full ${isDiverged
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
                                                            {previewDiff && (
                                                              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 text-xs">
                                                                <span className="font-bold text-zinc-800 dark:text-zinc-200">Deployment Diff Preview:</span>
                                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                                                                    <div className="text-lg font-bold">{previewDiff.companiesToCreate?.length || 0}</div>
                                                                    <div className="text-[10px] uppercase">Roles Created</div>
                                                                  </div>
              )}
                                                                  <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                                                                    <div className="text-lg font-bold">{previewDiff.companiesToUpdate?.length || 0}</div>
                                                                    <div className="text-[10px] uppercase">Roles Updated</div>
                                                                  </div>
                                                                  <div className="p-2 bg-zinc-100 text-zinc-800 rounded-lg">
                                                                    <div className="text-lg font-bold">{previewDiff.companiesUnchanged?.length || 0}</div>
                                                                    <div className="text-[10px] uppercase">Unchanged</div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )}

                                                            <div className="pt-4 px-6 pb-4 border-t border-[#D5D8CA] dark:border-[#2A2F3D] flex justify-end">
                                                              <button
                                                                type="button"
                                                                onClick={() => setIsCompareOpen(false)}
                                                                className="px-4 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] rounded-xl"
                                                              >
                                                                Close
                                                              </button>
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                                              <button
                                                                type="button"
                                                                onClick={() => setIsApplyOpen(false)}
                                                                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-lg"
                                                              >
                                                                Cancel
                                                              </button>
                                                              <button
                                                                type="button"
                                                                disabled={isApplying || selectedCompanyIds.length === 0}
                                                                onClick={handleApplySubmit}
                                                                className="btn-primary"
                                                              >
                                                                {isApplying ? 'Deploying...' : 'Deploy Template'}
                                                              </button>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </Modal>

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
                                                      {/* Export Modal */}
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
