import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { attachRequestInterceptor } from '../interceptors.js';
import {
  setModuleRefreshPromise,
  getModuleRefreshPromise,
  isModuleRefreshing,
  enqueue,
  processQueue,
  clearAllQueues,
} from '../refreshQueue.js';

describe('Organization Appearance Outgoing Request & Interceptor Verification', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    globalThis.localStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
    };
    clearAllQueues();
  });

  it('1. Outgoing appearance request attaches valid Bearer token and X-Organization-Id', async () => {
    const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYXJzaG9tb2hpdDFAZ21haWwuY29tIn0.mock';
    const testOrgId = 'f997d7d6-366b-4af7-a9f6-93e699a3f87c';

    mockStorage['ACCESS_TOKEN'] = testToken;
    mockStorage['active_organization_id'] = testOrgId;

    const testInstance = axios.create();
    attachRequestInterceptor(testInstance);

    // Simulate outgoing request config
    const config = {
      url: `/api/sso/organization/appearance?organizationId=${testOrgId}`,
      method: 'GET',
      headers: new axios.AxiosHeaders(),
    };

    // Run the request interceptor
    const [interceptor] = testInstance.interceptors.request.handlers;
    const transformedConfig = await interceptor.fulfilled(config);

    // 1. Verify Authorization header is present and format is valid
    const authHeader = transformedConfig.headers.get('Authorization');
    assert.ok(authHeader, 'Authorization header must be present');
    assert.equal(authHeader, `Bearer ${testToken}`);
    assert.ok(!authHeader.includes('Bearer Bearer'), 'No duplicate Bearer prefix');

    // 2. Verify X-Organization-Id is set
    const orgHeader = transformedConfig.headers.get('X-Organization-Id');
    assert.equal(orgHeader, testOrgId, 'X-Organization-Id header must match target organization');

    // 3. Verify organizationId query param is present
    assert.ok(transformedConfig.url.includes(`organizationId=${testOrgId}`));
  });

  it('replaces inherited stale credentials and matches the organization header to the requested organization', async () => {
    const activeOrgId = 'active-org-id';
    const requestedOrgId = 'requested-org-id';
    mockStorage['ACCESS_TOKEN'] = 'current-access-token';
    mockStorage['active_organization_id'] = activeOrgId;

    const outgoingRequests = [];
    const testInstance = axios.create({
      adapter: async (config) => {
        outgoingRequests.push(config);
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: new axios.AxiosHeaders(),
          config,
          request: {},
        };
      },
    });
    testInstance.defaults.headers.common.Authorization = 'Bearer stale-default-token';
    testInstance.defaults.headers.common['X-Organization-Id'] = activeOrgId;
    attachRequestInterceptor(testInstance);

    const urls = [
      `/api/sso/organization/appearance?organizationId=${requestedOrgId}`,
      `/api/sso/organization/companies?organizationId=${requestedOrgId}`,
      `/api/sso/organization/subscription?organizationId=${requestedOrgId}`,
    ];
    for (const url of urls) {
      await testInstance.get(url);
    }

    assert.equal(outgoingRequests.length, urls.length);
    for (const { headers, params } of outgoingRequests) {
      assert.equal(headers.get('Authorization'), 'Bearer current-access-token');
      assert.equal(headers.get('X-Organization-Id'), requestedOrgId);
      assert.equal(params.organizationId, requestedOrgId);
    }

  });

  it('2. Concurrent appearance, companies, and subscription requests share single refresh operation', async () => {
    const moduleName = 'sso';
    assert.equal(isModuleRefreshing(moduleName), false);

    let refreshExecutionCount = 0;
    let finishRefresh;
    const refreshPromise = new Promise((resolve) => {
      refreshExecutionCount++;
      finishRefresh = resolve;
    });

    setModuleRefreshPromise(moduleName, refreshPromise);
    assert.equal(isModuleRefreshing(moduleName), true);

    // 3 parallel requests queue up
    const req1 = enqueue(moduleName); // appearance
    const req2 = enqueue(moduleName); // companies
    const req3 = enqueue(moduleName); // subscription

    // Exactly 1 refresh running
    assert.equal(refreshExecutionCount, 1);

    // Finish refresh with fresh token
    const freshToken = 'fresh-token-xyz-987';
    finishRefresh(freshToken);
    processQueue(moduleName, null, freshToken);

    const [t1, t2, t3] = await Promise.all([req1, req2, req3]);

    assert.equal(t1, freshToken);
    assert.equal(t2, freshToken);
    assert.equal(t3, freshToken);

    // Verify queue is empty and module is no longer refreshing
    assert.equal(isModuleRefreshing(moduleName), false);
    assert.equal(getModuleRefreshPromise(moduleName), null);
  });

  it('3. Refresh failure rejects all queued requests without leaving any in pending state', async () => {
    const moduleName = 'sso';
    let failRefresh;
    const refreshPromise = new Promise((_, reject) => {
      failRefresh = reject;
    });

    setModuleRefreshPromise(moduleName, refreshPromise);

    const req1 = enqueue(moduleName);
    const req2 = enqueue(moduleName);

    const refreshError = new Error('Session expired');
    failRefresh(refreshError);
    processQueue(moduleName, refreshError);

    await assert.rejects(req1, { message: 'Session expired' });
    await assert.rejects(req2, { message: 'Session expired' });

    assert.equal(isModuleRefreshing(moduleName), false);
  });
});
