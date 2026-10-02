import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit, Send, XCircle, FileSearch, CheckCircle, Clock, ChevronDown, Package } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { rfqsApi, vendorsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { confirmDialog } from '../../../utils/confirmDialog';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import PurchaseNavigation, { getRfqBasePath } from '../../../components/common/PurchaseNavigation';
import { useRoutePath } from '../../../hooks/useRoutePath';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    SENT: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    OPEN: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    CLOSED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
    CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    AWARDED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s.replace('_', ' ')}
    </span>
  );
};

const SupplierStatusBadge = ({ status }) => {
  if (!status) return <span className="text-xs text-zinc-400">-</span>;
  const s = status.toString().toUpperCase();
  const cfg = {
    INVITED: { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    RESPONDED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DECLINED: { cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      {s.replace('_', ' ')}
    </span>
  );
};

export default function RFQDetail() {
  const { id } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const { canEdit } = useRBAC();
  const rfqBasePath = getRfqBasePath(location.pathname);

  const [showMoreActions, setShowMoreActions] = useState(false);

  const { data: response, isLoading, error, refetch } = useApiQuery(
    rfqsApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const rfq = (raw && typeof raw === 'object' && 'rfqNumber' in raw)
    ? raw
    : (raw?.data || raw);

  const { data: vendorsResp } = useApiQuery(vendorsApi.getActiveVendors, undefined, { enabled: true });
  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : (vendorsResp?.data || vendorsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);
  const vendorNameMap = useMemo(() => {
    const map = {};
    vendorList.forEach(v => { map[v.id] = v.vendorName || v.name || v.id; });
    return map;
  }, [vendorList]);

  const sendMutation = useApiMutation(rfqsApi.send);
  const closeMutation = useApiMutation(rfqsApi.close);
  const cancelMutation = useApiMutation(rfqsApi.cancel);

  const handleAction = async (mutation, actionName) => {
    if (!await confirmDialog({ title: `Confirm ${actionName}`, message: `Are you sure you want to ${actionName.toLowerCase()} this RFQ?` })) return;
    try {
      await mutation.mutateAsync([id, companyId]);
      dispatch(addAlert({ type: 'success', message: `RFQ ${actionName.toLowerCase()} successfully.` }));
      setShowMoreActions(false);
      await refetch();
    } catch (err) {
      const msg = err?.response?.status === 403
        ? `You do not have permission to ${actionName.toLowerCase()} this RFQ.`
        : (err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()} RFQ`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  const displayValue = (value) =>
    value === null || value === undefined || value === '' ? 'N/A' : value;

  if (isLoading) return <PageLoader message="Loading RFQ details..." />;

  if (error || !rfq) {
    return (
      <div className="flex flex-col h-full bg-zinc-50/50">
        <PurchaseNavigation />
        <ErrorState
          title="RFQ Not Found"
          message={error?.message || 'The requested RFQ could not be found.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const items = rfq.items || [];
  const vendors = rfq.vendors || [];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PurchaseNavigation />
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath(rfqBasePath))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {rfq.rfqNumber}
              </h1>
              <StatusBadge status={rfq.status} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              <FileSearch size={12} className="inline mr-1 -mt-0.5" />
              Quotation deadline: {rfq.quotationDeadline ? new Date(rfq.quotationDeadline).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          {rfq.status === 'DRAFT' && canEdit() && (
            <button
              onClick={() => navigate(buildPath(`${rfqBasePath}/${rfq.id}/edit`))}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {(rfq.status === 'DRAFT' || rfq.status === 'SENT' || rfq.status === 'OPEN') && (
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(prev => !prev)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <span>Actions</span>
                <ChevronDown size={14} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
              </button>
              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1.5 text-xs animate-in fade-in slide-in-from-top-2">
                  {rfq.status === 'DRAFT' && (
                    <button
                      onClick={() => handleAction(sendMutation, 'Send')}
                      disabled={sendMutation.isLoading}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold"
                    >
                      <Send size={14} className="text-blue-500" />
                      Send RFQ
                    </button>
                  )}
                  {(rfq.status === 'SENT' || rfq.status === 'OPEN') && (
                    <button
                      onClick={() => handleAction(closeMutation, 'Close')}
                      disabled={closeMutation.isLoading}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold"
                    >
                      <CheckCircle size={14} className="text-emerald-500" />
                      Close
                    </button>
                  )}
                  {rfq.status !== 'CLOSED' && rfq.status !== 'CANCELLED' && rfq.status !== 'AWARDED' && (
                    <button
                      onClick={() => handleAction(cancelMutation, 'Cancel')}
                      disabled={cancelMutation.isLoading}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-zinc-100"
                    >
                      <XCircle size={14} className="text-rose-500" />
                      Cancel RFQ
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">RFQ Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">RFQ Number</p>
                <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{displayValue(rfq.rfqNumber)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Purchase Requisition</p>
                {rfq.purchaseRequisitionId ? (
                  <p 
                    className="text-sm font-medium text-primary cursor-pointer hover:underline mt-1 font-mono"
                    onClick={() => navigate(buildPath(`/accounts/transactions/purchase-requisitions/${rfq.purchaseRequisitionId}`))}
                  >
                    {rfq.purchaseRequisitionNumber || rfq.requisitionNumber || '—'}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-zinc-900 mt-1">
                    {displayValue(rfq.purchaseRequisitionNumber || rfq.requisitionNumber || '—')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Issue Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.issueDate ? new Date(rfq.issueDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quotation Deadline</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.quotationDeadline ? new Date(rfq.quotationDeadline).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Expected Delivery</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.expectedDeliveryDate ? new Date(rfq.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
                <div className="mt-1"><StatusBadge status={rfq.status} /></div>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{rfq.createdAt ? new Date(rfq.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            {(rfq.terms || rfq.notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-zinc-100">
                {rfq.terms && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Terms</p>
                    <p className="text-sm font-medium text-zinc-900 mt-1 whitespace-pre-wrap">{rfq.terms}</p>
                  </div>
                )}
                {rfq.notes && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Notes</p>
                    <p className="text-sm font-medium text-zinc-900 mt-1 whitespace-pre-wrap">{rfq.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Suppliers</h3>
            </div>
            {vendors.length === 0 ? (
              <div className="px-6 pb-6">
                <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                  <Package className="mx-auto mb-2 text-zinc-300" size={24} />
                  <p className="text-sm font-medium text-zinc-500">No suppliers invited</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Supplier</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Invited At</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Response Date</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {vendors.map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 py-4 font-semibold text-zinc-900 text-xs">{vendorNameMap[v.vendorId] || v.vendorName || '-'}</td>
                        <td className="px-4 py-4"><SupplierStatusBadge status={v.status} /></td>
                        <td className="px-4 py-4 text-zinc-600 text-xs">{v.invitedAt ? new Date(v.invitedAt).toLocaleString() : '-'}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs">{v.responseDate ? new Date(v.responseDate).toLocaleString() : '-'}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs max-w-[200px] truncate">{v.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Requested Items</h3>
            </div>
            {items.length === 0 ? (
              <div className="px-6 pb-6">
                <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                  <Package className="mx-auto mb-2 text-zinc-300" size={24} />
                  <p className="text-sm font-medium text-zinc-500">No items in this RFQ</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">#</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Item</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Description</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Quantity</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Unit</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Required Date</th>
                      <th className="px-4 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 py-4 text-zinc-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-4 font-semibold text-zinc-900 text-xs">{item.itemName || '-'}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs max-w-[200px] truncate">{item.description || '-'}</td>
                        <td className="px-4 py-4 text-right font-medium text-zinc-800 text-xs">{item.quantity ?? 0}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs">{item.unit || '-'}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs">{item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-4 text-zinc-600 text-xs max-w-[200px] truncate">{item.specifications || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Workflow Audit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {rfq.sentBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Sent By</p>
                  <p className="text-sm font-medium text-blue-700 mt-1">{rfq.sentBy}</p>
                  {rfq.sentAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(rfq.sentAt).toLocaleString()}</p>}
                </div>
              )}
              {rfq.closedBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Closed By</p>
                  <p className="text-sm font-medium text-zinc-700 mt-1">{rfq.closedBy}</p>
                  {rfq.closedAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(rfq.closedAt).toLocaleString()}</p>}
                </div>
              )}
              {rfq.cancelledBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Cancelled By</p>
                  <p className="text-sm font-medium text-rose-700 mt-1">{rfq.cancelledBy}</p>
                  {rfq.cancelledAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(rfq.cancelledAt).toLocaleString()}</p>}
                </div>
              )}
              {rfq.createdAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-1"><Clock size={12} className="text-zinc-400" />{new Date(rfq.createdAt).toLocaleString()}</p>
                </div>
              )}
              {rfq.updatedAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Updated</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{new Date(rfq.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
