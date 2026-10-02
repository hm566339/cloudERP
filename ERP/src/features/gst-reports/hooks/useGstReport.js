import { useState, useCallback, useRef } from 'react';

/**
 * Fetches a GST report via a POST request (payload-driven).
 *
 * @param {object} options
 * @param {Function} options.fetcher  (payload) => Promise<response>
 * @param {boolean}  [options.autoFetch=true]  Automatically fetch whenever payload changes
 */
export function useGstReport({ fetcher, autoFetch = false }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchReport = useCallback(async (payload) => {
    console.log('[useGstReport] fetchReport called with payload:', payload);

    if (!payload) {
      console.warn('[useGstReport] SKIPPED: no payload provided');
      return;
    }

    const fn = fetcherRef.current;
    if (typeof fn !== 'function') {
      console.error('[useGstReport] SKIPPED: fetcher is not a function:', fn);
      return;
    }

    console.log('[useGstReport] Calling fetcher now...');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fn(payload);
      console.log('[useGstReport] SUCCESS - response:', res);
      setData(res);
    } catch (err) {
      console.error('[useGstReport] ERROR:', err);
      setError(
        err?.response?.data?.message || err.message || 'Failed to fetch GST report'
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies — fetcherRef.current is always up to date

  return {
    data,
    isLoading,
    error,
    refetch: fetchReport,
    mutateLocal: setData,
  };
}
