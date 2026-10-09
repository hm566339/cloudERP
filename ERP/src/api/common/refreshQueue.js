/**
 * @fileoverview Per-module refresh queue manager.
 *
 * Each backend module gets its own independent refresh state. This ensures:
 * - Only ONE refresh request per module at a time (no duplicate refreshes).
 * - Multiple modules can refresh CONCURRENTLY (account refreshing won't block HR).
 * - All pending requests for a module are resolved/rejected together after refresh.
 *
 * @see {import('./types').RefreshState}
 * @see {import('./types').QueuedRequest}
 */

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-module refresh state map.
 * @type {Map<string, import('./types').RefreshState>}
 */
const moduleStates = new Map();

/**
 * Get or initialize the refresh state for a module.
 * @param {string} moduleName
 * @returns {import('./types').RefreshState}
 */
const getState = (moduleName) => {
  if (!moduleStates.has(moduleName)) {
    moduleStates.set(moduleName, {
      isRefreshing: false,
      queue: [],
    });
  }
  return moduleStates.get(moduleName);
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a refresh is currently in-flight for a module.
 *
 * @param {string} moduleName - Module name.
 * @returns {boolean}
 */
export const isModuleRefreshing = (moduleName) => {
  return getState(moduleName).isRefreshing;
};

/**
 * Mark a module as refreshing or done.
 *
 * @param {string} moduleName - Module name.
 * @param {boolean} value - True = refresh in progress, false = refresh complete.
 */
export const setRefreshing = (moduleName, value) => {
  getState(moduleName).isRefreshing = value;
};

/**
 * Enqueue a pending request that is waiting for a module's refresh to complete.
 * Returns a Promise that resolves when the refresh succeeds, or rejects if it fails.
 *
 * @param {string} moduleName - Module name.
 * @returns {Promise<void>} Resolves on successful refresh, rejects on failure.
 */
export const enqueue = (moduleName) => {
  return new Promise((resolve, reject) => {
    getState(moduleName).queue.push({ resolve, reject });
  });
};

/**
 * Process (resolve or reject) all queued requests for a module.
 *
 * @param {string} moduleName - Module name.
 * @param {Error | null} error - If null, all queued requests are resolved.
 *                                If an Error, all queued requests are rejected with it.
 * @param {string | null} [token=null] - Optional fresh access token to pass to resolved requests.
 */
export const processQueue = (moduleName, error, token = null) => {
  const state = getState(moduleName);
  const queue = [...state.queue]; // Snapshot to avoid mutation during iteration
  state.queue = [];

  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
};

/**
 * Clear all refresh states across all modules.
 * Used during logout to ensure a clean slate.
 */
export const clearAllQueues = () => {
  moduleStates.forEach((state, moduleName) => {
    // Reject any remaining queued requests
    if (state.queue.length > 0) {
      const logoutError = new Error('Session terminated — all pending requests cancelled.');
      state.queue.forEach(({ reject }) => reject(logoutError));
      state.queue = [];
    }
    state.isRefreshing = false;
  });
  moduleStates.clear();
};

/**
 * Get debug info about all module states.
 * Useful for development debugging.
 *
 * @returns {Object<string, { isRefreshing: boolean, queueLength: number }>}
 */
export const getDebugInfo = () => {
  const info = {};
  moduleStates.forEach((state, name) => {
    info[name] = {
      isRefreshing: state.isRefreshing,
      queueLength: state.queue.length,
    };
  });
  return info;
};
