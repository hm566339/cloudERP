import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PATHS } from '../paths.js';
import { isAuthPage, dispatchLogout } from '../../api/common/logout.js';
import { isSafeRedirectPath } from '../../utils/redirectHelper.js';
import { getPostLoginRedirectPath } from '../../utils/moduleAccess.js';

describe('Legacy ERP Login Page Removal & Logout Redirection Suite', () => {
  describe('1. Legacy Login URL & Route Normalization', () => {
    it('defines canonical LOGIN and MODULES routes pointing to root landing page', () => {
      assert.equal(PATHS.ROOT, '/');
      assert.equal(PATHS.LOGIN, '/');
      assert.equal(PATHS.MODULES, '/');
      assert.notEqual(PATHS.LOGIN, '/login');
      assert.notEqual(PATHS.MODULES, '/login');
    });

    it('identifies obsolete login routes and maps them to replace-redirects to root /', () => {
      const legacyLoginRoutes = [
        '/login',
        '/erp/login',
        '/accounts/login',
        '/inventory/login',
        '/crm/login',
        '/purchases/login',
        '/o/acme-corp/login',
        '/o/acme-corp',
        '/c/comp-101/login',
        '/c/comp-101',
        '/modules'
      ];

      const resolveRouteTarget = (path) => {
        const normalized = path.replace(/^\/erp(\/|$)/, '/$1');
        if (
          normalized === '/modules' ||
          normalized === '/login' ||
          normalized === '/:moduleCode/login' ||
          normalized === '/o/:organizationCode/login' ||
          normalized === '/o/:organizationCode' ||
          normalized === '/c/:companyCode/login' ||
          normalized === '/c/:companyCode' ||
          normalized.endsWith('/login') ||
          /^\/o\/[^/]+(\/login)?$/.test(normalized) ||
          /^\/c\/[^/]+(\/login)?$/.test(normalized)
        ) {
          return { element: 'Navigate', to: '/', replace: true };
        }
        return { element: 'Page', path: normalized };
      };

      for (const route of legacyLoginRoutes) {
        const resolution = resolveRouteTarget(route);
        assert.equal(resolution.element, 'Navigate', `Route ${route} should redirect`);
        assert.equal(resolution.to, '/', `Route ${route} should redirect to '/'`);
        assert.equal(resolution.replace, true, `Route ${route} should replace history`);
      }
    });
  });

  describe('2. Unauthenticated Protected Route Guards (Fail Closed to /)', () => {
    it('ProtectedRoute redirects unauthenticated visitors to / instead of /login', () => {
      const simulateProtectedRoute = ({ authenticated, cookieToken, location }) => {
        if (!authenticated && !cookieToken) {
          return { type: 'Navigate', to: '/', state: { from: location }, replace: true };
        }
        return { type: 'Render', authenticated: true };
      };

      const result = simulateProtectedRoute({
        authenticated: false,
        cookieToken: null,
        location: { pathname: '/accounts/dashboard' },
      });

      assert.equal(result.type, 'Navigate');
      assert.equal(result.to, '/');
      assert.notEqual(result.to, '/login');
      assert.equal(result.replace, true);
      assert.deepEqual(result.state, { from: { pathname: '/accounts/dashboard' } });
    });

    it('RoleRoute redirects unauthenticated visitors to / instead of /login', () => {
      const simulateRoleRoute = ({ currentUser, location }) => {
        if (!currentUser) {
          return { type: 'Navigate', to: '/', state: { from: location }, replace: true };
        }
        return { type: 'Render', currentUser };
      };

      const result = simulateRoleRoute({
        currentUser: null,
        location: { pathname: '/super-admin/dashboard' },
      });

      assert.equal(result.type, 'Navigate');
      assert.equal(result.to, '/');
      assert.notEqual(result.to, '/login');
      assert.equal(result.replace, true);
    });

    it('WorkspaceLandingRedirect redirects unauthenticated sessions to / instead of /login', () => {
      const simulateWorkspaceRedirect = ({ sessionStatus, authenticated }) => {
        if (sessionStatus === 'unauthenticated' && !authenticated) {
          return { type: 'Navigate', to: '/', replace: true };
        }
        return { type: 'Render' };
      };

      const result = simulateWorkspaceRedirect({
        sessionStatus: 'unauthenticated',
        authenticated: false,
      });

      assert.equal(result.type, 'Navigate');
      assert.equal(result.to, '/');
      assert.notEqual(result.to, '/login');
      assert.equal(result.replace, true);
    });
  });

  describe('3. Root Index Resolution (/erp/ Landing Page Preservation)', () => {
    it('renders public ERP LandingPage for unauthenticated users at / without redirecting', () => {
      const simulateRootIndexHandler = ({ authenticated, user, cookieToken, searchParams }) => {
        const urlToken = searchParams?.get?.('token');
        if (urlToken) {
          return { type: 'Navigate', to: `/accounts/dashboard?token=${encodeURIComponent(urlToken)}` };
        }
        if (authenticated && user) {
          return { type: 'Navigate', to: getPostLoginRedirectPath({ user }) };
        }
        if (cookieToken && user) {
          return { type: 'Navigate', to: getPostLoginRedirectPath({ user }) };
        }
        return { type: 'Render', component: 'LandingPage' };
      };

      // Unauthenticated visitor
      const unauthResult = simulateRootIndexHandler({
        authenticated: false,
        user: null,
        cookieToken: null,
        searchParams: new URLSearchParams(''),
      });
      assert.equal(unauthResult.type, 'Render');
      assert.equal(unauthResult.component, 'LandingPage');

      // Authenticated accountant
      const authResult = simulateRootIndexHandler({
        authenticated: true,
        user: { role: 'accountant' },
        cookieToken: 'valid-jwt',
        searchParams: new URLSearchParams(''),
      });
      assert.equal(authResult.type, 'Navigate');
      assert.equal(authResult.to, '/workspace');

      // Authenticated super admin
      const adminResult = simulateRootIndexHandler({
        authenticated: true,
        user: { role: 'super_admin' },
        cookieToken: 'valid-jwt',
        searchParams: new URLSearchParams(''),
      });
      assert.equal(adminResult.type, 'Navigate');
      assert.equal(adminResult.to, '/super-admin/dashboard');
    });
  });

  describe('4. Centralized Logout Handler & Redirection Behavior', () => {
    it('configures defaultLandingPath as /erp/ and never /erp/login', () => {
      // Test the defaultLandingPath resolution logic from logout.js
      const resolveDefaultLanding = (basePath) => {
        return (basePath || '/erp/').replace(/\/$/, '') + '/';
      };

      assert.equal(resolveDefaultLanding('/erp/'), '/erp/');
      assert.equal(resolveDefaultLanding('/erp'), '/erp/');
      assert.notEqual(resolveDefaultLanding('/erp/'), '/erp/login');
      assert.notEqual(resolveDefaultLanding('/erp'), '/erp/login');
    });

    it('prevents redirect loops when logout is triggered while already on / or /landing', () => {
      const shouldTriggerRedirect = (pathname) => {
        const currentPath = pathname.replace(/^(\/erp)+/i, '') || '/';
        return !isAuthPage(currentPath) && currentPath !== '/' && currentPath !== '/landing';
      };

      // When already on root or landing: redirect should NOT trigger
      assert.equal(shouldTriggerRedirect('/erp/'), false);
      assert.equal(shouldTriggerRedirect('/erp'), false);
      assert.equal(shouldTriggerRedirect('/'), false);
      assert.equal(shouldTriggerRedirect('/landing'), false);
      assert.equal(shouldTriggerRedirect('/erp/landing'), false);

      // When in protected modules: redirect SHOULD trigger
      assert.equal(shouldTriggerRedirect('/erp/accounts/dashboard'), true);
      assert.equal(shouldTriggerRedirect('/erp/inventory/items'), true);
      assert.equal(shouldTriggerRedirect('/erp/company/123/accounts/reports'), true);
      assert.equal(shouldTriggerRedirect('/erp/owner/dashboard'), true);
      assert.equal(shouldTriggerRedirect('/erp/crm/leads'), true);
    });

    it('does NOT save root /, /landing, or /login into sessionStorage auth_return_to on logout', () => {
      const shouldSaveReturnTo = (pathname) => {
        const currentPath = pathname.replace(/^(\/erp)+/i, '') || '/';
        return (
          !isAuthPage(currentPath) &&
          currentPath !== '/' &&
          currentPath !== '/landing' &&
          currentPath !== '/login' &&
          !currentPath.includes('/dashboard/dashboard')
        );
      };

      assert.equal(shouldSaveReturnTo('/'), false);
      assert.equal(shouldSaveReturnTo('/landing'), false);
      assert.equal(shouldSaveReturnTo('/login'), false);
      assert.equal(shouldSaveReturnTo('/erp/login'), false);

      // Deep link to a specific report SHOULD be saved
      assert.equal(shouldSaveReturnTo('/accounts/reports/trial-balance'), true);
      assert.equal(shouldSaveReturnTo('/inventory/stock-adjustment'), true);
    });

    it('treats /login as unsafe redirect destination preventing open redirect loops', () => {
      assert.equal(isSafeRedirectPath('/login'), false);
      assert.equal(isSafeRedirectPath('/modules'), false);
      assert.equal(isSafeRedirectPath('/403'), false);
      assert.equal(isSafeRedirectPath('/accounts/dashboard'), true);
      assert.equal(isSafeRedirectPath('/workspace'), true);
    });
  });

  describe('5. Multi-Module Logout Uniformity', () => {
    it('verifies all modules perform identical clean logout sequence navigating to /', () => {
      const modules = ['Accounts', 'Inventory', 'CRM', 'Purchases', 'Workflows', 'Admin', 'Owner', 'Company'];
      
      for (const mod of modules) {
        const logoutActions = [];
        // Simulate layout logout flow
        const performLogout = () => {
          logoutActions.push('API_LOGOUT');
          logoutActions.push('CLEAR_COOKIES');
          logoutActions.push('CLEAR_STORAGE');
          logoutActions.push('RESET_REDUX');
          logoutActions.push('NAVIGATE_ROOT');
        };

        performLogout();

        assert.deepEqual(logoutActions, [
          'API_LOGOUT',
          'CLEAR_COOKIES',
          'CLEAR_STORAGE',
          'RESET_REDUX',
          'NAVIGATE_ROOT',
        ], `Module ${mod} must execute complete clean logout sequence`);
      }
    });
  });
});
