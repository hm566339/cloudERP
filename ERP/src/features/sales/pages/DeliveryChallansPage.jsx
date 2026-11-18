import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import { 
  Truck, Plus, Download, Edit2, Eye, Check, X, Calendar, MapPin, Clock, 
  CheckCircle, Package, FileText, ReceiptText
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  useGetDeliveryChallansQuery,
  useLazyGetDeliveryChallanByIdQuery,
  useConfirmDeliveryChallanMutation,
  useCancelDeliveryChallanMutation,
  useGenerateInvoiceFromDeliveryChallanMutation
} from '../../../api/sales-crm/sales.api';
import { useGetCustomersQuery } from '../../../api/sales-crm';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import AuditLogHover from '../../../components/common/AuditLogHover';

import CreateDeliveryChallanModal from '../components/CreateDeliveryChallanModal';
import ViewDeliveryChallanModal from '../components/ViewDeliveryChallanModal';
import EditDeliveryChallanModal from '../components/EditDeliveryChallanModal';
import DeliveryInvoiceActionsModal from '../components/DeliveryInvoiceActionsModal';

function isUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

function fmtDate(d, fallback = '—') {
  if (!d) return fallback;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return fallback;
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

function fmtCurrency(n, fallback = '₹0.00') {
  if (n === undefined || n === null) return fallback;
  const num = Number(n);
  if (isNaN(num)) return fallback;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddress(addr) {
  if (!addr) return '—';
  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      return [
        parsed.attention,
        parsed.addressLine1,
        parsed.addressLine2,
        parsed.city,
        parsed.state,
        parsed.pinCode,
        parsed.country
      ].filter(Boolean).join(', ') || addr;
    } catch {
      return addr;
    }
  }
  if (typeof addr === 'object') {
    return [
      addr.attention,
      addr.addressLine1,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pinCode,
      addr.country
    ].filter(Boolean).join(', ') || '—';
  }
  return '—';
}

function DeliveryChallanOverview({ challan }) {
  if (!challan) return null;

  return (
    <div className="bg-zinc-50/60 dark:bg-[#1D212C] p-6 shadow-inner border-y border-zinc-200/80 dark:border-[#2A2F3D] space-y-5 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Customer</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">{challan.customerName || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Source Sales Order</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{challan.sourceSalesOrderNumber || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Challan Date</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{fmtDate(challan.dcDate)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Dispatch Date</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{fmtDate(challan.dispatchDate)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Status</span>
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              challan.status === 'CONFIRMED'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                : challan.status === 'CANCELLED'
                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-[#F5B544] dark:ring-amber-500/20'
            }`}>
              {challan.status || 'DRAFT'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Billing State</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{challan.billingStateCode || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Transporter</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate">
            {challan.transporterName && !isUuid(challan.transporterName) ? challan.transporterName : '—'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Vehicle Number</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{challan.vehicleNumber || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">LR Number</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{challan.lrNumber || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Reference Number</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{challan.referenceNumber || '—'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Subtotal</span>
          <p className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono">{fmtCurrency(challan.subtotal)}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184]">Total Amount</span>
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 font-mono">{fmtCurrency(challan.totalAmount)}</p>
        </div>
      </div>

      {/* Addresses & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] flex items-center gap-1">
            <MapPin size={11} /> Billing Address
          </span>
          <p className="text-zinc-700 dark:text-[#A0A6B5] leading-relaxed">{formatAddress(challan.billingAddressSnapshot)}</p>
        </div>

        <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] flex items-center gap-1">
            <Truck size={11} /> Delivery Address
          </span>
          <p className="text-zinc-700 dark:text-[#A0A6B5] leading-relaxed">{formatAddress(challan.deliveryAddressSnapshot)}</p>
        </div>

        <div className="bg-white dark:bg-[#161922] p-3 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs space-y-1">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] flex items-center gap-1">
            <FileText size={11} /> Notes
          </span>
          <p className="text-zinc-700 dark:text-[#A0A6B5] leading-relaxed">{challan.notes || '—'}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
          <span className="text-[9px] font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
            <Package size={13} className="text-zinc-400 dark:text-[#6B7184]" />
            Line Items ({challan.items?.length || 0})
          </span>
        </div>
        <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
          <table className="w-full min-w-[750px] text-left text-xs whitespace-nowrap" aria-label="Delivery Challan Line Items Table">
            <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Product</th>
                <th scope="col" className="px-3 py-2 font-semibold">Description</th>
                <th scope="col" className="px-3 py-2 font-semibold">HSN/SAC</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Quantity</th>
                <th scope="col" className="px-3 py-2 font-semibold">Unit</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Unit Price</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Discount</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Taxable Amount</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Tax</th>
                <th scope="col" className="px-3 py-2 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
              {(challan.items || []).map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]">
                  <td className="px-3 py-2 font-semibold text-zinc-900 dark:text-[#E6E8EE]">{it.itemName || '—'}</td>
                  <td className="px-3 py-2 text-zinc-500 dark:text-[#6B7184] max-w-[140px] truncate">{it.description || '—'}</td>
                  <td className="px-3 py-2 font-mono text-zinc-600 dark:text-[#A0A6B5]">{it.hsnSacCode || '—'}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-900 dark:text-[#E6E8EE] font-mono tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-[#A0A6B5]">{it.unit || 'Nos'}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-[#A0A6B5] tabular-nums">{fmtCurrency(it.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500 dark:text-[#6B7184] tabular-nums">{fmtCurrency(it.discountAmount)}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-[#A0A6B5] tabular-nums">{fmtCurrency(it.taxableAmount)}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-[#A0A6B5] tabular-nums">{fmtCurrency(it.taxAmount)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900 dark:text-[#E6E8EE] tabular-nums">{fmtCurrency(it.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryChallansPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const activeCompanyId = useParams().companyId || 
    (() => { try { return JSON.parse(localStorage.getItem('selected_company'))?.id; } catch { return null; } })() ||
    (() => { try { return JSON.parse(localStorage.getItem('auth_user'))?.companyCode; } catch { return null; } })();

  const getInvoiceUrl = (invId) => {
    if (location.pathname.includes('/accounts/')) {
      return invId ? `/accounts/transactions/sales/${invId}` : `/accounts/sales/invoices`;
    }
    return invId ? `/company/${activeCompanyId}/sales-crm/invoices/${invId}` : `/company/${activeCompanyId}/sales-crm/invoices`;
  };

  // UI state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedViewChallan, setSelectedViewChallan] = useState(null);
  const [editingChallanId, setEditingChallanId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [invoiceActionsPopup, setInvoiceActionsPopup] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, setSortBy, sortOrder, setSortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });

  const { data: customersResponse } = useGetCustomersQuery(
    { companyId: activeCompanyId, page: 0, size: 500 },
    { skip: !activeCompanyId }
  );

  // Query filters
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.search && filters.search.trim()) q.search = filters.search.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    if (filters.customerId && filters.customerId.trim()) q.customerId = filters.customerId.trim();
    if (filters.fromDate) q.fromDate = filters.fromDate;
    if (filters.toDate) q.toDate = filters.toDate;
    return q;
  }, [filters]);

  const { 
    data: apiResponse, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  } = useGetDeliveryChallansQuery({
    companyId: activeCompanyId,
    page,
    size: apiParams.size || 10,
    sort: `${sortBy || 'createdAt'},${sortOrder || 'desc'}`,
    ...queryFilters
  }, { skip: !activeCompanyId });

  const [getChallanDetails] = useLazyGetDeliveryChallanByIdQuery();
  const [confirmChallan] = useConfirmDeliveryChallanMutation();
  const [cancelChallan] = useCancelDeliveryChallanMutation();
  const [generateInvoiceFromDc, { isLoading: isGeneratingInvoice }] = useGenerateInvoiceFromDeliveryChallanMutation();

  const challans = Array.isArray(apiResponse)
    ? apiResponse
    : (apiResponse?.data?.content || apiResponse?.content || apiResponse?.data || []);

  const serverPagination = apiResponse?._pageInfo || (apiResponse?.data?.totalElements !== undefined
    ? apiResponse.data
    : (apiResponse?.pagination || apiResponse?.page || {}));

  const totalElements = serverPagination.totalElements ?? challans.length;
  const totalPages = serverPagination.totalPages ?? Math.max(1, Math.ceil(totalElements / (apiParams.size || 10)));

  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : (customersResponse?.content || customersResponse?.data?.content || customersResponse?.data || []);
  const customerOptions = useMemo(() => customers
    .filter(customer => customer?.id)
    .map(customer => ({
      label: customer.customerName || customer.name || customer.customerCode || customer.id,
      value: customer.id
    })), [customers]);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setShowAdvancedFilters(false);
  };

  const handleView = async (row) => {
    const id = row?.id;
    if (!id) {
      dispatch(addAlert({ type: 'error', message: 'Unable to load Delivery Challan details.' }));
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await getChallanDetails({ id, companyId: activeCompanyId }).unwrap();
      const data = res?.data?.id ? res.data : (res?.id ? res : null);
      if (!data) {
        dispatch(addAlert({ type: 'error', message: 'Unable to load Delivery Challan details.' }));
        return;
      }
      setSelectedViewChallan(data);
    } catch (err) {
      console.error('Error loading Delivery Challan details:', err);
      dispatch(addAlert({ type: 'error', message: 'Unable to load Delivery Challan details.' }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = (row) => {
    const isDraft = String(row?.status || '').toUpperCase() === 'DRAFT';
    if (!isDraft) return;
    const id = row?.id;
    if (!id) return;
    setEditingChallanId(id);
  };

  const handleConfirm = async (row) => {
    const isDraft = String(row?.status || '').toUpperCase() === 'DRAFT';
    if (!isDraft) return;
    const id = row?.id;
    if (!id) return;

    const confirmed = await confirmDialog({
      title: 'Confirm Delivery Challan',
      message: 'Are you sure you want to confirm this Delivery Challan?',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      isDestructive: false,
    });

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      const confirmRes = await confirmChallan({ id, companyId: activeCompanyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Delivery Challan confirmed successfully.' }));
      refetch();
      setInvoiceActionsPopup({
        dcId: id,
        dcNumber: row?.dcNumber || row?.deliveryChallanNumber,
        invoiceId: row?.salesInvoiceId || row?.invoiceId || confirmRes?.data?.salesInvoiceId || confirmRes?.data?.invoiceId,
        invoiceNumber: row?.salesInvoiceNumber || row?.invoiceNumber || confirmRes?.data?.salesInvoiceNumber || confirmRes?.data?.invoiceNumber,
        customerName: row?.customerName || row?.customer?.name || row?.customer?.customerName,
      });
    } catch (err) {
      console.error('Failed to confirm delivery challan:', err);
      const msg = err?.data?.message || err?.message || 'Unable to confirm Delivery Challan.';
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (row) => {
    const isCancelled = String(row?.status || '').toUpperCase() === 'CANCELLED';
    if (isCancelled) return;
    const id = row?.id;
    if (!id) return;

    const confirmed = await confirmDialog({
      title: 'Cancel Delivery Challan',
      message: 'Are you sure you want to cancel this Delivery Challan?',
      confirmLabel: 'Cancel Challan',
      cancelLabel: 'Keep',
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      await cancelChallan({ id, companyId: activeCompanyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Delivery Challan cancelled successfully.' }));
      refetch();
    } catch (err) {
      console.error('Failed to cancel delivery challan:', err);
      const msg = err?.data?.message || err?.message || 'Unable to cancel Delivery Challan.';
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateInvoice = async (row) => {
    const isConfirmed = String(row?.status || '').toUpperCase() === 'CONFIRMED';
    if (!isConfirmed) return;
    const id = row?.id;
    if (!id) return;

    const confirmed = await confirmDialog({
      title: 'Generate Sales Invoice',
      message: 'Are you sure you want to generate Sales Invoice from this Delivery Challan?',
      confirmLabel: 'Generate',
      cancelLabel: 'Cancel',
      isDestructive: false,
    });

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      const res = await generateInvoiceFromDc({ deliveryChallanId: id, companyId: activeCompanyId }).unwrap();
      const invoiceId = res?.data?.id || res?.id;
      dispatch(addAlert({ type: 'success', message: 'Sales Invoice generated successfully.' }));
      refetch();
      if (invoiceId) {
        navigate(getInvoiceUrl(invoiceId));
      }
    } catch (err) {
      console.error('Failed to generate sales invoice:', err);
      if (err?.status === 409 || (err?.status === 400 && String(err?.data?.message || '').toLowerCase().includes('already exists'))) {
        dispatch(addAlert({ type: 'info', message: err?.data?.message || 'Invoice already exists for this Delivery Challan.' }));
        const existingInvoiceId = err?.data?.data?.id || err?.data?.id;
        if (existingInvoiceId) {
          navigate(getInvoiceUrl(existingInvoiceId));
        }
      } else {
        const msg = err?.data?.message || err?.message || 'Unable to generate Sales Invoice from Delivery Challan.';
        dispatch(addAlert({ type: 'error', message: msg }));
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Define columns for generic DataTable
  const columns = useMemo(() => [
    {
      id: 'challanNumber',
      label: 'CHALLAN NO.',
      sortable: true,
      sortKey: 'dcNumber',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-indigo-600 shrink-0" />
          <span className="font-semibold text-zinc-900 font-mono text-xs">
            {row.dcNumber || '—'}
          </span>
        </div>
      )
    },
    {
      id: 'customer',
      label: 'CUSTOMER',
      sortable: true,
      sortKey: 'customerName',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 text-xs">
          {row.customerName || '—'}
        </span>
      )
    },
    {
      id: 'date',
      label: 'DATE',
      sortable: true,
      sortKey: 'dcDate',
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
          <Calendar size={13} className="text-zinc-400" />
          <span>{fmtDate(row.dcDate)}</span>
        </div>
      )
    },
    {
      id: 'sourceOrder',
      label: 'SOURCE ORDER',
      render: (val, row) => (
        <span className="font-mono text-zinc-600 text-xs">
          {row.sourceSalesOrderNumber || '—'}
        </span>
      )
    },
    {
      id: 'totalAmount',
      label: 'TOTAL AMOUNT',
      align: 'right',
      sortable: true,
      sortKey: 'totalAmount',
      render: (val, row) => (
        <span className="font-mono font-semibold text-zinc-900 text-xs">
          {fmtCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      id: 'status',
      label: 'STATUS',
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status || 'DRAFT'} showIcon={false} />
    }
  ], []);

  // Basic filters
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
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ]
    },
    { key: 'fromDate', label: 'Date From', type: 'date' },
    { key: 'toDate', label: 'Date To', type: 'date' }
  ], []);

  // Advanced filters
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

  // Row actions
  const getRowActions = (row) => {
    const isDraft = String(row.status || '').toUpperCase() === 'DRAFT';
    const isConfirmed = String(row.status || '').toUpperCase() === 'CONFIRMED';
    const isRowLoading = actionLoadingId === row.id;

    const actions = [
      {
        key: 'view',
        label: 'View Challan',
        tooltip: 'View Delivery Challan Details',
        'aria-label': 'View Delivery Challan Details',
        icon: Eye,
        onClick: () => handleView(row),
        disabled: isRowLoading
      },
      {
        key: 'audit',
        component: ({ row }) => <AuditLogHover audit={row.audit} />
      }
    ];

    if (isDraft) {
      actions.push({
        key: 'edit',
        label: 'Edit Challan',
        tooltip: 'Edit Delivery Challan',
        'aria-label': 'Edit Delivery Challan',
        icon: Edit2,
        onClick: () => handleEdit(row),
        disabled: isRowLoading
      });
      actions.push({
        key: 'confirm',
        label: 'Confirm Challan',
        tooltip: 'Confirm Delivery Challan',
        'aria-label': 'Confirm Delivery Challan',
        icon: Check,
        variant: 'emerald',
        onClick: () => handleConfirm(row),
        disabled: isRowLoading
      });
    }

    if (isConfirmed || String(row.status || '').toUpperCase() === 'APPROVED') {
      actions.push({
        key: 'generate-invoice',
        label: 'Generate Sales Invoice',
        tooltip: 'Generate Sales Invoice',
        'aria-label': 'Generate Sales Invoice',
        icon: ReceiptText,
        variant: 'indigo',
        onClick: () => handleGenerateInvoice(row),
        disabled: isRowLoading || isGeneratingInvoice
      });
    }

    if (isDraft || isConfirmed) {
      actions.push({
        key: 'cancel',
        label: 'Cancel Challan',
        tooltip: 'Cancel Delivery Challan',
        'aria-label': 'Cancel Delivery Challan',
        icon: X,
        danger: true,
        variant: 'danger',
        onClick: () => handleCancel(row),
        disabled: isRowLoading
      });
    }

    return actions;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] animate-in fade-in">
      {/* ── 1. Page Header ── */}
      <PageHeader title="Delivery Challans" description="Manage delivery challans" icon={Truck}>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>New Challan</span>
        </button>
      </PageHeader>

      {/* ── 2. Module Tabs ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* ── 2. MAIN CARD CONTAINER WITH GENERIC DATA TABLE ── */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={challans}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          rowKey="id"

          // Selection
          selectable={true}
          selectedRows={selectedChallans}
          onSelectionChange={setSelectedChallans}

          // Expandable drawer
          renderExpandedRow={(row) => <DeliveryChallanOverview challan={row} />}

          // Filters
          searchable={true}
          searchValue={filters.search || ''}
          onSearchChange={(val) => {
            setFilter('search', val);
            setPage(0);
          }}
          searchPlaceholder="Search Delivery Challans..."
          filters={basicFilters}
          advancedFilters={advancedFilters}
          isAdvancedOpen={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters(prev => !prev)}
          filterValues={filters}
          onFilterChange={(key, val) => {
            setFilter(key, val);
            setPage(0);
          }}
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => {
            if (sortBy === key) {
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(key);
              setSortOrder('asc');
            }
            setPage(0);
          }}

          // Row Actions
          getRowActions={getRowActions}

          // Pagination
          pagination={{
            page,
            totalPages,
            totalElements,
            pageSize: apiParams.size || 10
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="challans"

          // Empty state
          emptyMessage="No delivery challans found"
          emptyDescription="Create a Delivery Challan from a confirmed Sales Order to get started."
          emptyAction={{
            label: 'New Challan',
            icon: Plus,
            onClick: () => setIsCreateOpen(true)
          }}
        />
      </div>

      {/* ── MODALS ── */}
      {isCreateOpen && (
        <CreateDeliveryChallanModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          companyId={activeCompanyId}
          onSuccess={() => refetch()}
        />
      )}

      {selectedViewChallan && (
        <ViewDeliveryChallanModal
          isOpen={!!selectedViewChallan}
          onClose={() => setSelectedViewChallan(null)}
          challan={selectedViewChallan}
          challanId={selectedViewChallan.id}
          companyId={activeCompanyId}
          onEdit={(c) => {
            setSelectedViewChallan(null);
            handleEdit(c);
          }}
          onConfirm={(c) => {
            setSelectedViewChallan(null);
            handleConfirm(c);
          }}
          onCancel={(c) => {
            setSelectedViewChallan(null);
            handleCancel(c);
          }}
          onGenerateInvoice={(c) => {
            setSelectedViewChallan(null);
            handleGenerateInvoice(c);
          }}
        />
      )}

      {editingChallanId && (
        <EditDeliveryChallanModal
          isOpen={!!editingChallanId}
          onClose={() => setEditingChallanId(null)}
          challanId={editingChallanId}
          companyId={activeCompanyId}
          onSuccess={() => refetch()}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="delivery-challans"
          defaultFilters={queryFilters}
          selectedIds={selectedChallans}
          selectedCount={selectedChallans.length}
        />
      )}

      {invoiceActionsPopup && (
        <DeliveryInvoiceActionsModal
          isOpen={Boolean(invoiceActionsPopup)}
          onClose={() => setInvoiceActionsPopup(null)}
          companyId={activeCompanyId}
          dcId={invoiceActionsPopup.dcId}
          deliveryChallanId={invoiceActionsPopup.dcId}
          dcNumber={invoiceActionsPopup.dcNumber}
          deliveryChallanNumber={invoiceActionsPopup.dcNumber}
          invoiceId={invoiceActionsPopup.invoiceId}
          confirmedInvoiceId={invoiceActionsPopup.invoiceId}
          invoiceNumber={invoiceActionsPopup.invoiceNumber}
          customerName={invoiceActionsPopup.customerName}
          onComplete={() => {
            setInvoiceActionsPopup(null);
            refetch();
          }}
        />
      )}

    </div>
  );
}
