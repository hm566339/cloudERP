import React, { useState, useMemo } from 'react';
import {
  Plus, Download, Edit2, Trash2, AlertCircle, CheckCircle, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { expenseCategoriesApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExpenseCategoryFormModal from '../components/ExpenseCategoryFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { DataTable, DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const ALL_COLUMNS = [
  { id: 'categoryCode', label: 'Code' },
  { id: 'categoryName', label: 'Name' },
  { id: 'description', label: 'Description' },
  { id: 'status', label: 'Status' }
];

const DEFAULT_COLUMNS = ['categoryCode', 'categoryName', 'description', 'status'];

export default function ExpenseCategoriesManagement() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // Dynamically build query filters
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.categoryCode && filters.categoryCode.trim()) q.categoryCode = filters.categoryCode.trim();
    if (filters.categoryName && filters.categoryName.trim()) q.categoryName = filters.categoryName.trim();

    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;

    return q;
  }, [filters]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    expenseCategoriesApi.getList,
    { ...queryFilters, ...apiParams }
  );

  const rawCategories = responseData?.data?.expenseCategories ||
    responseData?.data?.data?.expenseCategories ||
    responseData?.expenseCategories ||
    responseData?.data?.content ||
    responseData?.content ||
    (Array.isArray(responseData?.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []));

  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  const pageInfo = responseData?.data?.pagination ||
    responseData?.data?.paginationResponse ||
    responseData?.data?.data?.pagination ||
    responseData?.data?.data?.paginationResponse ||
    responseData?.pagination ||
    responseData?.paginationResponse ||
    { totalPages: 1, totalElements: categories.length };

  const deleteMutation = useApiMutation(expenseCategoriesApi.delete);
  const activateMutation = useApiMutation(expenseCategoriesApi.activate);
  const deactivateMutation = useApiMutation(expenseCategoriesApi.deactivate);
  const createMutation = useApiMutation(expenseCategoriesApi.create);
  const updateMutation = useApiMutation(expenseCategoriesApi.update);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Expense Category',
      'Are you sure you want to delete this expense category? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Category deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete category' }));
        }
      }
    );
  };

  const toggleStatus = async (category) => {
    const isActivating = !category.isActive;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Expense Category`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${category.categoryName}?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync(category.id);
          } else {
            await deactivateMutation.mutateAsync(category.id);
          }
          dispatch(addAlert({ type: 'success', message: `Category ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (payload.id) {
        await updateMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Category updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Category created successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save category' }));
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedCategory(prefillData);
    setIsFormOpen(true);
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'categoryCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.categoryCode || '-'}
        </span>
      )
    },
    {
      id: 'categoryName',
      label: 'Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.categoryName || '-'}</span>
      )
    },
    {
      id: 'description',
      label: 'Description',
      sortable: false,
      render: (val, row) => (
        <span className="text-zinc-600 truncate max-w-xs block" title={row.description || ''}>
          {row.description || '-'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <DataTableStatusBadge
          status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
        />
      )
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    }
  ], []);

  // Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      id: 'categoryCode',
      label: 'Category Code',
      type: 'text',
      placeholder: 'e.g. TRAV-01'
    },
    {
      id: 'categoryName',
      label: 'Category Name',
      type: 'text',
      placeholder: 'Exact or partial name'
    },
    {
      id: 'createdFrom',
      label: 'Created From',
      type: 'date'
    },
    {
      id: 'createdTo',
      label: 'Created To',
      type: 'date'
    }
  ], []);

  // Row Actions
  const rowActions = useMemo(() => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye size={15} />,
      className: 'hover:text-blue-600 hover:bg-blue-50 text-zinc-400',
      onClick: (row) => navigate(buildPath(`/accounts/masters/expense-categories/${row.id}`))
    },
    {
      id: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      id: 'toggleStatus',
      label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
      icon: (row) => (row.isActive ? <AlertCircle size={15} /> : <CheckCircle size={15} />),
      className: (row) =>
        row.isActive
          ? 'hover:text-amber-600 hover:bg-amber-50 text-zinc-400'
          : 'hover:text-emerald-600 hover:bg-emerald-50 text-zinc-400',
      onClick: (row) => toggleStatus(row)
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 size={15} />,
      className: 'hover:text-indigo-600 hover:bg-indigo-50 text-zinc-400',
      onClick: (row) => handleEdit(row)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={15} />,
      className: 'hover:text-red-600 hover:bg-red-50 text-zinc-400',
      onClick: (row) => handleDelete(row.id)
    }
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Expense Categories"
        description="Manage expense categories"
      >

        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={categories}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onRowClick={(row) => navigate(buildPath(`/accounts/masters/expense-categories/${row.id}`))}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Name, Code..."
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
          onSortChange={({ key }) => handleColumnSort(key === 'status' ? 'isActive' : key)}

          // Row Actions
          rowActions={rowActions}

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
          itemName="categories"

          // Empty State
          emptyMessage="No expense categories found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find expense categories."
        />
      </div>

      <ExpenseCategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedCategory}
        onSubmit={handleFormSubmit}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="expense-categories-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
