import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({ 
  open, 
  title, 
  message, 
  details, 
  info, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel', 
  onConfirm, 
  onCancel, 
  loading = false, 
  loadingText,
  isDestructive = true, 
  zIndex = 9999 
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && !loading) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const Icon = isDestructive ? Trash2 : AlertTriangle;

  // Clean up 'info' object if raw database record
  let displayInfo = info;
  if (info && typeof info === 'object') {
    displayInfo = {};
    const skipKeys = ['id', 'companyId', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'isDeleted', 'version', '_class', 'active', 'status', 'company'];
    Object.entries(info).forEach(([key, value]) => {
      if (!skipKeys.includes(key) && value !== null && value !== '' && typeof value !== 'object') {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        displayInfo[formattedKey] = value;
      }
    });
    if (Object.keys(displayInfo).length === 0) displayInfo = null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel?.();
    }
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 flex items-center justify-center bg-zinc-900/55 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div 
        className="bg-white w-[calc(100vw-32px)] sm:w-[430px] max-w-[460px] rounded-xl shadow-2xl border border-zinc-200 overflow-hidden my-auto flex flex-col shrink-0 animate-scale-in"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
              isDestructive 
                ? 'bg-rose-50 border border-rose-100 text-rose-600' 
                : 'bg-amber-50 border border-amber-100 text-amber-600'
            }`}>
              <Icon size={16} />
            </div>
            <h3 id="confirm-dialog-title" className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
              {title || (isDestructive ? 'Delete Confirmation' : 'Confirm Action')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
            title="Close"
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto flex-1">
          <div id="confirm-dialog-desc" className="text-zinc-800 text-xs sm:text-sm font-medium leading-relaxed">
            {message}
          </div>
          
          {details && (
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {details}
            </p>
          )}

          {/* Optional Record Details Info */}
          {displayInfo && typeof displayInfo === 'object' && Object.keys(displayInfo).length > 0 && (
            <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden text-left shadow-2xs max-h-[30vh] overflow-y-auto">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-zinc-200/70">
                  {Object.entries(displayInfo).map(([key, value]) => (
                    <tr key={key} className="bg-white">
                      <td className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold w-1/3 bg-zinc-50/80">{key}</td>
                      <td className="px-3 py-2 text-xs text-zinc-900 font-medium truncate">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-[36px] px-4 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-[36px] px-4 text-xs font-semibold text-white rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{loadingText || (isDestructive ? 'Deleting...' : 'Processing...')}</span>
              </>
            ) : (
              <>
                <Icon size={14} />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
