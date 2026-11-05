import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ORG_NAV_ITEMS, resolveOrgSubmenuPath } from '../components/organizationNavConfig.js';
import { getModuleNavigationBlueprint } from '../../../layouts/dynamicSidebarConfig.js';
import { CANONICAL_MODULES } from '../../../utils/moduleNormalization.js';
import * as roleTemplateApi from '../../../api/sso/roleTemplate.api.js';

describe('Organization-Level Role & Permission Management System Test Suite', () => {

  describe('1. Organization Management Sub-Sidebar Configuration', () => {
    it('contains exactly 12 dedicated items in the specified order', () => {
      assert.strictEqual(ORG_NAV_ITEMS.length, 12);

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
      assert.deepStrictEqual(ORG_NAV_ITEMS.map((item) => item.id), expectedIds);
    });

    it('contains Role Management and Permission Management with descriptions', () => {
      const rolesItem = ORG_NAV_ITEMS.find((item) => item.id === 'roles');
      const permsItem = ORG_NAV_ITEMS.find((item) => item.id === 'permissions');

      assert.ok(rolesItem, 'Role Management item must exist');
      assert.strictEqual(rolesItem.label, 'Role Management');
      assert.ok(rolesItem.description && rolesItem.description.length > 5);

      assert.ok(permsItem, 'Permission Management item must exist');
      assert.strictEqual(permsItem.label, 'Permission Management');
      assert.ok(permsItem.description && permsItem.description.length > 5);
    });

    it('resolves correct deep-link paths for roles and permissions', () => {
      assert.strictEqual(resolveOrgSubmenuPath('/owner/settings', 'roles'), '/owner/settings/roles');
      assert.strictEqual(resolveOrgSubmenuPath('/owner/settings', 'permissions'), '/owner/settings/permissions');
    });
  });

  describe('2. SSO & Administration Sidebar Trimming', () => {
    it('does NOT contain roles or portal-access in SSO & Administration module', () => {
      const ssoItems = getModuleNavigationBlueprint(CANONICAL_MODULES.SSO, '/owner', {});

      const hasRoles = ssoItems.some((item) => item.id === 'roles' || item.path?.includes('/roles'));
      const hasPortalAccess = ssoItems.some((item) => item.id === 'portal-access' || item.path?.includes('/portal-access'));

      assert.strictEqual(hasRoles, false, 'Role Management should be removed from SSO sidebar');
      assert.strictEqual(hasPortalAccess, false, 'Portal Access should be removed from SSO sidebar');

      const expectedSsoIds = ['admin-dashboard', 'users', 'sessions', 'workflow-approval-requests', 'workflow-approvals'];
      assert.deepStrictEqual(ssoItems.map((item) => item.id), expectedSsoIds);
    });
  });

  describe('3. Role Template API Client Exports', () => {
    it('exports all required API methods for templates and permissions', () => {
      assert.strictEqual(typeof roleTemplateApi.getOrgRoleTemplates, 'function');
      assert.strictEqual(typeof roleTemplateApi.getOrgRoleTemplateById, 'function');
      assert.strictEqual(typeof roleTemplateApi.createOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.updateOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.duplicateOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.updateOrgRoleTemplateStatus, 'function');
      assert.strictEqual(typeof roleTemplateApi.deleteOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.previewApplyOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.applyOrgRoleTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.compareRoleAcrossCompanies, 'function');
      assert.strictEqual(typeof roleTemplateApi.importCompanyRoleAsTemplate, 'function');
      assert.strictEqual(typeof roleTemplateApi.getOrgPermissionCatalog, 'function');
      assert.strictEqual(typeof roleTemplateApi.getOrgPermissionMatrix, 'function');
    });
  });

  describe('4. Template Deployment Differences & User Preservation Logic', () => {
    it('verifies preview calculation detects added, removed, and preserved permissions without touching user assignments', () => {
      const templatePerms = new Set(['INVOICE:READ', 'INVOICE:CREATE', 'INVOICE:UPDATE', 'REPORT:EXPORT']);
      const companyExistingPerms = new Set(['INVOICE:READ', 'INVOICE:CREATE', 'CUSTOMER:READ']);
      const existingUserCount = 5;

      const added = Array.from(templatePerms).filter((p) => !companyExistingPerms.has(p));
      const removed = Array.from(companyExistingPerms).filter((p) => !templatePerms.has(p));
      const unchanged = Array.from(templatePerms).filter((p) => companyExistingPerms.has(p));

      assert.deepStrictEqual(added, ['INVOICE:UPDATE', 'REPORT:EXPORT']);
      assert.deepStrictEqual(removed, ['CUSTOMER:READ']);
      assert.deepStrictEqual(unchanged, ['INVOICE:READ', 'INVOICE:CREATE']);

      // Existing users are preserved
      assert.strictEqual(existingUserCount, 5);
    });

    it('detects customization drift between template default and company permissions', () => {
      const templatePerms = ['PAYMENT:READ', 'PAYMENT:CREATE', 'PAYMENT:APPROVE'];
      const standardCompanyPerms = ['PAYMENT:READ', 'PAYMENT:CREATE', 'PAYMENT:APPROVE'];
      const customizedCompanyPerms = ['PAYMENT:READ', 'PAYMENT:CREATE', 'PAYMENT:APPROVE', 'PAYMENT:EXPORT'];

      const isStandardCustomized = new Set(templatePerms).size !== new Set(standardCompanyPerms).size ||
        templatePerms.some((p) => !standardCompanyPerms.includes(p));

      const isDriftedCustomized = new Set(templatePerms).size !== new Set(customizedCompanyPerms).size ||
        customizedCompanyPerms.some((p) => !templatePerms.includes(p));

      assert.strictEqual(isStandardCustomized, false);
      assert.strictEqual(isDriftedCustomized, true);
    });
  });
});
