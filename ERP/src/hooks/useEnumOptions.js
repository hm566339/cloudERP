import { useMemo } from 'react';
import { enumService } from '../services/enumService';

/**
 * Hook to retrieve options for an enum with label, value, color, and class names
 * @param {string} enumKey
 * @returns {Array<{value: string, label: string, color: string, className: string}>}
 */
export function useEnumOptions(enumKey) {
  return useMemo(() => {
    if (!enumKey) return [];
    return enumService.getOptions(enumKey);
  }, [enumKey]);
}

export default useEnumOptions;
