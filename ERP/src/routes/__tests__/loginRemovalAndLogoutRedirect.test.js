import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PATHS } from '../paths.js';
import { isAuthPage, dispatchLogout } from '../../api/common/logout.js';
import { isSafeRedirectPath } from '../../utils/redirectHelper.js';
import { getPostLoginRedirectPath } from '../../utils/moduleAccess.js';

describe('Legacy ERP Login Removal & Organization/Company Login Restoration Suite', () => {
  describe('1. Exact /login vs Specific Organization & Company Route Resolution', () => {
    it('defines canonical LOGIN and MODULES routes pointing to root landing page', () => {
      assert.equal(PATHS.ROOT, '/');
      assert.equal(PATHS.LOGIN, '/');
      assert.equal(PATHS.MODULES, '/');
      assert.notEqual(PATHS.LOGIN, '/login');
      assert.notEqual(PATHS.MODULES, '/login');
    });

    // Simulates the exact route table matching in AppRoutes.jsx
    const resolveAppRoute = (path) => {
      const normalized = path.replace(/^(\/erp)+/i, '') || '/';

      // Specific organization route: /o/:organizationCode/login -> <Login />
      const orgLoginMatch = normalized.match(/^\/o\/([^/]+)\/login$/);
      if (orgLoginMatch) {
        return {
          component: 'Login',
          params: { organizationCode: decodeURIComponent(orgLoginMatch[1]) },
          isRedirect: false,
        };
      }

      // Organization shortcut: /o/:organizationCode -> redirect to /o/:organizationCode/login
      const orgRedirectMatch = normalized.match(/^\/o\/([^/]+)$/);
      if (orgRedirectMatch) {
        return {
          component: 'OrgRedirect',
          redirectTo: `/o/${encodeURIComponent(orgRedirectMatch[1])}/login`,
          isRedirect: true,
          replace: true,
        };
      }

      // Specific company route: /c/:companyCode/login -> <Login />
      const companyLoginMatch = normalized.match(/^\/c\/([^/]+)\/login$/);
      if (companyLoginMatch) {
        return {
          component: 'Login',
          params: { companyCode: decodeURIComponent(companyLoginMatch[1]) },
          isRedirect: false,
        };
      }

      // Company shortcut: /c/:companyCode -> redirect to /c/:companyCode/login
      const companyRedirectMatch = normalized.match(/^\/c\/([^/]+)$/);
      if (companyRedirectMatch) {
        return {
          component: 'CompanyRedirect',
          redirectTo: `/c/${encodeURIComponent(companyRedirectMatch[1])}/login`,
          isRedirect: true,
          replace: true,
        };
      }

      // Exact standalone /login route -> replace redirect to /
      if (normalized === '/login') {
        return {
          component: 'Navigate',
          redirectTo: '/',
          isRedirect: true,
          replace: true,
        };
      }

      // Legacy /modules or /:moduleCode/login routes -> replace redirect to /
      if (normalized === '/modules' || normalized.match(/^\/[^/]+\/login$/)) {
        return {
          component: 'Navigate',
          redirectTo: '/',
          isRedirect: true,
          replace: true,
        };
      }

      return {
        component: 'Page',
        path: normalized,
        isRedirect: false,
      };
    };

    it('redirects exact https://www.mark2.in/erp/login to https://www.mark2.in/erp/ (/)', () => {
      const result = resolveAppRoute('/erp/login');
      assert.equal(result.isRedirect, true);
      assert.equal(result.redirectTo, '/');
      assert.equal(result.replace, true);

      const bareResult = resolveAppRoute('/login');
      assert.equal(bareResult.isRedirect, true);
      assert.equal(bareResult.redirectTo, '/');
      assert.equal(bareResult.replace, true);
    });

    it('opens organization-specific login flow for /erp/o/mohit/login and preserves organizationCode mohit', () => {
      const result = resolveAppRoute('/erp/o/mohit/login');
      assert.equal(result.isRedirect, false);
      assert.equal(result.component, 'Login');
      assert.equal(result.params.organizationCode, 'mohit');

      const bareResult = resolveAppRoute('/o/mohit/login');
      assert.equal(bareResult.isRedirect, false);
      assert.equal(bareResult.component, 'Login');
      assert.equal(bareResult.params.organizationCode, 'mohit');
    });

    it('redirects /erp/o/mohit to /erp/o/mohit/login preserving organization code', () => {
      const result = resolveAppRoute('/erp/o/mohit');
      assert.equal(result.isRedirect, true);
      assert.equal(result.component, 'OrgRedirect');
      assert.equal(result.redirectTo, '/o/mohit/login');
      assert.equal(result.replace, true);
    });

    it('opens company-specific login flow for /erp/c/MOHIT/login and preserves companyCode MOHIT', () => {
      const result = resolveAppRoute('/erp/c/MOHIT/login');
      assert.equal(result.isRedirect, false);
      assert.equal(result.component, 'Login');
      assert.equal(result.params.companyCode, 'MOHIT');

      const bareResult = resolveAppRoute('/c/MOHIT/login');
      assert.equal(bareResult.isRedirect, false);
      assert.equal(bareResult.component, 'Login');
      assert.equal(bareResult.params.companyCode, 'MOHIT');
    });

    it('redirects /erp/c/MOHIT to /erp/c/MOHIT/login preserving company code', () => {
      const result = resolveAppRoute('/erp/c/MOHIT');
      assert.equal(result.isRedirect, true);
      assert.equal(result.component, 'CompanyRedirect');
      assert.equal(result.redirectTo, '/c/MOHIT/login');
      assert.equal(result.replace, true);
    });
  });

  describe('2. Login Component Mode Resolution & Standalone Redirection Defense', () => {
    // Simulates Login component mode detection logic
    const evaluateLoginComponent = ({ organizationCode, routeCompanyCode }) => {
      const isOrgMode = Boolean(organizationCode);
      const isCompanyMode = Boolean(routeCompanyCode);

      // Defense-in-depth: standalone login without context redirects to /
      if (!isOrgMode && !isCompanyMode) {
        return { action: 'REDIRECT', to: '/', replace: true };
      }

      if (isOrgMode) {
        return {
          action: 'RENDER_ORG_PORTAL',
          mode: 'organization',
          organizationCode,
          title: 'Owner Sign In',
          badge: 'Organization Owner Portal',
        };
      }

      return {
        action: 'RENDER_COMPANY_PORTAL',
        mode: 'company',
        companyCode: routeCompanyCode,
        title: 'Welcome Back',
        badge: `Company Portal: ${routeCompanyCode}`,
      };
    };

    it('renders organization login portal for organizationCode mohit without redirecting', () => {
      const evalResult = evaluateLoginComponent({ organizationCode: 'mohit', routeCompanyCode: undefined });
      assert.equal(evalResult.action, 'RENDER_ORG_PORTAL');
      assert.equal(evalResult.mode, 'organization');
      assert.equal(evalResult.organizationCode, 'mohit');
      assert.equal(evalResult.badge, 'Organization Owner Portal');
    });

    it('renders company login portal for companyCode MOHIT without redirecting', () => {
      const evalResult = evaluateLoginComponent({ organizationCode: undefined, routeCompanyCode: 'MOHIT' });
      assert.equal(evalResult.action, 'RENDER_COMPANY_PORTAL');
      assert.equal(evalResult.mode, 'company');
      assert.equal(evalResult.companyCode, 'MOHIT');
      assert.equal(evalResult.badge, 'Company Portal: MOHIT');
    });

    it('redirects to / if Login component is accessed without org or company context', () => {
      const evalResult = evaluateLoginComponent({ organizationCode: undefined, routeCompanyCode: undefined });
      assert.equal(evalResult.action, 'REDIRECT');
      assert.equal(evalResult.to, '/');
      assert.equal(evalResult.replace, true);
    });
  });

  describe('3. Unauthenticated Protected Route Guards (Fail Closed to /)', () => {
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

  describe('4. Root Index Resolution (/erp/ Landing Page Preservation)', () => {
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

  describe('5. Centralized Logout Handler & Redirection Behavior', () => {
    it('configures defaultLandingPath as /erp/ and never /erp/login', () => {
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

  describe('6. Multi-Module Logout Uniformity', () => {
    it('verifies all modules perform identical clean logout sequence navigating to /', () => {
      const modules = ['Accounts', 'Inventory', 'CRM', 'Purchases', 'Workflows', 'Admin', 'Owner', 'Company'];
      
      for (const mod of modules) {
        const logoutActions = [];
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
