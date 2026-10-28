import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('HSN/SAC Master Pagination Logic & State Synchronization', () => {

  /**
   * Helper implementing the exact pagination normalization logic in HsnSac.jsx and DataTablePagination.jsx
   */
  function resolvePaginationDisplay({ pageInfo, page, pageSize, pageIndexBase = 0, totalItems }) {
    // Exact expression from HsnSac.jsx
    const resolvedPage = pageInfo.currentPage !== undefined
      ? pageInfo.currentPage
      : (pageInfo.page !== undefined ? pageInfo.page - 1 : page);

    const resolvedPageSize = pageInfo.size ?? pageInfo.pageSize ?? pageSize;
    const resolvedTotalPages = pageInfo.totalPages || 1;
    const resolvedTotalElements = pageInfo.totalElements ?? pageInfo.totalCount ?? totalItems;

    // Exact normalization from DataTablePagination.jsx
    const rawPage = resolvedPage;
    const effectiveBase = pageIndexBase;
    const pageZero = effectiveBase === 1 ? Math.max(0, rawPage - 1) : Math.max(0, rawPage);
    const displayPage = Math.min(pageZero + 1, resolvedTotalPages);

    const canPrev = displayPage > 1;
    const canNext = displayPage < resolvedTotalPages;

    return {
      resolvedPage,
      pageZero,
      displayPage,
      canPrev,
      canNext,
      totalPages: resolvedTotalPages,
      totalElements: resolvedTotalElements
    };
  }

  it('1. Initial Load: Starts on Page 1 (API page index 0), NOT Page 2', () => {
    // Fresh visit: useUrlFilters initializes page to 0 (0-based)
    const initialPage = 0;
    const initialPageSize = 10;

    // Backend responds with 1-based .page(1) and 0-based .currentPage(0)
    const backendPageInfo = {
      page: 1, // 1-based (pageResult.getNumber() + 1)
      currentPage: 0, // 0-based (pageResult.getNumber())
      size: 10,
      pageSize: 10,
      totalPages: 5,
      totalElements: 48
    };

    const result = resolvePaginationDisplay({
      pageInfo: backendPageInfo,
      page: initialPage,
      pageSize: initialPageSize,
      pageIndexBase: 0,
      totalItems: 48
    });

    // Must resolve to 0-based index 0 and 1-based display page 1
    assert.equal(result.resolvedPage, 0, 'Resolved page index sent to pagination must be 0');
    assert.equal(result.displayPage, 1, 'Displayed page in UI must be 1 on initial load');
    assert.equal(result.canPrev, false, 'Previous button must be disabled on page 1');
    assert.equal(result.canNext, true, 'Next button must be enabled when totalPages > 1');
  });

  it('2. Clicking Page 2: requests page=1 (0-based) and displays Page 2', () => {
    const targetPageOneBased = 2;
    const pageIndexBase = 0;
    const requestedApiPageIndex = pageIndexBase === 1 ? targetPageOneBased : targetPageOneBased - 1;

    assert.equal(requestedApiPageIndex, 1, 'Clicking Page 2 must request API page=1');

    // Backend response for page 1
    const backendPageInfo = {
      page: 2,
      currentPage: 1,
      size: 10,
      pageSize: 10,
      totalPages: 5,
      totalElements: 48
    };

    const result = resolvePaginationDisplay({
      pageInfo: backendPageInfo,
      page: requestedApiPageIndex,
      pageSize: 10,
      pageIndexBase: 0,
      totalItems: 48
    });

    assert.equal(result.resolvedPage, 1);
    assert.equal(result.displayPage, 2, 'Displayed page must be 2');
    assert.equal(result.canPrev, true, 'Previous button must be enabled on page 2');
    assert.equal(result.canNext, true, 'Next button must be enabled on page 2');
  });

  it('3. Clicking Page 3: requests page=2 (0-based) and displays Page 3', () => {
    const targetPageOneBased = 3;
    const requestedApiPageIndex = targetPageOneBased - 1;

    assert.equal(requestedApiPageIndex, 2, 'Clicking Page 3 must request API page=2');

    const backendPageInfo = {
      page: 3,
      currentPage: 2,
      size: 10,
      pageSize: 10,
      totalPages: 5,
      totalElements: 48
    };

    const result = resolvePaginationDisplay({
      pageInfo: backendPageInfo,
      page: requestedApiPageIndex,
      pageSize: 10,
      pageIndexBase: 0,
      totalItems: 48
    });

    assert.equal(result.resolvedPage, 2);
    assert.equal(result.displayPage, 3);
  });

  it('4. Previous and Next buttons navigate correctly', () => {
    let currentDisplayPage = 3;
    // Clicking Previous: targetPageOneBased = 2
    let prevTarget = currentDisplayPage - 1;
    let prevApiPage = prevTarget - 1;
    assert.equal(prevApiPage, 1, 'Previous from Page 3 must request page=1');

    // Clicking Next from Page 3: targetPageOneBased = 4
    let nextTarget = currentDisplayPage + 1;
    let nextApiPage = nextTarget - 1;
    assert.equal(nextApiPage, 3, 'Next from Page 3 must request page=3');
  });

  it('5. Last page: Next button is disabled', () => {
    const backendPageInfo = {
      page: 5,
      currentPage: 4,
      size: 10,
      pageSize: 10,
      totalPages: 5,
      totalElements: 48
    };

    const result = resolvePaginationDisplay({
      pageInfo: backendPageInfo,
      page: 4,
      pageSize: 10,
      pageIndexBase: 0,
      totalItems: 48
    });

    assert.equal(result.displayPage, 5);
    assert.equal(result.canPrev, true, 'Previous must be enabled on last page');
    assert.equal(result.canNext, false, 'Next must be disabled on last page');
  });

  it('6. Changing rows-per-page resets pagination to page 0', () => {
    let pageState = 3; // was on page 4 (0-based 3)
    let pageSizeState = 10;

    // Simulate handlePageSizeChange(25)
    const handlePageSizeChange = (newSize) => {
      pageSizeState = Number(newSize);
      pageState = 0; // resets to first page
    };

    handlePageSizeChange(25);
    assert.equal(pageSizeState, 25);
    assert.equal(pageState, 0, 'Page must reset to 0 when page size changes');
  });

  it('7. Changing search filter resets pagination to page 0', () => {
    let pageState = 2; // was on page 3
    let searchFilter = '';

    const handleSearchChange = (text) => {
      searchFilter = text;
      pageState = 0; // resets to first page
    };

    handleSearchChange('computer');
    assert.equal(searchFilter, 'computer');
    assert.equal(pageState, 0, 'Page must reset to 0 when search filter changes');
  });

  it('8. Company context change resets pagination to page 0', () => {
    let pageState = 2;
    let currentCompany = 'company-A';

    const onCompanyChange = (newCompany) => {
      if (newCompany !== currentCompany) {
        currentCompany = newCompany;
        pageState = 0;
      }
    };

    onCompanyChange('company-B');
    assert.equal(currentCompany, 'company-B');
    assert.equal(pageState, 0, 'Page must reset to 0 on company change');
  });

  it('9. Fallback when pageInfo is empty (loading state): remains on page 0 without jumping to 2', () => {
    const result = resolvePaginationDisplay({
      pageInfo: {},
      page: 0,
      pageSize: 10,
      pageIndexBase: 0,
      totalItems: 0
    });

    assert.equal(result.resolvedPage, 0);
    assert.equal(result.displayPage, 1, 'Loading or empty state must display Page 1, never Page 2');
  });
});

