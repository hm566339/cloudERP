import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { History, User, Clock, X } from 'lucide-react';

export default function AuditLogHover({ audit, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const timeoutRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 260; // Approximate width of the panel
    const panelHeight = 200; // Approximate height

    // Prefer opening to the right, unless there's no space
    let left = rect.right + 12;
    if (left + panelWidth > window.innerWidth) {
      left = rect.left - panelWidth - 12;
    }

    // Prefer aligning top, but push up if it overflows bottom
    let top = rect.top;
    if (top + panelHeight > window.innerHeight) {
      top = Math.max(10, window.innerHeight - panelHeight - 10);
    }

    setCoords({ top, left });
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    calculatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleScroll = (e) => {
      // Don't close if scrolling inside the panel itself
      if (isOpen && panelRef.current && panelRef.current.contains(e.target)) return;
      if (isOpen) calculatePosition();
    };

    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', calculatePosition);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', calculatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, calculatePosition]);

  // Support both nested (audit.created.by.username) and flat (audit.createdBy) formats
  const hasNested = audit && (audit.created || audit.updated);
  const hasFlat = audit && (audit.createdBy || audit.createdAt || audit.updatedBy || audit.updatedAt);

  if (!hasNested && !hasFlat) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const createdBy = audit.created?.by?.username || audit.createdBy || '—';
  const createdAt = formatDate(audit.created?.at || audit.createdAt);
  const updatedBy = audit.updated?.by?.username || audit.updatedBy || '—';
  const updatedAt = formatDate(audit.updated?.at || audit.updatedAt);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${isOpen ? 'text-indigo-600 bg-indigo-50' : ''} ${className}`}
      title="View Audit Log"
      role="button"
      tabIndex={0}
    >
      <History size={15} />

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="relative"
        >
          {/* Invisible hover bridge to prevent closing when moving from icon to panel */}
          <div className="absolute -inset-8 z-[-1]" />

          <div className="w-64 bg-white border border-zinc-200 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden relative">
            <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-zinc-800 flex items-center gap-1.5 uppercase tracking-wide">
                <History size={12} className="text-zinc-500" />
                Audit History
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors sm:hidden"
              >
                <X size={12} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative pl-4 border-l-2 border-zinc-100 space-y-4">

                {/* Created */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[9px] text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Created</div>
                  <div className="bg-zinc-50/50 rounded-lg border border-zinc-100/80 p-2.5 space-y-1.5 hover:border-zinc-200 transition-colors">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-700">
                      <User size={11} className="text-zinc-400" />
                      <span className="font-semibold">{createdBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <Clock size={11} className="text-zinc-400" />
                      {createdAt}
                    </div>
                  </div>
                </div>

                {/* Updated */}
                {(audit.updated || audit.updatedBy || audit.updatedAt) && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shadow-sm">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                    </div>
                    <div className="text-[9px] text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Last Updated</div>
                    <div className="bg-zinc-50/50 rounded-lg border border-zinc-100/80 p-2.5 space-y-1.5 hover:border-zinc-200 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-700">
                        <User size={11} className="text-zinc-400" />
                        <span className="font-semibold">{updatedBy}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Clock size={11} className="text-zinc-400" />
                        {updatedAt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
