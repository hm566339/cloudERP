import { useState, useEffect, useCallback, useRef } from 'react';

export function useApiQuery(apiFunction, params = null, options = { skip: false }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiFunctionRef = useRef(apiFunction);
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  }, [apiFunction]);

  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    const safeOptions = options || {};
    if (safeOptions.skip || safeOptions.enabled === false) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);
    try {
      const fn = apiFunctionRef.current;
      const result = Array.isArray(params) ? await fn(...params) : await fn(params);
      if (!signal.aborted) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (signal.aborted || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return;
      }
      setError(err);
      throw err;
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [JSON.stringify(params), JSON.stringify(options)]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When company context changes, invalidate previous company data and refetch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCompanyChange = () => {
      setData(null);
      fetchData();
    };
    window.addEventListener('app:company-changed', handleCompanyChange);
    return () => {
      window.removeEventListener('app:company-changed', handleCompanyChange);
    };
  }, [fetchData]);

  return { data, isLoading, isFetching: isLoading, error, refetch: fetchData, mutateLocal: setData };
}

export function useApiMutation(apiFunction) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = (params) => {
    const promise = (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = Array.isArray(params) ? await apiFunction(...params) : await apiFunction(params);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    })();
    // Attach unwrap method so .unwrap() works
    promise.unwrap = () => promise;
    return promise;
  };

  const mutate = (params, options = {}) => {
    mutateAsync(params)
      .then(res => {
        if (options.onSuccess) options.onSuccess(res);
      })
      .catch(err => {
        if (options.onError) options.onError(err);
      });
  };

  const unwrap = (params) => mutateAsync(params);

  // Return a hybrid array/object so both RTK Query and React Query styles work
  const tuple = [
    mutateAsync,
    { isLoading, error, unwrap }
  ];

  tuple.mutateAsync = mutateAsync;
  tuple.mutate = mutate;
  tuple.isLoading = isLoading;
  tuple.isPending = isLoading;
  tuple.error = error;
  tuple.unwrap = unwrap;

  return tuple;
}
