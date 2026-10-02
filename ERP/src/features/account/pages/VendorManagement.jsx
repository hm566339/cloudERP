import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle,
  Building2, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vendorsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import VendorFormModal from '../components/VendorFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'vendorCode',
  'vendorName',
  'contact',
  'location',
  'outstandingBalance',
  'status'
];

export default function VendorManagement() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.vendorCode && filters.vendorCode.trim()) q.vendorCode = filters.vendorCode.trim();
    if (filters.vendorName && filters.vendorName.trim()) q.vendorName = filters.vendorName.trim();
    if (filters.email && filters.email.trim()) q.email = filters.email.trim();
    if (filters.phone && filters.phone.trim()) q.phone = filters.phone.trim();
    if (filters.gstin && filters.gstin.trim()) q.gstin = filters.gstin.trim();
    if (filters.pan && filters.pan.trim()) q.pan = filters.pan.trim();
    if (filters.city && filters.city.trim()) q.city = filters.city.trim();
    if (filters.state && filters.state.trim()) q.state = filters.state.trim();
    if (filters.country && filters.country.trim()) q.country = filters.country.trim();
    if (filters.pinCode && filters.pinCode.trim()) q.pinCode = filters.pinCode.trim();

    if (filters.minCreditLimit !== undefined && filters.minCreditLimit !== '') {
      q.minCreditLimit = Number(filters.minCreditLimit);
    }
    if (filters.maxCreditLimit !== undefined && filters.maxCreditLimit !== '') {
      q.maxCreditLimit = Number(filters.maxCreditLimit);
    }
    if (filters.isActive !== undefined && filters.isActive !== '') {
      q.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;
    if (filters.updatedFrom) q.updatedFrom = filters.updatedFrom;
    if (filters.updatedTo) q.updatedTo = filters.updatedTo;

    return q;
  }, [filters]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    vendorsApi.getVendors,
    { ...queryFilters, ...apiParams }
  );

  const vendors = responseData?.content || [];
  const pageInfo = responseData || null;

  const deleteMutation = useApiMutation(vendorsApi.deleteVendor);
  const activateMutation = useApiMutation(vendorsApi.activateVendor);
  const deactivateMutation = useApiMutation(vendorsApi.deactivateVendor);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Vendor',
      'Are you sure you want to delete this vendor? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync([id]);
          dispatch(addAlert({ type: 'success', message: 'Vendor deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete vendor' }));
        }
      }
    );
  };

  const toggleStatus = async (vendor) => {
    const isActivating = !vendor.isActive;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Vendor`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${vendor.vendorName}?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync([vendor.id]);
          } else {
            await deactivateMutation.mutateAsync([vendor.id]);
          }
          dispatch(addAlert({ type: 'success', message: `Vendor ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedVendor(prefillData);
    setIsFormOpen(true);
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'vendorCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.vendorCode || '-'}
        </span>
      )
    },
    {
      id: 'vendorName',
      label: 'Vendor Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.vendorName || '-'}</span>
      )
    },
    {
      id: 'contact',
      label: 'Contact',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium">{row.email || '-'}</span>
          <span className="text-zinc-500 text-xs">{row.phone || '-'}</span>
        </div>
      )
    },
    {
      id: 'location',
      label: 'Location',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium">{row.city || '-'}</span>
          <span className="text-zinc-500 text-xs">
            {row.state || '-'} {row.country ? `, ${row.country}` : ''}
          </span>
        </div>
      )
    },
    {
      id: 'gstin',
      label: 'GSTIN',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.gstin || '-'}</span>
    },
    {
      id: 'pan',
      label: 'PAN',
      sortable: false,
      render: (val, row) => <span className="text-zinc-700">{row.panNo || row.pan || '-'}</span>
    },
    {
      id: 'creditLimit',
      label: 'Credit Limit',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {row.creditLimit ? `₹${row.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
        </span>
      )
    },
    {
      id: 'outstandingBalance',
      label: 'Outstanding',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className={`font-medium font-mono ${row.outstandingBalance > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
          {row.outstandingBalance !== undefined && row.outstandingBalance !== null
            ? `₹${row.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : '₹0.00'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'isActive',
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.isActive} />
    }
  ], []);

  // Quick toolbar filters
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
    },
    {
      id: 'minCreditLimit',
      label: 'Credit Limit Min',
      type: 'number',
      placeholder: 'Min Limit'
    },
    {
      id: 'maxCreditLimit',
      label: 'Credit Limit Max',
      type: 'number',
      placeholder: 'Max Limit'
    }
  ], []);

  // Expandable grouped advanced filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Identification & Contact',
      fields: [
        { id: 'vendorCode', label: 'Vendor Code', placeholder: 'e.g. VEND12345' },
        { id: 'vendorName', label: 'Vendor Name', placeholder: 'Exact or partial name' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'vendor@company.com' },
        { id: 'phone', label: 'Phone', placeholder: 'Phone number' },
        { id: 'gstin', label: 'GSTIN', placeholder: '15-CHARACTER GSTIN', uppercase: true },
        { id: 'pan', label: 'PAN Number', placeholder: '10-CHARACTER PAN', uppercase: true }
      ]
    },
    {
      title: 'Location & Address',
      fields: [
        { id: 'city', label: 'City', placeholder: 'City' },
        { id: 'state', label: 'State', placeholder: 'State' },
        { id: 'country', label: 'Country', placeholder: 'Country' },
        { id: 'pinCode', label: 'Pin Code', placeholder: 'Postal code' }
      ]
    },
    {
      title: 'Date Filters',
      colSpan: 'full',
      fields: [
        { id: 'createdFrom', label: 'Created From', type: 'date' },
        { id: 'createdTo', label: 'Created To', type: 'date' },
        { id: 'updatedFrom', label: 'Updated From', type: 'date' },
        { id: 'updatedTo', label: 'Updated To', type: 'date' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/masters/vendors/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'toggle-status',
      label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
      icon: (row) => (row.isActive ? AlertCircle : CheckCircle),
      permission: { module: 'VENDORS', action: 'UPDATE' },
      onClick: (row) => toggleStatus(row),
      tooltip: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
      className: (row) => row.isActive
        ? 'hover:text-amber-600 hover:bg-amber-50'
        : 'hover:text-emerald-600 hover:bg-emerald-50'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'VENDORS', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'VENDORS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Quick action dropdown to create a vendor from search input
  const searchAction = (searchTerm) => (
    <button
      type="button"
      onClick={() => handleCreate({ vendorName: searchTerm })}
      className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
    >
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Plus size={14} className="text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold truncate">Create "{searchTerm}"</span>
        <span className="text-[8.8px] text-zinc-500">Add as new vendor</span>
      </div>
    </button>
  );

  // Sub-row drawer renderer
  const renderExpandedRow = (vendor) => (
    <div className="bg-zinc-50 border-x-4 border-l-blue-500 border-r-transparent p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Vendor Name</p>
        <p className="text-sm font-semibold text-zinc-900 mt-1">{vendor.vendorName || '-'}</p>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Vendor Code</p>
        <p className="text-sm font-mono font-semibold text-zinc-900 mt-1 bg-white px-2 py-0.5 rounded border inline-block">{vendor.vendorCode || '-'}</p>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Company Name</p>
        <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-2">
          <Building2 size={14} className="text-zinc-400" /> {vendor.companyName || '-'}
        </p>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
        <div className="mt-1">
          <DataTableStatusBadge status={vendor.isActive} />
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Contact</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col">
          <span>{vendor.email || '-'}</span>
          <span className="text-zinc-500 text-xs">{vendor.phone || '-'}</span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Tax IDs</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5"><span className="text-xs text-zinc-400 w-10">GSTIN</span> <span className="font-mono bg-white px-1.5 py-0.5 border rounded text-xs">{vendor.gstin || '-'}</span></span>
          <span className="flex items-center gap-1.5"><span className="text-xs text-zinc-400 w-10">PAN</span> <span className="font-mono bg-white px-1.5 py-0.5 border rounded text-xs">{vendor.panNo || vendor.pan || '-'}</span></span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Financials</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col gap-0.5">
          <span className="flex items-center justify-between gap-4"><span className="text-xs text-zinc-400">Limit</span> <span>{vendor.creditLimit ? `₹${vendor.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</span></span>
          <span className="flex items-center justify-between gap-4"><span className="text-xs text-zinc-400">Outst.</span> <span className={vendor.outstandingBalance > 0 ? "text-rose-600 font-bold" : ""}>{vendor.outstandingBalance ? `₹${vendor.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₹0.00'}</span></span>
          <span className="flex items-center justify-between gap-4"><span className="text-xs text-zinc-400">Avail.</span> <span className="text-emerald-600 font-bold">{vendor.availableCredit ? `₹${vendor.availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</span></span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Activity</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col gap-0.5">
          <span className="flex items-center justify-between gap-4"><span className="text-xs text-zinc-400">Invoices</span> <span>{vendor.totalInvoices || '0'}</span></span>
          <span className="flex items-center justify-between gap-4"><span className="text-xs text-zinc-400">Payments</span> <span>{vendor.totalPayments || '0'}</span></span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Terms & Currency</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col gap-0.5">
          <span className="text-xs">{vendor.paymentTermDays ? `${vendor.paymentTermDays} Days` : 'No terms'}</span>
          <span className="text-xs">{vendor.currency || 'INR'}</span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</p>
        <div className="text-sm font-medium text-zinc-900 mt-1 flex flex-col">
          <span>{vendor.city || '-'}</span>
          <span className="text-zinc-500 text-xs">{vendor.state || '-'} {vendor.country ? `, ${vendor.country}` : ''}</span>
        </div>
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Updated</p>
        <p className="text-sm font-medium text-zinc-900 mt-1">
          {vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : '-'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Vendor Management"
        description="Manage vendor accounts and information"
      >

        <RequirePermission module="VENDORS" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Vendor</span>
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
          data={vendors}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Name, Code, Email..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          searchAction={searchAction}

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
            pageSize: apiParams.size,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || vendors.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="vendors"

          // Empty State
          emptyMessage="No vendors found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find vendor accounts."
        />
      </div>

      <VendorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedVendor}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="vendormanagement-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
