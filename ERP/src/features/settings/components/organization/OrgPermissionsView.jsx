import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Key,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Shield,
  Layers,
  Lock,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import {
  getOrgPermissionCatalog,
  getOrgRoleTemplates,
} from '../../../../api/sso/roleTemplate.api';
import apiClient from '../../../../api/common/client';
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import Modal from '../../../../components/common/Modal';
import ExportModal from '../../../../components/common/ExportModal';
import { confirmDialog } from '../../../../utils/confirmDialog';

const DEFAULT_COLUMNS = [
  'permissionName',
  'permissionCode',
  'module',
  'permissionType',
  'description',
  'status',
];

export default function OrgPermissionsView({ organization }) {
  const dispatch = useAppDispatch();

  // State
  const [catalog, setCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('permissionCode');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formModule, setFormModule] = useState('ACCOUNTS');
  const [formAction, setFormAction] = useState('READ');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom added permissions stored locally in memory if API is catalog-based
  const [customPermissions, setCustomPermissions] = useState([]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const catRes = await getOrgPermissionCatalog();
      setCatalog(catRes || null);
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.response?.data?.message || 'Failed to load permission catalog',
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

            // Flattened permission list
            const allPermissions = useMemo(() => {
              const list = [];
              if (catalog?.modules) {
                catalog.modules.forEach((mod) => {
                  mod.features?.forEach((feat) => {
                    feat.permissions?.forEach((perm) => {
                      const code = perm.permissionCode.toUpperCase();
                      list.push({
                        id: perm.id || code,
                        permissionName: feat.featureName || feat.featureCode,
                        permissionCode: code,
                        module: mod.displayName || mod.moduleName,
                        featureName: feat.featureName || feat.featureCode,
                        permissionType: (perm.action || 'READ').toUpperCase(),
                        description: perm.description || `${perm.action} access for ${feat.featureName || feat.featureCode}`,
                        status: true,
                        isSystem: true,
                      });
                    });
                  });
                });
              }

              // Merge custom created permissions
              customPermissions.forEach((cp) => {
                list.push(cp);
              });

                return list;
              }, [catalog, customPermissions]);

              // Available Modules for Filter
              const availableModules = useMemo(() => {
                const set = new Set();
                allPermissions.forEach((p) => {
                  if (p.module) set.add(p.module);
                });
              return Array.from(set);
            }, [allPermissions]);

            // Filtered & Sorted Permissions
            const filteredPermissions = useMemo(() => {
              return allPermissions
                .filter((p) => {
                  if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    const matchesName = p.permissionName.toLowerCase().includes(term);
                    const matchesCode = p.permissionCode.toLowerCase().includes(term);
                    const matchesDesc = (p.description || '').toLowerCase().includes(term);
                    if (!matchesName && !matchesCode && !matchesDesc) return false;
                  }

                    if (statusFilter === 'Active' && !p.status) return false;
                    if (statusFilter === 'Inactive' && p.status) return false;

                    if (moduleFilter !== 'All' && p.module !== moduleFilter) return false;
                    if (typeFilter !== 'All' && p.permissionType !== typeFilter) return false;

                    return true;
                  })
                .sort((a, b) => {
                  let valA = a[sortBy] ?? '';
                  let valB = b[sortBy] ?? '';
                  if (typeof valA === 'string') valA = valA.toLowerCase();
                  if (typeof valB === 'string') valB = valB.toLowerCase();
                  if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                  if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                  return 0;
                });
            }, [allPermissions, searchTerm, statusFilter, moduleFilter, typeFilter, sortBy, sortOrder]);

  const totalElements = filteredPermissions.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedPermissions = useMemo(() => {
    const start = page * pageSize;
    return filteredPermissions.slice(start, start + pageSize);
  }, [filteredPermissions, page, pageSize]);

  // Open Create
  const handleOpenCreate = () => {
    setFormName('');
    setFormCode('');
    setFormModule(availableModules[0] || 'Finance & Accounts');
    setFormAction('READ');
    setFormDescription('');
    setIsCreateOpen(true);
  };

    // Open Edit
    const handleOpenEdit = (perm) => {
      setEditingPermission(perm);
      setFormName(perm.permissionName);
      setFormCode(perm.permissionCode);
      setFormModule(perm.module);
      setFormAction(perm.permissionType);
      setFormDescription(perm.description || '');
      setIsEditOpen(true);
    };

    // Create Submit
    const handleCreateSubmit = (e) => {
      e.preventDefault();
      if (!formCode.trim()) {
        dispatch(addAlert({ type: 'warning', message: 'Permission code is required' }));
        return;
      }

      const code = formCode.trim().toUpperCase();
      const newPerm = {
        id: `custom-${Date.now()}`,
        permissionName: formName.trim() || formModule,
        permissionCode: code,
        module: formModule,
        permissionType: formAction,
        description: formDescription.trim(),
        status: true,
        isSystem: false,
      };

      setCustomPermissions((prev) => [newPerm, ...prev]);
      dispatch(addAlert({ type: 'success', message: 'Permission created successfully' }));
      setIsCreateOpen(false);
    };

        // Edit Submit
        const handleEditSubmit = (e) => {
          e.preventDefault();
          if (!formCode.trim()) {
            dispatch(addAlert({ type: 'warning', message: 'Permission code is required' }));
            return;
          }

          setCustomPermissions((prev) =>
            prev.map((p) =>
              p.id === editingPermission.id
                ? {
                  ...p,
                  permissionName: formName.trim(),
                  permissionCode: formCode.trim().toUpperCase(),
                  module: formModule,
                  permissionType: formAction,
                  description: formDescription.trim(),
                }
                : p
            )
          );

          dispatch(addAlert({ type: 'success', message: 'Permission updated successfully' }));
          setIsEditOpen(false);
        };

              // Delete
              const handleDelete = (perm) => {
                confirmDialog(
                  'Delete Permission',
                  `Are you sure you want to delete permission "${perm.permissionCode}"?`,
                  () => {
                    setCustomPermissions((prev) => prev.filter((p) => p.id !== perm.id));
                    dispatch(addAlert({ type: 'success', message: 'Permission deleted successfully' }));
                  }
    );
};

  // Columns definition
  const columns = useMemo(() => [
        {
          id: 'permissionName',
        label: 'Permission Name',
        sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Key size={15} className="text-zinc-500 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.permissionName}</span>
        </div>
            ),
    },
            {
              id: 'permissionCode',
            label: 'Permission Code',
            sortable: true,
      render: (val, row) => (
            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded font-medium">
              {row.permissionCode}
            </span>
            ),
    },
            {
              id: 'module',
            label: 'Module',
            sortable: true,
      render: (val, row) => (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              <Layers size={11} className="text-zinc-500" />
              <span>{row.module}</span>
            </span>
            ),
    },
            {
              id: 'permissionType',
            label: 'Permission Type',
            sortable: true,
      render: (val, row) => {
        const actionColors = {
              READ: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40',
            CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
            UPDATE: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
            DELETE: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
            APPROVE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40',
            EXPORT: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/40',
        };
            const colorCls = actionColors[row.permissionType] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
            return (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colorCls}`}>
              {row.permissionType}
            </span>
        );
      },
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
          id: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} />,
    },
        ], []);

  // Basic Filters
  const basicFilters = useMemo(() => [
        {
          id: 'status',
        label: 'Status',
        type: 'select',
        value: statusFilter,
        options: [
        {label: 'All Statuses', value: 'All' },
        {label: 'Active', value: 'Active' },
        {label: 'Inactive', value: 'Inactive' },
        ],
    },
        {
          id: 'module',
        label: 'Module',
        type: 'select',
        value: moduleFilter,
        options: [
        {label: 'All Modules', value: 'All' },
        ...availableModules.map((m) => ({label: m, value: m })),
        ],
    },
        {
          id: 'type',
        label: 'Action Type',
        type: 'select',
        value: typeFilter,
        options: [
        {label: 'All Action Types', value: 'All' },
        {label: 'READ', value: 'READ' },
        {label: 'CREATE', value: 'CREATE' },
        {label: 'UPDATE', value: 'UPDATE' },
        {label: 'DELETE', value: 'DELETE' },
        {label: 'APPROVE', value: 'APPROVE' },
        {label: 'EXPORT', value: 'EXPORT' },
        ],
    },
        ], [statusFilter, moduleFilter, typeFilter, availableModules]);

  // Row Actions
  const rowActions = useMemo(() => [
        {
          key: 'view',
        label: 'View Details',
        icon: Eye,
      onClick: (row) => setExpandedRowId((prev) => (prev === row.id ? null : row.id)),
        tooltip: 'View Permission Details',
        className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    },
        {
          key: 'edit',
        label: 'Edit',
        icon: Edit2,
      onClick: (row) => handleOpenEdit(row),
        tooltip: 'Edit Permission',
        className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    },
        {
          key: 'delete',
        label: 'Delete',
        icon: Trash2,
        danger: true,
      disabled: (row) => row.isSystem,
      onClick: (row) => handleDelete(row),
        tooltip: 'Delete Permission',
    },
        ], []);

  // Expanded sub-row
  const renderExpandedRow = (perm) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2 text-xs">
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Feature Code</span>
            <p className="font-mono text-zinc-800 dark:text-zinc-200">{perm.featureName || '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Action</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{perm.permissionType}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">System Permission</span>
            <p className="text-zinc-800 dark:text-zinc-200">{perm.isSystem ? 'Yes (Core Engine)' : 'No (Custom)'}</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Full Description</span>
            <p className="text-zinc-700 dark:text-zinc-300">{perm.description || '-'}</p>
          </div>
        </div>
        );

  const handleResetFilters = () => {
              setSearchTerm('');
            setStatusFilter('All');
            setModuleFilter('All');
            setTypeFilter('All');
            setPage(0);
            setSelectedRows([]);
  };

          return (
          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
            <PageHeader
              title="Permission Management"
              description="Central matrix of module, feature, and action access rights"
            >
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Create Permission</span>
              </button>
            </PageHeader>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <DataTable
              permissionFeature="ROLE_PERMISSIONS"
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              columns={columns}
              data={paginatedPermissions}
              rowKey="id"
              loading={isLoading}

          // Search
                              searchable
                              searchValue={searchTerm}
                              searchPlaceholder="Name, Code, Module..."
                              onSearchChange={(val) => {
                                setSearchTerm(val);
                                setPage(0);
                              }}

          // Filters
                              filters={basicFilters}
                              filterValues={{ status: statusFilter, module: moduleFilter, type: typeFilter }}
                              onFilterChange={(key, val) => {
                                if (key === 'status') setStatusFilter(val);
                                if (key === 'module') setModuleFilter(val);
                                if (key === 'type') setTypeFilter(val);
                                setPage(0);
                              }}

                                // Reset & Refresh & Export
                                onReset = { handleResetFilters }
                                onRefresh = { loadData }
                                onExport = {() => setIsExportModalOpen(true)}

              // Columns
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}

                    // Sorting
                    sort = {{ key: sortBy, direction: sortOrder }}
                  onSortChange={({ key }) => {
                    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy(key); setSortOrder('asc'); }
                    setPage(0);
                  }}

          // Row Actions & Expansion
                    rowActions={rowActions}
                    expandedRowId={expandedRowId}
                    onToggleExpand={(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
                    renderExpandedRow={renderExpandedRow}

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
                          itemName="permissions"

                              // Empty State matching Customer Management
                              emptyMessage = "No permissions found"
                              emptyDescription = "Try adjusting your search keywords or filter criteria to find permission records."
                                />
      </div>

                            {/* Create / Edit Permission Modal */}
                            <Modal
                              isOpen={isCreateOpen || isEditOpen}
                              onClose={() => {
                                setIsCreateOpen(false);
                                setIsEditOpen(false);
                              }}
                              title={isEditOpen ? 'Edit Permission' : 'Create Permission'}
                              size="md"
                            >
                              <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                    Permission Name <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Invoices Management"
                                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                    Permission Code <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    placeholder="e.g. INVOICE:EXPORT"
                                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Module
                          </label>
                          <select
                            value={formModule}
                            onChange={(e) => setFormModule(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                                {availableModules.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
            </div>

                          <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                Action Type
                              </label>
                              <select
                                value={formAction}
                                onChange={(e) => setFormAction(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="READ">READ</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="APPROVE">APPROVE</option>
                                <option value="EXPORT">EXPORT</option>
                              </select>
                          </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Action rights and scope..."
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateOpen(false);
                          setIsEditOpen(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        Save Permission
                      </button>
                    </div>
                  </form>
                </Modal>

      {/* Export Modal */}
      <ExportModal
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              reportName="permissions-catalog-export"
              hideDateRange={true}
              selectedIds={selectedRows}
              selectedCount={selectedRows.length}
            />
          </div>
          );
}
