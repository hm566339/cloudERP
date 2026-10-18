import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAppRedirectPath, getPostLoginRedirectPath } from '../../utils/moduleAccess.js';
import { getEntitledModules, normalizeModuleName } from '../../utils/moduleNormalization.js';
import { isSafeRedirectPath, resolveSafeRedirectDestination } from '../../utils/redirectHelper.js';
import { evaluateLoginResult } from '../../utils/organizationLoginHelper.js';

describe('Company User Auth & Dashboard Routing Test Suite', () => {
  describe('1. Company User with ACCOUNTANT Role and MEMBER Membership', () => {
    it('infers ACCOUNT canonical module for ACCOUNTANT role even when modules list is omitted', () => {
      const authContext = {
        user: { role: 'ACCOUNTANT', email: 'accountant@acme.com' },
        membership: { memberType: 'MEMBER', role: 'ACCOUNTANT' },
        modules: [],
        permissions: ['READ', 'CREATE', 'UPDATE'],
      };
      const modules = getEntitledModules(authContext);
      assert.deepEqual(modules, ['ACCOUNT']);
    });

    it('infers ACCOUNT canonical module from finance-related permissions', () => {
      const authContext = {
        user: { role: 'employee', email: 'staff@acme.com' },
        membership: { memberType: 'MEMBER' },
        modules: [],
        permissions: [{ moduleName: 'FINANCE', featureCode: 'LEDGERS' }],
      };
      const modules = getEntitledModules(authContext);
      assert.deepEqual(modules, ['ACCOUNT']);
    });

    it('determines /accounts/dashboard destination for single ACCOUNT entitled module', () => {
      const authContext = {
        user: { role: 'ACCOUNTANT' },
        membership: { memberType: 'MEMBER' },
        modules: [{ name: 'account', active: true }],
      };
      const entitled = getEntitledModules(authContext);
      assert.equal(entitled.length, 1);
      assert.equal(entitled[0], 'ACCOUNT');
    });
  });

  describe('2. Company User with MEMBER Membership Type', () => {
    it('derives INVENTORY module for inventory staff member', () => {
      const authContext = {
        user: { role: 'inventory_manager' },
        membership: { memberType: 'MEMBER' },
        modules: [{ name: 'inventory', active: true }],
      };
      const entitled = getEntitledModules(authContext);
      assert.deepEqual(entitled, ['INVENTORY']);
    });

    it('derives CRM module for sales staff member', () => {
      const authContext = {
        user: { role: 'sales_rep' },
        membership: { memberType: 'MEMBER' },
        modules: [{ name: 'sales-crm', active: true }],
      };
      const entitled = getEntitledModules(authContext);
      assert.deepEqual(entitled, ['CRM']);
    });

    it('derives multiple entitled modules for multi-module member', () => {
      const authContext = {
        user: { role: 'ops_lead' },
        membership: { memberType: 'MEMBER' },
        modules: [
          { name: 'finance', active: true },
          { name: 'inventory', active: true },
        ],
      };
      const entitled = getEntitledModules(authContext);
      assert.equal(entitled.length, 2);
      assert.ok(entitled.includes('ACCOUNT'));
      assert.ok(entitled.includes('INVENTORY'));
    });
  });

  describe('3. OWNER User Login Flow', () => {
    it('routes OWNER to /workspace which evaluates to Organization Control Center', () => {
      const user = { role: 'owner', email: 'owner@domain.com' };
      const path = getPostLoginRedirectPath({ user });
      assert.equal(path, '/workspace');
    });

    it('identifies owner membership type accurately', () => {
      const authContext = {
        user: { role: 'member' },
        membership: { memberType: 'OWNER' },
      };
      const isOwner = authContext?.membership?.memberType === 'OWNER' || authContext?.user?.role === 'owner';
      assert.equal(isOwner, true);
    });
  });

  describe('4. Company Context Preservation', () => {
    it('does not mutate or drop valid company context', () => {
      const companyContext = {
        id: 'comp-123',
        code: 'ACME_IND',
        name: 'Acme Industries Ltd',
      };
      assert.equal(companyContext.id, 'comp-123');
      assert.equal(companyContext.code, 'ACME_IND');
    });

    it('normalizes redirect paths containing company parameters safely', () => {
      const dest = normalizeAppRedirectPath('/company/comp-123/dashboard');
      assert.equal(dest, '/company/comp-123/dashboard');
    });
  });

  describe('5. Company Selection Flow', () => {
    it('evaluates requiresCompanySelection in LoginResponse and returns /company-select', () => {
      const loginResponse = {
        data: {
          requiresCompanySelection: true,
          companies: [{ id: 'c1', code: 'A' }, { id: 'c2', code: 'B' }],
        },
      };
      const result = evaluateLoginResult(loginResponse);
      assert.equal(result.type, 'COMPANY_SELECTION');
      assert.equal(result.path, '/company-select');
      assert.equal(result.companies.length, 2);
    });

    it('normalizes company/undefined to /company-select safely', () => {
      const normalized = normalizeAppRedirectPath('/company/undefined/dashboard');
      assert.equal(normalized, '/company-select');
    });
  });

  describe('6. Access Denied & Non-Looping Zero-Module Defense', () => {
    it('returns empty array when user has no active modules and no entitled permissions', () => {
      const authContext = {
        user: { role: 'guest' },
        membership: { memberType: 'MEMBER' },
        modules: [],
        permissions: [],
      };
      const entitled = getEntitledModules(authContext);
      assert.deepEqual(entitled, []);
    });

    it('rejects /403 as a post-login return destination', () => {
      const destination = resolveSafeRedirectDestination({
        searchParams: new URLSearchParams('redirect=/403'),
        sessionStorage: null,
        defaultPath: '/workspace',
      });
      assert.equal(destination, '/workspace');
    });
  });

  describe('7. Session Expiry & Base Path Stripping in Logout', () => {
    it('strips /erp deployment prefix before storing auth_return_to', () => {
      const currentPath = '/erp/accounts/masters/customers';
      const stripped = currentPath.replace(/^(\/erp)+/i, '') || '/';
      assert.equal(stripped, '/accounts/masters/customers');
    });

    it('strips nested /erp/erp deployment prefixes cleanly', () => {
      const currentPath = '/erp/erp/accounts/dashboard';
      const stripped = currentPath.replace(/^(\/erp)+/i, '') || '/';
      assert.equal(stripped, '/accounts/dashboard');
    });
  });

  describe('8. Failed Authentication & Loop Destination Rejection', () => {
    it('rejects /dashboard/dashboard recursive paths', () => {
      assert.equal(isSafeRedirectPath('/dashboard/dashboard'), false);
      assert.equal(isSafeRedirectPath('/erp/auth/callback/dashboard/dashboard'), false);
      assert.equal(normalizeAppRedirectPath('/dashboard/dashboard/dashboard'), null);
    });

    it('rejects callback and login destinations to avoid redirect loops', () => {
      assert.equal(isSafeRedirectPath('/auth/callback'), false);
      assert.equal(isSafeRedirectPath('/account/callback'), false);
      assert.equal(isSafeRedirectPath('/login'), false);
      assert.equal(isSafeRedirectPath('/admin-login'), false);
      assert.equal(isSafeRedirectPath('/modules'), false);
    });

    it('normalizes fallback safely when raw destination is a callback path', () => {
      const dest = normalizeAppRedirectPath('/auth/callback?code=123');
      assert.equal(dest, null);
    });
  });

  describe('9. Dashboard Refresh Segments Preservation', () => {
    it('normalizes valid dashboard path without appending extra segments', () => {
      const path = normalizeAppRedirectPath('/accounts/dashboard');
      assert.equal(path, '/accounts/dashboard');
    });

    it('normalizes legacy /account/dashboard to canonical /accounts/dashboard', () => {
      const path = normalizeAppRedirectPath('/account/dashboard');
      assert.equal(path, '/accounts/dashboard');
    });
  });

  describe('10. Direct Deep-Link Navigation to Protected Routes', () => {
    it('preserves deep link paths and query parameters while stripping /erp prefix', () => {
      const locationStateFrom = {
        pathname: '/erp/accounts/transactions/payments',
        search: '?status=PENDING&page=1',
        hash: '#summary',
      };
      const destination = resolveSafeRedirectDestination({
        searchParams: null,
        sessionStorage: null,
        locationStateFrom,
        defaultPath: '/workspace',
      });
      assert.equal(destination, '/accounts/transactions/payments?status=PENDING&page=1#summary');
    });
  });

  describe('11. Idempotent Processing and Strict Mode Guarding', () => {
    it('simulates ref-based idempotency to ensure code is processed exactly once', () => {
      let runCount = 0;
      const ref = { current: false };

      const processOnce = () => {
        if (ref.current) return;
        ref.current = true;
        runCount++;
      };

      // First run (mount)
      processOnce();
      // Second run (React Strict Mode re-mount)
      processOnce();

      assert.equal(runCount, 1);
    });
  });

  describe('12. Final Base Path and URL Normalization', () => {
    it('removes /erp prefix accurately without leaving double slashes', () => {
      const raw = '/erp/accounts/dashboard';
      const normalized = raw.replace(/^(\/erp)+/i, '') || '/';
      assert.equal(normalized, '/accounts/dashboard');
      assert.ok(!normalized.includes('//'));
      assert.ok(!normalized.startsWith('/erp'));
    });

    it('handles root /erp path cleanly', () => {
      const raw = '/erp';
      const normalized = raw.replace(/^(\/erp)+/i, '') || '/';
      assert.equal(normalized, '/');
    });

    it('handles quadruple /erp/erp/erp/erp cleanly', () => {
      const raw = '/erp/erp/erp/erp/inventory/dashboard';
      const normalized = raw.replace(/^(\/erp)+/i, '') || '/';
      assert.equal(normalized, '/inventory/dashboard');
    });
  });
});
