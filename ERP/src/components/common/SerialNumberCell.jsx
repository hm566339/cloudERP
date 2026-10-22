import React from 'react';
import { getSerialNumber } from '../../utils/serialNumberHelper';

/**
 * Standard Serial Number Cell Component
 *
 * Renders a guaranteed consecutive 1-based row index across all pages, page sizes,
 * searches, filters, and sorts.
 */
export default function SerialNumberCell({
  page,
  pageSize,
  rowIndex,
  index,
  pageBase = 0,
  offset,
  className = 'text-center font-medium text-zinc-500 dark:text-zinc-400 tabular-nums',
  as: Component = 'span',
  ...rest
}) {
  const serial = getSerialNumber({ page, pageSize, rowIndex, index, pageBase, offset });

  if (serial === '' || serial === undefined || serial === null) {
    return null;
  }

  return (
    <Component className={className} {...rest}>
      {serial}
    </Component>
  );
}

export { SerialNumberCell };
