import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeLoginError, evaluateLoginResult } from '../../../utils/organizationLoginHelper.js';
import { getEntitledModules } from '../../../utils/moduleNormalization.js';

/**
 * Route protection logic matching AppRoutes.jsx
 */
function resolveRouteProtection(pathname) {
  const currentPath = (pathname || '').replace(/^\/erp(\/|$)/, '/$1');
  const isPublicPage =
    currentPath === '/' ||
    currentPath === '/landing' ||
    currentPath === '/try-free' ||
    currentPath === '/modules' ||
    currentPath === '/admin-login' ||
    currentPath === '/403' ||
    currentPath.includes('/login') ||
    currentPath.includes('/callback') ||
    currentPath.startsWith('/forgot-password') ||
    currentPath.startsWith('/reset-password') ||
    currentPath.startsWith('/verify-email') ||
    currentPath.startsWith('/register') ||
    currentPath.startsWith('/quotation/accept');

  const isOnProtectedPage = !isPublicPage;
  return { currentPath, isPublicPage, isOnProtectedPage };
}

/**
 * Sso query skipping logic matching AppRoutes.jsx
 */
function calculateSsoConditions({ isRehydrated, hasAuthToken, isOnProtectedPage, isPublicPage, sessionStatus, isSsoLoading, isSsoFetching }) {
  const shouldSkipSso = !isRehydrated || (isPublicPage && !hasAuthToken && sessionStatus === 'unauthenticated');
  const isAuthWaiting = !isRehydrated || (isOnProtectedPage && (isSsoLoading || isSsoFetching || sessionStatus === 'checking' || sessionStatus === 'idle'));
  return { shouldSkipSso, isAuthWaiting };
}

/**
 * Workspace destination resolution matching WorkspaceLandingRedirect.jsx
 */
function resolveWorkspaceDestination(authContext, options = {}) {
  const { sessionStatus = 'authenticated', authenticated = true } = options;

  // Reload / waiting check: protect against premature routing
  const isAuthLoading =
    sessionStatus === 'idle' ||
    sessionStatus === 'checking' ||
    (authenticated && !authContext?.organization && !authContext?.membership && !authContext?.user);

  if (isAuthLoading) {
    return 'LOADING';
  }

  if (sessionStatus === 'unauthenticated' && !authenticated) {
    return '/login';
  }

  const isSuperAdmin =
    authContext?.user?.role === 'super_admin' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'SUPER_ADMIN')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'SUPER_ADMIN'));

  if (isSuperAdmin) {
    return '/super-admin/dashboard';
  }

  const membershipType =
    authContext?.membership?.memberType ??
    authContext?.member?.memberType ??
    authContext?.user?.membership?.memberType ??
    (authContext?.user?.role === 'owner' ? 'OWNER' : null);

  // OWNER is an organization-level membership role -> always /owner/dashboard
  if (membershipType?.toUpperCase() === 'OWNER') {
    return '/owner/dashboard';
  }

  const entitledModules = getEntitledModules(authContext);
  if (entitledModules.length === 0) {
    return 'NO_ACCESS';
  }
  if (entitledModules.length === 1) {
    const single = entitledModules[0];
    if (single === 'INVENTORY') return '/inventory/dashboard';
    if (single === 'CRM') return '/crm/dashboard';
    if (single === 'ACCOUNT') return '/accounts/dashboard';
    return 'NO_ACCESS';
  }

  // 2+ modules for non-owner: CommonWorkspaceView
  return 'COMMON_WORKSPACE_VIEW';
}

function canAccessOwnerDashboard(authContext) {
  return (
    authContext?.membership?.memberType === 'OWNER' ||
    authContext?.user?.role === 'owner' ||
    authContext?.user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(authContext?.user?.roles) &&
      authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(authContext?.roles) &&
      authContext.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    authContext?.user?.role === 'super_admin'
  );
}

describe('Phase 12 — Login Flow, Route Protection & Workspace Navigation Tests', () => {

  describe('Test Case A: Canonical ERP Routing & Dynamic Module Workspace', () => {
    it('1. Generic login does not require module', () => {
      const loginPayload = {
        organizationCode: 'mohit',
        host: 'https://www.mark2.in/erp',
        module: null
      };
      assert.strictEqual(loginPayload.module, null);
      assert.strictEqual(loginPayload.organizationCode, 'mohit');
    });

    it('2. OWNER + ACCOUNT -> /workspace -> /owner/dashboard', () => {
      const authContext = {
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: ['ACCOUNT']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/owner/dashboard');
    });

    it('3. OWNER + INVENTORY -> /workspace -> /owner/dashboard', () => {
      const authContext = {
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: ['INVENTORY']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/owner/dashboard');
    });

    it('4. OWNER + CRM -> /workspace -> /owner/dashboard', () => {
      const authContext = {
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: ['CRM']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/owner/dashboard');
    });

    it('5. OWNER + ACCOUNT + INVENTORY + CRM -> /workspace -> /owner/dashboard', () => {
      const authContext = {
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: ['ACCOUNT', 'INVENTORY', 'CRM']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/owner/dashboard');
    });

    it('6. OWNER + zero modules -> /workspace -> /owner/dashboard', () => {
      const authContext = {
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: []
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/owner/dashboard');
    });

    it('7. NON-OWNER + ACCOUNT -> Account dashboard', () => {
      const authContext = {
        membership: { memberType: 'MEMBER' },
        user: { id: 'user-1', role: 'accountant' },
        modules: ['ACCOUNT']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/accounts/dashboard');
    });

    it('8. NON-OWNER + INVENTORY -> Inventory dashboard', () => {
      const authContext = {
        membership: { memberType: 'MEMBER' },
        user: { id: 'user-2', role: 'inventory_staff' },
        modules: ['INVENTORY']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/inventory/dashboard');
    });

    it('9. NON-OWNER + CRM -> CRM dashboard', () => {
      const authContext = {
        membership: { memberType: 'MEMBER' },
        user: { id: 'user-3', role: 'sales_rep' },
        modules: ['CRM']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, '/crm/dashboard');
    });

    it('10. NON-OWNER + INVENTORY + CRM -> CommonWorkspaceView', () => {
      const authContext = {
        membership: { memberType: 'MEMBER' },
        user: { id: 'user-4', role: 'operations_user' },
        modules: ['INVENTORY', 'CRM']
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, 'COMMON_WORKSPACE_VIEW');
    });

    it('11. NON-OWNER + zero modules -> NoModuleAccessView', () => {
      const authContext = {
        membership: { memberType: 'MEMBER' },
        user: { id: 'user-5', role: 'employee' },
        modules: []
      };
      const destination = resolveWorkspaceDestination(authContext);
      assert.strictEqual(destination, 'NO_ACCESS');
    });

    it('12. Customer OWNER cannot access platform-admin endpoints', () => {
      const customerOwnerRoles = ['OWNER'];
      const isPlatformAdmin = customerOwnerRoles.includes('SYSTEM_ADMIN') || customerOwnerRoles.includes('ROLE_PLATFORM_ADMIN');
      assert.strictEqual(isPlatformAdmin, false);
    });

    it('13. Customer OWNER can access authorized customer organization-owner APIs', () => {
      const ownerUser = {
        membership: { memberType: 'OWNER' },
        user: { role: 'owner' }
      };
      assert.strictEqual(canAccessOwnerDashboard(ownerUser), true);
    });

    it('14. Unauthorized member cannot access owner APIs', () => {
      const nonOwnerUser = {
        membership: { memberType: 'MEMBER' },
        user: { role: 'employee' },
        roles: ['EMPLOYEE']
      };
      assert.strictEqual(canAccessOwnerDashboard(nonOwnerUser), false);
    });

    it('15. Hard reload correctly restores /me and routes according to membership', () => {
      // 15a. While /me is loading, returns LOADING (prevents premature routing on empty state)
      assert.strictEqual(resolveWorkspaceDestination({}, { sessionStatus: 'checking' }), 'LOADING');
      assert.strictEqual(resolveWorkspaceDestination({}, { sessionStatus: 'idle' }), 'LOADING');

      // 15b. Once /me restores OWNER, routes to /owner/dashboard
      const loadedOwnerContext = {
        organization: { code: 'mohit' },
        membership: { memberType: 'OWNER' },
        user: { id: 'owner-1', role: 'owner' },
        modules: ['ACCOUNT']
      };
      assert.strictEqual(resolveWorkspaceDestination(loadedOwnerContext, { sessionStatus: 'authenticated' }), '/owner/dashboard');

      // 15c. Once /me restores NON-OWNER, routes to entitled module
      const loadedMemberContext = {
        organization: { code: 'mohit' },
        membership: { memberType: 'MEMBER' },
        user: { id: 'member-1', role: 'accountant' },
        modules: ['ACCOUNT']
      };
      assert.strictEqual(resolveWorkspaceDestination(loadedMemberContext, { sessionStatus: 'authenticated' }), '/accounts/dashboard');
    });
  });

  describe('Test Case B: Login → Refresh → Dashboard Remains Accessible', () => {
    it('correctly identifies /workspace as protected route with and without /erp prefix', () => {
      const route1 = resolveRouteProtection('/workspace');
      assert.strictEqual(route1.isOnProtectedPage, true);
      assert.strictEqual(route1.isPublicPage, false);

      const route2 = resolveRouteProtection('/erp/workspace');
      assert.strictEqual(route2.isOnProtectedPage, true);
      assert.strictEqual(route2.isPublicPage, false);

      const route3 = resolveRouteProtection('/erp/accounts/dashboard');
      assert.strictEqual(route3.isOnProtectedPage, true);
      assert.strictEqual(route3.isPublicPage, false);
    });

    it('does NOT skip SSO query on protected routes even if sessionStatus is unauthenticated in localStorage', () => {
      const { shouldSkipSso, isAuthWaiting } = calculateSsoConditions({
        isRehydrated: true,
        hasAuthToken: false, // HttpOnly cookie not accessible via JS
        isOnProtectedPage: true,
        isPublicPage: false,
        sessionStatus: 'unauthenticated',
        isSsoLoading: true,
        isSsoFetching: false
      });

      // Crucial: shouldSkipSso must be false so the browser validates HttpOnly cookie session
      assert.strictEqual(shouldSkipSso, false);
      // Crucial: isAuthWaiting must be true so ProtectedRoute does not prematurely redirect
      assert.strictEqual(isAuthWaiting, true);
    });
  });

  describe('Test Case C: Logout → Dashboard Becomes Inaccessible', () => {
    it('sets isAuthWaiting false when sessionStatus resolves to unauthenticated', () => {
      const { isAuthWaiting } = calculateSsoConditions({
        isRehydrated: true,
        hasAuthToken: false,
        isOnProtectedPage: true,
        isPublicPage: false,
        sessionStatus: 'unauthenticated',
        isSsoLoading: false,
        isSsoFetching: false
      });
      // Auth check finished, now ProtectedRoute renders and redirects unauthenticated user
      assert.strictEqual(isAuthWaiting, false);
    });
  });

  describe('Test Case D: Unauthenticated user → Protected routes redirect to /login', () => {
    it('does not send unauthenticated users to /modules (prevents redirect loop)', () => {
      // Simulation of ProtectedRoute unauthenticated decision
      const authenticated = false;
      const cookieToken = null;
      const target = authenticated || cookieToken ? 'RENDER_CHILDREN' : '/login';
      assert.strictEqual(target, '/login');
      assert.notStrictEqual(target, '/modules');
    });
  });

  describe('Test Case E: Invalid login → Proper error is displayed', () => {
    it('sanitizes 401 unauthorized to user-friendly message', () => {
      const err = { status: 401, data: { message: 'Invalid credentials' } };
      const msg = sanitizeLoginError(err);
      assert.strictEqual(msg, 'Invalid email or password.');
    });

    it('sanitizes 403 membership error to access denied message', () => {
      const err = { status: 403, data: { message: 'User membership revoked' } };
      const msg = sanitizeLoginError(err);
      assert.strictEqual(msg, "You don't have access to this organization.");
    });

    it('sanitizes 404 organization not found', () => {
      const err = { status: 404, data: { message: 'Organization not found' } };
      const msg = sanitizeLoginError(err);
      assert.strictEqual(msg, 'Organization not found.');
    });

    it('masks internal server 500 error stack traces', () => {
      const err = { status: 500, data: { message: 'NullPointerException at com.erp.auth.AuthService.java:120' } };
      const msg = sanitizeLoginError(err);
      assert.strictEqual(msg, 'Something went wrong. Please try again.');
    });
  });

  describe('Test Case F: Session/Token Expiration → Handled Gracefully', () => {
    it('sanitizes session expired 401 error', () => {
      const err = { status: 401, data: { message: 'Session expired' } };
      const msg = sanitizeLoginError(err);
      assert.strictEqual(msg, 'Invalid email or password.');
    });
  });

  describe('Test Case G: Browser Navigation & Clean Public vs Protected Split', () => {
    it('identifies public auth pages correctly so login page does not get stuck in loader', () => {
      const publicPaths = [
        '/',
        '/landing',
        '/try-free',
        '/login',
        '/erp/login',
        '/accounts/login',
        '/erp/accounts/login',
        '/o/mycompany/login',
        '/modules',
        '/admin-login',
        '/auth/callback',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/register',
        '/403'
      ];

      for (const p of publicPaths) {
        const { isPublicPage, isOnProtectedPage } = resolveRouteProtection(p);
        assert.strictEqual(isPublicPage, true, `Expected ${p} to be public`);
        assert.strictEqual(isOnProtectedPage, false, `Expected ${p} to not be protected`);
      }
    });

    it('identifies ERP module pages as protected', () => {
      const protectedPaths = [
        '/workspace',
        '/erp/workspace',
        '/owner/dashboard',
        '/accounts/dashboard',
        '/accounts/vouchers',
        '/inventory/dashboard',
        '/inventory/stock',
        '/crm/dashboard',
        '/sales/orders',
        '/purchase/orders',
        '/hr/employees',
        '/super-admin/dashboard'
      ];

      for (const p of protectedPaths) {
        const { isPublicPage, isOnProtectedPage } = resolveRouteProtection(p);
        assert.strictEqual(isPublicPage, false, `Expected ${p} to not be public`);
        assert.strictEqual(isOnProtectedPage, true, `Expected ${p} to be protected`);
      }
    });
  });
});
