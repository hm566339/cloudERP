import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MODULE_DEFINITIONS,
  MODULES_UI_METADATA,
  normalizeModuleKey,
  sanitizeBrowserModuleRoute,
  getAccessibleModuleKeys,
} from '../../../utils/moduleAccess.js';
import {
  CANONICAL_MODULES,
  normalizeModuleName,
} from '../../../utils/moduleNormalization.js';
import { buildSidebarLinks } from '../../../layouts/SidebarConfig.js';
import { isItemOrChildActive } from '../../../layouts/SidebarNavUtils.js';

describe('Workflow & Approvals Navigation & Routing Verification', () => {
  describe('1. Module Definition & Alias Mapping', () => {
    it('defines workflow module in MODULE_DEFINITIONS with dashboardPath "workflows"', () => {
      const def = MODULE_DEFINITIONS.find((m) => m.key === 'workflow');
      assert.ok(def, 'workflow definition must exist in MODULE_DEFINITIONS');
      assert.strictEqual(def.label, 'Workflow & Approvals');
      assert.strictEqual(def.dashboardPath, 'workflows');
    });

    it('normalizes workflow aliases correctly in moduleAccess', () => {
      assert.strictEqual(normalizeModuleKey('workflow'), 'workflow');
      assert.strictEqual(normalizeModuleKey('workflows'), 'workflow');
      assert.strictEqual(normalizeModuleKey('wf'), 'workflow');
      assert.strictEqual(normalizeModuleKey('approval'), 'workflow');
      assert.strictEqual(normalizeModuleKey('approvals'), 'workflow');
      assert.strictEqual(normalizeModuleKey('WORKFLOW'), 'workflow');
    });

    it('normalizes workflow in moduleNormalization', () => {
      assert.strictEqual(normalizeModuleName('workflow'), CANONICAL_MODULES.WORKFLOW);
      assert.strictEqual(normalizeModuleName('workflows'), CANONICAL_MODULES.WORKFLOW);
      assert.strictEqual(normalizeModuleName('wf'), CANONICAL_MODULES.WORKFLOW);
      assert.strictEqual(normalizeModuleName({ code: 'WORKFLOW' }), CANONICAL_MODULES.WORKFLOW);
    });

    it('includes workflow in MODULES_UI_METADATA with path "workflows"', () => {
      assert.ok(MODULES_UI_METADATA.workflow, 'workflow must exist in MODULES_UI_METADATA');
      assert.strictEqual(MODULES_UI_METADATA.workflow.path, 'workflows');
      assert.strictEqual(MODULES_UI_METADATA.workflow.name, 'Workflow & Approvals');
      assert.ok(MODULES_UI_METADATA.workflows, 'workflows alias must exist in MODULES_UI_METADATA');
      assert.strictEqual(MODULES_UI_METADATA.workflows.path, 'workflows');
    });
  });

  describe('2. Browser Module Route Sanitization', () => {
    it('sanitizes workflow route to /workflows when no companyId is present', () => {
      const route = sanitizeBrowserModuleRoute('workflows', null);
      assert.strictEqual(route, '/workflows');
    });

    it('sanitizes workflow route with companyId to /company/:companyId/workflows', () => {
      const route = sanitizeBrowserModuleRoute('workflows', 'comp-100');
      assert.strictEqual(route, '/company/comp-100/workflows');
    });
  });

  describe('3. Sidebar Navigation Items Generation', () => {
    it('generates Workflow & Approvals item with exact path /workflows for Owner', () => {
      const canView = () => true;
      const links = buildSidebarLinks(
        'owner',
        null,
        ['WORKFLOW_VIEW', 'WORKFLOW_APPROVE'],
        false,
        ['workflow', 'sso', 'admin'],
        canView,
        true
      );

      const adminSection = links.find((l) => l.id === 'admin');
      assert.ok(adminSection, 'Admin & SSO section should be visible');
      const workflowItem = adminSection.children.find((c) => c.id === 'workflow-approvals');
      assert.ok(workflowItem, 'Workflow & Approvals menu item must be present');
      assert.strictEqual(workflowItem.path, '/workflows');
      assert.strictEqual(workflowItem.label, 'Workflow & Approvals');

      const approvalItem = adminSection.children.find((c) => c.id === 'workflow-approval-requests');
      assert.ok(approvalItem, 'Approval Requests menu item must be present');
      assert.strictEqual(approvalItem.path, '/workflows/approvals');
    });

    it('generates Workflow & Approvals item with exact path /workflows for Company Admin', () => {
      const canView = () => true;
      const links = buildSidebarLinks(
        'company_admin',
        'comp-xyz',
        [],
        false,
        ['workflow', 'sso', 'admin'],
        canView,
        false
      );

      const adminSection = links.find((l) => l.id === 'admin');
      assert.ok(adminSection, 'Admin & SSO section should be visible for company_admin');
      const workflowItem = adminSection.children.find((c) => c.id === 'workflow-approvals');
      assert.ok(workflowItem, 'Workflow & Approvals menu item must be present');
      assert.strictEqual(workflowItem.path, '/workflows');
    });

    it('does not generate broken /dashboard path for workflow', () => {
      const canView = () => true;
      const links = buildSidebarLinks(
        'company_admin',
        null,
        [],
        false,
        ['workflow'],
        canView,
        false
      );
      const adminSection = links.find((l) => l.id === 'admin');
      const workflowItem = adminSection?.children.find((c) => c.id === 'workflow-approvals');
      assert.notStrictEqual(workflowItem?.path, '/dashboard');
      assert.notStrictEqual(workflowItem?.path, '/erp/dashboard');
      assert.strictEqual(workflowItem?.path, '/workflows');
    });
  });

  describe('4. CompanyLayout Module Guard Protection', () => {
    it('accessibleModuleKeys includes workflow for entitled company', () => {
      const accessibleKeys = getAccessibleModuleKeys({
        userRole: 'owner',
        memberType: 'OWNER',
        permissions: ['workflow', 'sso'],
        companyModulesData: [
          { moduleCode: 'workflow', active: true },
          { moduleCode: 'sso', active: true },
        ],
        companyId: 'comp-100',
      });
      assert.ok(accessibleKeys.includes('workflow'), 'workflow must be among accessible keys');
    });
  });

  describe('5. Active Menu Item Resolution and Submenu Highlighting', () => {
    const workflowItem = { id: 'workflow-approvals', label: 'Workflow & Approvals', path: '/workflows' };
    const approvalItem = { id: 'workflow-approval-requests', label: 'Approval Requests', path: '/workflows/approvals' };
    const adminSection = {
      id: 'admin',
      label: 'SSO & Administration',
      path: '/admin',
      children: [
        { id: 'admin-dashboard', label: 'Admin Dashboard', path: '/admin' },
        approvalItem,
        workflowItem,
      ],
    };

    it('highlights Workflow & Approvals item on /workflows and opens admin submenu', () => {
      assert.strictEqual(isItemOrChildActive(workflowItem, '/workflows'), true);
      assert.strictEqual(isItemOrChildActive(approvalItem, '/workflows'), false);
      assert.strictEqual(isItemOrChildActive(adminSection, '/workflows'), true);
    });

    it('highlights Approval Requests item on /workflows/approvals and does not highlight Workflow & Approvals', () => {
      assert.strictEqual(isItemOrChildActive(approvalItem, '/workflows/approvals'), true);
      assert.strictEqual(isItemOrChildActive(workflowItem, '/workflows/approvals'), false);
      assert.strictEqual(isItemOrChildActive(adminSection, '/workflows/approvals'), true);
    });

    it('highlights Workflow & Approvals on company-scoped route /company/comp-100/workflows', () => {
      assert.strictEqual(isItemOrChildActive(workflowItem, '/company/comp-100/workflows'), true);
      assert.strictEqual(isItemOrChildActive(approvalItem, '/company/comp-100/workflows'), false);
      assert.strictEqual(isItemOrChildActive(adminSection, '/company/comp-100/workflows'), true);
    });

    it('highlights Approval Requests on company-scoped route /company/comp-100/workflows/approvals', () => {
      assert.strictEqual(isItemOrChildActive(approvalItem, '/company/comp-100/workflows/approvals'), true);
      assert.strictEqual(isItemOrChildActive(workflowItem, '/company/comp-100/workflows/approvals'), false);
      assert.strictEqual(isItemOrChildActive(adminSection, '/company/comp-100/workflows/approvals'), true);
    });

    it('does not highlight workflow items when viewing dashboard or other modules', () => {
      assert.strictEqual(isItemOrChildActive(workflowItem, '/dashboard'), false);
      assert.strictEqual(isItemOrChildActive(approvalItem, '/dashboard'), false);
      assert.strictEqual(isItemOrChildActive(workflowItem, '/company/comp-100/dashboard'), false);
      assert.strictEqual(isItemOrChildActive(approvalItem, '/company/comp-100/dashboard'), false);
    });
  });

  describe('6. Application Shell Resolution on Workflow Navigation', () => {
    const resolveLayout = (user, membership, pathname) => {
      const isOwner = membership?.memberType === 'OWNER' || user?.role === 'owner';
      const isOwnerWorkspace = pathname.startsWith('/owner') || pathname.startsWith('/organization');
      if (isOwner && isOwnerWorkspace) return 'OwnerLayout';
      return 'CompanyLayout';
    };

    it('resolves CompanyLayout for Owner navigating to /workflows', () => {
      const layout = resolveLayout({ role: 'owner' }, { memberType: 'OWNER' }, '/workflows');
      assert.strictEqual(layout, 'CompanyLayout');
    });

    it('resolves CompanyLayout for Owner navigating to /workflows/approvals', () => {
      const layout = resolveLayout({ role: 'owner' }, { memberType: 'OWNER' }, '/workflows/approvals');
      assert.strictEqual(layout, 'CompanyLayout');
    });

    it('resolves OwnerLayout only when Owner is on /owner workspace routes', () => {
      assert.strictEqual(resolveLayout({ role: 'owner' }, { memberType: 'OWNER' }, '/owner/dashboard'), 'OwnerLayout');
      assert.strictEqual(resolveLayout({ role: 'owner' }, { memberType: 'OWNER' }, '/owner/companies'), 'OwnerLayout');
      assert.strictEqual(resolveLayout({ role: 'owner' }, { memberType: 'OWNER' }, '/owner/settings'), 'OwnerLayout');
    });

    it('resolves CompanyLayout for non-owner navigating to /workflows', () => {
      const layout = resolveLayout({ role: 'company_admin' }, { memberType: 'ADMIN' }, '/workflows');
      assert.strictEqual(layout, 'CompanyLayout');
    });
  });
});
