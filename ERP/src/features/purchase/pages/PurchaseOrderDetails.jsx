import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, Share2, FileText, ShoppingCart, 
  CheckCircle, AlertCircle, RefreshCw, XCircle, Send, CheckSquare, ChevronDown, Truck
} from 'lucide-react';
import { useGetPurchaseOrderByIdQuery } from '../../../api/purchase';
import { useSubmitPurchaseOrderMutation, useApprovePurchaseOrderMutation, useRejectPurchaseOrderMutation, useSendPurchaseOrderMutation, useCancelPurchaseOrderMutation, useClosePurchaseOrderMutation } from '../../../api/purchase';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from '../../../hooks/useRoutePath';
import CreateGrnModal from '../components/CreateGrnModal';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const StatusBadge = ({ status, labelPrefix = '' }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    RECEIVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    CLOSED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    PARTIALLY_RECEIVED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CANCELLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {labelPrefix}{s.replace('_', ' ')}
    </span>
  );
};

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();

  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);

  const { data: response, isLoading, error, refetch } = useGetPurchaseOrderByIdQuery({ id, companyId }, { skip: !id });

  const po = response?.data || response;

  const [submitMutation] = useSubmitPurchaseOrderMutation();
  const [approveMutation] = useApprovePurchaseOrderMutation();
  const [rejectMutation] = useRejectPurchaseOrderMutation();
  const [sendMutation] = useSendPurchaseOrderMutation();
  const [cancelMutation] = useCancelPurchaseOrderMutation();
  const [closeMutation] = useClosePurchaseOrderMutation();

  const handleAction = async (actionName, mutationFn, confirmMsg, extraArgs = {}) => {
    if (!await confirmDialog({
      title: `${actionName} Purchase Order?`,
      message: confirmMsg,
      confirmText: actionName
    })) return;
    try {
      await mutationFn({ id, companyId, ...extraArgs }).unwrap();
      dispatch(addAlert({ type: 'success', message: `Purchase Order ${actionName.toLowerCase()}d successfully.` }));
      setShowMoreActions(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()} Purchase Order` }));
    }
  };

  if (isLoading) return <PageLoader message="Loading Purchase Order details..." />;

  if (error || !po) {
    return (
      <ErrorState 
        title="Purchase Order Not Found" 
        message={error?.message || "The requested purchase order could not be found."} 
        onRetry={refetch} 
      />
    );
  }

  const curr = po.currency || 'INR';
  const vendorInfo = po.vendorInformation || { vendorName: po.vendorName, vendorCode: po.vendorCode };
  const items = po.items || [];
  
  const subtotal = items.reduce((acc, i) => acc + (i.orderedQuantity * i.unitPrice * (1 - (i.discountPercent || 0)/100)), 0);
  const totalAmount = po.totalAmount || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { id: 'items', label: 'Order Items', icon: <ShoppingCart size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(buildPath('/accounts/transactions/purchase-orders'))} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors" title="Back to Purchase Orders">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">PO {po.poNumber}</h1>
              <StatusBadge status={po.status} />
            </div>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
              <span className="font-medium">{vendorInfo.vendorName}</span>
              <span>•</span>
              <span>Date: {po.poDate ? new Date(po.poDate).toLocaleDateString() : 'N/A'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-secondary h-9 px-3 text-xs" title="Refresh">
            <RefreshCw size={14} />
          </button>
          
          {(po.status === 'DRAFT' || po.status === 'REJECTED') && (
             <button onClick={() => navigate(buildPath(`/accounts/transactions/purchase-orders/${po.id}`))} className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5">
               <Edit size={14} /> Edit
             </button>
          )}

          {/* Workflow Actions Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5"
            >
              Actions <ChevronDown size={14} />
            </button>
            
            {showMoreActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreActions(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {po.status === 'DRAFT' && (
                    <button onClick={() => handleAction('Submit', submitMutation, 'Submit this PO for approval?')} className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 flex items-center gap-2">
                      <CheckCircle size={14} /> Submit for Approval
                    </button>
                  )}
                  {po.status === 'PENDING_APPROVAL' && (
                    <>
                      <button onClick={() => handleAction('Approve', approveMutation, 'Approve this PO?')} className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                        <CheckSquare size={14} /> Approve
                      </button>
                      <button onClick={() => handleAction('Reject', rejectMutation, 'Reject this PO?', { reason: 'Rejected by user' })} className="w-full text-left px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status) && (
                    <button onClick={() => { setShowMoreActions(false); setIsGrnModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                      <Truck size={14} /> Create GRN
                    </button>
                  )}
                  {po.status === 'APPROVED' && (
                    <button onClick={() => handleAction('Send', sendMutation, 'Send this PO to vendor?')} className="w-full text-left px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2">
                      <Send size={14} /> Send to Vendor
                    </button>
                  )}
                  {(po.status === 'APPROVED' || po.status === 'SENT') && (
                    <button onClick={() => handleAction('Cancel', cancelMutation, 'Cancel this PO?', { reason: 'Cancelled by user' })} className="w-full text-left px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2">
                      <AlertCircle size={14} /> Cancel PO
                    </button>
                  )}
                  {po.status === 'RECEIVED' && (
                    <button onClick={() => handleAction('Close', closeMutation, 'Close this PO?')} className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                      <CheckCircle size={14} /> Close PO
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-zinc-200 bg-white">
        <div className="flex space-x-6 overflow-x-auto custom-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3.5 px-1 flex items-center gap-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <span className={activeTab === t.id ? 'text-primary' : 'text-zinc-400'}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Source Document Section */}
            {(po.supplierQuotationId || po.supplierQuotationNumber || po.rfqId || po.rfqNumber || po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <FileText size={13} /> Source Document
                </span>
                <div className="flex flex-wrap items-center divide-x divide-blue-200">
                  {(po.supplierQuotationId || po.supplierQuotationNumber) && (
                    <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                      <span className="text-zinc-500 font-medium">Supplier Quotation:</span>
                      {po.supplierQuotationId ? (
                        <span 
                          className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                          onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations/' + po.supplierQuotationId))}
                          title={po.supplierQuotationNumber || 'View Supplier Quotation'}
                        >
                          {po.supplierQuotationNumber || po.quotationNumber || '—'}
                        </span>
                      ) : (
                        <span className="text-zinc-700 font-mono font-semibold">
                          {po.supplierQuotationNumber || po.quotationNumber || '—'}
                        </span>
                      )}
                    </div>
                  )}
                  {(po.rfqId || po.rfqNumber) && (
                    <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                      <span className="text-zinc-500 font-medium">RFQ:</span>
                      {po.rfqId ? (
                        <span 
                          className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                          onClick={() => navigate(buildPath('/accounts/transactions/rfqs/' + po.rfqId))}
                          title={po.rfqNumber || 'View RFQ'}
                        >
                          {po.rfqNumber || '—'}
                        </span>
                      ) : (
                        <span className="text-zinc-700 font-mono font-semibold">
                          {po.rfqNumber || '—'}
                        </span>
                      )}
                    </div>
                  )}
                  {(po.purchaseRequisitionId || po.purchaseRequisitionNumber) && (
                    <div className="flex items-center gap-1.5 text-xs px-4 first:pl-0 last:pr-0">
                      <span className="text-zinc-500 font-medium">Purchase Requisition:</span>
                      {po.purchaseRequisitionId ? (
                        <span 
                          className="text-primary font-mono font-semibold cursor-pointer hover:underline" 
                          onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions/' + po.purchaseRequisitionId))}
                          title={po.purchaseRequisitionNumber || 'View Purchase Requisition'}
                        >
                          {po.purchaseRequisitionNumber || po.requisitionNumber || '—'}
                        </span>
                      ) : (
                        <span className="text-zinc-700 font-mono font-semibold">
                          {po.purchaseRequisitionNumber || po.requisitionNumber || '—'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card bg-white p-5 border border-zinc-200 rounded-xl">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Purchase Order Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">PO Number</label>
                    <p className="text-sm font-medium text-zinc-900">{po.poNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">PO Date</label>
                    <p className="text-sm font-medium text-zinc-900">{po.poDate ? new Date(po.poDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Expected Delivery</label>
                    <p className="text-sm font-medium text-zinc-900">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Reference Number</label>
                    <p className="text-sm font-medium text-zinc-900">{po.referenceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Currency</label>
                    <p className="text-sm font-medium text-zinc-900">{po.currency}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white p-5 border border-zinc-200 rounded-xl">
                 <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Terms & Notes</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Payment Terms</label>
                      <p className="text-sm text-zinc-800">{po.paymentTerms || 'None'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Delivery Terms</label>
                      <p className="text-sm text-zinc-800">{po.deliveryTerms || 'None'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Terms & Conditions</label>
                      <p className="text-sm text-zinc-800 bg-zinc-50 p-3 rounded-md">{po.termsAndConditions || 'None'}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card bg-zinc-900 p-5 rounded-xl text-white shadow-md">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Subtotal</span>
                    <span className="text-sm font-medium">{curr} {fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Tax Total</span>
                    <span className="text-sm font-medium">{curr} {fmt(po.totalTaxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-2">
                    <span className="text-sm font-semibold text-zinc-300">Grand Total</span>
                    <span className="text-lg font-bold text-emerald-400">{curr} {fmt(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'items' && (
          <div className="card bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item / Product</th>
                    <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                    <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Tax (%)</th>
                    <th className="px-4 py-3 font-semibold text-right">Total ({curr})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => {
                    const itemTotal = item.orderedQuantity * item.unitPrice * (1 - (item.discountPercent || 0)/100);
                    const itemTaxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.cessRate || 0);
                    const grandItemTotal = itemTotal * (1 + itemTaxRate/100);
                    
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-900">{item.itemName}</p>
                          {item.description && <p className="text-xs text-zinc-500">{item.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{fmt(item.orderedQuantity)} {item.unit}</td>
                        <td className="px-4 py-3 text-right">{fmt(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right">{itemTaxRate > 0 ? `${itemTaxRate}%` : '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-zinc-800">{fmt(grandItemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isGrnModalOpen && po && (
        <CreateGrnModal
          isOpen={isGrnModalOpen}
          onClose={() => setIsGrnModalOpen(false)}
          purchaseOrder={po}
          companyId={companyId}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
