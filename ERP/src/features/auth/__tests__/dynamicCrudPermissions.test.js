import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  hasPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  canWrite
} from '../../../utils/moduleNormalization.js';
import {
  hasPermission as rbacHasPermission,
  canRead as rbacCanRead,
  canCreate as rbacCanCreate,
  canUpdate as rbacCanUpdate,
  canDelete as rbacCanDelete
} from '../../../utils/rbacUtils.js';

describe('Global Dynamic CRUD Permission System Verification Suite', () => {

  // 1. Full Permissions User
  describe('1. Users with full permissions', () => {
    it('allows CREATE, READ, UPDATE, and DELETE across features', () => {
      const userPermissions = [
        'CUSTOMERS:READ',
        'CUSTOMERS:CREATE',
        'CUSTOMERS:UPDATE',
        'CUSTOMERS:DELETE',
        'PRODUCTS:READ',
        'PRODUCTS:WRITE',
        'PRODUCTS:DELETE',
      ];

      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS', 'READ'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS', 'CREATE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS', 'UPDATE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS', 'DELETE'), true);

      // Verify rbacUtils helper functions
      assert.strictEqual(rbacCanRead(userPermissions, 'CUSTOMERS'), true);
      assert.strictEqual(rbacCanCreate(userPermissions, 'CUSTOMERS'), true);
      assert.strictEqual(rbacCanUpdate(userPermissions, 'CUSTOMERS'), true);
      assert.strictEqual(rbacCanDelete(userPermissions, 'CUSTOMERS'), true);

      // Verify WRITE maps to both CREATE and UPDATE for PRODUCTS
      assert.strictEqual(hasPermission(userPermissions, 'PRODUCTS', 'READ'), true);
      assert.strictEqual(hasPermission(userPermissions, 'PRODUCTS', 'CREATE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'PRODUCTS', 'UPDATE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'PRODUCTS', 'DELETE'), true);
    });

    it('supports colon-separated string queries', () => {
      const userPermissions = ['CUSTOMERS:READ', 'CUSTOMERS:WRITE', 'CUSTOMERS:DELETE'];

      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS:READ'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS:WRITE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS:DELETE'), true);
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS:CREATE'), true); // WRITE satisfies CREATE
      assert.strictEqual(hasPermission(userPermissions, 'CUSTOMERS:UPDATE'), true); // WRITE satisfies UPDATE
    });
  });

  // 2. READ-only Users
  describe('2. Users with READ-only permission', () => {
    it('can view records but cannot modify, create, or delete them', () => {
      const readOnlyPermissions = [
        'CUSTOMERS:READ',
        'PRODUCTS:READ',
        'SALES_INVOICES:READ'
      ];

      // Read operations succeed
      assert.strictEqual(hasPermission(readOnlyPermissions, 'CUSTOMERS', 'READ'), true);
      assert.strictEqual(canRead(readOnlyPermissions, 'CUSTOMERS'), true);
      assert.strictEqual(rbacCanRead(readOnlyPermissions, 'PRODUCTS'), true);

      // Mutation operations fail
      assert.strictEqual(hasPermission(readOnlyPermissions, 'CUSTOMERS', 'CREATE'), false);
      assert.strictEqual(hasPermission(readOnlyPermissions, 'CUSTOMERS', 'UPDATE'), false);
      assert.strictEqual(hasPermission(readOnlyPermissions, 'CUSTOMERS', 'DELETE'), false);
      assert.strictEqual(canCreate(readOnlyPermissions, 'CUSTOMERS'), false);
      assert.strictEqual(canUpdate(readOnlyPermissions, 'CUSTOMERS'), false);
      assert.strictEqual(canDelete(readOnlyPermissions, 'CUSTOMERS'), false);
      assert.strictEqual(rbacCanCreate(readOnlyPermissions, 'PRODUCTS'), false);
      assert.strictEqual(rbacCanUpdate(readOnlyPermissions, 'PRODUCTS'), false);
      assert.strictEqual(rbacCanDelete(readOnlyPermissions, 'PRODUCTS'), false);
    });
  });

  // 3. Users without WRITE permission
  describe('3. Users without WRITE/CREATE permission', () => {
    it('cannot create or update records when WRITE is absent', () => {
      const perms = [
        'PURCHASE_ORDERS:READ',
        'PURCHASE_ORDERS:DELETE'
      ];

      assert.strictEqual(hasPermission(perms, 'PURCHASE_ORDERS', 'READ'), true);
      assert.strictEqual(hasPermission(perms, 'PURCHASE_ORDERS', 'DELETE'), true);
      assert.strictEqual(hasPermission(perms, 'PURCHASE_ORDERS', 'CREATE'), false);
      assert.strictEqual(hasPermission(perms, 'PURCHASE_ORDERS', 'UPDATE'), false);
      assert.strictEqual(canWrite(perms, 'PURCHASE_ORDERS'), false);
    });
  });

  // 4. Users without DELETE permission
  describe('4. Users without DELETE permission', () => {
    it('cannot delete records even if they have CREATE and UPDATE permissions', () => {
      const perms = [
        'VENDORS:READ',
        'VENDORS:CREATE',
        'VENDORS:UPDATE'
      ];

      assert.strictEqual(hasPermission(perms, 'VENDORS', 'READ'), true);
      assert.strictEqual(hasPermission(perms, 'VENDORS', 'CREATE'), true);
      assert.strictEqual(hasPermission(perms, 'VENDORS', 'UPDATE'), true);
      assert.strictEqual(hasPermission(perms, 'VENDORS', 'DELETE'), false);
      assert.strictEqual(canDelete(perms, 'VENDORS'), false);
      assert.strictEqual(rbacCanDelete(perms, 'VENDORS'), false);
    });
  });

  // 5. Fail-Closed on Missing or Empty Permissions
  describe('5. Missing or failed permission data fails closed', () => {
    it('returns false for null, undefined, and empty permissions', () => {
      assert.strictEqual(hasPermission(null, 'CUSTOMERS', 'READ'), false);
      assert.strictEqual(hasPermission(undefined, 'CUSTOMERS', 'READ'), false);
      assert.strictEqual(hasPermission([], 'CUSTOMERS', 'READ'), false);
      assert.strictEqual(canRead([], 'CUSTOMERS'), false);
      assert.strictEqual(canCreate([], 'CUSTOMERS'), false);
      assert.strictEqual(canUpdate([], 'CUSTOMERS'), false);
      assert.strictEqual(canDelete([], 'CUSTOMERS'), false);
    });

    it('returns false for non-matching modules and unauthorized actions', () => {
      const perms = ['CUSTOMERS:READ'];
      assert.strictEqual(hasPermission(perms, 'WAREHOUSES', 'READ'), false);
      assert.strictEqual(hasPermission(perms, 'CUSTOMERS', 'DELETE'), false);
    });
  });

  // 6. Cross-Module Resolution
  describe('6. Permissions applied across different modules', () => {
    it('verifies accounts, inventory, sales, purchase, security, and admin modules', () => {
      const fullSuitePermissions = [
        // Accounting
        'CHART_OF_ACCOUNTS:READ', 'CHART_OF_ACCOUNTS:WRITE',
        'BANK_ACCOUNTS:READ',
        // Customers & Vendors
        'CUSTOMERS:READ', 'CUSTOMERS:WRITE',
        'VENDORS:READ',
        // Inventory
        'PRODUCTS:READ', 'PRODUCTS:WRITE', 'PRODUCTS:DELETE',
        'WAREHOUSES:READ', 'WAREHOUSES:CREATE',
        'STOCK_TRANSFERS:READ', 'STOCK_TRANSFERS:CREATE',
        // Sales
        'SALES_INVOICES:READ', 'SALES_INVOICES:CREATE',
        'QUOTATIONS:READ',
        // Purchase
        'PURCHASE_ORDERS:READ', 'PURCHASE_ORDERS:APPROVE',
        // Administration
        'USER:READ', 'USER:CREATE', 'USER:UPDATE',
        'ROLE:READ',
        'PERMISSION:READ',
        'FEATURE:READ'
      ];

      // Accounting
      assert.strictEqual(hasPermission(fullSuitePermissions, 'CHART_OF_ACCOUNTS', 'CREATE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'BANK_ACCOUNTS', 'DELETE'), false);

      // Customers & Vendors
      assert.strictEqual(hasPermission(fullSuitePermissions, 'CUSTOMERS', 'UPDATE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'VENDORS', 'CREATE'), false);

      // Inventory
      assert.strictEqual(hasPermission(fullSuitePermissions, 'PRODUCTS', 'DELETE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'WAREHOUSES', 'CREATE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'WAREHOUSES', 'DELETE'), false);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'STOCK_TRANSFERS', 'CREATE'), true);

      // Sales & Purchase
      assert.strictEqual(hasPermission(fullSuitePermissions, 'SALES_INVOICES', 'CREATE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'QUOTATIONS', 'CREATE'), false);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'PURCHASE_ORDERS', 'APPROVE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'PURCHASE_ORDERS', 'DELETE'), false);

      // Security & Admin
      assert.strictEqual(hasPermission(fullSuitePermissions, 'USER', 'UPDATE'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'USER', 'DELETE'), false);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'ROLE', 'CREATE'), false);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'PERMISSION', 'READ'), true);
      assert.strictEqual(hasPermission(fullSuitePermissions, 'FEATURE', 'CREATE'), false);
    });
  });

  // 7. Structured Objects & Backend SSO Verify Format
  describe('7. Supports backend object-based permission format', () => {
    it('handles arrays of permission objects with featureCode and action', () => {
      const backendPermissions = [
        { featureCode: 'CUSTOMERS', action: 'READ', allowed: true },
        { featureCode: 'CUSTOMERS', action: 'CREATE', allowed: true },
        { featureCode: 'CUSTOMERS', action: 'UPDATE', allowed: true },
        { featureCode: 'PRODUCTS', action: 'WRITE', allowed: true },
        { featureCode: 'SALES_INVOICES', action: 'DELETE', allowed: false }
      ];

      assert.strictEqual(hasPermission(backendPermissions, 'CUSTOMERS', 'READ'), true);
      assert.strictEqual(hasPermission(backendPermissions, 'CUSTOMERS', 'CREATE'), true);
      assert.strictEqual(hasPermission(backendPermissions, 'CUSTOMERS', 'UPDATE'), true);
      assert.strictEqual(hasPermission(backendPermissions, 'CUSTOMERS', 'DELETE'), false);
      assert.strictEqual(hasPermission(backendPermissions, 'PRODUCTS', 'CREATE'), true);
      assert.strictEqual(hasPermission(backendPermissions, 'SALES_INVOICES', 'DELETE'), false);
    });
  });

  // 8. Access Mode Enforcement (READ_ONLY and BLOCKED)
  describe('8. Access mode enforcement (Tenant & Org restrictions)', () => {
    it('disallows all mutations when accessMode is READ_ONLY', () => {
      const readOnlyAuthContext = {
        accessMode: 'READ_ONLY',
        permissions: [
          'CUSTOMERS:READ',
          'CUSTOMERS:CREATE',
          'CUSTOMERS:UPDATE',
          'CUSTOMERS:DELETE'
        ]
      };

      assert.strictEqual(hasPermission(readOnlyAuthContext, 'CUSTOMERS', 'READ'), true);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'CUSTOMERS', 'CREATE'), false);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'CUSTOMERS', 'UPDATE'), false);
      assert.strictEqual(hasPermission(readOnlyAuthContext, 'CUSTOMERS', 'DELETE'), false);
    });

    it('disallows everything when accessMode is BLOCKED', () => {
      const blockedAuthContext = {
        accessMode: 'BLOCKED',
        permissions: [
          'CUSTOMERS:READ',
          'CUSTOMERS:CREATE'
        ]
      };

      assert.strictEqual(hasPermission(blockedAuthContext, 'CUSTOMERS', 'READ'), false);
      assert.strictEqual(hasPermission(blockedAuthContext, 'CUSTOMERS', 'CREATE'), false);
    });
  });

  // 9. No Role Hardcoding / Role Dynamic Permissions
  describe('9. Resolves dynamically based on assigned permissions, not hardcoded role names', () => {
    it('custom role with explicit permissions gets granted only what is assigned', () => {
      const customRolePerms = [
        'INVENTORY:READ',
        'STOCK_ADJUSTMENTS:CREATE'
      ];

      assert.strictEqual(hasPermission(customRolePerms, 'INVENTORY', 'READ'), true);
      assert.strictEqual(hasPermission(customRolePerms, 'STOCK_ADJUSTMENTS', 'CREATE'), true);
      assert.strictEqual(hasPermission(customRolePerms, 'STOCK_ADJUSTMENTS', 'DELETE'), false);
      assert.strictEqual(hasPermission(customRolePerms, 'CUSTOMERS', 'READ'), false);
    });
  });
});
