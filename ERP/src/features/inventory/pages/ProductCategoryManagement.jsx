import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, FolderTree, Tag
} from 'lucide-react';
import { 
  useProductCategoryList, 
  useProductCategoryDelete, 
  useProductCategoryCreate, 
  useProductCategoryUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import Modal from '../../../components/common/Modal';
import ExportModal from '../../../components/common/ExportModal';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import ProductCategoryForm from '../components/ProductCategoryForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['name', 'code', 'parentCategory', 'isActive'];

export default function ProductCategoryManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'name', defaultSortOrder: 'asc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'asc'}` : 'name,asc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { productCategories, pagination: pageInfo, isLoading, isFetching, refetch } = useProductCategoryList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useProductCategoryCreate();
  const updateMutation = useProductCategoryUpdate();
  const deleteMutation = useProductCategoryDelete();

  const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const isSystemAdmin = authUser?.roles?.includes('ROLE_SYSTEM_ADMIN') || authUser?.roles?.includes('ROLE_SUPER_ADMIN') || authUser?.role === 'SYSTEM_ADMIN';
  const companyId = JSON.parse(localStorage.getItem('selected_company') || '{}')?.id || authUser?.companyCode;

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      if (isSystemAdmin) {
        payload.companyId = companyId;
      }
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Category updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Category created successfully' }));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Operation failed' }));
      throw error;
    }
  };

  const handleDelete = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    confirmDialog(
      'Delete Category',
      'Are you sure you want to delete this category? Ensure no products are currently assigned to it.',
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

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Category Name',
      sortable: true,
      sortKey: 'name',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 text-sm">{row.name || '-'}</span>
          {row.description && (
            <span className="text-zinc-500 text-xs truncate max-w-xs">{row.description}</span>
          )}
        </div>
      )
    },
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      sortKey: 'code',
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-semibold border border-zinc-200/60 inline-flex items-center gap-1.5">
          <Tag size={12} className="text-zinc-400" />
          {row.code || '-'}
        </span>
      )
    },
    {
      id: 'parentCategory',
      label: 'Parent Category',
      sortable: false,
      render: (val, row) => (
        row.parentCategoryId ? (
          <span className="text-zinc-700 font-medium text-xs font-mono">
            {row.parentCategoryName || `${String(row.parentCategoryId).substring(0, 8)}...`}
          </span>
        ) : (
          <span className="text-zinc-400 italic text-xs">Top Level</span>
        )
      )
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <DataTableStatusBadge
          status={Boolean(row.isActive)}
          activeLabel="Active"
          inactiveLabel="Inactive"
        />
      )
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Category Identification',
      fields: [
        { id: 'name', label: 'Category Name', placeholder: 'Category name' },
        { id: 'code', label: 'Category Code', placeholder: 'e.g. ELEC-01' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/product-categories/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'PRODUCT_CATEGORIES', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'PRODUCT_CATEGORIES', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (category) => (
    <ExpandedRowDetails data={category} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Product Categories"
        description="Organize products into hierarchical groups and classifications"
        icon={FolderTree}
      >
        <RequirePermission module="PRODUCT_CATEGORIES" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Category</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={productCategories || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/product-categories/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.name || ''}
          searchPlaceholder="Search categories..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('name', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create category "${val}"`,
            description: 'Add as new product category',
            onCreate: (searchTerm) => handleOpenFormModal({ name: searchTerm })
          }}

          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          advancedFilters={advancedFilters}

          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          rowActions={rowActions}

          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          pagination={{
            page,
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || productCategories?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="categories"

          emptyMessage="No product categories found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find categories."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Category' : 'New Category'}
        maxWidth="max-w-md"
      >
        <ProductCategoryForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="product-categories-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}