import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import { 
  Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import CustomerFormModal from '../components/CustomerFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'customerCode',
  'customerName',
  'contact',
  'location',
  'outstandingBalance',
  'status'
];

const getDefaultAddress = (customer) => {
  const addresses = Array.isArray(customer?.addresses) ? customer.addresses : [];
  return addresses.find((address) => address?.isDefault) || addresses[0] || null;
};

const getCustomerList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return response._pageInfo || {};
  return response?.pagination || response?.data?.pagination || response?.data?._pageInfo || response?._pageInfo || response || {};
};

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export default function CustomerManagement() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
    if (filters.customerCode && filters.customerCode.trim()) q.customerCode = filters.customerCode.trim();
    if (filters.customerName && filters.customerName.trim()) q.customerName = filters.customerName.trim();
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
    customersApi.getList,
    { ...queryFilters, ...apiParams }
  );

  const customers = getCustomerList(responseData);
  const pageInfo = getPageInfo(responseData);

  const deleteMutation = useApiMutation(customersApi.delete);
  const activateMutation = useApiMutation(customersApi.activate);
  const deactivateMutation = useApiMutation(customersApi.deactivate);
  const createMutation = useApiMutation(customersApi.create);
  const updateMutation = useApiMutation(customersApi.update);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Customer',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Customer deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete customer' }));
        }
      }
    );
  };

  const toggleStatus = async (customer) => {
    const isActivating = !customer.isActive;
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Customer`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${customer.customerName}?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync(customer.id);
          } else {
            await deactivateMutation.mutateAsync(customer.id);
          }
          dispatch(addAlert({ type: 'success', message: `Customer ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (payload.id) {
        await updateMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Customer updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Customer created successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || error?.data?.message || error?.message || 'Failed to save customer' }));
      throw error;
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedCustomer(prefillData);
    setIsFormOpen(true);
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'customerCode',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.customerCode || '-'}
        </span>
      )
    },
    {
      id: 'customerName',
      label: 'Customer Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.customerName || '-'}</span>
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
        (() => {
          const address = getDefaultAddress(row);
          return (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium">{address?.city || '-'}</span>
          <span className="text-zinc-500 text-xs">
            {address?.gstStateName || address?.state || '-'} {address?.country ? `, ${address.country}` : ''}
          </span>
        </div>
          );
        })()
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
      render: (val, row) => <span className="text-zinc-700">{row.panNo || '-'}</span>
    },
    {
      id: 'creditLimit',
      label: 'Credit Limit',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 font-mono">
          {formatAmount(row.creditLimit)}
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
          {formatAmount(row.outstandingBalance)}
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
        { id: 'customerCode', label: 'Customer Code', placeholder: 'e.g. CUST12345' },
        { id: 'customerName', label: 'Customer Name', placeholder: 'Exact or partial name' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'customer@company.com' },
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
      onClick: (row) => navigate(buildPath(`/accounts/masters/customers/${row.id}`)),
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
      permission: { module: 'CUSTOMERS', action: 'UPDATE' },
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
      permission: { module: 'CUSTOMERS', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'CUSTOMERS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Sub-row drawer renderer
  const renderExpandedRow = (customer) => {
    const address = getDefaultAddress(customer);
    const location = [
      address?.addressLine1,
      address?.addressLine2,
      address?.city,
      address?.gstStateName || address?.state,
      address?.country,
      address?.postalCode,
    ].filter(Boolean).join(', ');

    return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Name</span>
        <p className="text-sm font-semibold text-zinc-900">{customer.customerName || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Code</span>
        <p className="text-sm font-semibold text-zinc-900">{customer.customerCode || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${customer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Email</span>
        <p className="text-sm font-medium text-zinc-700">{customer.email || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Phone</span>
        <p className="text-sm font-medium text-zinc-700">{customer.phone || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Credit Limit</span>
        <p className="text-sm font-medium text-zinc-700">
          {formatAmount(customer.creditLimit)}
        </p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Outstanding</span>
        <p className={`text-sm font-medium ${customer.outstandingBalance > 0 ? 'text-red-600' : 'text-zinc-700'}`}>
          {formatAmount(customer.outstandingBalance)}
        </p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GSTIN</span>
        <p className="text-sm font-medium text-zinc-700">{customer.gstin || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">PAN Number</span>
        <p className="text-sm font-medium text-zinc-700">{customer.panNo || '-'}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
        <p className="text-sm font-medium text-zinc-700">
          {location || '-'}
        </p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Available Credit</span>
        <p className="text-sm font-medium text-zinc-700">{formatAmount(customer.availableCredit)}</p>
      </div>
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created At</span>
        <p className="text-sm font-medium text-zinc-700">
          {formatDate(customer.createdAt)}
        </p>
      </div>
    </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Customer Management"
        description="Manage customer accounts, balances, and profiles"
      >
        <RequirePermission module="CUSTOMERS" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Customer</span>
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
          data={customers}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Name, Code, Email..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new customer',
            onCreate: (searchTerm) => handleCreate({ customerName: searchTerm })
          }}

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
            totalElements: pageInfo?.totalElements || customers.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="customers"

          // Empty State
          emptyMessage="No customers found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find customer accounts."
        />
      </div>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedCustomer}
        onSubmit={handleFormSubmit}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="customermanagement-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
