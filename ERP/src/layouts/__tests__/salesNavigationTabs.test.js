import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildDynamicSidebar } from '../dynamicSidebarConfig.js';
import { isItemOrChildActive, isSalesTransactionsRoute } from '../SidebarNavUtils.js';
import { salesTabs } from '../../components/module-tabs/tabConfig.js';
import { canViewModule } from '../../utils/moduleNormalization.js';

describe('Sales Navigation and Default Tab Test Suite', () => {
  const baseAuthContext = {
    user: { id: 'usr-1', role: 'finance_manager' },
    currentCompany: { id: 'comp-1', code: 'TEST_CO' },
    accessMode: 'FULL',
    modules: [
      { code: 'account', canonical: 'ACCOUNT', active: true },
      { code: 'crm', canonical: 'CRM', active: true },
    ],
    features: [
      { featureCode: 'SALES_INVOICES', moduleName: 'ACCOUNT', active: true },
      { featureCode: 'CUSTOMERS', moduleName: 'ACCOUNT', active: true },
    ],
    permissions: [
      'SALES_INVOICES:READ',
      'CUSTOMERS:READ',
    ],
  };

  describe('1. Sidebar Menu Item Renaming and Route Targeting', () => {
    it('renames sidebar menu item from "Sales Invoices" to "Sales" targeting Quotations page', () => {
      const links = buildDynamicSidebar({
        authContext: baseAuthContext,
        companyId: 'comp-1',
        userRole: 'finance_manager',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');

      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist under Accounts');

      const salesMenuItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-sales');
      assert.ok(salesMenuItem, 'acc-txn-sales menu item must exist');

      // Requirement 1: Rename the sidebar menu item "Sales Invoices" to "Sales"
      assert.strictEqual(salesMenuItem.label, 'Sales', 'Menu label must be "Sales"');

      // Requirement 2: Clicking on Sales in sidebar opens Sales page with Quotations tab selected by default
      assert.strictEqual(
        salesMenuItem.path,
        '/company/comp-1/accounts/transactions/quotations',
        'Menu path must route to quotations'
      );
    });

    it('displays Sales menu item for users with QUOTATIONS:READ permission', () => {
      const quotationsAuthContext = {
        user: { id: 'usr-2', role: 'sales_executive' },
        currentCompany: { id: 'comp-1', code: 'TEST_CO' },
        accessMode: 'FULL',
        modules: [
          { code: 'account', canonical: 'ACCOUNT', active: true },
        ],
        features: [
          { featureCode: 'QUOTATIONS', moduleName: 'ACCOUNT', active: true },
        ],
        permissions: [
          'QUOTATIONS:READ',
        ],
      };

      const links = buildDynamicSidebar({
        authContext: quotationsAuthContext,
        companyId: 'comp-1',
        userRole: 'sales_executive',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');
      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist');
      const salesItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-sales');
      assert.ok(salesItem, 'Sales menu item must be visible for users with QUOTATIONS:READ');
      assert.strictEqual(salesItem.label, 'Sales');
    });
  });

  describe('2. Sales Module Tabs Structure and Ordering', () => {
    it('defines 6 tabs in exact required order with Quotations first', () => {
      // Requirement 3: Quotations tab must be first active tab, followed by PI, Orders, Challans, Sales Invoices, Receipts
      assert.strictEqual(salesTabs.length, 6, 'Sales tabs must contain exactly 6 tabs');

      const tabKeys = salesTabs.map((t) => t.key);
      assert.deepStrictEqual(tabKeys, [
        'quotations',
        'proforma',
        'orders',
        'delivery-challans',
        'sales-invoices',
        'receipt-vouchers',
      ]);

      const tabLabels = salesTabs.map((t) => t.label);
      assert.deepStrictEqual(tabLabels, [
        'Quotations',
        'Proforma Invoices (PI)',
        'Sales Orders',
        'Delivery Challans',
        'Sales Invoices',
        'Receipt Vouchers',
      ]);

      // Requirement 5: Sales Invoices page is one of the tabs in Sales module
      const salesInvoicesTab = salesTabs.find((t) => t.key === 'sales-invoices');
      assert.ok(salesInvoicesTab, 'Sales Invoices tab must exist');
      assert.strictEqual(salesInvoicesTab.path, '/accounts/transactions/sales');

      const quotationsTab = salesTabs.find((t) => t.key === 'quotations');
      assert.ok(quotationsTab, 'Quotations tab must exist');
      assert.strictEqual(quotationsTab.path, '/accounts/transactions/quotations');
    });

    it('includes appropriate path aliases for routing flexibility', () => {
      const salesInvoicesTab = salesTabs.find((t) => t.key === 'sales-invoices');
      assert.ok(salesInvoicesTab.aliases.includes('/accounts/sales/invoices'));
      assert.ok(salesInvoicesTab.aliases.includes('/accounts/transactions/sales-invoices'));

      const quotationsTab = salesTabs.find((t) => t.key === 'quotations');
      assert.ok(quotationsTab.aliases.includes('/quotations'));
      assert.ok(quotationsTab.aliases.includes('/sales-crm/quotations'));
    });
  });

  describe('3. Sidebar Active State Synchronization Across All Sales Tabs', () => {
    const salesMenuItem = {
      id: 'acc-txn-sales',
      label: 'Sales',
      path: '/company/comp-1/accounts/transactions/quotations',
    };

    const transactionsGroupItem = {
      id: 'acc-txn',
      label: 'Transactions',
      children: [salesMenuItem],
    };

    const allSalesRoutes = [
      // Quotations (Tab 1)
      '/accounts/transactions/quotations',
      '/company/comp-1/accounts/transactions/quotations',
      '/accounts/transactions/quotations/quote-123',
      // Proforma Invoices (Tab 2)
      '/accounts/transactions/proforma-invoices',
      '/company/comp-1/accounts/transactions/proforma-invoices',
      '/accounts/transactions/proforma-invoices/pi-456',
      // Sales Orders (Tab 3)
      '/accounts/transactions/sales-orders',
      '/company/comp-1/accounts/transactions/sales-orders',
      '/accounts/transactions/sales-orders/so-789',
      // Delivery Challans (Tab 4)
      '/accounts/transactions/delivery-challans',
      '/company/comp-1/accounts/transactions/delivery-challans',
      '/accounts/transactions/delivery-challans/dc-101',
      // Sales Invoices (Tab 5)
      '/accounts/transactions/sales',
      '/company/comp-1/accounts/transactions/sales',
      '/accounts/transactions/sales/inv-202',
      // Receipt Vouchers (Tab 6)
      '/accounts/transactions/receipts',
      '/company/comp-1/accounts/transactions/receipts',
      '/accounts/transactions/receipts/rec-303',
    ];

    it('highlights Sales item in sidebar across all 6 tabs in the Sales module', () => {
      for (const route of allSalesRoutes) {
        assert.strictEqual(
          isItemOrChildActive(salesMenuItem, route),
          true,
          `Sidebar menu "Sales" should be active on route ${route}`
        );
        assert.strictEqual(
          isSalesTransactionsRoute(route),
          true,
          `isSalesTransactionsRoute should return true for ${route}`
        );
      }
    });

    it('keeps Transactions parent accordion active across all 6 tabs', () => {
      for (const route of allSalesRoutes) {
        assert.strictEqual(
          isItemOrChildActive(transactionsGroupItem, route),
          true,
          `Transactions accordion should be active on route ${route}`
        );
      }
    });

    it('does NOT activate Sales item for unrelated transaction routes', () => {
      const unrelatedRoutes = [
        '/accounts/transactions/purchase',
        '/company/comp-1/accounts/transactions/purchase',
        '/accounts/transactions/expenses',
        '/accounts/transactions/payments',
        '/accounts/transactions/journal',
        '/accounts/transactions/credit-notes',
        '/accounts/transactions/debit-notes',
      ];

      for (const route of unrelatedRoutes) {
        assert.strictEqual(
          isItemOrChildActive(salesMenuItem, route),
          false,
          `Sidebar menu "Sales" should NOT be active on unrelated route ${route}`
        );
        assert.strictEqual(
          isSalesTransactionsRoute(route),
          false,
          `isSalesTransactionsRoute should return false for ${route}`
        );
      }
    });
  });

  describe('4. Permission Guard and Route Entitlement Compatibility', () => {
    it('allows users with SALES_INVOICES:READ to access QUOTATIONS module', () => {
      const authCtx = {
        user: { id: 'usr-1', role: 'accountant' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['SALES_INVOICES:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'QUOTATIONS'), true);
      assert.strictEqual(canViewModule(authCtx, 'SALES_INVOICES'), true);
    });

    it('allows users with QUOTATIONS:READ to access QUOTATIONS module', () => {
      const authCtx = {
        user: { id: 'usr-2', role: 'sales_rep' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'crm', canonical: 'CRM', active: true }],
        permissions: ['QUOTATIONS:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'QUOTATIONS'), true);
    });

    it('rejects access for users without either permission', () => {
      const authCtx = {
        user: { id: 'usr-3', role: 'viewer' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['CUSTOMERS:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'QUOTATIONS'), false);
    });
  });
});
