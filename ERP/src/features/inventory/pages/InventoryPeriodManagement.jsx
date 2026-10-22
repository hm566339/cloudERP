import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Calendar, Lock, Unlock
} from 'lucide-react';
import { 
  useInventoryPeriodList, 
  useInventoryPeriodDelete, 
  useInventoryPeriodCreate, 
  useInventoryPeriodUpdate 
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
import InventoryPeriodForm from '../components/InventoryPeriodForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['periodName', 'startDate', 'endDate', 'status', 'closedInfo'];

export default function InventoryPeriodManagement() {
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
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'startDate', defaultSortOrder: 'desc' });

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.periodName && filters.periodName.trim()) q.periodName = filters.periodName.trim();
    if (filters.status && filters.status !== 'All') q.status = filters.status;
    return q;
  }, [filters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'startDate,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { inventoryPeriods, pagination: pageInfo, isLoading, isFetching, refetch } = useInventoryPeriodList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useInventoryPeriodCreate();
  const updateMutation = useInventoryPeriodUpdate();
  const deleteMutation = useInventoryPeriodDelete();

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
        dispatch(addAlert({ type: 'success', message: 'Inventory period updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Inventory period created successfully' }));
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
      'Delete Inventory Period',
      'Are you sure you want to delete this period? This may unlock historical transactions.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Period deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete period' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'periodName',
      label: 'Period Name',
      sortable: true,
      sortKey: 'periodName',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 text-sm">{row.periodName || '-'}</span>
      )
    },
    {
      id: 'startDate',
      label: 'Start Date',
      sortable: true,
      sortKey: 'startDate',
      render: (val, row) => (
        <span className="text-zinc-600 text-xs font-mono">
          {row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'endDate',
      label: 'End Date',
      sortable: true,
      sortKey: 'endDate',
      render: (val, row) => (
        <span className="text-zinc-600 text-xs font-mono">
          {row.endDate ? new Date(row.endDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const isClosed = String(row.status).toLowerCase() === 'closed';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
            isClosed
              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          }`}>
            {isClosed ? <Lock size={11} /> : <Unlock size={11} />}
            {isClosed ? 'CLOSED' : 'OPEN'}
          </span>
        );
      }
    },
    {
      id: 'closedInfo',
      label: 'Closed By / At',
      sortable: false,
      render: (val, row) => (
        String(row.status).toLowerCase() === 'closed' ? (
          <div className="flex flex-col text-[11px] font-mono text-zinc-600">
            <span className="font-medium text-zinc-800">{row.closedBy || 'System'}</span>
            <span className="text-zinc-400 text-[10px]">
              {row.closedAt ? new Date(row.closedAt).toLocaleString() : '-'}
            </span>
          </div>
        ) : (
          <span className="text-zinc-400 italic text-xs">-</span>
        )
      )
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Open', value: 'Open' },
        { label: 'Closed', value: 'Closed' },
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Period Identification',
      fields: [
        { id: 'periodName', label: 'Period Name', placeholder: 'e.g. FY2024-Q1' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/periods/${row.id}`)),
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
      permission: { module: 'INVENTORY_PERIODS', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'INVENTORY_PERIODS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (period) => (
    <ExpandedRowDetails data={period} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Inventory Periods"
        description="Manage fiscal inventory accounting periods and closing locks"
        icon={Calendar}
      >
        <RequirePermission module="INVENTORY_PERIODS" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Period</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={inventoryPeriods || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/periods/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.periodName || ''}
          searchPlaceholder="Search period name..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('periodName', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create period "${val}"`,
            description: 'Add as new inventory period',
            onCreate: (searchTerm) => handleOpenFormModal({ periodName: searchTerm })
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
            totalElements: pageInfo?.totalElements || inventoryPeriods?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="inventory periods"

          emptyMessage="No inventory periods found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find periods."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Inventory Period' : 'New Inventory Period'}
        maxWidth="max-w-lg"
      >
        <InventoryPeriodForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="inventory-periods-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}