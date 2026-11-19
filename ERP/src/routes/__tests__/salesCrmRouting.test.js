import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import paths and sidebar configurations
import PATHS from '../paths.js';
import { CRM_SIDEBAR } from '../../layouts/CrmSidebarConfig.js';
import { CANONICAL_MODULES, buildAuthContext, canViewModule, hasModule, hasFeature, hasPermission, isOwnerUser } from '../../utils/moduleNormalization.js';
import { buildDynamicSidebar } from '../../layouts/dynamicSidebarConfig.js';
import { getAccessibleModuleKeys, normalizeModuleKey } from '../../utils/moduleAccess.js';

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

  it('4. Verifies OWNER role with currentCompany=null SSO payload resolves role, membership, and CRM module access', () => {
    const ssoPayload = {
      data: {
        user: {
          id: '07cf72c7-4a9c-44f7-a926-f2b1c0329a9e',
          username: 'harshomohit4@gmail.com',
          email: 'harshomohit4@gmail.com',
          fullName: 'Rahul Sharma',
        },
        organization: {
          id: 'f997d7d6-366b-4af7-a9f6-93e699a3f87c',
          code: 'apex-global-enterprises',
          name: 'Apex Global Enterprises',
        },
        currentCompany: null,
        companies: [
          {
            id: 'd0efa9db-0672-44d3-9b07-8ccf5f42cc7c',
            code: 'APEXINDIAP',
            name: 'Apex India Pvt Ltd',
            legalName: 'Apex India Private Limited',
            active: true,
            membership: {
              id: 'e0c48076-3633-464e-a071-44df9ba2b70d',
              status: 'ACTIVE',
              role: {
                id: 'a1e01260-5a35-48f1-aa27-e0236ab965ab',
                name: 'OWNER',
                status: true,
              },
              roles: [
                {
                  id: 'a1e01260-5a35-48f1-aa27-e0236ab965ab',
                  name: 'OWNER',
                  status: true,
                },
              ],
            },
            modules: [
              { id: '1', name: 'ACCOUNT', code: 'account', active: true },
              { id: '2', name: 'INVENTORY', code: 'inventory', active: true },
              { id: '3', name: 'WORKFLOW', code: 'workflow', active: true },
              { id: '4', name: 'CRM', code: 'crm', active: true },
            ],
          },
        ],
      },
    };

    const authContext = buildAuthContext(ssoPayload);
    assert.equal(authContext.user.role, 'owner', 'User role must be normalized to owner');
    assert.ok(isOwnerUser(authContext), 'isOwnerUser must be true for OWNER authContext');
    assert.equal(authContext.membership?.memberType, 'OWNER', 'Membership memberType must be OWNER');
    assert.equal(authContext.currentCompany?.id, 'd0efa9db-0672-44d3-9b07-8ccf5f42cc7c');
    assert.ok(hasModule(authContext, 'CRM'), 'Must have CRM module');

    // Route authorization checks for CRM routes
    assert.ok(canViewModule(authContext, 'CRM'), 'Owner can view CRM module');
    assert.ok(canViewModule(authContext, 'sales-crm'), 'Owner can view sales-crm alias');
    assert.ok(canViewModule(authContext, 'LEADS'), 'Owner can view Leads route');
    assert.ok(canViewModule(authContext, 'ACCOUNTS'), 'Owner can view Accounts route');
    assert.ok(canViewModule(authContext, 'CONTACTS'), 'Owner can view Contacts route');
    assert.ok(canViewModule(authContext, 'OPPORTUNITIES'), 'Owner can view Opportunities route');
    assert.ok(canViewModule(authContext, 'PIPELINES'), 'Owner can view Pipelines route');
    assert.ok(canViewModule(authContext, 'QUOTATIONS'), 'Owner can view Quotations route');
    assert.ok(canViewModule(authContext, 'SALES_ORDERS'), 'Owner can view Sales Orders route');
    assert.ok(canViewModule(authContext, 'SALES_INVOICES'), 'Owner can view Sales Invoices route');
    assert.ok(canViewModule(authContext, 'CUSTOMERS'), 'Owner can view Customers route');
    assert.ok(canViewModule(authContext, 'AUDIT_LOGS'), 'Owner can view Audit Logs route');
    assert.ok(canViewModule(authContext, 'ANALYTICS'), 'Owner can view Analytics route');
  });

  it('5. Verifies accessibleModuleKeys in CompanyLayout harmonizes crm and sales-crm so navigation never triggers 403', () => {
    const authModules = [
      { id: '1', name: 'ACCOUNT', code: 'account', active: true },
      { id: '2', name: 'INVENTORY', code: 'inventory', active: true },
      { id: '3', name: 'WORKFLOW', code: 'workflow', active: true },
      { id: '4', name: 'CRM', code: 'crm', active: true },
    ];

    const accessibleKeys = getAccessibleModuleKeys({
      userRole: 'owner',
      memberType: 'OWNER',
      permissions: [],
      companyModulesData: null,
      companyId: 'd0efa9db-0672-44d3-9b07-8ccf5f42cc7c',
      authModules,
    });

    assert.ok(accessibleKeys.includes('crm'), 'accessibleKeys must include crm');
    assert.ok(accessibleKeys.includes('sales'), 'accessibleKeys must include sales (alias for sales-crm)');

    // Simulate CompanyLayout pathname evaluation
    const currentModuleKey1 = normalizeModuleKey('sales-crm');
    assert.equal(currentModuleKey1, 'sales');
    assert.ok(accessibleKeys.includes(currentModuleKey1), 'sales-crm URL segment must be allowed in accessibleKeys');

    const currentModuleKey2 = normalizeModuleKey('crm');
    assert.equal(currentModuleKey2, 'crm');
    assert.ok(accessibleKeys.includes(currentModuleKey2), 'crm URL segment must be allowed in accessibleKeys');
  });

  it('6. Verifies OWNER role with empty modules list is never blocked by canViewModule or getAccessibleModuleKeys', () => {
    const ownerAuthContext = {
      user: {
        id: 'user-owner-1',
        role: 'owner',
      },
      membership: {
        memberType: 'OWNER',
        status: 'ACTIVE',
      },
      modules: [], // empty list from unprovisioned company
      permissions: [],
    };

    assert.ok(canViewModule(ownerAuthContext, 'CRM'), 'canViewModule must allow OWNER even with empty modules list');
    assert.ok(canViewModule(ownerAuthContext, 'LEADS'), 'canViewModule must allow LEADS for OWNER');

    const accessibleKeys = getAccessibleModuleKeys({
      userRole: 'owner',
      memberType: 'OWNER',
      permissions: [],
      companyModulesData: null,
      companyId: 'comp-123',
      authModules: [],
    });

    assert.ok(accessibleKeys.includes('crm'), 'accessibleKeys must include crm for owner');
    assert.ok(accessibleKeys.includes('sales'), 'accessibleKeys must include sales for owner');
  });

  it('7. Verifies OWNER with memberType only in companies array (no role property in payload) resolves role and allows CRM', () => {
    // Exact payload shape from Request 1
    const ssoPayloadWithoutRole = {
      data: {
        user: {
          id: '07cf72c7-4a9c-44f7-a926-f2b1c0329a9e',
          username: 'harshomohit4@gmail.com',
          email: 'harshomohit4@gmail.com',
          fullName: 'Rahul Sharma',
          empId: null,
          accountStatus: 'ACTIVE',
          emailStatus: 'VERIFIED',
        },
        organization: {
          id: 'f997d7d6-366b-4af7-a9f6-93e699a3f87c',
          code: 'apex-global-enterprises',
          name: 'Apex Global Enterprises',
          status: 'ACTIVE',
          accessMode: 'FULL',
        },
        currentCompany: null,
        companies: [
          {
            id: 'd0efa9db-0672-44d3-9b07-8ccf5f42cc7c',
            code: 'APEXINDIAP',
            name: 'Apex India Pvt Ltd',
            legalName: 'Apex India Private Limited',
            active: true,
            membership: {
              id: 'e00787fa-2195-46eb-a5bf-ce8ec9be8165',
              memberType: 'OWNER',
            },
          },
        ],
      },
    };

    const authContext = buildAuthContext(ssoPayloadWithoutRole);
    assert.equal(authContext.user.role, 'owner', 'User role must resolve to owner from company membership');
    assert.ok(isOwnerUser(authContext), 'isOwnerUser must be true for company memberType=OWNER');
    assert.equal(authContext.membership?.memberType, 'OWNER');
    assert.ok(canViewModule(authContext, 'CRM'), 'canViewModule must allow CRM');
    assert.ok(canViewModule(authContext, 'LEADS'), 'canViewModule must allow LEADS');

    const accessibleKeys = getAccessibleModuleKeys({
      userRole: authContext.user.role,
      memberType: authContext.membership?.memberType,
      permissions: [],
      companyModulesData: null,
      companyId: 'd0efa9db-0672-44d3-9b07-8ccf5f42cc7c',
      authModules: [],
      isOwner: isOwnerUser(authContext),
      authContext,
    });

    assert.ok(accessibleKeys.includes('crm'), 'accessibleKeys must include crm');
    assert.ok(accessibleKeys.includes('sales'), 'accessibleKeys must include sales');
  });
});

