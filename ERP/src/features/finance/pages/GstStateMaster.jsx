import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Edit2, Trash2, Eye, MapPin, Printer } from 'lucide-react';
import { useGetGstStatesQuery, useDeleteGstStateMutation } from '../../../api/account/accounting.api';
import GstStateFormModal from '../components/GstStateFormModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

const TYPE_OPTIONS = [
  { value: 'STATE', label: 'State' },
  { value: 'UNION_TERRITORY', label: 'Union Territory' }
];

const getStatusBadge = (active) => {
  return <DataTableStatusBadge status={active} />;
};

const getTypeBadge = (isUnionTerritory) => {
  if (isUnionTerritory) {
    return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-[#4C8DFF] dark:border-blue-500/20">Union Territory</span>;
  }
  return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]">State</span>;
};

const StateOverview = ({ stateData }) => {
  return (
    <div className="p-5 flex flex-col bg-zinc-50/50 dark:bg-[#1D212C] rounded-lg border-t border-zinc-200 dark:border-[#2A2F3D]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">{stateData.stateName || '-'}</h3>
          <p className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] font-medium tracking-wide mt-1">
            Display Name: <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">{stateData.displayName || '-'}</span> | 
            Code: <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">{stateData.stateCode || '-'}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Country Code</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{stateData.countryCode || 'IN'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Classification</p>
          <div>{getTypeBadge(stateData.unionTerritory !== undefined ? stateData.unionTerritory : stateData.isUnionTerritory)}</div>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Status</p>
          <div>{getStatusBadge(stateData.active)}</div>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_COLUMNS = ['stateCode', 'stateName', 'displayName', 'countryCode', 'unionTerritory', 'active'];

export default function GstStateMaster() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

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
    defaultSortBy: 'stateCode',
    defaultSortOrder: 'asc'
  });

  const apiParams = useMemo(() => {
    const params = { 
      page,
      size: pageSize,
      sortBy,
      sortOrder,
      search: filters.searchKey || ''
    };
    if (filters.unionTerritory === 'true') params.unionTerritory = true;
    else if (filters.unionTerritory === 'false') params.unionTerritory = false;
    
    if (filters.active === 'true') params.active = true;
    else if (filters.active === 'false') params.active = false;
    
    return params;
  }, [filters, page, pageSize, sortBy, sortOrder]);

  const { data: statesData, isLoading, refetch, isFetching } = useGetGstStatesQuery(apiParams);
  const [deleteGstState] = useDeleteGstStateMutation();

  let gstStates = [];
  if (Array.isArray(statesData)) {
    gstStates = statesData;
  } else if (statesData?.data?.records) {
    gstStates = statesData.data.records;
  } else if (statesData?.records) {
    gstStates = statesData.records;
  } else if (statesData?.data?.states) {
    gstStates = statesData.data.states;
  } else if (statesData?.states) {
    gstStates = statesData.states;
  }
  
  if (filters.unionTerritory !== '' && filters.unionTerritory !== undefined) {
    const isUt = filters.unionTerritory === 'true';
    gstStates = gstStates.filter(s => {
      const utValue = s.unionTerritory !== undefined ? s.unionTerritory : s.isUnionTerritory;
      return String(utValue) === String(isUt);
    });
  }

  const paginationInfo = statesData?._pageInfo || statesData?.pagination || statesData?.data?.pagination || { totalPages: 1, totalElements: gstStates.length };

  const handleReset = () => {
    resetFilters();
    handlePageChange(0);
    setSelectedRows([]);
  };

  const handleEdit = (stateData) => {
    setEditData(stateData);
    setIsModalOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setEditData(prefillData);
    setIsModalOpen(true);
  };

  const handleDelete = (id, stateName) => {
    confirmDialog(
      'Delete GST State',
      `Are you sure you want to delete the GST State Code for ${stateName}?`,
      async () => {
        try {
          await deleteGstState({ id, companyId }).unwrap();
          dispatch(addAlert({ type: 'success', message: 'GST State deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete GST State' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'stateCode',
      label: 'State Code',
      sortable: true,
      render: (val, row) => <span className="font-semibold text-zinc-900 truncate">{row.stateCode}</span>
    },
    {
      id: 'stateName',
      label: 'State Name',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700 truncate font-medium">{row.stateName}</span>
    },
    {
      id: 'displayName',
      label: 'Display Name',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700 truncate">{row.displayName || '-'}</span>
    },
    {
      id: 'countryCode',
      label: 'Country Code',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700 uppercase">{row.countryCode || 'IN'}</span>
    },
    {
      id: 'unionTerritory',
      label: 'Union Territory',
      sortable: true,
      render: (val, row) => getTypeBadge(row.unionTerritory !== undefined ? row.unionTerritory : row.isUnionTerritory)
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => getStatusBadge(row.active)
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'active',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        ...STATUS_OPTIONS
      ]
    },
    {
      id: 'unionTerritory',
      label: 'Territory Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        ...TYPE_OPTIONS.map(opt => ({
          label: opt.label,
          value: opt.value === 'UNION_TERRITORY' ? 'true' : 'false'
        }))
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/tax/gst-state-master/${row.id || row.stateCode}`)),
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
      permission: { module: 'GST_MASTER', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit State',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'GST_MASTER', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id || row.stateCode, row.stateName),
      tooltip: 'Delete State'
    }
  ], [navigate, buildPath]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="GST State Master"
        description="Manage GST State Codes and Union Territories used across the ERP."
      >
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
          <Printer size={14} />
          <span>Print</span>
        </button>
        <RequirePermission module="GST_MASTER" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New State</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={gstStates}
          rowKey={(row) => row.id || row.stateCode}
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by state code or name..."
          onSearchChange={(val) => handleFilterChange('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new state',
            onCreate: (searchTerm) => handleCreate({ stateName: searchTerm })
          }}
          
          filters={basicFilters}
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
          renderExpandedRow={(row) => <StateOverview stateData={row} />}
          
          pagination={{
            page,
            pageSize,
            totalPages: paginationInfo.totalPages || 1,
            totalElements: paginationInfo.totalElements || gstStates.length
          }}
          pageIndexBase={0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemName="GST States"
          
          emptyMessage="No GST States Found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find GST state codes."
        />
      </div>

      <GstStateFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        onSuccess={() => refetch()}
        editData={editData}
      />
    
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gst-states" 
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
