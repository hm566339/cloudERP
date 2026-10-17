import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canBuySubscription,
  canViewPlans,
  getBuyDisabledReason,
} from '../../../utils/subscriptionPermissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper mimicking the exact logic from AppShellLayout.jsx
function resolveAppShellLayout({ user, membership, roles = [], pathname }) {
  const rawRole = user?.role || 'employee';
  const userRole = String(Array.isArray(rawRole) ? (rawRole[0]?.name || rawRole[0]) : (rawRole?.name || rawRole)).toLowerCase();

  const isOwner =
    userRole === 'owner' ||
    membership?.memberType === 'OWNER' ||
    user?.role === 'owner' ||
    user?.membership?.memberType === 'OWNER' ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER')) ||
    (Array.isArray(roles) &&
      roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toUpperCase() === 'OWNER'));

  const isAccountant =
    userRole?.toUpperCase() === 'ACCOUNTANT' ||
    (Array.isArray(user?.roles) && user.roles.some((r) => {
      const name = typeof r === 'string' ? r : (r?.name || r?.code || '');
      return String(name).toUpperCase() === 'ACCOUNTANT' || String(name).toUpperCase() === 'ROLE_ACCOUNTANT';
    }));

  const isOwnerWorkspace =
    pathname.startsWith('/owner') ||
    pathname.startsWith('/organization') ||
    pathname.startsWith('/subscription');

  if (isOwner && isOwnerWorkspace) {
    return 'OwnerLayout';
  }

  if (isAccountant) {
    return 'AccountantLayout';
  }

  return 'CompanyLayout';
}

describe('Subscription & Plan Management Layout & Role Verification', () => {
  describe('1. Role-Based AppShell Layout Resolution for /subscription', () => {
    it('resolves OwnerLayout for OWNER user on /subscription', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'owner' },
        membership: { memberType: 'OWNER' },
        pathname: '/subscription',
      });
      assert.strictEqual(layout, 'OwnerLayout');
    });

    it('resolves OwnerLayout for OWNER user on /owner/subscription', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'owner' },
        membership: { memberType: 'OWNER' },
        pathname: '/owner/subscription',
      });
      assert.strictEqual(layout, 'OwnerLayout');
    });

    it('resolves OwnerLayout for user with roles containing OWNER string/object', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'user', roles: [{ name: 'OWNER' }] },
        pathname: '/subscription',
      });
      assert.strictEqual(layout, 'OwnerLayout');
    });

    it('resolves CompanyLayout for ADMIN user on /subscription (retains normal layout)', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'company_admin' },
        membership: { memberType: 'ADMIN' },
        pathname: '/subscription',
      });
      assert.strictEqual(layout, 'CompanyLayout');
    });

    it('resolves CompanyLayout for MEMBER user on /subscription (retains normal layout)', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'employee' },
        membership: { memberType: 'MEMBER' },
        pathname: '/subscription',
      });
      assert.strictEqual(layout, 'CompanyLayout');
    });

    it('resolves AccountantLayout for ACCOUNTANT user on /subscription', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'accountant' },
        membership: { memberType: 'MEMBER' },
        pathname: '/subscription',
      });
      assert.strictEqual(layout, 'AccountantLayout');
    });

    it('resolves CompanyLayout for OWNER when navigating to business modules (e.g. /workflows)', () => {
      const layout = resolveAppShellLayout({
        user: { role: 'owner' },
        membership: { memberType: 'OWNER' },
        pathname: '/workflows',
      });
      assert.strictEqual(layout, 'CompanyLayout');
    });
  });

  describe('2. Elimination of Duplicate Layout Wrappers in SubscriptionPage', () => {
    const subscriptionPageSource = fs.readFileSync(
      path.resolve(__dirname, '../SubscriptionPage.jsx'),
      'utf8'
    );

    it('does not import or wrap with OwnerLayout inside SubscriptionPage.jsx', () => {
      assert.strictEqual(
        subscriptionPageSource.includes('<OwnerLayout>'),
        false,
        'SubscriptionPage must not wrap content in <OwnerLayout> (prevents double header & duplicate sidebar)'
      );
      assert.strictEqual(
        subscriptionPageSource.includes('useIsOwnerLayout'),
        false,
        'SubscriptionPage must not rely on useIsOwnerLayout for nested wrapper decisions'
      );
    });

    it('exports a clean SubscriptionPage component that delegates directly to SubscriptionContent', () => {
      assert.match(
        subscriptionPageSource,
        /export\s+default\s+function\s+SubscriptionPage\s*\(\)\s*\{\s*return\s+<SubscriptionContent\s*\/>;\s*\}/,
        'SubscriptionPage must cleanly return <SubscriptionContent /> without role-conditional wrappers'
      );
    });
  });

  describe('3. Required Header Controls in OwnerTopHeader', () => {
    const ownerTopHeaderSource = fs.readFileSync(
      path.resolve(__dirname, '../../../layouts/OwnerTopHeader.jsx'),
      'utf8'
    );

    it('handles /subscription path for breadcrumb display', () => {
      assert.match(
        ownerTopHeaderSource,
        /location\.pathname\.startsWith\(['"]\/subscription['"]\)/,
        'OwnerTopHeader must detect /subscription to set breadcrumb label'
      );
    });

    it('preserves all required header controls for Owner workspace', () => {
      // Breadcrumbs
      assert.match(ownerTopHeaderSource, /getBreadcrumbLabel/);
      // Global Search
      assert.match(ownerTopHeaderSource, /searchQuery/);
      // Trial / Subscription status indicator
      assert.match(ownerTopHeaderSource, /isTrial/);
      assert.match(ownerTopHeaderSource, /isReadOnly/);
      // Workspace / Company selector
      assert.match(ownerTopHeaderSource, /handleSelectCompany/);
      assert.match(ownerTopHeaderSource, /companyDropdownOpen/);
      // Settings trigger
      assert.match(ownerTopHeaderSource, /Settings/);
      // Notifications
      assert.match(ownerTopHeaderSource, /Bell/);
      // User Profile menu & logout
      assert.match(ownerTopHeaderSource, /profileDropdownOpen/);
      assert.match(ownerTopHeaderSource, /handleLogout/);
    });
  });

  describe('4. Alignment and Viewport Width Verification in DashboardLayout', () => {
    const dashboardLayoutSource = fs.readFileSync(
      path.resolve(__dirname, '../../../layouts/DashboardLayout.jsx'),
      'utf8'
    );

    it('applies sidebar offset padding exactly once at the layout level', () => {
      assert.match(
        dashboardLayoutSource,
        /sidebar\s*\?\s*\(isCollapsed\s*\?\s*'lg:pl-sidebar-collapsed'\s*:\s*'lg:pl-sidebar-expanded'\)\s*:\s*''/,
        'DashboardLayout must apply single sidebar offset'
      );
    });

    it('uses full viewport width with responsive max-width on main container', () => {
      assert.match(
        dashboardLayoutSource,
        /max-w-\[2560px\]/,
        'DashboardLayout must use full responsive max-width container'
      );
    });
  });

  describe('5. Role-Based Permissions & Subscription Controls', () => {
    it('allows OWNER to purchase and upgrade subscriptions', () => {
      const ownerAuth = {
        user: { role: 'owner' },
        membership: { memberType: 'OWNER' },
      };
      assert.strictEqual(canBuySubscription(ownerAuth), true);
      assert.strictEqual(canViewPlans(ownerAuth), true);
      assert.strictEqual(getBuyDisabledReason(ownerAuth), null);
    });

    it('allows ADMIN to purchase and upgrade subscriptions', () => {
      const adminAuth = {
        user: { role: 'company_admin' },
        membership: { memberType: 'ADMIN' },
      };
      assert.strictEqual(canBuySubscription(adminAuth), true);
      assert.strictEqual(canViewPlans(adminAuth), true);
      assert.strictEqual(getBuyDisabledReason(adminAuth), null);
    });

    it('disallows MEMBER from purchasing/upgrading while allowing viewing when granted READ permission', () => {
      const memberAuth = {
        user: { role: 'employee' },
        membership: { memberType: 'MEMBER' },
        permissions: ['SUBSCRIPTION_PLAN:READ'],
      };
      assert.strictEqual(canBuySubscription(memberAuth), false);
      assert.strictEqual(canViewPlans(memberAuth), true);
      assert.match(
        getBuyDisabledReason(memberAuth),
        /Only Organization Owners or Administrators have permission/
      );
    });

    it('disallows unprivileged MEMBER from purchasing/upgrading', () => {
      const basicMember = {
        user: { role: 'employee' },
        membership: { memberType: 'MEMBER' },
      };
      assert.strictEqual(canBuySubscription(basicMember), false);
      assert.match(
        getBuyDisabledReason(basicMember),
        /Only Organization Owners or Administrators have permission/
      );
    });
  });
});
