import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye,
  Bookmark, Download
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountCategoriesApi } from '../../../api/account/accountCategories';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import Modal from '../../../components/common/Modal';
import AccountCategoryForm from '../components/AccountCategoryForm';
import { useRoutePath } from '../../../hooks/useRoutePath';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const NATURE_TYPES = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' }
];

const DEFAULT_COLUMNS = ['code', 'name', 'nature', 'createdAt', 'isDeleted'];

export default function AccountCategories() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [serverError, setServerError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setServerError(null);
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
    if (companyId) q.companyId = companyId;
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.nature && filters.nature.trim()) q.nature = filters.nature.trim();

    if (filters.isDeleted !== undefined && filters.isDeleted !== '') {
      q.isDeleted = filters.isDeleted === 'true' || filters.isDeleted === true;
    }

    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;
    if (filters.updatedFrom) q.updatedFrom = filters.updatedFrom;
    if (filters.updatedTo) q.updatedTo = filters.updatedTo;

    return q;
  }, [filters, companyId]);

  const finalParams = useMemo(() => ({
    ...queryFilters,
    page,
    size: apiParams.size || 10,
    sortBy: sortBy || 'code',
    sortDir: sortOrder || 'asc'
  }), [queryFilters, page, apiParams.size, sortBy, sortOrder]);

  const { data: apiData, isLoading, refetch, isFetching } = useApiQuery(
    accountCategoriesApi.getList,
    finalParams,
    { keepPreviousData: true }
  );

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data?.accountCategories && Array.isArray(res.data.accountCategories)) return res.data.accountCategories;
    if (res?.accountCategories && Array.isArray(res.accountCategories)) return res.accountCategories;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.content && Array.isArray(res.content)) return res.content;
    return [];
  };

  const categories = extractArray(apiData);

  const pageInfo = apiData?.data?.pagination ||
    apiData?.pagination ||
    apiData?.data?.paginationResponse ||
    apiData?.paginationResponse ||
    apiData?._pageInfo ||
    { totalPages: 1, totalElements: categories.length };

  const { mutateAsync: deleteCategoryMutation } = useApiMutation(
    (id) => accountCategoriesApi.delete(id),
    { onSuccess: () => refetch() }
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account category?')) {
      try {
        await deleteCategoryMutation(id);
        dispatch(addAlert({ type: 'success', message: 'Category deleted successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete category' }));
      }
    }
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
      label: 'Category Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{row.name || '-'}</span>
      )
    },
    {
      id: 'nature',
      label: 'Nature',
      sortable: true,
      render: (val, row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${row.nature === 'DEBIT' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
          {row.nature || '-'}
        </span>
      )
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-600 dark:text-[#A0A6B5] text-xs">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'isDeleted',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <DataTableStatusBadge status={!row.isDeleted} activeLabel="Active" inactiveLabel="Deleted" />
      )
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'createdFrom',
      label: 'Created From',
      type: 'date'
    },
    {
      id: 'createdTo',
      label: 'Created To',
      type: 'date'
    },
    {
      id: 'nature',
      label: 'Nature',
      type: 'select',
      placeholder: 'All Nature',
      options: NATURE_TYPES
    }
  ], []);

  // Expandable Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Category Details',
      fields: [
        { id: 'code', label: 'Category Code', placeholder: 'e.g. ASSET' },
        { id: 'name', label: 'Category Name', placeholder: 'Category name' },
        {
          id: 'isDeleted',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'All', value: '' },
            { label: 'Active', value: 'false' },
            { label: 'Deleted', value: 'true' }
          ]
        }
      ]
    },
    {
      title: 'Updated Date Range',
      fields: [
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
      onClick: (row) => navigate(buildPath(`/accounts/masters/account-categories/${row.id}`)),
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
  const renderExpandedRow = (category) => (
    <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-100 dark:border-[#2A2F3D] rounded-lg shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">{category.name}</h3>
          <p className="text-xs font-mono text-zinc-500 dark:text-[#A0A6B5] mt-0.5">{category.code}</p>
        </div>
        <div className="flex gap-2">
          <DataTableStatusBadge status={!category.isDeleted} activeLabel="Active" inactiveLabel="Deleted" />
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${category.nature === 'DEBIT' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'}`}>
            {category.nature}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Account Groups</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">{category.totalAccountGroups || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Ledgers</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1 flex flex-col gap-0.5">
            <span>{category.totalLedgers || 0} Total</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{category.activeLedgers || 0} Active</span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Net Balance</p>
          <p className="text-sm font-medium mt-1 flex flex-col gap-0.5">
            <span className={(category.netBalance || 0) < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
              ₹{Math.abs(category.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {(category.netBalance || 0) < 0 ? ' Cr' : ' Dr'}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Last Transaction</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">
            {category.lastTransactionDate ? new Date(category.lastTransactionDate).toLocaleDateString() : '-'}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Created Date</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] mt-1">
            {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Account Categories"
        description="Manage account categories"
        icon={Bookmark}
      >


        <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={categories}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/accounts/masters/account-categories/${row.id}`))}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search Code or Name..."
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
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || categories.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="account categories"

          // Empty State
          emptyMessage="No account categories found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find account categories."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? "Edit Account Category" : "Create Account Category"}
        maxWidth="max-w-xl"
      >
        <AccountCategoryForm
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
        reportName="account-categories-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
