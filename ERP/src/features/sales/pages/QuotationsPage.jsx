import React, { useState, useMemo } from 'react';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import { Search, Plus, Filter, FileText, Edit, Trash2, Ban, CheckCircle, XCircle, ArrowRightCircle, CheckSquare, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, X, RefreshCw, Mail, Download, Send, Check, FilePlus, Eye, Clock, ShoppingCart } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useGetQuotationsQuery, useCreateQuotationMutation, useDeleteQuotationMutation, useLazyGetQuotationPdfQuery, useSendQuotationMutation, useSendQuotationEmailMutation, useAcceptQuotationMutation, useRejectQuotationMutation, useCancelQuotationMutation, useGetProformaInvoicesQuery, useCreateProformaInvoiceFromQuotationMutation, useGetSalesOrdersQuery, useGetSalesInvoicesByStatusQuery, useCreateSalesOrderFromQuotationMutation } from '../../../api/sales-crm';
import QuotationFormModal from '../components/QuotationFormModal';
import PIConversionFormModal from '../components/PIConversionFormModal';
import ActionableSearchInput from '../../../components/common/ActionableSearchInput';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import useApiFilters from '../../../hooks/useApiFilters';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { salesTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const QuotationOverview = ({ quote }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const curr = quote.quotationCurrency || quote.currency || 'INR';
  const cust = quote.customerInformation || quote.customer || {};
  const lineItems = quote.lineItems || quote.items || [];
  const taxSummary = quote.taxSummary || {};
  const amtSummary = quote.amountSummary || {};
  const terms = quote.termsAndConditions || {};
  const stats = quote.statistics || {};
  const audit = quote.audit || {};

  return (
    <div className="p-5 bg-white border border-zinc-100 rounded-xl shadow-sm m-4 mb-2 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
            {quote.quotationNumber || quote.quoteNo || '—'}
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{cust.customerName || cust.companyName || quote.customerName || '—'} {cust.customerCode ? <span className="text-sm font-medium text-zinc-500">({cust.customerCode})</span> : ''}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {quote.quotationDate ? new Date(quote.quotationDate).toLocaleDateString() : '—'} | Valid Until: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200`}>
            {quote.status || 'DRAFT'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Grand Total</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">{curr} {fmt(amtSummary.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Outstanding</p>
          <p className="text-sm font-bold text-amber-600 mt-1">{curr} {fmt(amtSummary.outstandingAmount || 0)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment %</p>
          <p className="text-sm font-bold text-emerald-600 mt-1">{stats.paymentPercentage ?? '—'}{stats.paymentPercentage != null ? '%' : ''}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Item Count</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{stats.itemCount ?? lineItems.length}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Days Outstanding</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{stats.daysOutstanding != null ? `${stats.daysOutstanding} days` : '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Aging Bucket</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{stats.agingBucket || '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Currency</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{curr}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Items</h4>
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-2 font-medium text-zinc-500">Item/Product</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Description</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Qty</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Unit</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Rate</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Discount</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Tax</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Tax %</th>
                <th className="px-4 py-2 font-medium text-zinc-500 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {lineItems.length > 0 ? lineItems.map((it, i) => (
                <tr key={i} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-2 font-medium text-zinc-900">{it.itemName || it.productName || it.name || '—'}</td>
                  <td className="px-4 py-2 text-zinc-500 truncate max-w-[120px]">{it.description || '—'}</td>
                  <td className="px-4 py-2 text-right">{it.quantity || 0}</td>
                  <td className="px-4 py-2">{it.uom || it.unit || '—'}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.unitPrice || it.rate || 0)}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.discountAmount || 0)}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.taxAmount || 0)}</td>
                  <td className="px-4 py-2 text-right">{it.taxRate != null ? `${it.taxRate}%` : (it.gstRate != null ? `${it.gstRate}%` : '—')}</td>
                  <td className="px-4 py-2 text-right font-medium">{fmt(it.totalAmount || it.lineTotal || 0)}</td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="px-4 py-4 text-center text-zinc-400">No items available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Additional Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Payment Terms</span><span className="font-medium text-right">{terms.paymentTerms || '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Delivery Terms</span><span className="font-medium text-right">{terms.deliveryTerms || '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Created By</span><span className="font-medium text-right">{audit.created?.by?.username || audit.createdBy || quote.createdByName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Created Date</span><span className="font-medium text-right">{audit.created?.at ? new Date(audit.created.at).toLocaleString() : (quote.createdAt ? new Date(quote.createdAt).toLocaleString() : '—')}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Updated Date</span><span className="font-medium text-right">{audit.updated?.at ? new Date(audit.updated.at).toLocaleString() : (quote.updatedAt ? new Date(quote.updatedAt).toLocaleString() : '—')}</span></div>
            <div>
              <span className="text-zinc-500 block mb-1">Notes</span>
              <p className="text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-100 text-xs min-h-[32px] whitespace-pre-wrap">{terms.notes || quote.notes || '—'}</p>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">Terms & Conditions</span>
              <p className="text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-100 text-xs min-h-[32px] whitespace-pre-wrap">{terms.termsAndConditions || quote.termsAndConditions || '—'}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Amount Summary</h4>
          <div className="space-y-2 text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <div className="flex justify-between"><span className="text-zinc-500">Subtotal</span><span className="font-medium">{curr} {fmt(amtSummary.subtotal || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span className="font-medium text-red-600">{amtSummary.discountAmount ? `-${curr} ${fmt(amtSummary.discountAmount)}` : '—'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Taxable Amount</span><span className="font-medium">{curr} {fmt(taxSummary.taxableAmount || amtSummary.subtotal || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">CGST</span><span className="font-medium">{curr} {fmt(taxSummary.cgst || taxSummary.cgstAmount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">SGST</span><span className="font-medium">{curr} {fmt(taxSummary.sgst || taxSummary.sgstAmount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">IGST</span><span className="font-medium">{curr} {fmt(taxSummary.igst || taxSummary.igstAmount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Other Charges</span><span className="font-medium">{curr} {fmt(amtSummary.otherCharges || 0)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Round Off</span><span className="font-medium">{curr} {fmt(amtSummary.roundOff || 0)}</span></div>
            <div className="pt-2 mt-2 border-t border-zinc-200 flex justify-between items-center">
              <span className="font-bold text-zinc-900">Grand Total</span>
              <span className="font-bold text-lg text-zinc-900">{curr} {fmt(amtSummary.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between mt-1"><span className="text-zinc-500">Paid Amount</span><span className="font-medium text-emerald-600">{curr} {fmt(amtSummary.paidAmount || amtSummary.receivedAmount || 0)}</span></div>
            <div className="flex justify-between mt-1"><span className="text-zinc-500 font-bold">Outstanding Amount</span><span className="font-bold text-amber-600">{curr} {fmt(amtSummary.outstandingAmount || 0)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuotationsPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort, apiParams } = useApiFilters(FILTER_CONFIGS.quotations || {}, { defaultPageSize: 10, defaultSortBy: 'createdAt,desc' });
  const { canCreate, canEdit, canDelete, canApprove } = useRBAC();

  const { data: apiResponse, isLoading, isFetching, refetch } = useGetQuotationsQuery({ companyId, ...apiParams });
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [deleteQuotation] = useDeleteQuotationMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [downloadPdf] = useLazyGetQuotationPdfQuery();
  const [sendEmail] = useSendQuotationMutation();
  const [sendQuotationEmail, { isLoading: isSendingEmail }] = useSendQuotationEmailMutation();
  const [acceptQuotation] = useAcceptQuotationMutation();
  const [rejectQuotation] = useRejectQuotationMutation();
  const [cancelQuotation] = useCancelQuotationMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState(null);

  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [quotationToSendEmail, setQuotationToSendEmail] = useState(null);

  // PI Creation Modal state
  const [isPIModalOpen, setIsPIModalOpen] = useState(false);
  const [targetQuotation, setTargetQuotation] = useState(null);
  // Map: quotationId -> { piId, piNumber } for quotations that already have a PI
  const [createdPiMap, setCreatedPiMap] = useState({});

  // Direct SO state
  const [createdSoMap, setCreatedSoMap] = useState({});
  const [createSalesOrderFromQuotation, { isLoading: isCreatingSO }] = useCreateSalesOrderFromQuotationMutation();

  // Custom states matching Sales Invoices
  const [selectedQuotations, setSelectedQuotations] = useState([]);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [isEmailingBulk, setIsEmailingBulk] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const quotes = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.data || apiResponse?.content || []);
  const serverPagination = apiResponse?.pagination || apiResponse?.page || {};
  const totalElements = serverPagination.totalElements || serverPagination.totalCount || quotes.length;
  const totalPages = serverPagination.totalPages || Math.max(1, Math.ceil(quotes.length / (pageSize || 10)));

  const finalFilterBarProps = {
    ...filterBarProps,
    filters: (filterBarProps.filters || []).map(f => {
      if (f.key === 'customerName') {
        const uniqueCustomers = Array.from(new Set(quotes.map(q => q.customer?.customerName || q.customerName).filter(Boolean)));
        return { ...f, options: uniqueCustomers.map(c => ({ label: c, value: c })) };
      }
      return f;
    })
  };

  const activeAdvancedFilterCount = React.useMemo(() => {
    const keys = ['validUntilFrom', 'validUntilTo', 'customerName'];
    return keys.filter(k => {
      const val = (filterBarProps.filters || []).find(f => f.key === k)?.value;
      return val !== undefined && val !== null && String(val).trim() !== '';
    }).length;
  }, [filterBarProps.filters]);

  const handleCreateQuote = async (data) => {
    try {
      await createQuotation({ companyId, ...data }).unwrap();
      setIsFormOpen(false);
      dispatch(addAlert({ type: 'success', message: 'Quotation created successfully' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to create quotation' }));
    }
  };

  const handleSend = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to mark this quotation as SENT?' })) {
      try {
        await sendEmail({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Quotation marked as SENT` }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || `Failed to mark as SENT` }));
      }
    }
  };

  const handleAccept = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to accept this quotation? This will lock it from further editing.' })) {
      try {
        await acceptQuotation({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Quotation marked as ACCEPTED` }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || `Failed to accept quotation` }));
      }
    }
  };

  const handleReject = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to reject this quotation?' })) {
      try {
        await rejectQuotation({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Quotation marked as REJECTED` }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || `Failed to reject quotation` }));
      }
    }
  };

  const handleCancel = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to cancel this quotation?' })) {
      try {
        await cancelQuotation({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Quotation marked as CANCELLED` }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || `Failed to cancel quotation` }));
      }
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await sendQuotationEmail({ id: quotationToSendEmail.id, companyId }).unwrap();
      if (response?.success && response?.data?.emailStatus === 'SENT') {
        dispatch(addAlert({ type: 'success', message: 'Quotation email sent successfully' }));
      } else {
        dispatch(addAlert({ type: 'error', message: response?.message || 'Failed to send quotation email.' }));
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to send quotation email.' }));
    } finally {
      setIsSendEmailModalOpen(false);
      setQuotationToSendEmail(null);
    }
  };

  // Fetch PIs and SOs to determine which ACCEPTED quotations already have a PI or SO.
  const acceptedQuotationIds = useMemo(() =>
    quotes.filter(q => q.status === 'ACCEPTED').map(q => q.id),
    [quotes]
  );

  const { data: piListData } = useGetProformaInvoicesQuery(
    { companyId, size: 200 },
    { skip: !companyId || acceptedQuotationIds.length === 0 }
  );

  const { data: soListData } = useGetSalesOrdersQuery(
    { companyId, size: 200 },
    { skip: !companyId || acceptedQuotationIds.length === 0 }
  );

  const { data: fullyPaidInvoicesData } = useGetSalesInvoicesByStatusQuery(
    { companyId, status: 'FULLY_PAID' },
    { skip: !companyId || acceptedQuotationIds.length === 0 }
  );

  // Set of customer IDs who have at least one fully paid invoice
  const eligibleCustomerIds = useMemo(() => {
    const list = Array.isArray(fullyPaidInvoicesData)
      ? fullyPaidInvoicesData
      : fullyPaidInvoicesData?.content || fullyPaidInvoicesData?.data || [];
    const ids = new Set();
    list.forEach(inv => {
      if (inv.customerId) ids.add(inv.customerId);
    });
    return ids;
  }, [fullyPaidInvoicesData]);

  // Build a sourceQuotationId -> PI map
  const quotationToPiMap = useMemo(() => {
    const piList = Array.isArray(piListData)
      ? piListData
      : piListData?.content || piListData?.data || [];
    const map = {};
    piList.forEach(pi => {
      if (pi.sourceQuotationId) {
        map[pi.sourceQuotationId] = { piId: pi.id, piNumber: pi.piNumber };
      }
    });
    return { ...map, ...createdPiMap };
  }, [piListData, createdPiMap]);

  // Build a sourceQuotationId -> SO map
  const quotationToSoMap = useMemo(() => {
    const soList = Array.isArray(soListData)
      ? soListData
      : soListData?.content || soListData?.data || [];
    const map = {};
    soList.forEach(so => {
      if (so.sourceQuotationId) {
        map[so.sourceQuotationId] = { soId: so.id, soNumber: so.soNumber };
      }
    });
    return { ...map, ...createdSoMap };
  }, [soListData, createdSoMap]);

  const handleCreateSO = async (quotation) => {
    if (isCreatingSO) return;
    if (await confirmDialog({
      title: "Create Sales Order?",
      message: 'Create a Sales Order directly from this accepted quotation?',
      confirmText: 'Create Sales Order'
    })) {
      try {
        const res = await createSalesOrderFromQuotation({ quotationId: quotation.id, companyId }).unwrap();
        const soNum = res?.data?.soNumber ? ` ${res.data.soNumber}` : '';
        dispatch(addAlert({ type: 'success', message: `Sales Order created successfully${soNum}` }));
        if (res?.data?.id) {
          setCreatedSoMap(prev => ({
            ...prev,
            [quotation.id]: { soId: res.data.id, soNumber: res.data.soNumber || '' }
          }));
          navigate(`/accounts/transactions/sales-orders/${res.data.id}`);
        }
        refetch();
      } catch (err) {
        let msg = 'Unable to create Sales Order. Please try again.';
        if (err?.status === 400 && err?.data?.message) {
            msg = err.data.message;
        } else if (err?.status === 404) {
            msg = 'Quotation not found.';
        } else if (err?.data?.message) {
            msg = err.data.message;
        }
        dispatch(addAlert({ type: 'error', message: msg }));
      }
    }
  };

  const handleCreatePI = (quotation) => {
    if (quotation.status !== 'ACCEPTED') {
      dispatch(addAlert({ type: 'error', message: 'Only ACCEPTED quotations can be converted into a Proforma Invoice.' }));
      return;
    }
    setTargetQuotation(quotation);
    setIsPIModalOpen(true);
  };

  const handlePISuccess = (piId, piNumber) => {
    setIsPIModalOpen(false);
    setTargetQuotation(null);
    if (piId && targetQuotation) {
      setCreatedPiMap(prev => ({
        ...prev,
        [targetQuotation.id]: { piId, piNumber: piNumber || '' }
      }));
    }
    refetch();
  };
  const handleDelete = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to delete this quotation?' })) {
      try {
        await deleteQuotation({ id, companyId }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Quotation deleted successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to delete quotation' }));
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuotations(quotes.map(q => q.id));
    } else {
      setSelectedQuotations([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedQuotations(prev => [...prev, id]);
    } else {
      setSelectedQuotations(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDownload = async () => {
    setIsDownloadingBulk(true);
    let successCount = 0;
    for (const id of selectedQuotations) {
      try {
        const response = await downloadPdf({ id, companyId }).unwrap();
        const blob = response instanceof Blob ? response : new Blob([response?.data || response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Sales_Quotation_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        successCount++;
      } catch (err) {
        console.error(`Failed to download PDF for quotation ${id}`, err);
      }
    }
    setIsDownloadingBulk(false);
    if (successCount > 0) {
      dispatch(addAlert({ type: 'success', message: `Successfully downloaded ${successCount} PDF(s)` }));
    }
    if (successCount < selectedQuotations.length) {
      dispatch(addAlert({ type: 'error', message: `Failed to download ${selectedQuotations.length - successCount} PDF(s)` }));
    }
  };

  const handleBulkEmail = async () => {
    if (await confirmDialog({ message: `Are you sure you want to email ${selectedQuotations.length} quotation(s)?` })) {
      setIsEmailingBulk(true);
      let successCount = 0;
      for (const id of selectedQuotations) {
        try {
          await sendEmail({ id, companyId }).unwrap();
          successCount++;
        } catch (err) {
          console.error(`Failed to email quotation ${id}`, err);
        }
      }
      setIsEmailingBulk(false);
      if (successCount > 0) {
        dispatch(addAlert({ type: 'success', message: `Successfully emailed ${successCount} quotation(s)` }));
      }
      if (successCount < selectedQuotations.length) {
        dispatch(addAlert({ type: 'error', message: `Failed to email ${selectedQuotations.length - successCount} quotation(s)` }));
      }
    }
  };

  // Custom badge renderer to match Sales Invoices style strictly
  const renderStatusBadge = (status) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s === 'ACCEPTED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{s}</span>;
    if (s === 'SENT') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">{s}</span>;
    if (s === 'EXPIRED' || s === 'REJECTED' || s === 'CANCELLED') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-red-50 text-red-700 border-red-200">{s}</span>;
    if (s === 'DRAFT') return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200">{s}</span>;
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">{s}</span>;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount || 0);
  };

  const columns = useMemo(() => [
    {
      key: 'quotationNumber',
      label: 'QUOTE NO.',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-zinc-400" />
          <span className="font-mono text-xs font-semibold text-primary">{row.quotationNumber || '—'}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'CUSTOMER',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-zinc-900">{row.customer?.customerName || row.customerName || '—'}</div>
          {(row.customer?.customerCode || row.customerCode) && (
            <div className="text-[8.8px] text-zinc-500 mt-0.5">{row.customer?.customerCode || row.customerCode}</div>
          )}
        </div>
      )
    },
    {
      key: 'quotationDate',
      label: 'DATE',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    },
    {
      key: 'validUntil',
      label: 'VALID UNTIL',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    },
    {
      key: 'totalAmount',
      label: 'TOTAL AMOUNT',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-800">{formatCurrency(row.totalAmount, row.quotationCurrency)}</span>
      )
    },
    {
      key: 'outstanding',
      label: 'OUTSTANDING',
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-amber-600">{formatCurrency(row.outstandingAmount, row.quotationCurrency)}</span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      render: (val) => renderStatusBadge(val)
    }
  ], []);

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      hideAllOption: true,
      options: ((finalFilterBarProps.filters || []).find(f => f.key === 'status')?.options || [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Sent', value: 'SENT' },
        { label: 'Accepted', value: 'ACCEPTED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Expired', value: 'EXPIRED' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ])
    },
    {
      key: 'quotationDateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'quotationDateTo',
      label: 'Date To',
      type: 'date'
    }
  ], [finalFilterBarProps.filters]);

  const advancedFilters = useMemo(() => [
    {
      title: 'Date Filters',
      fields: [
        {
          key: 'validUntilFrom',
          label: 'Valid Until From',
          type: 'date'
        },
        {
          key: 'validUntilTo',
          label: 'Valid Until To',
          type: 'date'
        }
      ]
    },
    {
      title: 'Customer Filters',
      fields: [
        {
          key: 'customerName',
          label: 'Customer',
          type: 'select',
          options: [
            { label: 'All Customers', value: '' },
            ...((finalFilterBarProps.filters || []).find(f => f.key === 'customerName')?.options || [])
          ]
        }
      ]
    }
  ], [finalFilterBarProps.filters]);

  const filterValues = useMemo(() => {
    const obj = {};
    (filterBarProps.filters || []).forEach(f => {
      if (f.value !== undefined && f.value !== null) {
        obj[f.key] = f.value;
      }
    });
    return obj;
  }, [filterBarProps.filters]);

  const getRowActions = (q) => [
    {
      key: 'view',
      label: 'View Quotation',
      tooltip: 'View Quotation',
      'aria-label': 'View Quotation',
      icon: <Eye size={14} />,
      onClick: () => navigate(q.id),
      className: 'text-zinc-600 hover:text-indigo-600'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    ...(canEdit() ? [
      {
        key: 'edit',
        label: 'Edit Quotation',
        tooltip: 'Edit Quotation',
        'aria-label': 'Edit Quotation',
        icon: <Edit size={14} />,
        onClick: () => { setEditQuoteId(q.id); setIsFormOpen(true); },
        className: 'text-zinc-600 hover:text-blue-600'
      }
    ] : []),
    ...(canDelete() ? [
      {
        key: 'delete',
        label: 'Delete Quotation',
        tooltip: 'Delete Quotation',
        'aria-label': 'Delete Quotation',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDelete(q.id),
        className: 'text-red-600 hover:text-red-700'
      }
    ] : []),
    ...(q.status === 'DRAFT' && canEdit() ? [
      {
        key: 'send',
        label: 'Send Quotation',
        tooltip: 'Send Quotation to Customer',
        'aria-label': 'Send Quotation to Customer',
        icon: <Send size={14} />,
        onClick: () => handleSend(q.id),
        className: 'text-zinc-900 hover:text-zinc-700'
      }
    ] : []),
    {
      key: 'email',
      label: 'Send Email',
      tooltip: q.customer?.email || q.customerEmail ? 'Send Quotation via Email' : 'No customer email available',
      'aria-label': 'Send Quotation via Email',
      icon: <Mail size={14} />,
      disabled: !q.customer?.email && !q.customerEmail,
      onClick: () => {
        if (!q.customer?.email && !q.customerEmail) return;
        setQuotationToSendEmail(q);
        setIsSendEmailModalOpen(true);
      },
      className: 'text-zinc-900 hover:text-zinc-700'
    },
    ...(q.status === 'SENT' && canApprove() ? [
      {
        key: 'accept',
        label: 'Accept Quotation',
        tooltip: 'Mark Quotation as Accepted',
        'aria-label': 'Mark Quotation as Accepted',
        icon: <Check size={14} />,
        onClick: () => handleAccept(q.id),
        className: 'text-emerald-600 hover:text-emerald-700'
      },
      {
        key: 'reject',
        label: 'Reject Quotation',
        tooltip: 'Mark Quotation as Rejected',
        'aria-label': 'Mark Quotation as Rejected',
        icon: <XCircle size={14} />,
        danger: true,
        onClick: () => handleReject(q.id),
        className: 'text-red-600 hover:text-red-700'
      }
    ] : []),
    ...(q.status === 'ACCEPTED' ? [
      {
        key: 'convert-pi',
        label: 'Create PI',
        tooltip: 'Convert to Proforma Invoice',
        'aria-label': 'Convert to Proforma Invoice',
        icon: <FilePlus size={14} />,
        onClick: () => handleCreatePI(q),
        className: 'text-emerald-600 hover:text-emerald-700'
      },
      ...(!quotationToSoMap[q.id] ? [
        {
          key: 'convert-so',
          label: 'Create Sales Order',
          tooltip: 'Convert to Sales Order',
          'aria-label': 'Convert to Sales Order',
          icon: <ArrowRightCircle size={14} />,
          onClick: () => handleCreateSO(q),
          className: 'text-zinc-900 hover:text-zinc-700'
        }
      ] : []),
      ...(quotationToPiMap[q.id] ? [
        {
          key: 'view-pi',
          label: `View PI: ${quotationToPiMap[q.id].piNumber || ''}`,
          tooltip: `View Linked Proforma Invoice (${quotationToPiMap[q.id].piNumber || ''})`,
          'aria-label': `View Linked Proforma Invoice ${quotationToPiMap[q.id].piNumber || ''}`,
          icon: <Clock size={14} />,
          onClick: () => navigate(`/accounts/transactions/proforma-invoices/${quotationToPiMap[q.id].piId}`),
          className: 'text-violet-600 hover:text-violet-700'
        }
      ] : []),
      ...(quotationToSoMap[q.id] ? [
        {
          key: 'view-so',
          label: `View SO: ${quotationToSoMap[q.id].soNumber || ''}`,
          tooltip: `View Linked Sales Order (${quotationToSoMap[q.id].soNumber || ''})`,
          'aria-label': `View Linked Sales Order ${quotationToSoMap[q.id].soNumber || ''}`,
          icon: <ShoppingCart size={14} />,
          onClick: () => navigate(`/accounts/transactions/sales-orders/${quotationToSoMap[q.id].soId}`),
          className: 'text-zinc-900 hover:text-zinc-700'
        }
      ] : [])
    ] : []),
    ...(['DRAFT', 'SENT'].includes(q.status) && canEdit() ? [
      {
        key: 'cancel',
        label: 'Cancel Quotation',
        tooltip: 'Cancel Quotation',
        'aria-label': 'Cancel Quotation',
        icon: <Ban size={14} />,
        danger: true,
        onClick: () => handleCancel(q.id),
        className: 'text-red-600 hover:text-red-700'
      }
    ] : [])
  ];

  const DEFAULT_COLUMNS = ['quotationNumber', 'customerName', 'quotationDate', 'validUntil', 'totalAmount', 'outstanding', 'status', 'actions'];
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('quotations_visible_columns');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 animate-in fade-in">
      {/* Top Header */}
      <PageHeader
        title="Quotations"
        description="Manage sales quotations"
        icon={FileText}
      >
        {canCreate() && (
          <button
            onClick={() => { setEditQuoteId(null); setIsFormOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>New Quotation</span>
          </button>
        )}
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={salesTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          rowKey="id"
          selectedRows={selectedQuotations}
          onSelectionChange={setSelectedQuotations}
          bulkActions={[
            {
              key: 'email',
              label: isEmailingBulk ? 'Emailing...' : 'Email',
              icon: isEmailingBulk ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />,
              disabled: isEmailingBulk || isDownloadingBulk,
              onClick: handleBulkEmail
            },
            {
              key: 'download',
              label: isDownloadingBulk ? 'Downloading...' : 'Download PDF',
              icon: isDownloadingBulk ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />,
              disabled: isEmailingBulk || isDownloadingBulk,
              onClick: handleBulkDownload
            }
          ]}
          columns={columns}
          data={quotes}
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filterBarProps.searchTerm || ''}
          searchPlaceholder="Search Quotations..."
          onSearchChange={(val) => filterBarProps.onSearchChange(val)}

          // Filters
          filters={basicFilters}
          filterValues={filterValues}
          onFilterChange={(key, val) => filterBarProps.onFilterChange(key, val)}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset, Refresh, Export
          onReset={() => {
            filterBarProps.onClearAll();
            setSelectedQuotations([]);
          }}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('quotations_visible_columns', JSON.stringify(cols));
          }}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={getRowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={toggleRow}
          renderExpandedRow={(q) => <QuotationOverview quote={q} />}

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
          itemName="quotations"

          // Empty State
          emptyMessage="No quotations found"
          emptyDescription="Try adjusting your filters or create a new quotation."
        />
      </div>

      {isFormOpen && (
        <QuotationFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditQuoteId(null); }}
          quotationId={editQuoteId}
          onSuccess={(savedId) => {
            if (savedId) {
              setEditQuoteId(savedId);
            }
            refetch();
            dispatch(addAlert({ type: 'success', message: `Quotation saved successfully` }));
          }}
        />
      )}

      {isPIModalOpen && targetQuotation && (
        <PIConversionFormModal
          isOpen={isPIModalOpen}
          onClose={() => { setIsPIModalOpen(false); setTargetQuotation(null); }}
          companyId={companyId}
          sourceQuotation={targetQuotation}
          onSuccess={(piId, piNumber) => handlePISuccess(piId, piNumber)}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="sales-quotation"
          defaultFilters={Object.fromEntries((filterBarProps.filters || []).filter(f => f.value).map(f => [f.key, f.value]))}
          selectedIds={selectedQuotations}
          selectedCount={selectedQuotations.length}
        />
      )}

      {isSendEmailModalOpen && quotationToSendEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in" style={{zIndex: 9999}}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2"><Mail size={18} className="text-zinc-500"/> Send Quotation Email</h3>
              <button onClick={() => { setIsSendEmailModalOpen(false); setQuotationToSendEmail(null); }} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-600 mb-4">Are you sure you want to send this quotation again?</p>
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[8.8px] font-semibold text-zinc-500 uppercase">Quotation</span>
                  <span className="text-sm font-medium text-zinc-900">{quotationToSendEmail.quotationNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[8.8px] font-semibold text-zinc-500 uppercase">Customer</span>
                  <span className="text-sm font-medium text-zinc-900">{quotationToSendEmail.customer?.customerName || quotationToSendEmail.customerName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[8.8px] font-semibold text-zinc-500 uppercase">Email</span>
                  <span className="text-sm font-medium text-zinc-900">{quotationToSendEmail.customer?.email || quotationToSendEmail.customerEmail || '—'}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 text-center">The quotation PDF will be attached to the email.</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => { setIsSendEmailModalOpen(false); setQuotationToSendEmail(null); }}
                className="btn-secondary px-4 h-9"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="btn-primary px-4 h-9 min-w-[80px]"
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
