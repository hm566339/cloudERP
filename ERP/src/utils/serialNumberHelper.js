/**
 * Universal Serial Number Helper
 *
 * Provides a single, deterministic implementation for row indexing across the ERP application.
 *
 * Formula:
 * serial = (currentPageZero * pageSize) + rowIndex + 1
 *
 * @param {Object} options
 * @param {number|string} [options.page=0] - Current page number (0-based or 1-based according to pageBase)
 * @param {number|string} [options.pageSize=10] - Number of items displayed per page
 * @param {number|string} [options.rowIndex] - 0-based index of the row on the current page
 * @param {number|string} [options.index] - Alias for rowIndex
 * @param {number} [options.pageBase=0] - Base of \`page\`: 0 (Spring Boot/backend 0-indexed) or 1 (SSO/UI 1-indexed)
 * @param {number|string} [options.offset] - Explicit offset (for cursor / load-more / chunked pagination)
 * @returns {number|string} 1-based serial number, or empty string if input is invalid
 */
export function getSerialNumber({
  page,
  pageSize,
  rowIndex,
  index,
  pageBase = 0,
  offset,
} = {}) {
  const effectiveIndex = rowIndex !== undefined ? rowIndex : index;
  const rowIdx = Number(effectiveIndex);

  // Guard against missing, non-numeric, or negative row index
  if (effectiveIndex === undefined || effectiveIndex === null || isNaN(rowIdx) || rowIdx < 0) {
    return '';
  }

  // Explicit offset mode (e.g. cursor / load-more lists)
  if (offset !== undefined && offset !== null) {
    const numOffset = Number(offset);
    if (!isNaN(numOffset) && numOffset >= 0) {
      return Math.floor(numOffset) + Math.floor(rowIdx) + 1;
    }
  }

  // Normalize page size (minimum 1, default 10)
  const size = Math.max(1, Number(pageSize) || 10);

  // Normalize page input
  const rawPage = Number(page !== undefined && page !== null ? page : (pageBase === 1 ? 1 : 0));
  const validRawPage = isNaN(rawPage) ? (pageBase === 1 ? 1 : 0) : rawPage;

  // Convert to 0-based internal page index
  const pageZero = pageBase === 1 ? Math.max(0, validRawPage - 1) : Math.max(0, validRawPage);

  const serial = Math.floor(pageZero * size) + Math.floor(rowIdx) + 1;
  return isNaN(serial) || serial < 1 ? '' : serial;
}

/**
 * Computes consecutive serial range for pagination footer ("Showing from to to of total").
 * Guarantees that first row serial === from and last row serial === to.
 *
 * @param {Object} options
 * @param {number|string} options.page - Current page
 * @param {number|string} options.pageSize - Page size
 * @param {number|string} options.total - Total number of elements
 * @param {number} [options.pageBase=0] - Base of page (0 or 1)
 * @returns {{ from: number, to: number, total: number }}
 */
export function getSerialNumberRange({ page, pageSize, total = 0, pageBase = 0 } = {}) {
  const numTotal = Math.max(0, Number(total) || 0);
  if (numTotal === 0) {
    return { from: 0, to: 0, total: 0 };
  }

  const size = Math.max(1, Number(pageSize) || 10);
  const rawPage = Number(page !== undefined && page !== null ? page : (pageBase === 1 ? 1 : 0));
  const validRawPage = isNaN(rawPage) ? (pageBase === 1 ? 1 : 0) : rawPage;
  const pageZero = pageBase === 1 ? Math.max(0, validRawPage - 1) : Math.max(0, validRawPage);

  const from = pageZero * size + 1;
  const to = Math.min((pageZero + 1) * size, numTotal);

  return { from, to, total: numTotal };
}

export default getSerialNumber;
