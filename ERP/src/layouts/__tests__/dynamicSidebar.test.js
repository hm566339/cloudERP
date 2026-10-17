import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildDynamicSidebar,
  getAuthorizedNavigation,
  hasPermission,
  MODULE_UI_METADATA,
} from '../dynamicSidebarConfig.js';
import { CANONICAL_MODULES, buildAuthContext } from '../../utils/moduleNormalization.js';

describe('Fully Dynamic Role-Based ERP Sidebar Navigation Suite', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: OWNER with all five modules receives only configured, authorized menu items
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 1: OWNER with all 5 modules receives only configured, authorized menu items', () => {
    const rawSsoMe = {
      user: { id: 'owner-1', role: 'owner', email: 'owner@enterprise.com' },
      organization: { id: 'org-1', code: 'ENT_ORG' },
      currentCompany: { id: 'comp-100', code: 'ENT_CO', name: 'Enterprise Co' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { id: 'm1', code: 'account', canonical: 'ACCOUNT', active: true },
        { id: 'm2', code: 'inventory', canonical: 'INVENTORY', active: true },
        { id: 'm3', code: 'crm', canonical: 'CRM', active: true },
        { id: 'm4', code: 'workflow', canonical: 'WORKFLOW', active: true },
        { id: 'm5', code: 'sso', canonical: 'SSO', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', moduleName: 'ACCOUNT', active: true },
        { featureCode: 'SALES_INVOICES', moduleName: 'ACCOUNT', active: true },
        { featureCode: 'PRODUCTS', moduleName: 'INVENTORY', active: true },
        { featureCode: 'WAREHOUSES', moduleName: 'INVENTORY', active: true },
        { featureCode: 'LEADS', moduleName: 'CRM', active: true },
        { featureCode: 'WORKFLOW_DEFINITIONS', moduleName: 'WORKFLOW', active: true },
        { featureCode: 'USER_MANAGEMENT', moduleName: 'SSO', active: true },
      ],
      permissions: [
        'CUSTOMERS:READ',
        'SALES_INVOICES:READ',
        'PRODUCTS:READ',
        'WAREHOUSES:READ',
        'LEADS:READ',
        'WORKFLOW_DEFINITIONS:READ',
        'USER_MANAGEMENT:READ',
      ],
    };

    const authContext = buildAuthContext(rawSsoMe);
    const links = buildDynamicSidebar({
      authContext,
      companyId: 'comp-100',
      userRole: 'owner',
      isSuperAdminGlobal: false,
    });

    const moduleIds = links.map((l) => l.id);
    assert.ok(moduleIds.includes('accounts'), 'Accounts section must be present');
    assert.ok(moduleIds.includes('inventory'), 'Inventory Management section must be present');
    assert.ok(moduleIds.includes('sales-crm'), 'Sales & CRM section must be present');
    assert.ok(moduleIds.includes('workflow'), 'Workflow section must be present');
    assert.ok(moduleIds.includes('admin'), 'SSO & Administration section must be present');

    // Granular feature check: Only authorized items appear
    const invModule = links.find((l) => l.id === 'inventory');
    const invChildren = invModule.children;
    // Products group should contain Products
    const prodGroup = invChildren.find((c) => c.id === 'inv-products-group');
    assert.ok(prodGroup, 'Products group should exist');
    assert.ok(prodGroup.children.some((c) => c.id === 'inv-products'));
    // Unassigned features like PRODUCT_CATEGORIES must NOT appear
    assert.strictEqual(prodGroup.children.some((c) => c.id === 'inv-product-categories'), false);
    // Unassigned stock operations group must NOT appear
    assert.strictEqual(invChildren.some((c) => c.id === 'inv-stock-ops-group'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: User with ACCOUNT and INVENTORY only does NOT see CRM, WORKFLOW, SSO
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 2: User with ACCOUNT and INVENTORY only does not see CRM, WORKFLOW, or SSO sections', () => {
    const rawSsoMe = {
      user: { id: 'user-ops', role: 'manager' },
      currentCompany: { id: 'comp-200', code: 'OPS_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
        { code: 'inventory', canonical: 'INVENTORY', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', active: true },
        { featureCode: 'PRODUCTS', active: true },
      ],
      permissions: [
        'CUSTOMERS:READ',
        'PRODUCTS:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawSsoMe,
      companyId: 'comp-200',
      userRole: 'manager',
    });

    const sectionIds = links.map((l) => l.id);
    assert.ok(sectionIds.includes('accounts'), 'Accounts should be displayed');
    assert.ok(sectionIds.includes('inventory'), 'Inventory should be displayed');
    assert.strictEqual(sectionIds.includes('sales-crm'), false, 'CRM must not be displayed');
    assert.strictEqual(sectionIds.includes('workflow'), false, 'Workflow must not be displayed');
    assert.strictEqual(sectionIds.includes('admin'), false, 'SSO & Admin must not be displayed');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: User with CRM and WORKFLOW only receives their authorized navigation
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 3: User with CRM and WORKFLOW only receives their authorized navigation', () => {
    const rawSsoMe = {
      user: { id: 'user-sales-wf', role: 'sales_rep' },
      currentCompany: { id: 'comp-300', code: 'SALES_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'crm', canonical: 'CRM', active: true },
        { code: 'workflow', canonical: 'WORKFLOW', active: true },
      ],
      features: [
        { featureCode: 'LEADS', active: true },
        { featureCode: 'WORKFLOW_DEFINITIONS', active: true },
      ],
      permissions: [
        'LEADS:READ',
        'WORKFLOW_DEFINITIONS:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawSsoMe,
      companyId: 'comp-300',
      userRole: 'sales_rep',
    });

    const sectionIds = links.map((l) => l.id);
    assert.ok(sectionIds.includes('sales-crm'), 'CRM should be displayed');
    assert.ok(sectionIds.includes('workflow'), 'Workflow should be displayed');
    assert.strictEqual(sectionIds.includes('accounts'), false, 'Accounts must not be displayed');
    assert.strictEqual(sectionIds.includes('inventory'), false, 'Inventory must not be displayed');
    assert.strictEqual(sectionIds.includes('admin'), false, 'SSO must not be displayed');

    const crmSection = links.find((l) => l.id === 'sales-crm');
    assert.ok(crmSection.children.some((c) => c.id === 'crm-leads'));
    assert.strictEqual(crmSection.children.some((c) => c.id === 'crm-orders'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: User missing PRODUCTS:READ cannot see the Products menu item
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 4: User missing PRODUCTS:READ cannot see the Products menu item', () => {
    const rawSsoMe = {
      user: { id: 'warehouse-clerk', role: 'clerk' },
      currentCompany: { id: 'comp-400', code: 'WH_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'inventory', canonical: 'INVENTORY', active: true },
      ],
      features: [
        { featureCode: 'PRODUCTS', active: true },
        { featureCode: 'WAREHOUSES', active: true },
      ],
      // User only has WRITE on products, NOT READ! (WRITE does NOT imply READ)
      permissions: [
        'PRODUCTS:WRITE',
        'WAREHOUSES:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawSsoMe,
      companyId: 'comp-400',
      userRole: 'clerk',
    });

    const invSection = links.find((l) => l.id === 'inventory');
    assert.ok(invSection, 'Inventory section should be displayed');

    // Flatten all child items
    const allLeafIds = [];
    const collectIds = (items) => {
      for (const item of items) {
        allLeafIds.push(item.id);
        if (item.children) collectIds(item.children);
      }
    };
    collectIds(invSection.children);

    assert.strictEqual(allLeafIds.includes('inv-products'), false, 'inv-products must NOT be visible without PRODUCTS:READ');
    assert.ok(allLeafIds.includes('inv-warehouse'), 'inv-warehouse must be visible with WAREHOUSES:READ');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: An inactive module (active: false) disappears from the sidebar
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 5: An inactive module (active: false) disappears from the sidebar', () => {
    const rawSsoMe = {
      user: { id: 'owner-deactivated', role: 'owner' },
      currentCompany: { id: 'comp-500', code: 'DEACT_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
        { code: 'crm', canonical: 'CRM', active: false }, // INACTIVE
      ],
      features: [
        { featureCode: 'CUSTOMERS', active: true },
        { featureCode: 'LEADS', active: true },
      ],
      permissions: [
        'CUSTOMERS:READ',
        'LEADS:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawSsoMe,
      companyId: 'comp-500',
      userRole: 'owner',
    });

    const sectionIds = links.map((l) => l.id);
    assert.ok(sectionIds.includes('accounts'), 'Active Accounts module should be visible');
    assert.strictEqual(sectionIds.includes('sales-crm'), false, 'Inactive CRM module must NOT appear in sidebar');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: A non-System-Admin user cannot access System Admin navigation or platform routes
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 6: A non-System-Admin user cannot access System Admin navigation', () => {
    const ordinaryOwnerContext = {
      user: { id: 'owner-org', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      permissions: ['ALL'], // Organization-level wildcard
    };

    // Even if isSuperAdminGlobal is mistakenly passed true, ordinary owner must NOT get platform navigation
    const links = buildDynamicSidebar({
      authContext: ordinaryOwnerContext,
      companyId: 'comp-600',
      userRole: 'owner',
      isSuperAdminGlobal: true, // Should be ignored because user is NOT system admin
    });

    const sectionIds = links.map((l) => l.id);
    assert.strictEqual(sectionIds.includes('sa-dashboard'), false, 'Non-superadmin must not receive sa-dashboard');
    assert.strictEqual(sectionIds.includes('sa-organizations'), false, 'Non-superadmin must not receive sa-organizations');
    assert.strictEqual(sectionIds.includes('sa-platform'), false, 'Non-superadmin must not receive sa-platform');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: System Admin existing navigation remains unchanged
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 7: System Admin existing navigation remains unchanged', () => {
    const superAdminContext = {
      user: { id: 'super-admin-1', role: 'super_admin' },
      accessMode: 'FULL',
      modules: [], // No tenant modules
      permissions: ['ALL'],
    };

    const links = buildDynamicSidebar({
      authContext: superAdminContext,
      userRole: 'super_admin',
      isSuperAdminGlobal: true,
    });

    const sectionIds = links.map((l) => l.id);
    assert.ok(sectionIds.includes('sa-dashboard'), 'Superadmin should receive sa-dashboard');
    assert.ok(sectionIds.includes('sa-organizations'), 'Superadmin should receive sa-organizations');
    assert.ok(sectionIds.includes('sa-org-management'), 'Superadmin should receive sa-org-management');
    assert.ok(sectionIds.includes('sa-platform'), 'Superadmin should receive sa-platform');
    assert.ok(sectionIds.includes('sa-plans'), 'Superadmin should receive sa-plans');
    assert.ok(sectionIds.includes('sa-system-logs'), 'Superadmin should receive sa-system-logs');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Switching companies refreshes the available modules, features, and permissions correctly
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 8: Switching companies refreshes the available modules, features, and permissions correctly', () => {
    // Company A: Basic Plan (Only ACCOUNT)
    const companyAContext = {
      user: { id: 'multi-co-user', role: 'admin' },
      currentCompany: { id: 'comp-A', name: 'Company A' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [{ featureCode: 'CUSTOMERS', active: true }],
      permissions: ['CUSTOMERS:READ'],
    };

    const navA = getAuthorizedNavigation(companyAContext, { companyId: 'comp-A' });
    const idsA = navA.map((l) => l.id);
    assert.deepStrictEqual(idsA, ['accounts']);

    // Switch to Company B: Enterprise Plan (ACCOUNT, INVENTORY, CRM, WORKFLOW, SSO)
    const companyBContext = {
      user: { id: 'multi-co-user', role: 'admin' },
      currentCompany: { id: 'comp-B', name: 'Company B' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
        { code: 'inventory', canonical: 'INVENTORY', active: true },
        { code: 'crm', canonical: 'CRM', active: true },
        { code: 'workflow', canonical: 'WORKFLOW', active: true },
        { code: 'sso', canonical: 'SSO', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', active: true },
        { featureCode: 'PRODUCTS', active: true },
        { featureCode: 'LEADS', active: true },
        { featureCode: 'WORKFLOW_DEFINITIONS', active: true },
        { featureCode: 'USER_MANAGEMENT', active: true },
      ],
      permissions: [
        'CUSTOMERS:READ',
        'PRODUCTS:READ',
        'LEADS:READ',
        'WORKFLOW_DEFINITIONS:READ',
        'USER_MANAGEMENT:READ',
      ],
    };

    const navB = getAuthorizedNavigation(companyBContext, { companyId: 'comp-B' });
    const idsB = navB.map((l) => l.id);
    assert.ok(idsB.includes('accounts'));
    assert.ok(idsB.includes('inventory'));
    assert.ok(idsB.includes('sales-crm'));
    assert.ok(idsB.includes('workflow'));
    assert.ok(idsB.includes('admin'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // EDGE CASES: Empty permissions, null company, blocked mode, empty groups pruning
  // ──────────────────────────────────────────────────────────────────────────
  it('Edge Cases: Blocked mode returns empty navigation', () => {
    const blockedContext = {
      user: { id: 'blocked-user', role: 'owner' },
      accessMode: 'BLOCKED',
      modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
    };
    const links = buildDynamicSidebar({ authContext: blockedContext });
    assert.deepStrictEqual(links, []);
  });

  it('Edge Cases: Empty permissions array grants NO feature access by default', () => {
    const emptyPermsContext = {
      user: { id: 'no-perms-user', role: 'employee' },
      currentCompany: { id: 'comp-999' },
      accessMode: 'FULL',
      modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
      features: [{ featureCode: 'CUSTOMERS', active: true }],
      permissions: [], // EMPTY
    };
    const links = buildDynamicSidebar({ authContext: emptyPermsContext, companyId: 'comp-999' });
    // Root dashboard may show if general, but no granular feature without permission
    const accSection = links.find((l) => l.id === 'accounts');
    if (accSection) {
      const allLeafIds = [];
      const collect = (items) => {
        for (const i of items) {
          allLeafIds.push(i.id);
          if (i.children) collect(i.children);
        }
      };
      collect(accSection.children);
      assert.strictEqual(allLeafIds.includes('acc-cust'), false, 'Customers must not be visible without CUSTOMERS:READ');
    }
  });

  it('Edge Cases: Empty parent groups are pruned from the navigation tree', () => {
    const singleFeatureContext = {
      user: { id: 'single-feature-user', role: 'auditor' },
      currentCompany: { id: 'comp-aud' },
      accessMode: 'FULL',
      modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
      features: [{ featureCode: 'AUDIT_LOGS', active: true }],
      permissions: ['AUDIT_LOGS:READ'],
    };

    const links = buildDynamicSidebar({ authContext: singleFeatureContext, companyId: 'comp-aud' });
    const accSection = links.find((l) => l.id === 'accounts');
    assert.ok(accSection, 'Accounts section should exist');

    const groupIds = accSection.children.map((c) => c.id);
    // Groups with 0 permitted children (Masters, Transactions, Tax, Bank, Budget) MUST be pruned
    assert.strictEqual(groupIds.includes('acc-masters'), false, 'Empty Masters group must be pruned');
    assert.strictEqual(groupIds.includes('acc-txn'), false, 'Empty Transactions group must be pruned');
    assert.strictEqual(groupIds.includes('acc-tax'), false, 'Empty Tax group must be pruned');
    assert.strictEqual(groupIds.includes('acc-bank'), false, 'Empty Bank group must be pruned');
    assert.strictEqual(groupIds.includes('acc-budget'), false, 'Empty Budget group must be pruned');
    // Settings group should survive because it contains permitted Audit Logs
    assert.ok(groupIds.includes('acc-settings'), 'Settings group should survive');
  });

  it('Edge Cases: hasPermission strictly enforces action matching (WRITE does not imply READ)', () => {
    const authCtx = {
      permissions: [
        'PRODUCTS:WRITE',
        'CUSTOMERS:DELETE',
        'DASHBOARD:READ',
      ],
    };

    assert.strictEqual(hasPermission(authCtx, 'PRODUCTS', 'READ'), false);
    assert.strictEqual(hasPermission(authCtx, 'PRODUCTS', 'WRITE'), true);
    assert.strictEqual(hasPermission(authCtx, 'CUSTOMERS', 'READ'), false);
    assert.strictEqual(hasPermission(authCtx, 'CUSTOMERS', 'DELETE'), true);
    assert.strictEqual(hasPermission(authCtx, 'DASHBOARD', 'READ'), true);
  });
});
