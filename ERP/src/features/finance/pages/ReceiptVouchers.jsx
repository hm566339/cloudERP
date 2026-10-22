import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import { 
  Plus, Eye, RefreshCw, Trash2, Edit2, Download, FileText, 
  Send, Check, BookOpen, Undo, XCircle, X, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receiptVouchersApi, customersApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import ReceiptVoucherFormModal from '../components/ReceiptVoucherFormModal';
import { getReceiptWorkflowActions } from '../../../utils/receiptPermissions';
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomerFormModal from '../../account/components/CustomerFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import AuditLogHover from '../../../components/common/AuditLogHover';
import DeliveryChallanFromSoModal from '../../sales/components/DeliveryChallanFromSoModal';

const formatStatusLabel = (status) => String(status || '')
  .toLowerCase()
  .replace(/_/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

const ReceiptOverview = ({ receipt }) => {
  if (!receipt) return null;
  return (
    <div className="p-5 flex flex-col bg-white dark:bg-[#161922] rounded-lg shadow-sm m-4 border border-zinc-100 dark:border-[#2A2F3D]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">{receipt.customerName || '-'}</h3>
          <p className="text-[8.8px] text-zinc-500 dark:text-[#A0A6B5] font-medium uppercase tracking-wide mt-1">
            Date: {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : '-'} | Mode: {receipt.paymentMode || '-'} | Ref: {receipt.referenceNo || '-'} | Curr: {receipt.currency || 'INR'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Receipt Amount</p>
          <p className="font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm">{receipt.currency || 'INR'} {receipt.receiptAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Allocated Amount</p>
          <p className="font-bold text-blue-600 dark:text-[#4C8DFF] text-sm">{receipt.currency || 'INR'} {receipt.totalAllocatedAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Remaining Amount</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{receipt.currency || 'INR'} {receipt.remainingBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Applied Invoices</p>
          <p className="font-bold text-zinc-700 dark:text-[#E6E8EE] text-sm">{receipt.allocations?.length || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Status</p>
          <div><DataTableStatusBadge status={receipt.receiptStatus || 'DRAFT'} label={formatStatusLabel(receipt.receiptStatus || 'DRAFT')} showIcon={false} /></div>
        </div>
        <div>
          <p className="text-[8px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase mb-0.5">Posting Status</p>
          <div><DataTableStatusBadge status={receipt.glPostingStatus || 'DRAFT'} label={formatStatusLabel(receipt.glPostingStatus || 'DRAFT')} showIcon={false} /></div>
        </div>
      </div>
      
      {receipt.allocations && receipt.allocations.length > 0 && (
        <div className="mt-4 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
           <table className="w-full text-left text-xs whitespace-nowrap">
             <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] font-medium uppercase tracking-wider text-[8px]">
               <tr>
                 <th className="px-4 py-2">Invoice No</th>
                 <th className="px-4 py-2">Invoice Date</th>
                 <th className="px-4 py-2 text-right">Invoice Amount</th>
                 <th className="px-4 py-2 text-right">Allocated Amount</th>
                 <th className="px-4 py-2 text-right">Outstanding Before</th>
                 <th className="px-4 py-2 text-right">Outstanding After</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
               {receipt.allocations.map((alloc, idx) => (
                 <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                   <td className="px-4 py-2 font-medium text-zinc-900 dark:text-[#E6E8EE]">{alloc.invoiceNumber || '-'}</td>
                   <td className="px-4 py-2 text-zinc-600 dark:text-[#A0A6B5]">{alloc.invoiceDate ? new Date(alloc.invoiceDate).toLocaleDateString() : '-'}</td>
                   <td className="px-4 py-2 text-right font-medium">{receipt.currency || 'INR'} {alloc.invoiceAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
                   <td className="px-4 py-2 text-right text-blue-600 dark:text-[#4C8DFF] font-medium">{receipt.currency || 'INR'} {alloc.allocatedAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
                   <td className="px-4 py-2 text-right text-zinc-600 dark:text-[#A0A6B5]">{receipt.currency || 'INR'} {alloc.outstandingBefore?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
                   <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{receipt.currency || 'INR'} {alloc.outstandingAfter?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default function ReceiptVouchers() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const authState = useAppSelector((state) => state.auth);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedReceiptForDc, setSelectedReceiptForDc] = useState(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [prefillCustomerName, setPrefillCustomerName] = useState('');
  const [actionReceiptId, setActionReceiptId] = useState(null);

  const createCustomerMutation = useApiMutation(customersApi.create);

  const handleCreateCustomerFromSearch = async (payload) => {
    try {
      await createCustomerMutation.mutateAsync([payload]);
      dispatch(addAlert({ type: 'success', message: 'Customer created successfully' }));
      setIsCustomerFormOpen(false);
      setPrefillCustomerName('');
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create customer' }));
    }
  };

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'receiptDate', defaultSortOrder: 'desc' });

  const handleClearFilters = () => {
    resetFilters();
    setPage(0);
    setShowAdvancedFilters(false);
  };

  const queryFilters = useMemo(() => ({
    searchKey: debouncedSearch || undefined,
    receiptNo: filters.receiptNo || undefined,
    referenceNo: filters.referenceNo || undefined,
    customerId: filters.customerId || undefined,
    salesInvoiceId: filters.salesInvoiceId || filters.arInvoiceId || undefined,
    paymentMode: filters.paymentMode || undefined,
    receiptStatuses: filters.receiptStatuses ? [filters.receiptStatuses] : undefined,
    postingStatuses: filters.postingStatuses ? [filters.postingStatuses] : undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
    receiptDateFrom: filters.receiptDateFrom || undefined,
    receiptDateTo: filters.receiptDateTo || undefined
  }), [debouncedSearch, filters]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    receiptVouchersApi.getReceipts,
    [queryFilters, {
      page,
      size: pageSize,
      sort: `${sortBy || 'receiptDate'},${sortOrder || 'desc'}`
    }]
  );

  const { data: customersData } = useApiQuery(
    customersApi.getList,
    [{ isActive: true }, { page: 0, size: 500, sort: 'customerName,asc' }]
  );

  const receipts = responseData?.content || [];
  const pageInfo = responseData?.page || responseData?.pagination || {};
  const customers = customersData?.content || [];

  const deleteMutation = useApiMutation(receiptVouchersApi.deleteReceipt);

  // Workflow mutations for list-level actions
  const submitMutation  = useApiMutation((id) => receiptVouchersApi.submitReceipt(id));
  const approveMutation = useApiMutation((id) => receiptVouchersApi.approveReceipt(id));
  const rejectMutation  = useApiMutation((id) => receiptVouchersApi.rejectReceipt(id));
  const postMutation    = useApiMutation((id) => receiptVouchersApi.postReceipt(id));
  const reverseMutation = useApiMutation((id) => receiptVouchersApi.reverseReceipt(id));
  const cancelMutation  = useApiMutation((id) => receiptVouchersApi.cancelReceipt(id));

  const workflowMutations = {
    submitMutation,
    approveMutation,
    rejectMutation,
    postMutation,
    reverseMutation,
    cancelMutation,
  };

  /** Execute a workflow action from the list with confirmation + toast */
  const handleWorkflowAction = async (receiptId, action) => {
    if (action.confirm) {
      const confirmed = await confirmDialog({
        title: action.confirmTitle,
        message: action.confirmMessage,
        confirmLabel: action.label,
        isDestructive: ['reject', 'cancel', 'reverse'].includes(action.key),
      });
      if (!confirmed) return;
    }

    const mutation = workflowMutations[action.mutationKey];
    if (!mutation) return;

    setActionReceiptId(receiptId);
    try {
      await mutation.mutateAsync(receiptId);
      dispatch(addAlert({ type: 'success', message: action.successMessage }));
      refetch();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${action.label.toLowerCase()} this receipt.`
        : (err?.response?.data?.message || err?.message || `Failed to ${action.label.toLowerCase()} receipt.`);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setActionReceiptId(null);
    }
  };

  /** Icon lookup for workflow action buttons */
  const WORKFLOW_ICON_MAP = { Send, Check, X: XCircle, BookOpen, Undo, XCircle };

  /** Build extraActions array for a receipt row's action menu */
  const buildWorkflowExtraActions = (receipt) => {
    const actions = getReceiptWorkflowActions(authState, receipt.receiptStatus);
    return actions.map((action) => {
      const IconComponent = WORKFLOW_ICON_MAP[action.icon] || FileText;
      return {
        key: action.key,
        label: action.label,
        tooltip: action.label,
        'aria-label': action.label,
        danger: ['reject', 'cancel', 'reverse'].includes(action.key),
        icon: IconComponent,
        onClick: () => handleWorkflowAction(receipt.id, action),
      };
    });
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Receipt Voucher',
      'Are you sure you want to delete this receipt voucher? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync([id]);
          dispatch(addAlert({ type: 'success', message: 'Receipt deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete receipt' }));
        }
      }
    );
  };

  const handleEdit = (receipt) => {
    if (receipt.receiptStatus !== 'DRAFT') {
      dispatch(addAlert({ type: 'warning', message: 'Only draft receipts can be edited.' }));
      return;
    }
    setSelectedReceipt(receipt);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedReceipt(null);
    setIsFormOpen(true);
  };

  // Columns definition
  const columns = useMemo(() => [
    {
      id: 'receiptNo',
      label: 'Receipt No',
      sortable: true,
      sortKey: 'receiptNo',
      render: (val, receipt) => (
        <div>
          <span className="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">
            {receipt.receiptNo}
          </span>
          {receipt.referenceNo && (
            <div className="text-[8.8px] text-zinc-500 mt-0.5">Ref: {receipt.referenceNo}</div>
          )}
        </div>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      sortKey: 'customerName',
      render: (val, receipt) => (
        <span className="font-medium text-zinc-900">{receipt.customerName || '-'}</span>
      )
    },
    {
      id: 'bank',
      label: 'Bank Info',
      render: (val, receipt) => (
        <span className="text-zinc-600">
          {receipt.bankAccount ? `${receipt.bankName} - ${receipt.bankAccount}` : '-'}
        </span>
      )
    },
    {
      id: 'receiptDate',
      label: 'Date',
      sortable: true,
      sortKey: 'receiptDate',
      render: (val, receipt) => (
        <span className="text-[10.4px] text-zinc-700 font-medium">
          {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      id: 'paymentMode',
      label: 'Payment Mode',
      sortable: true,
      sortKey: 'paymentMode',
      render: (val, receipt) => (
        <span className="text-[10.4px] text-zinc-700 font-medium">{receipt.paymentMode || '-'}</span>
      )
    },
    {
      id: 'receiptAmount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      sortKey: 'receiptAmount',
      render: (val, receipt) => (
        <span className="font-semibold text-zinc-900">
          {receipt.currency || 'INR'} {receipt.receiptAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: 'allocatedAmount',
      label: 'Allocated',
      align: 'right',
      render: (val, receipt) => (
        <span className="font-semibold text-zinc-900">
          {receipt.currency || 'INR'} {receipt.totalAllocatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      id: 'remainingBalance',
      label: 'Remaining',
      align: 'right',
      render: (val, receipt) => (
        <span className="font-semibold text-emerald-600">
          {receipt.currency || 'INR'} {receipt.remainingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      id: 'receiptStatus',
      label: 'Status',
      align: 'center',
      sortable: true,
      sortKey: 'receiptStatus',
      render: (val, receipt) => <DataTableStatusBadge status={receipt.receiptStatus || 'DRAFT'} label={formatStatusLabel(receipt.receiptStatus || 'DRAFT')} showIcon={false} />
    },
    {
      id: 'glPostingStatus',
      label: 'Posting',
      align: 'center',
      sortable: true,
      sortKey: 'glPostingStatus',
      render: (val, receipt) => <DataTableStatusBadge status={receipt.glPostingStatus || 'DRAFT'} label={formatStatusLabel(receipt.glPostingStatus || 'DRAFT')} showIcon={false} />
    }
  ], []);

  // Basic filters
  const basicFilters = useMemo(() => [
    {
      key: 'receiptStatuses',
      label: 'Status',
      type: 'select',
      placeholder: 'Select an option',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Posted', value: 'POSTED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Reversed', value: 'REVERSED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    {
      key: 'receiptDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'receiptDateTo',
      label: 'Date To',
      type: 'date'
    }
  ], []);

  // Advanced filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Customer Filters',
      fields: [{
        key: 'customerId', label: 'Customer', type: 'select',
        options: customers.map(c => ({ label: c.customerName || c.name || c.id, value: c.id }))
      }]
    },
    {
      title: 'Receipt Filters',
      fields: [
        { key: 'receiptNo', label: 'Receipt Number', type: 'text' },
        { key: 'referenceNo', label: 'Reference Number', type: 'text' },
        { key: 'salesInvoiceId', label: 'Sales Invoice ID', type: 'text' },
        {
          key: 'paymentMode', label: 'Payment Mode', type: 'select',
          options: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'RTGS', 'NEFT', 'IMPS', 'CARD']
            .map(value => ({ label: formatStatusLabel(value), value }))
        }
      ]
    },
    {
      title: 'Amount Filters',
      fields: [
        { key: 'minAmount', label: 'Min Amount', type: 'number' },
        { key: 'maxAmount', label: 'Max Amount', type: 'number' }
      ]
    },
    {
      title: 'Posting Filters',
      fields: [{
        key: 'postingStatuses', label: 'Posting Status', type: 'select',
        options: ['DRAFT', 'POSTED', 'FAILED', 'REVERSED', 'CANCELLED']
          .map(value => ({ label: formatStatusLabel(value), value }))
      }]
    }
  ], [customers]);

  // Row actions
  const getRowActions = (receipt) => {
    const actions = [
      {
        key: 'view',
        label: 'View Voucher',
        tooltip: 'View Receipt Voucher Details',
        'aria-label': 'View Receipt Voucher Details',
        icon: Eye,
        onClick: () => navigate(buildPath(`/accounts/transactions/receipts/${receipt.id}`))
      },
      {
        key: 'generate-delivery-challan',
        label: 'Generate Delivery Challan',
        tooltip: 'Generate Delivery Challan from Receipt',
        'aria-label': 'Generate Delivery Challan',
        icon: Truck,
        onClick: () => setSelectedReceiptForDc(receipt),
      },
      {
        key: 'audit',
        component: ({ row }) => <AuditLogHover audit={row.audit} />
      }
    ];

    if (receipt.receiptStatus === 'DRAFT') {
      actions.push({
        key: 'edit',
        label: 'Edit Voucher',
        tooltip: 'Edit Receipt Voucher',
        'aria-label': 'Edit Receipt Voucher',
        icon: Edit2,
        onClick: () => handleEdit(receipt)
      });
      actions.push({
        key: 'delete',
        label: 'Delete Voucher',
        tooltip: 'Delete Receipt Voucher',
        'aria-label': 'Delete Receipt Voucher',
        icon: Trash2,
        danger: true,
        variant: 'danger',
        onClick: () => handleDelete(receipt.id)
      });
    }

    const workflowExtra = buildWorkflowExtraActions(receipt);
    actions.push(...workflowExtra);

    return actions;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] animate-in fade-in">
      <PageHeader
        title="Receipt Vouchers"
        description="Manage incoming payments and allocations"
        icon={FileText}
        actions={[
          {
            key: 'create',
            label: 'New Receipt',
            icon: Plus,
            variant: 'primary',
            onClick: handleCreate,
            disabled: false
          }
        ]}
      />

      {/* ── Transaction Navigation (ModuleTabs) ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* Main Container with Generic DataTable */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={receipts}
          loading={isLoading}
          isRefreshing={isFetching}
          rowKey="id"

          // Selection
          selectable={true}
          selectedRows={selectedReceipts}
          onSelectionChange={setSelectedReceipts}

          // Expandable drawer
          renderExpandedRow={(receipt) => <ReceiptOverview receipt={receipt} />}

          // Filters
          searchable={true}
          searchValue={search || ''}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search Receipts..."
          filters={basicFilters}
          advancedFilters={advancedFilters}
          isAdvancedOpen={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(prev => !prev)}
          filterValues={filters}
          onFilterChange={(key, val) => {
            setFilter(key, val);
            setPage(0);
          }}
          onReset={handleClearFilters}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          getRowActions={getRowActions}

          // Pagination
          pagination={{
            page,
            pageSize: pageSize || 10,
            totalElements: pageInfo?.totalElements || receipts.length || 0,
            totalPages: pageInfo?.totalPages || 1
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          itemName="receipts"

          // Empty state
          emptyMessage="No receipt vouchers found matching the criteria."
          emptyDescription="Try adjusting your filters or record a new receipt."
          emptyAction={{
            label: 'New Receipt',
            icon: Plus,
            onClick: handleCreate
          }}
        />
      </div>

      <ReceiptVoucherFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedReceipt}
        onSuccess={() => refetch()}
      />

      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => { setIsCustomerFormOpen(false); setPrefillCustomerName(''); }}
        initialData={prefillCustomerName ? { customerName: prefillCustomerName } : null}
        onSubmit={handleCreateCustomerFromSearch}
      />
    
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="receipt-vouchers"
        defaultFilters={queryFilters}
        selectedIds={selectedReceipts}
        selectedCount={selectedReceipts.length}
      />

      <DeliveryChallanFromSoModal
        isOpen={!!selectedReceiptForDc}
        onClose={() => setSelectedReceiptForDc(null)}
        receipt={selectedReceiptForDc}
        onSuccess={() => {
          setSelectedReceiptForDc(null);
          refetch();
        }}
      />
    </div>
  );
}
