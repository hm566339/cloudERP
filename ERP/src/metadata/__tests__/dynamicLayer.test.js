import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { enumService } from '../../services/enumService.js';
import { getResourceConfig, getAllResources } from '../resourceRegistry.js';
import { getReportConfig } from '../reportRegistry.js';

describe('Dynamic Layer - Enum Service Tests', () => {
  it('should return valid options for invoiceStatus matching backend values', () => {
    const options = enumService.getOptions('invoiceStatus');
    assert.ok(Array.isArray(options), 'Options should be an array');
    assert.ok(options.length > 0, 'Options should not be empty');

    const values = options.map((o) => o.value);
    assert.ok(values.includes('DRAFT'), 'Should include DRAFT');
    assert.ok(values.includes('POSTED'), 'Should include POSTED');
    assert.ok(values.includes('CANCELLED'), 'Should include CANCELLED');
  });

  it('should return color and className metadata for enum value', () => {
    const meta = enumService.getMeta('invoiceStatus', 'POSTED');
    assert.ok(meta, 'Meta should exist');
    assert.equal(meta.value, 'POSTED');
    assert.equal(meta.color, 'emerald');
    assert.ok(meta.className.includes('emerald'), 'ClassName should have emerald styling');
  });

  it('should handle unknown enum values gracefully without crashing', () => {
    const meta = enumService.getMeta('invoiceStatus', 'UNKNOWN_CUSTOM_VALUE');
    assert.ok(meta, 'Meta should not be null');
    assert.equal(meta.value, 'UNKNOWN_CUSTOM_VALUE');
    assert.equal(meta.color, 'zinc');
  });

  it('should handle null/undefined safely', () => {
    assert.equal(enumService.getMeta('invoiceStatus', null), null);
    assert.equal(enumService.getMeta('invoiceStatus', undefined), null);
  });
});

describe('Dynamic Layer - Resource Registry Tests', () => {
  it('should return complete metadata for customers resource', () => {
    const config = getResourceConfig('customers');
    assert.ok(config, 'Config for customers should exist');
    assert.equal(config.key, 'customers');
    assert.equal(config.listPath, '/api/account/customers');
    assert.equal(config.permissions.read, 'CUSTOMERS:READ');
    assert.equal(config.permissions.create, 'CUSTOMERS:CREATE');
    assert.equal(config.listCapabilities.defaultPageBase, 0);
    assert.ok(Array.isArray(config.fields), 'Fields should be an array');
  });

  it('should return complete metadata for vendors resource with normalized v1 path', () => {
    const config = getResourceConfig('vendors');
    assert.ok(config, 'Config for vendors should exist');
    assert.equal(config.listPath, '/api/account/v1/vendors');
    assert.equal(config.permissions.read, 'VENDORS:READ');
  });

  it('should verify all core resources are registered', () => {
    const all = getAllResources();
    assert.ok(all.length >= 15, 'Should have at least 15 core resources');
    const keys = all.map((r) => r.key);
    assert.ok(keys.includes('customers'));
    assert.ok(keys.includes('vendors'));
    assert.ok(keys.includes('sales-invoices'));
    assert.ok(keys.includes('purchase-invoices'));
    assert.ok(keys.includes('bank-accounts'));
    assert.ok(keys.includes('chart-of-accounts'));
    assert.ok(keys.includes('inventory-products'));
  });
});

describe('Dynamic Layer - Report Registry Tests', () => {
  it('should configure trial-balance report with required filters and totals', () => {
    const rep = getReportConfig('trial-balance');
    assert.ok(rep, 'trial-balance config should exist');
    assert.equal(rep.endpoint, '/api/account/reports/trial-balance');
    assert.ok(rep.totals.includes('debitAmount'));
    assert.ok(rep.totals.includes('creditAmount'));
  });

  it('should configure cash-flow report with startDate and endDate filters', () => {
    const rep = getReportConfig('cash-flow');
    assert.ok(rep, 'cash-flow config should exist');
    const filterNames = rep.filters.map((f) => f.name);
    assert.ok(filterNames.includes('startDate'), 'Must have startDate');
    assert.ok(filterNames.includes('endDate'), 'Must have endDate');
  });
});

describe('Dynamic Layer - Read-Only Access Mode Simulation', () => {
  const mutationActions = ['CREATE', 'UPDATE', 'WRITE', 'DELETE', 'POST', 'APPROVE', 'CANCEL'];

  function simulateCan(accessMode, action) {
    if (accessMode === 'BLOCKED') return false;
    if (accessMode === 'READ_ONLY' && mutationActions.includes(action.toUpperCase())) {
      return false;
    }
    return true;
  }

  it('should allow GET/READ in READ_ONLY mode', () => {
    assert.equal(simulateCan('READ_ONLY', 'READ'), true);
  });

  it('should deny CREATE/UPDATE/DELETE/POST in READ_ONLY mode', () => {
    assert.equal(simulateCan('READ_ONLY', 'CREATE'), false);
    assert.equal(simulateCan('READ_ONLY', 'UPDATE'), false);
    assert.equal(simulateCan('READ_ONLY', 'DELETE'), false);
    assert.equal(simulateCan('READ_ONLY', 'POST'), false);
  });

  it('should deny all actions in BLOCKED mode', () => {
    assert.equal(simulateCan('BLOCKED', 'READ'), false);
    assert.equal(simulateCan('BLOCKED', 'CREATE'), false);
  });
});

describe('Dynamic Layer - Schema Validation & List Params Mapping', () => {
  it('should validate required fields and types correctly from field schemas', () => {
    const customerConfig = getResourceConfig('customers');
    const customerNameField = customerConfig.fields.find((f) => f.name === 'customerName');
    assert.ok(customerNameField, 'customerName field should exist');
    assert.equal(customerNameField.required, true);

    const emailField = customerConfig.fields.find((f) => f.name === 'email');
    assert.ok(emailField, 'email field should exist');
    assert.equal(emailField.type, 'email');
  });

  it('should format pagination parameters correctly based on defaultPageBase and sizeParam', () => {
    function formatPagination(resourceKey, pageIndex, pageSize) {
      const config = getResourceConfig(resourceKey);
      const base = config?.listCapabilities?.defaultPageBase ?? 0;
      const sizeParam = config?.listCapabilities?.sizeParam ?? 'size';
      const pageParam = config?.listCapabilities?.pageParam ?? 'page';

      return {
        [pageParam]: pageIndex + base,
        [sizeParam]: pageSize,
      };
    }

    // Spring Data resource (0-based)
    const accountParams = formatPagination('customers', 0, 20);
    assert.deepEqual(accountParams, { page: 0, size: 20 });

    // SSO / Auth resource (1-based, pageSize)
    const ssoParams = formatPagination('sso-users', 0, 10);
    assert.deepEqual(ssoParams, { page: 1, pageSize: 10 });
  });

  it('should correctly map relation references in resource fields', () => {
    const invConfig = getResourceConfig('sales-invoices');
    assert.ok(invConfig, 'sales-invoices config should exist');
    const custField = invConfig.fields.find((f) => f.name === 'customerId');
    if (custField) {
      assert.equal(custField.relationResource, 'customers');
    }
  });
});
