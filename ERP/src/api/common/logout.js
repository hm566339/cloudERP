/**
 * @fileoverview Centralized logout handler.
 *
 * Handles Redux store dispatch, redirect, and queue cleanup.
 * Guards against multiple concurrent logout calls and redirect loops.
 */

import { clearAllQueues } from './refreshQueue.js';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

/** Prevent multiple simultaneous logout calls */
let isLoggingOut = false;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the current page is an auth-related page.
 * Used to prevent redirect loops (e.g., 401 on /login → redirect to /login → 401 …).
 *
 * @param {string} path - Current window.location.pathname
 * @returns {boolean}
 */
export const isAuthPage = (path) =>
  path.includes('/login') ||
  path.includes('/auth/callback') ||
  path.includes('/reset-password') ||
  path.includes('/forgot-password') ||
  path.includes('/verify-email') ||
  path.includes('/register');

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perform a full client-side logout.
 *
 * 1. Dispatches `auth/logout` to the Redux store (clears auth state).
 * 2. Clears all per-module refresh queues (rejects pending requests).
 * 3. Redirects to `/erp/` (ERP landing page).
 *
 * Guarded against:
 * - Multiple concurrent calls (only the first one executes).
 * - Redirect loops (skips redirect if already on an auth page).
 *
 * @param {import('./types').LogoutOptions} [options]
 */
export const dispatchLogout = (options = {}) => {
  const defaultLandingPath =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BASE_PATH || import.meta.env?.BASE_URL))
      ? (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL).replace(/\/$/, '') + '/'
      : '/erp/';

  const {
    redirectTo = defaultLandingPath,
    clearQueues = true,
    dispatchAction = true,
  } = options;

  // Guard: prevent multiple simultaneous logout attempts
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // 1. Dispatch Redux logout action
    if (dispatchAction) {
      try {
        const store = typeof window !== 'undefined' ? window.__REDUX_STORE__ : null;
        if (store?.dispatch) {
          store.dispatch({ type: 'auth/logout' });
        }
      } catch (e) {
        // Store may not be available during SSR or early init
        console.warn('[Auth] Could not dispatch logout action:', e.message);
      }
    }

    // 2. Clear all module refresh queues
    if (clearQueues) {
      clearAllQueues();
    }

    // 3. Clear all browser storage to ensure a clean slate
    if (typeof window !== 'undefined') {
      try {
        const currentPath = window.location.pathname.replace(/^(\/erp)+/i, '') || '/';
        const returnUrl = currentPath + window.location.search + window.location.hash;

        localStorage.clear();
        sessionStorage.clear();

        if (
          !isAuthPage(currentPath) &&
          currentPath !== '/' &&
          currentPath !== '/landing' &&
          currentPath !== '/login' &&
          !currentPath.includes('/dashboard/dashboard')
        ) {
          sessionStorage.setItem('auth_return_to', returnUrl);
        }
        
        // Expire all auth-related cookies manually
        const cookiesToClear = ['ACCESS_TOKEN', 'ACCESS_TOKEN_REFRESH', 'auth_token'];
        cookiesToClear.forEach(name => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      } catch (storageError) {
        console.warn('[Auth] Failed to clear browser storage:', storageError);
      }
    }

    // 4. Redirect (unless already on an auth page, landing page, or root)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.replace(/^(\/erp)+/i, '') || '/';
      if (!isAuthPage(currentPath) && currentPath !== '/' && currentPath !== '/landing') {
        window.location.href = redirectTo;
      }
    }
  } finally {
    // Reset the guard after a short delay to allow for potential race conditions
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
};
