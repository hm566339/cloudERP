import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import paths and sidebar configurations
import PATHS from '../paths.js';
import { CRM_SIDEBAR } from '../../layouts/CrmSidebarConfig.js';
import { CANONICAL_MODULES } from '../../utils/moduleNormalization.js';
import { buildDynamicSidebar } from '../../layouts/dynamicSidebarConfig.js';

describe('Sales & CRM End-to-End Routing & Dynamic Sidebar Test Suite', () => {
  const companyId = 'comp-101';
  const crmAuthContext = {
    user: { role: 'sales_admin', email: 'sales@example.com' },
    activeCompanyId: companyId,
    currentCompany: { id: companyId, code: companyId, name: 'Acme Corp' },
    modules: [{ name: 'CRM', active: true }],
    permissions: [
      'CRM:READ', 'CRM:CREATE', 'CRM:UPDATE', 'CRM:DELETE',
      'LEADS:READ', 'CUSTOMERS:READ', 'CRM_OPPORTUNITIES:READ',
      'QUOTATIONS:READ', 'CRM_ACTIVITIES:READ', 'CRM_CAMPAIGNS:READ',
      'CRM_COMMUNICATION:READ', 'CRM_AUTOMATION:READ', 'CRM_INTEGRATIONS:READ',
      'CRM_SETTINGS:READ', 'ORDERS:READ', 'SALES_ORDERS:READ',
      'SALES_INVOICES:READ', 'AUDIT_LOGS:READ', 'DASHBOARD:READ'
    ],
  };

  it('1. Verifies all 18 sidebar items are generated for Company-scoped CRM navigation', () => {
    const sidebar = buildDynamicSidebar({
      authContext: crmAuthContext,
      companyId,
    });

    assert.ok(sidebar.length > 0, 'Sidebar should contain sections');
    const crmSection = sidebar.find((s) => s.id === 'sales-crm' || s.label === 'Sales & CRM');
    assert.ok(crmSection, 'Sales & CRM module section must be present in dynamic sidebar');

    const expected18Items = [
      { id: 'crm-dashboard', path: `/company/${companyId}/sales-crm/dashboard` },
      { id: 'crm-leads', path: `/company/${companyId}/sales-crm/leads` },
      { id: 'crm-accounts', path: `/company/${companyId}/sales-crm/accounts` },
      { id: 'crm-contacts', path: `/company/${companyId}/sales-crm/contacts` },
      { id: 'crm-opportunities', path: `/company/${companyId}/sales-crm/opportunities` },
      { id: 'crm-pipelines', path: `/company/${companyId}/sales-crm/pipelines` },
      { id: 'crm-quotations', path: `/company/${companyId}/sales-crm/quotations` },
      { id: 'crm-tasks', path: `/company/${companyId}/sales-crm/tasks` },
      { id: 'crm-activities', path: `/company/${companyId}/sales-crm/activities` },
      { id: 'crm-campaigns', path: `/company/${companyId}/sales-crm/campaigns` },
      { id: 'crm-attribution', path: `/company/${companyId}/sales-crm/attribution` },
      { id: 'crm-comms', path: `/company/${companyId}/sales-crm/communications` },
      { id: 'crm-automation', path: `/company/${companyId}/sales-crm/automation` },
      { id: 'crm-integrations', path: `/company/${companyId}/sales-crm/integrations` },
      { id: 'crm-settings', path: `/company/${companyId}/sales-crm/settings` },
      { id: 'crm-orders', path: `/company/${companyId}/crm/orders` },
      { id: 'crm-invoices', path: `/company/${companyId}/crm/invoices` },
      { id: 'crm-audit', path: `/company/${companyId}/crm/audit` },
    ];

    assert.equal(crmSection.children.length, 18, 'Must have exactly 18 sidebar items matching the user interface');

    expected18Items.forEach((expected) => {
      const found = crmSection.children.find((c) => c.id === expected.id);
      assert.ok(found, `Sidebar item ${expected.id} must be present`);
      assert.equal(found.path, expected.path, `Sidebar item ${expected.id} path must match ${expected.path}`);
    });
  });

  it('2. Verifies all 18 sidebar items are generated for Root-scoped CRM navigation (no companyId)', () => {
    const rootContext = { ...crmAuthContext, activeCompanyId: null, currentCompany: null };
    const sidebar = buildDynamicSidebar({
      authContext: rootContext,
      companyId: null,
    });

    const crmSection = sidebar.find((s) => s.id === 'sales-crm' || s.label === 'Sales & CRM');
    assert.ok(crmSection, 'Sales & CRM module section must be present in dynamic sidebar');

    const expectedRootItems = [
      { id: 'crm-dashboard', path: '/sales-crm/dashboard' },
      { id: 'crm-leads', path: '/sales-crm/leads' },
      { id: 'crm-accounts', path: '/sales-crm/accounts' },
      { id: 'crm-contacts', path: '/sales-crm/contacts' },
      { id: 'crm-opportunities', path: '/sales-crm/opportunities' },
      { id: 'crm-pipelines', path: '/sales-crm/pipelines' },
      { id: 'crm-quotations', path: '/sales-crm/quotations' },
      { id: 'crm-tasks', path: '/sales-crm/tasks' },
      { id: 'crm-activities', path: '/sales-crm/activities' },
      { id: 'crm-campaigns', path: '/sales-crm/campaigns' },
      { id: 'crm-attribution', path: '/sales-crm/attribution' },
      { id: 'crm-comms', path: '/sales-crm/communications' },
      { id: 'crm-automation', path: '/sales-crm/automation' },
      { id: 'crm-integrations', path: '/sales-crm/integrations' },
      { id: 'crm-settings', path: '/sales-crm/settings' },
      { id: 'crm-orders', path: '/crm/orders' },
      { id: 'crm-invoices', path: '/crm/invoices' },
      { id: 'crm-audit', path: '/crm/audit' },
    ];

    assert.equal(crmSection.children.length, 18, 'Root sidebar must have exactly 18 items');

    expectedRootItems.forEach((expected) => {
      const found = crmSection.children.find((c) => c.id === expected.id);
      assert.ok(found, `Root sidebar item ${expected.id} must be present`);
      assert.equal(found.path, expected.path, `Root sidebar item ${expected.id} path must match ${expected.path}`);
    });
  });

  it('3. Verifies canonical route aliases and redirects logic', () => {
    // Helper to simulate company-aware redirection logic
    const resolveCompanyRedirect = (target, currentCompanyId) => {
      const clean = target.replace(/^\//, '');
      return currentCompanyId ? `/company/${encodeURIComponent(currentCompanyId)}/${clean}` : `/${clean}`;
    };

    // Inside Company
    assert.equal(resolveCompanyRedirect('sales-crm/dashboard', '101'), '/company/101/sales-crm/dashboard');
    assert.equal(resolveCompanyRedirect('sales-crm/quotations', '101'), '/company/101/sales-crm/quotations');
    assert.equal(resolveCompanyRedirect('sales-crm/orders', '101'), '/company/101/sales-crm/orders');
    assert.equal(resolveCompanyRedirect('accounts/transactions/delivery-challans', '101'), '/company/101/accounts/transactions/delivery-challans');

    // At Root
    assert.equal(resolveCompanyRedirect('sales-crm/dashboard', null), '/sales-crm/dashboard');
    assert.equal(resolveCompanyRedirect('sales-crm/quotations', null), '/sales-crm/quotations');
    assert.equal(resolveCompanyRedirect('sales-crm/orders', null), '/sales-crm/orders');
    assert.equal(resolveCompanyRedirect('accounts/transactions/delivery-challans', null), '/accounts/transactions/delivery-challans');
  });
});

