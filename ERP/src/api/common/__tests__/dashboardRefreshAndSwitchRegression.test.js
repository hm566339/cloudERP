import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { attachInterceptors } from '../interceptors.js';
import {
  clearAllQueues,
  isModuleRefreshing,
  getModuleRefreshPromise,
} from '../refreshQueue.js';
import { applySwitchedAuthTokens } from '../../../features/account/utils/switchTenantTokens.js';

function createDomMocks() {
  const storage = new Map();
  let cookieJar = [];

  global.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };

  global.document = {
    get cookie() {
      return cookieJar.join('; ');
    },
    set cookie(val) {
      const [kv] = val.split(';');
      const eqIdx = kv.indexOf('=');
      const name = kv.slice(0, eqIdx).trim();
      const value = kv.slice(eqIdx + 1).trim();
      cookieJar = cookieJar.filter((c) => !c.startsWith(`${name}=`));
      if (val.includes('max-age=0')) return;
      cookieJar.push(`${name}=${value}`);
    },
  };

  global.window = {
    location: { protocol: 'http:', hostname: 'localhost', pathname: '/dashboard' },
    __REDUX_STORE__: {
      getState: () => ({
        auth: {
          sessionStatus: 'authenticated',
          user: { id: 'user-1', role: 'Accountant' },
        },
      }),
    },
  };
}

describe('Dashboard 401 Cross-Module Refresh, No-Loop & Switch-Company Token Regression Suite', () => {
  const originalPost = axios.post;

  beforeEach(() => {
    clearAllQueues();
    createDomMocks();
    localStorage.setItem('ACCESS_TOKEN', 'expired-token-1');
    localStorage.setItem('ACCESS_TOKEN_REFRESH', 'refresh-token-1');
    document.cookie = 'ACCESS_TOKEN=expired-token-1; path=/';
    document.cookie = 'ACCESS_TOKEN_REFRESH=refresh-token-1; path=/';
  });

  afterEach(() => {
    axios.post = originalPost;
    clearAllQueues();
  });

  it('deduplicates concurrent cross-module 401s (SSO + Account dashboard + Company) into ONE refresh request', async () => {
    let refreshCount = 0;

    axios.post = async (url, body) => {
      assert.equal(url, '/api/sso/token/refresh');
      assert.equal(body.refreshToken, 'refresh-token-1');
      refreshCount += 1;
      await new Promise((r) => setTimeout(r, 20));
      return {
        status: 200,
        data: {
          data: {
            accessToken: 'fresh-access-token-2',
            refreshToken: 'fresh-refresh-token-2',
          },
        },
      };
    };

    let authHeaderOnRetry = [];
    const client = axios.create({ baseURL: '' });
    client.defaults.adapter = async (config) => {
      const authHeader = config.headers?.Authorization || config.headers?.authorization;
      if (authHeader === 'Bearer fresh-access-token-2') {
        authHeaderOnRetry.push(config.url);
        return {
          status: 200,
          data: { ok: true, url: config.url },
          headers: {},
          config,
          request: {},
        };
      }
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { message: 'Token expired' }, config };
      throw err;
    };

    attachInterceptors(client);

    const [meRes, compRes, dashRes] = await Promise.all([
      client.get('/api/sso/auth/me'),
      client.get('/api/sso/company'),
      client.get('/api/account/dashboard'),
    ]);

    assert.equal(refreshCount, 1);
    assert.equal(meRes.status, 200);
    assert.equal(compRes.status, 200);
    assert.equal(dashRes.status, 200);
    assert.equal(authHeaderOnRetry.length, 3);
    assert.equal(localStorage.getItem('ACCESS_TOKEN'), 'fresh-access-token-2');
    assert.equal(localStorage.getItem('ACCESS_TOKEN_REFRESH'), 'fresh-refresh-token-2');
    assert.equal(isModuleRefreshing('sso'), false);
    assert.equal(isModuleRefreshing('account'), false);
    assert.equal(getModuleRefreshPromise('sso'), null);
  });

  it('dashboard 403 or persistent post-refresh 401 never enters an infinite refresh loop', async () => {
    let refreshCount = 0;
    let adapterCalls = 0;

    axios.post = async () => {
      refreshCount += 1;
      return {
        status: 200,
        data: { data: { accessToken: 'fresh-access-token-3', refreshToken: 'fresh-refresh-token-3' } },
      };
    };

    const client = axios.create({ baseURL: '' });
    client.defaults.adapter = async (config) => {
      adapterCalls += 1;
      if (config.url === '/api/account/dashboard-403') {
        const err = new Error('Forbidden');
        err.config = config;
        err.response = { status: 403, data: { message: 'Forbidden' }, config };
        throw err;
      }
      const err = new Error('Still Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { message: 'Unauthorized' }, config };
      throw err;
    };

    attachInterceptors(client);

    // 403 never triggers refresh
    await assert.rejects(() => client.get('/api/account/dashboard-403'));
    assert.equal(refreshCount, 0);
    assert.equal(adapterCalls, 1);

    // Persistent 401 refreshes once, retries once, and rejects cleanly
    adapterCalls = 0;
    await assert.rejects(() => client.get('/api/account/dashboard'));
    assert.equal(refreshCount, 1);
    assert.equal(adapterCalls, 2);
  });

  it('refresh endpoint itself returning 401 or missing new access token fails cleanly with zero pending promises', async () => {
    let refreshCalls = 0;

    axios.post = async () => {
      refreshCalls += 1;
      // Missing accessToken in non-admin SSO refresh must NOT fall back to old expired token
      return { status: 200, data: { data: {} } };
    };

    const client = axios.create({ baseURL: '' });
    client.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: { message: 'Unauthorized' }, config };
      throw err;
    };

    attachInterceptors(client);

    const p1 = client.get('/api/sso/auth/me');
    const p2 = client.get('/api/account/dashboard');

    await assert.rejects(p1);
    await assert.rejects(p2);
    assert.equal(refreshCalls, 1);
    assert.equal(isModuleRefreshing('sso'), false);
    assert.equal(getModuleRefreshPromise('sso'), null);

    // Calling refresh endpoint directly on client does not re-trigger refresh
    await assert.rejects(() => client.post('/api/sso/token/refresh', {}));
    assert.equal(refreshCalls, 1);
  });

  it('failed HTTP refresh (401) rejects all queued concurrent requests cleanly with no hanging promise', async () => {
    axios.post = async () => {
      const err = new Error('Refresh expired');
      err.response = { status: 401, data: { message: 'Expired' } };
      throw err;
    };

    const client = axios.create({ baseURL: '' });
    client.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized');
      err.config = config;
      err.response = { status: 401, data: {}, config };
      throw err;
    };

    attachInterceptors(client);

    const results = await Promise.allSettled([
      client.get('/api/sso/auth/me'),
      client.get('/api/account/dashboard'),
    ]);

    assert.equal(results[0].status, 'rejected');
    assert.equal(results[1].status, 'rejected');
    assert.equal(isModuleRefreshing('sso'), false);
    assert.equal(getModuleRefreshPromise('sso'), null);
  });

  it('applySwitchedAuthTokens stores new access & refresh tokens, clears stale keys, and syncs default headers', () => {
    const fakeClient = { defaults: { headers: { common: { Authorization: 'Bearer old-jwt' } } } };
    localStorage.setItem('auth_token', 'stale-auth');
    localStorage.setItem('refreshToken', 'stale-refresh');

    const result = applySwitchedAuthTokens(
      {
        accessToken: 'switched-jwt-99',
        refreshToken: 'switched-refresh-99',
      },
      fakeClient,
    );

    assert.equal(result.newToken, 'switched-jwt-99');
    assert.equal(result.newRefreshToken, 'switched-refresh-99');
    assert.equal(localStorage.getItem('ACCESS_TOKEN'), 'switched-jwt-99');
    assert.equal(localStorage.getItem('ACCESS_TOKEN_REFRESH'), 'switched-refresh-99');
    assert.equal(localStorage.getItem('auth_token'), null);
    assert.equal(localStorage.getItem('refreshToken'), null);
    assert.equal(fakeClient.defaults.headers.common.Authorization, 'Bearer switched-jwt-99');
    assert.equal(fakeClient.defaults.headers.common.authorization, 'Bearer switched-jwt-99');
    assert.ok(document.cookie.includes('ACCESS_TOKEN=switched-jwt-99'));
    assert.ok(document.cookie.includes('ACCESS_TOKEN_REFRESH=switched-refresh-99'));
  });
});

