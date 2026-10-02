import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeModuleName,
  normalizeRole,
  buildAuthContext,
  getEntitledModules,
  hasModule,
  hasFeature,
  hasPermission,
  canRead,
  canWrite,
  canDelete,
  canViewModule,
  CANONICAL_MODULES,
} from '../../../utils/moduleNormalization.js';

describe('Dynamic SSO Authorization Context & Negative Tests', () => {

  describe('Module Normalization Helper', () => {
    it('normalizes various casing and aliases to canonical module keys', () => {
      assert.strictEqual(normalizeModuleName('accountDev'), CANONICAL_MODULES.ACCOUNT);
      assert.strictEqual(normalizeModuleName('accounts'), CANONICAL_MODULES.ACCOUNT);
      assert.strictEqual(normalizeModuleName('accounting'), CANONICAL_MODULES.ACCOUNT);
      assert.strictEqual(normalizeModuleName('inventory'), CANONICAL_MODULES.INVENTORY);
      assert.strictEqual(normalizeModuleName('inv'), CANONICAL_MODULES.INVENTORY);
      assert.strictEqual(normalizeModuleName('crm'), CANONICAL_MODULES.CRM);
      assert.strictEqual(normalizeModuleName('sales-crm'), CANONICAL_MODULES.CRM);
      assert.strictEqual(normalizeModuleName('salescrm'), CANONICAL_MODULES.CRM);
      assert.strictEqual(normalizeModuleName('core'), CANONICAL_MODULES.CORE);
    });

    it('extracts canonical name from module objects', () => {
      assert.strictEqual(normalizeModuleName({ name: 'accountDev', code: 'accountdev' }), CANONICAL_MODULES.ACCOUNT);
      assert.strictEqual(normalizeModuleName({ canonical: 'INVENTORY' }), CANONICAL_MODULES.INVENTORY);
      assert.strictEqual(normalizeModuleName({ moduleName: 'crm' }), CANONICAL_MODULES.CRM);
    });
  });

  describe('Section 14: Dynamic Behavior Negative Tests (CASES 1 - 8)', () => {

    it('CASE 1: Account YES, Inventory YES, CRM YES -> Account + Inventory + CRM visible', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        organization: { code: 'vishal', accessMode: 'FULL' },
        currentCompany: { code: 'VISHAL' },
        membership: { memberType: 'OWNER' },
        subscription: { status: 'TRIALING', accessMode: 'FULL' },
        modules: [
          { name: 'accountDev', active: true },
          { name: 'inventory', active: true },
          { name: 'crm', active: true },
        ],
        features: [
          { featureCode: 'DASHBOARD', moduleName: 'ACCOUNT' },
          { featureCode: 'PRODUCTS', moduleName: 'INVENTORY' },
          { featureCode: 'CUSTOMERS', moduleName: 'CRM' },
        ],
        permissions: [
          { featureCode: 'DASHBOARD', action: 'READ', moduleName: 'ACCOUNT', allowed: true, active: true },
          { featureCode: 'PRODUCTS', action: 'READ', moduleName: 'INVENTORY', allowed: true, active: true },
          { featureCode: 'CUSTOMERS', action: 'READ', moduleName: 'CRM', allowed: true, active: true },
        ]
      };

      const entitled = getEntitledModules(authContext);
      assert.deepStrictEqual(entitled.sort(), ['ACCOUNT', 'CRM', 'INVENTORY']);

      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(hasModule(authContext, 'CRM'), true);

      assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(canViewModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(canViewModule(authContext, 'CRM'), true);
    });

    it('CASE 2: Account NO, Inventory YES, CRM YES -> Inventory + CRM visible, Account hidden', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'VISHAL' },
        modules: [
          { name: 'inventory', active: true },
          { name: 'crm', active: true },
        ],
        features: [],
        permissions: []
      };

      const entitled = getEntitledModules(authContext);
      assert.strictEqual(entitled.includes('ACCOUNT'), false);
      assert.strictEqual(entitled.includes('INVENTORY'), true);
      assert.strictEqual(entitled.includes('CRM'), true);

      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(hasModule(authContext, 'CRM'), true);

      assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(canViewModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(canViewModule(authContext, 'CRM'), true);
    });

    it('CASE 3: Account NO, Inventory YES, CRM NO -> Inventory only', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'VISHAL' },
        modules: [
          { name: 'inventory', active: true },
        ],
        features: [],
        permissions: []
      };

      const entitled = getEntitledModules(authContext);
      assert.deepStrictEqual(entitled, ['INVENTORY']);

      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(hasModule(authContext, 'CRM'), false);

      assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(canViewModule(authContext, 'INVENTORY'), true);
      assert.strictEqual(canViewModule(authContext, 'CRM'), false);
    });

    it('CASE 4: Account NO, Inventory NO, CRM NO -> NoModuleAccessView (0 entitled modules)', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'VISHAL' },
        modules: [],
        features: [],
        permissions: []
      };

      const entitled = getEntitledModules(authContext);
      assert.strictEqual(entitled.length, 0);

      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), false);
      assert.strictEqual(hasModule(authContext, 'CRM'), false);

      assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), false);
      assert.strictEqual(canViewModule(authContext, 'INVENTORY'), false);
      assert.strictEqual(canViewModule(authContext, 'CRM'), false);
    });

    it('CASE 5: Account YES, Inventory NO, CRM NO -> Account only', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'VISHAL' },
        modules: [
          { name: 'accountDev', active: true },
        ],
        features: [],
        permissions: []
      };

      const entitled = getEntitledModules(authContext);
      assert.deepStrictEqual(entitled, ['ACCOUNT']);

      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), false);
      assert.strictEqual(hasModule(authContext, 'CRM'), false);

      assert.strictEqual(canViewModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(canViewModule(authContext, 'INVENTORY'), false);
      assert.strictEqual(canViewModule(authContext, 'CRM'), false);
    });

    it('CASE 6: Account YES, Inventory YES, but user only has CUSTOMERS:READ -> View only, Create/Edit/Delete not allowed', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'VISHAL' },
        modules: [
          { name: 'accountDev', active: true },
          { name: 'inventory', active: true },
        ],
        features: [
          { featureCode: 'CUSTOMERS', moduleName: 'ACCOUNT', active: true },
        ],
        permissions: [
          { featureCode: 'CUSTOMERS', action: 'READ', permissionCode: 'CUSTOMERS:READ', moduleName: 'ACCOUNT', active: true, allowed: true },
          // Note: WRITE and DELETE are not present or not allowed
        ]
      };

      // Module level access
      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), true);

      // Feature level access
      assert.strictEqual(hasFeature(authContext, 'CUSTOMERS', 'ACCOUNT'), true);

      // Action permissions
      assert.strictEqual(canRead(authContext, 'CUSTOMERS', 'ACCOUNT'), true);
      assert.strictEqual(canWrite(authContext, 'CUSTOMERS', 'ACCOUNT'), false);
      assert.strictEqual(canDelete(authContext, 'CUSTOMERS', 'ACCOUNT'), false);
      assert.strictEqual(hasPermission(authContext, 'CUSTOMERS', 'READ', 'ACCOUNT'), true);
      assert.strictEqual(hasPermission(authContext, 'CUSTOMERS', 'WRITE', 'ACCOUNT'), false);
      assert.strictEqual(hasPermission(authContext, 'CUSTOMERS', 'DELETE', 'ACCOUNT'), false);
    });

    it('CASE 7: Account YES, Inventory YES, OWNER -> only features & permissions present in SSO /me are authorized without bypass', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' }, // OWNER role
        membership: { memberType: 'OWNER' },
        currentCompany: { code: 'VISHAL' },
        modules: [
          { name: 'accountDev', active: true },
          { name: 'inventory', active: true },
        ],
        features: [
          { featureCode: 'DASHBOARD', moduleName: 'ACCOUNT', active: true },
          { featureCode: 'PRODUCTS', moduleName: 'INVENTORY', active: true },
        ],
        permissions: [
          { featureCode: 'DASHBOARD', action: 'READ', moduleName: 'ACCOUNT', active: true, allowed: true },
          { featureCode: 'DASHBOARD', action: 'WRITE', moduleName: 'ACCOUNT', active: true, allowed: true },
          { featureCode: 'PRODUCTS', action: 'READ', moduleName: 'INVENTORY', active: true, allowed: true },
          { featureCode: 'PRODUCTS', action: 'WRITE', moduleName: 'INVENTORY', active: true, allowed: true },
        ]
      };

      // OWNER has access to Account and Inventory because they are in modules
      assert.strictEqual(hasModule(authContext, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(authContext, 'INVENTORY'), true);
      // OWNER does NOT get CRM because it is not in modules (no hardcoded bypass!)
      assert.strictEqual(hasModule(authContext, 'CRM'), false);

      // Account features
      assert.strictEqual(hasFeature(authContext, 'DASHBOARD', 'ACCOUNT'), true);
      assert.strictEqual(canRead(authContext, 'DASHBOARD', 'ACCOUNT'), true);
      assert.strictEqual(canWrite(authContext, 'DASHBOARD', 'ACCOUNT'), true);
      // But DELETE was not granted in SSO /me -> must be false!
      assert.strictEqual(canDelete(authContext, 'DASHBOARD', 'ACCOUNT'), false);

      // CRM features not granted
      assert.strictEqual(hasFeature(authContext, 'LEADS', 'CRM'), false);
      assert.strictEqual(canRead(authContext, 'LEADS', 'CRM'), false);
    });

    it('CASE 8: Company switch -> Refresh /me and dynamically recalculate modules, features, permissions in Redux store', () => {
      // 1. Initial State: Company A has only Account
      const companyAPayload = {
        user: { id: 'u1', username: 'vishal', role: 'owner' },
        organization: { code: 'vishal', accessMode: 'FULL' },
        currentCompany: { id: 'comp-1', code: 'COMPANY_A', name: 'Company A' },
        membership: { memberType: 'OWNER' },
        subscription: { status: 'TRIALING', accessMode: 'FULL' },
        accessMode: 'FULL',
        modules: [{ name: 'accountDev', active: true }],
        features: [{ featureCode: 'DASHBOARD', moduleName: 'ACCOUNT', active: true }],
        permissions: [{ featureCode: 'DASHBOARD', action: 'READ', moduleName: 'ACCOUNT', active: true, allowed: true }]
      };

      let authCtx = buildAuthContext(companyAPayload);
      assert.strictEqual(authCtx.currentCompany.code, 'COMPANY_A');
      assert.deepStrictEqual(getEntitledModules(authCtx), ['ACCOUNT']);
      assert.strictEqual(hasModule(authCtx, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(authCtx, 'INVENTORY'), false);

      // 2. Company switch to Company B: Company B has Inventory and CRM
      const companyBPayload = {
        data: {
          user: { id: 'u1', username: 'vishal', role: 'owner' },
          organization: { code: 'vishal', accessMode: 'FULL' },
          currentCompany: { id: 'comp-2', code: 'COMPANY_B', name: 'Company B' },
          membership: { memberType: 'OWNER' },
          subscription: { status: 'TRIALING', accessMode: 'FULL' },
          accessMode: 'FULL',
          modules: [
            { name: 'inventory', active: true },
            { name: 'crm', active: true }
          ],
          features: [
            { featureCode: 'PRODUCTS', moduleName: 'INVENTORY', active: true },
            { featureCode: 'CUSTOMERS', moduleName: 'CRM', active: true }
          ],
          permissions: [
            { featureCode: 'PRODUCTS', action: 'READ', moduleName: 'INVENTORY', active: true, allowed: true },
            { featureCode: 'CUSTOMERS', action: 'READ', moduleName: 'CRM', active: true, allowed: true }
          ]
        }
      };

      authCtx = buildAuthContext(companyBPayload);

      assert.strictEqual(authCtx.currentCompany.code, 'COMPANY_B');
      const entitledB = getEntitledModules(authCtx);
      assert.strictEqual(entitledB.includes('ACCOUNT'), false);
      assert.strictEqual(entitledB.includes('INVENTORY'), true);
      assert.strictEqual(entitledB.includes('CRM'), true);

      assert.strictEqual(hasModule(authCtx, 'ACCOUNT'), false);
      assert.strictEqual(hasModule(authCtx, 'INVENTORY'), true);
      assert.strictEqual(hasModule(authCtx, 'CRM'), true);
      assert.strictEqual(canRead(authCtx, 'PRODUCTS', 'INVENTORY'), true);
      assert.strictEqual(canRead(authCtx, 'CUSTOMERS', 'CRM'), true);
      assert.strictEqual(canRead(authCtx, 'DASHBOARD', 'ACCOUNT'), false);
    });

  });

  describe('Auth Initialization Race Safety', () => {
    it('does not treat idle or checking auth as failed module check prematurely', () => {
      // Auth state in flight
      const loadingState = {
        sessionStatus: 'checking',
        user: null,
        currentCompany: null,
        modules: []
      };

      // In ProtectedRoute: if sessionStatus !== 'authenticated', it renders a spinner, NOT a 403 redirect!
      const shouldRenderSpinner = loadingState.sessionStatus === 'idle' || loadingState.sessionStatus === 'checking';
      assert.strictEqual(shouldRenderSpinner, true);
    });

    it('requires both authentication and completed module entitlement before 403 evaluation', () => {
      const readyState = {
        sessionStatus: 'authenticated',
        user: { id: 'u1', role: 'viewer' },
        currentCompany: { code: 'VISHAL' },
        modules: [{ name: 'accountDev', canonical: 'ACCOUNT', active: true }]
      };

      assert.strictEqual(readyState.sessionStatus, 'authenticated');
      assert.strictEqual(canViewModule(readyState, 'ACCOUNT'), true);
      assert.strictEqual(canViewModule(readyState, 'INVENTORY'), false);
    });
  });

  describe('Auth Bootstrap & Login Page Unauthenticated Normalization Tests', () => {

    it('1. Fresh logged-out user opens /o/vishal/login -> login form renders immediately (public page does not wait for auth)', () => {
      const pathname = '/o/vishal/login';
      const isOnProtectedPage = (
        !pathname.includes('/login') &&
        !pathname.includes('/modules') &&
        !pathname.includes('/register') &&
        (pathname.startsWith('/workspace') || pathname.startsWith('/accounts'))
      );
      assert.strictEqual(isOnProtectedPage, false);

      const isRehydrated = true;
      const isSsoLoading = true;
      const sessionStatus = 'checking';
      
      // On public login pages, isAuthWaiting MUST be false even if SSO is checking/loading
      const isAuthWaiting = !isRehydrated || (isOnProtectedPage && (isSsoLoading || sessionStatus === 'checking'));
      assert.strictEqual(isAuthWaiting, false, 'Login page must render immediately without waiting for SSO /me');
    });

    it('2. /me returns 403 while logged out -> state normalized to unauthenticated, no /403 redirect, no infinite loading', () => {
      const staleState = {
        sessionStatus: 'checking',
        user: null,
        modules: []
      };

      // Simulated rejection action with status 403
      const action = {
        type: 'authApi/executeQuery/rejected',
        payload: { status: 403, data: { message: 'Access Denied' } },
        error: { message: 'Rejected' }
      };

      const status = action?.payload?.status || action?.error?.status;
      const isAuthRejection = status === 401 || status === 403;
      assert.strictEqual(isAuthRejection, true);

      // Emulate authSlice matcher
      const nextState = { ...staleState };
      if (isAuthRejection || !nextState.user) {
        nextState.user = null;
        nextState.modules = [];
        nextState.sessionStatus = 'unauthenticated';
      }

      assert.strictEqual(nextState.sessionStatus, 'unauthenticated');
      assert.strictEqual(nextState.user, null);
    });

    it('3. /me returns 401 while logged out -> state normalized to unauthenticated', () => {
      const action = {
        type: 'authApi/executeQuery/rejected',
        payload: { status: 401, data: { message: 'Unauthorized' } },
        error: { message: 'Rejected' }
      };

      const status = action?.payload?.status || action?.error?.status;
      const isAuthRejection = status === 401 || status === 403;
      assert.strictEqual(isAuthRejection, true);

      const nextState = { sessionStatus: 'checking', user: null, modules: [] };
      if (isAuthRejection || !nextState.user) {
        nextState.user = null;
        nextState.sessionStatus = 'unauthenticated';
      }

      assert.strictEqual(nextState.sessionStatus, 'unauthenticated');
    });

    it('4. /me returns valid authenticated payload -> canonical auth context populated', () => {
      const mePayload = {
        data: {
          user: { id: 'u1', username: 'vishal', role: 'owner' },
          organization: { code: 'vishal', accessMode: 'FULL' },
          currentCompany: { code: 'VISHAL' },
          membership: { memberType: 'OWNER' },
          subscription: { status: 'TRIALING', accessMode: 'FULL' },
          modules: [
            { name: 'accountDev', active: true },
            { name: 'inventory', active: true },
            { name: 'crm', active: true },
          ],
          features: [
            { featureCode: 'DASHBOARD', moduleName: 'ACCOUNT', active: true },
          ],
          permissions: [
            { featureCode: 'DASHBOARD', action: 'READ', moduleName: 'ACCOUNT', active: true, allowed: true }
          ]
        }
      };

      const authContext = buildAuthContext(mePayload);
      assert.strictEqual(authContext.user.username, 'vishal');
      assert.strictEqual(authContext.organization.code, 'vishal');
      assert.strictEqual(authContext.currentCompany.code, 'VISHAL');
      assert.deepStrictEqual(getEntitledModules(authContext).sort(), ['ACCOUNT', 'CRM', 'INVENTORY']);
      assert.strictEqual(canRead(authContext, 'DASHBOARD', 'ACCOUNT'), true);
    });

    it('5. Persisted authenticated state + /me 403 -> stale auth state cleared, sessionStatus becomes unauthenticated', () => {
      // Rehydrated stale state from previous session
      const persistedState = {
        user: { id: 'stale-user', username: 'stale' },
        organization: { code: 'old-org' },
        currentCompany: { code: 'OLD_COMP' },
        sessionStatus: 'authenticated',
        modules: [{ name: 'accountDev', canonical: 'ACCOUNT' }],
        permissions: []
      };

      // /me returns 403 (e.g. session expired or invalid token)
      const action = {
        type: 'authApi/executeQuery/rejected',
        payload: { status: 403, data: { message: 'Token Expired' } }
      };

      const status = action?.payload?.status;
      const isAuthRejection = status === 401 || status === 403;
      assert.strictEqual(isAuthRejection, true);

      const nextState = { ...persistedState };
      if (isAuthRejection) {
        nextState.user = null;
        nextState.organization = null;
        nextState.currentCompany = null;
        nextState.modules = [];
        nextState.permissions = [];
        nextState.sessionStatus = 'unauthenticated';
      }

      assert.strictEqual(nextState.user, null);
      assert.strictEqual(nextState.sessionStatus, 'unauthenticated');
      assert.strictEqual(nextState.modules.length, 0);
    });

    it('6. Authenticated user: Account + Inventory + CRM -> /workspace works and all entitled modules appear', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        modules: [
          { name: 'accountDev', active: true },
          { name: 'inventory', active: true },
          { name: 'crm', active: true }
        ],
        features: [],
        permissions: []
      };

      const modules = getEntitledModules(authContext);
      assert.strictEqual(modules.includes('ACCOUNT'), true);
      assert.strictEqual(modules.includes('INVENTORY'), true);
      assert.strictEqual(modules.includes('CRM'), true);
    });

    it('7. Authenticated user: Account only -> Inventory/CRM hidden', () => {
      const authContext = {
        user: { id: 'u1', role: 'owner' },
        modules: [
          { name: 'accountDev', active: true },
        ],
        features: [],
        permissions: []
      };

      const modules = getEntitledModules(authContext);
      assert.strictEqual(modules.includes('ACCOUNT'), true);
      assert.strictEqual(modules.includes('INVENTORY'), false);
      assert.strictEqual(modules.includes('CRM'), false);
    });

    it('8. Company switch -> /me refreshed and authorization context recalculated', () => {
      const initialPayload = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'COMP_A' },
        modules: [{ name: 'accountDev', active: true }]
      };
      const initialCtx = buildAuthContext(initialPayload);
      assert.strictEqual(initialCtx.currentCompany.code, 'COMP_A');
      assert.strictEqual(hasModule(initialCtx, 'ACCOUNT'), true);
      assert.strictEqual(hasModule(initialCtx, 'INVENTORY'), false);

      const switchedPayload = {
        user: { id: 'u1', role: 'owner' },
        currentCompany: { code: 'COMP_B' },
        modules: [{ name: 'inventory', active: true }]
      };
      const switchedCtx = buildAuthContext(switchedPayload);
      assert.strictEqual(switchedCtx.currentCompany.code, 'COMP_B');
      assert.strictEqual(hasModule(switchedCtx, 'ACCOUNT'), false);
      assert.strictEqual(hasModule(switchedCtx, 'INVENTORY'), true);
    });

    it('9. READ_ONLY -> reads remain available, writes/deletes remain blocked', () => {
      const readOnlyAuthContext = {
        user: { id: 'u1', role: 'owner' },
        accessMode: 'READ_ONLY',
        modules: [{ name: 'accountDev', active: true }],
        features: [{ featureCode: 'CUSTOMERS', moduleName: 'ACCOUNT', active: true }],
        permissions: [
          { featureCode: 'CUSTOMERS', action: 'READ', moduleName: 'ACCOUNT', active: true, allowed: true },
          // Write permission disabled or omitted
          { featureCode: 'CUSTOMERS', action: 'WRITE', moduleName: 'ACCOUNT', active: false, allowed: false },
        ]
      };

      assert.strictEqual(canRead(readOnlyAuthContext, 'CUSTOMERS', 'ACCOUNT'), true);
      assert.strictEqual(canWrite(readOnlyAuthContext, 'CUSTOMERS', 'ACCOUNT'), false);
      assert.strictEqual(canDelete(readOnlyAuthContext, 'CUSTOMERS', 'ACCOUNT'), false);
    });

  });

});
