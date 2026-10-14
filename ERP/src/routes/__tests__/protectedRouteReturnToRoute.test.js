import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSafeRedirectDestination, isSafeRedirectPath } from '../../utils/redirectHelper.js';

describe('ProtectedRoute Return-To-Route & Open-Redirect Defense Suite', () => {
  describe('1. isSafeRedirectPath validator', () => {
    it('accepts safe relative internal paths', () => {
      assert.equal(isSafeRedirectPath('/company/1/accounts'), true);
      assert.equal(isSafeRedirectPath('/company/1/accounts?search=invoice&page=2'), true);
      assert.equal(isSafeRedirectPath('/workspace#section-1'), true);
      assert.equal(isSafeRedirectPath('/reports/sales/2026/q1'), true);
    });

    it('rejects protocol-relative URLs (//evil.com)', () => {
      assert.equal(isSafeRedirectPath('//evil.com'), false);
      assert.equal(isSafeRedirectPath('//evil.com/phishing'), false);
      assert.equal(isSafeRedirectPath('///evil.com'), false);
    });

    it('rejects external absolute URLs', () => {
      assert.equal(isSafeRedirectPath('https://attacker.com'), false);
      assert.equal(isSafeRedirectPath('http://attacker.com/steal-token'), false);
      assert.equal(isSafeRedirectPath('ftp://files.example.com'), false);
    });

    it('rejects javascript: and pseudo protocols', () => {
      assert.equal(isSafeRedirectPath('javascript:alert(document.cookie)'), false);
      assert.equal(isSafeRedirectPath('/javascript:alert(1)'), false);
      assert.equal(isSafeRedirectPath('data:text/html,<script>alert(1)</script>'), false);
    });

    it('rejects Windows backslash bypasses (/\\evil.com)', () => {
      assert.equal(isSafeRedirectPath('/\\evil.com'), false);
      assert.equal(isSafeRedirectPath('/\\\\attacker.com'), false);
    });

    it('rejects null, undefined, and non-string inputs', () => {
      assert.equal(isSafeRedirectPath(null), false);
      assert.equal(isSafeRedirectPath(undefined), false);
      assert.equal(isSafeRedirectPath(12345), false);
      assert.equal(isSafeRedirectPath({}), false);
    });
  });

  describe('2. Return-to-route after Deep Link Authentication', () => {
    it('preserves deep link route and returns user to exact deep link upon login', () => {
      const locationStateFrom = {
        pathname: '/company/acme/accounts/customers',
        search: '?search=apex&page=2',
        hash: '#top',
      };

      const destination = resolveSafeRedirectDestination({
        searchParams: new URLSearchParams(),
        sessionStorage: null,
        locationStateFrom,
        defaultPath: '/workspace',
      });

      assert.equal(destination, '/company/acme/accounts/customers?search=apex&page=2#top');
    });

    it('prioritizes valid URL query param returnTo over default path', () => {
      const searchParams = new URLSearchParams('returnTo=/company/1/inventory/items?sku=SKU-001');

      const destination = resolveSafeRedirectDestination({
        searchParams,
        sessionStorage: null,
        locationStateFrom: null,
        defaultPath: '/workspace',
      });

      assert.equal(destination, '/company/1/inventory/items?sku=SKU-001');
    });

    it('retrieves and consumes auth_return_to from sessionStorage', () => {
      const mockStorage = {
        data: { auth_return_to: '/company/42/sales/invoices' },
        getItem(key) {
          return this.data[key] || null;
        },
        removeItem(key) {
          delete this.data[key];
        },
      };

      const destination = resolveSafeRedirectDestination({
        searchParams: new URLSearchParams(),
        sessionStorage: mockStorage,
        locationStateFrom: null,
        defaultPath: '/workspace',
      });

      assert.equal(destination, '/company/42/sales/invoices');
      // Verify storage key is consumed/removed
      assert.equal(mockStorage.data.auth_return_to, undefined);
    });
  });

  describe('3. Open-Redirect Rejection & Fallback', () => {
    it('rejects open-redirect in query param and falls back to default path', () => {
      const searchParams = new URLSearchParams('redirect=//evil.com/phishing');

      const destination = resolveSafeRedirectDestination({
        searchParams,
        sessionStorage: null,
        locationStateFrom: null,
        defaultPath: '/workspace',
      });

      assert.equal(destination, '/workspace');
    });

    it('rejects external URL in query param and falls back to locationStateFrom if safe', () => {
      const searchParams = new URLSearchParams('goto=https://malicious.org');
      const locationStateFrom = {
        pathname: '/company/1/dashboard',
      };

      const destination = resolveSafeRedirectDestination({
        searchParams,
        sessionStorage: null,
        locationStateFrom,
        defaultPath: '/workspace',
      });

      assert.equal(destination, '/company/1/dashboard');
    });

    it('rejects malformed locationStateFrom and returns defaultPath', () => {
      const locationStateFrom = {
        pathname: '//attacker.com/exploit',
      };

      const destination = resolveSafeRedirectDestination({
        searchParams: new URLSearchParams(),
        sessionStorage: null,
        locationStateFrom,
        defaultPath: '/owner/dashboard',
      });

      assert.equal(destination, '/owner/dashboard');
    });
  });
});
