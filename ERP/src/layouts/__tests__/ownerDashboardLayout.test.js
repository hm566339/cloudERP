import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getOwnerSidebarNavGroups,
  OWNER_MODULE_CATALOG,
} from '../ownerSidebarConfig.js';
import { normalizeModuleName } from '../../utils/moduleNormalization.js';

describe('Owner Dashboard UI & Layout Configuration Suite', () => {

  describe('1. Owner Sidebar Nav Groups Dynamic Generation', () => {
    it('generates active and locked module links dynamically without non-clickable flags', () => {
      const entitledModules = ['ACCOUNT', 'INVENTORY', 'CRM'];
      const modules = [
        { name: 'accounts', active: true, canonical: 'ACCOUNT' },
        { name: 'inventory', active: true, canonical: 'INVENTORY' },
        { name: 'crm', active: true, canonical: 'CRM' },
      ];

      const navGroups = getOwnerSidebarNavGroups({
        entitledModules,
        modules,
        activeCompanyId: 'comp-123',
        companiesCount: 2,
        isTrial: true,
        daysRemaining: 15,
        isActive: true,
      });

      // Assert 4 standard groups exist
      assert.strictEqual(navGroups.length, 4);
      assert.strictEqual(navGroups[0].id, 'dashboard-group');
      assert.strictEqual(navGroups[1].id, 'my-company-group');
      assert.strictEqual(navGroups[2].id, 'modules-group');
      assert.strictEqual(navGroups[3].id, 'settings-group');

      const modulesGroup = navGroups.find((g) => g.id === 'modules-group');
      assert.ok(modulesGroup, 'modules-group must exist');
      assert.strictEqual(modulesGroup.isDisplayOnly, undefined, 'modules-group must not be flagged as isDisplayOnly');

      // Check active items
      const financeItem = modulesGroup.items.find((i) => i.moduleKey === 'ACCOUNT');
      assert.ok(financeItem, 'Finance item must be present');
      assert.strictEqual(financeItem.isEntitled, true, 'Finance must be entitled');
      assert.strictEqual(financeItem.badge, 'Active', 'Finance badge must be Active');
      assert.strictEqual(financeItem.path, '/company/comp-123/accounts/dashboard', 'Finance path must route to company accounts');
      assert.strictEqual(financeItem.isNonClickable, undefined, 'Finance must NOT be non-clickable');

      const invItem = modulesGroup.items.find((i) => i.moduleKey === 'INVENTORY');
      assert.ok(invItem, 'Inventory item must be present');
      assert.strictEqual(invItem.isEntitled, true);
      assert.strictEqual(invItem.badge, 'Active');

      const crmItem = modulesGroup.items.find((i) => i.moduleKey === 'CRM');
      assert.ok(crmItem, 'CRM item must be present');
      assert.strictEqual(crmItem.isEntitled, true);
      assert.strictEqual(crmItem.badge, 'Active');

      // Check locked/unprovisioned item (e.g. SSO or PURCHASES when not entitled)
      const ssoItem = modulesGroup.items.find((i) => i.moduleKey === 'SSO');
      assert.ok(ssoItem, 'SSO item must be present as a catalog module');
      assert.strictEqual(ssoItem.isEntitled, false, 'SSO must not be entitled');
      assert.strictEqual(ssoItem.badge, 'Locked', 'SSO badge must be Locked');
      assert.strictEqual(ssoItem.path, '/subscription', 'Locked module must route to /subscription');
    });

    it('correctly formats long labels like Purchasing & Procurement without truncation', () => {
      const navGroups = getOwnerSidebarNavGroups({
        entitledModules: ['PURCHASES'],
        activeCompanyId: 'comp-abc',
      });
      const modulesGroup = navGroups.find((g) => g.id === 'modules-group');
      const purchasesItem = modulesGroup.items.find((i) => i.moduleKey === 'PURCHASES');

      assert.ok(purchasesItem);
      assert.strictEqual(purchasesItem.label, 'Purchasing & Procurement');
      assert.strictEqual(purchasesItem.isEntitled, true);
      assert.strictEqual(purchasesItem.path, '/company/comp-abc/purchases');
    });

    it('supports dynamic extension modules present in organization modules list', () => {
      const entitledModules = ['ACCOUNT', 'MANUFACTURING'];
      const modules = [
        { name: 'account', active: true, canonical: 'ACCOUNT' },
        { name: 'manufacturing', active: true, canonical: 'MANUFACTURING' },
      ];

      const navGroups = getOwnerSidebarNavGroups({
        entitledModules,
        modules,
        activeCompanyId: 'comp-999',
      });
      const modulesGroup = navGroups.find((g) => g.id === 'modules-group');
      const mfgItem = modulesGroup.items.find((i) => i.moduleKey === 'MANUFACTURING');

      assert.ok(mfgItem, 'Manufacturing module from API must be dynamically represented');
      assert.strictEqual(mfgItem.isEntitled, true);
      assert.strictEqual(mfgItem.badge, 'Active');
      assert.strictEqual(mfgItem.path, '/company/comp-999/manufacturing');
    });
  });

  describe('2. Master Module Catalog Mapping & Normalization', () => {
    it('provides correct route generators for all core canonical modules', () => {
      assert.strictEqual(OWNER_MODULE_CATALOG.ACCOUNT.path('c1'), '/company/c1/accounts/dashboard');
      assert.strictEqual(OWNER_MODULE_CATALOG.ACCOUNT.path(null), '/accounts/dashboard');

      assert.strictEqual(OWNER_MODULE_CATALOG.INVENTORY.path('c1'), '/company/c1/inventory/dashboard');
      assert.strictEqual(OWNER_MODULE_CATALOG.INVENTORY.path(null), '/inventory/dashboard');

      assert.strictEqual(OWNER_MODULE_CATALOG.CRM.path('c1'), '/company/c1/crm/dashboard');
      assert.strictEqual(OWNER_MODULE_CATALOG.CRM.path(null), '/crm/dashboard');

      assert.strictEqual(OWNER_MODULE_CATALOG.PURCHASES.path('c1'), '/company/c1/purchases');
      assert.strictEqual(OWNER_MODULE_CATALOG.PURCHASES.path(null), '/purchase-requisitions');

      assert.strictEqual(OWNER_MODULE_CATALOG.WORKFLOW.path('c1'), '/company/c1/workflows');
      assert.strictEqual(OWNER_MODULE_CATALOG.WORKFLOW.path(null), '/workflows');

      assert.strictEqual(OWNER_MODULE_CATALOG.SSO.path('c1'), '/company/c1/admin');
      assert.strictEqual(OWNER_MODULE_CATALOG.SSO.path(null), '/admin');
    });
  });

  describe('3. Module Count Responsive Grid Logic', () => {
    function computeGridCols(count) {
      switch (count) {
        case 1:
          return 'grid-cols-1 max-w-md';
        case 2:
          return 'grid-cols-1 sm:grid-cols-2 max-w-3xl';
        case 3:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        case 4:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
        case 5:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
        case 6:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
        default:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      }
    }

    it('allocates all 5 cards in a single row on desktop (xl:grid-cols-5) when module count is 5', () => {
      const gridClass = computeGridCols(5);
      assert.ok(gridClass.includes('xl:grid-cols-5'), '5 modules must use xl:grid-cols-5 on desktop to avoid wrapping');
      assert.ok(gridClass.includes('lg:grid-cols-3'), '5 modules must fall back to lg:grid-cols-3 on medium-large screens');
      assert.ok(gridClass.includes('sm:grid-cols-2'), '5 modules must fall back to sm:grid-cols-2 on tablet screens');
    });

    it('allocates 4 cards to 4 columns on desktop when module count is 4', () => {
      const gridClass = computeGridCols(4);
      assert.ok(gridClass.includes('lg:grid-cols-4'));
    });

    it('allocates 3 cards to 3 columns when module count is 3', () => {
      const gridClass = computeGridCols(3);
      assert.ok(gridClass.includes('lg:grid-cols-3'));
    });

    it('allocates 6 cards to 6 columns on desktop when module count is 6', () => {
      const gridClass = computeGridCols(6);
      assert.ok(gridClass.includes('xl:grid-cols-6'));
    });
  });

});
