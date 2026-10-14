import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Intelligent Scroll Restoration & Reset Component.
 * - Resets both window and layout <main> container to top on PUSH navigation.
 * - Restores exact scroll coordinates when navigating back/forward (POP navigation).
 */
const scrollHistory = new Map();

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType(); // 'POP', 'PUSH', 'REPLACE'
  const fullPath = `${pathname}${search}`;
  const previousPathRef = useRef(fullPath);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mainContainer = document.querySelector('main');

    // Save previous route scroll position before moving
    const prevKey = previousPathRef.current;
    if (prevKey) {
      scrollHistory.set(prevKey, {
        windowY: window.scrollY || 0,
        mainY: mainContainer ? mainContainer.scrollTop : 0
      });
    }

    if (navType === 'POP' && scrollHistory.has(fullPath)) {
      // Restore scroll on Back/Forward navigation
      const saved = scrollHistory.get(fullPath);
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved.windowY, left: 0, behavior: 'instant' });
        if (mainContainer) {
          mainContainer.scrollTo({ top: saved.mainY, left: 0, behavior: 'instant' });
        }
      });
    } else {
      // Clean reset on new page navigation
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }

    previousPathRef.current = fullPath;
  }, [fullPath, navType]);

  return null;
}
