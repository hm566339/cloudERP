import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, PackageOpen, MapPin, CalendarDays
} from 'lucide-react';
import { 
  useOpeningStockList, 
  useOpeningStockDelete,
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

const DEFAULT_COLUMNS = ['openingStockNo', 'openingDate', 'warehouse', 'status', 'remarks'];

export default function OpeningStockManagement() {
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
    if (filters.openingStockNo && filters.openingStockNo.trim()) q.openingStockNo = filters.openingStockNo.trim();
    if (filters.warehouseId && filters.warehouseId.trim()) q.warehouseId = filters.warehouseId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'createdAt,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { openingStocks, pagination: pageInfo, isLoading, isFetching, refetch } = useOpeningStockList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const deleteMutation = useOpeningStockDelete();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    confirmDialog(
      'Delete Opening Stock Document',
      'Are you sure you want to delete this opening stock document? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Document deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete document' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'openingStockNo',
      label: 'Document No',
      sortable: true,
      sortKey: 'openingStockNo',
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-900 font-bold border border-zinc-200/60 inline-flex items-center gap-1.5">
          <PackageOpen size={12} className="text-zinc-400" />
          {row.openingStockNo || '-'}
        </span>
      )
    },
    {
      id: 'openingDate',
      label: 'Document Date',
      sortable: true,
      sortKey: 'openingDate',
      render: (val, row) => (
        <span className="text-zinc-600 text-xs font-mono inline-flex items-center gap-1">
          <CalendarDays size={12} className="text-zinc-400" />
          {row.openingDate ? new Date(row.openingDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      sortable: false,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-800 text-xs font-medium">
          <MapPin size={13} className="text-zinc-400 shrink-0" />
          <span className="truncate max-w-[200px]" title={warehouseMap.get(row.warehouseId) || row.warehouseId}>
            {warehouseMap.get(row.warehouseId) || row.warehouseName || (row.warehouseId ? String(row.warehouseId).substring(0, 8) + '...' : '-')}
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
        if (s === 'APPROVED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">APPROVED</span>;
        }
        if (s === 'SUBMITTED') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">SUBMITTED</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">{row.status || 'DRAFT'}</span>;
      }
    },
    {
      id: 'remarks',
      label: 'Remarks',
      sortable: false,
      render: (val, row) => (
        <span className="text-zinc-500 text-xs truncate max-w-xs block" title={row.remarks}>
          {row.remarks || '-'}
        </span>
      )
    }
  ], [warehouseMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Document Identification',
      fields: [
        { id: 'openingStockNo', label: 'Document No', placeholder: 'Opening stock number' },
        { id: 'warehouseId', label: 'Warehouse ID', placeholder: 'Warehouse ID or UUID' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/opening-stocks/${row.id}`)),
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
      permission: { module: 'OPENING_STOCK', action: 'UPDATE' },
      onClick: (row) => navigate(buildPath(`/inventory/opening-stocks/${row.id}`)),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'OPENING_STOCK', action: 'DELETE' },
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
        title="Opening Stock"
        description="Initialize and manage initial physical inventory counts per warehouse"
        icon={PackageOpen}
      >
        <RequirePermission module="OPENING_STOCK" action="CREATE">
          <button onClick={() => navigate(buildPath('/inventory/opening-stocks/new'))} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Opening Stock</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={openingStocks || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/opening-stocks/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.openingStockNo || ''}
          searchPlaceholder="Search document number..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('openingStockNo', val);
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
            totalElements: pageInfo?.totalElements || openingStocks?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="opening stocks"

          emptyMessage="No opening stock documents found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find documents."
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="opening-stock-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}