import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure list query state reducer logic mirroring useListQuery.js
 */
function createListQueryManager(initialUrlParams = {}, options = {}) {
  const { defaultPageSize = 10 } = options;

  // 1. URL Parse / Clamp
  const rawPage = parseInt(initialUrlParams.page || '1', 10);
  const initialPage = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const initialPageSize = Math.max(
    1,
    parseInt(initialUrlParams.pageSize || initialUrlParams.size || String(defaultPageSize), 10)
  );

  let state = {
    page: initialPage - 1, // 0-indexed internal
    pageSize: initialPageSize,
    search: initialUrlParams.search || '',
    filters: { ...initialUrlParams.filters },
    total: 0,
    totalPages: 1,
  };

  const getDisplayPage = () => state.page + 1;

  const setSearch = (text) => {
    state.search = text;
    // Search change resets page to 0
    state.page = 0;
  };

  const setFilter = (key, val) => {
    state.filters[key] = val;
    // Filter change resets page to 0
    state.page = 0;
  };

  const setPage = (newPage) => {
    state.page = Math.max(0, newPage);
  };

  const setTotalElements = (total) => {
    state.total = total;
    state.totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    // Auto-clamping when total shrinks
    if (state.totalPages > 0 && state.page >= state.totalPages) {
      state.page = Math.max(0, state.totalPages - 1);
    }
  };

  return {
    getState: () => ({ ...state, displayPage: getDisplayPage() }),
    setSearch,
    setFilter,
    setPage,
    setTotalElements,
  };
}

describe('useListQuery Unit Tests', () => {
  describe('1. URL Parse & Clamp', () => {
    it('parses 1-indexed URL page to 0-indexed internal page', () => {
      const manager = createListQueryManager({ page: '3', pageSize: '20' });
      const state = manager.getState();
      assert.equal(state.page, 2, 'Internal page should be 0-indexed (page - 1)');
      assert.equal(state.displayPage, 3, 'Display page should be 1-indexed');
      assert.equal(state.pageSize, 20);
    });

    it('clamps negative or zero page values from URL to page 1 (internal index 0)', () => {
      const managerNegative = createListQueryManager({ page: '-5' });
      assert.equal(managerNegative.getState().page, 0);
      assert.equal(managerNegative.getState().displayPage, 1);

      const managerZero = createListQueryManager({ page: '0' });
      assert.equal(managerZero.getState().page, 0);
      assert.equal(managerZero.getState().displayPage, 1);

      const managerInvalid = createListQueryManager({ page: 'invalid' });
      assert.equal(managerInvalid.getState().page, 0);
    });
  });

  describe('2. Page Reset on Filter / Search Change', () => {
    it('resets page to 0 when search term changes', () => {
      const manager = createListQueryManager({ page: '4' });
      manager.setTotalElements(100);
      assert.equal(manager.getState().page, 3);

      manager.setSearch('Acme Corp');
      assert.equal(manager.getState().page, 0, 'Page must reset to 0 upon search input');
      assert.equal(manager.getState().displayPage, 1);
    });

    it('resets page to 0 when filter changes', () => {
      const manager = createListQueryManager({ page: '5' });
      manager.setTotalElements(100);
      assert.equal(manager.getState().page, 4);

      manager.setFilter('status', 'ACTIVE');
      assert.equal(manager.getState().page, 0, 'Page must reset to 0 upon filter mutation');
      assert.equal(manager.getState().displayPage, 1);
    });
  });

  describe('3. Page Clamp When Total Shrinks', () => {
    it('gracefully decrements page when record count shrinks below current page', () => {
      const manager = createListQueryManager({ page: '1' });
      // Initially 100 items with pageSize 10 -> 10 pages (0 to 9)
      manager.setTotalElements(100);
      manager.setPage(8); // currently on page 9
      assert.equal(manager.getState().page, 8);

      // Now total elements shrinks to 25 items -> 3 pages (indices 0, 1, 2)
      manager.setTotalElements(25);
      assert.equal(manager.getState().totalPages, 3);
      assert.equal(manager.getState().page, 2, 'Page should clamp to last available page (totalPages - 1)');
      assert.equal(manager.getState().displayPage, 3);
    });

    it('clamps to page 0 if total elements drops to 0', () => {
      const manager = createListQueryManager({ page: '5' });
      manager.setTotalElements(100);
      manager.setPage(4);

      manager.setTotalElements(0);
      assert.equal(manager.getState().totalPages, 1);
      assert.equal(manager.getState().page, 0);
    });
  });
});
