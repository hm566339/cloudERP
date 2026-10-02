import { READ_ONLY_BLOCK_MESSAGE, BLOCKED_ACCESS_MESSAGE } from './subscriptionHelper.js';

/**
 * Standardized API error message extraction.
 * Handles HTTP status codes according to ERP enterprise specifications:
 * - 401: Session expired
 * - 403: Permission / Read-only enforcement
 * - 404: Not found
 * - 409: Safe business conflict message
 * - 5xx: Generic safe error, never exposing internal Java traces
 */
export function getSafeErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  const status = error?.status || error?.response?.status;
  const data = error?.data || error?.response?.data;

  // Handle 401 Unauthorized
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  // Handle 403 Forbidden / Read-Only
  if (status === 403) {
    const rawMsg = data?.message || error?.message || '';
    const lower = rawMsg.toLowerCase();
    if (lower.includes('read_only') || lower.includes('read-only') || lower.includes('read only')) {
      return 'This organization is currently in read-only mode.';
    }
    if (lower.includes('blocked') || lower.includes('restricted')) {
      return BLOCKED_ACCESS_MESSAGE;
    }
    return "You don't have permission to perform this action.";
  }

  // Handle 404 Not Found
  if (status === 404) {
    return 'The requested resource was not found.';
  }

  // Handle 409 Conflict
  if (status === 409) {
    if (typeof data?.message === 'string' && !isStackTrace(data.message)) {
      return data.message;
    }
    return 'A conflict occurred with existing business data.';
  }

  // Handle 400 Bad Request
  if (status === 400) {
    // If validation error map exists: { field: message }
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      const messages = Object.values(data.data).filter(Boolean);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
    if (typeof data?.message === 'string' && !isStackTrace(data.message)) {
      return data.message;
    }
  }

  // Handle 5xx Server Error
  if (status >= 500) {
    return 'Something went wrong. Please try again.';
  }

  // General safe message check
  if (typeof data?.message === 'string' && !isStackTrace(data.message)) {
    return data.message;
  }

  if (typeof error.message === 'string' && !isStackTrace(error.message)) {
    return error.message;
  }

  return fallback;
}

function isStackTrace(str) {
  if (!str) return false;
  return (
    str.includes('Exception:') ||
    str.includes('at com.erp') ||
    str.includes('at org.springframework') ||
    str.includes('NullPointerException') ||
    str.includes('SqlException') ||
    str.includes('org.hibernate')
  );
}
