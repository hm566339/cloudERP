/**
 * @fileoverview Centralized logout handler.
 *
 * Handles Redux store dispatch, redirect, and queue cleanup.
 * Guards against multiple concurrent logout calls and redirect loops.
 */

import { clearAllQueues } from './refreshQueue';

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
 * 3. Redirects to `/login`.
 *
 * Guarded against:
 * - Multiple concurrent calls (only the first one executes).
 * - Redirect loops (skips redirect if already on an auth page).
 *
 * @param {import('./types').LogoutOptions} [options]
 */
export const dispatchLogout = (options = {}) => {
  const {
    redirectTo = '/login',
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
        const store = (typeof window !== 'undefined' && window.__REDUX_STORE__) || require('../../app/store').default;
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
        localStorage.clear();
        sessionStorage.clear();
        
        // Expire all auth-related cookies manually
        const cookiesToClear = ['ACCESS_TOKEN', 'ACCESS_TOKEN_REFRESH', 'auth_token'];
        cookiesToClear.forEach(name => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      } catch (storageError) {
        console.warn('[Auth] Failed to clear browser storage:', storageError);
      }
    }

    // 4. Redirect (unless already on an auth page)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!isAuthPage(currentPath)) {
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
