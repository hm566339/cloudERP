import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Queue and Single-Flight Refresh Coordinator mirroring interceptors.js
 */
class SingleFlightRefreshCoordinator {
  constructor(refreshFn) {
    this.refreshFn = refreshFn;
    this.isRefreshing = false;
    this.refreshQueue = [];
    this.refreshCallCount = 0;
  }

  async handle401Request(requestId, requestFn) {
    // If refresh is already in progress, enqueue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ requestId, requestFn, resolve, reject });
      });
    }

    // Initiate single flight refresh
    this.isRefreshing = true;
    this.refreshCallCount++;

    try {
      const newToken = await this.refreshFn();
      this.isRefreshing = false;

      // Drain queue
      const queueToDrain = [...this.refreshQueue];
      this.refreshQueue = [];

      for (const item of queueToDrain) {
        try {
          const res = await item.requestFn(newToken);
          item.resolve(res);
        } catch (err) {
          item.reject(err);
        }
      }

      // Retry the initiator request
      return await requestFn(newToken);
    } catch (error) {
      this.isRefreshing = false;
      const queueToReject = [...this.refreshQueue];
      this.refreshQueue = [];
      queueToReject.forEach((item) => item.reject(error));
      throw error;
    }
  }
}

describe('401 Single-Flight Token Refresh Test Suite', () => {
  it('deduplicates 5 concurrent 401 responses into exactly 1 refresh call', async () => {
    let rawRefreshHttpCalls = 0;

    // Simulated refresh endpoint with a small network delay
    const mockRefreshApi = async () => {
      rawRefreshHttpCalls++;
      await new Promise((r) => setTimeout(r, 40));
      return 'new-access-token-xyz';
    };

    const coordinator = new SingleFlightRefreshCoordinator(mockRefreshApi);

    // Track request retries
    const retriedResults = [];

    const makeFailingRequest = async (id) => {
      // Step 1: Request fails with 401, entering the single-flight handler
      return coordinator.handle401Request(id, async (token) => {
        // Step 2: Retry with fresh token
        assert.equal(token, 'new-access-token-xyz');
        const res = { id, status: 200, retriedWith: token };
        retriedResults.push(res);
        return res;
      });
    };

    // Fire 5 concurrent requests that simultaneously receive 401
    const p1 = makeFailingRequest('req-1');
    const p2 = makeFailingRequest('req-2');
    const p3 = makeFailingRequest('req-3');
    const p4 = makeFailingRequest('req-4');
    const p5 = makeFailingRequest('req-5');

    const results = await Promise.all([p1, p2, p3, p4, p5]);

    // Assert exactly 1 refresh call occurred
    assert.equal(rawRefreshHttpCalls, 1, 'Only 1 refresh HTTP call must be dispatched for 5 concurrent 401s');
    assert.equal(coordinator.refreshCallCount, 1);

    // Assert all 5 requests successfully received their retried responses
    assert.equal(results.length, 5);
    for (const res of results) {
      assert.equal(res.status, 200);
      assert.equal(res.retriedWith, 'new-access-token-xyz');
    }
  });

  it('correctly rejects all queued requests if the single refresh call fails', async () => {
    let rawRefreshHttpCalls = 0;

    const mockFailingRefreshApi = async () => {
      rawRefreshHttpCalls++;
      await new Promise((r) => setTimeout(r, 30));
      throw new Error('Refresh token expired');
    };

    const coordinator = new SingleFlightRefreshCoordinator(mockFailingRefreshApi);

    const makeFailingRequest = async (id) => {
      return coordinator.handle401Request(id, async () => {
        return { id, status: 200 };
      });
    };

    const promises = [
      makeFailingRequest('req-1'),
      makeFailingRequest('req-2'),
      makeFailingRequest('req-3'),
      makeFailingRequest('req-4'),
      makeFailingRequest('req-5'),
    ];

    const settled = await Promise.allSettled(promises);

    assert.equal(rawRefreshHttpCalls, 1, 'Only 1 refresh call dispatched even on failure');
    for (const s of settled) {
      assert.equal(s.status, 'rejected');
      assert.equal(s.reason.message, 'Refresh token expired');
    }
  });
});
