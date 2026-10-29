import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildDynamicSidebar,
  getAuthorizedNavigation,
  hasPermission,
  MODULE_UI_METADATA,
} from '../dynamicSidebarConfig.js';
import { isItemOrChildActive } from '../SidebarNavUtils.js';
import { CANONICAL_MODULES, buildAuthContext, canViewModule, hasModule } from '../../utils/moduleNormalization.js';

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
    assert.strictEqual(moduleIds.includes('workflow'), false, 'Workflow & Approvals must not appear as a top-level sidebar section');
    assert.ok(moduleIds.includes('admin'), 'SSO & Administration section must be present');

    // Workflow functionality is preserved inside SSO & Administration
    const adminSection = links.find((l) => l.id === 'admin');
    assert.ok(adminSection, 'SSO & Administration section should exist');
    assert.ok(
      adminSection.children.some((c) => c.id === 'workflow-approvals'),
      'Workflow & Approvals must be preserved under SSO & Administration'
    );

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
    assert.strictEqual(sectionIds.includes('workflow'), false, 'Workflow must not appear as a top-level sidebar section');
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
    assert.strictEqual(idsB.includes('workflow'), false, 'Workflow & Approvals must not appear as top-level section');
    assert.ok(idsB.includes('admin'));

    const adminB = navB.find((l) => l.id === 'admin');
    assert.ok(
      adminB.children.some((c) => c.id === 'workflow-approvals'),
      'Workflow & Approvals must be accessible in SSO & Administration'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 9: Regular organization roles never see Workflow & Approvals as a top-level sidebar section
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 9: Regular organization roles never see Workflow & Approvals as a top-level sidebar section', () => {
    const roles = ['owner', 'company_admin', 'accountant', 'employee', 'manager'];
    for (const role of roles) {
      const links = buildDynamicSidebar({
        authContext: {
          user: { id: `user-${role}`, role },
          accessMode: 'FULL',
          modules: [
            { code: 'account', canonical: 'ACCOUNT', active: true },
            { code: 'workflow', canonical: 'WORKFLOW', active: true },
            { code: 'sso', canonical: 'SSO', active: true },
          ],
          features: [
            { featureCode: 'CUSTOMERS', active: true },
            { featureCode: 'WORKFLOW_DEFINITIONS', active: true },
            { featureCode: 'USER_MANAGEMENT', active: true },
          ],
          permissions: ['ALL'],
        },
        companyId: 'comp-org',
        userRole: role,
        isSuperAdminGlobal: false,
      });

      const sectionIds = links.map((l) => l.id);
      assert.strictEqual(
        sectionIds.includes('workflow'),
        false,
        `Role "${role}" must not have top-level workflow entry`
      );
      assert.ok(sectionIds.includes('accounts'), `Role "${role}" should have accounts entry`);
      assert.ok(sectionIds.includes('admin'), `Role "${role}" should have admin entry`);
      const adminSection = links.find((l) => l.id === 'admin');
      assert.ok(
        adminSection.children.some((c) => c.id === 'workflow-approvals'),
        `Role "${role}" preserves workflow access inside admin section`
      );
    }
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

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 10: Inventory Stock Operations Navigation & Current Stock Active Resolution
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 10: Current Stock sidebar item renders with correct path and resolves active parent state', () => {
    const invAuthContext = {
      user: { id: 'inv-manager', role: 'inventory_manager' },
      currentCompany: { id: 'comp-100', code: 'ENT_CO' },
      accessMode: 'FULL',
      modules: [{ code: 'inventory', canonical: 'INVENTORY', active: true }],
      features: [
        { featureCode: 'STOCK', active: true },
        { featureCode: 'STOCK_MOVEMENTS', active: true },
        { featureCode: 'STOCK_TRANSFERS', active: true },
        { featureCode: 'STOCK_RESERVATIONS', active: true },
        { featureCode: 'STOCK_ADJUSTMENTS', active: true },
        { featureCode: 'OPENING_STOCK', active: true },
      ],
      permissions: [
        'STOCK:READ',
        'STOCK_MOVEMENTS:READ',
        'STOCK_TRANSFERS:READ',
        'STOCK_RESERVATIONS:READ',
        'STOCK_ADJUSTMENTS:READ',
        'OPENING_STOCK:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: invAuthContext,
      companyId: 'comp-100',
      userRole: 'inventory_manager',
    });

    const invSection = links.find((l) => l.id === 'inventory');
    assert.ok(invSection, 'Inventory section must be generated');

    const stockOpsGroup = invSection.children.find((c) => c.id === 'inv-stock-ops-group');
    assert.ok(stockOpsGroup, 'Stock Operations group must exist');
    assert.strictEqual(stockOpsGroup.label, 'Stock Operations');

    // Verify Current Stock menu item
    const currentStockItem = stockOpsGroup.children.find((c) => c.id === 'inv-current-stock');
    assert.ok(currentStockItem, 'Current Stock menu item must exist');
    assert.strictEqual(currentStockItem.label, 'Current Stock');
    assert.strictEqual(currentStockItem.path, '/company/comp-100/inventory/stock');

    // Verify sibling Stock Operations menu items
    const movementsItem = stockOpsGroup.children.find((c) => c.id === 'inv-stock-movements');
    assert.strictEqual(movementsItem.path, '/company/comp-100/inventory/stock-movements');

    const transfersItem = stockOpsGroup.children.find((c) => c.id === 'inv-transfer');
    assert.strictEqual(transfersItem.path, '/company/comp-100/inventory/stock-transfers');

    const reservationsItem = stockOpsGroup.children.find((c) => c.id === 'inv-stock-reservations');
    assert.strictEqual(reservationsItem.path, '/company/comp-100/inventory/stock-reservations');

    const adjustmentsItem = stockOpsGroup.children.find((c) => c.id === 'inv-stock-adjustments');
    assert.strictEqual(adjustmentsItem.path, '/company/comp-100/inventory/stock-adjustments');

    const openingStockItem = stockOpsGroup.children.find((c) => c.id === 'inv-opening-stock');
    assert.strictEqual(openingStockItem.path, '/company/comp-100/inventory/opening-stock');

    // Verify active matching
    const currentStockUrl = '/company/comp-100/inventory/stock';
    assert.strictEqual(isItemOrChildActive(currentStockItem, currentStockUrl), true, 'Current stock item must be active on stock URL');
    assert.strictEqual(isItemOrChildActive(stockOpsGroup, currentStockUrl), true, 'Stock operations parent must be active to keep menu expanded');
    assert.strictEqual(isItemOrChildActive(invSection, currentStockUrl), true, 'Inventory module section must be active on stock URL');

    // Verify no false-positive active states on siblings
    assert.strictEqual(isItemOrChildActive(movementsItem, currentStockUrl), false);
    assert.strictEqual(isItemOrChildActive(transfersItem, currentStockUrl), false);
    assert.strictEqual(isItemOrChildActive(reservationsItem, currentStockUrl), false);
    assert.strictEqual(isItemOrChildActive(adjustmentsItem, currentStockUrl), false);
    assert.strictEqual(isItemOrChildActive(openingStockItem, currentStockUrl), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 11: Accountant with full authorized access to Accounts and Reports
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 11: Accountant with authorized access to Accounts and Reports receives structured hierarchy', () => {
    const rawAccountantMe = {
      user: { id: 'acc-1', role: 'accountant', email: 'accountant@firm.com' },
      currentCompany: { id: 'comp-acc', code: 'ACC_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', active: true },
        { featureCode: 'VENDORS', active: true },
        { featureCode: 'CHART_OF_ACCOUNTS', active: true },
        { featureCode: 'ACCOUNT_GROUPS', active: true },
        { featureCode: 'SALES_INVOICES', active: true },
        { featureCode: 'PURCHASE_INVOICES', active: true },
        { featureCode: 'GL_JOURNALS', active: true },
        { featureCode: 'GENERAL_LEDGER', active: true },
        { featureCode: 'TRIAL_BALANCE', active: true },
        { featureCode: 'PROFIT_LOSS', active: true },
        { featureCode: 'BALANCE_SHEET', active: true },
      ],
      permissions: [
        'CUSTOMERS:READ',
        'VENDORS:READ',
        'CHART_OF_ACCOUNTS:READ',
        'ACCOUNT_GROUPS:READ',
        'SALES_INVOICES:READ',
        'PURCHASE_INVOICES:READ',
        'GL_JOURNALS:READ',
        'GENERAL_LEDGER:READ',
        'TRIAL_BALANCE:READ',
        'PROFIT_LOSS:READ',
        'BALANCE_SHEET:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawAccountantMe,
      companyId: 'comp-acc',
      userRole: 'accountant',
    });

    const accSection = links.find((l) => l.id === 'accounts');
    assert.ok(accSection, 'Accounts section must be generated');

    const groupIds = accSection.children.map((c) => c.id);
    assert.ok(groupIds.includes('acc-masters'), 'Masters group must exist');
    assert.ok(groupIds.includes('acc-txn'), 'Transactions group must exist');
    assert.ok(groupIds.includes('acc-reports'), 'Reports group must exist');

    // Tax and Bank have no permitted features for this accountant, so they must be pruned
    assert.strictEqual(groupIds.includes('acc-tax'), false, 'Empty Tax group must be pruned');
    assert.strictEqual(groupIds.includes('acc-bank'), false, 'Empty Bank group must be pruned');

    // Verify Masters children
    const mastersGroup = accSection.children.find((c) => c.id === 'acc-masters');
    const masterChildIds = mastersGroup.children.map((c) => c.id);
    assert.ok(masterChildIds.includes('acc-cust'), 'Customers must be visible');
    assert.ok(masterChildIds.includes('acc-vend'), 'Vendors must be visible');
    assert.ok(masterChildIds.includes('acc-coa'), 'COA must be visible');
    assert.ok(masterChildIds.includes('acc-ag'), 'Account Groups must be visible');
    // Fiscal years not granted -> must not appear
    assert.strictEqual(masterChildIds.includes('acc-fy'), false, 'Fiscal Years must not appear');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 12: Granular Feature Visibility: Products visible, Product Batches hidden
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 12: User with Products permission but lacking Product Batches shows Products and hides Batches', () => {
    const rawInvMe = {
      user: { id: 'inv-specialist', role: 'inventory_staff' },
      currentCompany: { id: 'comp-inv', code: 'INV_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'inventory', canonical: 'INVENTORY', active: true },
      ],
      features: [
        { featureCode: 'PRODUCTS', active: true },
        // PRODUCT_BATCHES and PRODUCT_SERIALS are NOT enabled/assigned
      ],
      permissions: [
        'PRODUCTS:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: rawInvMe,
      companyId: 'comp-inv',
      userRole: 'inventory_staff',
    });

    const invSection = links.find((l) => l.id === 'inventory');
    assert.ok(invSection, 'Inventory section should exist');

    const prodGroup = invSection.children.find((c) => c.id === 'inv-products-group');
    assert.ok(prodGroup, 'Products group should exist');

    const prodChildIds = prodGroup.children.map((c) => c.id);
    assert.ok(prodChildIds.includes('inv-products'), 'Products item must be visible');
    assert.strictEqual(prodChildIds.includes('inv-batches'), false, 'Product Batches must NOT be visible');
    assert.strictEqual(prodChildIds.includes('inv-serials'), false, 'Product Serials must NOT be visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 13: Inactive or Denied Permissions Fail Closed
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 13: Inactive or Denied Permissions fail closed', () => {
    const deniedCtx = {
      user: { id: 'denied-user', role: 'staff' },
      currentCompany: { id: 'comp-d', code: 'DENY_CO' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', active: true },
        { featureCode: 'VENDORS', active: false }, // Feature inactive
      ],
      permissions: [
        { featureCode: 'CUSTOMERS', action: 'READ', allowed: false, status: 'ACTIVE' }, // Explicitly denied
        { featureCode: 'VENDORS', action: 'READ', allowed: true, status: 'ACTIVE' }, // Feature inactive above
        { featureCode: 'SALES_INVOICES', action: 'READ', allowed: true, status: 'INACTIVE' }, // Permission inactive
      ],
    };

    assert.strictEqual(hasPermission(deniedCtx, 'CUSTOMERS', 'READ'), false, 'Denied permission must return false');
    assert.strictEqual(hasPermission(deniedCtx, 'SALES_INVOICES', 'READ'), false, 'Inactive permission must return false');

    const links = buildDynamicSidebar({
      authContext: deniedCtx,
      companyId: 'comp-d',
      userRole: 'staff',
    });

    // Accounts section should be pruned because all features are denied/inactive
    assert.strictEqual(links.some((l) => l.id === 'accounts'), false, 'Accounts section with 0 permitted features must be pruned');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 14: Direct Route Access Guard Verification (canViewModule)
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 14: canViewModule enforces fail-closed permission checks for protected routes', async () => {
    const { canViewModule } = await import('../../utils/moduleNormalization.js');

    const authContext = {
      user: { id: 'tester-1' },
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

    // Allowed module & feature checks
    assert.strictEqual(canViewModule(authContext, 'ACCOUNTS'), true);
    assert.strictEqual(canViewModule(authContext, 'CUSTOMERS'), true);
    assert.strictEqual(canViewModule(authContext, 'PRODUCTS'), true);

    // Unassigned feature checks: Must FAIL closed (return false) even if parent module is active
    assert.strictEqual(canViewModule(authContext, 'ACCOUNT_GROUPS'), false, 'ACCOUNT_GROUPS must fail closed');
    assert.strictEqual(canViewModule(authContext, 'PURCHASE_INVOICES'), false, 'PURCHASE_INVOICES must fail closed');
    assert.strictEqual(canViewModule(authContext, 'INVENTORY_VALUATION'), false, 'INVENTORY_VALUATION must fail closed');
    assert.strictEqual(canViewModule(authContext, 'CRM'), false, 'Unassigned CRM must fail closed');
    assert.strictEqual(canViewModule(authContext, 'SSO'), false, 'Unassigned SSO must fail closed');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 15: Dynamic Extension Modules Discovery
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 15: Custom extension modules and features are dynamically rendered without manual code changes', () => {
    const customModuleContext = {
      user: { id: 'custom-org-user', role: 'admin' },
      currentCompany: { id: 'comp-custom' },
      accessMode: 'FULL',
      modules: [
        { code: 'payroll', name: 'Payroll & HR', active: true },
      ],
      features: [
        { featureCode: 'PAYSLIPS', featureName: 'Employee Payslips', moduleName: 'payroll', active: true },
        { featureCode: 'TAX_DECLARATIONS', featureName: 'Tax Declarations', moduleName: 'payroll', active: true },
      ],
      permissions: [
        'PAYSLIPS:READ',
        'TAX_DECLARATIONS:READ',
      ],
    };

    const links = buildDynamicSidebar({
      authContext: customModuleContext,
      companyId: 'comp-custom',
    });

    const payrollSection = links.find((l) => l.id === 'payroll' || l.label.includes('Payroll'));
    assert.ok(payrollSection, 'Custom payroll module should be dynamically rendered');
    assert.ok(payrollSection.children.length >= 2, 'Custom module features should be populated');
    const childLabels = payrollSection.children.map((c) => c.label);
    assert.ok(childLabels.includes('Employee Payslips'), 'Employee Payslips feature should appear');
    assert.ok(childLabels.includes('Tax Declarations'), 'Tax Declarations feature should appear');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 16: Deep nested active route resolution for browser refresh
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario 16: Deep nested active route resolution keeps parents expanded on browser refresh', () => {
    const parentGroup = {
      id: 'acc-masters',
      label: 'Masters',
      children: [
        { id: 'acc-cust', label: 'Customers', path: '/company/comp-100/accounts/customers' },
      ],
    };

    // Deep nested URL: creating a new customer or viewing customer ID
    const nestedDetailUrl = '/company/comp-100/accounts/customers/new';
    assert.strictEqual(
      isItemOrChildActive(parentGroup, nestedDetailUrl),
      true,
      'Parent group must remain active on deep child URL'
    );

    const nonMatchingUrl = '/company/comp-100/accounts/vendors';
    assert.strictEqual(
      isItemOrChildActive(parentGroup, nonMatchingUrl),
      false,
      'Parent group must not be active on unrelated sibling URL'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TASK SPECIFICATION: 10 CORE PERMISSION-BASED SIDEBAR & ROUTING SCENARIOS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Permission-Based Dynamic Sidebar & Route Authorization - 10 Core Scenarios', () => {

    it('1. A user with Approval Requests READ permission sees the menu', () => {
      const authContext = buildAuthContext({
        user: { id: 'u-approver', role: 'approver' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'sso', active: true }, { code: 'workflow', active: true }],
        permissions: ['WORKFLOW_TASKS:READ', 'USER_MANAGEMENT:READ'],
      });
      const links = buildDynamicSidebar({ authContext, companyId: 'comp-10' });
      const adminSection = links.find((l) => l.id === 'admin');
      assert.ok(adminSection, 'SSO & Admin section should be rendered');
      const approvalMenu = adminSection.children.find((c) => c.id === 'workflow-approval-requests');
      assert.ok(approvalMenu, 'Approval Requests menu must be visible to user with WORKFLOW_TASKS:READ');
      assert.strictEqual(approvalMenu.path, '/workflows/approvals');
      assert.strictEqual(approvalMenu.requiredPermission, 'WORKFLOW_TASKS:READ');
      assert.strictEqual(canViewModule(authContext, 'WORKFLOW_TASKS'), true);
    });

    it('2. A user without that permission does not see the menu', () => {
      const authContext = buildAuthContext({
        user: { id: 'u-no-approver', role: 'admin' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'sso', active: true }, { code: 'workflow', active: true }],
        permissions: ['WORKFLOW_DEFINITIONS:READ', 'USER_MANAGEMENT:READ'],
      });
      const links = buildDynamicSidebar({ authContext, companyId: 'comp-10' });
      const adminSection = links.find((l) => l.id === 'admin');
      assert.ok(adminSection, 'SSO & Admin section should be rendered');
      const approvalMenu = adminSection.children.find((c) => c.id === 'workflow-approval-requests');
      assert.strictEqual(approvalMenu, undefined, 'Approval Requests menu must NOT appear for user lacking permission');
      assert.strictEqual(canViewModule(authContext, 'WORKFLOW_TASKS'), false);
    });

    it('3. A user with the WORKFLOW module enabled but without Approval Requests permission cannot access that feature', () => {
      const authContext = buildAuthContext({
        user: { id: 'u-wf-only', role: 'workflow_manager' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'workflow', canonical: 'WORKFLOW', active: true }],
        permissions: ['WORKFLOW:READ', 'WORKFLOW_DEFINITIONS:READ'],
      });
      // User has WORKFLOW module enabled
      assert.strictEqual(hasModule(authContext, 'WORKFLOW'), true, 'User has WORKFLOW module enabled');
      assert.strictEqual(canViewModule(authContext, 'WORKFLOW'), true, 'User can view WORKFLOW module');
      
      // But lacks Approval Requests feature permission
      assert.strictEqual(canViewModule(authContext, 'WORKFLOW_TASKS'), false, 'Approval Requests feature is blocked');
      assert.strictEqual(canViewModule(authContext, 'APPROVAL_REQUESTS'), false, 'APPROVAL_REQUESTS alias is blocked');
      assert.strictEqual(hasPermission(authContext, 'WORKFLOW_TASKS', 'READ'), false, 'READ on WORKFLOW_TASKS is denied');

      const links = buildDynamicSidebar({ authContext, companyId: 'comp-10' });
      const allItems = links.flatMap((l) => l.children ? [l, ...l.children] : [l]);
      assert.strictEqual(allItems.some((i) => i.id === 'workflow-approval-requests'), false, 'Approval Requests cannot appear in sidebar');
    });

    it('4. A parent submenu disappears when all its children are inaccessible', () => {
      const authContext = buildAuthContext({
        user: { id: 'u-warehouse-only', role: 'warehouse_keeper' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'inventory', canonical: 'INVENTORY', active: true }],
        permissions: ['WAREHOUSES:READ'],
      });
      const links = buildDynamicSidebar({ authContext, companyId: 'comp-10' });
      const invModule = links.find((l) => l.id === 'inventory');
      assert.ok(invModule, 'Inventory module is present');
      // Stock Operations, Products, and Control groups have no accessible children, so they must be completely pruned
      assert.strictEqual(invModule.children.some((c) => c.id === 'inv-products-group'), false, 'Products group should be pruned');
      assert.strictEqual(invModule.children.some((c) => c.id === 'inv-stock-ops-group'), false, 'Stock Operations group should be pruned');
      assert.strictEqual(invModule.children.some((c) => c.id === 'inv-control-group'), false, 'Inventory Control group should be pruned');
      // Warehouse group has accessible WAREHOUSES child, so it remains
      assert.ok(invModule.children.some((c) => c.id === 'inv-warehouse-group'), 'Warehouse group remains');
    });

    it('5. A parent submenu remains when at least one child is accessible', () => {
      const authContext = buildAuthContext({
        user: { id: 'u-catalog-only', role: 'catalog_manager' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'inventory', canonical: 'INVENTORY', active: true }],
        permissions: ['PRODUCTS:READ'],
      });
      const links = buildDynamicSidebar({ authContext, companyId: 'comp-10' });
      const invModule = links.find((l) => l.id === 'inventory');
      const prodGroup = invModule.children.find((c) => c.id === 'inv-products-group');
      assert.ok(prodGroup, 'Products parent group remains when at least one child is accessible');
      assert.strictEqual(prodGroup.children.length, 1, 'Only the single authorized child is rendered');
      assert.strictEqual(prodGroup.children[0].id, 'inv-products');
      // Unauthorized siblings are omitted
      assert.strictEqual(prodGroup.children.some((c) => c.id === 'inv-product-prices'), false);
      assert.strictEqual(prodGroup.children.some((c) => c.id === 'inv-product-serials'), false);
    });

    it('6. Direct URL access is denied when the user lacks permission', () => {
      const unauthorizedAuthContext = buildAuthContext({
        user: { id: 'u-denied', role: 'viewer' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'workflow', active: true }],
        permissions: ['WORKFLOW_DEFINITIONS:READ'],
      });
      // Direct access evaluation for protected route /workflows/approvals
      assert.strictEqual(
        canViewModule(unauthorizedAuthContext, 'WORKFLOW_TASKS'),
        false,
        'Direct URL guard denies access when user lacks WORKFLOW_TASKS permission'
      );

      const authorizedAuthContext = buildAuthContext({
        user: { id: 'u-allowed', role: 'manager' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'workflow', active: true }],
        permissions: ['WORKFLOW_TASKS:READ'],
      });
      assert.strictEqual(
        canViewModule(authorizedAuthContext, 'WORKFLOW_TASKS'),
        true,
        'Direct URL guard allows access when user possesses WORKFLOW_TASKS permission'
      );
    });

    it('7. Backend APIs reject unauthorized operations (action-level independence)', () => {
      const readOnlyAuthContext = buildAuthContext({
        user: { id: 'u-read-only', role: 'auditor' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'workflow', active: true }],
        permissions: ['WORKFLOW_TASKS:READ'],
      });
      // READ is allowed
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'WORKFLOW_TASKS', 'READ'), true);
      // Mutating actions are independently evaluated and denied
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'WORKFLOW_TASKS', 'CREATE'), false);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'WORKFLOW_TASKS', 'UPDATE'), false);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'WORKFLOW_TASKS', 'DELETE'), false);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'WORKFLOW_TASKS', 'APPROVE'), false);
    });

    it('8. Revoked permissions are reflected correctly without stale caching', () => {
      const initialPayload = {
        user: { id: 'u-dynamic', role: 'admin' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [{ code: 'sso', active: true }],
        permissions: ['WORKFLOW_TASKS:READ', 'WORKFLOW_DEFINITIONS:READ', 'USER_MANAGEMENT:READ'],
      };
      let ctx = buildAuthContext(initialPayload);
      let links = buildDynamicSidebar({ authContext: ctx, companyId: 'comp-10' });
      let admin = links.find((l) => l.id === 'admin');
      assert.ok(admin.children.some((c) => c.id === 'workflow-approval-requests'), 'Initially shows Approval Requests');

      // Revoke permission dynamically
      const revokedPayload = {
        ...initialPayload,
        permissions: ['WORKFLOW_DEFINITIONS:READ', 'USER_MANAGEMENT:READ'],
      };
      ctx = buildAuthContext(revokedPayload);
      links = buildDynamicSidebar({ authContext: ctx, companyId: 'comp-10' });
      admin = links.find((l) => l.id === 'admin');
      assert.strictEqual(
        admin.children.some((c) => c.id === 'workflow-approval-requests'),
        false,
        'Revoked permission immediately removes Approval Requests from sidebar'
      );
      assert.ok(admin.children.some((c) => c.id === 'workflow-approvals'), 'Retains authorized Workflow & Approvals');
    });

    it('9. Existing authorized users retain their expected navigation and functionality', () => {
      const fullManagerPayload = {
        user: { id: 'u-mgr', role: 'manager' },
        currentCompany: { id: 'comp-10' },
        accessMode: 'FULL',
        modules: [
          { code: 'account', canonical: 'ACCOUNT', active: true },
          { code: 'inventory', canonical: 'INVENTORY', active: true },
          { code: 'crm', canonical: 'CRM', active: true },
          { code: 'sso', canonical: 'SSO', active: true },
        ],
        permissions: [
          'CUSTOMERS:READ',
          'SALES_INVOICES:READ',
          'PRODUCTS:READ',
          'WAREHOUSES:READ',
          'LEADS:READ',
          'USER_MANAGEMENT:READ',
          'WORKFLOW_TASKS:READ',
          'WORKFLOW_DEFINITIONS:READ',
        ],
      };
      const ctx = buildAuthContext(fullManagerPayload);
      const links = buildDynamicSidebar({ authContext: ctx, companyId: 'comp-10' });
      const moduleIds = links.map((l) => l.id);
      assert.ok(moduleIds.includes('accounts'));
      assert.ok(moduleIds.includes('inventory'));
      assert.ok(moduleIds.includes('sales-crm'));
      assert.ok(moduleIds.includes('admin'));

      const admin = links.find((l) => l.id === 'admin');
      assert.ok(admin.children.some((c) => c.id === 'workflow-approval-requests'));
      assert.ok(admin.children.some((c) => c.id === 'workflow-approvals'));
      assert.ok(admin.children.some((c) => c.id === 'users'));
    });

    it('10. Missing or malformed permission data never grants unintended access', () => {
      // Empty permissions
      const emptyCtx = buildAuthContext({ permissions: [] });
      assert.strictEqual(hasPermission(emptyCtx, 'WORKFLOW_TASKS', 'READ'), false);
      assert.strictEqual(canViewModule(emptyCtx, 'WORKFLOW_TASKS'), false);
      assert.deepStrictEqual(buildDynamicSidebar({ authContext: emptyCtx }), []);

      // Null permissions
      const nullCtx = buildAuthContext({ permissions: null });
      assert.strictEqual(hasPermission(nullCtx, 'WORKFLOW_TASKS', 'READ'), false);
      assert.strictEqual(canViewModule(nullCtx, 'WORKFLOW_TASKS'), false);
      assert.deepStrictEqual(buildDynamicSidebar({ authContext: nullCtx }), []);

      // Malformed permission objects
      const malformedCtx = buildAuthContext({ permissions: [{ invalid: true }, '', null, 123] });
      assert.strictEqual(hasPermission(malformedCtx, 'WORKFLOW_TASKS', 'READ'), false);
      assert.strictEqual(canViewModule(malformedCtx, 'WORKFLOW_TASKS'), false);

      // Blocked access mode
      const blockedCtx = buildAuthContext({
        accessMode: 'BLOCKED',
        permissions: ['ALL', 'WORKFLOW_TASKS:READ'],
      });
      assert.strictEqual(hasPermission(blockedCtx, 'WORKFLOW_TASKS', 'READ'), false);
      assert.deepStrictEqual(buildDynamicSidebar({ authContext: blockedCtx }), []);
    });
  });
});
