/**
 * @fileoverview Per-module refresh queue manager.
 *
 * Each backend module gets its own independent refresh state. This ensures:
 * - Only ONE refresh request per module at a time (single-flight deduplication).
 * - Multiple modules can refresh CONCURRENTLY (account refreshing won't block HR).
 * - All pending/queued requests for a module are resolved/rejected cleanly together.
 * - Single-flight promise sharing prevents hanging/pending request deadlocks.
 */

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-module refresh state map.
 */
const moduleStates = new Map();

/**
 * Get or initialize the refresh state for a module.
 * @param {string} moduleName
 * @returns {object}
 */
const getState = (moduleName) => {
  if (!moduleStates.has(moduleName)) {
    moduleStates.set(moduleName, {
      isRefreshing: false,
      activePromise: null,
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
  const state = getState(moduleName);
  return state.isRefreshing || state.activePromise !== null;
};

/**
 * Mark a module as refreshing or done.
 *
 * @param {string} moduleName - Module name.
 * @param {boolean} value - True = refresh in progress, false = refresh complete.
 */
export const setRefreshing = (moduleName, value) => {
  const state = getState(moduleName);
  state.isRefreshing = Boolean(value);
  if (!value) {
    state.activePromise = null;
  }
};

/**
 * Bind an in-flight refresh promise to a module for single-flight sharing.
 *
 * @param {string} moduleName
 * @param {Promise<string|null>|null} promise
 */
export const setModuleRefreshPromise = (moduleName, promise) => {
  const state = getState(moduleName);
  state.activePromise = promise;
  state.isRefreshing = promise !== null;
};

/**
 * Get the in-flight refresh promise for a module, if any.
 *
 * @param {string} moduleName
 * @returns {Promise<string|null>|null}
 */
export const getModuleRefreshPromise = (moduleName) => {
  return getState(moduleName).activePromise;
};

/**
 * Enqueue or await the active refresh promise.
 * Returns a Promise that resolves with the fresh token when refresh succeeds,
 * or rejects if it fails.
 *
 * @param {string} moduleName - Module name.
 * @returns {Promise<string|null>} Resolves on successful refresh, rejects on failure.
 */
export const enqueue = (moduleName) => {
  const state = getState(moduleName);
  if (state.activePromise) {
    return state.activePromise;
  }
  return new Promise((resolve, reject) => {
    state.queue.push({ resolve, reject });
  });
};

/**
 * Process (resolve or reject) all queued requests for a module and reset refresh state.
 *
 * @param {string} moduleName - Module name.
 * @param {Error | null} error - If null, all queued requests are resolved.
 *                                If an Error, all queued requests are rejected with it.
 * @param {string | null} [token=null] - Optional fresh access token to pass to resolved requests.
 */
export const processQueue = (moduleName, error, token = null) => {
  const state = getState(moduleName);
  state.isRefreshing = false;
  state.activePromise = null;

  const queue = [...state.queue];
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
  moduleStates.forEach((state) => {
    if (state.queue.length > 0) {
      const logoutError = new Error('Session terminated — all pending requests cancelled.');
      state.queue.forEach(({ reject }) => reject(logoutError));
      state.queue = [];
    }
    state.isRefreshing = false;
    state.activePromise = null;
  });
  moduleStates.clear();
};

/**
 * Get debug info about all module states.
 *
 * @returns {Object<string, { isRefreshing: boolean, hasActivePromise: boolean, queueLength: number }>}
 */
export const getDebugInfo = () => {
  const info = {};
  moduleStates.forEach((state, name) => {
    info[name] = {
      isRefreshing: state.isRefreshing,
      hasActivePromise: state.activePromise !== null,
      queueLength: state.queue.length,
    };
  });
  return info;
};
