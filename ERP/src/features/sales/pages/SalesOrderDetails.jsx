import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetSalesOrderV2ByIdQuery } from '../../../api/sales-crm';
import { 
  ArrowLeft, Truck, FileText, Edit, MapPin, Landmark, 
  History, Package, User, Calendar, CircleDollarSign, 
  FileCheck, Hash, HelpCircle, AlertTriangle
} from 'lucide-react';
import DeliveryChallanFromSoModal from '../components/DeliveryChallanFromSoModal';
import AuditLogHover from '../../../components/common/AuditLogHover';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function StatusBadge({ status }) {
  const s = (status || 'DRAFT').toUpperCase();
  const map = {
    DRAFT:     'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${map[s] || 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
      {s}
    </span>
  );
}

function Section({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 flex items-center gap-2">
        {icon && <span className="text-indigo-500">{icon}</span>}
        <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold text-zinc-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function parseJsonSnapshot(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
}

function AddressCard({ label, snapshot }) {
  const addr = parseJsonSnapshot(snapshot);
  if (!addr) return null;
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
      <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-sm text-zinc-800 space-y-0.5">
        {addr.attention && <p className="font-semibold">{addr.attention}</p>}
        {addr.addressLine1 && <p>{addr.addressLine1}</p>}
        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
        <p>{[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}</p>
        {addr.country && <p>{addr.country}</p>}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function SalesOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId =
    (() => { try { return JSON.parse(localStorage.getItem('selected_company'))?.id; } catch { return null; } })() ||
    (() => { try { return JSON.parse(localStorage.getItem('auth_user'))?.companyCode; } catch { return null; } })();

  const { data: apiResponse, isLoading, isError, error, refetch } = useGetSalesOrderV2ByIdQuery(
    { id, companyId },
    { skip: !id }
  );

  const [dcOpen, setDcOpen] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  const order = apiResponse?.data?.id ? apiResponse.data : (apiResponse?.id ? apiResponse : null);

  if (isError || !order) {
    const status = error?.status;
    const msg =
      status === 404 ? 'Sales Order not found.' :
      status === 403 ? "You don't have permission to view this Sales Order." :
      'Unable to load Sales Order. Please try again.';

    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-xl border border-red-100 shadow-sm text-center">
        <AlertTriangle className="mx-auto text-red-400 mb-4" size={40} />
        <h2 className="text-lg font-bold text-red-600 mb-2">{msg}</h2>
        <p className="text-zinc-500 text-sm mb-6">ID: {id}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/accounts/transactions/sales-orders')}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Sales Orders
          </button>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { source, customer, addresses, amounts, commercial, items = [], audit, bankDetailsSnapshot } = order;

  // ── Source display ────────────────────────────────────────────────────────
  const sourceType = source?.type;
  const sourcePi = source?.proformaInvoice;
  const sourceQt = source?.quotation;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/accounts/transactions/sales-orders')}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Back to Sales Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{order.soNumber || order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-zinc-500 mt-1">Sales Order • {fmtDate(order.soDate)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {order.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => setDcOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Truck size={15} /> Delivery Challan
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm">
                <FileText size={15} /> Generate Invoice
              </button>
            </>
          )}
          
          <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-200 pl-3">
            <AuditLogHover 
              audit={order.audit} 
              className="!w-9 !h-9 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50" 
            />
            <button className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all shadow-sm">
              <Edit size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <Field label="SO Number" value={order.soNumber} mono />
        <Field label="Order Date" value={fmtDate(order.soDate)} />
        <Field label="Currency" value={order.currency || 'INR'} />
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Status</p>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Source + Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Source */}
        {sourceType && (
          <Section title="Source Origin" icon={<FileCheck size={15} />}>
            <div className="space-y-3">
              <Field label="Source Type" value={sourceType === 'PROFORMA_INVOICE' ? 'Proforma Invoice' : sourceType === 'QUOTATION' ? 'Quotation' : sourceType} />
              {sourcePi && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Proforma Invoice</p>
                  <span
                    className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/accounts/transactions/proforma-invoices/${sourcePi.id}`)}
                  >
                    {sourcePi.number}
                  </span>
                </div>
              )}
              {sourceQt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Quotation</p>
                  <span
                    className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/accounts/transactions/quotations/${sourceQt.id}`)}
                  >
                    {sourceQt.number}
                  </span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Customer */}
        {customer && (
          <Section title="Customer" icon={<User size={15} />}>
            <div className="space-y-3">
              <Field label="Name" value={customer.name} />
              {customer.code && <Field label="Code" value={customer.code} mono />}
            </div>
          </Section>
        )}
      </div>

      {/* Addresses */}
      {(addresses?.billing || addresses?.delivery) && (
        <Section title="Addresses" icon={<MapPin size={15} />} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddressCard label="Billing Address" snapshot={addresses?.billing} />
            <AddressCard label="Delivery Address" snapshot={addresses?.delivery} />
          </div>
        </Section>
      )}

      {/* Items */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 flex items-center gap-2">
            <span className="text-indigo-500"><Package size={15} /></span>
            <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Order Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-zinc-50/60 border-b border-zinc-200">
                <tr>
                  {['#', 'Item', 'Description', 'Qty', 'Unit', 'Unit Price', 'Discount', 'Tax', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 text-right first:text-left second:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {items.map((item, idx) => {
                  const pricing = item.pricing || {};
                  const taxes = item.taxes || {};
                  const discount = pricing.discountAmount > 0
                    ? pricing.discountAmount
                    : pricing.discountPercent > 0
                      ? ((pricing.unitPrice || 0) * (item.quantity || 0) * pricing.discountPercent / 100)
                      : 0;
                  return (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 text-right">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 min-w-[112px]">{item.item?.name || '—'}</td>
                      <td className="px-4 py-3 text-zinc-500 max-w-[160px] whitespace-normal text-xs">{item.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(item.quantity)}</td>
                      <td className="px-4 py-3 text-right text-zinc-500">{item.unit || 'Nos'}</td>
                      <td className="px-4 py-3 text-right">{fmt(pricing.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{discount > 0 ? `-${fmt(discount)}` : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {taxes.taxAmount > 0 ? (
                          <div className="relative group inline-flex flex-col items-end">
                            <span className="cursor-help flex items-center gap-1">
                              {fmt(taxes.taxAmount)} <HelpCircle size={12} className="text-zinc-400" />
                            </span>
                            <div className="absolute bottom-full right-0 mb-2 w-44 p-2 bg-zinc-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              {taxes.cgstAmount > 0 && <div className="flex justify-between py-0.5"><span>CGST</span><span>{fmt(taxes.cgstAmount)}</span></div>}
                              {taxes.sgstAmount > 0 && <div className="flex justify-between py-0.5"><span>SGST</span><span>{fmt(taxes.sgstAmount)}</span></div>}
                              {taxes.igstAmount > 0 && <div className="flex justify-between py-0.5"><span>IGST</span><span>{fmt(taxes.igstAmount)}</span></div>}
                              {taxes.cessAmount > 0 && <div className="flex justify-between py-0.5 border-t border-zinc-600 mt-1 pt-1"><span>CESS</span><span>{fmt(taxes.cessAmount)}</span></div>}
                            </div>
                          </div>
                        ) : <span className="text-zinc-400">Exempt</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-900">{fmt(item.totalAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Amounts + Commercial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Commercial Terms */}
        {commercial && (commercial.paymentTerms || commercial.deliveryTerms || commercial.notes) && (
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Section title="Commercial Terms" icon={<FileText size={15} />}>
              <div className="space-y-4">
                {commercial.paymentTerms && <Field label="Payment Terms" value={commercial.paymentTerms} />}
                {commercial.deliveryTerms && <Field label="Delivery Terms" value={commercial.deliveryTerms} />}
                {commercial.notes && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Notes</p>
                    <p className="text-sm text-zinc-800 bg-zinc-50 p-3 rounded-lg border border-zinc-100 whitespace-pre-wrap">{commercial.notes}</p>
                  </div>
                )}
              </div>
            </Section>

            {/* Bank Details */}
            {(() => {
              const bank = parseJsonSnapshot(bankDetailsSnapshot);
              if (!bank?.accountNumber) return null;
              return (
                <Section title="Bank Details" icon={<Landmark size={15} />}>
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 grid grid-cols-2 gap-4">
                    {bank.bankName && <Field label="Bank Name" value={bank.bankName} />}
                    {bank.accountName && <Field label="Account Name" value={bank.accountName} />}
                    {bank.accountNumber && <Field label="Account Number" value={bank.accountNumber} mono />}
                    {bank.ifscCode && <Field label="IFSC Code" value={bank.ifscCode} mono />}
                  </div>
                </Section>
              );
            })()}
          </div>
        )}

        {/* Amounts */}
        {amounts && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col justify-end">
            <div className="space-y-3 text-sm">
              {[
                { label: 'Subtotal', value: amounts.subtotal },
                { label: 'Discount', value: -amounts.discount, hide: !amounts.discount, color: 'text-red-600' },
                { label: 'Tax', value: amounts.tax, hide: !amounts.tax },
                { label: 'Freight', value: amounts.freight, hide: !amounts.freight },
                { label: 'Other Charges', value: amounts.otherCharges, hide: !amounts.otherCharges },
                { label: 'Round Off', value: amounts.roundOff, hide: amounts.roundOff === 0 || amounts.roundOff === null },
              ].filter(r => !r.hide).map(r => (
                <div key={r.label} className={`flex justify-between ${r.color || 'text-zinc-600'}`}>
                  <span className="font-medium">{r.label}</span>
                  <span className="font-semibold">{r.value < 0 ? `-${fmt(Math.abs(r.value))}` : fmt(r.value)}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
                <span className="text-base font-bold text-zinc-900 uppercase tracking-wide">Grand Total</span>
                <div className="text-right">
                  <span className="text-sm text-zinc-500 mr-1">{order.currency || 'INR'}</span>
                  <span className="text-2xl font-black text-indigo-700">{fmt(amounts.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit */}
      {audit && (
        <Section title="Audit Information" icon={<History size={15} />} className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
            <Field label="Created At" value={fmtDateTime(audit.createdAt)} />
            <Field label="Created By" value={audit.createdBy} mono />
            <Field label="Updated At" value={fmtDateTime(audit.updatedAt)} />
            <Field label="Updated By" value={audit.updatedBy} mono />
          </div>
        </Section>
      )}

      {/* Delivery Challan Modal */}
      {dcOpen && (
        <DeliveryChallanFromSoModal
          isOpen={dcOpen}
          onClose={() => setDcOpen(false)}
          companyId={companyId}
          salesOrder={{
            id: order.id,
            soNumber: order.soNumber,
            customerName: customer?.name,
            soDate: order.soDate,
            status: order.status,
            fulfillmentStatus: order.fulfillmentStatus,
            items: items.map(it => ({
              ...it,
              id: it.id,
              item: it.item,
              productId: it.item?.id || it.productId || it.itemId,
              itemName: it.item?.name || it.itemName || it.productName,
              description: it.description,
              quantity: it.quantity,
              dispatchedQuantity: it.dispatchedQuantity ?? it.deliveredQuantity ?? it.fulfillment?.dispatchedQuantity ?? 0,
              deliveredQuantity: it.deliveredQuantity ?? it.dispatchedQuantity ?? it.fulfillment?.deliveredQuantity ?? 0,
              remainingQuantity: it.remainingQuantity ?? it.remainingOpenQuantity ?? it.fulfillment?.remainingQuantity,
            })),
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
