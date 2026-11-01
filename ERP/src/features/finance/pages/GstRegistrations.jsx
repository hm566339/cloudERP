import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Edit2, Trash2, Eye, MapPin, FileText } from 'lucide-react';
import { useGetGstRegistrationsQuery, useDeleteGstRegistrationMutation } from '../../../api/account/accounting.api';
import GstRegistrationFormModal from '../components/GstRegistrationFormModal';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import RequirePermission from '../../../components/common/RequirePermission';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';

const TYPE_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'CONSUMER', label: 'Consumer' }
];

const getTypeBadge = (type) => {
  switch (type) {
    case 'REGULAR': return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-[#4C8DFF] dark:border-blue-500/20">Regular</span>;
    case 'COMPOSITION': return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">Composition</span>;
    case 'UNREGISTERED': return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]">Unregistered</span>;
    default: return <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]">{type}</span>;
  }
};

const RegistrationOverview = ({ data }) => {
  return (
    <div className="p-5 flex flex-col bg-zinc-50/50 dark:bg-[#1D212C] rounded-lg border-t border-zinc-200 dark:border-[#2A2F3D]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">{data.legalName || '-'}</h3>
          <p className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] font-medium tracking-wide mt-1">
            GSTIN: <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">{data.gstin || '-'}</span> | 
            PAN: <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">{data.pan || '-'}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Trade Name</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{data.tradeName || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Type</p>
          <div>{getTypeBadge(data.registrationType)}</div>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Company</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{data.company?.name || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Branch</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{data.branch?.name || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Registered Date</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{data.registeredDate || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase mb-0.5">Default</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">
            {data.default ? <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold"><span className="text-sm">⭐</span> Default</span> : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_COLUMNS = ['gstin', 'legalName', 'registrationType', 'stateCode.stateName', 'default'];

export default function GstRegistrations() {
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
    defaultSortBy: 'registeredDate',
    defaultSortOrder: 'desc'
  });

  const apiParams = useMemo(() => {
    const params = { 
      page,
      size: pageSize,
      sortBy,
      sortOrder
    };
    return params;
  }, [page, pageSize, sortBy, sortOrder]);

  const { data: regsData, isLoading, refetch, isFetching } = useGetGstRegistrationsQuery(apiParams);
  const [deleteGstRegistration] = useDeleteGstRegistrationMutation();

  let gstRegistrations = [];
  if (Array.isArray(regsData)) {
    gstRegistrations = regsData;
  } else if (regsData?.data?.records) {
    gstRegistrations = regsData.data.records;
  } else if (regsData?.records) {
    gstRegistrations = regsData.records;
  } else if (regsData?.data) {
    gstRegistrations = Array.isArray(regsData.data) ? regsData.data : [];
  }

  // Local filtering
  const searchKey = filters.searchKey || '';
  if (searchKey) {
    const searchLower = searchKey.toLowerCase();
    gstRegistrations = gstRegistrations.filter(r => 
      r.gstin?.toLowerCase().includes(searchLower) || 
      r.legalName?.toLowerCase().includes(searchLower) ||
      r.tradeName?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.registrationType !== '' && filters.registrationType !== undefined) {
    gstRegistrations = gstRegistrations.filter(r => r.registrationType === filters.registrationType);
  }

  const paginationInfo = regsData?._pageInfo || regsData?.pagination || regsData?.data?.pagination || { totalPages: 1, totalElements: gstRegistrations.length };

  const handleReset = () => {
    resetFilters();
    handlePageChange(0);
    setSelectedRows([]);
  };

  const handleEdit = (data) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setEditData(prefillData);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, gstin) => {
    confirmDialog(
      'Delete GST Registration',
      `Are you sure you want to delete the GST Registration for GSTIN: ${gstin}?`,
      async () => {
        try {
          await deleteGstRegistration({ id, companyId }).unwrap();
          dispatch(addAlert({ type: 'success', message: 'GST Registration deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete GST Registration' }));
        }
      }
    );
  };

  const columns = useMemo(() => [
    {
      id: 'gstin',
      label: 'GSTIN',
      sortable: true,
      render: (val, row) => <span className="font-semibold text-zinc-900 truncate">{row.gstin}</span>
    },
    {
      id: 'legalName',
      label: 'Legal Name',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700 truncate font-medium">{row.legalName}</span>
    },
    {
      id: 'registrationType',
      label: 'Type',
      sortable: true,
      render: (val, row) => getTypeBadge(row.registrationType)
    },
    {
      id: 'stateCode.stateName',
      label: 'State',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700 truncate">{row.stateCode?.stateName || '-'}</span>
    },
    {
      id: 'default',
      label: 'Default',
      sortable: true,
      align: 'center',
      render: (val, row) => row.default ? <span className="flex items-center justify-center gap-1 text-amber-600 font-semibold text-xs"><span className="text-sm">⭐</span> Default</span> : null
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      id: 'registrationType',
      label: 'Registration Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        ...TYPE_OPTIONS
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/tax/gst-registrations/${row.id}`)),
      tooltip: 'View Registration Details',
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
      tooltip: 'Edit Registration',
      className: 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'GST_MASTER', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id, row.gstin),
      tooltip: 'Delete Registration'
    }
  ], [navigate, buildPath]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="GST Registrations"
        description="Manage GST registrations for your company and branches."
      >
        <RequirePermission module="GST_MASTER" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Registration</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={gstRegistrations}
          rowKey={(row) => row.id}
          loading={isLoading}
          isRefreshing={isFetching}
          
          searchable
          searchValue={searchKey}
          searchPlaceholder="Search by GSTIN or Name..."
          onSearchChange={(val) => handleFilterChange('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new registration',
            onCreate: (searchTerm) => handleCreate({ legalName: searchTerm })
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
          renderExpandedRow={(row) => <RegistrationOverview data={row} />}
          
          pagination={{
            page,
            pageSize,
            totalPages: paginationInfo.totalPages || 1,
            totalElements: paginationInfo.totalElements || gstRegistrations.length
          }}
          pageIndexBase={0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          itemName="GST Registrations"
          
          emptyMessage="No GST Registrations Found"
          emptyDescription={<button onClick={handleCreate} className="btn-secondary px-4 mt-2">Create First Registration</button>}
        />
      </div>

      <GstRegistrationFormModal 
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
        reportName="gst-registrations"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
