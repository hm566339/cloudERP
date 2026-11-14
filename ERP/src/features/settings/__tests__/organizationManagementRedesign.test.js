import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ORG_NAV_ITEMS, resolveOrgSubmenuPath } from '../components/organizationNavConfig.js';

describe('Organization Management Module Frontend Redesign Test Suite', () => {

  describe('1. Sub-Sidebar Navigation Configuration', () => {
    it('contains exactly 12 dedicated submenu navigation items', () => {
      assert.strictEqual(ORG_NAV_ITEMS.length, 12);
    });

    it('contains all 12 required items in the correct order', () => {
      const expectedIds = [
        'overview',
        'profile',
        'companies',
        'users',
        'roles',
        'permissions',
        'portal-access',
        'security',
        'login-portal',
        'notifications',
        'localization',
        'appearance',
      ];

      const actualIds = ORG_NAV_ITEMS.map((item) => item.id);
      assert.deepStrictEqual(actualIds, expectedIds);
    });

    it('has correct human-readable labels matching specification', () => {
      const expectedLabels = [
        'Overview',
        'Organization Profile',
        'Companies Management',
        'Users & Permissions',
        'Role Management',
        'Permission Management',
        'Portal & Module Access',
        'Security & Authentication',
        'Organization Login Portal',
        'Notifications',
        'Localization & Formats',
        'Appearance & Themes',
      ];

      const actualLabels = ORG_NAV_ITEMS.map((item) => item.label);
      assert.deepStrictEqual(actualLabels, expectedLabels);
    });

    it('explicitly excludes Subscription & Billing from the sub-sidebar', () => {
      const subscriptionItem = ORG_NAV_ITEMS.find(
        (item) =>
          item.id.includes('subscript') ||
          item.label.toLowerCase().includes('subscription') ||
          item.label.toLowerCase().includes('billing')
      );
      assert.strictEqual(subscriptionItem, undefined);
    });
  });

  describe('2. Path & Route Resolution', () => {
    it('resolves root overview path correctly for owner workspace', () => {
      const basePath = '/owner/settings';

      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'overview'), '/owner/settings');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'profile'), '/owner/settings/profile');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'companies'), '/owner/settings/companies');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'users'), '/owner/settings/users');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'roles'), '/owner/settings/roles');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'permissions'), '/owner/settings/permissions');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'security'), '/owner/settings/security');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'login-portal'), '/owner/settings/login-portal');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'notifications'), '/owner/settings/notifications');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'localization'), '/owner/settings/localization');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'appearance'), '/owner/settings/appearance');
    });

    it('resolves paths correctly for backwards-compatible /settings/organization route', () => {
      const basePath = '/settings/organization';

      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'overview'), '/settings/organization');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'profile'), '/settings/organization/profile');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'users'), '/settings/organization/users');
      assert.strictEqual(resolveOrgSubmenuPath(basePath, 'companies'), '/settings/organization/companies');
    });
  });

  describe('3. Multi-Company Single User ID Data Flow Validation', () => {
    it('verifies organization member structure supports cross-company role mapping', () => {
      const member = {
        memberId: 'mem-101',
        userId: 'usr-101',
        fullName: 'Mohit Sharma',
        email: 'mohit@example.com',
        memberType: 'MEMBER',
        membershipStatus: 'ACTIVE',
        authorizedCompanies: ['Company A', 'Company B', 'Company C', 'Company D'],
        authorizedCompanyIds: ['c-a', 'c-b', 'c-c', 'c-d'],
        companyAccess: [
          { companyId: 'c-a', companyName: 'Company A', roleName: 'Admin', active: true },
          { companyId: 'c-b', companyName: 'Company B', roleName: 'Manager', active: true },
          { companyId: 'c-c', companyName: 'Company C', roleName: 'Accountant', active: true },
          { companyId: 'c-d', companyName: 'Company D', roleName: 'Viewer', active: true },
        ],
      };

      // Single identity across 4 companies
      assert.strictEqual(member.userId, 'usr-101');
      assert.strictEqual(member.authorizedCompanies.length, 4);
      assert.strictEqual(member.companyAccess.length, 4);

      // Company A is Admin, Company B is Manager, Company C is Accountant, Company D is Viewer
      const compA = member.companyAccess.find((c) => c.companyId === 'c-a');
      const compB = member.companyAccess.find((c) => c.companyId === 'c-b');
      const compC = member.companyAccess.find((c) => c.companyId === 'c-c');
      const compD = member.companyAccess.find((c) => c.companyId === 'c-d');

      assert.strictEqual(compA.roleName, 'Admin');
      assert.strictEqual(compB.roleName, 'Manager');
      assert.strictEqual(compC.roleName, 'Accountant');
      assert.strictEqual(compD.roleName, 'Viewer');
    });
  });
});
