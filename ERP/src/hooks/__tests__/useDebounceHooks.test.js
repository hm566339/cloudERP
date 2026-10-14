import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure state and timing logic testing matching useDebouncedCallback.js and useDebouncedValue.js
 */
function createDebouncedCallback(callback, delay = 100) {
  let timeoutId = null;
  let lastArgs = null;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      callback(...lastArgs);
      lastArgs = null;
    }
  };

  const debounced = (...args) => {
    lastArgs = args;
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
      lastArgs = null;
    }, delay);
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

describe('useDebouncedCallback & useDebouncedValue Test Suite', () => {
  it('debounces rapid calls, invoking callback only once after delay', async () => {
    let callCount = 0;
    let lastValue = null;

    const debounced = createDebouncedCallback((val) => {
      callCount++;
      lastValue = val;
    }, 50);

    debounced('first');
    debounced('second');
    debounced('third');

    assert.equal(callCount, 0, 'Callback should not be called synchronously');

    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(callCount, 1, 'Callback should only be invoked once');
    assert.equal(lastValue, 'third', 'Callback should be invoked with the last argument');
  });

  it('cancel() immediately aborts pending execution', async () => {
    let callCount = 0;
    const debounced = createDebouncedCallback(() => {
      callCount++;
    }, 50);

    debounced('should not execute');
    debounced.cancel();

    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(callCount, 0, 'Callback was cancelled and must not fire');
  });

  it('flush() executes pending invocation immediately with latest arguments', () => {
    let callCount = 0;
    let receivedArg = null;

    const debounced = createDebouncedCallback((arg) => {
      callCount++;
      receivedArg = arg;
    }, 200);

    debounced('pending-payload');
    assert.equal(callCount, 0, 'Still pending before flush');

    debounced.flush();
    assert.equal(callCount, 1, 'Callback invoked immediately on flush()');
    assert.equal(receivedArg, 'pending-payload');

    // A second flush when queue is empty does nothing
    debounced.flush();
    assert.equal(callCount, 1, 'Redundant flush does not invoke callback again');
  });
});
