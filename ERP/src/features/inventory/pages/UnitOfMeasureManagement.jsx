import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, Scale, Tag
} from 'lucide-react';
import { 
  useUnitOfMeasureList, 
  useUnitOfMeasureDelete, 
  useUnitOfMeasureCreate, 
  useUnitOfMeasureUpdate 
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
import UnitOfMeasureForm from '../components/UnitOfMeasureForm';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';

const DEFAULT_COLUMNS = ['code', 'name', 'decimalPlaces', 'isActive', 'createdAt'];

export default function UnitOfMeasureManagement() {
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
    if (filters.code && filters.code.trim()) q.code = filters.code.trim();
    if (filters.name && filters.name.trim()) q.name = filters.name.trim();
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

  const { unitOfMeasures, pagination: pageInfo, isLoading, isFetching, refetch } = useUnitOfMeasureList(
    queryFilters,
    pageable,
    { keepPreviousData: true }
  );

  const createMutation = useUnitOfMeasureCreate();
  const updateMutation = useUnitOfMeasureUpdate();
  const deleteMutation = useUnitOfMeasureDelete();

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
        dispatch(addAlert({ type: 'success', message: 'Unit of Measure updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Unit of Measure created successfully' }));
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
      'Delete Unit of Measure',
      'Are you sure you want to delete this Unit of Measure? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Unit of Measure deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete UoM' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
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
      id: 'name',
      label: 'Name',
      sortable: true,
      sortKey: 'name',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 text-sm">{row.name || '-'}</span>
      )
    },
    {
      id: 'decimalPlaces',
      label: 'Decimal Places',
      sortable: true,
      sortKey: 'decimalPlaces',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
          {row.decimalPlaces !== undefined && row.decimalPlaces !== null ? row.decimalPlaces : 0}
        </span>
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
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      sortable: true,
      sortKey: 'createdAt',
      render: (val, row) => (
        <span className="text-zinc-500 text-xs">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </span>
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
      title: 'Unit Identification',
      fields: [
        { id: 'code', label: 'Unit Code', placeholder: 'e.g. KG, PCS' },
        { id: 'name', label: 'Unit Name', placeholder: 'Unit name' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/inventory/unit-of-measures/${row.id}`)),
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
      permission: { module: 'UNIT_OF_MEASURES', action: 'UPDATE' },
      onClick: (row) => handleOpenFormModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'UNIT_OF_MEASURES', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  const renderExpandedRow = (uom) => (
    <ExpandedRowDetails data={uom} bare />
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Units of Measure"
        description="Manage units of measure used across your inventory and products"
        icon={Scale}
      >
        <RequirePermission module="UNIT_OF_MEASURES" action="CREATE">
          <button onClick={() => handleOpenFormModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New UOM</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={unitOfMeasures || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          onRowClick={(row) => navigate(buildPath(`/inventory/unit-of-measures/${row.id}`))}

          searchable
          searchValue={filters.searchKey || filters.name || ''}
          searchPlaceholder="Search units..."
          onSearchChange={(val) => {
            setFilter('searchKey', val);
            setFilter('name', val);
          }}
          createOption={{
            enabled: true,
            label: (val) => `Create UOM "${val}"`,
            description: 'Add as new unit of measure',
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
            totalElements: pageInfo?.totalElements || unitOfMeasures?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="units of measure"

          emptyMessage="No units of measure found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find units of measure."
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={initialFormData ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
        maxWidth="max-w-md"
      >
        <UnitOfMeasureForm
          initialData={initialFormData}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="units-of-measure-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}