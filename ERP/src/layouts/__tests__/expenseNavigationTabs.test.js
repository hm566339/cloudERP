import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildDynamicSidebar } from '../dynamicSidebarConfig.js';
import { isItemOrChildActive } from '../SidebarNavUtils.js';
import { expenseTabs } from '../../components/module-tabs/tabConfig.js';
import { canViewModule } from '../../utils/moduleNormalization.js';

describe('Expense Navigation and Default Tab Test Suite', () => {
  const baseAuthContext = {
    user: { id: 'usr-1', role: 'finance_manager' },
    currentCompany: { id: 'comp-1', code: 'TEST_CO' },
    accessMode: 'FULL',
    modules: [
      { code: 'account', canonical: 'ACCOUNT', active: true },
    ],
    features: [
      { featureCode: 'EXPENSES', moduleName: 'ACCOUNT', active: true },
    ],
    permissions: [
      'EXPENSES:READ',
    ],
  };

  describe('1. Sidebar Menu Item Route Targeting and Label', () => {
    it('configures sidebar menu item to open Expense Requests by default', () => {
      const links = buildDynamicSidebar({
        authContext: baseAuthContext,
        companyId: 'comp-1',
        userRole: 'finance_manager',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');

      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist under Accounts');

      const expenseMenuItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-exp');
      assert.ok(expenseMenuItem, 'acc-txn-exp menu item must exist');

      // Menu label remains Expense
      assert.strictEqual(expenseMenuItem.label, 'Expense', 'Menu label must be "Expense"');

      // Requirement 1: Clicking Expenses in sidebar opens Expenses module with Expense Requests selected by default
      assert.strictEqual(
        expenseMenuItem.path,
        '/company/comp-1/accounts/transactions/expenses/requests',
        'Menu path must route to expense requests'
      );
    });

    it('displays Expense menu item for users with EXPENSE_REQUESTS:READ permission', () => {
      const expenseReqAuthContext = {
        user: { id: 'usr-2', role: 'employee' },
        currentCompany: { id: 'comp-1', code: 'TEST_CO' },
        accessMode: 'FULL',
        modules: [
          { code: 'account', canonical: 'ACCOUNT', active: true },
        ],
        features: [
          { featureCode: 'EXPENSE_REQUESTS', moduleName: 'ACCOUNT', active: true },
        ],
        permissions: [
          'EXPENSE_REQUESTS:READ',
        ],
      };

      const links = buildDynamicSidebar({
        authContext: expenseReqAuthContext,
        companyId: 'comp-1',
        userRole: 'employee',
      });

      const accountsSection = links.find((l) => l.id === 'accounts');
      assert.ok(accountsSection, 'Accounts section must exist');
      const transactionsGroup = accountsSection.children.find((g) => g.id === 'acc-txn');
      assert.ok(transactionsGroup, 'Transactions group must exist');
      const expenseItem = transactionsGroup.children.find((item) => item.id === 'acc-txn-exp');
      assert.ok(expenseItem, 'Expense menu item must be visible for users with EXPENSE_REQUESTS:READ');
      assert.strictEqual(
        expenseItem.path,
        '/company/comp-1/accounts/transactions/expenses/requests'
      );
    });
  });

  describe('2. Expense Module Tabs Structure and Ordering', () => {
    it('defines existing tabs in exact configured order with Expense Requests first', () => {
      // Requirement 2: The top navigation tabs should remain in this order:
      // - Expense Requests
      // - Expenses
      // - Reimbursements
      // - Reports
      assert.strictEqual(expenseTabs.length, 4, 'Expense tabs must contain exactly 4 tabs');

      const tabKeys = expenseTabs.map((t) => t.key);
      assert.deepStrictEqual(tabKeys, [
        'requests',
        'expenses',
        'reimbursements',
        'reports'
      ]);

      const tabLabels = expenseTabs.map((t) => t.label);
      assert.deepStrictEqual(tabLabels, [
        'Expense Requests',
        'Expenses',
        'Reimbursements',
        'Reports'
      ]);

      // First tab must be Expense Requests with path /accounts/transactions/expenses/requests
      assert.strictEqual(expenseTabs[0].key, 'requests');
      assert.strictEqual(expenseTabs[0].label, 'Expense Requests');
      assert.strictEqual(expenseTabs[0].path, '/accounts/transactions/expenses/requests');

      // Generic base routes must be listed as aliases under Expense Requests (Tab 1)
      assert.ok(expenseTabs[0].aliases.includes('/accounts/transactions/expenses'));
      assert.ok(expenseTabs[0].aliases.includes('/transactions/expenses'));
    });
  });

  describe('3. Active State and Sidebar Highlighting across All Tabs', () => {
    const expenseMenuItem = {
      id: 'acc-txn-exp',
      label: 'Expense',
      path: '/company/comp-1/accounts/transactions/expenses/requests',
    };

    const allExpenseRoutes = [
      // Expense Requests (Tab 1)
      '/accounts/transactions/expenses/requests',
      '/company/comp-1/accounts/transactions/expenses/requests',
      '/accounts/transactions/expense-requests',
      // Expenses (Tab 2)
      '/accounts/transactions/expenses/expenses',
      '/company/comp-1/accounts/transactions/expenses/expenses',
      // Reimbursements (Tab 3)
      '/accounts/transactions/expenses/reimbursements',
      '/company/comp-1/accounts/transactions/expenses/reimbursements',
      // Reports (Tab 4)
      '/accounts/transactions/expenses/reports',
      '/company/comp-1/accounts/transactions/expenses/reports',
      // Direct base URL
      '/accounts/transactions/expenses',
      '/company/comp-1/accounts/transactions/expenses',
    ];

    it('highlights Expense item in sidebar across all tabs in the Expense module', () => {
      for (const route of allExpenseRoutes) {
        assert.strictEqual(
          isItemOrChildActive(expenseMenuItem, route),
          true,
          `Sidebar menu "Expense" should be active on route ${route}`
        );
      }
    });

    it('does NOT highlight Expense on unrelated routes', () => {
      const unrelatedRoutes = [
        '/accounts/transactions/quotations',
        '/accounts/transactions/purchase-requisitions',
        '/accounts/transactions/credit-notes',
        '/accounts/transactions/debit-notes',
        '/accounts/transactions/journal',
        '/inventory/products',
        '/crm/leads',
      ];

      for (const route of unrelatedRoutes) {
        assert.strictEqual(
          isItemOrChildActive(expenseMenuItem, route),
          false,
          `Sidebar menu "Expense" should NOT be active on unrelated route ${route}`
        );
      }
    });
  });

  describe('4. Permission Guard and Route Entitlement Compatibility', () => {
    it('allows users with EXPENSES:READ to access EXPENSE_REQUESTS module', () => {
      const authCtx = {
        user: { id: 'usr-1', role: 'accountant' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['EXPENSES:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'EXPENSE_REQUESTS'), true);
      assert.strictEqual(canViewModule(authCtx, 'EXPENSES'), true);
    });

    it('allows users with EXPENSE_REQUESTS:READ to access EXPENSES module', () => {
      const authCtx = {
        user: { id: 'usr-2', role: 'employee' },
        currentCompany: { id: 'comp-1' },
        accessMode: 'FULL',
        modules: [{ code: 'account', canonical: 'ACCOUNT', active: true }],
        permissions: ['EXPENSE_REQUESTS:READ'],
      };

      assert.strictEqual(canViewModule(authCtx, 'EXPENSE_REQUESTS'), true);
      assert.strictEqual(canViewModule(authCtx, 'EXPENSES'), true);
    });
  });
});

