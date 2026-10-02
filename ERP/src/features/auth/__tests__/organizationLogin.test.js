import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  buildLoginPayload,
  parseOrganizationLookupResponse,
  evaluateLoginResult,
  sanitizeLoginError
} from '../../../utils/organizationLoginHelper.js';

describe('Phase 10 — Organization-Specific Login Page Tests', () => {

  describe('1. Organization Lookup API Contract & Mapping', () => {
    it('correctly maps valid OrganizationLookupResponse from GET /api/sso/organization/{code}', () => {
      const apiResponse = {
        success: true,
        message: 'Success',
        data: {
          code: 'vishal',
          name: 'Vishal Enterprises',
          loginUrl: 'http://localhost:3001/o/vishal/login'
        }
      };

      const result = parseOrganizationLookupResponse(apiResponse);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.organization.code, 'vishal');
      assert.strictEqual(result.organization.name, 'Vishal Enterprises');
      assert.strictEqual(result.organization.loginUrl, 'http://localhost:3001/o/vishal/login');
    });

    it('falls back safely to organization code when name is not provided', () => {
      const apiResponse = {
        code: 'radha',
        loginUrl: 'http://localhost:3001/o/radha/login'
      };

      const result = parseOrganizationLookupResponse(apiResponse);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.organization.code, 'radha');
      assert.strictEqual(result.organization.name, 'radha');
    });

    it('marks lookup as invalid when response is empty or code is missing', () => {
      const result = parseOrganizationLookupResponse({ success: false, data: {} });
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.organization, null);
    });
  });

  describe('2. Dynamic Organization Routing (Never Hardcoded)', () => {
    it('handles arbitrary dynamic organization codes (vishal, radha, abc, etc.)', () => {
      const orgCodes = ['vishal', 'radha', 'acme-corp', 'tenant-1234'];

      orgCodes.forEach(code => {
        const payload = buildLoginPayload({
          username: 'user@example.com',
          password: 'Password123@',
          organizationCode: code
        });
        assert.strictEqual(payload.organizationCode, code);
      });
    });
  });

  describe('3. LoginRequest Payload Conformance', () => {
    it('produces payload matching backend LoginRequest schema for organization login', () => {
      const payload = buildLoginPayload({
        username: 'admin@vishal.com',
        password: 'Password123@',
        organizationCode: 'VISHAL'
      });

      assert.strictEqual(payload.username, 'admin@vishal.com');
      assert.strictEqual(payload.email, 'admin@vishal.com');
      assert.strictEqual(payload.password, 'Password123@');
      assert.strictEqual(payload.organizationCode, 'vishal'); // normalized to lowercase
      assert.strictEqual(payload.companyCode, undefined);
    });

    it('preserves existing non-organization login contract with companyCode', () => {
      const payload = buildLoginPayload({
        username: 'accountant',
        password: 'Password123@',
        companyCode: 'COMP01',
        host: 'http://localhost:3001/api/account'
      });

      assert.strictEqual(payload.username, 'accountant');
      assert.strictEqual(payload.companyCode, 'COMP01');
      assert.strictEqual(payload.host, 'http://localhost:3001/api/account');
      assert.strictEqual(payload.organizationCode, undefined);
    });

    it('attaches companyId when explicitly provided for company selection', () => {
      const payload = buildLoginPayload({
        username: 'admin@vishal.com',
        password: 'Password123@',
        organizationCode: 'vishal',
        companyId: '44dfeca6-b556-485a-9553-0f7db6283696'
      });

      assert.strictEqual(payload.companyId, '44dfeca6-b556-485a-9553-0f7db6283696');
      assert.strictEqual(payload.organizationCode, 'vishal');
    });
  });

  describe('4. LoginResponse Handling & Post-Login Flow', () => {
    it('Case A: handles single authorized company with redirectUrl OAuth code flow', () => {
      const loginResponse = {
        data: {
          requiresCompanySelection: false,
          organization: { id: 'org-1', name: 'Vishal', code: 'vishal' },
          redirectUrl: 'system-admin.local/auth/callback?code=abc-123'
        }
      };

      const result = evaluateLoginResult(loginResponse);
      assert.strictEqual(result.type, 'REDIRECT_CALLBACK');
      assert.strictEqual(result.path, '/auth/callback?code=abc-123');
    });

    it('Case B: handles multiple authorized companies requiring company selection', () => {
      const loginResponse = {
        data: {
          requiresCompanySelection: true,
          organization: { id: 'org-1', name: 'Vishal', code: 'vishal' },
          companies: [
            { id: 'c-1', name: 'Vishal Trading', code: 'VT01' },
            { id: 'c-2', name: 'Vishal Logistics', code: 'VL02' }
          ],
          message: 'Company selection required'
        }
      };

      const result = evaluateLoginResult(loginResponse);
      assert.strictEqual(result.type, 'COMPANY_SELECTION');
      assert.strictEqual(result.path, '/company-select');
      assert.strictEqual(result.companies.length, 2);
      assert.strictEqual(result.companies[0].code, 'VT01');
    });

    it('Case C: handles direct token response gracefully', () => {
      const loginResponse = {
        data: {
          accessToken: 'mock.access.token',
          refreshToken: 'mock.refresh.token',
          user: { id: 'u-1', username: 'testuser' }
        }
      };

      const result = evaluateLoginResult(loginResponse);
      assert.strictEqual(result.type, 'DIRECT_AUTHENTICATION');
      assert.strictEqual(result.token, 'mock.access.token');
    });
  });

  describe('5. Safe Error Sanitization (Security & Leak Prevention)', () => {
    it('sanitizes 401 Bad Credentials to safe message', () => {
      const error = { status: 401, data: { message: 'Invalid credentials' } };
      assert.strictEqual(sanitizeLoginError(error), 'Invalid email or password.');
    });

    it('sanitizes 403 Forbidden / membership revoked to safe message', () => {
      const error = { status: 403, data: { message: 'Organization membership revoked' } };
      assert.strictEqual(sanitizeLoginError(error), "You don't have access to this organization.");
    });

    it('sanitizes 404 Organization not found to safe message', () => {
      const error = { status: 404, data: { message: 'Organization not found' } };
      assert.strictEqual(sanitizeLoginError(error), 'Organization not found.');
    });

    it('masks internal Java exception stack traces on 500 server error', () => {
      const rawException = {
        status: 500,
        data: {
          message: 'org.hibernate.exception.ConstraintViolationException: could not execute statement; nested exception is org.postgresql.util.PSQLException'
        }
      };
      const safe = sanitizeLoginError(rawException);
      assert.strictEqual(safe, 'Something went wrong. Please try again.');
      assert.strictEqual(safe.includes('org.hibernate'), false);
      assert.strictEqual(safe.includes('PSQLException'), false);
    });

    it('handles blocked organization status safely', () => {
      const error = { data: { message: 'Organization access is blocked' } };
      assert.strictEqual(sanitizeLoginError(error), 'Organization access is blocked. Please contact support.');
    });
  });

  describe('6. Signup Redirect to Organization Login', () => {
    it('derives target URL from OrganizationSignupResponse login.url', () => {
      const signupResponse = {
        data: {
          organization: { code: 'vishal', name: 'Vishal' },
          company: { code: 'VISHAL', name: 'Vishal' },
          login: { url: 'http://localhost:3001/o/vishal/login' }
        }
      };

      const urlObj = new URL(signupResponse.data.login.url);
      assert.strictEqual(urlObj.pathname, '/o/vishal/login');
    });
  });

});
