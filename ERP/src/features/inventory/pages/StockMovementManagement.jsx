import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Calendar, ArrowLeftRight
} from 'lucide-react';
import { 
  useStockMovementList, 
  useStockMovementDelete, 
  useStockMovementCreate, 
  useStockMovementUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import Modal from '../../../components/common/Modal';
import StockMovementForm from '../components/StockMovementForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const MOVEMENT_TYPES = [
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'IN', label: 'In' },
  { value: 'OUT', label: 'Out' },
  { value: 'OPENING', label: 'Opening' }
];

const DEFAULT_COLUMNS = [
  'movementNo',
  'movementType',
  'reference',
  'totalQuantity',
  'totalValue',
  'status'
];

export default function StockMovementManagement() {
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
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.movementNo && filters.movementNo.trim()) q.movementNo = filters.movementNo.trim();
    if (filters.movementType && filters.movementType.trim()) q.movementType = filters.movementType.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    if (filters.referenceNumber && filters.referenceNumber.trim()) q.referenceNumber = filters.referenceNumber.trim();
    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { stockMovements, pagination: pageInfo, isLoading, isFetching, refetch } = useStockMovementList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useStockMovementCreate();
  const updateMutation = useStockMovementUpdate();
  const deleteMutation = useStockMovementDelete();

  const handleOpenFormModal = (initialData = null) => {
    if (initialData && initialData.nativeEvent) {
      initialData = null;
    }
    setInitialFormData(initialData);
    setIsFormModalOpen(true);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      if (initialFormData?.id) {
        await updateMutation.mutateAsync([initialFormData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Movement header updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Movement header created successfully' }));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Operation failed' }));
    }
  };

  const handleDelete = async (id) => {
    confirmDialog(
      'Delete Movement',
      'Are you sure you want to delete this movement header? Associated lines may also be affected.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Movement deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete movement' }));
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
      id: 'movementNo',
      label: 'Movement No',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 font-mono text-xs">
            {row.movementNo || '-'}
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
            <Calendar size={11} className="text-zinc-400 shrink-0" />
            <span>{row.movementDate ? new Date(row.movementDate).toLocaleDateString() : '-'}</span>
          </span>
        </div>
      )
    },
    {
      id: 'movementType',
      label: 'Movement Type',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.movementType || '-'}</span>
      )
    },
    {
      id: 'reference',
      label: 'Reference',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-xs text-zinc-800 font-mono">
            {row.referenceNumber || '-'}
          </span>
          {row.referenceType && (
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{row.referenceType}</span>
          )}
        </div>
      )
    },
    {
      id: 'totalQuantity',
      label: 'Total Qty',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {row.totalQuantity ?? 0}
        </span>
      )
    },
    {
      id: 'totalValue',
      label: 'Total Value',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {typeof row.totalValue === 'number' 
            ? row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (row.totalValue ? Number(row.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
        </span>
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
      id: 'movementType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        ...MOVEMENT_TYPES
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Posted', value: 'POSTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Reversed', value: 'REVERSED' }
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Reference & Identification',
      fields: [
        { id: 'referenceNumber', label: 'Reference Number', placeholder: 'Search reference...' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/stock-movements/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'INVENTORY', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'INVENTORY', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (mov) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Movement No</span>
        <p className="text-sm font-semibold text-zinc-900">{mov.movementNo || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Movement Type</span>
        <p className="text-sm font-semibold text-zinc-900">{mov.movementType || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Date</span>
        <p className="text-sm font-medium text-zinc-700">{mov.movementDate ? new Date(mov.movementDate).toLocaleDateString() : '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Status</span>
        <div>
          <DataTableStatusBadge status={mov.status} />
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Reference</span>
        <p className="text-sm font-medium text-zinc-700 font-mono">{mov.referenceType ? `${mov.referenceType}: ` : ''}{mov.referenceNumber || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Total Quantity</span>
        <p className="text-sm font-medium text-zinc-900 font-mono">{mov.totalQuantity ?? 0}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Total Value</span>
        <p className="text-sm font-medium text-zinc-900 font-mono">
          {typeof mov.totalValue === 'number' 
            ? mov.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (mov.totalValue ? Number(mov.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
        </p>
      </div>
      {mov.remarks && (
        <div className="space-y-1 col-span-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Remarks</span>
          <p className="text-sm font-medium text-zinc-700">{mov.remarks}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Stock Movements"
        description="Manage stock movement transaction headers and metadata"
        icon={ArrowLeftRight}
      >
        <RequirePermission module="INVENTORY" action="CREATE">
          <button onClick={() => handleOpenFormModal(null)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Movement</span>
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
          data={stockMovements || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/stock-movements/${row.id}`))}

          // Search
          searchable
          searchValue={filters.movementNo || ''}
          searchPlaceholder="Search Movement No..."
          onSearchChange={(val) => setFilter('movementNo', val)}

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
            totalElements: pageInfo?.totalElements || stockMovements?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="stock movements"

          // Empty State
          emptyMessage="No stock movements found"
          emptyDescription="There are no movement headers matching your search criteria."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Movement Header' : 'New Movement Header'}
        maxWidth="max-w-2xl"
      >
        <StockMovementForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="stockmovement-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
        totalItems={pageInfo?.totalElements || stockMovements?.length || 0}
      />
    </div>
  );
}