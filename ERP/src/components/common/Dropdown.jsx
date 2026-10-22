import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Standard Dropdown Menu component.
 * Follows ERP design tokens: zinc border, rounded-xl, portal-rendered with collision avoidance.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Trigger element (button, icon, etc.)
 * @param {Array<{label: string, icon?: any, onClick?: function, danger?: boolean, disabled?: boolean, divider?: boolean}>} [props.items]
 * @param {'left' | 'right' | 'auto'} [props.align='auto']
 * @param {React.ReactNode} [props.children] - Custom dropdown body if not using items
 */
export default function Dropdown({
  trigger,
  items,
  align = 'auto',
  children,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, showAbove: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const estimatedHeight = 200;
    const showAbove = rect.bottom + estimatedHeight > viewportHeight && rect.top > estimatedHeight;

    let left = rect.left;
    if (align === 'right' || (align === 'auto' && rect.left + 180 > viewportWidth)) {
      left = rect.right - 180;
    }

    setCoords({
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(left, viewportWidth - 190)),
      showAbove,
    });
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.showAbove ? undefined : `${coords.top}px`,
              bottom: coords.showAbove ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className={`min-w-[170px] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-xl dark:shadow-2xl py-1 animate-scale-in text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] ${className}`}
          >
            {items
              ? items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={`div-${idx}`} className="my-1 border-t border-zinc-100 dark:border-[#2A2F3D]" />;
                  }

                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label || idx}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        close();
                        item.onClick?.();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        item.danger
                          ? 'text-rose-600 dark:text-[#F0616D] hover:bg-rose-50 dark:hover:bg-[#F0616D]/15 hover:text-rose-700 dark:hover:text-[#F0616D]'
                          : 'text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-950 dark:hover:text-[#E6E8EE]'
                      }`}
                    >
                      {Icon && (
                        <span className="shrink-0">
                          {React.isValidElement(Icon) ? Icon : <Icon size={14} />}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })
              : typeof children === 'function'
              ? children({ close })
              : children}
          </div>,
          document.body
        )}
    </>
  );
}
