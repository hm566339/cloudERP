import React, { useState } from 'react';
import { ArrowLeft, Edit, CheckCircle, XCircle, Package, ChevronDown, FileSearch } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { purchaseRequisitionsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import usePermission from '../../../hooks/usePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import PurchaseNavigation, { getRfqBasePath } from '../../../components/common/PurchaseNavigation';
import { useRoutePath } from '../../../hooks/useRoutePath';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toString().toUpperCase();
  const cfg = {
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CANCELLED: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  }[s] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {s.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  if (!priority) return <span className="text-xs text-zinc-500">-</span>;
  const p = priority.toString().toUpperCase();
  const cfg = {
    HIGH: { cls: 'bg-red-50 text-red-700 border-red-200' },
    URGENT: { cls: 'bg-red-50 text-red-700 border-red-200' },
    MEDIUM: { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    LOW: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }[p] || { cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase rounded-md border ${cfg.cls}`}>
      {p}
    </span>
  );
};

export default function PurchaseRequisitionDetail() {
  const { id } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const rfqBasePath = getRfqBasePath(location.pathname);

  const canUpdate = usePermission('PURCHASE_REQUISITIONS', 'UPDATE');
  const canApprove = usePermission('PURCHASE_REQUISITIONS', 'APPROVE');

  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: response, isLoading, error, refetch } = useApiQuery(
    purchaseRequisitionsApi.getById,
    id,
    { enabled: !!id }
  );

  const raw = response?.data?.data || response?.data || response;
  const pr = (raw && typeof raw === 'object' && ('requisitionNumber' in raw || 'requesterId' in raw || 'status' in raw))
    ? raw
    : (raw?.data || raw);

  const submitMutation = useApiMutation(purchaseRequisitionsApi.submit);
  const approveMutation = useApiMutation(purchaseRequisitionsApi.approve);
  const rejectMutation = useApiMutation(purchaseRequisitionsApi.reject);
  const cancelMutation = useApiMutation(purchaseRequisitionsApi.cancel);

  const handleAction = async (mutation, actionName, needsConfirm = false) => {
    if (needsConfirm) {
      if (!await confirmDialog({ title: `Confirm ${actionName}`, message: `Are you sure you want to ${actionName.toLowerCase()} this requisition?` })) return;
    }
    try {
      await mutation.mutateAsync([id, companyId]);
      dispatch(addAlert({ type: 'success', message: `${actionName} completed successfully.` }));
      setShowMoreActions(false);
      await refetch();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${actionName.toLowerCase()} this requisition.`
        : (err?.response?.data?.message || err?.message || `Failed to ${actionName.toLowerCase()}`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  const handleRejectSubmit = async () => {
    try {
      await rejectMutation.mutateAsync([id, rejectReason ? { rejectionReason: rejectReason } : {}, companyId]);
      dispatch(addAlert({ type: 'success', message: 'Requisition rejected successfully.' }));
      setShowRejectModal(false);
      setRejectReason('');
      await refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to reject' }));
    }
  };

  const displayValue = (value) =>
    value === null || value === undefined || value === '' ? 'N/A' : value;

  if (isLoading) return <PageLoader message="Loading Purchase Requisition details..." />;

  if (error || !pr) {
    return (
      <div className="flex flex-col h-full bg-zinc-50/50">
        <PurchaseNavigation />
        <ErrorState
          title="Purchase Requisition Not Found"
          message={error?.message || 'The requested purchase requisition could not be found.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const items = pr.items || [];
  const hasActions = (pr.status === 'DRAFT' && canUpdate) || (pr.status === 'SUBMITTED' && canApprove);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PurchaseNavigation />
      <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions'))}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
                {pr.requisitionNumber}
              </h1>
              <StatusBadge status={pr.status} />
              <PriorityBadge priority={pr.priority} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Required by: {pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative">
          {(pr.status === 'DRAFT' || pr.status === 'REJECTED') && canUpdate && (
            <button
              onClick={() => navigate(buildPath(`/accounts/transactions/purchase-requisitions/${pr.id}/edit`))}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {pr.status === 'APPROVED' && (
            <button
              onClick={() => navigate(buildPath(`${rfqBasePath}/new?purchaseRequisitionId=${pr.id}`))}
              className="btn-primary flex items-center gap-2"
            >
              <FileSearch size={16} /> Create RFQ
            </button>
          )}

          {hasActions && (
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
                  {pr.status === 'DRAFT' && canUpdate && (
                    <button
                      onClick={() => handleAction(submitMutation, 'Submit', true)}
                      disabled={submitMutation.isLoading}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold"
                    >
                      <CheckCircle size={14} className="text-blue-500" />
                      Submit for Approval
                    </button>
                  )}
                  {pr.status === 'SUBMITTED' && canApprove && (
                    <>
                      <button
                        onClick={() => handleAction(approveMutation, 'Approve', true)}
                        disabled={approveMutation.isLoading}
                        className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold"
                      >
                        <CheckCircle size={14} className="text-emerald-500" />
                        Approve
                      </button>
                      <button
                        onClick={() => { setShowRejectModal(true); setShowMoreActions(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-zinc-100"
                      >
                        <XCircle size={14} className="text-rose-500" />
                        Reject
                      </button>
                    </>
                  )}
                  {pr.status === 'DRAFT' && canUpdate && (
                    <button
                      onClick={() => handleAction(cancelMutation, 'Cancel', true)}
                      disabled={cancelMutation.isLoading}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-zinc-100"
                    >
                      <XCircle size={14} className="text-rose-500" />
                      Cancel
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
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Requisition Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">PR Number</p>
                <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{displayValue(pr.requisitionNumber)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Requester</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(pr.requesterName)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Requisition Name</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(pr.requisitionName)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Department</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(pr.departmentName)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Cost Center</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(pr.costCenterName)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Required Date</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Priority</p>
                <div className="mt-1"><PriorityBadge priority={pr.priority} /></div>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
                <div className="mt-1"><StatusBadge status={pr.status} /></div>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Purpose</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">{displayValue(pr.purpose)}</p>
              </div>
              {pr.remarks && (
                <div className="col-span-2 md:col-span-3 lg:col-span-4">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Remarks</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{pr.remarks}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Requested Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                <thead className="bg-zinc-50/80 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">#</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Item</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Description</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Quantity</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Unit</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Required Date</th>
                    <th className="px-6 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Specifications/Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                        <Package className="mx-auto mb-2 text-zinc-300" size={24} />
                        <p className="text-sm font-medium">No items in this requisition</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-6 py-4 text-zinc-400 text-xs">{idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-zinc-900 text-xs">{item.itemName || '-'}</td>
                        <td className="px-6 py-4 text-zinc-600 text-xs max-w-[200px] truncate">{item.description || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-800 text-xs">{item.quantity || item.requestedQuantity || 0}</td>
                        <td className="px-6 py-4 text-zinc-600 text-xs">{item.unit || '-'}</td>
                        <td className="px-6 py-4 text-zinc-600 text-xs">{item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-zinc-600 text-xs max-w-[200px] truncate">{item.specifications || item.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Workflow Audit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pr.submittedBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Submitted By</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{pr.submittedBy}</p>
                  {pr.submittedAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(pr.submittedAt).toLocaleString()}</p>}
                </div>
              )}
              {pr.approvedBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Approved By</p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">{pr.approvedBy}</p>
                  {pr.approvedAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(pr.approvedAt).toLocaleString()}</p>}
                </div>
              )}
              {pr.rejectedBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Rejected By</p>
                  <p className="text-sm font-medium text-rose-700 mt-1">{pr.rejectedBy}</p>
                  {pr.rejectedAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(pr.rejectedAt).toLocaleString()}</p>}
                  {pr.rejectionReason && (
                    <div className="mt-2 p-2 bg-rose-50 rounded-lg border border-rose-200">
                      <p className="text-[10px] text-rose-700 font-medium">{pr.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
              {pr.cancelledBy && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Cancelled By</p>
                  <p className="text-sm font-medium text-zinc-700 mt-1">{pr.cancelledBy}</p>
                  {pr.cancelledAt && <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(pr.cancelledAt).toLocaleString()}</p>}
                </div>
              )}
              {pr.createdAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{new Date(pr.createdAt).toLocaleString()}</p>
                </div>
              )}
              {pr.updatedAt && (
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Updated</p>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{new Date(pr.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Reject Requisition</h3>
            <p className="text-sm text-zinc-500 mb-4">Please provide a reason for rejecting this requisition.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
              className="w-full h-24 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"
              >
                {rejectMutation.isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
