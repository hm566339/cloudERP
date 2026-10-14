import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEndpointContract,
  normalizeRequestParams,
  unwrapResponseByContract,
  ENDPOINT_CONTRACT_MAP,
} from '../baseApi.js';

describe('Table-Driven Endpoint Contract & BaseApi Mapper Tests', () => {
  it('correctly matches endpoint contracts by prefix', () => {
    assert.equal(getEndpointContract('/api/sso/company').domainKey, 'companies');
    assert.equal(getEndpointContract('/api/sso/company').pageBase, 1);
    assert.equal(getEndpointContract('/api/sso/company').sizeParam, 'pageSize');

    assert.equal(getEndpointContract('/api/sso/user/company/123').domainKey, 'users');
    assert.equal(getEndpointContract('/api/sso/user/company/123').pageBase, 0);

    assert.equal(getEndpointContract('/api/sso/role').domainKey, 'roles');
    assert.equal(getEndpointContract('/api/sso/admin/organizations').responseShape, 'SPRING_PAGE');

    assert.equal(getEndpointContract('/api/account/customers').sizeParam, 'size');
    assert.equal(getEndpointContract('/api/account/customers').pageBase, 0);

    assert.equal(getEndpointContract('/api/inventory/products').sizeParam, 'size');
    assert.equal(getEndpointContract('/api/v1/workflow/definitions').responseShape, 'SPRING_PAGE');
  });

  describe('normalizeRequestParams', () => {
    it('normalizes pageSize to size for Spring Data endpoints', () => {
      const result = normalizeRequestParams('/api/account/customers', { page: 0, pageSize: 25, search: 'abc' });
      assert.equal(result.size, 25);
      assert.equal(result.pageSize, undefined);
      assert.equal(result.page, 0);
      assert.equal(result.search, 'abc');
    });

    it('normalizes size to pageSize for SSO user endpoints', () => {
      const result = normalizeRequestParams('/api/sso/user/company/123', { page: 0, size: 50 });
      assert.equal(result.pageSize, 50);
      assert.equal(result.size, undefined);
    });

    it('clamps 0-based page to 1-based for /api/sso/company', () => {
      const result = normalizeRequestParams('/api/sso/company', { page: 0, pageSize: 10 });
      assert.equal(result.page, 1);
      assert.equal(result.pageSize, 10);
    });
  });

  describe('unwrapResponseByContract for each response shape', () => {
    it('1. Shape: SPRING_PAGE direct content', () => {
      const raw = {
        content: [{ id: 'org-1', name: 'Org 1' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      };
      const res = unwrapResponseByContract('/api/sso/admin/organizations', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res.length, 1);
      assert.equal(res[0].name, 'Org 1');
      assert.deepEqual(res._pageInfo, {
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      });
    });

    it('2. Shape: SPRING_PAGE inside ApiResponse wrapper', () => {
      const raw = {
        success: true,
        message: 'Success',
        data: {
          content: [{ id: 'wf-1', name: 'WF 1' }],
          totalElements: 42,
          totalPages: 5,
          number: 0,
          size: 10,
        },
      };
      const res = unwrapResponseByContract('/api/v1/workflow/definitions', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res[0].id, 'wf-1');
      assert.equal(res._pageInfo.totalElements, 42);
      assert.equal(res._pageInfo.totalPages, 5);
    });

    it('3. Shape: SSO_DOMAIN_PAGINATION for companies', () => {
      const raw = {
        success: true,
        data: {
          companies: [{ id: 'c-1', name: 'Acme Corp' }],
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 3,
            totalCount: 25,
          },
        },
      };
      const res = unwrapResponseByContract('/api/sso/company', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res[0].name, 'Acme Corp');
      assert.equal(res._pageInfo.totalElements, 25);
      assert.equal(res._pageInfo.page, 1);
      assert.equal(res._pageInfo.totalPages, 3);
    });

    it('4. Shape: SSO_DOMAIN_PAGINATION for users', () => {
      const raw = {
        success: true,
        data: {
          users: [{ id: 'u-1', username: 'admin' }],
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 2,
            totalCount: 15,
          },
        },
      };
      const res = unwrapResponseByContract('/api/sso/user/company/123', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res[0].username, 'admin');
      assert.equal(res._pageInfo.totalElements, 15);
    });

    it('5. Shape: SSO_DOMAIN_PAGINATION for roles', () => {
      const raw = {
        success: true,
        data: {
          roles: [{ id: 'r-1', name: 'ACCOUNTANT' }],
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,
            totalCount: 4,
          },
        },
      };
      const res = unwrapResponseByContract('/api/sso/role', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res[0].name, 'ACCOUNTANT');
      assert.equal(res._pageInfo.totalElements, 4);
    });

    it('6. Shape: API_PAGINATED (ApiResponse with data array and pagination envelope)', () => {
      const raw = {
        success: true,
        message: 'Customers retrieved successfully',
        data: [{ id: 'cust-1', customerName: 'Client A' }],
        pagination: {
          page: 1,
          size: 10,
          totalElements: 88,
          totalPages: 9,
          hasNext: true,
        },
      };
      const res = unwrapResponseByContract('/api/account/customers', raw);
      assert.ok(Array.isArray(res));
      assert.equal(res[0].customerName, 'Client A');
      assert.equal(res._pageInfo.totalElements, 88);
      assert.equal(res._pageInfo.totalPages, 9);
    });

    it('7. Shape: Non-list entity details object preserved intact', () => {
      const raw = {
        success: true,
        data: {
          id: 'cust-1',
          customerName: 'Client A',
          addresses: [{ street: '123 Main' }],
        },
      };
      const res = unwrapResponseByContract('/api/account/customers/cust-1', raw);
      assert.equal(typeof res, 'object');
      assert.equal(Array.isArray(res), false);
      assert.equal(res.id, 'cust-1');
      assert.equal(res.customerName, 'Client A');
    });
  });
});
