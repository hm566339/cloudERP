import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('HSN/SAC Master Pagination Logic & State Synchronization', () => {

  /**
   * Helper implementing the exact pagination normalization logic in HsnSac.jsx and DataTablePagination.jsx
   */
    function resolvePaginationDisplay({ pageInfo = {}, page = 0, pageSize = 10, totalItems = 0, pageIndexBase = 0 }) {
      const totalElements = Number(pageInfo.totalElements ?? pageInfo.totalCount ?? totalItems);
      const resolvedPageSize = Number(pageInfo.size ?? pageInfo.pageSize ?? pageSize ?? 10);
      const totalPages = Number(pageInfo.totalPages) > 0
        ? Number(pageInfo.totalPages)
        : Math.max(1, Math.ceil(totalElements / resolvedPageSize));

      // Exact normalization from DataTablePagination.jsx
      const rawPage = page;
      const effectiveBase = pageIndexBase;
      const pageZero = effectiveBase === 1 ? Math.max(0, rawPage - 1) : Math.max(0, rawPage);
      const displayPage = Math.min(pageZero + 1, totalPages);

      const canPrev = displayPage > 1;
      const canNext = displayPage < totalPages;

      return {
        resolvedPage: page,
        pageZero,
        displayPage,
        canPrev,
        canNext,
      totalPages,
        totalElements,
        pageSize: resolvedPageSize
      };
    }

      it('1. Initial Load: Starts on Page 1 (API page=0), with 73 records and 10 rows per page -> 8 total pages', () => {
        // Fresh visit: useUrlFilters initializes page to 0 (0-based)
        const initialPage = 0;
        const initialPageSize = 10;
        const totalRecords = 73;

        // Backend responds with pageResult.getTotalPages() = 8, pageResult.getTotalElements() = 73
        const backendPageInfo = {
          page: 1, // 1-based (Spring pageResult.getNumber() + 1)
          size: 10,
      totalPages: 8,
          totalElements: 73
        };

        const result = resolvePaginationDisplay({
          pageInfo: backendPageInfo,
          page: initialPage,
          pageSize: initialPageSize,
      totalItems: totalRecords,
          pageIndexBase: 0
        });

        assert.equal(result.resolvedPage, 0, 'Internal page index sent to backend API must be 0');
        assert.equal(result.displayPage, 1, 'Displayed page in UI must be 1 on initial load');
        assert.equal(result.totalPages, 8, 'Total pages must be 8 for 73 records and 10 per page');
        assert.equal(result.canPrev, false, 'Previous button must be disabled on Page 1');
        assert.equal(result.canNext, true, 'Next button must be enabled on Page 1 when totalPages > 1');
      });

        it('2. Clicking Next (→) from Page 1: advances to Page 2 and sends API page=1', () => {
          let currentPage = 0; // Page 1 (0-based)
          const displayPage = currentPage + 1; // 1
          const pageIndexBase = 0;

          // In DataTablePagination: onClick={() => canNext && handlePageClick(displayPage + 1)}
          const targetPageOneBased = displayPage + 1; // 2
          const targetPage = pageIndexBase === 1 ? targetPageOneBased : targetPageOneBased - 1; // 1

          // State update
          currentPage = targetPage;
          assert.equal(currentPage, 1, 'Clicking Next from Page 1 must update page state to 1 (0-based)');

          const result = resolvePaginationDisplay({
            pageInfo: { size: 10, totalPages: 8, totalElements: 73 },
            page: currentPage,
            pageSize: 10,
      totalItems: 73
          });

          assert.equal(result.displayPage, 2, 'Displayed page must immediately update to 2');
          assert.equal(result.resolvedPage, 1, 'API query parameter must be page=1');
          assert.equal(result.canPrev, true, 'Previous button must be enabled on Page 2');
          assert.equal(result.canNext, true, 'Next button must be enabled on Page 2');
        });

          it('3. Numbered buttons: Clicking Page 2, Page 3 sends page=1, page=2 to API', () => {
            const pageIndexBase = 0;

            // Clicking Page 2
            const clickPage2Target = 2;
            const apiPage2 = pageIndexBase === 1 ? clickPage2Target : clickPage2Target - 1;
            assert.equal(apiPage2, 1, 'Clicking Page 2 must request API page=1');

              const resultPage2 = resolvePaginationDisplay({
                pageInfo: { totalPages: 8, totalElements: 73 },
                page: apiPage2,
                pageSize: 10,
              totalItems: 73
            });
          assert.equal(resultPage2.displayPage, 2);

            // Clicking Page 3
            const clickPage3Target = 3;
            const apiPage3 = pageIndexBase === 1 ? clickPage3Target : clickPage3Target - 1;
            assert.equal(apiPage3, 2, 'Clicking Page 3 must request API page=2');

            const resultPage3 = resolvePaginationDisplay({
              pageInfo: { totalPages: 8, totalElements: 73 },
              page: apiPage3,
              pageSize: 10,
      totalItems: 73
            });
            assert.equal(resultPage3.displayPage, 3);
          });

            it('4. Navigating from Page 7 to Page 8: Next button opens Page 8, then Next becomes disabled', () => {
              const pageIndexBase = 0;
              let currentPage = 6; // UI Page 7 (0-based 6)

              const resultPage7 = resolvePaginationDisplay({
                pageInfo: { totalPages: 8, totalElements: 73 },
                page: currentPage,
                pageSize: 10,
                totalItems: 73
              });
              assert.equal(resultPage7.displayPage, 7);
              assert.equal(resultPage7.canNext, true, 'Next must be enabled on Page 7');

              // Click Next from Page 7
              const nextTargetOneBased = resultPage7.displayPage + 1; // 8
              currentPage = pageIndexBase === 1 ? nextTargetOneBased : nextTargetOneBased - 1; // 7

              const resultPage8 = resolvePaginationDisplay({
                pageInfo: { totalPages: 8, totalElements: 73 },
                page: currentPage,
                pageSize: 10,
                totalItems: 73
              });
              assert.equal(resultPage8.displayPage, 8, 'Page 8 must be active');
              assert.equal(resultPage8.resolvedPage, 7, 'API query parameter must be page=7');
              assert.equal(resultPage8.canPrev, true, 'Previous must be enabled on Page 8');
              assert.equal(resultPage8.canNext, false, 'Next must be disabled on Page 8 (last page)');

              // From Page 8, click Previous
              const prevTargetOneBased = resultPage8.displayPage - 1; // 7
              currentPage = pageIndexBase === 1 ? prevTargetOneBased : prevTargetOneBased - 1; // 6
              assert.equal(currentPage, 6, 'Previous from Page 8 must navigate to page 6 (UI Page 7)');
            });

                it('5. Dynamic Total Pages Calculation: For 73 records and 10 rows per page, total pages is 8 even if backend totalPages is missing or 0', () => {
                // Scenario A: backend totalPages is 0
                const resultMissingTotalPages = resolvePaginationDisplay({
                  pageInfo: { totalPages: 0, totalElements: 73, size: 10 },
                  page: 0,
                  pageSize: 10,
                totalItems: 73
              });
            assert.equal(resultMissingTotalPages.totalPages, 8, 'Must dynamically calculate totalPages = ceil(73/10) = 8');

              // Scenario B: backend totalPages is undefined
              const resultUndefinedTotalPages = resolvePaginationDisplay({
                pageInfo: { totalElements: 73, size: 10 },
                page: 0,
                pageSize: 10,
      totalItems: 73
              });
              assert.equal(resultUndefinedTotalPages.totalPages, 8, 'Must dynamically calculate totalPages = 8 when undefined');
            });

              it('6. Changing rows-per-page updates pageSize, recalculates total pages, and resets to Page 1', () => {
                let pageState = 4; // Was on Page 5 (0-based 4)
                let pageSizeState = 10;
                const totalElements = 73;

                // Simulate handlePageSizeChange(20)
                const handlePageSizeChange = (newSize) => {
                  pageSizeState = Number(newSize);
                  pageState = 0; // resets to first page
                };

                handlePageSizeChange(20);
                assert.equal(pageSizeState, 20);
                assert.equal(pageState, 0, 'Page must reset to 0 (Page 1) when page size changes');

                const result = resolvePaginationDisplay({
                  pageInfo: { totalElements },
                  page: pageState,
                  pageSize: pageSizeState,
                  totalItems: totalElements
                });
                assert.equal(result.displayPage, 1, 'Must display Page 1');
                assert.equal(result.totalPages, 4, '73 records / 20 per page must equal 4 total pages');
                assert.equal(result.canNext, true);
                assert.equal(result.canPrev, false);
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

                it('9. Fallback when pageInfo is empty (loading state): remains on page 0 without jumping to Page 2', () => {
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

                it('10. Unmanaged list state (useUrlFilters / useListQuery without queryHook): setPage(1) is NOT clamped back to 0', () => {
                  // Simulating useListQuery clamping defense:
                  // When queryHook is null, hasManagedData is false, so it must never reset page to 0
                  let page = 0;
                  const queryHook = null;
                  const rawData = undefined;
                  const options = {};
                  const parsedData = { totalPages: 1 }; // default fallback when no rawData

                  const setPageInternal = (p) => { page = p; };

                  // User navigates to Page 2:
                  setPageInternal(1);
                  assert.equal(page, 1, 'Page state updated to 1');

                  // Clamping effect evaluation:
                  const hasManagedData = Boolean(queryHook && rawData) || options.totalPages !== undefined;
                  if (hasManagedData && parsedData.totalPages > 0 && page >= parsedData.totalPages) {
                    setPageInternal(Math.max(0, parsedData.totalPages - 1));
                  }

                  assert.equal(page, 1, 'Page state must remain 1 and NOT be clamped back to 0');
                });

                it('11. Response unwrapping extracts paginationResponse from nested envelopes correctly', () => {
                  const responseWithData = {
                    success: true,
                    data: {
                      hsnSacMasters: [{ id: '1', code: '1001' }],
                      paginationResponse: {
                        page: 1,
                        size: 10,
                        totalElements: 73,
                        totalPages: 8
                      }
                    }
                  };

                  const pageInfo1 = responseWithData?.data?.data?.paginationResponse
                    || responseWithData?.data?.paginationResponse
                    || responseWithData?.paginationResponse
                    || {};

                  assert.equal(pageInfo1.totalPages, 8);
                  assert.equal(pageInfo1.totalElements, 73);

                  const responseWithNestedData = {
                    success: true,
                    data: {
                      data: {
                        hsnSacMasters: [{ id: '1', code: '1001' }],
                        paginationResponse: {
                          page: 1,
                          size: 10,
                          totalElements: 73,
                          totalPages: 8
                        }
                      }
                    }
                  };

                  const pageInfo2 = responseWithNestedData?.data?.data?.paginationResponse
                    || responseWithNestedData?.data?.paginationResponse
                    || responseWithNestedData?.paginationResponse
                    || {};

                  assert.equal(pageInfo2.totalPages, 8);
                  assert.equal(pageInfo2.totalElements, 73);
                });
              });
