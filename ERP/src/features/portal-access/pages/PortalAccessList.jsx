import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Plus, CheckCircle2, Trash2, Layers, Server, Eye } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { getPortalAccess } from '../../../api/sso/portalAccess';
import { getUsers, grantPortalAccess, removePortalAccess, togglePortalAccess } from '../../../api/sso/user';
import { getCompanyModulesByCompany } from '../../../api/sso/companyModules';
import { confirmDialog } from "../../../utils/confirmDialog";
import { useRBAC } from "../../../utils/rbac";

import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { userTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import CustomSelect from '../../../components/common/CustomSelect';
import ExportModal from '../../../components/common/ExportModal';

export default function PortalAccessList() {
  const dispatch = useAppDispatch();
  const { canEdit, canCreate } = useRBAC();
  const params = useParams();
  const reduxCompany = useAppSelector((state) => state.company.selectedCompany);
  const storageCompany = JSON.parse(localStorage.getItem("selected_company") || "null");
  const authUser = JSON.parse(localStorage.getItem("auth_user") || "null");
  
  const activeCompanyId = params.companyId || reduxCompany?.id || storageCompany?.id || authUser?.companyId;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(['username', 'moduleName', 'createdAt', 'updatedAt', 'status']);

  const [rawData, setRawData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  // State for Assign Portal Modal
  const [usersList, setUsersList] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const statusParam = statusFilter === "All" ? undefined : statusFilter === "Active";

  const fetchPortalAccess = useCallback(async () => {
    if (!activeCompanyId) return;
    setIsFetching(true);
    setIsError(false);
    try {
      const queryParams = {
        page: page + 1,
        pageSize: pageSize,
        sort: `${sortBy}-${sortOrder}`,
        search: searchTerm || undefined,
        status: statusParam
      };
      const data = await getPortalAccess(activeCompanyId, queryParams);
      setRawData(data?.data || data);
    } catch (err) {
      console.error("Failed to fetch portal access", err);
      setIsError(true);
      dispatch(addAlert({ type: 'error', message: 'Failed to fetch feature access records.' }));
    } finally {
      setIsFetching(false);
    }
  }, [activeCompanyId, page, pageSize, sortBy, sortOrder, searchTerm, statusParam, dispatch]);

  useEffect(() => {
    fetchPortalAccess();
  }, [fetchPortalAccess]);

  useEffect(() => {
    if (activeCompanyId) {
      getCompanyModulesByCompany(activeCompanyId)
        .then((mRes) => {
          const modulesArray = mRes?.companyModuleResponse || mRes?.data || mRes?.content || (Array.isArray(mRes) ? mRes : []);
          setModulesList(modulesArray);
        })
        .catch((err) => console.error("Failed to fetch modules list", err));
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (showAssignModal && activeCompanyId) {
      setIsModalLoading(true);
      Promise.all([
        getUsers(activeCompanyId, { page: 0, pageSize: 100 }),
        getCompanyModulesByCompany(activeCompanyId)
      ]).then(([uRes, mRes]) => {
        const usersArray = Array.isArray(uRes) ? uRes : (uRes?.users || uRes?.content || []);
        const modulesArray = mRes?.companyModuleResponse || mRes?.data || mRes?.content || (Array.isArray(mRes) ? mRes : []);
        setUsersList(usersArray);
        setModulesList(modulesArray);
      }).catch(err => {
        console.error("Failed to load modal data", err);
      }).finally(() => {
        setIsModalLoading(false);
      });
    }
  }, [showAssignModal, activeCompanyId]);

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setModuleFilter('All');
    setSelectedRows([]);
    setExpandedRowId(null);
    setPage(0);
  };

  const handleColumnSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const rawPortals = Array.isArray(rawData) ? rawData : (rawData?.portalAccesses || []);
  
  // Client-side module filtering if backend doesn't filter by module
  const filteredPortals = useMemo(() => {
    if (moduleFilter === 'All') return rawPortals;
    return rawPortals.filter(p => (p.moduleName || p.module?.name) === moduleFilter);
  }, [rawPortals, moduleFilter]);

  const _pageInfo = rawData?._pageInfo || rawData?.pagination || null;
  const totalElements = _pageInfo?.totalCount || _pageInfo?.totalElements || filteredPortals.length || 0;
  const totalPages = _pageInfo?.totalPages || Math.ceil(totalElements / pageSize) || 1;

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleToggleRowStatus = async (e, portal) => {
    if (e?.stopPropagation) e.stopPropagation();
    const userId = portal.userId || portal.user?.id || portal.id;
    const moduleId = portal.moduleId || portal.module?.id || portal.companyModuleId;
    try {
      await togglePortalAccess(userId, moduleId || portal.id);
      dispatch(addAlert({ type: 'success', message: 'Feature access status updated successfully' }));
      fetchPortalAccess();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to toggle feature access status' }));
    }
  };

  const handleRevokeRowAccess = async (e, portal) => {
    if (e?.stopPropagation) e.stopPropagation();
    const userId = portal.userId || portal.user?.id || portal.id;
    const moduleId = portal.moduleId || portal.module?.id || portal.companyModuleId;
    if (await confirmDialog({ message: `Are you sure you want to revoke feature access for ${portal.username || 'this user'}?` })) {
      try {
        await removePortalAccess(userId, moduleId || portal.id);
        dispatch(addAlert({ type: 'success', message: 'Feature access revoked successfully' }));
        fetchPortalAccess();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to revoke feature access' }));
      }
    }
  };

  const handleGrantAccessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a user' }));
      return;
    }
    if (!selectedModuleId) {
      dispatch(addAlert({ type: 'warning', message: 'Please select a module' }));
      return;
    }

    setIsAssigning(true);
    try {
      await grantPortalAccess(selectedUserId, selectedModuleId);
      dispatch(addAlert({ type: 'success', message: 'Feature access granted successfully' }));
      setShowAssignModal(false);
      setSelectedUserId('');
      setSelectedModuleId('');
      fetchPortalAccess();
    } catch (err) {
      console.error(err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to grant feature access' }));
    } finally {
      setIsAssigning(false);
    }
  };

  const columns = useMemo(() => [
    {
      id: 'username',
      label: 'User / Username',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
            row.status
              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
          }`}>
            {row.username?.charAt(0)?.toUpperCase() || <Users size={14} />}
          </div>
          <div>
            <div className="font-semibold text-zinc-900 text-xs">{row.username || '—'}</div>
            <div className="text-[10px] text-zinc-400 font-mono truncate w-32">{row.userId || row.id || '—'}</div>
          </div>
        </div>
      )
    },
    {
      id: 'moduleName',
      label: 'Module / Host',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Layers size={13} className="text-indigo-500" />
            <span className="text-xs font-semibold text-zinc-800">{row.moduleName || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server size={12} className="text-zinc-400" />
            <span className="text-[10px] text-zinc-500 font-mono">{row.host || '—'}</span>
          </div>
        </div>
      )
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (val, row) => <span className="text-xs text-zinc-600 font-medium">{formatDateShort(row.createdAt)}</span>
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (val, row) => <span className="text-xs text-zinc-600 font-medium">{formatDateShort(row.updatedAt)}</span>
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      render: (val, row) => (
        <DataTableStatusBadge status={row.status ? 'ACTIVE' : 'INACTIVE'} />
      )
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => setExpandedRowId(expandedRowId === row.id ? null : row.id),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    ...(canEdit() ? [
      {
        key: 'toggle-status',
        label: 'Toggle Status',
        icon: CheckCircle2,
        onClick: (row, e) => handleToggleRowStatus(e, row),
        tooltip: 'Toggle Status',
        className: 'hover:text-emerald-600 hover:bg-emerald-50'
      },
      {
        key: 'revoke-access',
        label: 'Revoke Access',
        icon: Trash2,
        danger: true,
        onClick: (row, e) => handleRevokeRowAccess(e, row),
        tooltip: 'Revoke Access'
      }
    ] : [])
  ], [canEdit, expandedRowId]);

  const uniqueModules = useMemo(() => {
    const names = new Set();
    modulesList.forEach(m => {
      const name = m.name || m.label || m.module?.name || m.moduleName;
      if (name) names.add(name);
    });
    rawPortals.forEach(p => {
      if (p.moduleName) names.add(p.moduleName);
    });
    return Array.from(names).sort();
  }, [modulesList, rawPortals]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
      ]
    },
    {
      id: 'module',
      label: 'Module',
      type: 'select',
      options: [
        { label: 'All Modules', value: 'All' },
        ...uniqueModules.map(m => ({ label: m, value: m }))
      ]
    }
  ], [uniqueModules]);

  const renderExpandedRow = (portal) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2 bg-zinc-50/50 rounded-lg">
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">User / Username</span>
          <p className="text-sm font-semibold text-zinc-900">{portal.username || '—'}</p>
          <span className="text-[10px] text-zinc-400 font-mono">{portal.userId || portal.id || '—'}</span>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Module / Feature Host</span>
          <p className="text-sm font-semibold text-zinc-900">{portal.moduleName || '—'}</p>
          <span className="text-[10px] text-zinc-500 font-mono">{portal.host || '—'}</span>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Access Status</span>
          <div>
            <DataTableStatusBadge status={portal.status ? 'ACTIVE' : 'INACTIVE'} />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Granted Date</span>
          <p className="text-sm font-medium text-zinc-700">{formatDateShort(portal.createdAt)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="Feature Management"
        description="Manage company features and user portal access."
      >
        {canEdit() && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Assign Portal Access</span>
          </button>
        )}
      </PageHeader>
      
      <ModuleTabs tabs={userTabs} activeKey="portal-access" />

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          showIndex
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={filteredPortals}
          rowKey="id"
          loading={isFetching}
          
          // Search
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Search by username, module, or feature..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}

          // Basic Filters
          filters={basicFilters}
          filterValues={{ status: statusFilter, module: moduleFilter }}
          onFilterChange={(key, val) => {
            if (key === 'status') {
              setStatusFilter(val || 'All');
            } else if (key === 'module') {
              setModuleFilter(val || 'All');
            }
            setPage(0);
          }}
          
          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={fetchPortalAccess}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}
          
          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

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
          itemName="features"

          // Empty State
          emptyMessage={!activeCompanyId ? "No Company Selected" : "No feature access records found"}
          emptyDescription={
            !activeCompanyId 
              ? "Please select a company from the dropdown to view feature access."
              : "Try adjusting your search keywords or filter criteria to find feature records."
          }
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="feature-management-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-zinc-200 shadow-2xl p-6 space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Assign Portal Access
              </h3>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            {isModalLoading ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-medium flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading users and modules...</span>
              </div>
            ) : (
              <form onSubmit={handleGrantAccessSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 block">Select User *</label>
                  <CustomSelect
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                    required
                  >
                    <option value="">— Select User —</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username} ({u.empId || u.email || u.id})
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 block">Select Module *</label>
                  <CustomSelect
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                    required
                  >
                    <option value="">— Select Module —</option>
                    {modulesList.map((m) => {
                      const modId = m.module?.id || m.moduleId || m.id || m.companyModuleId;
                      const modName = m.name || m.label || m.module?.name || m.moduleName || "Unknown Module";
                      return (
                        <option key={m.id || modId} value={modId}>
                          {modName} {m.host ? `(${m.host})` : ''}
                        </option>
                      );
                    })}
                  </CustomSelect>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isAssigning ? "Granting..." : "Grant Portal Access"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
