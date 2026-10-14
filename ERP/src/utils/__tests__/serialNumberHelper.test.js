import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSerialNumber, getSerialNumberRange } from '../serialNumberHelper.js';

describe('serialNumberHelper', () => {
  describe('0-based pagination (Spring Boot default)', () => {
    it('calculates page 0 serial numbers correctly across different page sizes', () => {
      [5, 10, 20, 50].forEach((pageSize) => {
        assert.equal(getSerialNumber({ page: 0, pageSize, rowIndex: 0, pageBase: 0 }), 1);
        assert.equal(getSerialNumber({ page: 0, pageSize, rowIndex: 4, pageBase: 0 }), 5);
      });
    });

    it('calculates page 1 serial numbers correctly across different page sizes', () => {
      assert.equal(getSerialNumber({ page: 1, pageSize: 5, rowIndex: 0, pageBase: 0 }), 6);
      assert.equal(getSerialNumber({ page: 1, pageSize: 10, rowIndex: 0, pageBase: 0 }), 11);
      assert.equal(getSerialNumber({ page: 1, pageSize: 20, rowIndex: 0, pageBase: 0 }), 21);
      assert.equal(getSerialNumber({ page: 1, pageSize: 50, rowIndex: 0, pageBase: 0 }), 51);
    });

    it('calculates page 2 serial numbers correctly across different page sizes', () => {
      assert.equal(getSerialNumber({ page: 2, pageSize: 5, rowIndex: 0, pageBase: 0 }), 11);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 0, pageBase: 0 }), 21);
      assert.equal(getSerialNumber({ page: 2, pageSize: 20, rowIndex: 0, pageBase: 0 }), 41);
      assert.equal(getSerialNumber({ page: 2, pageSize: 50, rowIndex: 0, pageBase: 0 }), 101);
    });
  });

  describe('1-based pagination (SSO / UI default)', () => {
    it('calculates page 1 serial numbers starting at 1', () => {
      [5, 10, 20, 50].forEach((pageSize) => {
        assert.equal(getSerialNumber({ page: 1, pageSize, rowIndex: 0, pageBase: 1 }), 1);
        assert.equal(getSerialNumber({ page: 1, pageSize, rowIndex: 3, pageBase: 1 }), 4);
      });
    });

    it('calculates page 2 serial numbers correctly', () => {
      assert.equal(getSerialNumber({ page: 2, pageSize: 5, rowIndex: 0, pageBase: 1 }), 6);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 0, pageBase: 1 }), 11);
      assert.equal(getSerialNumber({ page: 2, pageSize: 20, rowIndex: 0, pageBase: 1 }), 21);
      assert.equal(getSerialNumber({ page: 2, pageSize: 50, rowIndex: 0, pageBase: 1 }), 51);
    });

    it('calculates page 3 serial numbers correctly', () => {
      assert.equal(getSerialNumber({ page: 3, pageSize: 10, rowIndex: 0, pageBase: 1 }), 21);
      assert.equal(getSerialNumber({ page: 3, pageSize: 10, rowIndex: 9, pageBase: 1 }), 30);
    });
  });

  describe('Edge cases, guards, and defensive fallbacks', () => {
    it('returns empty string for missing or invalid rowIndex', () => {
      assert.equal(getSerialNumber({ page: 0, pageSize: 10 }), '');
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: undefined }), '');
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: null }), '');
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: -1 }), '');
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: NaN }), '');
    });

    it('defaults page size to 10 if missing or invalid', () => {
      assert.equal(getSerialNumber({ page: 1, pageSize: undefined, rowIndex: 0, pageBase: 0 }), 11);
      assert.equal(getSerialNumber({ page: 1, pageSize: 0, rowIndex: 0, pageBase: 0 }), 11); // 0 is invalid page size, falls back to 10
      assert.equal(getSerialNumber({ page: 1, pageSize: 'invalid', rowIndex: 0, pageBase: 0 }), 11);
    });

    it('defaults page to base default if missing or invalid', () => {
      assert.equal(getSerialNumber({ page: undefined, pageSize: 10, rowIndex: 0, pageBase: 0 }), 1);
      assert.equal(getSerialNumber({ page: undefined, pageSize: 10, rowIndex: 0, pageBase: 1 }), 1);
      assert.equal(getSerialNumber({ page: 'abc', pageSize: 10, rowIndex: 0, pageBase: 0 }), 1);
    });

    it('accepts string representations of numbers gracefully', () => {
      assert.equal(getSerialNumber({ page: '2', pageSize: '15', rowIndex: '4', pageBase: '0' }), 35);
    });
  });

  describe('Cursor and load-more pagination (explicit offset)', () => {
    it('uses offset if provided', () => {
      assert.equal(getSerialNumber({ offset: 0, rowIndex: 0 }), 1);
      assert.equal(getSerialNumber({ offset: 50, rowIndex: 0 }), 51);
      assert.equal(getSerialNumber({ offset: 50, rowIndex: 5 }), 56);
    });
  });

  describe('Range calculation ("Showing from to to of total")', () => {
    it('returns 0 range for empty total', () => {
      assert.deepEqual(getSerialNumberRange({ page: 0, pageSize: 10, total: 0, pageBase: 0 }), {
        from: 0,
        to: 0,
        total: 0,
      });
    });

    it('first and last row serial match range from and to on 0-based page 0', () => {
      const range = getSerialNumberRange({ page: 0, pageSize: 10, total: 25, pageBase: 0 });
      assert.equal(range.from, 1);
      assert.equal(range.to, 10);
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: 0, pageBase: 0 }), range.from);
      assert.equal(getSerialNumber({ page: 0, pageSize: 10, rowIndex: 9, pageBase: 0 }), range.to);
    });

    it('first and last row serial match range from and to on 0-based page 2 (last page)', () => {
      const range = getSerialNumberRange({ page: 2, pageSize: 10, total: 25, pageBase: 0 });
      assert.equal(range.from, 21);
      assert.equal(range.to, 25);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 0, pageBase: 0 }), range.from);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 4, pageBase: 0 }), range.to);
    });

    it('first and last row serial match range from and to on 1-based page 2', () => {
      const range = getSerialNumberRange({ page: 2, pageSize: 10, total: 25, pageBase: 1 });
      assert.equal(range.from, 11);
      assert.equal(range.to, 20);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 0, pageBase: 1 }), range.from);
      assert.equal(getSerialNumber({ page: 2, pageSize: 10, rowIndex: 9, pageBase: 1 }), range.to);
    });
  });
});
