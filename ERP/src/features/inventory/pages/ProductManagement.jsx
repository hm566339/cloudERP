import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useProductList, 
  useProductDelete, 
  useProductCreate, 
  useProductUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import ProductForm from '../components/ProductForm';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import Modal from '../../../components/common/Modal';

const DEFAULT_COLUMNS = [
  'image_id',
  'name_sku',
  'category',
  'productType',
  'baseUom',
  'basePrice',
  'status'
];

export default function ProductManagement() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'productName', defaultSortOrder: 'asc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.sku && filters.sku.trim()) q.sku = filters.sku.trim();
    if (filters.productName && filters.productName.trim()) q.productName = filters.productName.trim();
    if (filters.productType && filters.productType.trim()) q.productType = filters.productType.trim();
    if (filters.categoryId && filters.categoryId.trim()) q.categoryId = filters.categoryId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'asc'}` : undefined
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { products, pagination: pageInfo, isLoading, isFetching, refetch } = useProductList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const deleteMutation = useProductDelete();
  const createMutation = useProductCreate();
  const updateMutation = useProductUpdate();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Product',
      'Are you sure you want to delete this product? This may affect historical transactions.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Product deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete product' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (selectedProduct?.id) {
        await updateMutation.mutateAsync([selectedProduct.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Product updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Product created successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save product' }));
      throw error;
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedProduct(prefillData);
    setIsFormOpen(true);
  };

  const columns = useMemo(() => [
    {
      id: 'image_id',
      label: 'Image / ID',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200">
            <Package size={14} className="text-zinc-400" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500">{row.id ? String(row.id).slice(-6) : '-'}</span>
        </div>
      )
    },
    {
      id: 'name_sku',
      label: 'Name & SKU',
      sortable: true,
      sortKey: 'productName',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900">{row.productName || '-'}</span>
          <span className="text-zinc-500 font-mono text-xs">{row.sku || '-'}</span>
        </div>
      )
    },
    {
      id: 'category',
      label: 'Category',
      sortable: false,
      render: (val, row) => <span className="text-zinc-700">{row.categoryId || 'Uncategorized'}</span>
    },
    {
      id: 'productType',
      label: 'Product Type',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.productType || '-'}</span>
    },
    {
      id: 'baseUom',
      label: 'UOM',
      sortable: false,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700">
          {row.baseUomId || '-'}
        </span>
      )
    },
    {
      id: 'basePrice',
      label: 'Base Price',
      sortable: true,
      sortKey: 'sellingPrice',
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {row.sellingPrice !== undefined && row.sellingPrice !== null ? Number(row.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status === 'ACTIVE'} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ]
    },
    {
      id: 'productType',
      label: 'Product Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        { label: 'Goods', value: 'GOODS' },
        { label: 'Service', value: 'SERVICE' },
        { label: 'Non-Inventory', value: 'NON_INVENTORY' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Product Identification',
      fields: [
        { id: 'sku', label: 'SKU', placeholder: 'e.g. SKU123' },
        { id: 'productName', label: 'Product Name', placeholder: 'Exact or partial name' },
      ]
    },
    {
      title: 'Classification',
      fields: [
        { id: 'categoryId', label: 'Category ID', placeholder: 'Category ID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/products/${row.id}`)),
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
      permission: { module: 'PRODUCTS', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'PRODUCTS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (product) => (
    <ExpandedRowDetails data={product} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Product Catalog"
        description="Manage products, categories, inventory details, and product information"
      >
        <RequirePermission module="PRODUCTS" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Product</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={products}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search Name, SKU..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new product',
            onCreate: (searchTerm) => handleCreate({ productName: searchTerm })
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
            pageSize: apiParams.size,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || products?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="products"

          emptyMessage="No products found"
          emptyDescription="Try adjusting your search keywords or filter criteria."
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'New Product'}
        maxWidth="max-w-2xl"
        bodyClassName="p-0 flex flex-col flex-1 overflow-hidden"
      >
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="productcatalog-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
