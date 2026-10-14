/**
 * Centralized API Service
 * Handles common API operations, health checks, and provides consistent error handling
 */

import apiClient from '../api/common/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('API_SERVICE');

// Health check cache
let healthCheckCache = {
  result: null,
  timestamp: 0,
};
const HEALTH_CHECK_TTL = 30000; // 30 seconds

/**
 * Check backend health status with caching
 * Returns true if backend is healthy, false otherwise
 */
export const checkBackendHealth = async () => {
  const now = Date.now();

  // Return cached result if still valid
  if (healthCheckCache.result !== null && (now - healthCheckCache.timestamp) < HEALTH_CHECK_TTL) {
    return healthCheckCache.result;
  }

  try {
    const response = await apiClient.get('/actuator/health', { timeout: 5000 });
    const isHealthy = response.status === 200;
    healthCheckCache = { result: isHealthy, timestamp: now };
    return isHealthy;
  } catch (error) {
    // If actuator is not routed, consider online if status is 2xx or default to healthy to avoid UI false alarms
    const isAvailable = error?.response?.status && error.response.status < 500;
    healthCheckCache = { result: isAvailable, timestamp: now };
    return isAvailable;
  }
};

/**
 * Clear the health check cache to force a fresh check
 */
export const clearHealthCheckCache = () => {
  healthCheckCache = { result: null, timestamp: 0 };
};

/**
 * Validate API response structure
 * Ensures response has expected format
 */
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response) {
    logger.warn('API response validation failed: response is null or undefined');
    return false;
  }

  for (const field of expectedFields) {
    if (!(field in response)) {
      logger.warn('API response validation failed: missing field', {
        field,
      });
      return false;
    }
  }

  return true;
};

/**
 * Get error message from API error response
 * Handles various error response formats
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Axios error with response data
  if (error.response?.data) {
    const data = error.response.data;

    if (typeof data === 'string') {
      return data;
    }

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    if (data.errors && Array.isArray(data.errors)) {
      return data.errors
        .map((e) => e.message || e)
        .join(', ');
    }
  }

  // Network error
  if (error.message) {
    return error.message;
  }

  return 'An unknown error occurred';
};

/**
 * Retry API call with exponential backoff
 * Useful for transient errors
 */
export const retryApiCall = async (
  callFn,
  maxRetries = 3,
  baseDelay = 1000,
  shouldRetry = (error) => error.response?.status >= 500,
) => {
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.debug(`API call attempt ${attempt + 1}/${maxRetries}`);
      return await callFn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error)) {
        logger.error('API call failed with non-retryable error', {
          status: error.response?.status,
          attempt: attempt + 1,
        });
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`API call failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          status: error.response?.status,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('API call failed after all retries', {
    attempts: maxRetries,
  });
  throw lastError;
};

/**
 * Call the cookie-based Account logout API
 */
export const logout = async () => {
  const response = await apiClient.post('/api/account/auth/logout', {}, {
    withCredentials: true,
  });
  return response.data;
};

export default {
  checkBackendHealth,
  clearHealthCheckCache,
  validateApiResponse,
  getErrorMessage,
  retryApiCall,
  logout,
};
