import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield,
  Plus,
  Search,
  Building2,
  Copy,
  Trash2,
  Edit2,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Info,
  X,
  RotateCcw,
  Users,
  Check,
  AlertCircle,
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
  getOrgPermissionCatalog,
} from '../../../../api/sso/roleTemplate.api';
import { getAllFeatures } from '../../../../api/sso/feature';
import { getAllPermissions } from '../../../../api/sso/permission';
import { getActiveOrganizationId } from '../../../../api/common/roleCompanyContext';
import PageHeader from '../../../../components/common/PageHeader';
import Modal from '../../../../components/common/Modal';

/**
 * Tri-state Indeterminate Permission Checkbox
 * Identical behavior and styling as RolePermissionsSettings.jsx
 */
const PermissionCheckbox = ({ checked, indeterminate, disabled, onChange, title }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  if (disabled) {
    return (
      <div
        className="w-4 h-4 mx-auto opacity-20 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
        title={title || 'Not applicable'}
      />
    );
  }

  return (
    <div className="flex justify-center" title={title}>
      <input
        type="checkbox"
        ref={ref}
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-emerald-600 dark:text-emerald-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 rounded focus:ring-emerald-500 cursor-pointer transition-all"
      />
    </div>
  );
};

export default function OrgRolesView({ organization, companies = [] }) {
  const dispatch = useAppDispatch();

  // Organization Metadata
  const orgName = organization?.displayName || organization?.name || organization?.legalName || 'Organization';
  const orgId = organization?.id || getActiveOrganizationId();

  // Data States
  const [templates, setTemplates] = useState([]);
  const [catalogModules, setCatalogModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [searchRole, setSearchRole] = useState('');

  // Selected Permissions Matrix State
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate Modal State
  const [duplicateName, setDuplicateName] = useState('');

  // Deploy to Companies Modal State
  const [applySelectedCompanies, setApplySelectedCompanies] = useState([]);
  const [applyOverwrite, setApplyOverwrite] = useState(false);
  const [applyPreview, setApplyPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Initial Data Fetching
  // ───────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = orgId ? { organizationId: orgId } : {};
      const [templatesRes, catalogRes] = await Promise.allSettled([
        getOrgRoleTemplates(params),
        getOrgPermissionCatalog(params),
      ]);

      let templatesList = [];
      if (templatesRes.status === 'fulfilled' && templatesRes.value) {
        templatesList = Array.isArray(templatesRes.value)
          ? templatesRes.value
          : templatesRes.value.content || templatesRes.value.templates || templatesRes.value.data || [];
      }
      setTemplates(templatesList);

      let modulesList = [];
      if (catalogRes.status === 'fulfilled' && catalogRes.value) {
        const cat = catalogRes.value;
        if (Array.isArray(cat)) {
          modulesList = cat;
        } else if (Array.isArray(cat.modules)) {
          modulesList = cat.modules;
        } else if (Array.isArray(cat.data?.modules)) {
          modulesList = cat.data.modules;
        }
      }

      // If catalog endpoint didn't provide modules, fall back to features & permissions
      if (modulesList.length === 0) {
        try {
          const [feats, perms] = await Promise.all([
            getAllFeatures(),
            getAllPermissions(),
          ]);
          const featsList = Array.isArray(feats) ? feats : feats?.data || feats?.content || [];
          const permsList = Array.isArray(perms) ? perms : perms?.data || perms?.content || [];

          const permsByFeature = new Map();
          permsList.forEach((p) => {
            const fCode = (p.featureCode || '').toUpperCase().trim();
            if (!permsByFeature.has(fCode)) {
              permsByFeature.set(fCode, []);
            }
            permsByFeature.get(fCode).push({
              id: p.id,
              action: (p.action || '').toUpperCase().trim(),
              permissionCode: (p.permissionCode || `${fCode}:${p.action}`).toUpperCase().trim(),
              description: p.description || '',
            });
          });

          const moduleMap = new Map();
          featsList.forEach((f) => {
            const modName = (f.moduleName || 'GENERAL').toUpperCase().trim();
            if (!moduleMap.has(modName)) {
              moduleMap.set(modName, {
                moduleName: modName,
                displayName: f.moduleName || modName,
                features: [],
              });
            }
            const fCode = (f.code || f.featureCode || '').toUpperCase().trim();
            moduleMap.get(modName).features.push({
              featureCode: fCode,
              featureName: f.name || f.featureName || fCode,
              description: f.description || '',
              permissions: permsByFeature.get(fCode) || [],
            });
          });

          modulesList = Array.from(moduleMap.values());
        } catch (e) {
          console.warn('Fallback features/permissions fetch failed:', e);
        }
      }

      setCatalogModules(modulesList);

      // Expand all modules by default or at least the first
      if (modulesList.length > 0) {
        const initialExpanded = new Set();
        modulesList.forEach((m) => initialExpanded.add(m.moduleName || m.displayName));
        setExpandedModules(initialExpanded);
      }

      // Preserve or set selected role
      if (templatesList.length > 0) {
        setSelectedRoleId((prevId) => {
          const exists = templatesList.some((t) => t.id === prevId);
          return exists ? prevId : templatesList[0].id;
        });
      } else {
        setSelectedRoleId('');
      }
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || err?.message || 'Failed to load role templates and permissions.',
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, organization?.id]);
}, [dispatch, orgId]);

useEffect(() => {
  loadData();
}, [loadData]);
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
      // Currently selected role template
      const selectedRoleData = useMemo(() => {
        return templates.find((t) => t.id === selectedRoleId) || null;
      }, [templates, selectedRoleId]);

      if (typeFilter === 'System' && !t.isSystem) return false;
      if (typeFilter === 'Custom' && t.isSystem) return false;
      // Sync permissions when selected role changes
      useEffect(() => {
        if (selectedRoleData) {
          const perms = new Set((selectedRoleData.permissions || []).map((p) => p.toUpperCase().trim()));
          setSelectedPerms(perms);
          setIsDirty(false);
        } else {
          setSelectedPerms(new Set());
          setIsDirty(false);
        }
      }, [selectedRoleData]);

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
      // Filtered Templates for left panel search
      const filteredTemplates = useMemo(() => {
        if (!searchRole.trim()) return templates;
        const term = searchRole.toLowerCase();
        return templates.filter((t) => {
          const name = (t.name || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();
          const code = (t.code || '').toLowerCase();
          return name.includes(term) || desc.includes(term) || code.includes(term);
        });
      }, [templates, searchTerm, typeFilter, statusFilter, sortBy, sortOrder]);
    }, [templates, searchRole]);

  const totalElements = filteredTemplates.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedTemplates = useMemo(() => {
    const start = page * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, page, pageSize]);
  // ───────────────────────────────────────────────────────────────────────────
  // Dynamic Actions & Supported Features Analysis
  // ───────────────────────────────────────────────────────────────────────────
  const { supportedFeatureActions, keyToCodeMap, codeToKeyMap } = useMemo(() => {
    const supported = new Map();
    const keyToCode = new Map();
    const codeToKey = new Map();

    // Open Create Modal
    const handleOpenCreate = () => {
      setFormName('');
      setFormDescription('');
      setFormSelectedPerms(new Set());
      setFormSearchPerm('');
      setIsCreateOpen(true);
    };
    (catalogModules || []).forEach((m) => {
      (m.features || []).forEach((f) => {
        const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
        if (!supported.has(fCode)) {
          supported.set(fCode, new Set());
        }
        (f.permissions || []).forEach((p) => {
          const act = (p.action || '').toUpperCase().trim();
          const pCode = (p.permissionCode || `${fCode}:${act}`).toUpperCase().trim();
          supported.get(fCode).add(act);
          keyToCode.set(`${fCode}:${act}`, pCode);
          codeToKey.set(pCode, `${fCode}:${act}`);
        });
      });
    });

    // Open Edit Modal
    const handleOpenEdit = (template) => {
      setSelectedTemplate(template);
      setFormName(template.name || '');
      setFormDescription(template.description || '');
      setFormSelectedPerms(new Set((template.permissions || []).map((p) => p.toUpperCase())));
      setFormSearchPerm('');
      setIsEditOpen(true);
    };
    return { supportedFeatureActions: supported, keyToCodeMap: keyToCode, codeToKeyMap: codeToKey };
  }, [catalogModules]);

  // Save Create Template
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      dispatch(addAlert({ type: 'warning', message: 'Template name is required' }));
      return;
    }
    // Calculate dynamic actions supported across the entire catalog and selected role
    const dynamicActions = useMemo(() => {
      const actionSet = new Set();

      setIsSubmitting(true);
      try {
        await createOrgRoleTemplate({
          name: formName.trim(),
          description: formDescription.trim(),
          permissionCodes: Array.from(formSelectedPerms),
    (catalogModules || []).forEach((m) => {
            (m.features || []).forEach((f) => {
              (f.permissions || []).forEach((p) => {
                if (p.action) actionSet.add(p.action.toUpperCase().trim());
              });
            });
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
      (selectedRoleData?.permissions || []).forEach((perm) => {
        if (typeof perm === 'string' && perm.includes(':')) {
          const parts = perm.split(':');
          if (parts[1]) actionSet.add(parts[1].toUpperCase().trim());
        }
      });

      setIsSubmitting(true);
      try {
        await updateOrgRoleTemplate(selectedTemplate.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          permissionCodes: Array.from(formSelectedPerms),
          const standardOrder = [
            'READ',
            'CREATE',
            'UPDATE',
            'WRITE',
            'DELETE',
            'APPROVE',
            'REJECT',
            'RETURN',
            'EXPORT',
            'ACTIVATE',
            'DEACTIVATE',
            'CANCEL',
            'DELEGATE',
          ];

          const result = [];
          standardOrder.forEach((act) => {
            if (actionSet.has(act)) {
              result.push({
                value: act,
                label: act.charAt(0).toUpperCase() + act.slice(1).toLowerCase(),
              });
              actionSet.delete(act);
            }
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
      // Append any extra dynamic actions
      Array.from(actionSet)
        .sort()
        .forEach((act) => {
          result.push({
            value: act,
            label: act.charAt(0).toUpperCase() + act.slice(1).toLowerCase(),
          });
        });

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
    if (result.length === 0) {
      return standardOrder.slice(0, 8).map((act) => ({
        value: act,
        label: act.charAt(0).toUpperCase() + act.slice(1).toLowerCase(),
      }));
    }

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
    return result;
  }, [catalogModules, selectedRoleData]);

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
  // ───────────────────────────────────────────────────────────────────────────
  // Permission Checkbox & State Helper Functions
  // ───────────────────────────────────────────────────────────────────────────
  const isFeatureActionSupported = useCallback(
    (featureCode, action) => {
      const fCode = (featureCode || '').toUpperCase().trim();
      const act = (action || '').toUpperCase().trim();
      const supported = supportedFeatureActions.get(fCode);
      return Boolean(supported && supported.has(act));
    },
    [supportedFeatureActions]
  );

  const confirmed = await confirmDialog({
    title: 'Delete Role Template',
    message: `Are you sure you want to delete custom template "${template.name}"? This action cannot be undone.`,
    confirmText: 'Delete Template',
    isDestructive: true,
  });
  if (!confirmed) return;
  const getPermissionCode = useCallback(
    (featureCode, action) => {
      const fCode = (featureCode || '').toUpperCase().trim();
      const act = (action || '').toUpperCase().trim();
      return keyToCodeMap.get(`${fCode}:${act}`) || `${fCode}:${act}`;
    },
    [keyToCodeMap]
  );

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
const isPermissionChecked = useCallback(
  (featureCode, action) => {
    const code = getPermissionCode(featureCode, action);
    const fCode = (featureCode || '').toUpperCase().trim();
    const act = (action || '').toUpperCase().trim();
    return selectedPerms.has(code) || selectedPerms.has(`${fCode}:${act}`);
  },
  [getPermissionCode, selectedPerms]
);

// Open Apply to Companies Modal
const handleOpenApply = (template) => {
  setApplyTargetTemplate(template);
  setApplySelectedCompanies(companies.map((c) => c.id));
  setApplyOverwrite(false);
  setApplyPreview(null);
  setIsApplyOpen(true);
};
// Toggle single feature action with intuitive dependencies
const toggleFeatureAction = useCallback(
  (featureCode, action) => {
    const fCode = (featureCode || '').toUpperCase().trim();
    const act = (action || '').toUpperCase().trim();
    const code = getPermissionCode(fCode, act);
    const next = new Set(selectedPerms);
    const isCurrentlyChecked = next.has(code) || next.has(`${fCode}:${act}`);

    // Generate Apply Preview
    const handleRunPreview = async () => {
      if (!applySelectedCompanies.length) {
        dispatch(addAlert({ type: 'warning', message: 'Select at least one company' }));
        return;
      }
      if (isCurrentlyChecked) {
        next.delete(code);
        next.delete(`${fCode}:${act}`);
        // If unchecking READ, also remove dependent actions like WRITE, DELETE
        if (act === 'READ') {
          const writeCode = getPermissionCode(fCode, 'WRITE');
          const deleteCode = getPermissionCode(fCode, 'DELETE');
          next.delete(writeCode);
          next.delete(`${fCode}:WRITE`);
          next.delete(deleteCode);
          next.delete(`${fCode}:DELETE`);
        }
      } else {
        next.add(code);
        // If checking WRITE or DELETE, automatically enable READ if supported
        if (act === 'WRITE' || act === 'DELETE') {
          if (isFeatureActionSupported(fCode, 'READ')) {
            const readCode = getPermissionCode(fCode, 'READ');
            next.add(readCode);
          }
        }
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
    setSelectedPerms(next);
    setIsDirty(true);
  },
  [getPermissionCode, isFeatureActionSupported, selectedPerms]
);

// Confirm and Deploy Template
const handleConfirmApply = async () => {
  if (!applySelectedCompanies.length) return;
  // Toggle all actions for a feature
  const toggleFeatureAll = useCallback(
    (featureCode, isChecked) => {
      const fCode = (featureCode || '').toUpperCase().trim();
      const supported = supportedFeatureActions.get(fCode) || new Set();
      const next = new Set(selectedPerms);

      setIsApplying(true);
      try {
        const res = await applyOrgRoleTemplate(applyTargetTemplate.id, {
          companyIds: applySelectedCompanies,
          overwriteExisting: applyOverwrite,
        });
        supported.forEach((act) => {
          const code = getPermissionCode(fCode, act);
          if (isChecked) {
            next.add(code);
          } else {
            next.delete(code);
            next.delete(`${fCode}:${act}`);
          }
        });

        const parts = [];
        if (res.createdCount > 0) parts.push(`${res.createdCount} created`);
        if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
        if (res.skippedCount > 0) parts.push(`${res.skippedCount} skipped`);
        setSelectedPerms(next);
        setIsDirty(true);
      },
      [getPermissionCode, selectedPerms, supportedFeatureActions]
  );

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
// Toggle single action across all features in a module
const toggleModuleAction = useCallback(
  (moduleName, action, isChecked) => {
    const act = (action || '').toUpperCase().trim();
    const mod = catalogModules.find((m) => (m.moduleName || m.displayName) === moduleName);
    if (!mod) return;

    // Open Compare Modal
    const handleOpenCompare = async (roleName) => {
      const targetName = roleName || (templates[0]?.name ?? 'Admin');
      setCompareRoleName(targetName);
      setIsCompareOpen(true);
      setIsComparing(true);
      setCompareData(null);
      const next = new Set(selectedPerms);
      (mod.features || []).forEach((f) => {
        const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
        if (isFeatureActionSupported(fCode, act)) {
          const code = getPermissionCode(fCode, act);
          if (isChecked) {
            next.add(code);
            if (act === 'WRITE' || act === 'DELETE') {
              if (isFeatureActionSupported(fCode, 'READ')) {
                next.add(getPermissionCode(fCode, 'READ'));
              }
            }
          } else {
            next.delete(code);
            next.delete(`${fCode}:${act}`);
            if (act === 'READ') {
              next.delete(getPermissionCode(fCode, 'WRITE'));
              next.delete(`${fCode}:WRITE`);
              next.delete(getPermissionCode(fCode, 'DELETE'));
              next.delete(`${fCode}:DELETE`);
            }
          }
        }
      });

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
    setSelectedPerms(next);
    setIsDirty(true);
  },
  [catalogModules, getPermissionCode, isFeatureActionSupported, selectedPerms]
);

// Open Import Modal
const handleOpenImport = () => {
  setImportCompanyId(companies[0]?.id || '');
  setImportCompanyRoles([]);
  setImportRoleId('');
  setImportTemplateName('');
  setImportDescription('');
  setIsImportOpen(true);
};
// Toggle all actions for all features in a module
const toggleModuleAll = useCallback(
  (moduleName, isChecked) => {
    const mod = catalogModules.find((m) => (m.moduleName || m.displayName) === moduleName);
    if (!mod) return;

    // Load roles when import company changes
    useEffect(() => {
      if (!importCompanyId || !isImportOpen) return;
      const next = new Set(selectedPerms);
      (mod.features || []).forEach((f) => {
        const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
        const supported = supportedFeatureActions.get(fCode) || new Set();
        supported.forEach((act) => {
          const code = getPermissionCode(fCode, act);
          if (isChecked) {
            next.add(code);
          } else {
            next.delete(code);
            next.delete(`${fCode}:${act}`);
          }
        });
      });

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
            setSelectedPerms(next);
            setIsDirty(true);
          },
          [catalogModules, getPermissionCode, selectedPerms, supportedFeatureActions]
  );

      // Toggle module expanded state
      const toggleModuleExpanded = (modName) => {
        setExpandedModules((prev) => {
          const next = new Set(prev);
          if (next.has(modName)) {
            next.delete(modName);
          } else {
            setImportRoleId('');
            setImportTemplateName('');
            next.add(modName);
          }
        })
          .catch(() => {
            if (!isMounted) return;
            dispatch(addAlert({ type: 'error', message: 'Failed to load company roles' }));
          })
          .finally(() => {
            if (isMounted) setIsLoadingCompanyRoles(false);
            return next;
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
      // Tri-state helpers
      const getFeatureState = useCallback(
        (featureCode) => {
          const fCode = (featureCode || '').toUpperCase().trim();
          const supported = supportedFeatureActions.get(fCode) || new Set();
          if (supported.size === 0) {
            return { checked: false, indeterminate: false, disabled: true };
          }
          let checkedCount = 0;
          supported.forEach((act) => {
            if (isPermissionChecked(fCode, act)) {
              checkedCount++;
            }
          });
          return {
            checked: checkedCount === supported.size && supported.size > 0,
            indeterminate: checkedCount > 0 && checkedCount < supported.size,
            disabled: false,
          };
        },
        [isPermissionChecked, supportedFeatureActions]
      );

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
    const getModuleActionState = useCallback(
      (moduleName, action) => {
        const act = (action || '').toUpperCase().trim();
        const mod = catalogModules.find((m) => (m.moduleName || m.displayName) === moduleName);
        if (!mod) return { checked: false, indeterminate: false, disabled: true };

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
        const applicableFeatures = (mod.features || []).filter((f) => {
          const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
          return isFeatureActionSupported(fCode, act);
        });

        // Toggle module permissions in form
        const toggleModulePermissions = (moduleGroup, selectAll) => {
          const next = new Set(formSelectedPerms);
          moduleGroup.features?.forEach((feat) => {
            feat.permissions?.forEach((perm) => {
              if (selectAll) {
                next.add(perm.permissionCode.toUpperCase());
              } else {
                next.delete(perm.permissionCode.toUpperCase());
                if (applicableFeatures.length === 0) {
                  return { checked: false, indeterminate: false, disabled: true };
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
        const checkedCount = applicableFeatures.filter((f) => {
          const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
          return isPermissionChecked(fCode, act);
        }).length;

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
              return {
                checked: checkedCount === applicableFeatures.length,
                indeterminate: checkedCount > 0 && checkedCount < applicableFeatures.length,
                disabled: false,
              };
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
              [catalogModules, isFeatureActionSupported, isPermissionChecked]
  );

        const getModuleAllState = useCallback(
          (moduleName) => {
            const mod = catalogModules.find((m) => (m.moduleName || m.displayName) === moduleName);
            if (!mod) return { checked: false, indeterminate: false, disabled: true };

            let totalSupported = 0;
            let totalChecked = 0;

            (mod.features || []).forEach((f) => {
              const fCode = (f.featureCode || f.code || '').toUpperCase().trim();
              const supported = supportedFeatureActions.get(fCode) || new Set();
              totalSupported += supported.size;
              supported.forEach((act) => {
                if (isPermissionChecked(fCode, act)) {
                  totalChecked++;
                }
              });
            });

            return {
              checked: totalChecked === totalSupported && totalSupported > 0,
              indeterminate: totalChecked > 0 && totalChecked < totalSupported,
              disabled: totalSupported === 0,
            };
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
[catalogModules, isPermissionChecked, supportedFeatureActions]
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
  // ───────────────────────────────────────────────────────────────────────────
  // Save & CRUD Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedRoleId || !selectedRoleData) return;
    setIsSaving(true);
    try {
      const permissionCodes = Array.from(selectedPerms);
    await updateOrgRoleTemplate(selectedRoleId, {
      name: selectedRoleData.name,
    description: selectedRoleData.description,
    status: selectedRoleData.status,
    permissionCodes,
      });

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
      // Update local state
      setTemplates((prev) =>
        prev.map((t) => (t.id === selectedRoleId ? {...t, permissions: permissionCodes, permissionCount: permissionCodes.length } : t))
            );
            setIsDirty(false);
            dispatch(
            addAlert({
              type: 'success',
            message: `Permissions for role '${selectedRoleData.name}' saved successfully.`,
        })
            );
    } catch (err) {
              dispatch(
                addAlert({
                  type: 'error',
                  message: err?.response?.data?.message || err?.message || 'Failed to save role permissions.',
                })
              );
    } finally {
              setIsSaving(false);
    }
  };

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
  const handleCancel = () => {
    if (selectedRoleData) {
              setSelectedPerms(new Set((selectedRoleData.permissions || []).map((p) => p.toUpperCase().trim())));
            setIsDirty(false);
    }
  };

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
  // Open Create Modal
  const handleOpenCreate = () => {
              setFormName('');
            setFormDescription('');
            setFormActive(true);
            setIsCreateOpen(true);
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
  const handleCreateSubmit = async (e) => {
              e.preventDefault();
            if (!formName.trim()) {
              dispatch(addAlert({ type: 'warning', message: 'Role template name is required.' }));
            return;
    }

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
    setIsSubmitting(true);
    try {
      const created = await createOrgRoleTemplate({
      name: formName.trim(),
    description: formDescription.trim(),
    permissionCodes: [],
      });

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
        dispatch(addAlert({type: 'success', message: 'Role template created successfully.' }));
        setIsCreateOpen(false);
        await loadData();
        if (created?.id) {
          setSelectedRoleId(created.id);
      }
    } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: err?.response?.data?.message || err?.message || 'Failed to create role template.',
            })
          );
    } finally {
          setIsSubmitting(false);
    }
  };

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
  // Open Edit Modal
  const handleOpenEdit = (template) => {
          setFormName(template.name || '');
        setFormDescription(template.description || '');
        setFormActive(Boolean(template.status));
        setIsEditOpen(true);
  };

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Grant Permissions ({formSelectedPerms.size} selected)
            </label>
            <div className="relative w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
  const handleEditSubmit = async (e) => {
                e.preventDefault();
              if (!formName.trim() || !selectedRoleId) {
                dispatch(addAlert({ type: 'warning', message: 'Role template name is required.' }));
              return;
    }

              setIsSubmitting(true);
              try {
                await updateOrgRoleTemplate(selectedRoleId, {
                  name: formName.trim(),
                  description: formDescription.trim(),
                  status: formActive,
                  permissionCodes: Array.from(selectedPerms),
                });

              dispatch(addAlert({type: 'success', message: 'Role template updated successfully.' }));
              setIsEditOpen(false);
              await loadData();
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to update role template.',
                  })
                );
    } finally {
                setIsSubmitting(false);
    }
  };

  // Open Duplicate Modal
  const handleOpenDuplicate = (template) => {
                setDuplicateName(`${template.name} (Copy)`);
              setIsDuplicateOpen(true);
  };

  const handleDuplicateSubmit = async (e) => {
                e.preventDefault();
              if (!duplicateName.trim() || !selectedRoleId) {
                dispatch(addAlert({ type: 'warning', message: 'New role template name is required.' }));
              return;
    }

              setIsSubmitting(true);
              try {
      const duplicated = await duplicateOrgRoleTemplate(selectedRoleId, duplicateName.trim());
              dispatch(addAlert({type: 'success', message: 'Role template duplicated successfully.' }));
              setIsDuplicateOpen(false);
              await loadData();
              if (duplicated?.id) {
                setSelectedRoleId(duplicated.id);
      }
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to duplicate role template.',
                  })
                );
    } finally {
                setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async () => {
    if (!selectedRoleId || !selectedRoleData) return;
              const newStatus = !selectedRoleData.status;
              try {
                await updateOrgRoleTemplateStatus(selectedRoleId, newStatus);
      setTemplates((prev) =>
        prev.map((t) => (t.id === selectedRoleId ? {...t, status: newStatus } : t))
              );
              dispatch(
              addAlert({
                type: 'success',
              message: `Role template '${selectedRoleData.name}' is now ${newStatus ? 'Active' : 'Inactive'}.`,
        })
              );
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to update template status.',
                  })
                );
    }
  };

  // Delete Template
  const handleDeleteSubmit = async () => {
    if (!selectedRoleId || !selectedRoleData) return;
              if (selectedRoleData.isSystem) {
                dispatch(addAlert({ type: 'warning', message: 'System role templates cannot be deleted.' }));
              return;
    }

              setIsSubmitting(true);
              try {
                await deleteOrgRoleTemplate(selectedRoleId);
              dispatch(addAlert({type: 'success', message: 'Role template deleted successfully.' }));
              setIsDeleteOpen(false);
              await loadData();
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to delete role template.',
                  })
                );
    } finally {
                setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Deploy to Operating Companies Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenApply = () => {
                setApplySelectedCompanies(companies.map((c) => c.id));
              setApplyOverwrite(false);
              setApplyPreview(null);
              setIsApplyOpen(true);
  };

  const handleToggleCompany = (companyId) => {
                setApplySelectedCompanies((prev) =>
                  prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
                );
  };

  const handleSelectAllCompanies = () => {
    if (applySelectedCompanies.length === companies.length) {
                setApplySelectedCompanies([]);
    } else {
                setApplySelectedCompanies(companies.map((c) => c.id));
    }
  };

  const handlePreviewApply = async () => {
    if (!selectedRoleId || !applySelectedCompanies.length) {
                dispatch(addAlert({ type: 'warning', message: 'Please select at least one company.' }));
              return;
    }

              setIsPreviewing(true);
              try {
      const res = await previewApplyOrgRoleTemplate(selectedRoleId, {
                companyIds: applySelectedCompanies,
              overwriteExisting: applyOverwrite,
      });
              setApplyPreview(res);
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to generate deployment preview.',
                  })
                );
    } finally {
                setIsPreviewing(false);
    }
  };

  const handleConfirmDeploy = async () => {
    if (!selectedRoleId || !applySelectedCompanies.length) return;

              setIsApplying(true);
              try {
      const res = await applyOrgRoleTemplate(selectedRoleId, {
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
              message: `Role template deployed successfully: ${parts.length ? parts.join(', ') : 'Applied'} across selected companies.`,
        })
              );
              setIsApplyOpen(false);
              await loadData();
    } catch (err) {
                dispatch(
                  addAlert({
                    type: 'error',
                    message: err?.response?.data?.message || err?.message || 'Failed to deploy role template.',
                  })
                );
    } finally {
                setIsApplying(false);
    }
  };

              // ───────────────────────────────────────────────────────────────────────────
              // Render
              // ───────────────────────────────────────────────────────────────────────────
              return (
              <div className="flex flex-col h-full bg-[#E8E9DF] dark:bg-[#0F1117] relative">
                {/* ── Breadcrumb Navigation ── */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium px-6 pt-5 pb-1">
                  <span className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                    <Building2 size={13} className="text-zinc-600 dark:text-zinc-300" />
                    <span>{orgName}</span>
                  </span>
                  <ChevronRight size={13} className="text-zinc-400 dark:text-zinc-500" />
                  <span>Settings</span>
                  <ChevronRight size={13} className="text-zinc-400 dark:text-zinc-500" />
                  <span className="px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-300/60 dark:border-zinc-700 shadow-2xs">
                    Role Management
                  </span>
                </div>

                {/* ── Page Header ── */}
                <PageHeader
                  title="Role Management"
                  description="Centrally configure organization role templates and deploy them across operating companies."
                >
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Create Role</span>
                  </button>
                </PageHeader>

                {/* ── Main Two-Column Layout ── */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
                  {/* ── LEFT PANEL: Role Template List ── */}
                  <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 shrink-0">
                      <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Roles</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        Select a role to view and manage permissions
                      </p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
                        <input
                          type="text"
                          value={formSearchPerm}
                          onChange={(e) => setFormSearchPerm(e.target.value)}
                          placeholder="Filter permissions..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                          placeholder="Search roles..."
                          value={searchRole}
                          onChange={(e) => setSearchRole(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 focus:border-zinc-900 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Permission Catalog Tree */}
                    <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                      {!catalog?.modules || catalog.modules.length === 0 ? (
                        <div className="text-center py-6 text-xs text-zinc-400">
                          No permission catalog loaded.
                          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {isLoading ? (
                              <div className="p-8 text-center text-zinc-400">
                                <Loader2 className="animate-spin mx-auto w-6 h-6" />
                                <span className="text-xs mt-2 block">Loading role templates...</span>
                              </div>
                            ) : filteredTemplates.length === 0 ? (
                              <div className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                                <Shield size={24} className="mx-auto text-zinc-300 dark:text-zinc-600" />
                                <p className="font-medium">
                                  {searchRole ? 'No matching role templates' : 'No role templates configured'}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {searchRole ? 'Try adjusting your search keywords.' : 'Click "Create Role" above to set up your first template.'}
                                </p>
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
                                                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border cursor-pointer select-none transition-colors ${isChecked
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
              filteredTemplates.map((role) => {
                const isSelected = selectedRoleId === role.id;
                                          const permCount = role.permissions?.length ?? role.permissionCount ?? 0;
                                          return (
                                          <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => {
                                              if (isDirty && role.id !== selectedRoleId) {
                                                if (!window.confirm('You have unsaved permission changes. Switch role without saving?')) {
                                                  return;
                                                }
                                              }
                                              setSelectedRoleId(role.id);
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected
                                                ? 'bg-blue-50/50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/40 ring-1 ring-blue-500/10'
                                                : 'bg-white dark:bg-[#161922] border-zinc-100 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-[#1D212C]'
                                              }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex gap-3 min-w-0">
                                                <div
                                                  className={`mt-0.5 p-1.5 rounded-md shrink-0 ${isSelected
                                                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                                    }`}
                                                >
                                                  <Users size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                                                    {role.name}
                                                  </div>
                                                  {role.description && (
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                                                      {role.description}
                                                    </p>
                                                  )}
                                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-1.5">
                                                    <span>{role.isSystem ? 'System Role' : 'Custom Role'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                    <span>{permCount} perms</span>
                                                    {role.appliedCompaniesCount !== undefined && (
                                                      <>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                                        <span>{role.appliedCompaniesCount} comps</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                    ))}
                                            </div>
                                        </div>
                                        ))
                                        {role.status ? (
                                          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30">
                                            <CheckCircle2 size={10} /> Active
                                          </span>
                                        ) : (
                                          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                            Inactive
                                          </span>
                                        )}
                                      </div>
                  </button>
                                  );
              })
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
                    {/* ── RIGHT PANEL: Permissions Matrix & Role Details ── */}
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
                      {selectedRoleData ? (
            <>
                          {/* Role Header */}
                          <div className="p-5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedRoleData.name}</h2>
                                  {selectedRoleData.status ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30">
                                      <CheckCircle2 size={12} /> Active
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                      Inactive
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30">
                                    {selectedRoleData.isSystem ? 'System Role' : 'Custom Role'}
                                  </span>
                                </div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
                                  <span>{selectedRoleData.isSystem ? 'System Template' : 'Organization Role Template'}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                  <span>{selectedPerms.size} configured permissions</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                  <span>Deployed to {selectedRoleData.appliedCompaniesCount ?? 0} companies</span>
                                  {selectedRoleData.description && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                                      <span className="text-zinc-600 dark:text-zinc-300">{selectedRoleData.description}</span>
                                    </>
                                  )}
                                </div>
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
                                              {/* Actions Toolbar */}
                                              <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => toggleModulePermissions(mod, true)}
                                                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                                                  onClick={() => handleOpenEdit(selectedRoleData)}
                                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-2xs"
                                                >
                                                  Select All
                                                  <Edit2 size={13} /> Edit Role
                                                </button>
                                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                <button
                                                  type="button"
                                                  onClick={() => toggleModulePermissions(mod, false)}
                                                  className="text-[11px] text-zinc-500 hover:underline"
                                                  onClick={() => handleOpenDuplicate(selectedRoleData)}
                                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-2xs"
                                                >
                                                  Clear
                                                  <Copy size={13} /> Duplicate Role
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleOpenApply}
                                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors shadow-2xs"
                                                >
                                                  <Send size={13} /> Deploy to Companies
                                                </button>
                                                {!selectedRoleData.isSystem && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setIsDeleteOpen(true)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shadow-2xs"
                                                  >
                                                    <Trash2 size={13} /> Delete
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={handleSave}
                                                  disabled={isSaving || !isDirty}
                                                  className="btn-primary flex items-center gap-2 text-xs py-1.5 px-3.5"
                                                >
                                                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                  Save Changes
                                                </button>
                                              </div>
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
                                                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border cursor-pointer select-none transition-colors ${isChecked
                                                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium'
                                                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                                            }`}
                                                        >
                                                          <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(perm.permissionCode)}
                                                            {/* Info Alert Callout Banner */}
              <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20 flex items-start gap-3 shrink-0">
                                                            <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                              These permissions define the organization role template. Deploying updates will sync permissions across assigned operating companies while preserving existing user role assignments.
                                                            </p>
                                                          </div>

                                                          {/* Table Container */}
                                                          <div className="flex-1 overflow-auto min-w-0 max-w-full custom-scrollbar">
                                                            {isLoading ? (
                                                              <div className="p-12 flex justify-center text-zinc-400">
                                                                <Loader2 className="animate-spin w-8 h-8" />
                                                              </div>
                                                            ) : (
                                                              <table className="w-full text-left border-collapse min-w-[1200px]" aria-label="Role Permissions Matrix">
                                                                <thead className="sticky top-0 bg-zinc-50 dark:bg-[#1D212C] z-20 border-b border-zinc-200 dark:border-[#2A2F3D]">
                                                                  <tr>
                                                                    <th
                                                                      scope="col"
                                                                      className="py-3 px-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-[#2A2F3D] min-w-[240px]"
                                                                    >
                                                                      Feature
                                                                    </th>
                                                                    <th
                                                                      scope="col"
                                                                      className="py-3 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center border-b border-zinc-200 dark:border-[#2A2F3D] w-20"
                                                                    >
                                                                      Select all
                                                                    </th>
                                                                    {dynamicActions.map((action) => (
                                                                      <th
                                                                        key={action.value}
                                                                        scope="col"
                                                                        className="py-3 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-center border-b border-zinc-200 dark:border-[#2A2F3D] w-16 min-w-[64px]"
                                                                      >
                                                                        {action.label}
                                                                      </th>
                                                                    ))}
                                                                  </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                                                                  {catalogModules.map((mod) => {
                                                                    const modName = mod.moduleName || mod.displayName;
                                                                    const isExpanded = expandedModules.has(modName);
                                                                    const modAllState = getModuleAllState(modName);

                                                                    return (
                                                                      <React.Fragment key={modName}>
                                                                        {/* Module Header Row */}
                                                                        <tr
                                                                          className={`group transition-colors ${isExpanded
                                                                              ? 'bg-zinc-50/50 dark:bg-[#1D212C]/60'
                                                                              : 'bg-white dark:bg-[#161922] hover:bg-zinc-50 dark:hover:bg-[#1D212C]'
                                                                            }`}
                                                                        >
                                                                          <td className="py-3 px-6 min-w-[240px]">
                                                                            <button
                                                                              type="button"
                                                                              onClick={() => toggleModuleExpanded(modName)}
                                                                              className="flex items-center gap-2.5 w-full text-left font-bold text-zinc-800 dark:text-zinc-200 text-sm"
                                                                            >
                                                                              <div
                                                                                className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''
                                                                                  }`}
                                                                              >
                                                                                <ChevronRight size={16} />
                                                                              </div>
                                                                              <LayoutGrid size={16} className="text-zinc-400 dark:text-zinc-500" />
                                                                              <span>{mod.displayName || mod.moduleName}</span>
                                                                              <span className="text-[11px] font-normal text-zinc-400">
                                                                                ({(mod.features || []).length} features)
                                                                              </span>
                                                                            </button>
                                                                          </td>
                                                                          <td className="py-3 px-2 text-center">
                                                                            <PermissionCheckbox
                                                                              checked={modAllState.checked}
                                                                              indeterminate={modAllState.indeterminate}
                                                                              disabled={modAllState.disabled}
                                                                              onChange={(checked) => toggleModuleAll(modName, checked)}
                                                                              title="Select all permissions in module"
                                                                            />
                                                                            <span>{perm.action}</span>
                                                                          </label>
                                                                          );
                          })}
                                                                        </div>
                                                                      </div>
                                                                    ))}
                                                                </td>
                                                                {dynamicActions.map((action) => {
                                                                  const modActionState = getModuleActionState(modName, action.value);
                                                                  return (
                                                                    <td key={action.value} className="py-3 px-2 text-center">
                                                                      {modActionState.disabled ? (
                                                                        <span
                                                                          className="text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none"
                                                                          title="Unsupported in module"
                                                                        >
                                                                          —
                                                                        </span>
                                                                      ) : (
                                                                        <PermissionCheckbox
                                                                          checked={modActionState.checked}
                                                                          indeterminate={modActionState.indeterminate}
                                                                          disabled={false}
                                                                          onChange={(checked) => toggleModuleAction(modName, action.value, checked)}
                                                                          title={`Toggle all ${action.label} in module`}
                                                                        />
                                                                      )}
                                                                    </td>
                                                                  );
                                                                })}
                                                              </tr>

                            {/* Feature Rows */}
                                                            {isExpanded &&
                                                              (mod.features || []).map((feature) => {
                                                                const fCode = (feature.featureCode || feature.code || '').toUpperCase().trim();
                                                                const featAllState = getFeatureState(fCode);

                                                                return (
                                                                  <tr
                                                                    key={fCode}
                                                                    className="bg-white dark:bg-[#161922] hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 transition-colors"
                                                                  >
                                                                    <td className="py-2.5 px-6 pl-14 min-w-[240px]">
                                                                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                                                        {feature.featureName || feature.name || fCode}
                                                                      </div>
                                                                      {feature.description && (
                                                                        <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-xs">
                                                                          {feature.description}
                                                                        </div>
                                                                      )}
                                                                    </td>
                                                                    <td className="py-2.5 px-2 bg-zinc-50/30 dark:bg-[#1D212C]/30 text-center">
                                                                      <PermissionCheckbox
                                                                        checked={featAllState.checked}
                                                                        indeterminate={featAllState.indeterminate}
                                                                        disabled={featAllState.disabled}
                                                                        onChange={(checked) => toggleFeatureAll(fCode, checked)}
                                                                        title="Select all actions for feature"
                                                                      />
                                                                    </td>
                                                                    {dynamicActions.map((action) => {
                                                                      const supported = isFeatureActionSupported(fCode, action.value);
                                                                      if (!supported) {
                                                                        return (
                                                                          <td key={action.value} className="py-2.5 px-2 text-center">
                                                                            <span
                                                                              className="text-zinc-300 dark:text-zinc-600 text-xs font-medium select-none"
                                                                              title="Not supported"
                                                                            >
                                                                              —
                                                                            </span>
                                                                          </td>
                                                                        );
                                                                      }
                                                                      const isChecked = isPermissionChecked(fCode, action.value);
                                                                      return (
                                                                        <td key={action.value} className="py-2.5 px-2 text-center">
                                                                          <PermissionCheckbox
                                                                            checked={isChecked}
                                                                            disabled={false}
                                                                            onChange={() => toggleFeatureAction(fCode, action.value)}
                                                                            title={`${action.label} on ${feature.featureName || fCode}`}
                                                                          />
                                                                        </td>
                                                                      );
                                                                    })}
                                                                  </tr>
                                                                );
                                                              })}
                                                          </React.Fragment>
                                                          );
                      })}
                                                        </tbody>
                  </table>
                )}
                                              </div>

              {/* Footer Actions */ }
                                              < div className = "p-4 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C]/80 flex justify-between items-center mt-auto shrink-0" >
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isDirty ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                      Unsaved permission changes
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      All changes saved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={!isDirty || isSaving}
                    className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg shadow-2xs hover:bg-zinc-50 dark:hover:bg-[#1D212C] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="btn-primary flex items-center gap-2 text-xs py-1.5 px-3.5"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </div>
              </div>
            ))}
                                        </div>
            </>
                                    ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-[#161922] space-y-3">
                                      <Shield size={36} className="text-zinc-300 dark:text-zinc-600" />
                                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No Role Selected</p>
                                      <p className="text-xs text-zinc-400 text-center max-w-sm">
                                        Select a role from the left panel to configure its permissions matrix, or click "Create Role" to create a new template.
                                      </p>
                                    </div>
          )}
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
                            {/* ─────────────────────────────────────────────────────────────────────────── */}
                            {/* MODAL 1: Create Role Template */}
                            {/* ─────────────────────────────────────────────────────────────────────────── */}
                            <Modal
                              isOpen={isCreateOpen}
                              onClose={() => !isSubmitting && setIsCreateOpen(false)}
                              title="Create Organization Role Template"
                            >
                              <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                    Role Name <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Finance Auditor"
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20"
                                    required
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Describe this role template's organizational purpose..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 resize-none"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
                                  <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmitting || !formName.trim()}
                                    className="btn-primary flex items-center gap-2 text-xs"
                                  >
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Create Template
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
                                {/* ─────────────────────────────────────────────────────────────────────────── */}
                                {/* MODAL 2: Edit Role Template */}
                                {/* ─────────────────────────────────────────────────────────────────────────── */}
                                <Modal
                                  isOpen={isEditOpen}
                                  onClose={() => !isSubmitting && setIsEditOpen(false)}
                                  title="Edit Role Template"
                                >
                                  <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div>
                                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Role Name <span className="text-rose-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20"
                                        required
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Description
                                      </label>
                                      <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20 resize-none"
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="checkbox"
                                        id="edit-role-active"
                                        checked={formActive}
                                        onChange={(e) => setFormActive(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                        disabled={isSubmitting}
                                      />
                                      <label htmlFor="edit-role-active" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                        Active Status
                                      </label>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
                                      <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isSubmitting || !formName.trim()}
                                        className="btn-primary flex items-center gap-2 text-xs"
                                      >
                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Save Changes
                                      </button>
                                    </div>
                                  </form>
                                </Modal>

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
                                    {/* ─────────────────────────────────────────────────────────────────────────── */}
                                    {/* MODAL 3: Duplicate Role Template */}
                                    {/* ─────────────────────────────────────────────────────────────────────────── */}
                                    <Modal
                                      isOpen={isDuplicateOpen}
                                      onClose={() => !isSubmitting && setIsDuplicateOpen(false)}
                                      title="Duplicate Role Template"
                                    >
                                      <form onSubmit={handleDuplicateSubmit} className="space-y-4">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                          Creates a new organization role template cloned with all permissions from{' '}
                                          <strong className="text-zinc-800 dark:text-zinc-200">{selectedRoleData?.name}</strong>.
                                        </p>
                                        <div>
                                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                            New Template Name <span className="text-rose-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={duplicateName}
                                            onChange={(e) => setDuplicateName(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-blue-500/20"
                                            required
                                            disabled={isSubmitting}
                                          />
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
                                          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
                                            <button
                                              type="button"
                                              onClick={handleRunPreview}
                                              disabled={isPreviewing || applySelectedCompanies.length === 0}
                                              className="px-3 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                                              onClick={() => setIsDuplicateOpen(false)}
                                              disabled={isSubmitting}
                                              className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
                                            >
                                              {isPreviewing ? 'Calculating...' : 'Preview Differences'}
                                              Cancel
                                            </button>
                                            <button
                                              type="submit"
                                              disabled={isSubmitting || !duplicateName.trim()}
                                              className="btn-primary flex items-center gap-2 text-xs"
                                            >
                                              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                                              Duplicate Template
                                            </button>
                                          </div>
                                        </form>
                                    </Modal>

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
                                        {/* ─────────────────────────────────────────────────────────────────────────── */}
                                        {/* MODAL 4: Delete Confirmation */}
                                        {/* ─────────────────────────────────────────────────────────────────────────── */}
                                        <Modal
                                          isOpen={isDeleteOpen}
                                          onClose={() => !isSubmitting && setIsDeleteOpen(false)}
                                          title="Delete Role Template"
                                        >
                                          <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs">
                                              <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                              <div>
                                                <p className="font-bold">Are you sure you want to delete this template?</p>
                                                <p className="mt-1">
                                                  Role template <strong>{selectedRoleData?.name}</strong> will be permanently deleted. Any companies linked to this template will keep their existing roles unlinked.
                                                </p>
                                              </div>
          )}
                                            </div>
                                            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
                                              <button
                                                type="button"
                                                onClick={() => setIsDeleteOpen(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={handleDeleteSubmit}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-2 shadow-2xs"
                                              >
                                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                Confirm Delete
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
                                  {/* ─────────────────────────────────────────────────────────────────────────── */}
                                  {/* MODAL 5: Deploy to Operating Companies */}
                                  {/* ─────────────────────────────────────────────────────────────────────────── */}
                                  <Modal
                                    isOpen={isApplyOpen}
                                    onClose={() => !isApplying && setIsApplyOpen(false)}
                                    title={`Deploy Role Template: ${selectedRoleData?.name || ''}`}
                                    maxWidth="max-w-2xl"
                                  >
                                    <div className="space-y-5">
                                      <div className="p-3.5 bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-xl flex items-center justify-between text-xs">
                                        <div>
                                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedRoleData?.name}</span>
                                          <span className="text-zinc-500 dark:text-zinc-400 block mt-0.5">
                                            {selectedPerms.size} permissions will be synchronized
                                          </span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                                          {companies.length} Operating Companies
                                        </span>
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
                                          {/* Companies Selection */}
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                                Target Operating Companies ({applySelectedCompanies.length}/{companies.length})
                                              </label>
                                              <button
                                                type="button"
                                                onClick={handleSelectAllCompanies}
                                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                              >
                                                {applySelectedCompanies.length === companies.length ? 'Deselect All' : 'Select All'}
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
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-[#2A2F3D] divide-y divide-zinc-100 dark:divide-[#2A2F3D] p-1 bg-zinc-50/50 dark:bg-[#1D212C]/40 custom-scrollbar">
                                                          {companies.length === 0 ? (
                                                            <div className="p-4 text-center text-xs text-zinc-400 italic">No operating companies registered.</div>
                                                          ) : (
                                                            companies.map((c) => {
                                                              const isChecked = applySelectedCompanies.includes(c.id);
                                                              return (
                                                                <label
                                                                  key={c.id}
                                                                  className="flex items-center justify-between p-2.5 hover:bg-white dark:hover:bg-[#1D212C] rounded-md cursor-pointer transition-colors"
                                                                >
                                                                  {cu.isCustomized ? 'Customized' : 'Standard'}
                                                                </span>
                  </div>
                                                      </div>
              ))}
                                                      <div className="flex items-center gap-2.5">
                                                        <input
                                                          type="checkbox"
                                                          checked={isChecked}
                                                          onChange={() => handleToggleCompany(c.id)}
                                                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                                        />
                                                        <div>
                                                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{c.name || c.displayName}</div>
                                                          <div className="text-[10px] text-zinc-400 font-mono">{c.code || c.id}</div>
                                                        </div>
                                                      </div>
                                                      <span className="text-[10px] text-zinc-400">
                                                        {isChecked ? 'Will Deploy' : 'Skipped'}
                                                      </span>
                                                    </label>
                                                  );
                })
              )}
                                                </div>
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
                                            {/* Overwrite Checkbox */}
                                            <div className="p-3 bg-zinc-50 dark:bg-[#1D212C]/60 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
                                              <label className="flex items-start gap-2.5 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={applyOverwrite}
                                                  onChange={(e) => setApplyOverwrite(e.target.checked)}
                                                  className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                                <div>
                                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                                    Overwrite company-specific permission customizations
                                                  </span>
                                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                                    If unchecked, existing company roles will merge permissions safely. If checked, target company roles will strictly mirror this template. User role assignments are always preserved.
                                                  </p>
                                                </div>
                                              </label>
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
                                      {/* Preview Button & Results */}
                                      <div className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={handlePreviewApply}
                                          disabled={isPreviewing || !applySelectedCompanies.length}
                                          className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] hover:bg-zinc-50 dark:hover:bg-[#222736] text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 transition-colors"
                                        >
                                          {isPreviewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                                          <span>{applyPreview ? 'Refresh Deployment Preview' : 'Preview Differences Before Deploying'}</span>
                                        </button>

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
                                            {applyPreview && (
                                              <div className="p-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs space-y-2">
                                                <div className="flex items-center justify-between font-semibold border-b border-zinc-100 dark:border-[#2A2F3D] pb-1.5">
                                                  <span>Impact Summary</span>
                                                  <div className="flex gap-2 text-[11px]">
                                                    <span className="text-emerald-600 font-bold">{applyPreview.createdCount ?? 0} to create</span>
                                                    <span>•</span>
                                                    <span className="text-blue-600 font-bold">{applyPreview.updatedCount ?? 0} to update</span>
                                                    <span>•</span>
                                                    <span className="text-zinc-400">{applyPreview.skippedCount ?? 0} skipped</span>
                                                  </div>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">
                                                  Deployment is ready. User memberships and assigned credentials will not be altered.
                                                </p>
                                              </div>
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
          {/* Footer Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              disabled={isApplying}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1D212C]"
            >
              {importCompanyRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeploy}
              disabled={isApplying || !applySelectedCompanies.length}
              className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
            >
              {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Deploy to {applySelectedCompanies.length} Companies
            </button>
          </div>
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
                            </Modal>
                          </div>
                          );
}
