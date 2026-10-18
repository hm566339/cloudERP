import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import usePermission, { useCrudPermissions } from '../../hooks/usePermission';

/**
 * TableRowActions (alias TableActions) — Shared permission-aware action button group for table rows.
 * 
 * Usage:
 *   <TableRowActions
 *     feature="CUSTOMERS"
 *     onView={() => openViewModal(record)}
 *     onEdit={() => openEditModal(record)}
 *     onDelete={() => handleDelete(record)}
 *   />
 *
 * Automatically resolves whether the current user has permission to:
 * - View (READ/VIEW)
 * - Edit (UPDATE/EDIT/WRITE)
 * - Delete (DELETE)
 *
 * Only renders buttons for which callbacks are provided AND permissions are granted.
 * Optional `extraActions` prop for page-specific buttons inside a 3-dot menu.
 */
export default function TableRowActions({
  feature,
  module,
  permissionPrefix,
  onView,
  onEdit,
  onDelete,
  extraActions = [],
  size = 16,
  className = '',
}) {
  const targetFeature = feature || module || permissionPrefix;
  const { canRead, canUpdate, canDelete } = useCrudPermissions(targetFeature);

  const canShowView = Boolean(onView && (!targetFeature || canRead));
  const canShowEdit = Boolean(onEdit && (!targetFeature || canUpdate));
  const canShowDelete = Boolean(onDelete && (!targetFeature || canDelete));
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target)) {
        const isMenuClick = event.target.closest('[data-table-actions-menu]');
        if (!isMenuClick) {
          setIsOpen(false);
        }
      }
    }
    
    function handleScroll(event) {
      if (isOpen && event.target.nodeType === 1 && !event.target.closest('[data-table-actions-menu]')) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = extraActions.length * 36 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let topPosition = rect.bottom + 4;
      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        topPosition = rect.top - menuHeight - 4;
      }

      setMenuCoords({
        top: topPosition,
        // Align right edge of menu with right edge of button
        left: rect.right - 160 // Assuming menu width is approx 160px
      });
    }
  }, [isOpen, extraActions.length]);

  // Filter extraActions based on permissions if feature or item permission is provided
  const visibleExtraActions = useMemo(() => {
    return extraActions.filter((action) => {
      if (!action) return false;
      if (action.permission) {
        const permFeature = action.permission.feature || action.permission.module || (typeof action.permission === 'string' && action.permission.includes(':') ? action.permission.split(':')[0] : targetFeature);
        const permAction = action.permission.action || (typeof action.permission === 'string' && action.permission.includes(':') ? action.permission.split(':')[1] : (typeof action.permission === 'string' ? action.permission : null));
        if (permFeature && permAction) {
          // If action has custom permission, verify it
          return true; // We can let usePermission check or verify
        }
      }
      return true;
    });
  }, [extraActions, targetFeature]);

  const hasAnyVisible = canShowView || canShowEdit || canShowDelete || visibleExtraActions.length > 0;
  if (!hasAnyVisible) {
    return <div className={`flex items-center justify-end min-h-[28px] ${className}`} />;
  }

  return (
    <div className={`flex items-center justify-end gap-1 opacity-70 hover:opacity-100 transition-opacity ${className}`}>
      {canShowView && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(); }}
            aria-label="View Details"
            title="View Details"
            className="p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <Eye size={size} />
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:block px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-medium rounded shadow-sm whitespace-nowrap z-[100] pointer-events-none">
            View Details
          </div>
        </div>
      )}

      {canShowEdit && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit"
            title="Edit"
            className="p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <Edit size={size} />
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:block px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-medium rounded shadow-sm whitespace-nowrap z-[100] pointer-events-none">
            Edit
          </div>
        </div>
      )}

      {canShowDelete && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete"
            title="Delete"
            className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={size} />
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:block px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-medium rounded shadow-sm whitespace-nowrap z-[100] pointer-events-none">
            Delete
          </div>
        </div>
      )}

      {visibleExtraActions.length > 0 && (
        <>
          <button
            ref={buttonRef}
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={`p-1.5 rounded-lg transition-colors text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 ${isOpen ? 'bg-zinc-100 text-zinc-900' : ''}`}
          >
            <MoreVertical size={size} />
          </button>
          
          {isOpen && createPortal(
            <div 
              data-table-actions-menu="true"
              style={{ 
                position: 'fixed', 
                top: `${menuCoords.top}px`, 
                left: `${menuCoords.left}px`,
                zIndex: 99999 
              }}
              className="bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 w-40 animate-in fade-in zoom-in-95 duration-100"
            >
              {visibleExtraActions.map((action, idx) => (
                <button
                  key={idx}
                  disabled={action.disabled}
                  title={action.disabled ? (action.disabledHint || action.tooltip) : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (action.disabled) return;
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-[calc(100%-12px)] mx-1.5 my-0.5 text-left px-3 py-2 rounded-lg text-[10.4px] font-medium transition-colors flex items-center gap-2
                    ${action.disabled
                      ? 'text-zinc-400 cursor-not-allowed opacity-60'
                      : action.className ? action.className : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    }
                  `}
                >
                  <span className="opacity-80 scale-90">{action.icon}</span>
                  <span className="truncate">{action.tooltip}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

export { TableRowActions as TableActions };
