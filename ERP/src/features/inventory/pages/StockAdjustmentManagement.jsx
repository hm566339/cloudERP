import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Calendar
} from 'lucide-react';
import { 
  useStockAdjustmentList, 
  useStockAdjustmentDelete 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import StockAdjustmentFormModal from '../components/StockAdjustmentFormModal';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = [
  'adjustmentNo',
  'adjustmentDate',
  'warehouseId',
  'reason',
  'status'
];

export default function StockAdjustmentManagement() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.adjustmentNo && filters.adjustmentNo.trim()) q.adjustmentNo = filters.adjustmentNo.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : (apiParams.sort ? `${apiParams.sort},${apiParams.direction || 'desc'}` : 'createdAt,desc')
  }), [page, apiParams.size, sortBy, sortOrder, apiParams.sort, apiParams.direction]);

  const { stockAdjustments, pagination: pageInfo, isLoading, isFetching, refetch } = useStockAdjustmentList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const deleteMutation = useStockAdjustmentDelete();

  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleEdit = (id) => {
    navigate(buildPath(`/inventory/stock-adjustments/${id}`));
  };

  const handleDelete = async (id) => {
    confirmDialog(
      'Delete Stock Adjustment',
      'Are you sure you want to delete this stock adjustment? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Stock adjustment deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete stock adjustment' }));
        }
      }
    );
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const columns = useMemo(() => [
    {
      id: 'adjustmentNo',
      label: 'Adjustment No',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.adjustmentNo || '-'}
        </span>
      )
    },
    {
      id: 'adjustmentDate',
      label: 'Date',
      sortable: true,
      render: (val, row) => (
        <span className="text-sm font-medium text-zinc-800 flex items-center gap-1.5">
          <Calendar size={12} className="text-zinc-400 shrink-0" />
          <span>{row.adjustmentDate ? new Date(row.adjustmentDate).toLocaleDateString() : '-'}</span>
        </span>
      )
    },
    {
      id: 'warehouseId',
      label: 'Warehouse',
      sortable: true,
      render: (val, row) => (
        <span className="text-zinc-800 font-medium">
          {row.warehouseName || row.warehouseId || '-'}
        </span>
      )
    },
    {
      id: 'reason',
      label: 'Reason',
      sortable: true,
      render: (val, row) => (
        <span className="font-medium text-zinc-700">{row.reason || '-'}</span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Warehouse & Location',
      fields: [
        { id: 'warehouseId', label: 'Warehouse ID', placeholder: 'Search Warehouse ID...' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/stock-adjustments/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'STOCK_ADJUSTMENTS', action: 'UPDATE' },
      onClick: (row) => handleEdit(row.id),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'STOCK_ADJUSTMENTS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (adj) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Adjustment No</span>
        <p className="text-sm font-semibold text-zinc-900">{adj.adjustmentNo || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Date</span>
        <p className="text-sm font-medium text-zinc-700">{adj.adjustmentDate ? new Date(adj.adjustmentDate).toLocaleDateString() : '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Warehouse</span>
        <p className="text-sm font-medium text-zinc-700 font-mono">{adj.warehouseName || adj.warehouseId || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reason</span>
        <p className="text-sm font-medium text-zinc-700">{adj.reason || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
        <div>
          <DataTableStatusBadge status={adj.status} />
        </div>
      </div>
      {adj.remarks && (
        <div className="space-y-1 col-span-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Remarks</span>
          <p className="text-sm font-medium text-zinc-700">{adj.remarks}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Stock Adjustments"
        description="Manage manual stock adjustments for damages, shrinkage, or corrections"
      >
        <RequirePermission module="STOCK_ADJUSTMENTS" action="CREATE">
          <button 
            onClick={handleCreateNew}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Adjustment</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={stockAdjustments || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.adjustmentNo || ''}
          searchPlaceholder="Search Adjustment No..."
          onSearchChange={(val) => setFilter('adjustmentNo', val)}

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
            totalElements: pageInfo?.totalElements || stockAdjustments?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="stock adjustments"

          // Empty State
          emptyMessage="No stock adjustments found"
          emptyDescription="There are no stock adjustments matching your search criteria."
        />
      </div>

      <StockAdjustmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          dispatch(addAlert({ type: 'success', message: 'Stock adjustment created successfully' }));
          refetch();
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="stockadjustment-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
        totalItems={pageInfo?.totalElements || stockAdjustments?.length || 0}
      />
    </div>
  );
}