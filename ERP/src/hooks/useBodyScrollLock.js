import { useEffect } from 'react';

/**
 * Custom React hook to lock body scroll when dialogs, modals, or drawers are open.
 * Prevents background scroll chaining and layout shifting.
 * 
 * @param {boolean} isLocked - Whether scroll should currently be locked.
 */
let lockCount = 0;
let originalOverflow = '';

export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (typeof document === 'undefined' || !isLocked) return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow || '';
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
