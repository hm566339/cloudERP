import React, { useState, useMemo, useEffect } from 'react';
import { Percent, Download, Plus, Edit, Trash2, Eye, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { gstSlabsApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';

import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';
import { confirmDialog } from '../../../utils/confirmDialog';
import GstSlabFormModal from '../components/GstSlabFormModal';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import PageHeader from '../../../components/common/PageHeader';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const GstSlabOverview = ({ slab }) => {
  const total = (slab.cgstRate || 0) + (slab.sgstRate || 0) + (slab.igstRate || 0) + (slab.cessRate || 0);
  
  return (
    <div className="p-5 flex flex-col bg-zinc-50/50 rounded-lg border-t border-zinc-200">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GST Rate</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{total}%</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">CGST</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.cgstRate != null ? `${slab.cgstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">SGST</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.sgstRate != null ? `${slab.sgstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">IGST</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">{slab.igstRate != null ? `${slab.igstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">CESS</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.cessRate != null ? `${slab.cessRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
          <div className="mt-1">
            <DataTableStatusBadge status={!slab.deleted} customLabels={{ true: 'ACTIVE', false: 'INACTIVE' }} />
          </div>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Effective From</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.effectiveFrom ? new Date(slab.effectiveFrom).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Effective To</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">—</p>
        </div>
        <div className="col-span-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Description</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.slabName || 'Standard GST slab'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created At</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.createdAt ? new Date(slab.createdAt).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Updated At</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{slab.updatedAt ? new Date(slab.updatedAt).toLocaleDateString() : '-'}</p>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_COLUMNS = ['totalRate', 'cgstRate', 'sgstRate', 'igstRate', 'cessRate', 'deleted', 'effectiveFrom'];

const GstSlabs = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    filters,
    setFilter: handleFilterChange,
    handleColumnSort: handleSort,
    page,
    pageSize,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    sortBy,
    sortOrder,
    resetFilters
  } = useUrlFilters({
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc'
  });

  const { data: slabsData, isLoading, refetch, isFetching } = useApiQuery(gstSlabsApi.getGstSlabs, {
    companyId,
    searchKey: filters.searchKey || '',
    slabName: filters.slabName,
    isDeleted: filters.isDeleted === 'true' ? true : filters.isDeleted === 'false' ? false : undefined,
    minTotalRate: filters.minTotalRate,
    maxTotalRate: filters.maxTotalRate,
    effectiveFromStart: filters.effectiveFromStart,
    effectiveFromEnd: filters.effectiveFromEnd,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    updatedFrom: filters.updatedFrom,
    updatedTo: filters.updatedTo,
    page,
    size: pageSize,
    sortBy,
    sortDir: sortOrder
  }, {
    enabled: !!companyId
  });

  let gstSlabs = slabsData?.data?.data?.gstSlabs || slabsData?.data?.gstSlabs || slabsData?.gstSlabs || [];
  const pageInfo = slabsData?.data?.paginationResponse || slabsData?.paginationResponse || slabsData?.pagination || {};

  if (filters.minTotalRate !== undefined || filters.maxTotalRate !== undefined) {
    gstSlabs = gstSlabs.filter(slab => {
      const total = (slab.cgstRate || 0) + (slab.sgstRate || 0) + (slab.igstRate || 0) + (slab.cessRate || 0);
      const min = filters.minTotalRate !== undefined && filters.minTotalRate !== '' ? parseFloat(filters.minTotalRate) : 0;
      const max = filters.maxTotalRate !== undefined && filters.maxTotalRate !== '' ? parseFloat(filters.maxTotalRate) : Infinity;
      return total >= min && total <= max;
    });
  }

  const [deleteSlabMutation] = useApiMutation((args) => gstSlabsApi.deleteGstSlab(args.id));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);

  const handleReset = () => {
    resetFilters();
    handlePageChange(0);
    setSelectedRows([]);
  };

  const handleOpenModal = (slab = null) => {
    if (slab && slab.nativeEvent) {
      slab = null;
    }
    setEditingSlab(slab);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const handleDelete = async (record) => {
    confirmDialog(
      'Delete GST Slab',
      `Are you sure you want to delete GST slab ${record.slabName || 'Standard'}?`,
      async () => {
        try {
          await deleteSlabMutation.mutateAsync({ id: record.id });
          dispatch(addAlert({ type: 'success', message: 'GST Slab deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete GST slab' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'totalRate',
      label: 'GST Rate',
      sortable: true,
      render: (val, row) => {
        const total = (row.cgstRate || 0) + (row.sgstRate || 0) + (row.igstRate || 0) + (row.cessRate || 0);
        return <span className="font-semibold text-[11.2px] text-zinc-900">{total}%</span>;
      }
    },
    {
      id: 'cgstRate',
      label: 'CGST',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-zinc-600">{row.cgstRate != null ? `${row.cgstRate}%` : '-'}</span>
    },
    {
      id: 'sgstRate',
      label: 'SGST',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-zinc-600">{row.sgstRate != null ? `${row.sgstRate}%` : '-'}</span>
    },
    {
      id: 'igstRate',
      label: 'IGST',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-zinc-600">{row.igstRate != null ? `${row.igstRate}%` : '-'}</span>
    },
    {
      id: 'cessRate',
      label: 'CESS',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-zinc-600">{row.cessRate != null ? `${row.cessRate}%` : '-'}</span>
    },
    {
      id: 'deleted',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={!row.deleted} customLabels={{ true: 'ACTIVE', false: 'INACTIVE' }} />
    },
    {
      id: 'effectiveFrom',
      label: 'Effective From',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600">{row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString() : '-'}</span>
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'isDeleted',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'false' },
        { label: 'Inactive', value: 'true' }
      ]
    }
  ], []);
  
  const advancedFilters = useMemo(() => [
    {
      id: 'taxType',
      label: 'Tax Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' }
      ]
    },
    {
      id: 'effectiveFromStart',
      label: 'Effective From',
      type: 'date'
    },
    {
      id: 'effectiveFromEnd',
      label: 'Effective To',
      type: 'date'
    },
    {
      id: 'minTotalRate',
      label: 'Min GST Rate',
      type: 'number',
      placeholder: 'Min Rate'
    },
    {
      id: 'maxTotalRate',
      label: 'Max GST Rate',
      type: 'number',
      placeholder: 'Max Rate'
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/gst-slabs/${row.id}`)),
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
      icon: Edit,
      permission: { module: 'TAX_SETTINGS', action: 'UPDATE' },
      onClick: (row) => handleOpenModal(row),
      tooltip: 'Edit Slab',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'TAX_SETTINGS', action: 'DELETE' },
      onClick: (row) => handleDelete(row),
      tooltip: 'Delete Slab',
      show: (row) => !row.deleted
    }
  ], [navigate, buildPath]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="GST Slabs"
        description="Manage GST tax rates and slab configurations."
        icon={Percent}
      >
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
          <Printer size={14} />
          <span>Print</span>
        </button>
        <RequirePermission module="TAX_SETTINGS" action="CREATE">
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Slab</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={gstSlabs}
          rowKey={(row) => row.id}
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search GST slabs..."
          onSearchChange={(val) => handleFilterChange('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new slab',
            onCreate: (searchTerm) => handleOpenModal({ slabName: searchTerm })
          }}
          
          filters={basicFilters}
          advancedFilters={advancedFilters}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}
          
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleSort(key)}
          
          rowActions={rowActions}
          
          expandedRowId={expandedRowId}
          onToggleExpand={setExpandedRowId}
          renderExpandedRow={(row) => <GstSlabOverview slab={row} />}
          
          pagination={{
            page: pageInfo.page || 0,
            pageSize: pageInfo.size || 10,
            totalPages: pageInfo.totalPages || 1,
            totalElements: pageInfo.totalElements || gstSlabs.length
          }}
          pageIndexBase={0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemName="GST Slabs"
          
          emptyMessage="No GST slabs found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find GST slabs."
        />
      </div>

      <GstSlabFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialData={editingSlab}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gst-slabs"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
};

export default GstSlabs;
