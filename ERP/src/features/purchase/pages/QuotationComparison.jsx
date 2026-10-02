import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trophy, ShoppingCart, Eye, ArrowLeftRight, Scale, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { supplierQuotationsApi, rfqsApi, vendorsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import PurchaseNavigation from '../../../components/common/PurchaseNavigation';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { formatCurrency } from '../../../utils/formatters';

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v) => (v === null || v === undefined || v === '' ? '-' : formatCurrency(toNum(v)));

const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  const cfg = {
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    SHORTLISTED: { cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    ACCEPTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    AWARDED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s.replace('_', ' ')}
    </span>
  );
};

export default function QuotationComparison() {
  const { rfqId } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const { canApprove, canCreate } = useRBAC();

  const [awardingId, setAwardingId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);

  const rfqQuery = useApiQuery(rfqsApi.getById, rfqId, { enabled: !!rfqId });
  const rfqRaw = rfqQuery.data?.data?.data || rfqQuery.data?.data || rfqQuery.data;
  const rfq = (rfqRaw && typeof rfqRaw === 'object' && 'rfqNumber' in rfqRaw) ? rfqRaw : (rfqRaw?.data || rfqRaw);

  const { data: quotationsResp, isLoading, error, refetch } = useApiQuery(
    supplierQuotationsApi.getByRfq,
    rfqId,
    { enabled: !!rfqId }
  );

  const quotations = useMemo(() => {
    const list = Array.isArray(quotationsResp) ? quotationsResp : (quotationsResp?.data?.content || quotationsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [quotationsResp]);

  const { data: vendorsResp } = useApiQuery(vendorsApi.getActiveVendors, undefined, { enabled: quotations.length > 0 });
  const vendorMap = useMemo(() => {
    const map = {};
    const list = Array.isArray(vendorsResp) ? vendorsResp : (vendorsResp?.data || vendorsResp?.content || []);
    (Array.isArray(list) ? list : []).forEach(v => { map[v.id] = v; });
    return map;
  }, [vendorsResp]);

  const vendorName = (q) => {
    const v = vendorMap[q.vendorId];
    return v?.vendorName || v?.name || q.vendorName || 'Supplier';
  };

  const isTerminal = (status) => ['AWARDED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(String(status || '').toUpperCase());

  const awardMutation = useApiMutation(supplierQuotationsApi.award);
  const convertMutation = useApiMutation(supplierQuotationsApi.convertToPurchaseOrder);

  const handleAward = async (q) => {
    const ok = await confirmDialog({
      title: 'Award Supplier Quotation',
      message: 'You are awarding this supplier quotation. The awarded supplier will be used to create the purchase order.',
      confirmLabel: 'Award Quotation',
      cancelLabel: 'Cancel',
      isDestructive: false,
      info: {
        Supplier: vendorName(q),
        'Quotation Number': q.quotationNumber,
        'Grand Total': q.grandTotal != null ? formatCurrency(q.grandTotal) : '-',
      },
      details: 'Only submissions that are still eligible can be awarded. This action cannot be reversed.',
    });
    if (!ok || awardingId) return;
    setAwardingId(q.id);
    try {
      await awardMutation.mutateAsync([q.id, companyId]);
      dispatch(addAlert({ type: 'success', message: 'Supplier quotation awarded successfully.' }));
      await Promise.all([refetch(), rfqQuery.refetch()]);
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You do not have permission to award this supplier quotation.'
        : (err?.response?.data?.message || err?.message || 'Failed to award supplier quotation');
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setAwardingId(null);
    }
  };

  const handleCreatePurchaseOrder = async (q) => {
    if (convertingId) return;
    setConvertingId(q.id);
    try {
      const result = await convertMutation.mutateAsync([q.id, companyId]);
      const poNumber = result?.poNumber || result?.data?.poNumber;
      const msg = poNumber ? `Purchase Order ${poNumber} created successfully.` : 'Purchase Order created successfully.';
      dispatch(addAlert({ type: 'success', message: msg }));
      await refetch();
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You do not have permission to create a purchase order.'
        : (err?.response?.data?.message || err?.message || 'Failed to create purchase order from the awarded quotation');
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setConvertingId(null);
    }
  };

  const rfqItems = rfq?.items || [];
  const hasItemPricing = quotations.some(q => Array.isArray(q.items) && q.items.length > 0);

  if (rfqQuery.isLoading || (isLoading && quotationsResp === null)) return <PageLoader message="Loading quotation comparison..." />;

  const rfqError = rfqQuery.error || (rfqId && !rfqQuery.data && !rfqQuery.isLoading);
  if (rfqError || !rfq) {
    return (
      <div className="flex flex-col h-full bg-zinc-50/50">
        <PurchaseNavigation />
        <ErrorState
          title="RFQ Not Found"
          message={rfqQuery.error?.message || 'The requested RFQ could not be found.'}
          onRetry={rfqQuery.refetch}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PurchaseNavigation />
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath(`/accounts/transactions/supplier-quotations`))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Quotation Comparison</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Compare supplier quotations for RFQ <span className="font-mono font-semibold text-zinc-600">{rfq.rfqNumber}</span> and decide the award
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeftRight size={16} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">RFQ Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">RFQ Number</p>
                <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{rfq.rfqNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">RFQ Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.issueDate ? new Date(rfq.issueDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Deadline</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.quotationDeadline ? new Date(rfq.quotationDeadline).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Expected Delivery</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.expectedDeliveryDate ? new Date(rfq.expectedDeliveryDate).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {error || (quotations.length === 0) ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
              <Scale className="mx-auto mb-3 text-zinc-300" size={32} />
              <p className="text-sm font-medium text-zinc-700">No supplier quotations are available for this RFQ.</p>
              <p className="text-xs text-zinc-400 mt-1">
                {error ? 'Could not load quotations. Try refreshing.' : 'Supplier quotations submitted for this RFQ will appear here for comparison.'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Item Price Comparison</h3>
                  <span className="text-[10px] text-zinc-500">{quotations.length} quotation(s)</span>
                </div>
                {!hasItemPricing ? (
                  <div className="px-6 pb-6">
                    <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center">
                      <FileText className="mx-auto mb-2 text-zinc-300" size={24} />
                      <p className="text-[10.4px] font-medium text-zinc-500">
                        Item-level pricing is not present in the quotation response. Totals from each quotation are compared below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto px-6 pb-6">
                    <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200">
                        <tr>
                          <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 sticky left-0 bg-zinc-50/95 z-10">Item</th>
                          {quotations.map((q, idx) => (
                            <th key={q.id} className={`px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right ${idx === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {vendorName(q)}<br />
                              <span className="text-zinc-400 font-medium normal-case">{q.quotationNumber}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {rfqItems.map((rfqItem, idx) => (
                          <tr key={rfqItem.itemId || idx} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="px-4 py-3 font-semibold text-zinc-900 text-xs sticky left-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]">
                              {rfqItem.itemName || `Item ${idx + 1}`}
                              {rfqItem.description && <span className="block text-[10px] text-zinc-400 font-normal truncate max-w-[180px]">{rfqItem.description}</span>}
                            </td>
                            {quotations.map((q, qi) => {
                              const qiItems = Array.isArray(q.items) ? q.items : [];
                              const quoteItem = qiItems.find(it => it.itemId === rfqItem.itemId) || qiItems[idx];
                              return (
                                <td key={q.id} className={`px-4 py-3 text-right text-xs text-zinc-800 ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                                  {quoteItem ? fmt(quoteItem.unitPrice) : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="bg-zinc-50/60">
                          <td className="px-4 py-3 text-[10.4px] font-bold text-zinc-700 sticky left-0 bg-zinc-50/95 z-10">Taxable Amount</td>
                          {quotations.map((q, qi) => (
                            <td key={q.id} className={`px-4 py-3 text-right text-xs font-bold text-zinc-900 ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {fmt(q.taxableAmount)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-[10.4px] font-bold text-zinc-700 sticky left-0 bg-white z-10">Tax</td>
                          {quotations.map((q, qi) => (
                            <td key={q.id} className={`px-4 py-3 text-right text-xs font-medium text-zinc-800 ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {fmt(q.taxAmount)}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-zinc-50/60">
                          <td className="px-4 py-3 text-[10.4px] font-bold text-zinc-700 sticky left-0 bg-zinc-50/95 z-10">Freight</td>
                          {quotations.map((q, qi) => (
                            <td key={q.id} className={`px-4 py-3 text-right text-xs font-medium text-zinc-800 ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {fmt(q.freight)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-[10.4px] font-bold text-zinc-700 sticky left-0 bg-white z-10">Discount</td>
                          {quotations.map((q, qi) => (
                            <td key={q.id} className={`px-4 py-3 text-right text-xs font-medium text-rose-600 ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {q.discount ? `-${fmt(q.discount)}` : '-'}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-zinc-50/60">
                          <td className="px-4 py-3 text-sm font-bold text-zinc-900 sticky left-0 bg-zinc-50/95 z-10">Grand Total</td>
                          {quotations.map((q, qi) => (
                            <td key={q.id} className={`px-4 py-3 text-right text-sm font-bold text-primary ${qi === 0 ? 'border-l border-zinc-200' : 'border-l border-zinc-100'}`}>
                              {fmt(q.grandTotal)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Supplier Quotations</h3>
                </div>
                <div className="overflow-x-auto px-6 pb-6">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Supplier</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Number</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Date</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Valid Until</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Delivery Terms</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Payment Terms</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Freight</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Discount</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Taxable Amount</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Grand Total</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-center">Status</th>
                        <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {quotations.map((q) => {
                        const terminal = isTerminal(q.status);
                        return (
                          <tr key={q.id} className={`hover:bg-zinc-50/80 transition-colors ${String(q.status || '').toUpperCase() === 'AWARDED' ? 'bg-emerald-50/40' : ''}`}>
                            <td className="px-4 py-3 font-semibold text-zinc-900 text-xs">{vendorName(q)}</td>
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{q.quotationNumber || '-'}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{q.quotationDate ? new Date(q.quotationDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs max-w-[140px] truncate">{q.deliveryTerms || '-'}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs max-w-[140px] truncate">{q.paymentTerms || '-'}</td>
                            <td className="px-4 py-3 text-right text-zinc-600 text-xs">{fmt(q.freight)}</td>
                            <td className="px-4 py-3 text-right text-zinc-600 text-xs">{q.discount ? fmt(q.discount) : '-'}</td>
                            <td className="px-4 py-3 text-right text-zinc-600 text-xs">{fmt(q.taxableAmount)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-800 text-xs">{fmt(q.grandTotal)}</td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <button
                                  onClick={() => navigate(buildPath(`/accounts/transactions/supplier-quotations/${q.id}`))}
                                  title="View quotation"
                                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                                >
                                  <Eye size={14} />
                                </button>
                                {!terminal && canApprove() && (
                                  <button
                                    onClick={() => handleAward(q)}
                                    disabled={awardingId === q.id}
                                    title="Award supplier quotation"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                  >
                                    {awardingId === q.id ? (
                                      <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-emerald-600 rounded-full animate-spin inline-block align-middle" />
                                    ) : (
                                      <Trophy size={14} />
                                    )}
                                  </button>
                                )}
                                {String(q.status || '').toUpperCase() === 'AWARDED' && canCreate() && (
                                  <button
                                    onClick={() => handleCreatePurchaseOrder(q)}
                                    disabled={convertingId === q.id}
                                    title="Create purchase order"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                                  >
                                    {convertingId === q.id ? (
                                      <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin inline-block align-middle" />
                                    ) : (
                                      <ShoppingCart size={14} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}