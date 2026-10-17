import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GENERAL_SETTINGS_NAV_ITEMS,
  MODULE_SETTINGS_CONFIG,
  resolveSettingsNavigation,
  buildSettingsPath,
} from '../settingsNavigation.js';

describe('SettingsNavbar & settingsNavigation Unit & Integration Tests', () => {
  describe('1. Static Configuration Verification', () => {
    it('contains all 8 required General Settings items', () => {
      const expectedIds = [
        'general',
        'my_account',
        'organization',
        'users_permissions',
        'security',
        'notifications',
        'localization',
        'subscription_billing',
      ];

      const actualIds = GENERAL_SETTINGS_NAV_ITEMS.map((item) => item.id);
      expectedIds.forEach((expectedId) => {
        assert.ok(
          actualIds.includes(expectedId),
          `Missing expected General Settings ID: ${expectedId}`
        );
      });
      assert.strictEqual(GENERAL_SETTINGS_NAV_ITEMS.length, 8);
    });

    it('contains all 5 genuine ERP Application Module settings (no demo modules as top-level)', () => {
      const expectedModuleKeys = ['ACCOUNT', 'INVENTORY', 'WORKFLOW', 'CRM', 'SSO'];
      const actualModuleKeys = MODULE_SETTINGS_CONFIG.map((cfg) => cfg.moduleKey);

      assert.deepStrictEqual(actualModuleKeys, expectedModuleKeys);

      // Verify demo or sub-feature items are NOT top-level modules
      assert.strictEqual(actualModuleKeys.includes('QUOTATIONS'), false);
      assert.strictEqual(actualModuleKeys.includes('SALES_ORDERS'), false);
      assert.strictEqual(actualModuleKeys.includes('PROFORMA_INVOICES'), false);
    });

    it('avoids duplicate or confusing labels between user account and accounting module', () => {
      const myAccountItem = GENERAL_SETTINGS_NAV_ITEMS.find((i) => i.id === 'my_account');
      const accountingModuleItem = MODULE_SETTINGS_CONFIG.find((i) => i.moduleKey === 'ACCOUNT');

      assert.strictEqual(myAccountItem.label, 'My Account');
      assert.strictEqual(accountingModuleItem.label, 'Accounting Module');
      assert.notStrictEqual(myAccountItem.label, accountingModuleItem.label);
    });
  });

  describe('2. Dynamic Navigation Resolution & Permissions', () => {
    const mockApiModules = [
      { moduleKey: 'ACCOUNT', name: 'Account & Finance', active: true },
      { moduleKey: 'INVENTORY', name: 'Inventory Management', active: true },
      { moduleKey: 'WORKFLOW', name: 'Workflow Management', active: true },
      { moduleKey: 'CRM', name: 'Customer Relationship Management', active: true },
      { moduleKey: 'SSO', name: 'SSO & Administration', active: true },
    ];

    const mockApiFeatures = [
      { code: 'QUOTATIONS', name: 'Quotations', moduleName: 'ACCOUNT', active: true },
      { code: 'SALES_ORDERS', name: 'Sales Orders', moduleName: 'ACCOUNT', active: true },
      { code: 'CUSTOMERS', name: 'Customers', moduleName: 'ACCOUNT', active: true },
      { code: 'WAREHOUSES', name: 'Warehouses', moduleName: 'INVENTORY', active: true },
      { code: 'PRODUCTS', name: 'Products', moduleName: 'INVENTORY', active: true },
      { code: 'WORKFLOW_DEFINITIONS', name: 'Workflow Definitions', moduleName: 'WORKFLOW', active: true },
      { code: 'LEADS', name: 'Leads', moduleName: 'CRM', active: true },
      { code: 'USER_MANAGEMENT', name: 'User Management', moduleName: 'SSO', active: true },
    ];

    it('resolves active modules and associates features correctly via moduleName', () => {
      const nav = resolveSettingsNavigation({
        modules: mockApiModules,
        features: mockApiFeatures,
        isOwner: true,
        currentPath: '/settings/general',
      });

      assert.strictEqual(nav.generalItems.length, 8);
      assert.strictEqual(nav.moduleItems.length, 5);

      const accountModule = nav.moduleItems.find((m) => m.moduleKey === 'ACCOUNT');
      assert.ok(accountModule);
      assert.strictEqual(accountModule.label, 'Accounting Module');

      const featureCodes = accountModule.associatedFeatures.map((f) => f.code);
      assert.ok(featureCodes.includes('QUOTATIONS'));
      assert.ok(featureCodes.includes('SALES_ORDERS'));
      assert.ok(featureCodes.includes('CUSTOMERS'));
    });

    it('filters out inactive modules from navigation', () => {
      const partialModules = [
        { moduleKey: 'ACCOUNT', active: true },
        { moduleKey: 'INVENTORY', active: false }, // inactive
        { moduleKey: 'WORKFLOW', active: true },
      ];

      const nav = resolveSettingsNavigation({
        modules: partialModules,
        features: mockApiFeatures,
        isOwner: true,
        currentPath: '/settings/general',
      });

      const moduleKeys = nav.moduleItems.map((m) => m.moduleKey);
      assert.ok(moduleKeys.includes('ACCOUNT'));
      assert.ok(moduleKeys.includes('WORKFLOW'));
      assert.strictEqual(moduleKeys.includes('INVENTORY'), false);
    });

    it('enforces privileged permissions on sensitive general settings', () => {
      // 1. Regular non-privileged employee
      const nonPrivNav = resolveSettingsNavigation({
        modules: mockApiModules,
        userRole: 'employee',
        isOwner: false,
        memberType: 'MEMBER',
      });

      const nonPrivOrgItem = nonPrivNav.generalItems.find((i) => i.id === 'organization');
      assert.strictEqual(nonPrivOrgItem, undefined, 'Organization settings must be hidden for non-privileged employee');

      // 2. Owner
      const ownerNav = resolveSettingsNavigation({
        modules: mockApiModules,
        userRole: 'owner',
        isOwner: true,
        memberType: 'OWNER',
      });

      const ownerOrgItem = ownerNav.generalItems.find((i) => i.id === 'organization');
      assert.ok(ownerOrgItem, 'Organization settings must be visible for Owner');
    });
  });

  describe('3. Route Matching & Active State Detection', () => {
    it('correctly detects active General Settings item based on route', () => {
      const nav = resolveSettingsNavigation({
        currentPath: '/settings/security',
      });

      assert.strictEqual(nav.activeItem.id, 'security');
      assert.strictEqual(nav.activeGroup, 'general');
    });

    it('correctly detects active Module Settings item (e.g. Accounting at /settings/sales)', () => {
      const nav = resolveSettingsNavigation({
        currentPath: '/settings/sales',
      });

      assert.strictEqual(nav.activeItem.id, 'module_account');
      assert.strictEqual(nav.activeItem.moduleKey, 'ACCOUNT');
      assert.strictEqual(nav.activeGroup, 'module');
    });

    it('correctly matches alias routes (e.g. /settings alias matches general)', () => {
      const nav = resolveSettingsNavigation({
        currentPath: '/settings',
      });

      assert.strictEqual(nav.activeItem.id, 'general');
    });

    it('matches company-scoped routes correctly', () => {
      const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
      const nav = resolveSettingsNavigation({
        companyId,
        currentPath: `/company/${companyId}/settings/inventory`,
      });

      assert.strictEqual(nav.activeItem.id, 'module_inventory');
      assert.strictEqual(nav.activeItem.moduleKey, 'INVENTORY');
      assert.strictEqual(nav.activeGroup, 'module');
    });
  });

  describe('4. Path Building & Safe URL Sanitization', () => {
    it('constructs paths safely without trusting raw external URLs', () => {
      const path1 = buildSettingsPath('/settings/general');
      assert.strictEqual(path1, '/settings/general');

      const companyId = '123e4567-e89b-12d3-a456-426614174000';
      const path2 = buildSettingsPath('/settings/sales', companyId);
      assert.strictEqual(path2, `/company/${companyId}/settings/sales`);

      // Profiles and owner settings remain global
      const path3 = buildSettingsPath('/profile', companyId);
      assert.strictEqual(path3, '/profile');

      const path4 = buildSettingsPath('/owner/settings/organization', companyId);
      assert.strictEqual(path4, '/owner/settings/organization');
    });
  });
});
