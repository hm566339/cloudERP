import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Edit, Trophy, ShoppingCart, ArrowLeftRight, FileText, Clock, User, Phone } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { supplierQuotationsApi, vendorsApi, rfqsApi } from '../../../api/account';
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

import StatusBadge from '../../../components/common/StatusBadge';

const fmt = (v) => formatCurrency(toNum(v));

export default function SupplierQuotationDetail() {
  const { id } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const { canEdit, canApprove, canCreate } = useRBAC();

  const [isAwarding, setIsAwarding] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [awardTriggered, setAwardTriggered] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    supplierQuotationsApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const quotation = (raw && typeof raw === 'object' && 'quotationNumber' in raw)
    ? raw
    : (raw?.data || raw);

  const isTerminal = ['AWARDED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(String(quotation?.status || '').toUpperCase());
  const canEditQ = !isTerminal && canEdit();
  const canAwardQ = !isTerminal && canApprove();
  const canCreatePo = String(quotation?.status || '').toUpperCase() === 'AWARDED' && canCreate();

  const { data: vendorsResp } = useApiQuery(vendorsApi.getActiveVendors, undefined, { enabled: !!quotation?.vendorId });
  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : (vendorsResp?.data || vendorsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);
  const vendor = useMemo(() => vendorList.find(v => v.id === quotation?.vendorId) || null, [vendorList, quotation]);

  const { data: rfqResp } = useApiQuery(
    rfqsApi.getById,
    quotation?.rfqId,
    { enabled: !!quotation?.rfqId }
  );
  const rfqRaw = rfqResp?.data?.data || rfqResp?.data || rfqResp;
  const rfq = (rfqRaw && typeof rfqRaw === 'object' && 'rfqNumber' in rfqRaw) ? rfqRaw : (rfqRaw?.data || rfqRaw);

  const awardMutation = useApiMutation(supplierQuotationsApi.award);
  const convertMutation = useApiMutation(supplierQuotationsApi.convertToPurchaseOrder);

  useEffect(() => {
    if (location.state?.award && canAwardQ && !awardTriggered) {
      setAwardTriggered(true);
      handleAward();
    }
  }, [location.state, canAwardQ, awardTriggered]);

  const computedTotals = useMemo(() => {
    let taxable = 0, cgstAmount = 0, sgstAmount = 0, igstAmount = 0, cessAmount = 0;
    const lines = Array.isArray(quotation?.items) ? quotation.items.map(item => {
      const quantity = toNum(item.quantity);
      const unitPrice = toNum(item.unitPrice);
      const disc = toNum(item.discount);
      const gross = quantity * unitPrice;
      const discountAmt = (gross * disc) / 100;
      const base = gross - discountAmt;
      const cgst = (base * toNum(item.cgstRate)) / 100;
      const sgst = (base * toNum(item.sgstRate)) / 100;
      const igst = (base * toNum(item.igstRate)) / 100;
      const cess = (base * toNum(item.cessRate)) / 100;
      taxable += base;
      cgstAmount += cgst;
      sgstAmount += sgst;
      igstAmount += igst;
      cessAmount += cess;
      return { ...item, gross, discountAmt, base, cgst, sgst, igst, cess, total: base + cgst + sgst + igst + cess };
    }) : [];
    const freight = toNum(quotation?.freight);
    const discount = toNum(quotation?.discount);
    const taxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
    const grandTotal = taxable - discount + freight + taxAmount;
    return { lines, taxable, discount, freight, cgstAmount, sgstAmount, igstAmount, cessAmount, taxAmount, grandTotal };
  }, [quotation]);

  const totals = {
    taxable: toNum(quotation?.taxableAmount) > 0 ? toNum(quotation?.taxableAmount) : computedTotals.taxable,
    discount: toNum(quotation?.discount),
    freight: toNum(quotation?.freight),
    cgst: toNum(quotation?.cgstAmount) > 0 ? toNum(quotation?.cgstAmount) : computedTotals.cgstAmount,
    sgst: toNum(quotation?.sgstAmount) > 0 ? toNum(quotation?.sgstAmount) : computedTotals.sgstAmount,
    igst: toNum(quotation?.igstAmount) > 0 ? toNum(quotation?.igstAmount) : computedTotals.igstAmount,
    cess: toNum(quotation?.cessAmount) > 0 ? toNum(quotation?.cessAmount) : computedTotals.cessAmount,
    tax: toNum(quotation?.taxAmount) > 0 ? toNum(quotation?.taxAmount) : computedTotals.taxAmount,
    grand: toNum(quotation?.grandTotal) > 0 ? toNum(quotation?.grandTotal) : computedTotals.grandTotal,
  };

  const handleAward = async () => {
    const ok = await confirmDialog({
      title: 'Award Supplier Quotation',
      message: 'You are awarding this supplier quotation. The awarded supplier will be used to create the purchase order.',
      confirmLabel: 'Award Quotation',
      cancelLabel: 'Cancel',
      isDestructive: false,
      details: 'Only submissions that are still eligible can be awarded. This action cannot be reversed.',
    });
    if (!ok) return;
    if (isAwarding) return;
    setIsAwarding(true);
    try {
      await awardMutation.mutateAsync([id, companyId]);
      dispatch(addAlert({ type: 'success', message: 'Supplier quotation awarded successfully.' }));
      await refetch();
    } catch (err) {
      const msg = err?.response?.status === 403
        ? 'You do not have permission to award this supplier quotation.'
        : (err?.response?.data?.message || err?.message || 'Failed to award supplier quotation');
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsAwarding(false);
    }
  };

  const handleCreatePurchaseOrder = async () => {
    if (isConverting) return;
    setIsConverting(true);
    try {
      const result = await convertMutation.mutateAsync([id, companyId]);
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
      setIsConverting(false);
    }
  };

  const displayValue = (value) =>
    value === null || value === undefined || value === '' ? 'N/A' : value;

  if (isLoading) return <PageLoader message="Loading supplier quotation..." />;

  if (error || !quotation) {
    return (
      <div className="flex flex-col h-full bg-zinc-50/50">
        <PurchaseNavigation />
        <ErrorState
          title="Supplier Quotation Not Found"
          message={error?.message || 'The requested supplier quotation could not be found.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const items = quotation.items || [];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PurchaseNavigation />
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations'))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {quotation.quotationNumber}
              </h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              <FileText size={12} className="inline mr-1 -mt-0.5" />
              Supplier quotation against {' '}
              {rfq?.rfqNumber || quotation.rfqNumber || '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quotation.rfqId && (
            <button
              onClick={() => navigate(buildPath(`/accounts/transactions/supplier-quotations/compare/${quotation.rfqId}`))}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeftRight size={16} /> <span className="hidden sm:inline">Compare RFQ</span>
            </button>
          )}
          {canEditQ && (
            <button
              onClick={() => navigate(buildPath(`/accounts/transactions/supplier-quotations/${quotation.id}/edit`))}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          {canAwardQ && (
            <button
              onClick={handleAward}
              disabled={isAwarding}
              className="btn-primary flex items-center gap-2"
            >
              {isAwarding ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trophy size={16} />
              )}
              <span>Award Supplier Quotation</span>
            </button>
          )}
          {canCreatePo && (
            <button
              onClick={handleCreatePurchaseOrder}
              disabled={isConverting}
              className="btn-primary flex items-center gap-2"
            >
              {isConverting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={16} />
              )}
              <span>Create Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Quotation Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Number</p>
                <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{displayValue(quotation.quotationNumber)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">RFQ Number</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(rfq?.rfqNumber || quotation.rfqNumber || '—')}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{quotation.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Valid Until</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
                <div className="mt-1"><StatusBadge status={quotation.status} /></div>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            {(quotation.deliveryTerms || quotation.paymentTerms || quotation.remarks) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-zinc-100">
                {quotation.deliveryTerms && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Delivery Terms</p>
                    <p className="text-sm font-medium text-zinc-900 mt-1 whitespace-pre-wrap">{quotation.deliveryTerms}</p>
                  </div>
                )}
                {quotation.paymentTerms && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Payment Terms</p>
                    <p className="text-sm font-medium text-zinc-900 mt-1 whitespace-pre-wrap">{quotation.paymentTerms}</p>
                  </div>
                )}
                {quotation.remarks && (
                  <div className="md:col-span-2">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Remarks</p>
                    <p className="text-sm font-medium text-zinc-900 mt-1 whitespace-pre-wrap">{quotation.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Supplier</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Supplier Name</p>
                <p className="text-sm font-semibold text-zinc-900 mt-1 flex items-center gap-1.5">
                  <User size={12} className="text-zinc-400" />
                  {displayValue(vendor?.vendorName || vendor?.name || quotation.vendorName || 'Supplier')}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Vendor Code</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(vendor?.vendorCode || vendor?.code)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GSTIN</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(vendor?.gstin || vendor?.gstNumber)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Contact</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(vendor?.primaryContactName || vendor?.contactName || vendor?.email)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Phone</p>
                <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-zinc-400" />
                  {displayValue(vendor?.phone || vendor?.phoneNumber)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Items</h3>
            </div>
            {items.length === 0 ? (
              <div className="px-6 pb-6">
                <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                  <FileText className="mx-auto mb-2 text-zinc-300" size={24} />
                  <p className="text-sm font-medium text-zinc-500">No items in this quotation</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar px-6 pb-6">
                <table className="w-full min-w-[850px] sm:min-w-full text-left border-collapse whitespace-nowrap text-sm" aria-label="Quotation Items Table">
                  <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">#</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Item</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Description</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-right">Quantity</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Unit</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-right">Unit Price</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-right">Disc %</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-right">GST</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Delivery Date</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">HSN/SAC</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {computedTotals.lines.map((item, idx) => {
                      const taxRate = toNum(item.cgstRate) + toNum(item.sgstRate) + toNum(item.igstRate) + toNum(item.cessRate);
                      const gstParts = [];
                      if (toNum(item.cgstRate) > 0) gstParts.push(`CGST ${toNum(item.cgstRate)}%`);
                      if (toNum(item.sgstRate) > 0) gstParts.push(`SGST ${toNum(item.sgstRate)}%`);
                      if (toNum(item.igstRate) > 0) gstParts.push(`IGST ${toNum(item.igstRate)}%`);
                      if (toNum(item.cessRate) > 0) gstParts.push(`CESS ${toNum(item.cessRate)}%`);
                      return (
                        <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="px-4 py-4 text-zinc-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-4 font-semibold text-zinc-900 text-xs">{item.itemName || '-'}</td>
                          <td className="px-4 py-4 text-zinc-600 text-xs max-w-[180px] truncate">{item.description || '-'}</td>
                          <td className="px-4 py-4 text-right font-medium text-zinc-800 text-xs tabular-nums">{toNum(item.quantity) || '-'}</td>
                          <td className="px-4 py-4 text-zinc-600 text-xs">{item.unit || '-'}</td>
                          <td className="px-4 py-4 text-right text-zinc-600 text-xs tabular-nums">{fmt(item.unitPrice)}</td>
                          <td className="px-4 py-4 text-right text-zinc-600 text-xs tabular-nums">{toNum(item.discount) > 0 ? `${toNum(item.discount)}%` : '-'}</td>
                          <td className="px-4 py-4 text-right text-zinc-600 text-xs tabular-nums">
                            {taxRate > 0 ? (gstParts.length ? gstParts.join(', ') : `${taxRate}%`) : '-'}
                          </td>
                          <td className="px-4 py-4 text-zinc-600 text-xs">{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-4 font-mono text-xs text-zinc-600">{item.hsnSacId || item.hsnSacCode || '-'}</td>
                          <td className="px-4 py-4 text-right font-semibold text-zinc-800 text-xs tabular-nums">{fmt(item.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Totals</h3>
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-500">Taxable Amount</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.taxable)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between items-center text-[10.4px]">
                    <span className="text-zinc-500">Discount</span>
                    <span className="font-semibold text-rose-600">-{fmt(totals.discount)}</span>
                  </div>
                )}
                {totals.freight > 0 && (
                  <div className="flex justify-between items-center text-[10.4px]">
                    <span className="text-zinc-500">Freight</span>
                    <span className="font-semibold text-zinc-800">{fmt(totals.freight)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-500">CGST</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.cgst)}</span>
                </div>
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-500">SGST</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.sgst)}</span>
                </div>
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-500">IGST</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.igst)}</span>
                </div>
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-500">CESS</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.cess)}</span>
                </div>
                <div className="flex justify-between items-center text-[10.4px] border-t border-zinc-200 pt-2">
                  <span className="text-zinc-600 font-semibold">Tax</span>
                  <span className="font-semibold text-zinc-800">{fmt(totals.tax)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-200 pt-3">
                  <span className="text-sm font-bold text-zinc-900">Grand Total</span>
                  <span className="text-sm font-bold text-primary">{fmt(totals.grand)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Workflow Audit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {quotation.awardedBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Awarded By</p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">{quotation.awardedBy}</p>
                  {quotation.awardedAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(quotation.awardedAt).toLocaleString()}</p>}
                </div>
              )}
              {quotation.createdAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-1"><Clock size={12} className="text-zinc-400" />{new Date(quotation.createdAt).toLocaleString()}</p>
                </div>
              )}
              {quotation.updatedAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Updated</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{new Date(quotation.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}