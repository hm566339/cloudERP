import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isModuleRefreshing,
  setRefreshing,
  setModuleRefreshPromise,
  getModuleRefreshPromise,
  enqueue,
  processQueue,
  clearAllQueues,
} from '../refreshQueue.js';

describe('RefreshQueue Single-Flight Promise Sharing Test Suite', () => {
  it('shares single active promise among multiple concurrent requests without hanging', async () => {
    clearAllQueues();

    const moduleName = 'TEST_SSO';
    assert.equal(isModuleRefreshing(moduleName), false);

    // Create an in-flight refresh promise
    let resolveRefresh;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    setModuleRefreshPromise(moduleName, refreshPromise);
    assert.equal(isModuleRefreshing(moduleName), true);

    // 3 concurrent requests arrive and enqueue
    const p1 = enqueue(moduleName);
    const p2 = enqueue(moduleName);
    const p3 = enqueue(moduleName);

    // Resolve refresh with new token
    resolveRefresh('fresh-token-12345');
    setRefreshing(moduleName, false);
    processQueue(moduleName, null, 'fresh-token-12345');

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);

    assert.equal(t1, 'fresh-token-12345');
    assert.equal(t2, 'fresh-token-12345');
    assert.equal(t3, 'fresh-token-12345');

    // Confirm module is no longer refreshing and ready for immediate retry
    assert.equal(isModuleRefreshing(moduleName), false);
    assert.equal(getModuleRefreshPromise(moduleName), null);

    clearAllQueues();
  });

  it('rejects all queued requests cleanly if refresh fails', async () => {
    clearAllQueues();

    const moduleName = 'TEST_SSO_FAIL';
    let rejectRefresh;
    const refreshPromise = new Promise((_, reject) => {
      rejectRefresh = reject;
    });

    setModuleRefreshPromise(moduleName, refreshPromise);

    const p1 = enqueue(moduleName);
    const p2 = enqueue(moduleName);

    const error = new Error('Token refresh failed');
    rejectRefresh(error);
    processQueue(moduleName, error);

    await assert.rejects(p1, { message: 'Token refresh failed' });
    await assert.rejects(p2, { message: 'Token refresh failed' });

    assert.equal(isModuleRefreshing(moduleName), false);
    clearAllQueues();
  });
});

