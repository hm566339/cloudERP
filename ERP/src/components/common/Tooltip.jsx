import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Reusable Portal-Based Tooltip Component
 * 
 * - Portals directly into document.body to completely escape table, card, and row overflow boundaries.
 * - Dynamic Viewport Collision Detection:
 *     * Vertical: Automatically flips below the trigger if insufficient space above (< 42px).
 *     * Horizontal: Clamps position to keep the tooltip within viewport edges with safe margins.
 *     * Arrow alignment: Dynamically shifts arrow to point directly at trigger center even when clamped.
 * - High z-index (z: 9999) guarantees rendering above all table rows, cards, and modal backdrops.
 * - Supports mouse hover and keyboard focus-within.
 * - Smooth 150ms transition with zero layout shift.
 */
export default function Tooltip({ 
  content, 
  children, 
  className = '' 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, showBelow: false, arrowOffset: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    // Auto-detect vertical space: flip below if < 42px from top of viewport
    const showBelow = rect.top < 42;
    const triggerCenter = rect.left + rect.width / 2;
    const viewportWidth = window.innerWidth;
    const padding = 10;

    let left = triggerCenter;
    let arrowOffset = 0;

    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const halfWidth = tooltipRect.width / 2;
      
      // Clamp horizontally within viewport
      if (left - halfWidth < padding) {
        const adjustedLeft = padding + halfWidth;
        arrowOffset = triggerCenter - adjustedLeft;
        left = adjustedLeft;
      } else if (left + halfWidth > viewportWidth - padding) {
        const adjustedLeft = viewportWidth - padding - halfWidth;
        arrowOffset = triggerCenter - adjustedLeft;
        left = adjustedLeft;
      }
    }

    setCoords({
      top: showBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      showBelow,
      arrowOffset
    });
  }, []);

  const handleShow = () => {
    calculatePosition();
    setIsVisible(true);
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  useIsomorphicLayoutEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate, { capture: true });
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, calculatePosition]);

  if (!content) return children;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      onClick={handleHide}
      className={`relative inline-flex ${className}`}
    >
      {children}
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="pointer-events-none transition-opacity duration-150 ease-out whitespace-nowrap"
        >
          <div className="relative bg-[#111827] text-white text-[11px] font-medium px-[9px] py-[5px] rounded-[5px] shadow-lg tracking-normal leading-tight">
            {content}
            {/* Arrow */}
            <span 
              className={`absolute w-0 h-0 border-x-[4px] border-x-transparent ${
                coords.showBelow 
                  ? '-top-1 border-b-[4px] border-b-[#111827]' 
                  : '-bottom-1 border-t-[4px] border-t-[#111827]'
              }`}
              style={{
                left: `calc(50% + ${coords.arrowOffset}px)`,
                transform: 'translateX(-50%)'
              }}
              aria-hidden="true"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
