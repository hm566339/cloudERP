import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeModuleName,
  CANONICAL_MODULES,
  SSO_FEATURE_CODES,
  getEntitledModules,
  canViewModule,
} from '../../../utils/moduleNormalization.js';
import {
  normalizeModuleKey,
  getAccessibleModuleKeys,
  sanitizeBrowserModuleRoute,
  getUnifiedNavigationModules,
} from '../../../utils/moduleAccess.js';
import { buildSidebarLinks } from '../../../layouts/SidebarConfig.js';
import { getOwnerSidebarNavGroups } from '../../../layouts/ownerSidebarConfig.js';

describe('Dynamic SSO Module Visibility for Company Owner (Production-Ready Tests)', () => {

  // 1. Canonical module normalization maps SSO module payloads and feature codes correctly
  it('1. Canonical module normalization maps SSO module payloads and feature codes correctly', () => {
    assert.strictEqual(normalizeModuleName('sso'), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName('SSO'), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName('auth'), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName('admin'), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName('portalaccess'), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName({ code: 'sso' }), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleName({ name: 'SSO & Administration' }), CANONICAL_MODULES.SSO);
    assert.strictEqual(normalizeModuleKey('sso'), 'sso');
    assert.strictEqual(normalizeModuleKey('auth'), 'sso');
    assert.strictEqual(normalizeModuleKey('portalaccess'), 'sso');

    assert.ok(SSO_FEATURE_CODES.includes('AUTH'));
    assert.ok(SSO_FEATURE_CODES.includes('USER'));
    assert.ok(SSO_FEATURE_CODES.includes('ROLE'));
    assert.ok(SSO_FEATURE_CODES.includes('PERMISSION'));
    assert.ok(SSO_FEATURE_CODES.includes('FEATURE'));
    assert.ok(SSO_FEATURE_CODES.includes('COMPANY'));
    assert.ok(SSO_FEATURE_CODES.includes('SESSION'));
    assert.ok(SSO_FEATURE_CODES.includes('PORTAL_ACCESS'));
    assert.ok(SSO_FEATURE_CODES.includes('BILLING'));
  });

  // 2. Owner session with active SSO module surfaces SSO in accessible module keys
  it('2. Owner session with active SSO module surfaces SSO in accessible module keys', () => {
    const ownerAuthModules = [
      { id: 'mod-sso', code: 'sso', name: 'SSO & Identity', active: true, serviceHost: 'http://auth-service:8090' },
      { id: 'mod-acc', code: 'account', name: 'Finance & Accounts', active: true },
    ];

    const accessible = getAccessibleModuleKeys({
      userRole: 'owner',
      memberType: 'OWNER',
      permissions: ['all'],
      companyModulesData: null,
      companyId: 'comp-123',
      authModules: ownerAuthModules,
    });

    assert.ok(accessible.includes('sso'), 'sso should be in accessible module keys for Owner');
    assert.ok(accessible.includes('finance'), 'finance should be in accessible module keys');
  });

  // 3. Owner session with SSO features/permissions resolves SSO navigation items correctly
  it('3. Owner session with SSO features/permissions resolves SSO navigation items correctly', () => {
    const authContext = {
      user: { id: 'user-owner', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'sso', canonical: 'SSO', active: true },
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [
        { featureCode: 'USER', active: true },
        { featureCode: 'ROLE', active: true },
        { featureCode: 'PORTAL_ACCESS', active: true },
      ],
      permissions: [
        { featureCode: 'USER', action: 'READ', allowed: true, active: true },
        { featureCode: 'ROLE', action: 'READ', allowed: true, active: true },
        { featureCode: 'PORTAL_ACCESS', action: 'READ', allowed: true, active: true },
      ],
    };

    const entitled = getEntitledModules(authContext);
    assert.ok(entitled.includes('SSO'), 'Entitled modules should include SSO');
    assert.ok(canViewModule(authContext, 'SSO'), 'Owner should canViewModule SSO');
    assert.ok(canViewModule(authContext, 'USER'), 'Owner should canViewModule USER');
    assert.ok(canViewModule(authContext, 'ROLE'), 'Owner should canViewModule ROLE');
    assert.ok(canViewModule(authContext, 'PORTAL_ACCESS'), 'Owner should canViewModule PORTAL_ACCESS');

    const ownerNavGroups = getOwnerSidebarNavGroups({
      entitledModules: entitled,
      activeCompanyId: 'comp-123',
    });

    const modulesGroup = ownerNavGroups.find((g) => g.id === 'modules-group');
    assert.ok(modulesGroup, 'modules-group should exist in Owner nav');
    const ssoItem = modulesGroup.items.find((i) => i.id === 'sso');
    assert.ok(ssoItem, 'sso item should exist in Owner nav items');
    assert.strictEqual(ssoItem.isEntitled, true, 'sso item should be entitled');
    assert.strictEqual(ssoItem.path, '/company/comp-123/admin', 'sso item path should be /company/comp-123/admin');
  });

  // 4. Tenant user without SSO module/permissions does not see SSO navigation
  it('4. Tenant user without SSO module/permissions does not see SSO navigation', () => {
    const regularUserContext = {
      user: { id: 'emp-1', role: 'employee' },
      membership: { memberType: 'MEMBER' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [
        { featureCode: 'DASHBOARD', active: true },
      ],
      permissions: [
        { featureCode: 'DASHBOARD', action: 'READ', allowed: true, active: true },
      ],
    };

    const entitled = getEntitledModules(regularUserContext);
    assert.strictEqual(entitled.includes('SSO'), false, 'SSO should not be entitled for regular user');
    assert.strictEqual(canViewModule(regularUserContext, 'SSO'), false, 'canViewModule SSO should be false');

    const accessible = getAccessibleModuleKeys({
      userRole: 'employee',
      memberType: 'MEMBER',
      permissions: ['finance'],
      companyModulesData: null,
      companyId: 'comp-123',
      authModules: regularUserContext.modules,
    });
    assert.strictEqual(accessible.includes('sso'), false, 'accessible module keys should not contain sso');

    const links = buildSidebarLinks(
      'employee',
      'comp-123',
      regularUserContext.permissions,
      false,
      accessible,
      (mod) => canViewModule(regularUserContext, mod),
      false
    );
    const adminLink = links.find((l) => l.id === 'admin');
    assert.strictEqual(adminLink, undefined, 'Sidebar links should not include admin/sso for employee');
  });

  // 5. Inactive SSO module is hidden from non-superadmin navigation
  it('5. Inactive SSO module is hidden from non-superadmin navigation', () => {
    const inactiveSsoContext = {
      user: { id: 'admin-1', role: 'company_admin' },
      membership: { memberType: 'ADMIN' },
      accessMode: 'FULL',
      modules: [
        { code: 'sso', canonical: 'SSO', active: false },
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
    };

    const entitled = getEntitledModules(inactiveSsoContext);
    assert.strictEqual(entitled.includes('SSO'), false, 'Inactive SSO module should not be in entitled modules');

    const accessible = getAccessibleModuleKeys({
      userRole: 'company_admin',
      memberType: 'ADMIN',
      permissions: ['finance'],
      companyModulesData: null,
      companyId: 'comp-123',
      authModules: inactiveSsoContext.modules,
    });
    assert.strictEqual(accessible.includes('sso'), false, 'Inactive SSO module should not be in accessible keys');
  });

  // 6. Module navigation resolves browser route /company/:companyId/admin or /admin rather than backend host
  it('6. Module navigation resolves browser route /company/:companyId/admin or /admin rather than backend host', () => {
    const dockerBackendHost = 'http://auth-service:8090';
    const localhostBackendHost = 'http://localhost:8090/sso';

    const sanitizedWithCompany = sanitizeBrowserModuleRoute(dockerBackendHost, 'comp-789');
    assert.strictEqual(sanitizedWithCompany, '/company/comp-789/admin', 'Should sanitize docker URL to /company/:companyId/admin');

    const sanitizedWithoutCompany = sanitizeBrowserModuleRoute(dockerBackendHost, null);
    assert.strictEqual(sanitizedWithoutCompany, '/admin', 'Should sanitize docker URL to /admin without company');

    const sanitizedLocalhost = sanitizeBrowserModuleRoute(localhostBackendHost, 'comp-789');
    assert.strictEqual(sanitizedLocalhost, '/company/comp-789/admin', 'Should sanitize localhost URL to /company/:companyId/admin');

    const regularModuleRoute = sanitizeBrowserModuleRoute('inventory', 'comp-789');
    assert.strictEqual(regularModuleRoute, '/company/comp-789/inventory', 'Regular module route should format cleanly');
  });

  // 7. Modules landing page renders SSO card when SSO is entitled
  it('7. Modules landing page renders SSO card when SSO is entitled via getUnifiedNavigationModules', () => {
    const authContext = {
      user: { id: 'owner-1', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'sso', name: 'SSO & Identity', serviceHost: 'http://auth-service:8090', active: true },
        { code: 'accounts', name: 'Finance & Accounts', active: true },
      ],
    };

    const unified = getUnifiedNavigationModules({
      authContext,
      companyModulesData: null,
      companyId: 'comp-xyz',
      userRole: 'owner',
    });

    const ssoModule = unified.find((m) => m.key === 'sso');
    assert.ok(ssoModule, 'Unified modules must contain sso');
    assert.strictEqual(ssoModule.active, true, 'sso module must be active');
    assert.strictEqual(ssoModule.browserRoute, '/company/comp-xyz/admin', 'sso browser route must point to /company/:companyId/admin');
    assert.strictEqual(ssoModule.path, 'admin', 'sso path must be admin');
  });

  // 8. Sidebar renders SSO section and granular permitted sub-items for Owner
  it('8. Sidebar renders SSO section and granular permitted sub-items for Owner', () => {
    const authContext = {
      user: { id: 'owner-1', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'sso', canonical: 'SSO', active: true },
        { code: 'account', canonical: 'ACCOUNT', active: true },
      ],
      features: [
        { featureCode: 'USER', active: true },
        { featureCode: 'ROLE', active: true },
        { featureCode: 'PORTAL_ACCESS', active: true },
        { featureCode: 'SESSION', active: true },
      ],
      permissions: [
        { featureCode: 'USER', action: 'READ', allowed: true, active: true },
        { featureCode: 'ROLE', action: 'READ', allowed: true, active: true },
        { featureCode: 'PORTAL_ACCESS', action: 'READ', allowed: true, active: true },
        { featureCode: 'SESSION', action: 'READ', allowed: true, active: true },
      ],
    };

    const accessible = ['finance', 'sso'];
    const links = buildSidebarLinks(
      'owner',
      'comp-xyz',
      authContext.permissions,
      false,
      accessible,
      (mod) => canViewModule(authContext, mod),
      true
    );

    const ssoSection = links.find((l) => l.id === 'admin');
    assert.ok(ssoSection, 'SSO section must be present in sidebar links for Owner');
    assert.strictEqual(ssoSection.label, 'SSO & Administration');
    assert.strictEqual(ssoSection.path, '/company/comp-xyz/admin');

    const childrenIds = ssoSection.children.map((c) => c.id);
    assert.ok(childrenIds.includes('admin-dashboard'), 'Admin dashboard child must be present');
    assert.ok(childrenIds.includes('users'), 'Users child must be present');
    assert.ok(childrenIds.includes('sessions'), 'Sessions child must be present');
    // Role Management and Portal Access have been moved to Organization Management
    assert.strictEqual(childrenIds.includes('roles'), false, 'Roles child must not be in SSO sidebar');
    assert.strictEqual(childrenIds.includes('portal-access'), false, 'Portal access child must not be in SSO sidebar');
  });

  // 9. Direct browser navigation to SSO route succeeds for authorized Owner
  it('9. Direct browser navigation to SSO route succeeds for authorized Owner', () => {
    const authContext = {
      user: { id: 'owner-1', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'sso', canonical: 'SSO', active: true },
      ],
    };

    assert.strictEqual(canViewModule(authContext, 'SSO'), true, 'canViewModule SSO should be true');
    assert.strictEqual(canViewModule(authContext, 'admin'), true, 'canViewModule admin alias should be true');
    assert.strictEqual(canViewModule(authContext, 'sso'), true, 'canViewModule sso alias should be true');
  });

  // 10. Existing accounts/inventory/sales navigation remains intact
  it('10. Existing accounts/inventory/sales navigation remains intact', () => {
    const multiModuleContext = {
      user: { id: 'owner-1', role: 'owner' },
      membership: { memberType: 'OWNER' },
      accessMode: 'FULL',
      modules: [
        { code: 'account', canonical: 'ACCOUNT', active: true },
        { code: 'inventory', canonical: 'INVENTORY', active: true },
        { code: 'crm', canonical: 'CRM', active: true },
        { code: 'sso', canonical: 'SSO', active: true },
      ],
    };

    const entitled = getEntitledModules(multiModuleContext);
    assert.ok(entitled.includes('ACCOUNT'), 'ACCOUNT should be entitled');
    assert.ok(entitled.includes('INVENTORY'), 'INVENTORY should be entitled');
    assert.ok(entitled.includes('CRM'), 'CRM should be entitled');
    assert.ok(entitled.includes('SSO'), 'SSO should be entitled');

    const accessible = getAccessibleModuleKeys({
      userRole: 'owner',
      memberType: 'OWNER',
      permissions: ['all'],
      companyModulesData: null,
      companyId: 'comp-123',
      authModules: multiModuleContext.modules,
    });
    assert.ok(accessible.includes('finance'), 'finance should be accessible');
    assert.ok(accessible.includes('inventory'), 'inventory should be accessible');
    assert.ok(accessible.includes('crm') || accessible.includes('sales'), 'crm or sales should be accessible');
    assert.ok(accessible.includes('sso'), 'sso should be accessible');
  });

});
