import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { hsnSacMasterApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';

import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import GstSlabSelect from '../../../components/common/GstSlabSelect';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExportModal from '../../../components/common/ExportModal';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import PageHeader from '../../../components/common/PageHeader';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const HsnSacOverview = ({ item }) => {
  return (
    <div className="p-5 flex flex-col bg-zinc-50/50 rounded-lg border-t border-zinc-200">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">CGST Rate</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.cgstRate != null ? `${item.cgstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">SGST Rate</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.sgstRate != null ? `${item.sgstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">IGST Rate</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">{item.igstRate != null ? `${item.igstRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">CESS Rate</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.cessRate != null ? `${item.cessRate}%` : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Item Mappings</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.itemMappingCount || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Invoice Usages</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.invoiceUsageCount || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Tax Transactions</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.taxTransactionCount || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created At</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Updated At</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</p>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_COLUMNS = ['code', 'description', 'type', 'gstSlabName', 'deleted'];

const HsnSacMaster = () => {
  const { buildPath } = useRoutePath();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  
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

  const { data: hsnData, isLoading, refetch, isFetching } = useApiQuery(hsnSacMasterApi.getHsnSacList, {
    companyId,
    searchKey: filters.searchKey || '',
    code: filters.code,
    type: filters.type,
    gstSlabId: filters.gstSlabId,
    isDeleted: filters.isDeleted === 'true' ? true : filters.isDeleted === 'false' ? false : undefined,
    page,
    size: pageSize,
    sortBy,
    sortDir: sortOrder
  }, {
    enabled: !!companyId
  });

  const hsnSacs = hsnData?.data?.data?.hsnSacMasters || hsnData?.data?.hsnSacMasters || hsnData?.hsnSacMasters || [];
  const pageInfo = hsnData?.data?.paginationResponse || hsnData?.paginationResponse || hsnData?.pagination || {};
  const metadata = hsnData?.data?.metadata || hsnData?.metadata || {};

  const createHsnSacMutation = useApiMutation(hsnSacMasterApi.createHsnSac);
  const updateHsnSacMutation = useApiMutation(hsnSacMasterApi.updateHsnSac);
  const deleteHsnSacMutation = useApiMutation(hsnSacMasterApi.deleteHsnSac);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'HSN',
    gstSlabId: ''
  });

  const handleReset = () => {
    resetFilters();
    handlePageChange(0);
    setSelectedRows([]);
  };

  const handleOpenModal = (item = null) => {
    if (item && item.nativeEvent) {
      item = null;
    }
    if (item && !item.code && typeof item === 'object') {
      // It's prefill data from createOption
      setEditingId(null);
      setFormData({
        code: item.code || '',
        description: item.description || '',
        type: 'HSN',
        gstSlabId: ''
      });
    } else if (item) {
      setEditingId(item.id);
      setFormData({
        code: item.code || '',
        description: item.description || '',
        type: item.type || 'HSN',
        gstSlabId: item.gstSlabId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        description: '',
        type: 'HSN',
        gstSlabId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const codeValue = formData.code?.trim() || null;
      const payload = {
        data: {
          code: codeValue,
          description: formData.description,
          type: formData.type,
          gstSlabId: formData.gstSlabId
        }
      };

      if (editingId) {
        await updateHsnSacMutation.mutateAsync({ hsnSacId: editingId, data: payload });
      } else {
        await createHsnSacMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      dispatch(addAlert({ type: 'success', message: `HSN/SAC ${editingId ? 'updated' : 'created'} successfully` }));
      refetch();
    } catch (err) {
      console.error('Failed to save HSN/SAC:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Validation failed' }));
    }
  };

  const handleDelete = async (record) => {
    confirmDialog(
      'Delete HSN/SAC Master',
      `Are you sure you want to delete ${record.code}?`,
      async () => {
        try {
          await deleteHsnSacMutation.mutateAsync(record.id);
          dispatch(addAlert({ type: 'success', message: 'HSN/SAC deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to delete HSN/SAC' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      render: (val, row) => <span className="font-mono text-sm font-semibold text-zinc-900">{row.code}</span>
    },
    {
      id: 'description',
      label: 'Description',
      sortable: true,
      render: (val, row) => <div className="text-[10.4px] text-zinc-800 line-clamp-1 truncate" title={row.description}>{row.description || '-'}</div>
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      render: (val, row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${
          row.type === 'HSN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}>
          {row.type}
        </span>
      )
    },
    {
      id: 'gstSlabName',
      label: 'GST Rate',
      sortable: true,
      render: (val, row) => <span className="text-[10.4px] font-medium text-zinc-800">{row.gstSlabName || '—'}</span>
    },
    {
      id: 'deleted',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={!row.deleted} customLabels={{ true: 'ACTIVE', false: 'INACTIVE' }} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        { label: 'HSN (Goods)', value: 'HSN' },
        { label: 'SAC (Services)', value: 'SAC' }
      ]
    },
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
      id: 'code',
      label: 'Specific Code',
      type: 'text',
      placeholder: 'Search by Code...'
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/hsn-sac/${row.id}`)),
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
      tooltip: 'Edit',
      className: 'hover:text-emerald-600 hover:bg-emerald-50',
      show: (row) => !row.deleted
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'TAX_SETTINGS', action: 'DELETE' },
      onClick: (row) => handleDelete(row),
      tooltip: 'Delete',
      show: (row) => !row.deleted
    }
  ], [navigate, buildPath]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="HSN / SAC Master"
        description="Manage Harmonized System of Nomenclature (HSN) and Service Accounting Codes (SAC)."
        icon={Tag}
      >
        <Link to={buildPath("/accounts/reports/gst/hsn-summary")} className="btn-secondary flex items-center gap-2">HSN Report</Link>
        <Link to={buildPath("/accounts/reports/gst/sac-summary")} className="btn-secondary flex items-center gap-2">SAC Report</Link>
        <RequirePermission module="TAX_SETTINGS" action="CREATE">
          <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Add HSN / SAC</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={hsnSacs}
          rowKey={(row) => row.id}
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search HSN / SAC code or description..."
          onSearchChange={(val) => handleFilterChange('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new code',
            onCreate: (searchTerm) => handleOpenModal({ code: searchTerm, description: searchTerm })
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
          renderExpandedRow={(row) => <HsnSacOverview item={row} />}
          
          pagination={{
            page: pageInfo.page ?? pageInfo.currentPage ?? page,
            pageSize: pageInfo.size ?? pageInfo.pageSize ?? pageSize,
            totalPages: pageInfo.totalPages || 1,
            totalElements: pageInfo.totalElements ?? pageInfo.totalCount ?? hsnSacs.length
          }}
          pageIndexBase={0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemName="HSN/SAC codes"
          
          emptyMessage="No HSN / SAC codes found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find codes."
          customAdvancedFilterRender={() => (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div>
                <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                  GST Slab
                </label>
                <GstSlabSelect
                  value={filters.gstSlabId || ''}
                  onChange={(e) => handleFilterChange('gstSlabId', e.target.value)}
                />
              </div>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit HSN/SAC Master' : 'New HSN/SAC Master'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type *</label>
              <CustomSelect
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={[
                  { value: "HSN", label: "HSN (Goods)" },
                  { value: "SAC", label: "SAC (Services)" }
                ]}
                searchable={false}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field w-full"
                placeholder="e.g., Management consulting services"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">GST Slab *</label>
              <GstSlabSelect
                name="gstSlabId"
                value={formData.gstSlabId}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createHsnSacMutation.isPending || updateHsnSacMutation.isPending}
              className="btn-primary"
            >
              {createHsnSacMutation.isPending || updateHsnSacMutation.isPending ? 'Saving...' : 'Save HSN/SAC'}
            </button>
          </div>
        </form>
      </Modal>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="hsn-sac"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
};

export default HsnSacMaster;
