import { isRejectedWithValue } from '@reduxjs/toolkit';
import { addAlert } from '../features/notifications/notificationSlice';
import { createLogger } from '../utils/logger';

const logger = createLogger('ERROR_MIDDLEWARE');

/**
 * Log a warning and show a toast!
 */
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const endpointName = action.meta?.arg?.endpointName;
    const isAuthProbe = endpointName === 'ssoGetMe' || endpointName === 'getMe';
    const status = action.payload?.status;

    // Expected unauthenticated response during auth bootstrap probe; do not treat as error
    if (isAuthProbe && (status === 401 || status === 403)) {
      return next(action);
    }

    logger.warn('RTK Query rejected action', { error: action.error });
    
    let message = 'An unexpected error occurred.';
    if (action.payload?.data?.message) {
      message = action.payload.data.message;
    } else if (action.payload?.error) {
      message = action.payload.error;
    } else if (typeof action.payload === 'string') {
      message = action.payload;
    }

    // Only show a toast for failed MUTATIONS (POST/PUT/DELETE/PATCH).
    // GET query failures (404s for unimplemented modules) are expected and should be silent.
    const isMutation = action.type?.includes('executeMutation');

    if (isMutation && status !== 401 && status !== 403) {
      // 400, 401, 403, 404, >=500 are handled in baseApi.js
      // Only dispatch if baseApi didn't already dispatch
      const alreadyHandled = status === 400 || status === 404 || status >= 500;
      if (!alreadyHandled) {
        api.dispatch(addAlert({
          type: 'error',
          message: message
        }));
      }
    }
  }

  return next(action);
};

