/**
 * @fileoverview Central Axios API client.
 *
 * Creates a single Axios instance with `withCredentials: true` and delegates
 * all interceptor logic to the modular interceptors system.
 *
 * Every request flowing through this client automatically gets:
 * - Company ID/Code injection (request interceptor)
 * - Per-module 401 → refresh → retry (response interceptor)
 * - Gateway error retries (502-504)
 *
 * All module API files (account, hr, inventory, etc.) and baseApi.js import
 * this client, so they all benefit from the interceptors without any changes.
 *
 * @example
 * import apiClient from './client';
 * const { data } = await apiClient.get('/api/inventory/stocks');
 */

import axios from 'axios';
import { attachInterceptors } from './interceptors';

// ─────────────────────────────────────────────────────────────────────────────
// Client Instance
// ─────────────────────────────────────────────────────────────────────────────

// Normalize: if VITE_API_BASE_URL is '/api' or ends with '/api', strip trailing '/api' because endpoints in the codebase already include '/api' prefix (e.g. '/api/companies', '/api/sso')
const rawBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';
const BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Attach request + response interceptors
attachInterceptors(apiClient);

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default apiClient;

/**
 * Backward-compatible alias.
 * Some older files import `accountHttpClient` — this keeps them working.
 */
export const accountHttpClient = apiClient;
