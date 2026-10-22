import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, LayoutList, FolderTree, Network, Download
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountGroupsApi } from '../../../api/account/accountGroups';
import { accountCategoriesApi } from '../../../api/account/accountCategories';
import useUrlFilters from '../../../hooks/useUrlFilters';
import Modal from '../../../components/common/Modal';
import AccountGroupForm from '../components/AccountGroupForm';
import { useRoutePath } from '../../../hooks/useRoutePath';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const CATEGORY_TYPES = [
  { value: 'AST', label: 'Asset' },
  { value: 'LIA', label: 'Liability' },
  { value: 'INC', label: 'Income' },
  { value: 'EXP', label: 'Expense' },
  { value: 'EQU', label: 'Equity' }
];

const DEFAULT_COLUMNS = ['code', 'name', 'categoryName', 'parentGroupName', 'deleted'];

export default function AccountGroups() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'TREE'
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'code', defaultSortOrder: 'asc' });

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  // Dynamically build filter payload without null or empty values
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.categoryCode && filters.categoryCode.trim()) q.categoryCode = filters.categoryCode.trim();
    if (filters.categoryType && filters.categoryType.trim()) q.categoryType = filters.categoryType.trim();

    if (filters.status) {
      if (filters.status === 'DELETED') q.deleted = true;
      if (filters.status === 'ACTIVE') q.deleted = false;
    }

    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;
    if (filters.updatedFrom) q.updatedFrom = filters.updatedFrom;
    if (filters.updatedTo) q.updatedTo = filters.updatedTo;

    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters,
    page,
    size: apiParams.size || 10,
    sortBy: sortBy || 'code',
    sortDir: sortOrder || 'asc'
  }), [queryFilters, page, apiParams.size, sortBy, sortOrder]);

  const { data: apiData, isLoading, refetch, isFetching } = useApiQuery(
    accountGroupsApi.getList,
    finalParams,
    { keepPreviousData: true }
  );

  const { data: categoriesData } = useApiQuery(
    accountCategoriesApi.getList,
    { size: 100 }
  );

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.content && Array.isArray(res.content)) return res.content;
    return [];
  };

  const categories = extractArray(categoriesData);
  const rawGroups = extractArray(apiData);

  const extractedTotalElements = apiData?._pageInfo?.totalElements ||
    apiData?.paginationResponse?.totalElements ||
    apiData?.pagination?.totalElements ||
    apiData?.data?.paginationResponse?.totalElements ||
    apiData?.data?.pagination?.totalElements ||
    apiData?.totalElements ||
    apiData?.data?.totalElements ||
    rawGroups.length;

  const currentSize = apiParams.size || 10;

  const pageInfo = {
    totalPages: Math.ceil(extractedTotalElements / currentSize) || 1,
    totalElements: extractedTotalElements
  };

  const isFullyLoaded = rawGroups.length === extractedTotalElements && rawGroups.length > 0;
  const groups = isFullyLoaded
    ? rawGroups.slice(page * currentSize, (page + 1) * currentSize)
    : rawGroups;

  const { mutateAsync: deleteGroupMutation } = useApiMutation(
    (id) => accountGroupsApi.delete(id),
    { onSuccess: () => refetch() }
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account group?')) {
      try {
        await deleteGroupMutation(id);
        refetch();
      } catch (err) {
        alert('Failed to delete account group.');
      }
    }
  };


  // Tree View Logic
  const treeData = useMemo(() => {
    if (viewMode !== 'TREE') return [];

    const map = new Map();
    const roots = [];

    rawGroups.forEach(group => {
      map.set(group.id, { ...group, children: [] });
    });

    rawGroups.forEach(group => {
      const node = map.get(group.id);
      if (group.parentGroupId && map.has(group.parentGroupId)) {
        map.get(group.parentGroupId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [rawGroups, viewMode]);

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNodes(new Set(rawGroups.map(g => g.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="w-full">
        <div
          className="flex items-center py-2.5 px-4 hover:bg-zinc-50 dark:hover:bg-[#222736] border-b border-zinc-100 dark:border-[#2A2F3D] cursor-pointer group transition-colors"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else {
              navigate(buildPath(`/accounts/masters/account-groups/${node.id}`));
            }
          }}
        >
          <div className="w-6 flex items-center justify-center mr-2">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={16} className="text-zinc-500 dark:text-[#A0A6B5]" />
              ) : (
                <ChevronRight size={16} className="text-zinc-500 dark:text-[#A0A6B5]" />
              )
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded">{node.code}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{node.name}</span>
            </div>
          </div>
          <div className="w-48 text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">
            {node.categoryName || '-'}
          </div>
          <div className="w-24 flex justify-end">
            <DataTableStatusBadge status={!node.deleted} activeLabel="Active" inactiveLabel="Deleted" />
          </div>
          <div className="w-16 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity ml-3">
            <button
              className="p-1 text-zinc-400 dark:text-[#6B7184] hover:text-blue-600 dark:hover:text-[#4C8DFF] rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildPath(`/accounts/masters/account-groups/${node.id}`));
              }}
              title="View Details"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="w-full">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 dark:bg-[#1D212C] px-2 py-1 rounded text-zinc-800 dark:text-[#E6E8EE] font-semibold border border-zinc-200/60 dark:border-[#2A2F3D]">
          {row.code || '-'}
        </span>
      )
    },
    {
      id: 'name',
      label: 'Group Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{row.name || '-'}</span>
      )
    },
    {
      id: 'categoryName',
      label: 'Category',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">{row.categoryName || '-'}</span>
      )
    },
    {
      id: 'parentGroupName',
      label: 'Parent Group',
      sortable: true,
      render: (val, row) => (
        row.parentGroupName ? (
          <span className="text-zinc-700 dark:text-[#E6E8EE]">{row.parentGroupName}</span>
        ) : (
          <span className="text-zinc-400 dark:text-[#6B7184] italic text-xs">Root</span>
        )
      )
    },
    {
      id: 'deleted',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <DataTableStatusBadge status={!row.deleted} activeLabel="Active" inactiveLabel="Deleted" />
      )
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'categoryCode',
      label: 'Category',
      type: 'select',
      placeholder: 'All Categories',
      options: categories.map((c) => ({ label: c.name, value: c.code }))
    },
    {
      id: 'categoryType',
      label: 'Category Type',
      type: 'select',
      placeholder: 'All Types',
      options: CATEGORY_TYPES
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Deleted', value: 'DELETED' },
      ]
    }
  ], [categories]);

  // Expandable Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Group Identification',
      fields: [
        { id: 'code', label: 'Group Code', placeholder: 'e.g. CURR_ASSETS' },
        { id: 'name', label: 'Group Name', placeholder: 'Group name' }
      ]
    },
    {
      title: 'Date Filters',
      fields: [
        { id: 'createdFrom', label: 'Created From', type: 'date' },
        { id: 'createdTo', label: 'Created To', type: 'date' },
        { id: 'updatedFrom', label: 'Updated From', type: 'date' },
        { id: 'updatedTo', label: 'Updated To', type: 'date' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/account-groups/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 dark:hover:text-[#4C8DFF] hover:bg-blue-50 dark:hover:bg-[#4C8DFF]/10'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Sub-row drawer renderer
  const renderExpandedRow = (group) => (
    <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-100 dark:border-[#2A2F3D] rounded-lg shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">{group.name}</h3>
          <p className="text-xs font-mono text-zinc-500 dark:text-[#A0A6B5] mt-0.5">{group.code}</p>
        </div>
        <div>
          <DataTableStatusBadge status={!group.deleted} activeLabel="Active" inactiveLabel="Deleted" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Category & Parent</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1 flex flex-col gap-0.5">
            <span>{group.categoryName || '-'}</span>
            <span className="text-xs text-zinc-500 dark:text-[#A0A6B5]">{group.parentGroupName || 'Root'}</span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Hierarchy & Depth</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1 flex flex-col gap-0.5">
            <span>Level {group.levelDepth ?? group.level ?? 1}</span>
            <span className="text-xs text-zinc-500 dark:text-[#A0A6B5]">{group.totalChildGroups || 0} Sub-groups</span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Ledgers</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1 flex flex-col gap-0.5">
            <span>{group.totalLedgers || 0} Total</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{group.activeLedgerCount || group.totalLedgers || 0} Active</span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Net Balance</p>
          <p className="text-sm font-medium mt-1 flex flex-col gap-0.5">
            <span className={(group.netBalance || 0) < 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
              ₹{Math.abs(group.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {(group.netBalance || 0) < 0 ? ' Cr' : ' Dr'}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Last Updated</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">
            {group.updatedAt ? new Date(group.updatedAt).toLocaleDateString() : '-'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Account Groups"
        description="Manage account groups"
        icon={Network}
      >




        <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>New Group</span>
        </button>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {viewMode === 'TABLE' ? (
          <DataTable
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={columns}
            data={groups}
            rowKey="id"
            loading={isLoading}
            isRefreshing={isFetching}
            onRowClick={(row) => navigate(buildPath(`/accounts/masters/account-groups/${row.id}`))}

            // Search
            searchable
            searchValue={filters.searchKey || ''}
            searchPlaceholder="Search by name or code..."
            onSearchChange={(val) => setFilter('searchKey', val)}

            // Basic Filters
            filters={basicFilters}
            filterValues={filters}
            onFilterChange={setFilter}

            // Advanced Filters
            advancedFilters={advancedFilters}

            // Reset & Refresh & Export
            onReset={handleReset}
            onRefresh={refetch}
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
              pageSize: currentSize,
              totalPages: pageInfo?.totalPages || 1,
              totalElements: pageInfo?.totalElements || groups.length
            }}
            pageIndexBase={0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="account groups"

            // Empty State
            emptyMessage="No account groups found"
            emptyDescription="Try adjusting your search keywords or filter criteria to find account groups."
          />
        ) : (
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200 dark:border-[#2A2F3D] flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/50 dark:bg-[#161922]">
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 dark:hover:bg-[#222736]"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 dark:hover:bg-[#222736]"
                >
                  Collapse All
                </button>
              </div>
              <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">
                {rawGroups.length} Total Groups
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
              {treeData.length > 0 ? (
                treeData.map(node => renderTreeNode(node))
              ) : (
                <div className="p-12 text-center text-zinc-500 dark:text-[#A0A6B5] text-sm">
                  No hierarchy nodes found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? "Edit Account Group" : "Create Account Group"}
        maxWidth="max-w-xl"
      >
        <AccountGroupForm
          initialData={initialFormData}
          onSuccess={() => {
            setIsFormModalOpen(false);
            refetch();
          }}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="account-groups-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
