import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, ArrowLeftRight, RotateCcw, MapPin, CalendarDays
} from 'lucide-react';
import { 
  useStockTransferList, 
  useStockTransferDelete,
  useStockTransferReverse,
  useWarehouseList
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import ExportModal from '../../../components/common/ExportModal';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['transferNo', 'sourceWarehouse', 'destinationWarehouse', 'status'];

export default function StockTransferManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

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
    if (filters.transferNo && filters.transferNo.trim()) q.transferNo = filters.transferNo.trim();
    if (filters.sourceWarehouseId && filters.sourceWarehouseId.trim()) q.sourceWarehouseId = filters.sourceWarehouseId.trim();
    if (filters.destinationWarehouseId && filters.destinationWarehouseId.trim()) q.destinationWarehouseId = filters.destinationWarehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { stockTransfers, pagination: pageInfo, isLoading, isFetching, refetch } = useStockTransferList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const deleteMutation = useStockTransferDelete();
  const reverseMutation = useStockTransferReverse();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    confirmDialog(
      'Delete Stock Transfer',
      'Are you sure you want to delete this stock transfer? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Transfer deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete' }));
        }
      }
    );
  };

  const handleReverse = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    confirmDialog(
      'Reverse Stock Transfer',
      'Are you sure you want to reverse this stock transfer? This will generate reversing stock movements.',
      async () => {
        try {
          await reverseMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Transfer reversed successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to reverse transfer' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'transferNo',
      label: 'Transfer No & Date',
      sortable: true,
      sortKey: 'transferNo',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 text-sm font-mono">{row.transferNo || '-'}</span>
          <span className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5 font-mono">
            <CalendarDays size={12} className="text-zinc-400" />
            {row.transferDate ? new Date(row.transferDate).toLocaleDateString() : '-'}
          </span>
        </div>
      )
    },
    {
      id: 'sourceWarehouse',
      label: 'Source Warehouse',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-800 text-xs font-medium">
          <MapPin size={13} className="text-zinc-400 shrink-0" />
          <span className="truncate max-w-[200px]" title={warehouseMap.get(row.sourceWarehouseId) || row.sourceWarehouseId}>
            {warehouseMap.get(row.sourceWarehouseId) || row.sourceWarehouseName || (row.sourceWarehouseId ? String(row.sourceWarehouseId).substring(0, 8) + '...' : '-')}
          </span>
        </div>
      )
    },
    {
      id: 'destinationWarehouse',
      label: 'Destination Warehouse',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-800 text-xs font-medium">
          <MapPin size={13} className="text-zinc-400 shrink-0" />
          <span className="truncate max-w-[200px]" title={warehouseMap.get(row.destinationWarehouseId) || row.destinationWarehouseId}>
            {warehouseMap.get(row.destinationWarehouseId) || row.destinationWarehouseName || (row.destinationWarehouseId ? String(row.destinationWarehouseId).substring(0, 8) + '...' : '-')}
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
        if (s === 'RECEIVED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">RECEIVED</span>;
        }
        if (s === 'DISPATCHED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">DISPATCHED</span>;
        }
        if (s === 'REVERSED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">REVERSED</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">{row.status || 'DRAFT'}</span>;
      }
    }
  ], [warehouseMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Dispatched', value: 'DISPATCHED' },
        { label: 'Received', value: 'RECEIVED' },
        { label: 'Reversed', value: 'REVERSED' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Transfer Identification',
      fields: [
        { id: 'transferNo', label: 'Transfer No', placeholder: 'Transfer number' },
        { id: 'sourceWarehouseId', label: 'Source Warehouse ID', placeholder: 'Source warehouse ID' },
        { id: 'destinationWarehouseId', label: 'Destination Warehouse ID', placeholder: 'Destination warehouse ID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/stock-transfers/${row.id}`)),
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
      permission: { module: 'STOCK_TRANSFERS', action: 'UPDATE' },
      onClick: (row) => navigate(buildPath(`/inventory/stock-transfers/${row.id}`)),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'reverse',
      label: 'Reverse',
      icon: RotateCcw,
      permission: { module: 'STOCK_TRANSFERS', action: 'UPDATE' },
      onClick: (row) => handleReverse(row.id),
      tooltip: 'Reverse Transfer',
      className: 'hover:text-amber-600 hover:bg-amber-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'STOCK_TRANSFERS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (doc) => (
    <ExpandedRowDetails data={doc} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Stock Transfers"
        description="Manage inter-warehouse stock transfer orders and shipments"
        icon={ArrowLeftRight}
      >
        <RequirePermission module="STOCK_TRANSFERS" action="CREATE">
          <button onClick={() => navigate('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Transfer</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={stockTransfers || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/stock-transfers/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.transferNo || ''}
          searchPlaceholder="Search transfer number..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('transferNo', val);
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
            totalElements: pageInfo?.totalElements || stockTransfers?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="stock transfers"

          emptyMessage="No stock transfers found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find transfers."
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="stock-transfers-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}