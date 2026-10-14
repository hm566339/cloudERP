import React from 'react';
import { X } from 'lucide-react';

/**
 * ModalLayout standardizes the internal header, scrollable body, and actions footer
 * of all modal dialogues and drawers.
 *
 * Spacing Specs:
 * - Header: px-6 py-4 border-b border-zinc-200
 * - Body: p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto
 * - Footer: px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3
 */
export default function ModalLayout({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-2xl', // 'max-w-md' | 'max-w-lg' | 'max-w-2xl' | 'max-w-4xl' | 'max-w-5xl'
  className = '',
  ...props
}) {
  return (
    <div
      className={`w-full ${maxWidth} bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col ${className}`}
      {...props}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
        <div>
          {title && (
            <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto overscroll-contain">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}
