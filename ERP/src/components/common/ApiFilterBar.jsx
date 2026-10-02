import React from 'react';
import FilterBar from './FilterBar';

/**
 * ApiFilterBar — A thin wrapper around FilterBar that works seamlessly with useApiFilters.
 * 
 * Usage:
 *   const { filterBarProps } = useApiFilters(FILTER_CONFIGS.bankAccounts);
 *   <ApiFilterBar {...filterBarProps} />
 */
export default function ApiFilterBar({ variant, ...props }) {
  return (
    <div className={variant === 'minimal' ? 'mb-3' : 'mb-4'}>
      <FilterBar variant={variant} {...props} />
    </div>
  );
}
