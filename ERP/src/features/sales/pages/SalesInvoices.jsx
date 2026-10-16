import React, { useState, useMemo, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import {
  FileText, Plus, Download, Mail, Edit, Trash2, CheckCircle, XCircle,
  ArrowRightCircle, CheckSquare, RefreshCw, Eye
} from 'lucide-react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { salesInvoicesApi, customersApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import InvoiceFormModal from '../components/InvoiceFormModal';
import CustomerFormModal from '../../account/components/CustomerFormModal';
import InvoiceTaxesModal from '../components/InvoiceTaxesModal';
import PartialPaymentModal from '../components/PartialPaymentModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import ReceiptVoucherFormModal from '../../finance/components/ReceiptVoucherFormModal';
import { FILTER_CONFIGS } from '../../../constants/filterConfigs';
import useApiFilters from '../../../hooks/useApiFilters';
import UpdateModal from '../../../components/common/UpdateModal';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import { useGetCustomersQuery } from '../../../api/sales-crm';
import AuditLogHover from '../../../components/common/AuditLogHover';

const formatStatusLabel = (status) => String(status || '')
  .toLowerCase()
  .replace(/_/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

const SalesInvoiceOverview = ({ inv }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const curr = inv.invoiceCurrency || inv.currency || 'INR';
  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {inv.invoiceNumber || inv.invoiceNo}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{inv.customerName || inv.customer}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {inv.invoiceDate} | Due: {inv.dueDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${inv.status === 'POSTED' || inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : inv.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {inv.status}
          </span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {inv.paymentStatus || 'UNPAID'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Grand Total</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">{curr} {fmt(inv.totalAmount ?? inv.grandTotal)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Outstanding</p>
          <p className="text-sm font-bold text-red-600 mt-1">{curr} {fmt(inv.outstandingAmount ?? inv.outstanding)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment %</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">{inv.paymentPercentage ?? 0}%</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Item Count</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.itemCount || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Days Outstanding</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.daysOutstanding || 0} days</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Aging Bucket</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{inv.agingBucket || 'Current'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Currency</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{curr}</p>
        </div>
      </div>
    </div>
  );
};

export default function SalesInvoices() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { canCreate, canEdit, canDelete } = useRBAC();

  const { filterBarProps, apiParams, paginationProps, sortBy, sortOrder, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.salesInvoices, { defaultPageSize: 20, defaultSortBy: 'invoiceDate-desc' });

  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [invoiceSearchKey, setInvoiceSearchKey] = useState('');
  
  // Post-Invoice Receipt Voucher Workflow State
  const [isReceiptConfirmOpen, setIsReceiptConfirmOpen] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [isReceiptFormOpen, setIsReceiptFormOpen] = useState(false);
  const [createdInvoiceContext, setCreatedInvoiceContext] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceForTaxes, setSelectedInvoiceForTaxes] = useState(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [prefillCustomerName, setPrefillCustomerName] = useState('');

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: customersResponse } = useGetCustomersQuery(
    { companyId, page: 0, size: 500 },
    { skip: !companyId }
  );

  const handleBulkEmail = async () => {
    if (selectedInvoices.length === 0) return;
    if (!(await confirmDialog({ message: `Are you sure you want to send email for ${selectedInvoices.length} selected invoice(s)?` }))) return;

    setIsProcessingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedInvoices) {
      try {
        await salesInvoicesApi.sendEmail(id, companyId);
        successCount++;
      } catch (err) {
        console.error('Email error for ID', id, err);
        failCount++;
      }
    }

    setIsProcessingBulk(false);
    if (successCount > 0) dispatch(addAlert({ type: 'success', message: `Successfully sent email for ${successCount} invoice(s).` }));
    if (failCount > 0) dispatch(addAlert({ type: 'error', message: `Failed to send email for ${failCount} invoice(s).` }));

    setSelectedInvoices([]);
  };

  const handleBulkDownload = async () => {
    if (selectedInvoices.length === 0) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedInvoices) {
      try {
        const response = await salesInvoicesApi.downloadPdf(id, companyId);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const invoice = allInvoices.find(i => (i.id || i.invoiceId) === id);
        const fileName = invoice?.invoiceNumber ? `Invoice_${invoice.invoiceNumber}.pdf` : `Invoice_${id}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        successCount++;
      } catch (err) {
        console.error('Download error for ID', id, err);
        failCount++;
      }
    }

    setIsProcessingBulk(false);
    if (successCount > 0) dispatch(addAlert({ type: 'success', message: `Successfully downloaded ${successCount} invoice(s).` }));
    if (failCount > 0) dispatch(addAlert({ type: 'error', message: `Failed to download ${failCount} invoice(s).` }));

    setSelectedInvoices([]);
  };

  const createCustomerMutation = useApiMutation(customersApi.create);

  const handleCreateCustomer = async (payload) => {
    try {
      await createCustomerMutation.mutateAsync([payload]);
      dispatch(addAlert({ type: 'success', message: 'Customer created successfully' }));
      setIsCustomerFormOpen(false);
      setPrefillCustomerName('');
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create customer' }));
    }
  };

  useEffect(() => {
    if (location.state?.sourceOrder) {
      setSelectedInvoice(location.state.sourceOrder);
      setIsFormOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Queries
  const { data: apiData = {}, isLoading, isFetching, refetch } = useApiQuery(salesInvoicesApi.getList, { ...apiParams });
  const pageData = apiData?.data ?? apiData;
  const allInvoices = Array.isArray(pageData) ? pageData : pageData?.content || apiData?.content || [];
  const pageInfo = apiData?._pageInfo || pageData?.page || apiData?.pagination || apiData?.page || {};
  const invoices = allInvoices;
  const totalElements = pageInfo?.totalElements ?? allInvoices.length;
  const totalPages = pageInfo?.totalPages || Math.ceil(totalElements / (pageSize || 20)) || 1;

  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : (customersResponse?.content || customersResponse?.data?.content || customersResponse?.data || []);
  const customerOptions = useMemo(() => customers
    .filter(customer => customer?.id)
    .map(customer => ({
      label: customer.customerName || customer.name || customer.customerCode || customer.id,
      value: customer.id
    })), [customers]);

  // Mutations
  const { mutateAsync: createInvoice, isLoading: isCreating } = useApiMutation(salesInvoicesApi.create, {
    onSuccess: () => refetch()
  });
  const { mutateAsync: updateInvoice, isLoading: isUpdating } = useApiMutation(
    ({ invoiceId, data }) => salesInvoicesApi.update(invoiceId, data),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: deleteInvoice } = useApiMutation(
    ({ invoiceId }) => salesInvoicesApi.delete(invoiceId),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: approveInvoice } = useApiMutation(
    ({ invoiceId }) => salesInvoicesApi.approve(invoiceId),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: postInvoice } = useApiMutation(
    ({ invoiceId }) => salesInvoicesApi.postToGL(invoiceId),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: rejectInvoice } = useApiMutation(
    ({ invoiceId }) => salesInvoicesApi.reject(invoiceId),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: cancelInvoice } = useApiMutation(
    ({ invoiceId }) => salesInvoicesApi.cancel(invoiceId),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: markPaid } = useApiMutation(
    ({ invoiceId, paymentAmount }) => salesInvoicesApi.markPaid(invoiceId, paymentAmount),
    { onSuccess: () => refetch() }
  );
  const { mutateAsync: recordPartialPayment } = useApiMutation(
    ({ invoiceId, paymentAmount }) => salesInvoicesApi.partialPayment(invoiceId, paymentAmount),
    { onSuccess: () => refetch() }
  );

  const getErrorMessage = (err, defaultMsg) => {
    const msg = err?.response?.data?.message || err?.data?.message || err?.message || defaultMsg;
    if (msg && msg.includes('ClosedPeriodException')) {
      return 'Transaction falls in a closed financial period. Please select an open period.';
    }
    if (err?.response?.data?.error === 'ClosedPeriodException' || err?.data?.error === 'ClosedPeriodException') {
      return 'Transaction falls in a closed financial period. Please select an open period.';
    }
    if (msg && msg.includes('No open fiscal year')) {
      return 'No open fiscal year exists for the selected invoice date. Please create or open a fiscal year first.';
    }
    return msg;
  };

  const handleCreate = async (data, flags = {}) => {
    try {
      const result = await createInvoice(data);
      dispatch(addAlert({ type: 'success', message: 'Invoice generated successfully' }));

      const newInvoiceId = result?.data?.id || result?.id || result?.data?.invoiceId || result?.invoiceId;

      if (newInvoiceId) {
        if (flags.sendEmail) {
          try {
            await salesInvoicesApi.sendEmail(newInvoiceId, companyId);
            dispatch(addAlert({ type: 'success', message: 'Email sent successfully' }));
          } catch (err) {
            console.error('Email error', err);
            dispatch(addAlert({ type: 'error', message: 'Invoice generated but failed to send email' }));
          }
        }

        if (flags.downloadPdf) {
          try {
            const response = await salesInvoicesApi.downloadPdf(newInvoiceId, companyId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = data.data.invoiceNumber ? `Invoice_${data.data.invoiceNumber}.pdf` : `Invoice_${newInvoiceId}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
          } catch (err) {
            console.error('Download error', err);
            dispatch(addAlert({ type: 'error', message: 'Invoice generated but failed to download PDF' }));
          }
        }
      }
      return newInvoiceId;
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getErrorMessage(err, 'Failed to generate invoice') }));
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateInvoice({ invoiceId: selectedInvoice.id, data });
      dispatch(addAlert({ type: 'success', message: 'Invoice updated successfully' }));
      setIsUpdateModalOpen(false);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getErrorMessage(err, 'Failed to update invoice') }));
    }
  };

  const handleDelete = async (record) => {
    const invoiceId = typeof record === "object" ? record.id : record;
    if (!(await confirmDialog({ message: 'Are you sure you want to delete this invoice?', info: typeof record === "object" ? record : null }))) return;
    try {
      await deleteInvoice({ invoiceId });
      dispatch(addAlert({ type: 'success', message: 'Invoice deleted successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getErrorMessage(err, 'Failed to delete invoice') }));
    }
  };

  const handleAction = async (actionFn, invoiceId, successMsg) => {
    try {
      const response = await actionFn({ invoiceId });
      const message = response?.message || successMsg;
      dispatch(addAlert({ type: 'success', message: message }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getErrorMessage(err, 'Action failed') }));
    }
  };

  const handlePartialPayment = async (amount) => {
    try {
      await recordPartialPayment({ invoiceId: selectedInvoiceForPayment.id, paymentAmount: amount });
      dispatch(addAlert({ type: 'success', message: 'Payment recorded successfully' }));
      setSelectedInvoiceForPayment(null);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getErrorMessage(err, 'Failed to record payment') }));
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return 'badge-draft';
    const s = status.toString().toUpperCase();
    if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') return 'badge-success';
    if (s === 'CREATED' || s === 'DRAFT' || s === 'PENDING_APPROVAL' || s === 'PARTIALLY_PAID') return 'badge-warning';
    if (s === 'CANCELLED' || s === 'REJECTED') return 'badge-danger';
    return 'badge-draft';
  };

  // Columns definition for DataTable
  const columns = useMemo(() => [
    {
      id: 'invoiceNo',
      label: 'Invoice No',
      sortable: true,
      sortKey: 'invoiceNumber',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-primary">{row.invoiceNumber}</span>
        </div>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      sortKey: 'customerName',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.customerName || '—'}</span>
      )
    },
    {
      id: 'invoiceDate',
      label: 'Date',
      sortable: true,
      sortKey: 'invoiceDate',
      render: (val, row) => <span className="font-medium text-zinc-700">{row.invoiceDate}</span>
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: true,
      sortKey: 'dueDate',
      render: (val, row) => <span className="font-medium text-zinc-700">{row.dueDate}</span>
    },
    {
      id: 'totalAmount',
      label: 'Total Amount',
      align: 'right',
      sortable: true,
      sortKey: 'totalAmount',
      render: (val, row) => (
        <span className="font-medium text-zinc-800">
          {row.invoiceCurrency} {(row.totalAmount || 0).toLocaleString()}
        </span>
      )
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      sortKey: 'outstandingAmount',
      render: (val, row) => (
        <span className="font-medium text-amber-600">
          {row.invoiceCurrency} {(row.outstandingAmount || 0).toLocaleString()}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Invoice Status',
      align: 'center',
      sortable: true,
      sortKey: 'status',
      render: (val, row) => <DataTableStatusBadge status={row.status || 'DRAFT'} label={formatStatusLabel(row.status || 'DRAFT')} showIcon={false} />
    },
    {
      id: 'paymentStatus',
      label: 'Payment Status',
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.paymentStatus || 'UNPAID'} label={formatStatusLabel(row.paymentStatus || 'UNPAID')} showIcon={false} />
    }
  ], []);

  // Filter definitions
  const statusOptions = useMemo(() => {
    return [
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
      { label: 'Approved', value: 'APPROVED' },
      { label: 'Posted', value: 'POSTED' },
      { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
      { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
      { label: 'Paid', value: 'PAID' },
      { label: 'Cancelled', value: 'CANCELLED' },
      { label: 'Rejected', value: 'REJECTED' },
      { label: 'Written Off', value: 'WRITTEN_OFF' },
      { label: 'Voided', value: 'VOIDED' },
      { label: 'Reversed', value: 'REVERSED' },
      { label: 'Inventory Failed', value: 'INVENTORY_FAILED' },
      { label: 'Fully Paid', value: 'FULLY_PAID' }
    ];
  }, []);

  const basicFilters = useMemo(() => [
    {
      key: 'statuses',
      label: 'Status',
      type: 'select',
      placeholder: 'Select an option',
      options: statusOptions
    },
    {
      key: 'invoiceDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'invoiceDateTo',
      label: 'Date To',
      type: 'date'
    }
  ], [statusOptions]);

  const advancedFilters = useMemo(() => [
    {
      title: 'Invoice Filters',
      fields: [
        { key: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
        { key: 'customerId', label: 'Customer', type: 'select', options: customerOptions }
      ]
    },
    {
      title: 'Payment Filters',
      fields: [
        { key: 'dueDateFrom', label: 'Due Date From', type: 'date' },
        { key: 'dueDateTo', label: 'Due Date To', type: 'date' },
        { key: 'minOutstandingAmount', label: 'Min Outstanding', type: 'number' },
        { key: 'maxOutstandingAmount', label: 'Max Outstanding', type: 'number' },
        {
          key: 'hasOutstandingBalance',
          label: 'Has Outstanding Balance',
          type: 'select',
          options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]
        },
        {
          key: 'isOverdue',
          label: 'Overdue Only',
          type: 'select',
          options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]
        }
      ]
    },
    {
      title: 'Posting Filters',
      fields: [{
        key: 'postingStatuses',
        label: 'Posting Status',
        type: 'select',
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Posted', value: 'POSTED' },
          { label: 'Failed', value: 'FAILED' },
          { label: 'Reversed', value: 'REVERSED' },
          { label: 'Cancelled', value: 'CANCELLED' }
        ]
      }]
    }
  ], [customerOptions]);

  const filterValues = useMemo(() => {
    const map = {};
    for (const f of filterBarProps.filters) {
      if (f.value !== undefined) {
        map[f.key] = f.value;
      }
    }
    return map;
  }, [filterBarProps.filters]);

  // Row actions
  const getRowActions = (item) => {
    const actions = [
      {
        key: 'view',
        label: 'View Invoice',
        tooltip: 'View Sales Invoice Details',
        'aria-label': 'View Sales Invoice Details',
        icon: Eye,
        onClick: () => navigate(buildPath(`/accounts/sales/invoices/${item.id || item.invoiceId}`))
      },
      {
        key: 'audit',
        component: ({ row }) => <AuditLogHover audit={row.audit} />
      }
    ];

    if ((item.status === 'DRAFT' || item.status === 'PENDING_APPROVAL') && canEdit()) {
      actions.push({
        key: 'edit',
        label: 'Edit Invoice',
        tooltip: 'Edit Sales Invoice',
        'aria-label': 'Edit Sales Invoice',
        icon: Edit,
        onClick: () => {
          setSelectedInvoice(item);
          setIsUpdateModalOpen(true);
        }
      });
    }

    if (item.status === 'DRAFT' && canDelete()) {
      actions.push({
        key: 'delete',
        label: 'Delete Invoice',
        tooltip: 'Delete Sales Invoice',
        'aria-label': 'Delete Sales Invoice',
        icon: Trash2,
        danger: true,
        variant: 'danger',
        onClick: () => handleDelete(item.id)
      });
    }

    actions.push({
      key: 'taxes',
      label: 'View Taxes',
      tooltip: 'View Invoice Taxes Breakdown',
      'aria-label': 'View Invoice Taxes Breakdown',
      icon: FileText,
      onClick: () => setSelectedInvoiceForTaxes(item)
    });

    actions.push({
      key: 'download',
      label: 'Download PDF',
      tooltip: 'Download Invoice PDF',
      'aria-label': 'Download Invoice PDF',
      icon: Download,
      onClick: async () => {
        try {
          const response = await salesInvoicesApi.downloadPdf(item.id, companyId);
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Sales_Invoice_${item.invoiceNumber || item.id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          dispatch(addAlert({ type: 'success', message: 'PDF downloaded successfully' }));
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: 'Failed to download PDF' }));
        }
      }
    });

    actions.push({
      key: 'email',
      label: 'Email Invoice',
      tooltip: 'Send Invoice via Email',
      'aria-label': 'Send Invoice via Email',
      icon: Mail,
      onClick: async () => {
        try {
          await salesInvoicesApi.sendEmail(item.id, companyId);
          dispatch(addAlert({ type: 'success', message: 'Invoice emailed successfully' }));
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to email invoice' }));
        }
      }
    });

    if ((item.status === 'DRAFT' || item.status === 'PENDING_APPROVAL') && canEdit()) {
      actions.push({
        key: 'approve',
        label: 'Approve Invoice',
        tooltip: 'Approve Sales Invoice',
        'aria-label': 'Approve Sales Invoice',
        icon: CheckCircle,
        onClick: () => handleAction(approveInvoice, item.id, 'Invoice approved')
      });
      actions.push({
        key: 'reject',
        label: 'Reject Invoice',
        tooltip: 'Reject Sales Invoice',
        'aria-label': 'Reject Sales Invoice',
        icon: XCircle,
        danger: true,
        variant: 'danger',
        onClick: () => handleAction(rejectInvoice, item.id, 'Invoice rejected')
      });
    }

    if (item.status === 'APPROVED' && canEdit()) {
      actions.push({
        key: 'post-gl',
        label: 'Post to GL',
        tooltip: 'Post Invoice to General Ledger',
        'aria-label': 'Post Invoice to General Ledger',
        icon: ArrowRightCircle,
        onClick: () => handleAction(postInvoice, item.id, 'Invoice posted to GL')
      });
    }

    if ((item.status === 'POSTED' || item.status === 'PARTIALLY_PAID') && canEdit() && item.outstandingAmount > 0) {
      actions.push({
        key: 'record-payment',
        label: 'Record Payment',
        tooltip: 'Record Payment for Invoice',
        'aria-label': 'Record Payment for Invoice',
        icon: CheckSquare,
        onClick: () => setSelectedInvoiceForPayment(item)
      });
      actions.push({
        key: 'mark-paid',
        label: 'Mark Fully Paid',
        tooltip: 'Mark Invoice as Fully Paid',
        'aria-label': 'Mark Invoice as Fully Paid',
        icon: CheckCircle,
        onClick: () => handleAction(markPaid, item.id, 'Invoice marked as fully paid')
      });
    }

    if (item.status !== 'PAID' && item.status !== 'CANCELLED' && item.status !== 'REJECTED' && canEdit()) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Invoice',
        tooltip: 'Cancel Invoice',
        'aria-label': 'Cancel Invoice',
        icon: XCircle,
        danger: true,
        variant: 'danger',
        onClick: async () => {
          if (await confirmDialog({
            title: 'Cancel Invoice',
            message: 'Are you sure you want to cancel this invoice? This action cannot be undone.',
            info: item,
            isDestructive: true
          })) {
            handleAction(cancelInvoice, item.id, 'Invoice cancelled');
          }
        }
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 animate-in fade-in">
      <PageHeader
        title="Sales Invoices"
        description="Manage sales invoices"
        icon={FileText}
        actions={[

          ...(canCreate() ? [{
            key: 'create',
            label: 'Generate Invoice',
            icon: Plus,
            variant: 'primary',
            onClick: () => {
              setSelectedInvoice(null);
              setIsFormOpen(true);
            }
          }] : [])
        ]}
      >
        {selectedInvoices.length > 0 && (
          <div className="flex items-center gap-2 mr-2 pr-4 border-r border-zinc-200">
            <span className="text-sm font-medium text-zinc-500 mr-2">{selectedInvoices.length} selected</span>
            <button
              onClick={handleBulkEmail}
              disabled={isProcessingBulk}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              title="Send via Email"
            >
              {isProcessingBulk ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={isProcessingBulk}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              title="Download PDF"
            >
              {isProcessingBulk ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        )}
      </PageHeader>

      {/* ── Transaction Navigation (ModuleTabs) ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* Main Container with Generic DataTable */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={invoices}
          loading={isLoading}
          isRefreshing={isFetching}
          rowKey="id"

          // Selection
          selectable={true}
          selectedRows={selectedInvoices}
          onSelectionChange={setSelectedInvoices}

          // Expandable drawer
          renderExpandedRow={(row) => <SalesInvoiceOverview inv={row} />}

          // Filters
          searchable={true}
          searchValue={filterBarProps.searchTerm || ''}
          onSearchChange={filterBarProps.onSearchChange}
          searchPlaceholder="Search Invoices..."
          filters={basicFilters}
          advancedFilters={advancedFilters}
          isAdvancedOpen={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(prev => !prev)}
          filterValues={filterValues}
          onFilterChange={filterBarProps.onFilterChange}
          onReset={() => {
            filterBarProps.onClearAll();
            setSelectedInvoices([]);
            setShowAdvancedFilters(false);
          }}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          getRowActions={getRowActions}

          // Pagination
          pagination={{
            page: paginationProps.page,
            pageSize: paginationProps.pageSize || pageSize || 10,
            totalElements,
            totalPages
          }}
          pageIndexBase={0}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
          itemName="invoices"

          // Empty state
          emptyMessage="No invoices found."
          emptyDescription="Try adjusting your search criteria or generate a new invoice."
          emptyAction={canCreate() ? {
            label: 'Generate Invoice',
            icon: Plus,
            onClick: () => { setSelectedInvoice(null); setIsFormOpen(true); }
          } : undefined}
        />
      </div>

      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedInvoice(null); }}
        initialData={selectedInvoice}
        onSubmit={async (data, flags, summaryTotals) => {
          try {
            const newInvoiceId = await handleCreate(data, flags);
            if (newInvoiceId && !selectedInvoice?.id) {
              setCreatedInvoiceContext({
                id: newInvoiceId,
                customerId: data.data.customerId,
                totalAmount: summaryTotals?.grandTotal || 0,
              });
              setIsReceiptConfirmOpen(true);
              // Do NOT close the InvoiceFormModal here. Wait for user action on the receipt modal.
            } else {
              setIsFormOpen(false);
              setSelectedInvoice(null);
            }
          } catch (e) {
            // error is handled inside handleCreate
          }
        }}
        isSubmitting={isCreating}
      />

      <InvoiceTaxesModal
        isOpen={!!selectedInvoiceForTaxes}
        onClose={() => setSelectedInvoiceForTaxes(null)}
        invoice={selectedInvoiceForTaxes}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Edit Sales Invoice"
        fields={FILTER_CONFIGS.salesInvoices.updateConfig.fields}
        initialData={selectedInvoice}
        onSubmit={handleUpdate}
        isSubmitting={isUpdating}
      />

      <PartialPaymentModal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
        onSubmit={handlePartialPayment}
        isSubmitting={false}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="sales-invoice"
        defaultFilters={Object.fromEntries(filterBarProps.filters.filter(f => f.value).map(f => [f.key, f.value]))}
        selectedIds={selectedInvoices}
        selectedCount={selectedInvoices.length}
      />

      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => { setIsCustomerFormOpen(false); setPrefillCustomerName(''); }}
        initialData={prefillCustomerName ? { customerName: prefillCustomerName } : null}
        onSubmit={handleCreateCustomer}
      />

      <ConfirmModal
        open={isReceiptConfirmOpen}
        title="Receipt Voucher Confirmation"
        message="Do you want to make a Receipt Voucher for this invoice?"
        confirmLabel="Yes"
        cancelLabel="No"
        isDestructive={false}
        loading={isProcessingReceipt}
        loadingText="Approving and posting invoice..."
        onConfirm={async () => {
          if (!createdInvoiceContext?.id) return;
          setIsProcessingReceipt(true);
          try {
            await approveInvoice({ invoiceId: createdInvoiceContext.id });
            await postInvoice({ invoiceId: createdInvoiceContext.id });
            setIsReceiptConfirmOpen(false);
            setIsFormOpen(false);
            setSelectedInvoice(null);
            setIsReceiptFormOpen(true);
          } catch (error) {
            dispatch(addAlert({ type: 'error', message: getErrorMessage(error, 'Failed to process invoice for receipt') }));
          } finally {
            setIsProcessingReceipt(false);
          }
        }}
        onCancel={() => {
          setIsReceiptConfirmOpen(false);
          setCreatedInvoiceContext(null);
          setIsFormOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {isReceiptFormOpen && (
        <ReceiptVoucherFormModal
          isOpen={isReceiptFormOpen}
          onClose={() => {
            setIsReceiptFormOpen(false);
            setCreatedInvoiceContext(null);
          }}
          initialData={
            createdInvoiceContext ? {
              customerId: createdInvoiceContext.customerId,
              receiptAmount: createdInvoiceContext.totalAmount,
              receiptDate: new Date().toISOString().split('T')[0],
              allocations: [{
                salesInvoiceId: createdInvoiceContext.id,
                allocatedAmount: createdInvoiceContext.totalAmount
              }]
            } : null
          }
        />
      )}
    </div>
  );
}
