import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLoginError } from '../../utils/organizationLoginHelper.js';
import { getPostLoginRedirectPath } from '../../utils/moduleAccess.js';
import { isSafeRedirectPath } from '../../utils/redirectHelper.js';

describe('Production Readiness Smoke Tests Suite', () => {
  describe('1. Error Recovery & Chunk Error Detection Logic', () => {
    const isChunkLoadError = (err) => {
      const msg = err?.message || err?.toString() || '';
      return /Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);
    };

    it('detects chunk load errors correctly', () => {
      const chunkError = new Error('Failed to fetch dynamically imported module: /assets/Purchase-xyz.js');
      assert.equal(isChunkLoadError(chunkError), true);
    });

    it('identifies standard component errors without marking them as chunk errors', () => {
      const standardError = new TypeError('Cannot read property of undefined');
      assert.equal(isChunkLoadError(standardError), false);
    });
  });

  describe('2. 404 & 403 Navigation and Safe Landing Resolution', () => {
    it('redirects super_admin user to super-admin dashboard on landing resolution', () => {
      const user = { role: 'super_admin', username: 'admin' };
      const path = getPostLoginRedirectPath({ user });
      assert.equal(path, '/super-admin/dashboard');
    });

    it('redirects owner user to /workspace as canonical tenant entry point', () => {
      const user = { role: 'owner', username: 'owner@example.com' };
      const path = getPostLoginRedirectPath({ user });
      assert.equal(path, '/workspace');
    });

    it('redirects regular company user to workspace', () => {
      const user = { role: 'company_admin', username: 'admin@acme.com', companyId: 'comp-1' };
      const path = getPostLoginRedirectPath({ user });
      assert.equal(path, '/workspace');
    });
  });

  describe('3. Form Validation & Server Error Sanitization', () => {
    it('sanitizes internal Java/SQL server errors and does not expose stack traces to user', () => {
      const sqlError = {
        status: 500,
        response: {
          data: {
            message: 'SQLException: NullPointerException at com.mark2.sso.service.UserService.login(UserService.java:142)'
          }
        }
      };
      const sanitized = sanitizeLoginError(sqlError);
      assert.equal(sanitized, 'Something went wrong. Please try again.');
      assert.equal(sanitized.includes('Exception'), false);
      assert.equal(sanitized.includes('java'), false);
    });

    it('correctly maps 401 unauthorized to user friendly credentials message', () => {
      const authError = { status: 401, message: 'Bad credentials' };
      const sanitized = sanitizeLoginError(authError);
      assert.equal(sanitized, 'Invalid email or password.');
    });

    it('correctly maps 403 membership revoked error', () => {
      const forbiddenError = { status: 403, response: { data: { message: 'Membership revoked' } } };
      const sanitized = sanitizeLoginError(forbiddenError);
      assert.equal(sanitized, "You don't have access to this organization.");
    });
  });

  describe('4. Open-Redirect and Deep Link Base Path Integrity', () => {
    it('strictly permits safe relative routes and blocks protocol-relative attacks', () => {
      assert.equal(isSafeRedirectPath('/company/000000/dashboard'), true);
      assert.equal(isSafeRedirectPath('//attacker.com'), false);
      assert.equal(isSafeRedirectPath('/\\attacker.com'), false);
      assert.equal(isSafeRedirectPath('javascript:void(0)'), false);
    });
  });
});
