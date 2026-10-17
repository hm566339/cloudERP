import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, ScanLine, Hash, Package, Box, ShieldCheck, CalendarDays
} from 'lucide-react';
import { 
  useProductSerialList, 
  useProductSerialDelete, 
  useProductSerialCreate, 
  useProductSerialUpdate,
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
import ProductSerialForm from '../components/ProductSerialForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['serialNumber', 'product', 'batch', 'purchaseDate', 'warranty', 'status'];

export default function ProductSerialManagement() {
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
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'serialNumber', defaultSortOrder: 'asc' });

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
    if (filters.batchId && filters.batchId.trim()) q.batchId = filters.batchId.trim();
    if (filters.serialNumber && filters.serialNumber.trim()) q.serialNumber = filters.serialNumber.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'asc'}` : 'serialNumber,asc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { productSerials, pagination: pageInfo, isLoading, isFetching, refetch } = useProductSerialList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useProductSerialCreate();
  const updateMutation = useProductSerialUpdate();
  const deleteMutation = useProductSerialDelete();

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
        dispatch(addAlert({ type: 'success', message: 'Serial record updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Serial record created successfully' }));
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
      'Delete Serial Record',
      'Are you sure you want to delete this serial number?',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Serial record deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete serial record' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'serialNumber',
      label: 'Serial Number',
      sortable: true,
      sortKey: 'serialNumber',
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-900 font-bold border border-zinc-200/60 inline-flex items-center gap-1.5">
          <Hash size={12} className="text-zinc-400" />
          {row.serialNumber || '-'}
        </span>
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
            <span className="truncate max-w-[200px]" title={prod?.productName || row.productId}>
              {prod?.productName || row.productName || row.productId || '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'batch',
      label: 'Batch ID',
      sortable: false,
      render: (val, row) => (
        row.batchId ? (
          <span className="font-mono text-xs text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200 inline-flex items-center gap-1">
            <Box size={10} className="text-zinc-400" />
            {String(row.batchId).slice(-8)}
          </span>
        ) : (
          <span className="text-zinc-400 italic text-xs">-</span>
        )
      )
    },
    {
      id: 'purchaseDate',
      label: 'Purchase Date',
      sortable: true,
      sortKey: 'purchaseDate',
      render: (val, row) => (
        <span className="text-zinc-600 text-xs font-mono">
          {row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'warranty',
      label: 'Warranty End',
      sortable: true,
      sortKey: 'warrantyEndDate',
      render: (val, row) => (
        row.warrantyEndDate ? (
          <span className="text-zinc-700 text-xs font-mono inline-flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" />
            {new Date(row.warrantyEndDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-zinc-400 text-xs italic">None</span>
        )
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const s = (row.status || '').toUpperCase();
        if (s === 'AVAILABLE') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">AVAILABLE</span>;
        }
        if (s === 'SOLD') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">SOLD</span>;
        }
        if (s === 'RESERVED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">RESERVED</span>;
        }
        if (s === 'DEFECTIVE') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">DEFECTIVE</span>;
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
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'Sold', value: 'SOLD' },
        { label: 'Reserved', value: 'RESERVED' },
        { label: 'Defective', value: 'DEFECTIVE' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Serial Identification',
      fields: [
        { id: 'serialNumber', label: 'Serial Number', placeholder: 'Exact or partial serial' },
        { id: 'productId', label: 'Product ID', placeholder: 'Product ID or UUID' },
        { id: 'batchId', label: 'Batch ID', placeholder: 'Batch ID or UUID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/product-serials/${row.id}`)),
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
      permission: { module: 'PRODUCT_SERIALS', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'PRODUCT_SERIALS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (serial) => (
    <ExpandedRowDetails data={serial} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Product Serials"
        description="Manage individualized product serial numbers and warranty statuses"
        icon={ScanLine}
      >
        <RequirePermission module="PRODUCT_SERIALS" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Serial</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={productSerials || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/product-serials/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.serialNumber || ''}
          searchPlaceholder="Search serial number..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('serialNumber', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create serial "${val}"`,
            description: 'Add as new product serial',
            onCreate: (searchTerm) => handleOpenFormModal({ serialNumber: searchTerm })
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
            totalElements: pageInfo?.totalElements || productSerials?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="serial numbers"

          emptyMessage="No product serials found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find serial records."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Serial Record' : 'New Serial Record'}
        maxWidth="max-w-xl"
      >
        <ProductSerialForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="product-serials-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}