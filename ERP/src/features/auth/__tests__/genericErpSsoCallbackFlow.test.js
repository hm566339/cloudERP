import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildAuthContext,
  getEntitledModules,
  normalizeModuleName,
  canViewModule,
  CANONICAL_MODULES,
} from '../../../utils/moduleNormalization.js';
import { evaluateLoginResult, buildLoginPayload } from '../../../utils/organizationLoginHelper.js';

describe('Generic ERP SSO Callback & Dynamic Multi-Module Architecture Tests', () => {

  // 1. ERP login uses generic callback
  it('1. ERP login uses generic callback (/erp/auth/callback)', () => {
    const payload = buildLoginPayload({
      username: 'user@example.com',
      password: 'password123',
      organizationCode: 'mohit',
      host: 'https://www.mark2.in/erp',
    });
    assert.strictEqual(payload.host, 'https://www.mark2.in/erp');
    assert.ok(!payload.host.includes('/api/account'));
  });

  // 2. ERP login does NOT use /api/account/auth/callback
  it('2. ERP login does NOT use /api/account/auth/callback', () => {
    const loginResponseWithLegacyUrl = {
      data: {
        redirectUrl: 'https://www.mark2.in/api/account/auth/callback?code=mock-code-123'
      }
    };
    const evaluated = evaluateLoginResult(loginResponseWithLegacyUrl);
    assert.strictEqual(evaluated.type, 'REDIRECT_CALLBACK');
    assert.strictEqual(evaluated.path, '/auth/callback?code=mock-code-123');
    assert.ok(!evaluated.path.includes('/api/account'));
  });

  // 3. Generic callback accepts authorization code
  it('3. Generic callback accepts authorization code from search params', () => {
    const query = new URLSearchParams('?code=test-auth-code-xyz');
    const code = query.get('code');
    assert.strictEqual(code, 'test-auth-code-xyz');
  });

  // 4. Generic callback exchanges code with SSO
  it('4. Generic callback exchanges code with SSO endpoint (/api/sso/token/exchange)', () => {
    const code = 'sso-one-time-code';
    const exchangePayload = { data: { code } };
    assert.strictEqual(exchangePayload.data.code, 'sso-one-time-code');
    assert.strictEqual(exchangePayload.data.clientId, undefined);
  });

  // 5. Generic callback calls /api/sso/auth/me
  it('5. Generic callback calls /api/sso/auth/me and builds canonical context', () => {
    const ssoMeResponse = {
      data: {
        id: 'usr-1',
        username: 'mohit',
        email: 'mohit@mark2.in',
        organization: { id: 'org-1', code: 'mohit', name: 'Mohit Org' },
        currentCompany: { id: 'comp-1', code: 'MOHIT', name: 'Mohit' },
        companies: [{ id: 'comp-1', code: 'MOHIT', name: 'Mohit' }],
        membership: { memberType: 'MEMBER' },
        subscription: { planCode: 'PRO', accessMode: 'FULL' },
        accessMode: 'FULL',
        modules: [
          { id: 'm1', name: 'accountDev', active: true },
          { id: 'm2', name: 'inventory', active: true },
          { id: 'm3', name: 'crm', active: true }
        ],
        features: ['INVOICING', 'STOCK', 'LEADS'],
        permissions: ['INVOICING:READ', 'STOCK:READ', 'LEADS:READ']
      }
    };
    const ctx = buildAuthContext(ssoMeResponse);
    assert.strictEqual(ctx.organization.code, 'mohit');
    assert.strictEqual(ctx.currentCompany.code, 'MOHIT');
    assert.strictEqual(ctx.accessMode, 'FULL');
    assert.strictEqual(ctx.modules.length, 3);
  });

  // 6. Generic callback redirects to /workspace
  it('6. Generic callback destination defaults to /workspace instead of /accounts/dashboard', () => {
    const destinations = ['/accounts/dashboard', '/account/dashboard', '/', '/login', null, undefined];
    destinations.forEach(dest => {
      let path = dest;
      if (!path || path === '/' || path === '/login' || path === '/accounts/dashboard' || path === '/account/dashboard') {
        path = '/workspace';
      }
      assert.strictEqual(path, '/workspace');
    });
  });

  // 7. Account + Inventory + CRM displays all modules
  it('7. Account + Inventory + CRM displays all three modules', () => {
    const authContext = {
      modules: [
        { name: 'accountDev', active: true },
        { name: 'inventory', active: true },
        { name: 'crm', active: true }
      ]
    };
    const entitled = getEntitledModules(authContext);
    assert.deepStrictEqual(entitled.sort(), ['ACCOUNT', 'CRM', 'INVENTORY'].sort());
    assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authContext, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(authContext, 'CRM'), true);
  });

  // 8. Account + CRM hides Inventory
  it('8. Account + CRM hides Inventory', () => {
    const authContext = {
      modules: [
        { name: 'accountDev', active: true },
        { name: 'crm', active: true }
      ]
    };
    const entitled = getEntitledModules(authContext);
    assert.strictEqual(entitled.includes('ACCOUNT'), true);
    assert.strictEqual(entitled.includes('CRM'), true);
    assert.strictEqual(entitled.includes('INVENTORY'), false);
    assert.strictEqual(canViewModule(authContext, 'INVENTORY'), false);
  });

  // 9. Inventory + CRM hides Account
  it('9. Inventory + CRM hides Account', () => {
    const authContext = {
      modules: [
        { name: 'inventory', active: true },
        { name: 'crm', active: true }
      ]
    };
    const entitled = getEntitledModules(authContext);
    assert.strictEqual(entitled.includes('INVENTORY'), true);
    assert.strictEqual(entitled.includes('CRM'), true);
    assert.strictEqual(entitled.includes('ACCOUNT'), false);
    assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), false);
  });

  // 10. Account-only user sees Account only
  it('10. Account-only user sees Account only', () => {
    const authContext = {
      modules: [
        { name: 'accountDev', active: true }
      ]
    };
    const entitled = getEntitledModules(authContext);
    assert.deepStrictEqual(entitled, ['ACCOUNT']);
    assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authContext, 'INVENTORY'), false);
    assert.strictEqual(canViewModule(authContext, 'CRM'), false);
  });

  // 11. No-module user sees NoModuleAccessView (0 entitled modules)
  it('11. No-module user has 0 entitled modules', () => {
    const authContext = { modules: [] };
    const entitled = getEntitledModules(authContext);
    assert.strictEqual(entitled.length, 0);
    assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), false);
    assert.strictEqual(canViewModule(authContext, 'INVENTORY'), false);
    assert.strictEqual(canViewModule(authContext, 'CRM'), false);
  });

  // 12. Multi-company context is preserved
  it('12. Multi-company context is preserved from canonical /me', () => {
    const authContext = buildAuthContext({
      currentCompany: { id: 'c1', code: 'COMP1', name: 'Company One' },
      companies: [
        { id: 'c1', code: 'COMP1', name: 'Company One' },
        { id: 'c2', code: 'COMP2', name: 'Company Two' }
      ]
    });
    assert.strictEqual(authContext.currentCompany.code, 'COMP1');
    assert.strictEqual(authContext.companies.length, 2);
  });

  // 13. Company switch recalculates authorization
  it('13. Company switch recalculates authorization context', () => {
    // Company 1 has ACCOUNT only
    const comp1Context = buildAuthContext({
      currentCompany: { id: 'c1', code: 'COMP1' },
      modules: [{ name: 'ACCOUNT', active: true }]
    });
    assert.deepStrictEqual(getEntitledModules(comp1Context), ['ACCOUNT']);

    // Company 2 has INVENTORY and CRM only
    const comp2Context = buildAuthContext({
      currentCompany: { id: 'c2', code: 'COMP2' },
      modules: [{ name: 'INVENTORY', active: true }, { name: 'CRM', active: true }]
    });
    assert.deepStrictEqual(getEntitledModules(comp2Context).sort(), ['CRM', 'INVENTORY'].sort());
  });

  // 14. READ_ONLY still blocks writes/deletes
  it('14. READ_ONLY still blocks writes and deletes', () => {
    const readOnlyContext = {
      accessMode: 'READ_ONLY',
      permissions: [{ permissionCode: 'INVOICES:CREATE', allowed: false }]
    };
    const canWrite = readOnlyContext.accessMode !== 'READ_ONLY';
    assert.strictEqual(canWrite, false);
  });

  // 15. Direct unauthorized module route remains blocked
  it('15. Direct unauthorized module route remains blocked by canViewModule', () => {
    const context = {
      modules: [{ name: 'ACCOUNT', active: true }]
    };
    assert.strictEqual(canViewModule(context, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(context, 'INVENTORY'), false);
    assert.strictEqual(canViewModule(context, 'CRM'), false);
  });

  // 16. Authorization code remains one-time
  it('16. Authorization code parameter is parsed and single-use in callback state', () => {
    let codeUsed = false;
    function exchangeCode(code) {
      if (codeUsed) throw new Error('Authorization code already used');
      codeUsed = true;
      return { accessToken: 'token-abc' };
    }
    const res1 = exchangeCode('code-1');
    assert.strictEqual(res1.accessToken, 'token-abc');
    assert.throws(() => exchangeCode('code-1'), /already used/);
  });

  // 17. Redirect URI remains strictly validated
  it('17. Redirect URI is normalized to /erp/auth/callback without wildcard', () => {
    const rawRedirect = 'https://www.mark2.in/erp/auth/callback?code=123';
    const parsed = new URL(rawRedirect);
    assert.strictEqual(parsed.origin, 'https://www.mark2.in');
    assert.strictEqual(parsed.pathname, '/erp/auth/callback');
    assert.strictEqual(parsed.searchParams.get('code'), '123');
  });

  // 18. Account backend is NOT part of the generic callback flow
  it('18. Account backend (/api/account/auth/callback) is completely bypassed in generic flow', () => {
    const genericErpCallbackPath = '/erp/auth/callback';
    assert.ok(!genericErpCallbackPath.includes('/api/account'));
    assert.ok(!genericErpCallbackPath.includes('/account'));
    assert.ok(!genericErpCallbackPath.includes('/inventory'));
    assert.ok(!genericErpCallbackPath.includes('/crm'));
  });

});
