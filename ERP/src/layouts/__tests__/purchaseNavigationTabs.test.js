import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildDynamicSidebar } from '../dynamicSidebarConfig.js';
import { isItemOrChildActive, isPurchaseTransactionsRoute } from '../SidebarNavUtils.js';
import { purchaseTabs } from '../../components/module-tabs/tabConfig.js';
import { canViewModule } from '../../utils/moduleNormalization.js';

describe('Purchase Navigation and Default Tab Test Suite', () => {
  const baseAuthContext = {
    user: { id: 'usr-1', role: 'finance_manager' },
    currentCompany: { id: 'comp-1', code: 'TEST_CO' },
    accessMode: 'FULL',
    modules: [
      { code: 'account', canonical: 'ACCOUNT', active: true },
    ],
    features: [
      { featureCode: 'PURCHASE_INVOICES', moduleName: 'ACCOUNT', active: true },
      { featureCode: 'VENDORS', moduleName: 'ACCOUNT', active: true },
    ],
    permissions: [
      'PURCHASE_INVOICES:READ',
      'VENDORS:READ',
    ],
  };

  describe('1. Sidebar Menu Item Renaming and Route Targeting', () => {
    it('renames sidebar menu item from "Purchase Invoices" to "Purchase" targeting Purchase Requisitions page', () => {
      const links = buildDynamicSidebar({
        authContext: baseAuthContext,
        companyId: 'comp-1',
        userRole: 'finance_manager',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');

      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist under Accounts');

      const purchaseMenuItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-pur');
      assert.ok(purchaseMenuItem, 'acc-txn-pur menu item must exist');

      // Requirement 1: Rename the sidebar menu item "Purchase Invoices" to "Purchase"
      assert.strictEqual(purchaseMenuItem.label, 'Purchase', 'Menu label must be "Purchase"');

      // Requirement 2: Clicking on Purchase in sidebar opens Purchase module with its first tab selected by default
      assert.strictEqual(
        purchaseMenuItem.path,
        '/company/comp-1/accounts/transactions/purchase-requisitions',
        'Menu path must route to purchase-requisitions'
      );
    });

    it('displays Purchase menu item for users with PURCHASE_REQUISITIONS:READ permission', () => {
      const purchaseReqAuthContext = {
        user: { id: 'usr-2', role: 'procurement_executive' },
        currentCompany: { id: 'comp-1', code: 'TEST_CO' },
        accessMode: 'FULL',
        modules: [
          { code: 'account', canonical: 'ACCOUNT', active: true },
        ],
        features: [
          { featureCode: 'PURCHASE_REQUISITIONS', moduleName: 'ACCOUNT', active: true },
        ],
        permissions: [
          'PURCHASE_REQUISITIONS:READ',
        ],
      };

      const links = buildDynamicSidebar({
        authContext: purchaseReqAuthContext,
        companyId: 'comp-1',
        userRole: 'procurement_executive',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');
      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist');
      const purchaseItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-pur');
      assert.ok(purchaseItem, 'Purchase menu item must be visible for users with PURCHASE_REQUISITIONS:READ');
      assert.strictEqual(purchaseItem.label, 'Purchase');
      assert.strictEqual(
        purchaseItem.path,
        '/company/comp-1/accounts/transactions/purchase-requisitions'
      );
    });
  });

  describe('2. Purchase Module Tabs Structure and Ordering', () => {
    it('defines existing tabs in exact configured order with Purchase Requisitions first', () => {
      // Requirement 3: Identify the existing Purchase module tabs and make the first tab the default active tab
      assert.strictEqual(purchaseTabs.length, 7, 'Purchase tabs must contain exactly 7 tabs');

      const tabKeys = purchaseTabs.map((t) => t.key);
      assert.deepStrictEqual(tabKeys, [
        'requisitions',
        'rfqs',
        'supplier-quotes',
        'purchase-orders',
        'goods-receipts',
        'purchase-invoices',
        'payments',
      ]);

      const tabLabels = purchaseTabs.map((t) => t.label);
      assert.deepStrictEqual(tabLabels, [
        'Purchase Requisitions',
        'RFQs',
        'Supplier Quotes',
        'Purchase Orders',
        'Goods Receipts',
        'Purchase Invoices',
        'Payments',
      ]);

      // Requirement 7: Purchase Invoices page remains intact as a tab in Purchase module
      const purchaseInvoicesTab = purchaseTabs.find((t) => t.key === 'purchase-invoices');
      assert.ok(purchaseInvoicesTab, 'Purchase Invoices tab must exist');
      assert.strictEqual(purchaseInvoicesTab.path, '/accounts/transactions/purchase');

      const requisitionsTab = purchaseTabs.find((t) => t.key === 'requisitions');
      assert.ok(requisitionsTab, 'Purchase Requisitions tab must exist');
      assert.strictEqual(requisitionsTab.path, '/accounts/transactions/purchase-requisitions');
    });

    it('includes appropriate path aliases for routing flexibility', () => {
      const purchaseInvoicesTab = purchaseTabs.find((t) => t.key === 'purchase-invoices');
      assert.ok(purchaseInvoicesTab.aliases.includes('/purchase-invoices'));
      assert.ok(purchaseInvoicesTab.aliases.includes('/accounts/transactions/purchase-invoices'));

      const requisitionsTab = purchaseTabs.find((t) => t.key === 'requisitions');
      assert.ok(requisitionsTab.aliases.includes('/purchase-requisitions'));
      assert.ok(requisitionsTab.aliases.includes('/purchases/requisitions'));
    });
  });

  describe('3. Sidebar Active State Synchronization Across All Purchase Tabs', () => {
    const purchaseMenuItem = {
      id: 'acc-txn-pur',
      label: 'Purchase',
      path: '/company/comp-1/accounts/transactions/purchase-requisitions',
    };

    const transactionsGroupItem = {
      id: 'acc-txn',
      label: 'Transactions',
      children: [purchaseMenuItem],
    };

    const allPurchaseRoutes = [
      // Purchase Requisitions (Tab 1 - Default)
      '/accounts/transactions/purchase-requisitions',
      '/company/comp-1/accounts/transactions/purchase-requisitions',
      '/accounts/transactions/purchase-requisitions/pr-123',
      // RFQs (Tab 2)
      '/accounts/transactions/rfqs',
      '/company/comp-1/accounts/transactions/rfqs',
      '/accounts/transactions/rfqs/rfq-456',
      // Supplier Quotes (Tab 3)
      '/accounts/transactions/purchase-quotations',
      '/company/comp-1/accounts/transactions/purchase-quotations',
      '/accounts/transactions/supplier-quotes',
      // Purchase Orders (Tab 4)
      '/accounts/transactions/purchase-orders',
      '/company/comp-1/accounts/transactions/purchase-orders',
      '/accounts/transactions/purchase-orders/po-789',
      // Goods Receipts (Tab 5)
      '/accounts/transactions/goods-receipts',
      '/company/comp-1/accounts/transactions/goods-receipts',
      '/accounts/transactions/goods-receipts/gr-101',
      // Purchase Invoices (Tab 6)
      '/accounts/transactions/purchase',
      '/company/comp-1/accounts/transactions/purchase',
      '/accounts/transactions/purchase/inv-202',
      '/accounts/transactions/purchase-invoices',
      '/company/comp-1/accounts/transactions/purchase-invoices',
    ];

    it('highlights Purchase item in sidebar across tabs in the Purchase module', () => {
      for (const route of allPurchaseRoutes) {
        assert.strictEqual(
          isItemOrChildActive(purchaseMenuItem, route),
          true,
          `Sidebar menu "Purchase" should be active on route ${route}`
        );
        assert.strictEqual(
          isPurchaseTransactionsRoute(route),
          true,
          `isPurchaseTransactionsRoute should return true for ${route}`
        );
      }
    });

    it('keeps Transactions parent accordion active across Purchase tabs', () => {
      for (const route of allPurchaseRoutes) {
        assert.strictEqual(
          isItemOrChildActive(transactionsGroupItem, route),
          true,
          `Transactions accordion should be active on route ${route}`
        );
      }
    });

    it('does NOT activate Purchase item for unrelated transaction routes', () => {
      const unrelatedRoutes = [
        '/accounts/transactions/quotations',
        '/company/comp-1/accounts/transactions/quotations',
        '/accounts/transactions/sales',
        '/company/comp-1/accounts/transactions/sales',
        '/accounts/transactions/expenses',
        '/accounts/transactions/journal',
        '/accounts/transactions/credit-notes',
        '/accounts/transactions/debit-notes',
      ];

      for (const route of unrelatedRoutes) {
        assert.strictEqual(
          isItemOrChildActive(purchaseMenuItem, route),
          false,
          `Sidebar menu "Purchase" should NOT be active on unrelated route ${route}`
        );
        assert.strictEqual(
          isPurchaseTransactionsRoute(route),
          false,
          `isPurchaseTransactionsRoute should return false for ${route}`
        );
      }
    });
  });

  describe('4. Permission Guard and Route Entitlement Compatibility', () => {
    it('allows users with PURCHASE_INVOICES:READ to access PURCHASE_REQUISITIONS module', () => {
      const authCtx = {
        user: { id: 'usr-1', role: 'accountant' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['PURCHASE_INVOICES:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'PURCHASE_REQUISITIONS'), true);
      assert.strictEqual(canViewModule(authCtx, 'PURCHASE_INVOICES'), true);
    });

    it('allows users with PURCHASE_REQUISITIONS:READ to access PURCHASE_REQUISITIONS module', () => {
      const authCtx = {
        user: { id: 'usr-2', role: 'procurement_buyer' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['PURCHASE_REQUISITIONS:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'PURCHASE_REQUISITIONS'), true);
      assert.strictEqual(canViewModule(authCtx, 'PURCHASE_INVOICES'), true);
    });

    it('rejects access for users without either permission', () => {
      const authCtx = {
        user: { id: 'usr-3', role: 'viewer' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['CUSTOMERS:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'PURCHASE_REQUISITIONS'), false);
    });
  });
});

