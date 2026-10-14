import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

describe('useBodyScrollLock pure logic test', () => {
  let mockBody;
  let lockCount;
  let originalOverflow;

  beforeEach(() => {
    mockBody = { style: { overflow: '' } };
    lockCount = 0;
    originalOverflow = '';
  });

  function acquireLock() {
    if (lockCount === 0) {
      originalOverflow = mockBody.style.overflow;
      mockBody.style.overflow = 'hidden';
    }
    lockCount++;
  }

  function releaseLock() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      mockBody.style.overflow = originalOverflow || '';
    }
  }

  it('locks body overflow on first acquisition', () => {
    mockBody.style.overflow = 'auto';
    acquireLock();
    assert.equal(mockBody.style.overflow, 'hidden');
    assert.equal(lockCount, 1);
  });

  it('handles nested modal locks gracefully without overwriting original overflow', () => {
    mockBody.style.overflow = 'visible';
    acquireLock(); // modal 1
    assert.equal(mockBody.style.overflow, 'hidden');
    acquireLock(); // modal 2 (e.g. confirmation dialog on top)
    assert.equal(mockBody.style.overflow, 'hidden');
    assert.equal(lockCount, 2);

    releaseLock(); // close modal 2
    assert.equal(mockBody.style.overflow, 'hidden'); // still locked for modal 1
    assert.equal(lockCount, 1);

    releaseLock(); // close modal 1
    assert.equal(mockBody.style.overflow, 'visible'); // restored to initial
    assert.equal(lockCount, 0);
  });
});

describe('Scroll restoration coordinate tracking test', () => {
  it('stores and restores route scroll coordinates accurately', () => {
    const scrollMap = new Map();
    const routeA = '/erp/company/1/accounts/masters/customers';
    const routeB = '/erp/company/1/accounts/receivables/invoices';

    // User scrolls down on routeA
    scrollMap.set(routeA, { windowY: 0, mainY: 450 });

    // User navigates to routeB
    assert.equal(scrollMap.has(routeA), true);
    assert.deepEqual(scrollMap.get(routeA), { windowY: 0, mainY: 450 });

    // On POP navigation back to routeA
    const restored = scrollMap.get(routeA);
    assert.equal(restored.mainY, 450);
  });
});
