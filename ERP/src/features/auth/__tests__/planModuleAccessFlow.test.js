import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeModuleName,
  buildAuthContext,
  getEntitledModules,
  hasModule,
  hasPermission,
  canViewModule,
  CANONICAL_MODULES,
} from '../../../utils/moduleNormalization.js';
import { getOwnerSidebarNavGroups } from '../../../layouts/ownerSidebarConfig.js';

describe('Plan → Module Access Flow & Multi-Company Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Trial Plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 1: Trial Plan entitles ACCOUNT, CRM, INVENTORY, WORKFLOW', () => {
    const rawSsoMe = {
      user: { id: 'user-trial-owner', role: 'owner', email: 'owner@trial.com' },
      organization: { id: 'org-1', code: 'TRIAL_ORG' },
      currentCompany: { id: 'comp-1', code: 'TRIAL_CO', name: 'Trial Company' },
      subscription: { planCode: '30_DAY_FREE_TRIAL', status: 'TRIALING', trialing: true },
      modules: [
        { id: 'm1', name: 'ACCOUNT', code: 'account', active: true },
        { id: 'm2', name: 'CRM', code: 'crm', active: true },
        { id: 'm3', name: 'INVENTORY', code: 'inventory', active: true },
        { id: 'm4', name: 'WORKFLOW', code: 'workflow', active: true },
      ],
      features: [
        { featureCode: 'GENERAL_LEDGER', moduleName: 'ACCOUNT', active: true },
        { featureCode: 'PRODUCTS', moduleName: 'INVENTORY', active: true },
        { featureCode: 'LEADS', moduleName: 'CRM', active: true },
        { featureCode: 'APPROVALS', moduleName: 'WORKFLOW', active: true },
      ],
      permissions: [
        { featureCode: 'GENERAL_LEDGER', action: 'READ', moduleName: 'ACCOUNT', allowed: true },
        { featureCode: 'PRODUCTS', action: 'READ', moduleName: 'INVENTORY', allowed: true },
        { featureCode: 'LEADS', action: 'READ', moduleName: 'CRM', allowed: true },
        { featureCode: 'APPROVALS', action: 'READ', moduleName: 'WORKFLOW', allowed: true },
      ],
    };

    const authCtx = buildAuthContext(rawSsoMe);
    const entitled = getEntitledModules(authCtx);

    assert.strictEqual(entitled.length, 4);
    assert.ok(entitled.includes(CANONICAL_MODULES.ACCOUNT));
    assert.ok(entitled.includes(CANONICAL_MODULES.CRM));
    assert.ok(entitled.includes(CANONICAL_MODULES.INVENTORY));
    assert.ok(entitled.includes(CANONICAL_MODULES.WORKFLOW));

    // Route guards
    assert.strictEqual(canViewModule(authCtx, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authCtx, 'CRM'), true);
    assert.strictEqual(canViewModule(authCtx, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(authCtx, 'WORKFLOW'), true);

    // Sidebar navigation groups
    const navGroups = getOwnerSidebarNavGroups({
      entitledModules: entitled,
      activeCompanyId: 'comp-1',
      companiesCount: 1,
      isTrial: true,
      isActive: true,
    });
    const moduleItems = navGroups.find(g => g.id === 'modules-group')?.items || [];
    const financeItem = moduleItems.find(i => i.id === 'finance');
    const inventoryItem = moduleItems.find(i => i.id === 'inventory');
    const salesItem = moduleItems.find(i => i.id === 'sales');
    const workflowItem = moduleItems.find(i => i.id === 'workflow');

    assert.strictEqual(financeItem?.isEntitled, true);
    assert.strictEqual(inventoryItem?.isEntitled, true);
    assert.strictEqual(salesItem?.isEntitled, true);
    assert.strictEqual(workflowItem?.isEntitled, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Basic Plan contains ACCOUNT only
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 2: Basic Plan entitles ACCOUNT only; CRM, INVENTORY, WORKFLOW blocked', () => {
    const rawSsoMe = {
      user: { id: 'user-basic-owner', role: 'owner', email: 'owner@basic.com' },
      organization: { id: 'org-2', code: 'BASIC_ORG' },
      currentCompany: { id: 'comp-2', code: 'BASIC_CO', name: 'Basic Company' },
      subscription: { planCode: 'BASIC', status: 'ACTIVE' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', code: 'account', active: true },
      ],
      features: [
        { featureCode: 'GENERAL_LEDGER', moduleName: 'ACCOUNT', active: true },
      ],
      permissions: [
        { featureCode: 'GENERAL_LEDGER', action: 'READ', moduleName: 'ACCOUNT', allowed: true },
      ],
    };

    const authCtx = buildAuthContext(rawSsoMe);
    const entitled = getEntitledModules(authCtx);

    assert.deepStrictEqual(entitled, [CANONICAL_MODULES.ACCOUNT]);

    // Allowed module
    assert.strictEqual(canViewModule(authCtx, 'ACCOUNT'), true);
    assert.strictEqual(hasModule(authCtx, 'ACCOUNT'), true);

    // Blocked modules (route guards)
    assert.strictEqual(canViewModule(authCtx, 'INVENTORY'), false);
    assert.strictEqual(canViewModule(authCtx, 'CRM'), false);
    assert.strictEqual(canViewModule(authCtx, 'WORKFLOW'), false);
    assert.strictEqual(hasModule(authCtx, 'INVENTORY'), false);
    assert.strictEqual(hasModule(authCtx, 'CRM'), false);
    assert.strictEqual(hasModule(authCtx, 'WORKFLOW'), false);

    // Sidebar: only finance entitled
    const navGroups = getOwnerSidebarNavGroups({
      entitledModules: entitled,
      activeCompanyId: 'comp-2',
      companiesCount: 1,
      isActive: true,
    });
    const moduleItems = navGroups.find(g => g.id === 'modules-group')?.items || [];
    assert.strictEqual(moduleItems.find(i => i.id === 'finance')?.isEntitled, true);
    assert.strictEqual(moduleItems.find(i => i.id === 'inventory')?.isEntitled, false);
    assert.strictEqual(moduleItems.find(i => i.id === 'sales')?.isEntitled, false);
    assert.strictEqual(moduleItems.find(i => i.id === 'workflow')?.isEntitled, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Pro Plan contains ACCOUNT, INVENTORY, WORKFLOW (No CRM)
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 3: Pro Plan entitles ACCOUNT, INVENTORY, WORKFLOW; CRM blocked', () => {
    const rawSsoMe = {
      user: { id: 'user-pro-owner', role: 'owner', email: 'owner@pro.com' },
      organization: { id: 'org-3', code: 'PRO_ORG' },
      currentCompany: { id: 'comp-3', code: 'PRO_CO', name: 'Pro Company' },
      subscription: { planCode: 'PRO', status: 'ACTIVE' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', code: 'account', active: true },
        { id: 'm3', name: 'INVENTORY', code: 'inventory', active: true },
        { id: 'm4', name: 'WORKFLOW', code: 'workflow', active: true },
      ],
      features: [
        { featureCode: 'GENERAL_LEDGER', moduleName: 'ACCOUNT', active: true },
        { featureCode: 'PRODUCTS', moduleName: 'INVENTORY', active: true },
      ],
      permissions: [
        { featureCode: 'GENERAL_LEDGER', action: 'READ', moduleName: 'ACCOUNT', allowed: true },
        { featureCode: 'PRODUCTS', action: 'READ', moduleName: 'INVENTORY', allowed: true },
      ],
    };

    const authCtx = buildAuthContext(rawSsoMe);
    const entitled = getEntitledModules(authCtx);

    assert.strictEqual(entitled.length, 3);
    assert.ok(entitled.includes(CANONICAL_MODULES.ACCOUNT));
    assert.ok(entitled.includes(CANONICAL_MODULES.INVENTORY));
    assert.ok(entitled.includes(CANONICAL_MODULES.WORKFLOW));
    assert.strictEqual(entitled.includes(CANONICAL_MODULES.CRM), false);

    // Route guards
    assert.strictEqual(canViewModule(authCtx, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authCtx, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(authCtx, 'WORKFLOW'), true);
    assert.strictEqual(canViewModule(authCtx, 'CRM'), false);

    // Sidebar: CRM not entitled
    const navGroups = getOwnerSidebarNavGroups({
      entitledModules: entitled,
      activeCompanyId: 'comp-3',
      companiesCount: 1,
      isActive: true,
    });
    const moduleItems = navGroups.find(g => g.id === 'modules-group')?.items || [];
    assert.strictEqual(moduleItems.find(i => i.id === 'finance')?.isEntitled, true);
    assert.strictEqual(moduleItems.find(i => i.id === 'inventory')?.isEntitled, true);
    assert.strictEqual(moduleItems.find(i => i.id === 'sales')?.isEntitled, false);
    assert.strictEqual(moduleItems.find(i => i.id === 'workflow')?.isEntitled, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Enterprise Plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 4: Enterprise Plan entitles ACCOUNT, CRM, INVENTORY, WORKFLOW', () => {
    const rawSsoMe = {
      user: { id: 'user-ent-owner', role: 'owner', email: 'owner@ent.com' },
      organization: { id: 'org-4', code: 'ENT_ORG' },
      currentCompany: { id: 'comp-4', code: 'ENT_CO', name: 'Enterprise Co' },
      subscription: { planCode: 'ENTERPRISE', status: 'ACTIVE' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', code: 'account', active: true },
        { id: 'm2', name: 'CRM', code: 'crm', active: true },
        { id: 'm3', name: 'INVENTORY', code: 'inventory', active: true },
        { id: 'm4', name: 'WORKFLOW', code: 'workflow', active: true },
      ],
      features: [],
      permissions: [],
    };

    const authCtx = buildAuthContext(rawSsoMe);
    const entitled = getEntitledModules(authCtx);

    assert.strictEqual(entitled.length, 4);
    assert.ok(entitled.includes(CANONICAL_MODULES.ACCOUNT));
    assert.ok(entitled.includes(CANONICAL_MODULES.CRM));
    assert.ok(entitled.includes(CANONICAL_MODULES.INVENTORY));
    assert.ok(entitled.includes(CANONICAL_MODULES.WORKFLOW));

    // Route guards
    assert.strictEqual(canViewModule(authCtx, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authCtx, 'CRM'), true);
    assert.strictEqual(canViewModule(authCtx, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(authCtx, 'WORKFLOW'), true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Owner Multi-Company Switching Updates Modules Dynamically
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 5: Multi-Company Switching Company A (Basic) → Company B (Enterprise) updates modules', () => {
    // 1. Company A selected (Basic -> Account only)
    const companyAContext = buildAuthContext({
      user: { id: 'owner-multi', role: 'owner' },
      currentCompany: { id: 'comp-A', code: 'COMP_A', name: 'Company A' },
      subscription: { planCode: 'BASIC', status: 'ACTIVE' },
      modules: [{ id: 'm1', name: 'ACCOUNT', active: true }],
    });
    const entitledA = getEntitledModules(companyAContext);
    assert.deepStrictEqual(entitledA, [CANONICAL_MODULES.ACCOUNT]);
    assert.strictEqual(canViewModule(companyAContext, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(companyAContext, 'INVENTORY'), false);
    assert.strictEqual(canViewModule(companyAContext, 'CRM'), false);

    // Sidebar for Company A
    const sidebarA = getOwnerSidebarNavGroups({ entitledModules: entitledA, activeCompanyId: 'comp-A' });
    const itemsA = sidebarA.find(g => g.id === 'modules-group')?.items || [];
    assert.strictEqual(itemsA.find(i => i.id === 'finance')?.isEntitled, true);
    assert.strictEqual(itemsA.find(i => i.id === 'inventory')?.isEntitled, false);
    assert.strictEqual(itemsA.find(i => i.id === 'sales')?.isEntitled, false);
    assert.strictEqual(itemsA.find(i => i.id === 'workflow')?.isEntitled, false);

    // 2. Company B selected (Enterprise -> Account + CRM + Inventory + Workflow)
    const companyBContext = buildAuthContext({
      user: { id: 'owner-multi', role: 'owner' },
      currentCompany: { id: 'comp-B', code: 'COMP_B', name: 'Company B' },
      subscription: { planCode: 'ENTERPRISE', status: 'ACTIVE' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', active: true },
        { id: 'm2', name: 'CRM', active: true },
        { id: 'm3', name: 'INVENTORY', active: true },
        { id: 'm4', name: 'WORKFLOW', active: true },
      ],
    });
    const entitledB = getEntitledModules(companyBContext);
    assert.strictEqual(entitledB.length, 4);
    assert.ok(entitledB.includes(CANONICAL_MODULES.ACCOUNT));
    assert.ok(entitledB.includes(CANONICAL_MODULES.CRM));
    assert.ok(entitledB.includes(CANONICAL_MODULES.INVENTORY));
    assert.ok(entitledB.includes(CANONICAL_MODULES.WORKFLOW));

    // Route guards update immediately
    assert.strictEqual(canViewModule(companyBContext, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(companyBContext, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(companyBContext, 'CRM'), true);
    assert.strictEqual(canViewModule(companyBContext, 'WORKFLOW'), true);

    // Sidebar for Company B
    const sidebarB = getOwnerSidebarNavGroups({ entitledModules: entitledB, activeCompanyId: 'comp-B' });
    const itemsB = sidebarB.find(g => g.id === 'modules-group')?.items || [];
    assert.strictEqual(itemsB.find(i => i.id === 'finance')?.isEntitled, true);
    assert.strictEqual(itemsB.find(i => i.id === 'inventory')?.isEntitled, true);
    assert.strictEqual(itemsB.find(i => i.id === 'sales')?.isEntitled, true);
    assert.strictEqual(itemsB.find(i => i.id === 'workflow')?.isEntitled, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Inactive plan module is NOT exposed
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 6: Inactive module (active: false) is excluded from entitled modules', () => {
    const authCtx = buildAuthContext({
      user: { id: 'user-sub', role: 'owner' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', active: true },
        { id: 'm2', name: 'CRM', active: false }, // inactive module!
        { id: 'm3', name: 'INVENTORY', active: true },
      ],
    });

    const entitled = getEntitledModules(authCtx);
    assert.strictEqual(entitled.includes(CANONICAL_MODULES.ACCOUNT), true);
    assert.strictEqual(entitled.includes(CANONICAL_MODULES.INVENTORY), true);
    assert.strictEqual(entitled.includes(CANONICAL_MODULES.CRM), false);

    assert.strictEqual(canViewModule(authCtx, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(authCtx, 'INVENTORY'), true);
    assert.strictEqual(canViewModule(authCtx, 'CRM'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: RBAC Preservation - Plan module does not bypass permissions
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 7: Plan module access does not grant unassigned role permissions', () => {
    const employeeCtx = buildAuthContext({
      user: { id: 'emp-1', role: 'viewer' },
      currentCompany: { id: 'comp-1' },
      modules: [
        { id: 'm1', name: 'ACCOUNT', active: true },
        { id: 'm2', name: 'CRM', active: true },
      ],
      features: [
        { featureCode: 'CUSTOMERS', moduleName: 'CRM', active: true },
      ],
      permissions: [
        { featureCode: 'CUSTOMERS', action: 'READ', moduleName: 'CRM', allowed: true, active: true },
      ],
    });

    // Employee has CRM module
    assert.strictEqual(canViewModule(employeeCtx, 'CRM'), true);

    // Employee has READ on CUSTOMERS
    assert.strictEqual(hasPermission(employeeCtx, 'CUSTOMERS', 'READ', 'CRM'), true);

    // Employee does NOT have WRITE / DELETE on CUSTOMERS
    assert.strictEqual(hasPermission(employeeCtx, 'CUSTOMERS', 'WRITE', 'CRM'), false);
    assert.strictEqual(hasPermission(employeeCtx, 'CUSTOMERS', 'DELETE', 'CRM'), false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: SystemAdmin access preserved across tenant boundaries
  // ──────────────────────────────────────────────────────────────────────────
  it('SCENARIO 8: SystemAdmin preserves system access regardless of plan modules', () => {
    const adminCtx = buildAuthContext({
      user: { id: 'sys-admin', role: 'super_admin' },
      modules: [], // empty tenant modules
    });

    const entitled = getEntitledModules(adminCtx);
    assert.ok(entitled.includes(CANONICAL_MODULES.ACCOUNT));
    assert.ok(entitled.includes(CANONICAL_MODULES.INVENTORY));
    assert.ok(entitled.includes(CANONICAL_MODULES.CRM));
    assert.ok(entitled.includes(CANONICAL_MODULES.WORKFLOW));

    assert.strictEqual(canViewModule(adminCtx, 'ACCOUNT'), true);
    assert.strictEqual(canViewModule(adminCtx, 'CRM'), true);
    assert.strictEqual(canViewModule(adminCtx, 'WORKFLOW'), true);
  });
});
