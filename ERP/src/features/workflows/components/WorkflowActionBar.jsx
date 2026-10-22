import React, { useState } from 'react';
import {
  Check, X, RotateCcw, UserCheck, Ban, Send, MessageSquare, Loader2,
} from 'lucide-react';

export default function WorkflowActionBar({
  permittedActions = {},
  onAction,
  isSubmitting = false,
}) {
  const [activeModal, setActiveModal] = useState(null); // 'APPROVE' | 'REJECT' | 'RETURN' | 'DELEGATE' | 'CANCEL' | 'SUBMIT'
  const [commentText, setCommentText] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const actions = permittedActions.availableActions || [];

  if (!actions || actions.length === 0) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center text-xs text-zinc-500 font-medium">
        You do not have any pending approval or submission actions for this workflow in your current role.
      </div>
    );
  }

  const handleOpenModal = (actionType) => {
    setActiveModal(actionType);
    setCommentText('');
    setTargetUserId('');
  };

  const handleConfirmAction = () => {
    if (!activeModal) return;
    onAction?.({
      action: activeModal,
      comment: commentText,
      targetUserId: targetUserId || undefined,
    });
    setActiveModal(null);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">Permitted Actions:</span>
          {permittedActions.isSystemAdmin && (
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
              SystemAdmin Override
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions.includes('APPROVE') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('APPROVE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Check size={14} strokeWidth={2.5} />
              Approve
            </button>
          )}

          {actions.includes('REJECT') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('REJECT')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <X size={14} strokeWidth={2.5} />
              Reject
            </button>
          )}

          {actions.includes('RETURN') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('RETURN')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              Return for Revision
            </button>
          )}

          {actions.includes('DELEGATE') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('DELEGATE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-colors disabled:opacity-50"
            >
              <UserCheck size={14} strokeWidth={2.5} />
              Delegate Task
            </button>
          )}

          {actions.includes('SUBMIT') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('SUBMIT')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-colors disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2.5} />
              Submit Workflow
            </button>
          )}

          {actions.includes('CANCEL') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOpenModal('CANCEL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors disabled:opacity-50"
            >
              <Ban size={14} strokeWidth={2.5} />
              Cancel Workflow
            </button>
          )}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-bold text-zinc-900">
                Confirm {activeModal.replace('_', ' ')}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {activeModal === 'DELEGATE' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Target User ID / Delegate UUID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter User UUID or Username"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Comments / Reason {activeModal === 'REJECT' || activeModal === 'RETURN' ? <span className="text-red-500">*</span> : '(Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={`Provide reason or instructions for ${activeModal.toLowerCase()}...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting || (activeModal === 'DELEGATE' && !targetUserId)}
                className={`inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors shadow-sm ${
                  activeModal === 'REJECT'
                    ? 'bg-red-600 hover:bg-red-700'
                    : activeModal === 'RETURN'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                }`}
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                Confirm {activeModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
