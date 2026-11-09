import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getCookie, setCookie, removeCookie, clearLegacyAuthCookies } from '../../../utils/cookieHelper.js';
import { attachRequestInterceptor } from '../interceptors.js';
import axios from 'axios';

describe('Canonical Cookie Storage & Legacy Token Elimination Policy', () => {
  let mockStorage = {};
  let mockCookies = {};

  beforeEach(() => {
    mockStorage = {};
    mockCookies = {};

    globalThis.localStorage = {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; },
    };

    globalThis.document = {
      get cookie() {
        return Object.entries(mockCookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
      },
      set cookie(cookieStr) {
        if (!cookieStr) return;
        const [pair] = cookieStr.split(';');
        const [k, ...rest] = pair.split('=');
        const key = k.trim();
        const val = rest.join('=');
        if (cookieStr.includes('max-age=0') || cookieStr.includes('Max-Age=0') || cookieStr.includes('expires=Thu, 01 Jan 1970')) {
          delete mockCookies[key];
        } else {
          mockCookies[key] = val;
        }
      },
    };

    globalThis.window = {
      location: {
        hostname: 'localhost',
        protocol: 'https:',
        pathname: '/',
      },
    };
  });

  it('1. clearLegacyAuthCookies removes auth_token, access_token, and refresh_token from cookies and localStorage', () => {
    document.cookie = 'auth_token=legacy-jwt-123; path=/';
    document.cookie = 'access_token=legacy-access-456; path=/';
    document.cookie = 'refresh_token=legacy-refresh-789; path=/';
    document.cookie = 'ACCESS_TOKEN=canonical-access-999; path=/';

    localStorage.setItem('auth_token', 'legacy-jwt-123');
    localStorage.setItem('access_token', 'legacy-access-456');
    localStorage.setItem('refresh_token', 'legacy-refresh-789');
    localStorage.setItem('token', 'legacy-token');
    localStorage.setItem('ACCESS_TOKEN', 'canonical-access-999');

    clearLegacyAuthCookies();

    // Verify legacy tokens are removed from cookies
    assert.equal(getCookie('auth_token'), null, 'auth_token cookie must be deleted');
    assert.equal(getCookie('access_token'), null, 'access_token cookie must be deleted');
    assert.equal(getCookie('refresh_token'), null, 'refresh_token cookie must be deleted');

    // Verify canonical token is untouched
    assert.equal(getCookie('ACCESS_TOKEN'), 'canonical-access-999', 'ACCESS_TOKEN cookie must remain intact');

    // Verify legacy tokens are removed from localStorage
    assert.equal(localStorage.getItem('auth_token'), null);
    assert.equal(localStorage.getItem('access_token'), null);
    assert.equal(localStorage.getItem('refresh_token'), null);
    assert.equal(localStorage.getItem('token'), null);
    assert.equal(localStorage.getItem('ACCESS_TOKEN'), 'canonical-access-999');
  });

  it('2. Request interceptor prioritizes canonical ACCESS_TOKEN and immediately scrubs stale auth_token', async () => {
    // Simulate duplicate cookie state where auth_token has an old token and ACCESS_TOKEN has the fresh token
    document.cookie = 'auth_token=stale-old-token; path=/';
    document.cookie = 'ACCESS_TOKEN=fresh-canonical-token; path=/';
    localStorage.setItem('auth_token', 'stale-old-token');
    localStorage.setItem('ACCESS_TOKEN', 'fresh-canonical-token');

    const testInstance = axios.create();
    attachRequestInterceptor(testInstance);

    const config = {
      url: '/api/sso/me',
      method: 'GET',
      headers: new axios.AxiosHeaders(),
    };

    const [interceptor] = testInstance.interceptors.request.handlers;
    const transformedConfig = await interceptor.fulfilled(config);

    // Verify Authorization header uses the canonical ACCESS_TOKEN
    const authHeader = transformedConfig.headers.get('Authorization');
    assert.equal(authHeader, 'Bearer fresh-canonical-token', 'Must use canonical ACCESS_TOKEN, never stale auth_token');

    // Verify legacy auth_token cookie was cleaned up
    assert.equal(getCookie('auth_token'), null, 'Stale auth_token must be purged when canonical token is read');
  });

  it('3. Request interceptor safely falls back to legacy auth_token when ACCESS_TOKEN is not yet set', async () => {
    // Only legacy auth_token present (e.g. migration period from legacy session)
    document.cookie = 'auth_token=existing-legacy-token; path=/';

    const testInstance = axios.create();
    attachRequestInterceptor(testInstance);

    const config = {
      url: '/api/sso/me',
      method: 'GET',
      headers: new axios.AxiosHeaders(),
    };

    const [interceptor] = testInstance.interceptors.request.handlers;
    const transformedConfig = await interceptor.fulfilled(config);

    const authHeader = transformedConfig.headers.get('Authorization');
    assert.equal(authHeader, 'Bearer existing-legacy-token', 'Must gracefully fall back to legacy auth_token if ACCESS_TOKEN is missing');
  });

  it('4. Access token in localStorage prioritizes ACCESS_TOKEN and scrubs legacy keys', async () => {
    // No cookies, only localStorage
    localStorage.setItem('auth_token', 'old-local-token');
    localStorage.setItem('ACCESS_TOKEN', 'new-local-canonical');

    const testInstance = axios.create();
    attachRequestInterceptor(testInstance);

    const config = {
      url: '/api/sso/me',
      method: 'GET',
      headers: new axios.AxiosHeaders(),
    };

    const [interceptor] = testInstance.interceptors.request.handlers;
    const transformedConfig = await interceptor.fulfilled(config);

    const authHeader = transformedConfig.headers.get('Authorization');
    assert.equal(authHeader, 'Bearer new-local-canonical');
    assert.equal(localStorage.getItem('auth_token'), null, 'Legacy auth_token removed from localStorage');
  });
});

