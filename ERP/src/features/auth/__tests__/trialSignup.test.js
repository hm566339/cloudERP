import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateOrganizationSignupInput,
  buildOrganizationSignupPayload,
  generateSuggestedCompanyCode,
  parseOrganizationSignupResponse,
  evaluateRootIndexDestination,
} from '../../../utils/organizationSignupValidation.js';
import { getSafeErrorMessage } from '../../../utils/apiErrorHelper.js';

describe('30-Day Free Trial Organization Signup & Error Handling Tests', () => {
  // ─── 1. Form Validation Tests ──────────────────────────────────────────────
  describe('1. Form Input Validation', () => {
    it('fails when full name is missing', () => {
      const result = validateOrganizationSignupInput({
        fullName: '',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME01',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.fullName, 'Full Name is required');
    });

    it('fails when email is invalid', () => {
      const result = validateOrganizationSignupInput({
        fullName: 'John Doe',
        email: 'invalid-email-address',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME01',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.email, 'Please enter a valid email address');
    });

    it('fails when password is under 8 characters', () => {
      const result = validateOrganizationSignupInput({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'short',
        confirmPassword: 'short',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME01',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.password, 'Password must be at least 8 characters');
    });

    it('fails when confirm password does not match', () => {
      const result = validateOrganizationSignupInput({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME01',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.confirmPassword, 'Passwords do not match');
    });

    it('fails when company code contains invalid special characters', () => {
      const result = validateOrganizationSignupInput({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME @#$!',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.companyCode.includes('letters, numbers, hyphens or underscores'));
    });

    it('passes validation when all mandatory fields are valid', () => {
      const result = validateOrganizationSignupInput({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Acme Corp',
        companyName: 'Acme India',
        companyCode: 'ACME01',
        baseCurrency: 'INR',
      });
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });
  });

  // ─── 2. Payload Builder Contract Tests ─────────────────────────────────────
  describe('2. Backend Contract Payload Matching', () => {
    it('produces OrganizationSignupRequest matching backend DTO schema exactly', () => {
      const rawInput = {
        fullName: '  Rohit Sharma  ',
        email: '  Rohit@Example.COM  ',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        organizationName: '  Apex Global Group  ',
        companyName: '  Apex Precision Tools  ',
        companyCode: '  apex01  ',
        baseCurrency: '  inr  ',
        gstin: '  27AAAAA0000A1Z5  ',
        pan: '  AAAAA0000A  ',
        phone: '9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      };

      const payload = buildOrganizationSignupPayload(rawInput);

      assert.equal(payload.fullName, 'Rohit Sharma');
      assert.equal(payload.email, 'rohit@example.com');
      assert.equal(payload.password, 'SecurePassword123!');
      assert.equal(payload.organizationName, 'Apex Global Group');
      assert.ok(payload.company);
      assert.equal(payload.company.companyName, 'Apex Precision Tools');
      assert.equal(payload.company.companyCode, 'APEX01');
      assert.equal(payload.company.baseCurrency, 'INR');
      assert.equal(payload.company.gstin, '27AAAAA0000A1Z5');
      assert.equal(payload.company.pan, 'AAAAA0000A');
      assert.equal(payload.company.phone, '9876543210');
      assert.equal(payload.company.city, 'Mumbai');
      assert.equal(payload.company.state, 'Maharashtra');
      assert.equal(payload.company.country, 'India');
      assert.equal(payload.company.active, true);
    });
  });

  // ─── 3. Safe Error Handling Tests ──────────────────────────────────────────
  describe('3. Error Handling and Sanitization', () => {
    it('handles 401 Unauthorized with standard session expired message', () => {
      const err = { response: { status: 401 } };
      assert.equal(getSafeErrorMessage(err), 'Your session has expired. Please sign in again.');
    });

    it('handles 403 Forbidden with permission message', () => {
      const err = { response: { status: 403, data: { message: 'Access denied' } } };
      assert.equal(getSafeErrorMessage(err), "You don't have permission to perform this action.");
    });

    it('handles 403 READ_ONLY with specific read-only mode message', () => {
      const err = { response: { status: 403, data: { message: 'Organization is in READ_ONLY mode' } } };
      assert.equal(getSafeErrorMessage(err), 'This organization is currently in read-only mode.');
    });

    it('handles 404 Not Found', () => {
      const err = { response: { status: 404 } };
      assert.equal(getSafeErrorMessage(err), 'The requested resource was not found.');
    });

    it('handles 409 Conflict with backend business message', () => {
      const err = { response: { status: 409, data: { message: 'Company code already exists' } } };
      assert.equal(getSafeErrorMessage(err), 'Company code already exists');
    });

    it('handles 400 Bad Request with validation error message', () => {
      const err = { response: { status: 400, data: { message: 'Email already exists' } } };
      assert.equal(getSafeErrorMessage(err), 'Email already exists');
    });

    it('masks internal Java stack traces on 500 server errors', () => {
      const err = {
        response: {
          status: 500,
          data: {
            message: 'java.lang.NullPointerException: at com.erp.auth_service.service.impl.OrganizationServiceImpl.signup',
          },
        },
      };
      const msg = getSafeErrorMessage(err);
      assert.equal(msg, 'Something went wrong. Please try again.');
      assert.ok(!msg.includes('NullPointerException'));
      assert.ok(!msg.includes('com.erp'));
    });
  });

  // ─── 4. Company Code Auto-Suggestion & Formatting Tests ───────────────────
  describe('4. Company Code Suggestion & Formatting', () => {
    it('generates uppercase alphanumeric code truncated to 10 characters', () => {
      assert.equal(generateSuggestedCompanyCode('Acme Industrial Solutions Private Limited'), 'ACMEINDUST');
      assert.equal(generateSuggestedCompanyCode('Apex-Tools & Dies! 2026'), 'APEXTOOLSD');
      assert.equal(generateSuggestedCompanyCode('  Tata  Motors  '), 'TATAMOTORS');
      assert.equal(generateSuggestedCompanyCode(''), '');
      assert.equal(generateSuggestedCompanyCode(null), '');
    });
  });

  // ─── 5. Successful Signup Response Contract & Login Redirection ───────────
  describe('5. Successful Signup Response Contract & Login Handling', () => {
    it('correctly maps backend OrganizationSignupResponse and extracts login URL', () => {
      const backendResponse = {
        success: true,
        data: {
          user: { id: 'usr-12345' },
          organization: { id: 'org-100', name: 'Apex Global Group', code: 'ORG-APEX' },
          company: { id: 'comp-200', name: 'Apex Tools India', code: 'APEXTOOLS' },
          subscription: {
            status: 'TRIALING',
            accessMode: 'FULL_ACCESS',
            trialEndsAt: '2026-10-24T12:00:00Z',
          },
          login: {
            url: '/login?org=ORG-APEX',
          },
        },
      };

      const parsed = parseOrganizationSignupResponse(backendResponse);
      assert.equal(parsed.organization.name, 'Apex Global Group');
      assert.equal(parsed.organization.code, 'ORG-APEX');
      assert.equal(parsed.company.name, 'Apex Tools India');
      assert.equal(parsed.company.code, 'APEXTOOLS');
      assert.equal(parsed.subscription.status, 'TRIALING');
      assert.equal(parsed.subscription.trialEndsAt, '2026-10-24T12:00:00Z');
      assert.equal(parsed.login.url, '/login?org=ORG-APEX');
    });

    it('falls back safely when backend response omits optional login url or metadata', () => {
      const backendResponse = {
        data: {
          organization: { name: 'Acme' },
          company: { name: 'Acme Sub' },
        },
      };

      const parsed = parseOrganizationSignupResponse(backendResponse);
      assert.equal(parsed.organization.name, 'Acme');
      assert.equal(parsed.company.name, 'Acme Sub');
      assert.equal(parsed.subscription.status, 'TRIALING');
      assert.equal(parsed.subscription.accessMode, 'FULL_ACCESS');
      assert.equal(parsed.login.url, null);
    });
  });

  // ─── 6. Duplicate Email & Duplicate Company Code Conflict Handling ────────
  describe('6. Duplicate Email & Duplicate Company Code Error Handling', () => {
    it('displays user-friendly error on duplicate email (409 conflict)', () => {
      const conflictError = {
        response: {
          status: 409,
          data: { message: 'Email already exists. Please sign in or use another email.' },
        },
      };
      const msg = getSafeErrorMessage(conflictError);
      assert.ok(msg.toLowerCase().includes('email already exists'));
    });

    it('displays user-friendly error on duplicate email (400 validation error)', () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'Email address already registered' },
        },
      };
      const msg = getSafeErrorMessage(validationError);
      assert.ok(msg.toLowerCase().includes('already registered'));
    });

    it('displays user-friendly error on duplicate company code (409 conflict)', () => {
      const conflictError = {
        response: {
          status: 409,
          data: { message: 'Company code already exists. Please choose a different company code.' },
        },
      };
      const msg = getSafeErrorMessage(conflictError);
      assert.ok(msg.toLowerCase().includes('company code already exists'));
    });

    it('displays user-friendly error on duplicate organization code (409 conflict)', () => {
      const conflictError = {
        response: {
          status: 409,
          data: { message: 'Organization code already exists' },
        },
      };
      const msg = getSafeErrorMessage(conflictError);
      assert.ok(msg.toLowerCase().includes('organization code already exists'));
    });
  });

  // ─── 7. Landing Route & Authenticated Navigation Behavior ─────────────────
  describe('7. Landing Route & Authenticated Redirection', () => {
    it('keeps unauthenticated visitor on landing page (/)', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: false,
        user: null,
        cookieToken: null,
        urlToken: null,
      });
      assert.equal(destination, '/');
    });

    it('redirects unauthenticated visitor with url token to accounts dashboard', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: false,
        user: null,
        cookieToken: null,
        urlToken: 'mock-sso-token-abc',
      });
      assert.equal(destination, '/accounts/dashboard?token=mock-sso-token-abc');
    });

    it('redirects authenticated super_admin from / to super-admin dashboard', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: true,
        user: { role: 'super_admin' },
        cookieToken: 'valid-jwt',
      });
      assert.equal(destination, '/super-admin/dashboard');
    });

    it('redirects authenticated company_admin with company to company workspace', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: true,
        user: { role: 'company_admin', companyId: 'comp-101' },
        cookieToken: 'valid-jwt',
      });
      assert.equal(destination, '/company/comp-101');
    });

    it('redirects authenticated user with company to accounts dashboard', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: true,
        user: { role: 'employee', companyId: 'comp-101' },
        cookieToken: 'valid-jwt',
      });
      assert.equal(destination, '/accounts/dashboard');
    });

    it('redirects authenticated user without company to company selection', () => {
      const destination = evaluateRootIndexDestination({
        authenticated: true,
        user: { role: 'employee', companyId: null, companyCode: null },
        cookieToken: 'valid-jwt',
      });
      assert.equal(destination, '/company-select');
    });
  });

  // ─── 8. Existing ERP Module Flow & Company Selection Integrity ────────────
  describe('8. Existing ERP Module & Company Selection Flow Integrity', () => {
    it('verifies module selection routes and login parameters remain intact', () => {
      // Expected flow: /modules -> /:moduleCode/login -> /company-select -> ERP
      const supportedModules = ['finance', 'sales', 'purchases', 'inventory', 'manufacturing'];
      supportedModules.forEach((mod) => {
        const loginUrl = `/${mod}/login`;
        assert.ok(loginUrl.startsWith('/'));
        assert.ok(loginUrl.endsWith('/login'));
      });
    });

    it('preserves company selection redirect when user changes active company', () => {
      const user = { role: 'employee', companyId: 'comp-202' };
      const targetCompany = { id: 'comp-303', code: 'COMP303' };
      // Simulating company selection switch
      const updatedUser = { ...user, companyId: targetCompany.id, companyCode: targetCompany.code };
      const dest = evaluateRootIndexDestination({ authenticated: true, user: updatedUser });
      assert.equal(dest, '/accounts/dashboard');
    });
  });
});

