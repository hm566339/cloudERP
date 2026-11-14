import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GitFork, Plus, Edit2, Trash2, Play, History, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRBAC } from '../../../utils/rbac';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import PlatformWorkflowTemplateFormModal from '../components/PlatformWorkflowTemplateFormModal';
import PlatformWorkflowRolloutModal from '../components/PlatformWorkflowRolloutModal';
import PlatformWorkflowRolloutLogsModal from '../components/PlatformWorkflowRolloutLogsModal';
import { platformWorkflowTemplatesApi } from '../../../api/account/workflowDefinitions';

const DEFAULT_COLUMNS = [
  'templateCode',
  'templateName',
  'moduleName',
  'documentType',
  'version',
  'stages',
  'adoption',
  'isActive'
];

const getModuleBadge = (moduleName) => {
  switch (moduleName) {
    case 'ACCOUNT':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40';
    case 'SALES':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40';
    case 'PURCHASE':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40';
    case 'INVENTORY':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/40';
    case 'HRMS':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/40';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
};

export default function PlatformWorkflowTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isRolloutOpen, setIsRolloutOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isSuperAdmin } = useRBAC();

  // Super admin check matching ModuleRoutesList convention
  const isSuperAdminGlobal = isSuperAdmin && location.pathname.startsWith('/super-admin');

  const {
    page, setPage, pageSize, setPageSize,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const fetchTemplates = useCallback(async () => {
    if (!isSuperAdminGlobal) return;
    setIsLoading(true);
    try {
      const data = await platformWorkflowTemplatesApi.getList();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to fetch platform templates'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdminGlobal, dispatch]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const handleDelete = (template) => {
    confirmDialog(
      'Delete Platform Template',
      `Are you sure you want to delete template "${template.templateName}" (${template.templateCode})? This action cannot be undone.`,
      async () => {
        try {
          await platformWorkflowTemplatesApi.delete(template.id);
          dispatch(addAlert({ type: 'success', message: 'Platform template deleted successfully' }));
          fetchTemplates();
        } catch (error) {
          dispatch(addAlert({
            type: 'error',
            message: error?.response?.data?.message || error?.message || 'Failed to delete template'
          }));
        }
      }
    );
  };

  const toggleStatus = (template) => {
    const isActivating = !template.isActive;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Template`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} template "${template.templateName}"?`,
      async () => {
        try {
          if (isActivating) {
            await platformWorkflowTemplatesApi.activate(template.id);
          } else {
            await platformWorkflowTemplatesApi.deactivate(template.id);
          }
          dispatch(addAlert({
            type: 'success',
            message: `Template ${isActivating ? 'activated' : 'deactivated'} successfully`
          }));
          fetchTemplates();
        } catch (error) {
          dispatch(addAlert({
            type: 'error',
            message: error?.response?.data?.message || error?.message || 'Status update failed'
          }));
        }
      }
    );
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleRollout = (template) => {
    setSelectedTemplate(template);
    setIsRolloutOpen(true);
  };

  const handleLogs = (template) => {
    setSelectedTemplate(template);
    setIsLogsOpen(true);
  };

  // Filtered & Sorted Data
  const filteredTemplates = useMemo(() => {
    return templates.filter((row) => {
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const code = (row.templateCode || '').toLowerCase();
        const name = (row.templateName || '').toLowerCase();
        const doc = (row.documentType || '').toLowerCase();
        const desc = (row.description || '').toLowerCase();
        if (!code.includes(query) && !name.includes(query) && !doc.includes(query) && !desc.includes(query)) {
          return false;
        }
      }

      if (filters.active !== undefined && filters.active !== '' && filters.active !== 'All') {
        const boolVal = filters.active === 'true';
        if (row.isActive !== boolVal) return false;
      }

      if (filters.moduleName && filters.moduleName !== 'All') {
        if (row.moduleName !== filters.moduleName) return false;
      }

      if (filters.isDefault !== undefined && filters.isDefault !== '' && filters.isDefault !== 'All') {
        const boolVal = filters.isDefault === 'true';
        if (row.isDefault !== boolVal) return false;
      }

      return true;
    });
  }, [templates, filters]);

  // Sort data
  const sortedTemplates = useMemo(() => {
    if (!sortBy) return filteredTemplates;
    return [...filteredTemplates].sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTemplates, sortBy, sortOrder]);

  // Client-side pagination
  const totalElements = sortedTemplates.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedTemplates = useMemo(() => {
    const start = page * pageSize;
    return sortedTemplates.slice(start, start + pageSize);
  }, [sortedTemplates, page, pageSize]);

  // Columns definition
  const columns = useMemo(() => [
    {
      id: 'templateCode',
      label: 'Template Code',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
            {row.templateCode || '-'}
          </span>
          {row.isDefault && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              Default
            </span>
          )}
        </div>
      )
    },
    {
      id: 'templateName',
      label: 'Template Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE] block text-sm">
            {row.templateName || '-'}
          </span>
          {row.description && (
            <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] truncate max-w-[280px] block mt-0.5">
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'moduleName',
      label: 'Module',
      sortable: true,
      render: (val, row) => (
        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${getModuleBadge(row.moduleName)}`}>
          {row.moduleName || '-'}
        </span>
      )
    },
    {
      id: 'documentType',
      label: 'Document Type',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-600 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1f2430] px-2 py-0.5 rounded border border-zinc-200/60 dark:border-[#2A2F3D]">
          {row.documentType || '-'}
        </span>
      )
    },
    {
      id: 'version',
      label: 'Version',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-[#222736] dark:text-[#A0A6B5]">
          v{row.version || 1}
        </span>
      )
    },
    {
      id: 'stages',
      label: 'Stages',
      align: 'center',
      render: (val, row) => (
        <span className="text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
          {row.stages?.length || 0} stages
        </span>
      )
    },
    {
      id: 'adoption',
      label: 'Adoption',
      align: 'center',
      render: (val, row) => (
        <span className="text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
          {row.linkedOrganizationCount ?? 0} orgs
        </span>
      )
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(row);
          }}
          className="hover:opacity-80 transition-opacity"
          title={`Click to ${row.isActive ? 'deactivate' : 'activate'}`}
        >
          <DataTableStatusBadge
            isActive={row.isActive}
            activeText="Active"
            inactiveText="Inactive"
          />
        </button>
      )
    }
  ], []);

  // Basic Filters
  const basicFilters = useMemo(() => [
    {
      id: 'active',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    },
    {
      id: 'moduleName',
      label: 'Module',
      type: 'select',
      options: [
        { label: 'ACCOUNT', value: 'ACCOUNT' },
        { label: 'SALES', value: 'SALES' },
        { label: 'PURCHASE', value: 'PURCHASE' },
        { label: 'INVENTORY', value: 'INVENTORY' },
        { label: 'HRMS', value: 'HRMS' }
      ]
    },
    {
      id: 'isDefault',
      label: 'Default Status',
      type: 'select',
      options: [
        { label: 'Platform Default', value: 'true' },
        { label: 'Non-Default', value: 'false' }
      ]
    }
  ], []);

  // Row Actions
  const rowActions = useMemo(() => [
    {
      label: 'Rollout to Orgs',
      icon: Play,
      onClick: handleRollout
    },
    {
      label: 'Rollout History',
      icon: History,
      onClick: handleLogs
    },
    {
      label: 'Edit Template',
      icon: Edit2,
      onClick: handleEdit
    },
    {
      label: 'Delete Template',
      icon: Trash2,
      onClick: handleDelete,
      danger: true
    }
  ], []);

  if (!isSuperAdminGlobal) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#161922] rounded-2xl shadow-sm border border-zinc-100 dark:border-[#2A2F3D] m-6">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-[#E6E8EE]">Access Denied</h2>
        <p className="text-zinc-500 dark:text-[#A0A6B5] mt-2">You do not have permission to view platform workflow templates.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] dark:bg-transparent">
      <PageHeader
        title="Workflow Templates"
        description="Manage platform-level global default workflow templates and organization rollouts."
      >
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>Create Template</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={paginatedTemplates}
          rowKey="id"
          loading={isLoading}

          // Search
          searchable
          searchValue={filters.search || ''}
          searchPlaceholder="Search templates by code, name, document type..."
          onSearchChange={(val) => {
            setFilter('search', val);
            setPage(0);
          }}

          // Column Visibility
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}

          // Basic Filters
          filters={basicFilters}
          filterValues={{
            active: filters.active || 'All',
            moduleName: filters.moduleName || 'All',
            isDefault: filters.isDefault || 'All'
          }}
          onFilterChange={(key, val) => {
            if (val === 'All' || val === '') {
              setFilter(key, undefined);
            } else {
              setFilter(key, val);
            }
            setPage(0);
          }}

          // Reset
          onReset={handleReset}

          // Row Actions
          rowActions={rowActions}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Pagination
          pagination={{
            page,
            pageSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          itemName="templates"

          emptyMessage="No platform workflow templates found"
          emptyDescription="Create a platform default workflow template to begin automated rollout to organizations."
        />
      </div>

      {/* Form Modal (Create / Edit) */}
      {isFormOpen && (
        <PlatformWorkflowTemplateFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedTemplate}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchTemplates();
          }}
        />
      )}

      {/* Rollout Modal */}
      {isRolloutOpen && selectedTemplate && (
        <PlatformWorkflowRolloutModal
          isOpen={isRolloutOpen}
          onClose={() => setIsRolloutOpen(false)}
          template={selectedTemplate}
          onSuccess={() => {
            fetchTemplates();
          }}
        />
      )}

      {/* Rollout Logs Modal */}
      {isLogsOpen && selectedTemplate && (
        <PlatformWorkflowRolloutLogsModal
          isOpen={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          template={selectedTemplate}
        />
      )}
    </div>
  );
}
