import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Box, Package, CalendarDays, ShieldAlert
} from 'lucide-react';
import { 
  useProductBatchList, 
  useProductBatchDelete, 
  useProductBatchCreate, 
  useProductBatchUpdate,
  useProductList
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
import ProductBatchForm from '../components/ProductBatchForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['batchNumber', 'product', 'manufacturingDate', 'expiryDate', 'status'];

export default function ProductBatchManagement() {
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
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'manufacturingDate', defaultSortOrder: 'desc' });

  const { products } = useProductList({}, { page: 0, size: 200 });
  const productMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p?.id) map.set(p.id, p);
      });
    }
    return map;
  }, [products]);

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.batchNumber && filters.batchNumber.trim()) q.batchNumber = filters.batchNumber.trim();
    if (filters.supplierId && filters.supplierId.trim()) q.supplierId = filters.supplierId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'manufacturingDate,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { productBatches, pagination: pageInfo, isLoading, isFetching, refetch } = useProductBatchList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useProductBatchCreate();
  const updateMutation = useProductBatchUpdate();
  const deleteMutation = useProductBatchDelete();

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
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Batch updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Batch created successfully' }));
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
      'Delete Product Batch',
      'Are you sure you want to delete this batch? It might be referenced by stock lines.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Batch deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete batch' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'batchNumber',
      label: 'Batch Number',
      sortable: true,
      sortKey: 'batchNumber',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-semibold border border-zinc-200/60 w-max">
            {row.batchNumber || '-'}
          </span>
          {row.supplierId && (
            <span className="text-zinc-500 text-[10px] mt-0.5">Supplier: {row.supplierId}</span>
          )}
        </div>
      )
    },
    {
      id: 'product',
      label: 'Product',
      sortable: false,
      render: (val, row) => {
        const prod = productMap.get(row.productId);
        return (
          <div className="flex items-center gap-1.5 text-zinc-900 font-medium text-sm">
            <Package size={14} className="text-zinc-400 shrink-0" />
            <span className="truncate max-w-[220px]" title={prod?.productName || row.productId}>
              {prod?.productName || row.productName || row.productId || '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'manufacturingDate',
      label: 'Mfg Date',
      sortable: true,
      sortKey: 'manufacturingDate',
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
          <CalendarDays size={13} className="text-zinc-400" />
          {row.manufacturingDate ? new Date(row.manufacturingDate).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      sortKey: 'expiryDate',
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
          <CalendarDays size={13} className="text-zinc-400" />
          {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-'}
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const s = (row.status || '').toUpperCase();
        if (s === 'ACTIVE') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">ACTIVE</span>;
        }
        if (s === 'EXPIRED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">EXPIRED</span>;
        }
        if (s === 'QUARANTINE') {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60"><ShieldAlert size={11} /> QUARANTINE</span>;
        }
        if (s === 'RECALLED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-white">RECALLED</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">{row.status || 'UNKNOWN'}</span>;
      }
    }
  ], [productMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Expired', value: 'EXPIRED' },
        { label: 'Quarantine', value: 'QUARANTINE' },
        { label: 'Recalled', value: 'RECALLED' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Batch Identification',
      fields: [
        { id: 'batchNumber', label: 'Batch Number', placeholder: 'Batch number' },
        { id: 'productId', label: 'Product ID', placeholder: 'Product ID or UUID' },
        { id: 'supplierId', label: 'Supplier ID', placeholder: 'Supplier ID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/product-batches/${row.id}`)),
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
      permission: { module: 'PRODUCT_BATCHES', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'PRODUCT_BATCHES', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (batch) => (
    <ExpandedRowDetails data={batch} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Product Batches"
        description="Manage production batches, lifecycle dates, and quarantines"
        icon={Box}
      >
        <RequirePermission module="PRODUCT_BATCHES" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Batch</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={productBatches || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/product-batches/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.batchNumber || ''}
          searchPlaceholder="Search batch number..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('batchNumber', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create batch "${val}"`,
            description: 'Add as new product batch',
            onCreate: (searchTerm) => handleOpenFormModal({ batchNumber: searchTerm })
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
            totalElements: pageInfo?.totalElements || productBatches?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="batches"

          emptyMessage="No product batches found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find batches."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Product Batch' : 'New Product Batch'}
        maxWidth="max-w-xl"
      >
        <ProductBatchForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="product-batches-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}