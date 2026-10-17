import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Lock, Unlock, Play, Package, MapPin, CalendarDays
} from 'lucide-react';
import { 
  useStockReservationList, 
  useStockReservationDelete, 
  useStockReservationCreate, 
  useStockReservationUpdate,
  useStockReservationRelease,
  useStockReservationConsume,
  useProductList,
  useWarehouseList
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
import StockReservationForm from '../components/StockReservationForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['reservationNo', 'productLocation', 'reference', 'quantity', 'status'];

export default function StockReservationManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [consumeModal, setConsumeModal] = useState({ open: false, id: null, qty: 1 });

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

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

  const { warehouses } = useWarehouseList({}, { page: 0, size: 200 });
  const warehouseMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(warehouses)) {
      warehouses.forEach((w) => {
        if (w?.id) map.set(w.id, w.warehouseName || w.name);
      });
    }
    return map;
  }, [warehouses]);

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.reservationNo && filters.reservationNo.trim()) q.reservationNo = filters.reservationNo.trim();
    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { stockReservations, pagination: pageInfo, isLoading, isFetching, refetch } = useStockReservationList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useStockReservationCreate();
  const updateMutation = useStockReservationUpdate();
  const deleteMutation = useStockReservationDelete();
  const releaseMutation = useStockReservationRelease();
  const consumeMutation = useStockReservationConsume();

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
        dispatch(addAlert({ type: 'success', message: 'Reservation updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Reservation created successfully' }));
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
      'Delete Reservation',
      'Are you sure you want to delete this reservation? The reserved stock will not be automatically released.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Reservation deleted' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete' }));
        }
      }
    );
  };

  const handleRelease = (id) => {
    confirmDialog(
      'Release Reservation',
      'Are you sure you want to release the reserved stock back into available inventory?',
      async () => {
        try {
          await releaseMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Stock released successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to release stock' }));
        }
      }
    );
  };

  const openConsumeModal = (id) => {
    setConsumeModal({ open: true, id, qty: 1 });
  };

  const handleConsumeSubmit = async () => {
    if (consumeModal.qty <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Quantity must be positive' }));
      return;
    }
    try {
      await consumeMutation.mutateAsync({ id: consumeModal.id, quantity: consumeModal.qty });
      dispatch(addAlert({ type: 'success', message: 'Stock consumed successfully' }));
      setConsumeModal({ open: false, id: null, qty: 1 });
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to consume stock' }));
    }
  };

  const columns = useMemo(() => [
    {
      id: 'reservationNo',
      label: 'Reservation No & Expiry',
      sortable: true,
      sortKey: 'reservationNo',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 text-sm font-mono">{row.reservationNo || '-'}</span>
          {row.expiresAt && (
            <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 font-mono mt-0.5">
              <CalendarDays size={11} className="text-rose-400" />
              Exp: {new Date(row.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'productLocation',
      label: 'Product & Warehouse',
      sortable: false,
      render: (val, row) => {
        const prod = productMap.get(row.productId);
        const whName = warehouseMap.get(row.warehouseId);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
              <Package size={14} className="text-zinc-400 shrink-0" />
              <span className="truncate max-w-[200px]" title={prod?.productName || row.productId}>
                {prod?.productName || row.productName || (row.productId ? String(row.productId).substring(0, 8) + '...' : '-')}
              </span>
            </span>
            <span className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-zinc-400" />
              WH: {whName || row.warehouseName || (row.warehouseId ? String(row.warehouseId).substring(0, 8) : '-')}
            </span>
          </div>
        );
      }
    },
    {
      id: 'reference',
      label: 'Reference',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-zinc-800">{row.referenceType || '-'}</span>
          {row.referenceId && (
            <span className="text-zinc-500 font-mono text-[11px]">{String(row.referenceId).substring(0, 8)}...</span>
          )}
        </div>
      )
    },
    {
      id: 'quantity',
      label: 'Reserved / Released',
      sortable: true,
      sortKey: 'reservedQuantity',
      align: 'right',
      render: (val, row) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-zinc-900 font-mono text-sm">{row.reservedQuantity || 0}</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            Rel: {row.releasedQuantity ?? 0}
          </span>
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
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">ACTIVE</span>;
        }
        if (s === 'CONSUMED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">CONSUMED</span>;
        }
        if (s === 'RELEASED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">RELEASED</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">{row.status || 'UNKNOWN'}</span>;
      }
    }
  ], [productMap, warehouseMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Consumed', value: 'CONSUMED' },
        { label: 'Released', value: 'RELEASED' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Reservation Identification',
      fields: [
        { id: 'reservationNo', label: 'Reservation No', placeholder: 'Reservation number' },
        { id: 'productId', label: 'Product ID', placeholder: 'Product ID or UUID' },
        { id: 'warehouseId', label: 'Warehouse ID', placeholder: 'Warehouse ID or UUID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/stock-reservations/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'release',
      label: 'Release',
      icon: Unlock,
      permission: { module: 'STOCK_RESERVATIONS', action: 'UPDATE' },
      hidden: (row) => row.status !== 'ACTIVE',
      onClick: (row) => handleRelease(row.id),
      tooltip: 'Release Reservation',
      className: 'hover:text-amber-600 hover:bg-amber-50'
    },
    {
      key: 'consume',
      label: 'Consume',
      icon: Play,
      permission: { module: 'STOCK_RESERVATIONS', action: 'UPDATE' },
      hidden: (row) => row.status !== 'ACTIVE',
      onClick: (row) => openConsumeModal(row.id),
      tooltip: 'Consume Stock',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'STOCK_RESERVATIONS', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'STOCK_RESERVATIONS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (res) => (
    <ExpandedRowDetails data={res} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Stock Reservations"
        description="Manage hard allocations of stock for specific orders or processes"
        icon={Lock}
      >
        <RequirePermission module="STOCK_RESERVATIONS" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Reservation</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={stockReservations || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/stock-reservations/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.reservationNo || ''}
          searchPlaceholder="Search reservation number..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('reservationNo', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create reservation "${val}"`,
            description: 'Add as new stock reservation',
            onCreate: (searchTerm) => handleOpenFormModal({ reservationNo: searchTerm })
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
            totalElements: pageInfo?.totalElements || stockReservations?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="stock reservations"

          emptyMessage="No stock reservations found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find reservations."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Reservation' : 'New Reservation'}
        maxWidth="max-w-2xl"
      >
        <StockReservationForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {/* Consume Modal */}
      <Modal
        isOpen={consumeModal.open}
        onClose={() => setConsumeModal({ open: false, id: null, qty: 1 })}
        title="Consume Reserved Stock"
        maxWidth="max-w-sm"
      >
        <div className="p-4 space-y-4">
          <p className="text-xs text-zinc-500">
            Specify the quantity of stock to consume from this reservation:
          </p>
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 mb-1 block">Quantity</label>
            <input
              type="number"
              min="1"
              value={consumeModal.qty}
              onChange={(e) => setConsumeModal((prev) => ({ ...prev, qty: Number(e.target.value) }))}
              className="input-field w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setConsumeModal({ open: false, id: null, qty: 1 })}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConsumeSubmit}
              disabled={consumeMutation.isLoading}
              className="btn-primary text-xs"
            >
              {consumeMutation.isLoading ? 'Consuming...' : 'Confirm Consume'}
            </button>
          </div>
        </div>
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="stock-reservations-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}