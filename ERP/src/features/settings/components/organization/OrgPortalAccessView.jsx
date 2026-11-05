import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  Layers,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Power,
  RefreshCw,
  Building2,
  Briefcase,
  Boxes,
  Shield,
  Key,
  Users,
  Settings,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import PortalAccessList from '../../../portal-access/pages/PortalAccessList';
import Modal from '../../../../components/common/Modal';
import ExportModal from '../../../../components/common/ExportModal';
import {
  getCompanyModulesByCompany,
  updateCompanyModuleStatus,
} from '../../../../api/sso/companyModules';
import { confirmDialog } from '../../../../utils/confirmDialog';

const DEFAULT_MODULE_COLUMNS = [
  'moduleName',
  'description',
  'portalAccess',
  'assignedRoles',
  'accessStatus',
];

export default function OrgPortalAccessView({ organization, companies = [] }) {
  const dispatch = useAppDispatch();

  // Company Selection
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return companies.length > 0 ? companies[0].id : '';
  });

  useEffect(() => {
    if (companies.length > 0) {
      const exists = companies.some((c) => c.id === selectedCompanyId);
      if (!exists) setSelectedCompanyId(companies[0].id);
    } else {
      setSelectedCompanyId('');
    }
  }, [companies, selectedCompanyId]);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // View state: 'modules' or 'user-access'
  const [viewMode, setViewMode] = useState('modules'); // 'modules' or 'user-access'

  // Modules Data state
  const [companyModules, setCompanyModules] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_MODULE_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

      // Filters & Sorting for Modules Table
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('All');
      const [page, setPage] = useState(0);
      const [pageSize, setPageSize] = useState(10);
      const [sortBy, setSortBy] = useState('name');
      const [sortOrder, setSortOrder] = useState('asc');

      // Modal State for Configure Module / Assign Permissions
      const [isConfigureOpen, setIsConfigureOpen] = useState(false);
      const [selectedModuleForConfig, setSelectedModuleForConfig] = useState(null);
      const [configPortalAccess, setConfigPortalAccess] = useState(true);
      const [configRoles, setConfigRoles] = useState(['Admin', 'Manager']);
      const [isSavingConfig, setIsSavingConfig] = useState(false);

      // Load modules
      const loadModules = useCallback(async (cId) => {
        if (!cId) {
          setCompanyModules([]);
          return;
        }
        setIsLoadingModules(true);
        try {
          const res = await getCompanyModulesByCompany(cId);
          const list = res?.companyModuleResponse || res?.data || res?.content || (Array.isArray(res) ? res : []);
          setCompanyModules(list);
        } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: 'Failed to load company module entitlements',
            })
          );
        } finally {
          setIsLoadingModules(false);
        }
      }, [dispatch]);

      useEffect(() => {
        if (selectedCompanyId) {
          loadModules(selectedCompanyId);
        }
    }, [selectedCompanyId, loadModules]);

    // Standard Normalized Modules List
    const normalizedModules = useMemo(() => {
      return companyModules.map((m) => {
        const id = m.id || m.companyModuleId || m.moduleId;
        const name = m.moduleName || m.name || m.canonicalName || 'Module';
        const active = Boolean(m.active ?? m.isActive ?? true);
        const description = m.description || `Enterprise ${name} operational capabilities and workflows.`;
        const portalAccess = active ? 'Enabled' : 'Disabled';
        const assignedRoles = m.assignedRolesCount || (active ? '4 Roles' : 'None');

        return {
          id,
          moduleId: id,
          moduleName: name,
          description,
          portalAccess,
          assignedRoles,
          accessStatus: active,
          active,
          raw: m,
        };
      });
    }, [companyModules]);

    // Filtered & Sorted Modules
    const filteredModules = useMemo(() => {
      return normalizedModules
        .filter((m) => {
          if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            if (!m.moduleName.toLowerCase().includes(term) && !m.description.toLowerCase().includes(term)) {
              return false;
            }
          }
          if (statusFilter === 'Active' && !m.active) return false;
          if (statusFilter === 'Inactive' && m.active) return false;
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
    }, [normalizedModules, searchTerm, statusFilter, sortBy, sortOrder]);

    const totalElements = filteredModules.length;
    const totalPages = Math.ceil(totalElements / pageSize) || 1;
    const paginatedModules = useMemo(() => {
      const start = page * pageSize;
      return filteredModules.slice(start, start + pageSize);
    }, [filteredModules, page, pageSize]);

    // Handlers
    const handleToggleModule = (mod) => {
      const newStatus = !mod.active;
      confirmDialog(
        `${newStatus ? 'Enable' : 'Disable'} Module`,
        `Are you sure you want to ${newStatus ? 'enable' : 'disable'} ${mod.moduleName} for ${selectedCompany?.name}?`,
        async () => {
          try {
            await updateCompanyModuleStatus(mod.id, newStatus);
            dispatch(
              addAlert({
                type: 'success',
                message: `Module "${mod.moduleName}" ${newStatus ? 'enabled' : 'disabled'} successfully`,
              })
            );
            loadModules(selectedCompanyId);
          } catch (err) {
            dispatch(
              addAlert({
                type: 'error',
                message: err?.response?.data?.message || 'Failed to update module status',
              })
            );
          }
        }
      );
    };

    const handleOpenConfigure = (mod) => {
      setSelectedModuleForConfig(mod);
      setConfigPortalAccess(mod.active);
      setIsConfigureOpen(true);
    };

    const handleSaveConfig = async (e) => {
      e.preventDefault();
      setIsSavingConfig(true);
      try {
        await updateCompanyModuleStatus(selectedModuleForConfig.id, configPortalAccess);
        dispatch(
          addAlert({
            type: 'success',
            message: `Module settings for "${selectedModuleForConfig.moduleName}" saved successfully`,
          })
        );
        setIsConfigureOpen(false);
        loadModules(selectedCompanyId);
      } catch (err) {
        dispatch(
          addAlert({
            type: 'error',
            message: err?.response?.data?.message || 'Failed to save module settings',
          })
        );
      } finally {
        setIsSavingConfig(false);
      }
    };

    // Columns definition matching Customer Management
    const columns = useMemo(() => [
      {
        id: 'moduleName',
        label: 'Module Name',
        sortable: true,
        render: (val, row) => (
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Boxes size={16} />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.moduleName}</span>
          </div>
        ),
      },
      {
        id: 'description',
        label: 'Description',
        sortable: false,
        render: (val, row) => (
          <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-sm block">
            {row.description}
          </span>
        ),
      },
      {
        id: 'portalAccess',
        label: 'Portal Access',
        sortable: true,
        render: (val, row) => (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${row.active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
              }`}
          >
            <Globe size={11} />
            <span>{row.portalAccess}</span>
          </span>
        ),
      },
      {
        id: 'assignedRoles',
        label: 'Assigned Roles',
        sortable: false,
        render: (val, row) => (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <Shield size={11} className="text-zinc-500" />
            <span>{row.assignedRoles}</span>
          </span>
        ),
      },
      {
        id: 'accessStatus',
        label: 'Access Status',
        sortable: true,
        align: 'center',
        render: (val, row) => <DataTableStatusBadge status={row.active} />,
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
          { label: 'All Statuses', value: 'All' },
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ],
      },
    ], [statusFilter]);

    // Row Actions
    const rowActions = useMemo(() => [
      {
        key: 'view',
        label: 'View Details',
        icon: Eye,
        onClick: (row) => setExpandedRowId((prev) => (prev === row.id ? null : row.id)),
        tooltip: 'View Details',
        className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
      },
      {
        key: 'configure',
        label: 'Configure Module',
        icon: Edit2,
        onClick: (row) => handleOpenConfigure(row),
        tooltip: 'Configure Module & Permissions',
        className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
      },
      {
        key: 'toggle-status',
        label: (row) => (row.active ? 'Disable' : 'Enable'),
        icon: (row) => (row.active ? AlertCircle : CheckCircle),
        onClick: (row) => handleToggleModule(row),
        tooltip: (row) => (row.active ? 'Disable Module' : 'Enable Module'),
        className: (row) =>
          row.active
            ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      },
    ], [selectedCompany]);

    // Sub-row expanded drawer
    const renderExpandedRow = (mod) => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2 text-xs">
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Operating Company</span>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedCompany?.name || 'Company'}</p>
        </div>
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Portal Access URL</span>
          <p className="font-mono text-zinc-700 dark:text-zinc-300">/company/{selectedCompanyId}/{mod.moduleName.toLowerCase()}</p>
        </div>
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Access Mode</span>
          <p className="text-zinc-800 dark:text-zinc-200">{mod.active ? 'Full Access Allowed' : 'Module Suspended'}</p>
        </div>
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Assigned Privilege Groups</span>
          <p className="text-zinc-700 dark:text-zinc-300">Admin, Manager, Accountant, Operator</p>
        </div>
      </div>
    );

    const handleResetFilters = () => {
      setSearchTerm('');
      setStatusFilter('All');
      setPage(0);
      setSelectedRows([]);
    };

    return (
              <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
                <PageHeader
                  title="Portal & Module Access"
                  description="Manage company module entitlements, assigned roles, and user portal permissions"
                >
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle Button */}
                    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('modules')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'modules'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                          }`}
                      >
                        Company Modules
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('user-access')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'user-access'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                          }`}
                      >
                        User Portal Access
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenConfigure(paginatedModules[0] || { moduleName: 'Global Portal' })}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={16} />
                      <span>Configure Access</span>
                    </button>
                  </div>
            </PageHeader>

                      {/* Main Content Area */}
                      <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
                        {/* Company Selection Toolbar matching Customer Management */}
                        {companies.length > 0 && (
                          <div className="bg-white dark:bg-[#161922] p-3 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-zinc-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                Operating Company:
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {companies.map((comp) => {
                                const isSelected = comp.id === selectedCompanyId;
                                return (
                                  <button
                                    key={comp.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCompanyId(comp.id);
                                      setPage(0);
                                    }}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isSelected
                                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                      }`}
                                  >
                    <Briefcase size={13} />
                    <span>{comp.name || comp.legalName}</span>
                    {comp.code && (
                                      <span className="font-mono text-[10px] opacity-75">({comp.code})</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                            {/* View Mode Switching: Company Modules Table vs User Portal Access */}
                            {viewMode === 'modules' ? (
                              <div className="flex-1 overflow-hidden flex flex-col">
                                <DataTable
                                  permissionFeature="MODULE_MANAGEMENT"
                                  selectable
                                  selectedRows={selectedRows}
                                  onSelectionChange={setSelectedRows}
                                  columns={columns}
                                  data={paginatedModules}
                                  rowKey="id"
                                  loading={isLoadingModules}

              // Search
              searchable
                            searchValue={searchTerm}
                            searchPlaceholder="Module Name, Description..."
                            onSearchChange={(val) => {
                              setSearchTerm(val);
                              setPage(0);
                            }}

                                  // Filters
                                  filters = { basicFilters }
                                  filterValues = {{ status: statusFilter }
                                }
              onFilterChange = {(key, val) => {
                if (key === 'status') setStatusFilter(val);
                                setPage(0);
              }}

              // Reset & Refresh & Export
                                  onReset={handleResetFilters}
                                  onRefresh={() => loadModules(selectedCompanyId)}
                                  onExport={() => setIsExportModalOpen(true)}

              // Columns
                            visibleColumns={visibleColumns}
                            onVisibleColumnsChange={setVisibleColumns}

              // Sorting
                            sort={{ key: sortBy, direction: sortOrder }}
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
                            itemName="modules"

                            // Empty State matching Customer Management
                            emptyMessage="No modules found"
                            emptyDescription="Try adjusting your search keywords or filter criteria to find company module records."
            />
                          </div>
                            ) : (
                            <div className="flex-1 overflow-hidden flex flex-col">
                              <PortalAccessList companyId={selectedCompanyId} />
                            </div>
        )}
                        </div>

                        {/* Configure Module Modal */}
                        <Modal
                          isOpen={isConfigureOpen}
                          onClose={() => setIsConfigureOpen(false)}
                          title={`Configure Module: ${selectedModuleForConfig?.moduleName || 'Module Access'}`}
                          size="md"
                        >
                          <form onSubmit={handleSaveConfig} className="space-y-4">
                            <div>
                              <label className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={configPortalAccess}
                                  onChange={(e) => setConfigPortalAccess(e.target.checked)}
                                  className="rounded border-zinc-300 text-primary focus:ring-primary/20"
                                />
                                <span>Enable Portal Access for this Operating Company</span>
                              </label>
                              <p className="text-[11px] text-zinc-500 mt-1 pl-5">
                                Allows authorized users in {selectedCompany?.name || 'this company'} to navigate and interact with this module.
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                Authorized Role Assignments
                              </label>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {['Admin', 'Manager', 'Accountant', 'Operator', 'Viewer'].map((r) => {
                                  const isChecked = configRoles.includes(r);
                                  return (
                                    <label
                                      key={r}
                                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${isChecked
                                          ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-400 font-semibold text-zinc-900 dark:text-zinc-100'
                                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) setConfigRoles([...configRoles, r]);
                                          else setConfigRoles(configRoles.filter((item) => item !== r));
                                        }}
                                        className="rounded border-zinc-300 text-primary"
                                      />
                                      <span>{r}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                              <button
                                type="button"
                                onClick={() => setIsConfigureOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingConfig}
                                className="btn-primary"
                              >
                                {isSavingConfig ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </form>
                        </Modal>

                        {/* Export Modal */}
                        <ExportModal
                          isOpen={isExportModalOpen}
                          onClose={() => setIsExportModalOpen(false)}
                          reportName="portal-access-export"
                          hideDateRange={true}
                          selectedIds={selectedRows}
                          selectedCount={selectedRows.length}
                        />
                      </div>
                      );
}
