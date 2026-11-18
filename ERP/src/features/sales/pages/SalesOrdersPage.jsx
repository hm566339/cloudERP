import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import { Plus, Search, Filter, ShoppingCart, Truck, CheckCircle, FileText, Check, Send, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, X, XCircle, RefreshCw, Mail, Download } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetSalesOrdersQuery, useGetCustomersQuery, useCreateSalesOrderMutation, useConfirmSalesOrderMutation, useCancelSalesOrderMutation, useGenerateInvoiceFromSalesOrderMutation } from '../../../api/sales-crm';
import SalesOrderFormModal from '../components/SalesOrderFormModal';
import DeliveryChallanFromSoModal from '../components/DeliveryChallanFromSoModal';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import useApiFilters from '../../../hooks/useApiFilters';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExportModal from '../../../components/common/ExportModal';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import PageHeader from '../../../components/common/PageHeader';
import AuditLogHover from '../../../components/common/AuditLogHover';


export default function SalesOrdersPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, sortOrder, page, pageSize, handleColumnSort, apiParams } = useApiFilters(FILTER_CONFIGS.salesOrders || {}, { defaultPageSize: 10, defaultSortBy: 'soDate-desc' });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: apiResponse, isLoading, isFetching, refetch } = useGetSalesOrdersQuery({ companyId, ...apiParams });
  const { data: customersResponse } = useGetCustomersQuery(
    { companyId, page: 0, size: 500 },
    { skip: !companyId }
  );
  const [createSalesOrder] = useCreateSalesOrderMutation();
  const [confirmSO] = useConfirmSalesOrderMutation();
  const [cancelSO] = useCancelSalesOrderMutation();
  const [generateInvoice] = useGenerateInvoiceFromSalesOrderMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [soForDc, setSoForDc] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const pageData = apiResponse?.data ?? apiResponse;
  const orders = Array.isArray(pageData) ? pageData : (pageData?.content || apiResponse?.content || []);
  const serverPagination = apiResponse?._pageInfo || apiResponse?.pagination || pageData?.page || pageData?.pagination || apiResponse?.page || {};
  const totalElements = serverPagination.totalElements ?? orders.length;
  const totalPages = serverPagination.totalPages ?? Math.max(1, Math.ceil(totalElements / (pageSize || 10)));

  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : (customersResponse?.content || customersResponse?.data?.content || customersResponse?.data || []);
  const customerOptions = useMemo(() => customers
    .filter(customer => customer?.id)
    .map(customer => ({
      label: customer.customerName || customer.name || customer.customerCode || customer.id,
      value: customer.id
    })), [customers]);

  const getInvoiceUrl = (invId) => {
    if (location.pathname.includes('/accounts/')) {
      return invId ? `/accounts/sales/invoices/${invId}` : `/accounts/sales/invoices`;
    }
    return invId ? `/company/${companyId}/sales-crm/invoices/${invId}` : `/company/${companyId}/sales-crm/invoices`;
  };

  const handleCreateOrder = async (data) => {
    try {
      await createSalesOrder(data).unwrap();
      setIsFormOpen(false);
      dispatch(addAlert({ type: 'success', message: 'Sales order created successfully' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to create order' }));
    }
  };

    const handleConfirm = async (so) => {
    if (!(await confirmDialog('Confirm Sales Order', 'Once confirmed, this Sales Order will be locked. Continue?'))) return;
    try {
      await confirmSO({ id: so.id, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Sales Order confirmed' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to confirm Sales Order' }));
    }
  };

  const handleCancel = async (so) => {
    if (!(await confirmDialog('Cancel Sales Order', 'Are you sure you want to cancel this Sales Order?'))) return;
    try {
      await cancelSO({ id: so.id, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Sales Order cancelled' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to cancel Sales Order' }));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(q => q.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedOrders(prev => [...prev, id]);
    } else {
      setSelectedOrders(prev => prev.filter(item => item !== id));
    }
  };

  const handleGenerateInvoice = (order) => {
    if (location.pathname.includes('/accounts/')) {
      navigate(`/accounts/sales/invoices/create-from-order/${order.id}`);
    } else {
      navigate(`/company/${companyId}/sales-crm/invoices/create-from-order/${order.id}`);
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount || 0);
  };

  const columns = useMemo(() => [
    {
      key: 'orderNumber',
      label: 'ORDER NO.',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <ShoppingCart size={14} className="text-zinc-400" />
          <span className="font-mono text-xs font-semibold text-primary">{row.soNumber || row.orderNumber || row.id || '—'}</span>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'CUSTOMER',
      sortable: true,
      render: (val, row) => <span className="font-semibold text-zinc-900">{row.customerName || row.customer || '—'}</span>
    },
    {
      key: 'date',
      label: 'ORDER DATE',
      sortable: true,
      render: (val, row) => <span className="font-medium text-zinc-700">{row.soDate || row.date || '—'}</span>
    },
    {
      key: 'delivery',
      label: 'DELIVERY DATE',
      render: (val, row) => <span className="text-zinc-500">{row.delivery || '—'}</span>
    },
    {
      key: 'total',
      label: 'TOTAL AMOUNT',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-800">{formatCurrency(row.totalAmount || row.total || row.amount, row.currency)}</span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} showIcon={false} />
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      key: 'fromDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Customer Filters',
      fields: [{
        key: 'customerId',
        label: 'Customer',
        type: 'select',
        options: customerOptions
      }]
    }
  ], [customerOptions]);

  const filterValues = useMemo(() => {
    const obj = {};
    (filterBarProps.filters || []).forEach(f => {
      if (f.value !== undefined && f.value !== null) {
        obj[f.key] = f.value;
      }
    });
    return obj;
  }, [filterBarProps.filters]);

  const getRowActions = (o) => [
    {
      key: 'view',
      label: 'View Order',
      tooltip: 'View Sales Order Details',
      'aria-label': 'View Sales Order Details',
      icon: <FileText size={14} />,
      onClick: () => navigate(`/accounts/transactions/sales-orders/${o.id}`),
      className: 'text-zinc-600 dark:text-[#A0A6B5] hover:text-indigo-600 dark:hover:text-[#4C8DFF]'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    ...(o.status === 'DRAFT' ? [
      {
        key: 'confirm',
        label: 'Confirm Sales Order',
        tooltip: 'Confirm Sales Order',
        'aria-label': 'Confirm Sales Order',
        icon: <CheckCircle size={14} />,
        onClick: () => handleConfirm(o),
        className: 'text-emerald-600 hover:text-emerald-700'
      },
      {
        key: 'cancel',
        label: 'Cancel Sales Order',
        tooltip: 'Cancel Sales Order',
        'aria-label': 'Cancel Sales Order',
        icon: <XCircle size={14} />,
        danger: true,
        onClick: () => handleCancel(o),
        className: 'text-red-600 hover:text-red-700'
      }
    ] : []),
    ...((o.status === 'CONFIRMED' || o.status === 'APPROVED') ? [
      {
        key: 'create-dc',
        label: 'Generate Delivery Challan',
        tooltip: 'Generate Delivery Challan from Order',
        'aria-label': 'Generate Delivery Challan',
        icon: <Truck size={14} />,
        onClick: () => setSoForDc(o),
        className: 'text-zinc-900 hover:text-zinc-700'
      },
      {
        key: 'create-invoice',
        label: 'Generate Invoice',
        tooltip: 'Generate Sales Invoice from Order',
        'aria-label': 'Generate Sales Invoice',
        icon: <FileText size={14} />,
        onClick: () => handleGenerateInvoice(o),
        className: 'text-emerald-600 hover:text-emerald-700'
      }
    ] : [])
  ];

  const DEFAULT_COLUMNS = ['orderNumber', 'customer', 'date', 'delivery', 'total', 'status', 'actions'];
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('salesorders_visible_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] animate-in fade-in">
      {/* ── Page Header ── */}
      <PageHeader title="Sales Orders" description="Manage sales orders" icon={ShoppingCart}>
        <button
          onClick={() => { setEditOrderId(null); setIsFormOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> <span>New Order</span>
        </button>
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedOrders}
          onSelectionChange={setSelectedOrders}
          columns={columns}
          data={orders}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filterBarProps.searchTerm || ''}
          searchPlaceholder="Search Orders..."
          onSearchChange={(val) => filterBarProps.onSearchChange(val)}

          // Filters
          filters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => filterBarProps.onFilterChange(key, val)}

          // Advanced Filters
          advancedFilters={advancedFilters}
          isAdvancedOpen={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(prev => !prev)}

          // Reset, Refresh, Export
          onReset={() => {
            filterBarProps.onClearAll();
            setSelectedOrders([]);
            setShowAdvancedFilters(false);
          }}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('salesorders_visible_columns', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Pagination
          pagination={{
            page: paginationProps.page,
            pageSize: paginationProps.pageSize,
            totalPages,
            totalElements
          }}
          pageIndexBase={0}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          itemName="orders"

          // Empty State
          emptyMessage="No orders found"
          emptyDescription="Try adjusting your filters or create a new order."
        />
      </div>

      {isFormOpen && (
        <SalesOrderFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="sales-orders"
          defaultFilters={Object.fromEntries((filterBarProps.filters || []).filter(f => f.value).map(f => [f.key, f.value]))}
          selectedIds={selectedOrders}
          selectedCount={selectedOrders.length}
        />
      )}

      {soForDc && (
        <DeliveryChallanFromSoModal
          isOpen={!!soForDc}
          onClose={() => setSoForDc(null)}
          companyId={companyId}
          salesOrder={soForDc}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
