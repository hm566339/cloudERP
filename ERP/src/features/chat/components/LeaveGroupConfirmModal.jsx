import React, { useState } from 'react';
import { LogOut, X, Loader2, AlertCircle } from 'lucide-react';

export default function LeaveGroupConfirmModal({
  isOpen,
  channel,
  onClose,
  onConfirmLeave,
}) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !channel) return null;

  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      await onConfirmLeave(channel.id);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to leave group.'
      );
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#161922] w-full max-w-sm rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <LogOut className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-bold">Leave Group Channel</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLeaving}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-zinc-600 dark:text-zinc-300">
            Are you sure you want to leave{' '}
            <strong className="text-zinc-900 dark:text-white font-semibold">
              #{channel.name}
            </strong>
            ?
          </p>

          <p className="text-[11px] text-zinc-400 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
            ℹ️ You will no longer receive messages or alerts from this group until an admin invites you back.
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLeaving}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={isLeaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Leaving...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
